import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  Shield,
  Database,
  FilePlus2,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

import {
  setDiscount,
  setPaymentMethods,
  setAdditionalNotes,
  finalizePayment,
  setProcessing,
  clearDraftAfterFinalization,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectEffectiveBillingStatus,
  selectIsProcessing,
  selectBillingData,
  selectBilling,
  selectBackendBillingMeta,
  selectBackendBillingData,
  selectCurrentStep,
  setStep,
} from './billingSlice';

import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
  type RenderableChargeItem,
} from './billing-types';

import {
  selectActiveVisitId,
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';

import { useSubmitBilling } from '../../../api/billable-items/BillableItemsQueries';
import { useGetBillingByVisitForFacility } from '../../../api/billing-review/BillingReviewQueries';
import { useGetFacilityIdentity } from '../../../api/facility/FacilityQueries';

import type { BillingSubmissionPayload } from '../../../api/billable-items/BillingItemsTypes';
import {
  PaymentStatus,
  DiscountType,
  type Tax,
  type PaymentMethod,
} from '../../../api/billing-review/BillingReviewTypes';
import type { BillingReviewItem } from '../../../api/billing-review/BillingReviewTypes';

import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface ReceiptTransactionShape {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: RenderableChargeItem[];
  billing_data: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxTotal: number;
    grandTotal: number;
    totalPaid: number;
    balance: number;
    taxes: Tax[];
  };
  payment_methods: PaymentMethod[];
  additional_notes?: string;
  facilityData?: any;
  payment_status?: PaymentStatus | string;
  billing_status?: string;
  attending_staff_display?: string | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  [key: string]: any;
}

interface DerivedFinancials {
  status: PaymentStatus;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: 'percentage' | 'fixed' | null;
  taxTotal: number;
  totalPaidFromMethods: number;
  cashTendered: number;
  changeAmount: number;
  hasCashPayment: boolean;
  nonCashTotal: number;
}

interface CashBreakdown {
  tendered: number;
  change: number;
  netCash: number;
}

interface NormalizedBillingView {
  transaction: ReceiptTransactionShape;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  billingData: ReceiptTransactionShape['billing_data'];
}

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
  visitId?: number;
  patientId?: number;
}

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, n));

const onlyDigits = (v: string) => v.replace(/[^\d]/g, '');

const safeArray = <T,>(arr: T[] | undefined | null): T[] => arr ?? [];

const safeNumber = (val: unknown, defaultValue = 0): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : defaultValue;
};

const roundCurrency = (value: number) => Math.round((safeNumber(value) + Number.EPSILON) * 100) / 100;

