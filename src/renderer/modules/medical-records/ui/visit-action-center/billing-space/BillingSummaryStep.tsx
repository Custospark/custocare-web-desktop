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
  clearDraft,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectEffectiveBillingStatus,
  selectIsProcessing,
  selectBillingData,
  selectDisplayBillingData,
  selectBilling,
  selectBackendBillingMeta,
  selectCurrentStep,
  setStep,
} from './billingSlice';
import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_TAXES,
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

  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  const currentStep = useSelector(selectCurrentStep);

  const resolvedVisitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const resolvedPatientId = propPatientId ?? activeVisit?.patient_id;

  const visitId = resolvedVisitId;
  const patientId = resolvedPatientId;

  const draftChargeItems = useSelector(selectDraftChargeItems);
  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const draftBillingData = useSelector(selectBillingData);
  const displayBillingData = useSelector(selectDisplayBillingData);
  const billingState = useSelector(selectBilling);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);

  const status = useSelector(selectEffectiveBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const { data: facilityData } = useGetFacilityIdentity();

  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] =
    useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  /**
   * Server authoritative billing record after finalization/refetch.
   * Once this exists, it becomes the UI source of truth.
   */
  const [serverBillingItem, setServerBillingItem] = useState<BillingReviewItem | null>(null);

  /**
   * Snapshot of finalized draft used only between:
   * - submit success
   * - server refetch completion
   *
   * This prevents blank/flicker after we immediately clear draft state.
   */
  const [finalizedSnapshot, setFinalizedSnapshot] = useState<ReceiptTransactionShape | null>(null);

  const [shouldFetchAfterFinalization, setShouldFetchAfterFinalization] = useState(false);

  const previousVisitIdRef = useRef<number | undefined>(visitId);

  const hasRequiredIds = visitId != null && patientId != null;
  const hasPersistedBalance = safeNumber(displayBillingData?.persistedBalance) > 0;
  const hasDraftItems = safeArray(draftChargeItems).length > 0;
  const hasAnyBillableContext = hasPersistedBalance || hasDraftItems;

  /* -------------------------------------------------------------------------- */
  /*  Reset local server/snapshot state when visit changes                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (previousVisitIdRef.current !== visitId) {
      previousVisitIdRef.current = visitId;
      setServerBillingItem(null);
      setFinalizedSnapshot(null);
      setShouldFetchAfterFinalization(false);
      setReceiptNumber('');
    }
  }, [visitId]);

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
    isError: isBillingFetchError,
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

      /**
       * Keep a local snapshot for receipt rendering while server data is loading.
       * This snapshot is intentionally created BEFORE clearing the draft slice.
       */
      setFinalizedSnapshot({
        ...draftReceiptTransaction,
        receipt_number: generatedReceiptNumber,
        created_at: new Date().toISOString(),
      });

      setReceiptNumber(generatedReceiptNumber);

      /**
       * Mark payment finalized in UI.
       */
      dispatch(finalizePayment());

      /**
       * CRITICAL FIX:
       * Immediately clear transient draft/UI data so it cannot merge with
       * the refetched backend record and create duplicate billing items.
       */
      dispatch(clearDraft());

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
  /*  Handle fetched server data - authoritative source after finalization      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!shouldFetchAfterFinalization) return;
    if (!isBillingFetchSuccess) return;

    const items = billingData?.data?.items;
    const hasValidData = Array.isArray(items) && items.length > 0;

    if (!hasValidData) {
      setShouldFetchAfterFinalization(false);
      return;
    }

    const authoritativeBillingItem = items[0];
    if (!authoritativeBillingItem) {
      setShouldFetchAfterFinalization(false);
      return;
    }

    setServerBillingItem(authoritativeBillingItem);
    setFinalizedSnapshot(null);
    setShouldFetchAfterFinalization(false);

    console.log('Server billing data loaded as authoritative source');
  }, [shouldFetchAfterFinalization, isBillingFetchSuccess, billingData]);

  useEffect(() => {
    if (!shouldFetchAfterFinalization) return;
    if (!isBillingFetchError) return;

    console.error('Failed to fetch authoritative billing record after finalization');
    setShouldFetchAfterFinalization(false);
  }, [shouldFetchAfterFinalization, isBillingFetchError]);

  /* -------------------------------------------------------------------------- */
  /*  Keep local fields in sync with Redux on mount / visit switch              */
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
    if ((status === 'settled' || !!serverBillingItem || !!finalizedSnapshot) && !receiptNumber) {
      setReceiptNumber(`REC-${Date.now().toString().slice(-8)}`);
    }
  }, [status, serverBillingItem, finalizedSnapshot, receiptNumber]);

  /* -------------------------------------------------------------------------- */
  /*                    DRAFT MODE FINANCIALS (NO SERVER DATA)                  */
  /* -------------------------------------------------------------------------- */
  const draftDerivedFinancials = useMemo((): DerivedFinancials => {
    const subtotal = safeNumber(displayBillingData?.displayedSubtotal);
    const grandTotal = safeNumber(displayBillingData?.displayedBalance);
    const discountAmount = safeNumber(draftBillingData?.discountAmount);
    const taxTotal = safeNumber(draftBillingData?.taxTotal);

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
  }, [displayBillingData, draftBillingData, paymentMethods, discount]);

  /* -------------------------------------------------------------------------- */
  /*                    SERVER MODE FINANCIALS (WHEN SERVER DATA EXISTS)        */
  /* -------------------------------------------------------------------------- */
  const serverDerivedFinancials = useMemo((): DerivedFinancials | null => {
    if (!serverBillingItem) return null;

    const billing = serverBillingItem.billing_data;
    if (!billing) return null;

    const serverPaymentMethods = safeArray(serverBillingItem.payment_methods);

    const cashTendered = serverPaymentMethods
      .filter((m) => m?.type === 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const nonCashTotal = serverPaymentMethods
      .filter((m) => m?.type !== 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const grandTotal = safeNumber(billing.grandTotal);
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount =
      cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;

    return {
      status: serverBillingItem.payment_status || PaymentStatus.PENDING,
      refunded: 0,
      netPaid: safeNumber(billing.totalPaid),
      balanceDue: safeNumber(billing.balance),
      grandTotal: safeNumber(billing.grandTotal),
      subtotal: safeNumber(billing.subtotal),
      discountAmount: safeNumber(billing.discountAmount),
      discountPercent: 0,
      discountType: null,
      taxTotal: safeNumber(billing.taxTotal),
      totalPaidFromMethods: safeNumber(billing.totalPaid),
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };
  }, [serverBillingItem]);

  /* -------------------------------------------------------------------------- */
  /*                    SNAPSHOT MODE FINANCIALS (WHILE REFETCHING)             */
  /* -------------------------------------------------------------------------- */
  const snapshotDerivedFinancials = useMemo((): DerivedFinancials | null => {
    if (!finalizedSnapshot) return null;

    const billing = finalizedSnapshot.billing_data;
    const snapshotPaymentMethods = safeArray(finalizedSnapshot.payment_methods);

    const cashTendered = snapshotPaymentMethods
      .filter((m) => m?.type === 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const nonCashTotal = snapshotPaymentMethods
      .filter((m) => m?.type !== 'cash')
      .reduce((sum, m) => sum + safeNumber(m?.amount), 0);

    const grandTotal = safeNumber(billing.grandTotal);
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount =
      cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;

    return {
      status:
        safeNumber(billing.balance) === 0
          ? PaymentStatus.PAID_IN_FULL
          : safeNumber(billing.totalPaid) > 0
          ? PaymentStatus.PARTIALLY_PAID
          : PaymentStatus.PENDING,
      refunded: 0,
      netPaid: safeNumber(billing.totalPaid),
      balanceDue: safeNumber(billing.balance),
      grandTotal: safeNumber(billing.grandTotal),
      subtotal: safeNumber(billing.subtotal),
      discountAmount: safeNumber(billing.discountAmount),
      discountPercent: 0,
      discountType: null,
      taxTotal: safeNumber(billing.taxTotal),
      totalPaidFromMethods: safeNumber(billing.totalPaid),
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };
  }, [finalizedSnapshot]);

  const derivedFinancials =
    serverDerivedFinancials || snapshotDerivedFinancials || draftDerivedFinancials;

  /* -------------------------------------------------------------------------- */
  /*                    DRAFT MODE RECEIPT TRANSACTION                          */
  /* -------------------------------------------------------------------------- */
  const draftReceiptTransaction = useMemo((): ReceiptTransactionShape => {
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
    const safeDisplayTaxes = safeArray(displayBillingData?.displayedTaxes);

    return {
      receipt_number: receiptNumber || backendBillingMeta?.receiptNumber || null,
      patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
      patient_number:
        activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A',
      created_at: new Date().toISOString(),
      charge_items: safeChargeItems,
      billing_data: {
        subtotal: safeNumber(displayBillingData?.displayedSubtotal),
        discountAmount: safeNumber(draftBillingData?.discountAmount),
        taxableAmount: Math.max(
          0,
          safeNumber(displayBillingData?.displayedSubtotal) -
            safeNumber(draftBillingData?.discountAmount)
        ),
        taxTotal: safeDisplayTaxes.reduce((sum, tax) => sum + safeNumber(tax?.amount), 0),
        grandTotal: safeNumber(draftDerivedFinancials.grandTotal),
        totalPaid: safeNumber(draftDerivedFinancials.netPaid),
        balance: safeNumber(draftDerivedFinancials.balanceDue),
        taxes: safeDisplayTaxes,
      },
      payment_methods: safePaymentMethods,
      additional_notes: combinedNotes || undefined,
      facilityData,
      attending_staff_display: backendBillingMeta?.attendingStaffDisplay || null,
      attending_staff_name: backendBillingMeta?.attendingStaffName || null,
      attending_staff_role: backendBillingMeta?.attendingStaffRole || null,
    };
  }, [
    receiptNumber,
    backendBillingMeta,
    activeVisit,
    activePatient,
    renderableChargeItems,
    displayBillingData,
    draftBillingData,
    draftDerivedFinancials,
    paymentMethods,
    additionalNotes,
    facilityData,
  ]);

  /* -------------------------------------------------------------------------- */
  /*                    SERVER MODE RECEIPT TRANSACTION                         */
  /* -------------------------------------------------------------------------- */
  const serverReceiptTransaction = useMemo((): ReceiptTransactionShape | null => {
    if (!serverBillingItem) return null;

    const combinedNotes = [
      serverBillingItem.receipt_number ? `Receipt: ${serverBillingItem.receipt_number}` : null,
      serverBillingItem.additional_notes,
    ]
      .filter(Boolean)
      .join('\n');

    const safeChargeItems =
      safeArray(serverBillingItem.charge_items) as unknown as RenderableChargeItem[];
    const safePaymentMethods = safeArray(serverBillingItem.payment_methods);
    const billing = serverBillingItem.billing_data || {
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
      charge_items: safeChargeItems,
      billing_data: {
        subtotal: safeNumber(billing.subtotal),
        discountAmount: safeNumber(billing.discountAmount),
        taxableAmount: safeNumber(billing.taxableAmount),
        taxTotal: safeNumber(billing.taxTotal),
        grandTotal: safeNumber(billing.grandTotal),
        totalPaid: safeNumber(billing.totalPaid),
        balance: safeNumber(billing.balance),
        taxes: safeArray(billing.taxes),
      },
      payment_methods: safePaymentMethods,
      additional_notes: combinedNotes || undefined,
      facilityData,
      attending_staff_display: serverBillingItem.attending_staff_display || null,
      attending_staff_name: serverBillingItem.attending_staff_name || null,
      attending_staff_role: serverBillingItem.attending_staff_role || null,
    };
  }, [serverBillingItem, facilityData]);

  const selectedTransactionForReceipt =
    serverReceiptTransaction || finalizedSnapshot || draftReceiptTransaction;

  const billingDataForReceipt =
    serverBillingItem?.billing_data ||
    finalizedSnapshot?.billing_data || {
      ...draftBillingData,
      subtotal: safeNumber(displayBillingData?.displayedSubtotal),
      grandTotal: safeNumber(draftDerivedFinancials.grandTotal),
      balance: safeNumber(draftDerivedFinancials.balanceDue),
      totalPaid: safeNumber(draftDerivedFinancials.netPaid),
    };

  const additionalNotesForReceipt =
    serverBillingItem?.additional_notes || finalizedSnapshot?.additional_notes || additionalNotes;

  const cashBreakdown = useMemo((): CashBreakdown | null => {
    if (!derivedFinancials.hasCashPayment || derivedFinancials.cashTendered === 0) return null;

    const { grandTotal, nonCashTotal, cashTendered } = derivedFinancials;
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change = cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;
    const netCash = cashTendered - change;

    return { tendered: cashTendered, change, netCash };
  }, [derivedFinancials]);

  const cashChangeByIndex = useMemo(() => {
    if (serverBillingItem || finalizedSnapshot) return {};

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
  }, [paymentMethods, draftDerivedFinancials.grandTotal, serverBillingItem, finalizedSnapshot]);

  /* -------------------------------------------------------------------------- */
  /*                              PRINT HANDLER                                 */
  /* -------------------------------------------------------------------------- */

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle:
      receiptNumber ||
      serverBillingItem?.receipt_number ||
      finalizedSnapshot?.receipt_number ||
      'receipt',
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
    !serverBillingItem &&
    !finalizedSnapshot &&
    hasAnyBillableContext &&
    draftDerivedFinancials.balanceDue === 0 &&
    hasRequiredIds;

  const canPrint =
    (isFinalized || !!serverBillingItem || !!finalizedSnapshot) &&
    (!!receiptNumber ||
      !!serverBillingItem?.receipt_number ||
      !!finalizedSnapshot?.receipt_number) &&
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
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

    const numericValue = Number(rawValue) || 0;
    const maxValue = type === 'percentage' ? 100 : safeNumber(draftBillingData?.subtotal);
    const clampedValue = clamp(numericValue, 0, maxValue);

    const updatedDiscount = { type, value: clampedValue };
    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: PaymentMethod[]) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

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
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], type: newType as any };

    if (newType === 'mobile' && !updatedMethods[index].details) {
      updatedMethods[index].details = '';
    }

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handlePaymentAmountChange = (index: number, rawValue: string) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

    const numericValue = Number(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      amount: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAutoFillRemaining = (index: number) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

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
    if (isReadOnly || serverBillingItem || finalizedSnapshot || paymentMethods.length >= 3) return;

    const updatedMethods = [...paymentMethods, { type: 'cash' as const, amount: 0, details: '' }];
    setFocusedAmountInputs((prev) => ({ ...prev, [updatedMethods.length - 1]: false }));
    setLocalPaymentMethods(updatedMethods);
    dispatch(addPaymentMethod());
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot || paymentMethods.length <= 1) return;

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
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      details: onlyDigits(rawValue),
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleInitiateMobilePayment = async (index: number) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;

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
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;
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
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: safeNumber(draftBillingData?.taxes?.[index]?.amount),
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
          subtotal: safeNumber(draftBillingData?.subtotal),
          discountAmount: safeNumber(draftBillingData?.discountAmount),
          taxableAmount: safeNumber(draftBillingData?.taxableAmount),
          taxTotal: safeNumber(draftBillingData?.taxTotal),
          grandTotal: safeNumber(draftDerivedFinancials.grandTotal),
          totalPaid: safeNumber(draftDerivedFinancials.netPaid),
          balance: safeNumber(draftDerivedFinancials.balanceDue),
        },
        additional_notes: additionalNotes || undefined,
        status: status,
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
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;
    if (!focusedAmountInputs[index]) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;
    if (paymentMethods[index]?.amount === 0) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (isReadOnly || serverBillingItem || finalizedSnapshot) return;
    if (discount.value === 0) {
      setLocalDiscount((p) => ({ ...p, value: 0 }));
    }
  };

  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  /* -------------------------------------------------------------------------- */
  /*                              RENDER                                        */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {!hasRequiredIds && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg border border-red-500 no-print">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Unable to finalize billing: {!visitId ? 'Visit ID missing' : 'Patient ID missing'}
          </span>
        </div>
      )}

      {(isReadOnly || serverBillingItem || finalizedSnapshot) && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400 no-print">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">
            {serverBillingItem
              ? 'View-only - Server data loaded'
              : finalizedSnapshot
              ? 'Finalized - awaiting server sync'
              : 'Read-only mode - Payment settled'}
          </span>
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

        {!serverBillingItem && finalizedSnapshot && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Awaiting server confirmation</span>
          </div>
        )}

        {!serverBillingItem && !finalizedSnapshot && backendBillingMeta?.hasBilling && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800 shadow-sm">
            <Database className="w-3.5 h-3.5" />
            <span>Saved billing loaded</span>
          </div>
        )}

        {!serverBillingItem && !finalizedSnapshot && safeArray(draftChargeItems).length > 0 && (
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
          isReadOnly={isReadOnly || !!serverBillingItem || !!finalizedSnapshot}
          status={serverBillingItem || finalizedSnapshot ? 'settled' : status}
          receiptNumber={
            receiptNumber ||
            serverBillingItem?.receipt_number ||
            finalizedSnapshot?.receipt_number ||
            ''
          }
          receiptRef={printReceiptRef}
          selectedTransaction={selectedTransactionForReceipt}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={additionalNotesForReceipt}
          billingData={billingDataForReceipt}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        {!serverBillingItem && !finalizedSnapshot && (
          <BillingControlsSection
            colors={colors}
            isReadOnly={isReadOnly}
            paymentMethods={paymentMethods}
            focusedAmountInputs={focusedAmountInputs}
            cashChangeByIndex={cashChangeByIndex}
            discount={discount}
            billingData={{
              ...draftBillingData,
              subtotal: safeNumber(displayBillingData?.displayedSubtotal),
              grandTotal: safeNumber(draftDerivedFinancials.grandTotal),
              balance: safeNumber(draftDerivedFinancials.balanceDue),
              totalPaid: safeNumber(draftDerivedFinancials.netPaid),
            }}
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
        )}

        {(serverBillingItem || finalizedSnapshot) && (
          <div
            className={`flex flex-col items-center justify-center h-full border ${colors.border.primary} ${colors.bg.secondary} rounded-lg p-8 no-print`}
          >
            <Database className={`w-16 h-16 ${colors.text.secondary} mb-4`} />
            <p className={`text-center ${colors.text.primary} font-semibold mb-2`}>
              Billing Finalized
            </p>
            <p className={`text-center ${colors.text.secondary} text-sm`}>
              {serverBillingItem
                ? 'This billing has been completed and saved to the server.'
                : 'This billing has been finalized and is syncing from the server.'}
              <br />
              You can print the receipt using the print button below.
            </p>

            <button
              onClick={handlePrintReceipt}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Print Receipt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
