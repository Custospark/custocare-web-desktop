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
  selectBillingState,
  selectBackendBillingMeta,
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
import { useGetFacilityIdentity } from '../../../api/facility/FacilityQueries';
import type { BillingSubmissionPayload } from '../../../api/billable-items/BillingItemsTypes';
import {
  PaymentStatus,
  DiscountType,
  type Tax,
  type PaymentMethod,
} from '../../../api/billing-review/BillingReviewTypes';

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

  // Print ref points to visible receipt preview
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Active visit / patient context
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);

  const visitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const patientId = propPatientId ?? activeVisit?.patient_id;

  // Draft-only items for submission
  const draftChargeItems = useSelector(selectDraftChargeItems);

  // Combined items for display / receipt
  const renderableChargeItems = useSelector(selectRenderableChargeItems);

  // Draft financial data
  const draftBillingData = useSelector(selectBillingData);

  // Combined display financial data
  const displayBillingData = useSelector(selectDisplayBillingData);

  const billingState = useSelector(selectBillingState);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);

  const status = useSelector(selectEffectiveBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const { data: facilityData } = useGetFacilityIdentity();

  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  // Local UI mirrors
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  // We allow payment workflow if:
  // - IDs exist
  // - there is either existing persisted balance OR draft items OR draft payment methods
  const hasRequiredIds = visitId != null && patientId != null;
  const hasPersistedBalance = displayBillingData.persistedBalance > 0;
  const hasDraftItems = draftChargeItems.length > 0;
  const hasAnyBillableContext = hasPersistedBalance || hasDraftItems;

  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber = response.data.receipt_number;
      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(setProcessing(false));
      console.log('Billing finalized successfully:', response);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  // Keep local fields in sync with Redux on mount / visit switch
  useEffect(() => {
    setLocalDiscount(billingState.discount || DEFAULT_DISCOUNT);
    setLocalPaymentMethods(
      billingState.paymentMethods?.length ? billingState.paymentMethods : DEFAULT_PAYMENT_METHODS
    );
    setLocalAdditionalNotes(billingState.additionalNotes || '');
  }, [billingState.discount, billingState.paymentMethods, billingState.additionalNotes]);

  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      const generatedReceiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
    }
  }, [status, receiptNumber]);

  /* -------------------------------------------------------------------------- */
  /*                            DERIVED FINANCIALS                              */
  /* -------------------------------------------------------------------------- */

  /**
   * We display combined totals:
   * - persisted backend balance
   * - plus new draft totals
   *
   * Payment methods entered on this screen represent current collection intent.
   * Backend will merge them into the open editable cycle.
   */
  const derivedFinancials = useMemo((): DerivedFinancials => {
    const subtotal = displayBillingData.displayedSubtotal;
    const grandTotal = displayBillingData.displayedBalance;

    // For receipt display, we keep discount/tax numbers driven by the draft portion
    // while the persisted portion is already included in persisted balance.
    const discountAmount = draftBillingData.discountAmount;
    const taxTotal = draftBillingData.taxTotal;

    const totalPaidFromMethods = paymentMethods.reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0
    );

    const cashTendered = paymentMethods
      .filter((m) => m.type === 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const nonCashTotal = paymentMethods
      .filter((m) => m.type !== 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

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

    return {
      status: paymentStatus,
      refunded: 0,
      netPaid,
      balanceDue,
      grandTotal,
      subtotal,
      discountAmount,
      discountPercent: discount.type === 'percentage' ? discount.value : 0,
      discountType: discount.type,
      taxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };
  }, [displayBillingData, draftBillingData, paymentMethods, discount]);

  const cashBreakdown = useMemo((): CashBreakdown | null => {
    if (!derivedFinancials.hasCashPayment || derivedFinancials.cashTendered === 0) return null;

    const { grandTotal, nonCashTotal, cashTendered } = derivedFinancials;
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change = cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;
    const netCash = cashTendered - change;

    return { tendered: cashTendered, change, netCash };
  }, [derivedFinancials]);

  const selectedTransactionForReceipt: ReceiptTransactionShape = useMemo(() => {
    const combinedNotes = [backendBillingMeta?.receiptNumber ? `Existing Receipt: ${backendBillingMeta.receiptNumber}` : null, additionalNotes]
      .filter(Boolean)
      .join('\n');

    return {
      receipt_number: receiptNumber || backendBillingMeta?.receiptNumber || null,
      patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
      patient_number: activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A',
      created_at: new Date().toISOString(),

      // Combined persisted + draft items
      charge_items: renderableChargeItems,

      billing_status:
        derivedFinancials.balanceDue === 0
          ? 'paid_in_full'
          : derivedFinancials.netPaid > 0
          ? 'partially_paid'
          : 'pending',

      payment_status:
        derivedFinancials.balanceDue === 0
          ? PaymentStatus.PAID_IN_FULL
          : derivedFinancials.netPaid > 0
          ? PaymentStatus.PARTIALLY_PAID
          : PaymentStatus.PENDING,

      attending_staff_display: backendBillingMeta?.attendingStaffDisplay || null,
      attending_staff_name: backendBillingMeta?.attendingStaffName || null,
      attending_staff_role: backendBillingMeta?.attendingStaffRole || null,

      billing_data: {
        subtotal: displayBillingData.displayedSubtotal,
        discountAmount: draftBillingData.discountAmount,
        taxableAmount: Math.max(0, displayBillingData.displayedSubtotal - draftBillingData.discountAmount),
        taxTotal: displayBillingData.displayedTaxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0),
        grandTotal: derivedFinancials.grandTotal,
        totalPaid: derivedFinancials.netPaid,
        balance: derivedFinancials.balanceDue,
        taxes: displayBillingData.displayedTaxes,
      },

      payment_methods: paymentMethods.filter((m) => (Number(m.amount) || 0) > 0),
      additional_notes: combinedNotes || undefined,
      facilityData,

      persisted_charge_count: renderableChargeItems.filter((item) => item.source === 'backend').length,
      draft_charge_count: renderableChargeItems.filter((item) => item.source === 'slice').length,
    };
  }, [
    receiptNumber,
    backendBillingMeta,
    activeVisit,
    activePatient,
    renderableChargeItems,
    displayBillingData,
    draftBillingData.discountAmount,
    derivedFinancials,
    paymentMethods,
    additionalNotes,
    facilityData,
  ]);


  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    paymentMethods.forEach((method, index) => {
      if (method.type !== 'cash') return;

      const otherPaymentsTotal = paymentMethods.reduce(
        (sum, m, i) => (i === index ? sum : sum + (Number(m.amount) || 0)),
        0
      );

      const dueBefore = Math.max(0, derivedFinancials.grandTotal - otherPaymentsTotal);
      const tendered = Number(method.amount) || 0;
      const change = Math.max(0, tendered - dueBefore);

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, derivedFinancials.grandTotal]);

  /* -------------------------------------------------------------------------- */
  /*                              PRINT HANDLER                                 */
  /* -------------------------------------------------------------------------- */

  const handlePrint = useReactToPrint({
    contentRef: printReceiptRef,
    documentTitle: receiptNumber || 'receipt',
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
    derivedFinancials.balanceDue === 0 &&
    hasRequiredIds;

  const canPrint = isFinalized && !!receiptNumber && !isProcessing && !isSubmitting;

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
    const maxValue = type === 'percentage' ? 100 : draftBillingData.subtotal;
    const clampedValue = clamp(numericValue, 0, maxValue);

    const updatedDiscount = { type, value: clampedValue };
    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: typeof paymentMethods) => {
    if (isReadOnly) return;

    setLocalPaymentMethods(updatedMethods);

    updatedMethods.forEach((method, index) => {
      dispatch(
        updatePaymentMethod({
          index,
          method: {
            type: method.type,
            amount: Number(method.amount) || 0,
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
      (sum, m, i) => (i === index ? sum : sum + (Number(m.amount) || 0)),
      0
    );

    const remainingBalance = Math.max(0, derivedFinancials.grandTotal - otherPaymentsTotal);
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], amount: remainingBalance };

    setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;

    const updatedMethods = [...paymentMethods, { type: 'cash' as const, amount: 0, details: '' }];
    setFocusedAmountInputs((prev) => ({ ...prev, [updatedMethods.length - 1]: false }));
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
    if (method.type !== 'mobile') return;

    const phoneNumber = (method.details || '').trim();
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

  /**
   * Finalization sends:
   * - draft charge items only
   * - current payment methods
   * - draft billing calculations
   *
   * Backend will merge into an editable existing cycle if one already exists.
   * This supports:
   * - existing persisted balance + new draft items
   * - existing persisted balance + payment only
   */
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
        charge_items: draftChargeItems.map((item) => ({
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
          type: discount.type === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
          value: discount.value,
          reason: discount.reason || additionalNotes || undefined,
        },
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: draftBillingData.taxes[index]?.amount || 0,
        })),
        payment_methods: paymentMethods
          .filter((m) => (Number(m.amount) || 0) > 0)
          .map((m) => ({
            type: m.type,
            amount: Number(m.amount),
            reference: m.details || undefined,
            details: m.details || undefined,
          })),
        billing_data: {
          subtotal: draftBillingData.subtotal,
          discountAmount: draftBillingData.discountAmount,
          taxableAmount: draftBillingData.taxableAmount,
          taxTotal: draftBillingData.taxTotal,
          grandTotal: draftBillingData.grandTotal,
          totalPaid: draftBillingData.totalPaid,
          balance: draftBillingData.balance,
        },
        additional_notes: additionalNotes || undefined,
        status: status,
        payment_status:
          derivedFinancials.balanceDue === 0
            ? PaymentStatus.PAID_IN_FULL
            : derivedFinancials.netPaid > 0
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
  /*                              RENDER                                        */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* Missing data warning */}
      {!hasRequiredIds && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg border border-red-500 no-print">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Unable to finalize billing: {!visitId ? 'Visit ID missing' : 'Patient ID missing'}
          </span>
        </div>
      )}

      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400 no-print">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Read-only mode - Payment settled</span>
        </div>
      )}

      {/* Source badges */}
      <div className="absolute top-4 right-8 z-10 flex gap-2 no-print">
        {backendBillingMeta.hasBilling && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800">
            <Database className="w-3.5 h-3.5" />
            <span>Persisted billing loaded</span>
          </div>
        )}
        {draftChargeItems.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>{draftChargeItems.length} draft item{draftChargeItems.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      {/* Print styles */}
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
        {/* LEFT: Receipt Preview */}
        <ReceiptPreviewSection
          colors={colors}
          isReadOnly={isReadOnly}
          status={status}
          receiptNumber={receiptNumber}
          receiptRef={printReceiptRef}
          selectedTransaction={selectedTransactionForReceipt}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={additionalNotes}
          billingData={{
            ...draftBillingData,
            subtotal: displayBillingData.displayedSubtotal,
            grandTotal: derivedFinancials.grandTotal,
            balance: derivedFinancials.balanceDue,
            totalPaid: derivedFinancials.netPaid,
          }}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        {/* RIGHT: Billing controls */}
        <BillingControlsSection
          colors={colors}
          isReadOnly={isReadOnly}
          paymentMethods={paymentMethods}
          focusedAmountInputs={focusedAmountInputs}
          cashChangeByIndex={cashChangeByIndex}
          discount={discount}
          billingData={{
            ...draftBillingData,
            subtotal: displayBillingData.displayedSubtotal,
            grandTotal: derivedFinancials.grandTotal,
            balance: derivedFinancials.balanceDue,
            totalPaid: derivedFinancials.netPaid,
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
      </div>
    </div>
  );
};