const firstValidNumber = (...values: unknown[]) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const mergeTaxes = (
  existing: Array<{ name: string; rate: number; amount: number }> = [],
  incoming: Array<{ name: string; rate: number; amount: number }> = []
): Tax[] => {
  const merged = new Map<string, Tax>();

  [...existing, ...incoming].forEach((tax) => {
    const key = `${String(tax.name).toLowerCase()}|${safeNumber(tax.rate).toFixed(2)}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, {
        name: tax.name,
        rate: safeNumber(tax.rate),
        amount: roundCurrency(safeNumber(tax.amount)),
      } as Tax);
    } else {
      merged.set(key, {
        ...current,
        amount: roundCurrency(safeNumber(current.amount) + safeNumber(tax.amount)),
      } as Tax);
    }
  });

  return Array.from(merged.values());
};

const getPaymentStatusFromNumbers = ({
  amountDueBeforePayment,
  netPaid,
  balanceDue,
}: {
  amountDueBeforePayment: number;
  netPaid: number;
  balanceDue: number;
}): PaymentStatus => {
  if (amountDueBeforePayment <= 0) return PaymentStatus.PENDING;
  if (netPaid <= 0) return PaymentStatus.PENDING;
  if (balanceDue <= 0) return PaymentStatus.PAID_IN_FULL;
  return PaymentStatus.PARTIALLY_PAID;
};

const buildCashBreakdown = (cashTendered: number, changeAmount: number): CashBreakdown | null => {
  if (cashTendered <= 0) return null;

  return {
    tendered: roundCurrency(cashTendered),
    change: roundCurrency(changeAmount),
    netCash: roundCurrency(cashTendered - changeAmount),
  };
};

const normalizeBackendBillingData = (billingData: any) => ({
  subtotal: roundCurrency(safeNumber(billingData?.subtotal)),
  discountAmount: roundCurrency(safeNumber(billingData?.discountAmount)),
  taxableAmount: roundCurrency(safeNumber(billingData?.taxableAmount)),
  taxTotal: roundCurrency(safeNumber(billingData?.taxTotal)),
  grandTotal: roundCurrency(safeNumber(billingData?.grandTotal)),
  totalPaid: roundCurrency(safeNumber(billingData?.totalPaid)),
  balance: roundCurrency(safeNumber(billingData?.balance)),
  taxes: safeArray<Tax>(billingData?.taxes),
});

const normalizeServerBillingItem = (
  item: BillingReviewItem,
  fallbackStatus: string,
  facilityData: any
): NormalizedBillingView => {
  const rawBillingData: any = item?.billing_data ?? {};

  const subtotal = roundCurrency(
    firstValidNumber(rawBillingData?.subtotal, (item as any)?.subtotal)
  );
  const discountAmount = roundCurrency(
    firstValidNumber(rawBillingData?.discountAmount, rawBillingData?.discount_amount, (item as any)?.discountAmount)
  );
  const taxableAmount = roundCurrency(
    firstValidNumber(rawBillingData?.taxableAmount, rawBillingData?.taxable_amount, (item as any)?.taxableAmount)
  );
  const taxTotal = roundCurrency(
    firstValidNumber(rawBillingData?.taxTotal, rawBillingData?.tax_total, (item as any)?.taxTotal)
  );
  const grandTotal = roundCurrency(
    firstValidNumber(rawBillingData?.grandTotal, rawBillingData?.grand_total, (item as any)?.grandTotal)
  );
  const totalPaid = roundCurrency(
    firstValidNumber(rawBillingData?.totalPaid, rawBillingData?.total_paid, (item as any)?.totalPaid, (item as any)?.total_paid)
  );
  const balance = roundCurrency(
    firstValidNumber(
      rawBillingData?.balance,
      rawBillingData?.balance_due,
      (item as any)?.balance,
      (item as any)?.balance_due,
      (item as any)?.amount_due
    )
  );

  const taxes = safeArray<Tax>(rawBillingData?.taxes ?? (item as any)?.taxes);

  const paymentMethods = safeArray<PaymentMethod>((item as any)?.payment_methods);
  const cashTendered = roundCurrency(
    paymentMethods
      .filter((m) => m?.type === 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0)
  );
  const nonCashTotal = roundCurrency(
    paymentMethods
      .filter((m) => m?.type !== 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0)
  );
  const totalPaidFromMethods = roundCurrency(
    paymentMethods.reduce((sum, m) => sum + safeNumber(m?.amount), 0)
  );

  const serverReportedChange = roundCurrency(
    firstValidNumber(
      rawBillingData?.changeAmount,
      rawBillingData?.change_amount,
      (item as any)?.changeAmount,
      (item as any)?.change_amount
    )
  );

  const fallbackComputedChange = roundCurrency(
    Math.max(0, cashTendered - Math.max(0, grandTotal - nonCashTotal))
  );

  const changeAmount = serverReportedChange > 0 ? serverReportedChange : fallbackComputedChange;

  const derivedFinancials: DerivedFinancials = {
    status: ((item as any)?.payment_status || PaymentStatus.PAID_IN_FULL) as PaymentStatus,
    refunded: 0,
    netPaid: totalPaid > 0 ? totalPaid : roundCurrency(totalPaidFromMethods - changeAmount),
    balanceDue: balance,
    grandTotal,
    subtotal,
    discountAmount,
    discountPercent: 0,
    discountType: null,
    taxTotal,
    totalPaidFromMethods,
    cashTendered,
    changeAmount,
    hasCashPayment: cashTendered > 0,
    nonCashTotal,
  };

  const billingData = {
    subtotal,
    discountAmount,
    taxableAmount,
    taxTotal,
    grandTotal,
    totalPaid,
    balance,
    taxes,
  };

  const combinedNotes = [
    (item as any)?.receipt_number ? `Receipt: ${(item as any).receipt_number}` : null,
    (item as any)?.additional_notes ?? null,
  ]
    .filter(Boolean)
    .join('\n');

  const transaction: ReceiptTransactionShape = {
    receipt_number: (item as any)?.receipt_number ?? null,
    patient_name: (item as any)?.patient_name || 'Unknown Patient',
    patient_number: (item as any)?.patient_number || 'N/A',
    created_at: (item as any)?.created_at || new Date().toISOString(),
    charge_items: safeArray((item as any)?.charge_items).map((charge: any) => ({
      ...charge,
      source: 'backend',
      persisted: true,
    })) as RenderableChargeItem[],
    billing_data: billingData,
    payment_methods: paymentMethods,
    additional_notes: combinedNotes || undefined,
    facilityData,
    payment_status: (item as any)?.payment_status || PaymentStatus.PAID_IN_FULL,
    billing_status: (item as any)?.billing_status || fallbackStatus,
    attending_staff_display: (item as any)?.attending_staff_display || null,
    attending_staff_name: (item as any)?.attending_staff_name || null,
    attending_staff_role: (item as any)?.attending_staff_role || null,
  };

  return {
    transaction,
    derivedFinancials,
    cashBreakdown: buildCashBreakdown(cashTendered, changeAmount),
    billingData,
  };
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({
  theme = 'light',
  visitId: propVisitId,
  patientId: propPatientId,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  const currentStep = useSelector(selectCurrentStep);

  const draftChargeItems = useSelector(selectDraftChargeItems);
  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const draftBillingData = useSelector(selectBillingData);
  const backendBillingData = useSelector(selectBackendBillingData);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);
  const billingState = useSelector(selectBilling);

  const status = useSelector(selectEffectiveBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const { data: facilityData } = useGetFacilityIdentity();

  const resolvedVisitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const resolvedPatientId = propPatientId ?? activeVisit?.patient_id;

  const visitId = resolvedVisitId;
  const patientId = resolvedPatientId;

  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] =
    useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  const [serverBillingItem, setServerBillingItem] = useState<BillingReviewItem | null>(null);
  const [shouldFetchAfterFinalization, setShouldFetchAfterFinalization] = useState(false);

  const hasRequiredIds = visitId != null && patientId != null;
  const hasPersistedBalance = safeNumber(backendBillingData?.balance) > 0;
  const hasPersistedGrandTotal = safeNumber(backendBillingData?.grandTotal) > 0;
  const hasDraftItems = safeArray(draftChargeItems).length > 0;
  const hasAnyBillableContext = hasPersistedBalance || hasPersistedGrandTotal || hasDraftItems;

  const isServerMode = !!serverBillingItem;

  useEffect(() => {
    if (status === 'settled' && currentStep !== 'billing_summary') {
      dispatch(setStep('billing_summary'));
    }
  }, [status, currentStep, dispatch]);

  const {
    data: fetchedVisitBillingData,
    isSuccess: isBillingFetchSuccess,
    isLoading: isBillingFetchLoading,
  } = useGetBillingByVisitForFacility(shouldFetchAfterFinalization ? (visitId ?? null) : null, {
    enabled: shouldFetchAfterFinalization && !!visitId,
  });

  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber =
        response?.data?.receipt_number ?? `REC-${Date.now().toString().slice(-8)}`;

      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(setProcessing(false));
      setShouldFetchAfterFinalization(true);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  useEffect(() => {
    const items = fetchedVisitBillingData?.data?.items;
    const hasValidData =
      isBillingFetchSuccess && Array.isArray(items) && items.length > 0;

    if (!hasValidData) return;

    const authoritativeBillingItem = items[0];
    if (!authoritativeBillingItem) return;

    setServerBillingItem(authoritativeBillingItem);
    setReceiptNumber(
      (authoritativeBillingItem as any)?.receipt_number || receiptNumber || `REC-${Date.now().toString().slice(-8)}`
    );
    setShouldFetchAfterFinalization(false);

    // Critical: clear slice draft only after server data has become authoritative
    dispatch(clearDraftAfterFinalization());
  }, [isBillingFetchSuccess, fetchedVisitBillingData, dispatch, receiptNumber]);

  useEffect(() => {
    setLocalDiscount(billingState?.discount || DEFAULT_DISCOUNT);
    setLocalPaymentMethods(
      billingState?.paymentMethods?.length
        ? billingState.paymentMethods
        : DEFAULT_PAYMENT_METHODS
    );
    setLocalAdditionalNotes(billingState?.additionalNotes || '');
  }, [billingState?.discount, billingState?.paymentMethods, billingState?.additionalNotes]);

  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      setReceiptNumber(`REC-${Date.now().toString().slice(-8)}`);
    }
  }, [status, receiptNumber]);

  const normalizedPersistedBilling = useMemo(
    () => normalizeBackendBillingData(backendBillingData),
    [backendBillingData]
  );

  const normalizedDraftBilling = useMemo(
    () => normalizeBackendBillingData(draftBillingData),
    [draftBillingData]
  );

  const draftBillingView = useMemo<NormalizedBillingView>(() => {
    const persisted = normalizedPersistedBilling;
    const draft = normalizedDraftBilling;
    const currentMethods = safeArray(paymentMethods).filter(
      (method) => safeNumber(method?.amount) > 0
    );

    // IMPORTANT:
    // For an existing billed visit, the backend balance is authoritative.
    // New draft items are added on top of that outstanding balance.
    const amountDueBeforeCurrentPayment = roundCurrency(
      persisted.balance + draft.grandTotal
    );

    const combinedSubtotal = roundCurrency(persisted.subtotal + draft.subtotal);
    const combinedDiscountAmount = roundCurrency(
      persisted.discountAmount + draft.discountAmount
    );
    const combinedTaxableAmount = roundCurrency(
      persisted.taxableAmount + draft.taxableAmount
    );
    const combinedTaxTotal = roundCurrency(persisted.taxTotal + draft.taxTotal);
    const combinedGrandTotal = roundCurrency(persisted.grandTotal + draft.grandTotal);
    const combinedTaxes = mergeTaxes(persisted.taxes, draft.taxes);

    const totalPaidFromMethods = roundCurrency(
      currentMethods.reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const cashTendered = roundCurrency(
      currentMethods
        .filter((method) => method?.type === 'cash')
        .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const nonCashTotal = roundCurrency(
      currentMethods
        .filter((method) => method?.type !== 'cash')
        .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const remainingAfterNonCash = roundCurrency(
      Math.max(0, amountDueBeforeCurrentPayment - nonCashTotal)
    );

    const changeAmount = roundCurrency(
      Math.max(0, cashTendered - remainingAfterNonCash)
    );

    const currentNetPaid = roundCurrency(totalPaidFromMethods - changeAmount);

    const balanceDue = roundCurrency(
      Math.max(0, amountDueBeforeCurrentPayment - currentNetPaid)
    );

    const paymentStatus = getPaymentStatusFromNumbers({
      amountDueBeforePayment: amountDueBeforeCurrentPayment,
      netPaid: currentNetPaid,
      balanceDue,
    });

    const billingData = {
      subtotal: combinedSubtotal,
      discountAmount: combinedDiscountAmount,
      taxableAmount: combinedTaxableAmount,
      taxTotal: combinedTaxTotal,
      grandTotal: combinedGrandTotal,
      totalPaid: roundCurrency(persisted.totalPaid + currentNetPaid),
      balance: balanceDue,
      taxes: combinedTaxes,
    };

    const combinedNotes = [
      backendBillingMeta?.receiptNumber
        ? `Existing Receipt: ${backendBillingMeta.receiptNumber}`
        : null,
      additionalNotes || null,
    ]
      .filter(Boolean)
      .join('\n');

    const transaction: ReceiptTransactionShape = {
      receipt_number: receiptNumber || backendBillingMeta?.receiptNumber || null,
      patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
      patient_number:
        activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A',
      created_at: new Date().toISOString(),
      charge_items: safeArray(renderableChargeItems),
      billing_data: billingData,
      payment_methods: currentMethods,
      additional_notes: combinedNotes || undefined,
      facilityData,
      payment_status: paymentStatus,
      billing_status: status,
      attending_staff_display: backendBillingMeta?.attendingStaffDisplay || null,
      attending_staff_name: backendBillingMeta?.attendingStaffName || null,
      attending_staff_role: backendBillingMeta?.attendingStaffRole || null,
    };

    const derivedFinancials: DerivedFinancials = {
      status: paymentStatus,
      refunded: 0,
      netPaid: currentNetPaid,
      balanceDue,
      grandTotal: combinedGrandTotal,
      subtotal: combinedSubtotal,
      discountAmount: combinedDiscountAmount,
      discountPercent: discount?.type === 'percentage' ? safeNumber(discount?.value) : 0,
      discountType:
        discount?.type === 'percentage'
          ? 'percentage'
          : discount?.type === 'fixed'
          ? 'fixed'
          : null,
      taxTotal: combinedTaxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };

    return {
      transaction,
      derivedFinancials,
      cashBreakdown: buildCashBreakdown(cashTendered, changeAmount),
      billingData,
    };
  }, [
    normalizedPersistedBilling,
    normalizedDraftBilling,
    paymentMethods,
    backendBillingMeta,
    additionalNotes,
    receiptNumber,
    activeVisit,
    activePatient,
    renderableChargeItems,
    facilityData,
    status,
    discount,
  ]);

  const serverBillingView = useMemo<NormalizedBillingView | null>(() => {
    if (!serverBillingItem) return null;
    return normalizeServerBillingItem(serverBillingItem, status, facilityData);
  }, [serverBillingItem, status, facilityData]);

  const activeBillingView = serverBillingView ?? draftBillingView;

  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    if (isServerMode) return result;

    const currentMethods = safeArray(paymentMethods);
    const dueBeforeAnyPayment = roundCurrency(
      normalizedPersistedBilling.balance + normalizedDraftBilling.grandTotal
    );

    currentMethods.forEach((method, index) => {
      if (method?.type !== 'cash') return;

      const nonCashOthers = roundCurrency(
        currentMethods.reduce((sum, currentMethod, i) => {
          if (i === index) return sum;
          if (currentMethod?.type === 'cash') return sum;
          return sum + safeNumber(currentMethod?.amount);
        }, 0)
      );

      const dueBefore = roundCurrency(
        Math.max(0, dueBeforeAnyPayment - nonCashOthers)
      );

      const tendered = roundCurrency(safeNumber(method?.amount));
      const change = roundCurrency(Math.max(0, tendered - dueBefore));

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, normalizedPersistedBilling.balance, normalizedDraftBilling.grandTotal, isServerMode]);

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: receiptNumber || serverBillingItem?.receipt_number || 'receipt',
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: async () => setIsPrinting(false),
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    },
  });

  const handlePrintReceipt = () => {
    if (!canPrint || !printReceiptRef.current) return;
    handlePrint();
  };

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      receipt: 'bg-white',
      disabled: isDark ? 'bg-gray-800/50' : 'bg-gray-100',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      receipt: 'border-gray-300',
      disabled: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      disabled: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      ring: 'focus:ring-blue-500',
    },
    select: {
      wrap: isDark ? 'bg-gray-950/40' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-300',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      option: isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
      disabled: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    status: {
      draft: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
      ready: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
      settled: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
    },
  };

  // Finalize is now allowed for partial payments too — but never for zero-payment.
  const canFinalize =
    !isProcessing &&
    !isSubmitting &&
    !isReadOnly &&
    hasAnyBillableContext &&
    activeBillingView.derivedFinancials.netPaid > 0 &&
    hasRequiredIds;

  const canPrint =
    (isFinalized || isServerMode) &&
    (!!receiptNumber || !!serverBillingItem?.receipt_number) &&
    !isProcessing &&
    !isSubmitting;

  const paymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <FaCashRegister className="w-4 h-4 text-green-500" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'insurance':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'mobile':
        return <Banknote className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleDiscountChange = (type: 'percentage' | 'fixed', rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue) || 0;
    const maxValue = type === 'percentage' ? 100 : safeNumber(draftBillingData?.subtotal);
    const clampedValue = clamp(numericValue, 0, maxValue);

    const updatedDiscount = { type, value: clampedValue };
    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: PaymentMethod[]) => {
    if (isReadOnly) return;
    setLocalPaymentMethods(updatedMethods);
    dispatch(setPaymentMethods(updatedMethods as import('./billing-types').PaymentMethod[]));
  };

  const handlePaymentTypeChange = (index: number, newType: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      type: newType as PaymentMethod['type'],
      details: newType === 'mobile' ? updatedMethods[index]?.details || '' : updatedMethods[index]?.details,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handlePaymentAmountChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      amount: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAutoFillRemaining = (index: number) => {
    if (isReadOnly) return;

    const dueBeforeAnyPayment = roundCurrency(
      normalizedPersistedBilling.balance + normalizedDraftBilling.grandTotal
    );

    const otherPaymentsTotal = paymentMethods.reduce(
      (sum, method, i) => (i === index ? sum : sum + safeNumber(method?.amount)),
      0
    );

    const remainingBalance = roundCurrency(Math.max(0, dueBeforeAnyPayment - otherPaymentsTotal));

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], amount: remainingBalance };

    setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;

    const updatedMethods = [
      ...paymentMethods,
      { type: 'cash' as const, amount: 0, details: '' },
    ];

    setFocusedAmountInputs((prev) => ({
      ...prev,
      [updatedMethods.length - 1]: false,
    }));

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (isReadOnly || paymentMethods.length <= 1) return;

    const updatedMethods = paymentMethods.filter((_, i) => i !== index);
    const updatedFocusState: Record<number, boolean> = {};

    updatedMethods.forEach((_, i) => {
      updatedFocusState[i] = focusedAmountInputs[i] ?? false;
    });

    setFocusedAmountInputs(updatedFocusState);
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleMobilePhoneChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      details: onlyDigits(rawValue),
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleInitiateMobilePayment = async (index: number) => {
    if (isReadOnly) return;

    const method = paymentMethods[index];
    if (method?.type !== 'mobile') return;

    const phoneNumber = (method?.details || '').trim();
    if (phoneNumber.length < 9) {
      alert('Please enter a valid phone number for Mobile Money payment.');
      return;
    }

    dispatch(setProcessing(true));
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      alert(`Payment request initiated to ${phoneNumber} (simulated).`);
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handleAdditionalNotesChange = (notes: string) => {
    if (isReadOnly) return;
    setLocalAdditionalNotes(notes);
    dispatch(setAdditionalNotes(notes));
  };

  const handleFinalizePayment = async () => {
    if (!canFinalize) {
      if (!hasRequiredIds) {
        alert('Unable to finalize billing. Visit or patient information is missing.');
        return;
      }

      if (activeBillingView.derivedFinancials.netPaid <= 0) {
        alert('Enter a payment amount greater than zero before finalizing.');
        return;
      }

      return;
    }

    if (visitId == null || patientId == null) return;

    dispatch(setProcessing(true));

    try {
      const currentPaymentStatus = activeBillingView.derivedFinancials.status;

      const payload: BillingSubmissionPayload = {
        visit_id: visitId,
        patient_id: patientId,
        charge_items: safeArray(draftChargeItems).map((item) => ({
          service_key: item.serviceKey,
          service: {
            id: item.service.id,
            code: item.service.code,
            name: item.service.name.toUpperCase(),
            unitPrice: item.service.unitPrice,
            category: item.service.category,
          },
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        })),
        discount: {
          type:
            discount.type === 'percentage'
              ? DiscountType.PERCENTAGE
              : DiscountType.FIXED,
          value: discount.value,
          reason: discount.reason || additionalNotes || undefined,
        },
        taxes: safeArray(activeBillingView.billingData?.taxes).map((tax) => ({
          name: tax.name,
          rate: tax.rate,
          amount: roundCurrency(safeNumber(tax.amount)),
        })),
        payment_methods: safeArray(paymentMethods)
          .filter((method) => safeNumber(method?.amount) > 0)
          .map((method) => ({
            type: method.type as 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed',
            amount: roundCurrency(safeNumber(method.amount)),
            reference: method.details || undefined,
            details: method.details || undefined,
          })),
        billing_data: {
          subtotal: roundCurrency(activeBillingView.billingData.subtotal),
          discountAmount: roundCurrency(activeBillingView.billingData.discountAmount),
          taxableAmount: roundCurrency(activeBillingView.billingData.taxableAmount),
          taxTotal: roundCurrency(activeBillingView.billingData.taxTotal),
          grandTotal: roundCurrency(activeBillingView.billingData.grandTotal),
          totalPaid: roundCurrency(activeBillingView.derivedFinancials.netPaid),
          balance: roundCurrency(activeBillingView.derivedFinancials.balanceDue),
        },
        additional_notes: additionalNotes || undefined,
        status,
        payment_status: currentPaymentStatus,
      };

      submitBilling(payload);
    } catch (error) {
      console.error('Payment processing failed:', error);
      dispatch(setProcessing(false));
    }
  };

  const handleFocusAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (!focusedAmountInputs[index]) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (paymentMethods[index]?.amount === 0) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (discount.value === 0) setLocalDiscount((p) => ({ ...p, value: 0 }));
  };

  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400 no-print">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Read-only mode - Payment settled</span>
        </div>
      )}

      {isBillingFetchLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg border border-blue-500 no-print">
          <Database className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-semibold">Syncing billing record…</span>
        </div>
      )}

      <div className="absolute top-4 right-8 z-10 flex gap-2 no-print">
        {serverBillingItem && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Server billing data loaded</span>
          </div>
        )}

        {!serverBillingItem && backendBillingMeta?.hasBilling && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Saved billing loaded</span>
          </div>
        )}

        {draftChargeItems.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>
              {draftChargeItems.length} New item{draftChargeItems.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          html, body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print, button, .no-print * {
            display: none !important;
          }
          .receipt-print {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          @page {
            margin: 0.5in;
            size: auto;
          }
          .opacity-\\[0\\.06\\] {
            opacity: 0.06 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-gradient-to-r {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        <ReceiptPreviewSection
          colors={colors}
          isReadOnly={isReadOnly}
          status={String(activeBillingView.derivedFinancials.status || status)}
          receiptNumber={
            receiptNumber || serverBillingItem?.receipt_number || backendBillingMeta?.receiptNumber || ''
          }
          receiptRef={printReceiptRef}
          selectedTransaction={activeBillingView.transaction}
          derivedFinancials={activeBillingView.derivedFinancials}
          cashBreakdown={activeBillingView.cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={serverBillingItem?.additional_notes || additionalNotes}
          billingData={activeBillingView.billingData}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        <BillingControlsSection
          colors={colors}
          isReadOnly={isReadOnly}
          paymentMethods={paymentMethods}
          focusedAmountInputs={focusedAmountInputs}
          cashChangeByIndex={cashChangeByIndex}
          discount={discount}
          billingData={activeBillingView.billingData}
          isProcessing={isProcessing}
          isSubmitting={isSubmitting}
          canFinalize={canFinalize}
          canPrint={canPrint}
          hasRequiredIds={hasRequiredIds}
          paymentIcon={paymentIcon}
          getDisplayAmount={getDisplayAmount}
          onAddPaymentMethod={handleAddPaymentMethod}
          onPaymentTypeChange={handlePaymentTypeChange}
          onRemovePaymentMethod={handleRemovePaymentMethod}
          onMobilePhoneChange={handleMobilePhoneChange}
          onInitiateMobilePayment={handleInitiateMobilePayment}
          onPaymentAmountChange={handlePaymentAmountChange}
          onAutoFillRemaining={handleAutoFillRemaining}
          onFocusAmountInput={handleFocusAmountInput}
          onBlurAmountInput={handleBlurAmountInput}
          onDiscountChange={handleDiscountChange}
          onDiscountFocus={handleDiscountFocus}
          onFinalizePayment={handleFinalizePayment}
          onPrintReceipt={handlePrintReceipt}
        />
      </div>
    </div>
  );
};