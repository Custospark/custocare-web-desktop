// BillingSummaryStep.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  AlertCircle,
  Shield,
  Database,
  FilePlus2,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import {
  setDiscount,
  updatePaymentMethod,
  addPaymentMethod,
  removePaymentMethod,
  setAdditionalNotes,
  finalizePayment,
  setProcessing,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectEffectiveBillingStatus,
  selectIsProcessing,
  selectBillingData,
  selectDisplayBillingData,
  selectDisplayedDiscountTaxBillingData,
  selectBilling,
  selectBackendBillingMeta,
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

// Import the modular components
import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
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

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
  visitId?: number;
  patientId?: number;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, n));

const onlyDigits = (v: string) => v.replace(/[^\d]/g, '');

const safeArray = <T,>(arr: T[] | undefined | null): T[] => arr ?? [];
const safeNumber = (val: number | undefined | null, defaultValue = 0): number =>
  typeof val === 'number' && !isNaN(val) ? val : defaultValue;

/* -------------------------------------------------------------------------- */
/*                           MAIN COMPONENT                                   */
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

  // Active visit / patient context
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  const currentStep = useSelector(selectCurrentStep);

  // Draft-only items for submission
  const draftChargeItems = useSelector(selectDraftChargeItems);

  // Combined items for draft display
  const renderableChargeItems = useSelector(selectRenderableChargeItems);

  // Legacy / compatibility selectors
  const draftBillingData = useSelector(selectBillingData);
  const displayBillingData = useSelector(selectDisplayBillingData);

  // New authoritative draft display computation for controls/finalization
  const displayedDiscountTaxBillingData = useSelector(selectDisplayedDiscountTaxBillingData);

  const billingState = useSelector(selectBilling);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);

  const status = useSelector(selectEffectiveBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const { data: facilityData } = useGetFacilityIdentity();

  const resolvedVisitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const resolvedPatientId = propPatientId ?? activeVisit?.patient_id;

  const visitId = resolvedVisitId;
  const patientId = resolvedPatientId;

  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  // Local UI mirrors
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] =
    useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  // Server mode state
  const [serverBillingItem, setServerBillingItem] = useState<BillingReviewItem | null>(null);
  const [shouldFetchAfterFinalization, setShouldFetchAfterFinalization] = useState(false);

  const hasRequiredIds = visitId != null && patientId != null;
  const hasPersistedBalance = safeNumber(displayBillingData?.persistedBalance) > 0;
  const hasDraftItems = safeArray(draftChargeItems).length > 0;
  const hasAnyBillableContext = hasPersistedBalance || hasDraftItems;

  // Server mode means receipt preview must use server data only
  const isServerMode = !!serverBillingItem;

  /* -------------------------------------------------------------------------- */
  /*  Force stay on billing_summary when status is settled                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (status === 'settled' && currentStep !== 'billing_summary') {
      dispatch(setStep('billing_summary'));
    }
  }, [status, currentStep, dispatch]);

  /* -------------------------------------------------------------------------- */
  /*  Post-finalization: Fetch billing data in facility format                  */
  /* -------------------------------------------------------------------------- */
  const {
    data: billingData,
    isSuccess: isBillingFetchSuccess,
    isLoading: isBillingFetchLoading,
  } = useGetBillingByVisitForFacility(shouldFetchAfterFinalization ? (visitId ?? null) : null, {
    enabled: shouldFetchAfterFinalization && !!visitId,
  });

  /* -------------------------------------------------------------------------- */
  /*  Billing submission mutation                                               */
  /* -------------------------------------------------------------------------- */
  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber =
        response?.data?.receipt_number ?? `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(setProcessing(false));
      setShouldFetchAfterFinalization(true);
      console.log('Billing finalized successfully:', response);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  /* -------------------------------------------------------------------------- */
  /*  Handle fetched server data - store locally only                           */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const items = billingData?.data?.items;
    const hasValidData =
      isBillingFetchSuccess && items && Array.isArray(items) && items.length > 0;

    if (!hasValidData) return;

    const authoritativeBillingItem = items[0];
    if (!authoritativeBillingItem) return;

    setServerBillingItem(authoritativeBillingItem);
    setShouldFetchAfterFinalization(false);

    console.log('Server billing data loaded for receipt display');
  }, [isBillingFetchSuccess, billingData]);

  /* -------------------------------------------------------------------------- */
  /*  Sync local editable state from Redux                                      */
  /* -------------------------------------------------------------------------- */
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

  /* -------------------------------------------------------------------------- */
  /*                    DRAFT MODE FINANCIALS (CONTROLS ONLY)                   */
  /* -------------------------------------------------------------------------- */
  const draftDerivedFinancials = useMemo((): DerivedFinancials => {
    const subtotal = safeNumber(displayedDiscountTaxBillingData?.subtotal);
    const grandTotal = safeNumber(displayedDiscountTaxBillingData?.grandTotal);
    const discountAmount = safeNumber(displayedDiscountTaxBillingData?.discountAmount);
    const taxTotal = safeNumber(displayedDiscountTaxBillingData?.taxTotal);

    const safePaymentMethods = safeArray(paymentMethods);

    const totalPaidFromMethods = safePaymentMethods.reduce(
      (sum, m) => sum + safeNumber(m?.amount),
      0
    );

    const cashTendered = safePaymentMethods
      .filter((m) => m?.type === 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const nonCashTotal = safePaymentMethods
      .filter((m) => m?.type !== 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount =
      cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;

    const netPaid = totalPaidFromMethods - changeAmount;
    const balanceDue = Math.max(0, grandTotal - netPaid);

    let paymentStatus = PaymentStatus.PENDING;
    if (grandTotal > 0) {
      if (changeAmount > 0 || (balanceDue === 0 && netPaid > 0)) {
        paymentStatus = PaymentStatus.PAID_IN_FULL;
      } else if (balanceDue > 0 && balanceDue < grandTotal) {
        paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }
    }

    const discountPercent =
      discount?.type === 'percentage' ? safeNumber(discount?.value) : 0;
    const discountType =
      discount?.type === 'percentage'
        ? 'percentage'
        : discount?.type === 'fixed'
        ? 'fixed'
        : null;

    return {
      status: paymentStatus,
      refunded: 0,
      netPaid,
      balanceDue,
      grandTotal,
      subtotal,
      discountAmount,
      discountPercent,
      discountType,
      taxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };
  }, [displayedDiscountTaxBillingData, paymentMethods, discount]);

  /* -------------------------------------------------------------------------- */
  /*                    RECEIPT TRANSACTION - SERVER MODE FIRST                 */
  /* -------------------------------------------------------------------------- */
  const receiptTransaction = useMemo((): ReceiptTransactionShape => {
    // IMPORTANT:
    // When server data exists, receipt display MUST use server data only.
    if (serverBillingItem) {
      const combinedNotes = [
        serverBillingItem.receipt_number
          ? `Receipt: ${serverBillingItem.receipt_number}`
          : null,
        serverBillingItem.additional_notes,
      ]
        .filter(Boolean)
        .join('\n');

      const serverChargeItems = safeArray(serverBillingItem.charge_items).map((item: any) => ({
        ...item,
        source: 'backend',
        persisted: true,
      })) as RenderableChargeItem[];

      const billingData = serverBillingItem.billing_data || {
        subtotal: 0,
        discountAmount: 0,
        taxableAmount: 0,
        taxTotal: 0,
        grandTotal: 0,
        totalPaid: 0,
        balance: 0,
        taxes: [],
      };

      return {
        receipt_number: serverBillingItem.receipt_number || null,
        patient_name: serverBillingItem.patient_name || 'Unknown Patient',
        patient_number: serverBillingItem.patient_number || 'N/A',
        created_at: serverBillingItem.created_at || new Date().toISOString(),
        charge_items: serverChargeItems,
        billing_data: {
          subtotal: safeNumber(billingData.subtotal),
          discountAmount: safeNumber(billingData.discountAmount),
          taxableAmount: safeNumber(billingData.taxableAmount),
          taxTotal: safeNumber(billingData.taxTotal),
          grandTotal: safeNumber(billingData.grandTotal),
          totalPaid: safeNumber(billingData.totalPaid),
          balance: safeNumber(billingData.balance),
          taxes: safeArray(billingData.taxes),
        },
        payment_methods: safeArray(serverBillingItem.payment_methods),
        additional_notes: combinedNotes || undefined,
        facilityData,
        attending_staff_display: serverBillingItem.attending_staff_display || null,
        attending_staff_name: serverBillingItem.attending_staff_name || null,
        attending_staff_role: serverBillingItem.attending_staff_role || null,
      };
    }

    // Draft mode only: slice-backed preview
    const combinedNotes = [
      backendBillingMeta?.receiptNumber
        ? `Existing Receipt: ${backendBillingMeta.receiptNumber}`
        : null,
      additionalNotes,
    ]
      .filter(Boolean)
      .join('\n');

    const safeChargeItems = safeArray(renderableChargeItems);
    const safePaymentMethods = safeArray(paymentMethods).filter(
      (m) => safeNumber(m?.amount) > 0
    );
    const safeComputedTaxes = safeArray(displayedDiscountTaxBillingData?.taxes);

    return {
      receipt_number: receiptNumber || backendBillingMeta?.receiptNumber || null,
      patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
      patient_number:
        activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A',
      created_at: new Date().toISOString(),
      charge_items: safeChargeItems,
      billing_data: {
        subtotal: safeNumber(displayedDiscountTaxBillingData?.subtotal),
        discountAmount: safeNumber(displayedDiscountTaxBillingData?.discountAmount),
        taxableAmount: safeNumber(displayedDiscountTaxBillingData?.taxableAmount),
        taxTotal: safeNumber(displayedDiscountTaxBillingData?.taxTotal),
        grandTotal: safeNumber(displayedDiscountTaxBillingData?.grandTotal),
        totalPaid: draftDerivedFinancials.netPaid,
        balance: draftDerivedFinancials.balanceDue,
        taxes: safeComputedTaxes,
      },
      payment_methods: safePaymentMethods,
      additional_notes: combinedNotes || undefined,
      facilityData,
      attending_staff_display: backendBillingMeta?.attendingStaffDisplay || null,
      attending_staff_name: backendBillingMeta?.attendingStaffName || null,
      attending_staff_role: backendBillingMeta?.attendingStaffRole || null,
    };
  }, [
    serverBillingItem,
    receiptNumber,
    backendBillingMeta,
    activeVisit,
    activePatient,
    renderableChargeItems,
    displayedDiscountTaxBillingData,
    draftDerivedFinancials,
    paymentMethods,
    additionalNotes,
    facilityData,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                    RECEIPT DERIVED FINANCIALS                              */
  /* -------------------------------------------------------------------------- */
  const receiptDerivedFinancials = useMemo((): DerivedFinancials => {
    // IMPORTANT:
    // In server mode, receipt financials must come only from server data.
    if (serverBillingItem) {
      const billingData = serverBillingItem.billing_data;
      if (!billingData) {
        return {
          status: serverBillingItem.payment_status || PaymentStatus.PAID_IN_FULL,
          refunded: 0,
          netPaid: 0,
          balanceDue: 0,
          grandTotal: 0,
          subtotal: 0,
          discountAmount: 0,
          discountPercent: 0,
          discountType: null,
          taxTotal: 0,
          totalPaidFromMethods: 0,
          cashTendered: 0,
          changeAmount: 0,
          hasCashPayment: false,
          nonCashTotal: 0,
        };
      }

      const serverPaymentMethods = safeArray(serverBillingItem.payment_methods);

      const cashTendered = serverPaymentMethods
        .filter((m) => m?.type === 'cash')
        .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

      const nonCashTotal = serverPaymentMethods
        .filter((m) => m?.type !== 'cash')
        .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

      const grandTotal = safeNumber(billingData.grandTotal);
      const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
      const changeAmount =
        cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;

      return {
        status: serverBillingItem.payment_status || PaymentStatus.PAID_IN_FULL,
        refunded: 0,
        netPaid: safeNumber(billingData.totalPaid),
        balanceDue: safeNumber(billingData.balance),
        grandTotal: safeNumber(billingData.grandTotal),
        subtotal: safeNumber(billingData.subtotal),
        discountAmount: safeNumber(billingData.discountAmount),
        discountPercent: 0,
        discountType: null,
        taxTotal: safeNumber(billingData.taxTotal),
        totalPaidFromMethods: safeNumber(billingData.totalPaid),
        cashTendered,
        changeAmount,
        hasCashPayment: cashTendered > 0,
        nonCashTotal,
      };
    }

    return draftDerivedFinancials;
  }, [serverBillingItem, draftDerivedFinancials]);

  const cashBreakdown = useMemo((): CashBreakdown | null => {
    if (
      !receiptDerivedFinancials.hasCashPayment ||
      receiptDerivedFinancials.cashTendered === 0
    ) {
      return null;
    }

    const { grandTotal, nonCashTotal, cashTendered } = receiptDerivedFinancials;
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change =
      cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;
    const netCash = cashTendered - change;

    return { tendered: cashTendered, change, netCash };
  }, [receiptDerivedFinancials]);

  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};
    const safePaymentMethods = safeArray(paymentMethods);
    const grandTotal = safeNumber(draftDerivedFinancials.grandTotal);

    safePaymentMethods.forEach((method, index) => {
      if (method?.type !== 'cash') return;

      const otherPaymentsTotal = safePaymentMethods.reduce(
        (sum, m, i) => (i === index ? sum : sum + safeNumber(m?.amount)),
        0
      );

      const dueBefore = Math.max(0, grandTotal - otherPaymentsTotal);
      const tendered = safeNumber(method?.amount);
      const change = Math.max(0, tendered - dueBefore);

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, draftDerivedFinancials.grandTotal]);

  /* -------------------------------------------------------------------------- */
  /*                              PRINT HANDLER                                 */
  /* -------------------------------------------------------------------------- */

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: receiptNumber || serverBillingItem?.receipt_number || 'receipt',
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: async () => {
      setIsPrinting(false);
    },
    onPrintError: (error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    },
  });

  const handlePrintReceipt = () => {
    if (!canPrint || !printReceiptRef.current) return;
    handlePrint();
  };

  /* -------------------------------------------------------------------------- */
  /*                              COLOR THEME                                   */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                              ACTION BUTTON STATES                          */
  /* -------------------------------------------------------------------------- */

  const canFinalize =
    !isProcessing &&
    !isSubmitting &&
    !isReadOnly &&
    hasAnyBillableContext &&
    draftDerivedFinancials.balanceDue === 0 &&
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

  /* -------------------------------------------------------------------------- */
  /*                              EVENT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handleDiscountChange = (type: 'percentage' | 'fixed', rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue) || 0;
    const maxValue =
      type === 'percentage'
        ? 100
        : safeNumber(displayedDiscountTaxBillingData?.subtotal);

    const clampedValue = clamp(numericValue, 0, maxValue);

    const updatedDiscount = { type, value: clampedValue };
    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: PaymentMethod[]) => {
    if (isReadOnly) return;

    setLocalPaymentMethods(updatedMethods);

    updatedMethods.forEach((method, index) => {
      dispatch(
        updatePaymentMethod({
          index,
          method: {
            type: method.type,
            amount: safeNumber(method.amount),
            details: method.details,
          },
        })
      );
    });
  };

  const handlePaymentTypeChange = (index: number, newType: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], type: newType as any };

    if (newType === 'mobile' && !updatedMethods[index].details) {
      updatedMethods[index].details = '';
    }

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

    const otherPaymentsTotal = paymentMethods.reduce(
      (sum, m, i) => (i === index ? sum : sum + safeNumber(m?.amount)),
      0
    );

    const remainingBalance = Math.max(
      0,
      safeNumber(draftDerivedFinancials.grandTotal) - otherPaymentsTotal
    );

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

    setLocalPaymentMethods(updatedMethods);
    dispatch(addPaymentMethod());
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (isReadOnly || paymentMethods.length <= 1) return;

    const updatedMethods = paymentMethods.filter((_, i) => i !== index);
    const updatedFocusState: Record<number, boolean> = {};

    updatedMethods.forEach((_, i) => {
      updatedFocusState[i] = focusedAmountInputs[i] ?? false;
    });

    setFocusedAmountInputs(updatedFocusState);
    setLocalPaymentMethods(updatedMethods);
    dispatch(removePaymentMethod(index));
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
        console.error('Cannot finalize: Missing visit ID or patient ID');
        alert('Unable to finalize billing. Visit or patient information is missing.');
      }
      return;
    }

    if (visitId == null || patientId == null) {
      console.error('Cannot finalize: Invalid visit ID or patient ID');
      return;
    }

    dispatch(setProcessing(true));

    try {
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
        taxes: safeArray(displayedDiscountTaxBillingData?.taxes).map((tax) => ({
          name: tax.name,
          rate: tax.rate,
          amount: safeNumber(tax.amount),
        })),
        payment_methods: safeArray(paymentMethods)
          .filter((m) => safeNumber(m?.amount) > 0)
          .map((m) => ({
            type: m.type as 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed',
            amount: safeNumber(m.amount),
            reference: m.details || undefined,
            details: m.details || undefined,
          })),
        billing_data: {
          subtotal: safeNumber(displayedDiscountTaxBillingData?.subtotal),
          discountAmount: safeNumber(displayedDiscountTaxBillingData?.discountAmount),
          taxableAmount: safeNumber(displayedDiscountTaxBillingData?.taxableAmount),
          taxTotal: safeNumber(displayedDiscountTaxBillingData?.taxTotal),
          grandTotal: safeNumber(displayedDiscountTaxBillingData?.grandTotal),
          totalPaid: safeNumber(draftDerivedFinancials.netPaid),
          balance: safeNumber(draftDerivedFinancials.balanceDue),
        },
        additional_notes: additionalNotes || undefined,
        status,
        payment_status:
          draftDerivedFinancials.balanceDue === 0
            ? PaymentStatus.PAID_IN_FULL
            : draftDerivedFinancials.netPaid > 0
            ? PaymentStatus.PARTIALLY_PAID
            : PaymentStatus.PENDING,
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

  /* -------------------------------------------------------------------------- */
  /*                              RECEIPT VIEW DATA                             */
  /* -------------------------------------------------------------------------- */

  const receiptStatus = serverBillingItem?.payment_status || status;

  const receiptBillingData = serverBillingItem?.billing_data
    ? {
        subtotal: safeNumber(serverBillingItem.billing_data.subtotal),
        discountAmount: safeNumber(serverBillingItem.billing_data.discountAmount),
        taxableAmount: safeNumber(serverBillingItem.billing_data.taxableAmount),
        taxTotal: safeNumber(serverBillingItem.billing_data.taxTotal),
        taxes: safeArray(serverBillingItem.billing_data.taxes),
        grandTotal: safeNumber(serverBillingItem.billing_data.grandTotal),
        balance: safeNumber(serverBillingItem.billing_data.balance),
        totalPaid: safeNumber(serverBillingItem.billing_data.totalPaid),
      }
    : {
        ...draftBillingData,
        subtotal: safeNumber(displayedDiscountTaxBillingData?.subtotal),
        discountAmount: safeNumber(displayedDiscountTaxBillingData?.discountAmount),
        taxableAmount: safeNumber(displayedDiscountTaxBillingData?.taxableAmount),
        taxTotal: safeNumber(displayedDiscountTaxBillingData?.taxTotal),
        taxes: safeArray(displayedDiscountTaxBillingData?.taxes),
        grandTotal: safeNumber(displayedDiscountTaxBillingData?.grandTotal),
        balance: draftDerivedFinancials.balanceDue,
        totalPaid: draftDerivedFinancials.netPaid,
      };

  const controlsBillingData = {
    ...draftBillingData,
    subtotal: safeNumber(displayedDiscountTaxBillingData?.subtotal),
    discountAmount: safeNumber(displayedDiscountTaxBillingData?.discountAmount),
    taxableAmount: safeNumber(displayedDiscountTaxBillingData?.taxableAmount),
    taxTotal: safeNumber(displayedDiscountTaxBillingData?.taxTotal),
    taxes: safeArray(displayedDiscountTaxBillingData?.taxes),
    grandTotal: safeNumber(displayedDiscountTaxBillingData?.grandTotal),
    balance: draftDerivedFinancials.balanceDue,
    totalPaid: draftDerivedFinancials.netPaid,
  };

  /* -------------------------------------------------------------------------- */
  /*                              RENDER                                        */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* {!hasRequiredIds && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg border border-red-500 no-print">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Unable to finalize billing: {!visitId ? 'Visit ID missing' : 'Patient ID missing'}
          </span>
        </div>
      )} */}

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
            <span>{draftChargeItems.length} New item{draftChargeItems.length === 1 ? '' : 's'}</span>
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
          status={receiptStatus}
          receiptNumber={receiptNumber || serverBillingItem?.receipt_number || ''}
          receiptRef={printReceiptRef}
          selectedTransaction={receiptTransaction}
          derivedFinancials={receiptDerivedFinancials}
          cashBreakdown={cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={serverBillingItem?.additional_notes || additionalNotes}
          billingData={receiptBillingData}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        <BillingControlsSection
          colors={colors}
          isReadOnly={isReadOnly}
          paymentMethods={paymentMethods}
          focusedAmountInputs={focusedAmountInputs}
          cashChangeByIndex={cashChangeByIndex}
          discount={discount}
          billingData={controlsBillingData}
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
