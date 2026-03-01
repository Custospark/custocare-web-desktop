// BillingSummaryStep.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  AlertCircle,
  Shield,
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
  selectChargeItems,
  selectBillingStatus,
  selectIsProcessing,
  selectBillingData,
  saveDraft,
} from './billingSlice';
import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_TAXES,
} from './billing-types';
import {
  selectActiveVisitId,
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';
import { useFinalizeBilling } from '../../../api/billable-items/BillableItemsQueries';
import { useGetFacilityIdentity } from '../../../api/facility/FacilityQueries';
import type { BillingSubmissionPayload } from '../../../api/billable-items/BillingItemsTypes';
import { PaymentStatus, DiscountType, type Tax, type PaymentMethod } from '../../../api/billing-review/BillingReviewTypes';
import { type ChargeItem } from './billing-types';

// Import the modular components
import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

// Shape that matches what PrintableReceipt expects (simpler than full BillingReviewItem)
interface ReceiptTransactionShape {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: ChargeItem[];
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
  [key: string]: any; // Allow any other properties
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

  // ─── Single ref – points to the VISIBLE receipt inside ReceiptPreviewSection.
  // react-to-print will capture exactly what the user sees.
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Retrieve from Redux store
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);

  // Use props if provided, otherwise fall back to Redux store
  const visitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const patientId = propPatientId ?? activeVisit?.patient_id;

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  // Facility data
  const { data: facilityData } = useGetFacilityIdentity();

  // Determine if we're in read-only mode (settled status)
  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  // Local UI state
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Track focused amount inputs to clear default zero values
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  // Validation: Check if required IDs are available
  const hasRequiredIds = visitId != null && patientId != null;

  // ─── Finalize billing mutation ───────────────────────────────────────────────
  const { mutate: submitBilling, isPending: isSubmitting } = useFinalizeBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber = response.data.receipt_number;
      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(saveDraft());
      dispatch(setProcessing(false));
      console.log('Billing finalized successfully:', response);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  // Load receipt number from state or generate on settlement
  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      const generatedReceiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
    }
  }, [status, receiptNumber]);

  /* -------------------------------------------------------------------------- */
  /*                            DERIVED FINANCIALS                              */
  /* -------------------------------------------------------------------------- */

  // Calculate derived financials for receipt display
  const derivedFinancials = useMemo((): DerivedFinancials => {
    const { subtotal, discountAmount, taxTotal, grandTotal } = billingData;

    const totalPaidFromMethods = paymentMethods.reduce(
      (sum, m) => sum + (Number(m.amount) || 0), 0
    );

    const cashTendered = paymentMethods
      .filter(m => m.type === 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const nonCashTotal = paymentMethods
      .filter(m => m.type !== 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount = cashTendered > remainingAfterNonCash
      ? cashTendered - remainingAfterNonCash
      : 0;

    const netPaid = totalPaidFromMethods - changeAmount;
    const balanceDue = Math.max(0, grandTotal - netPaid);

    // Determine payment status
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
  }, [billingData, paymentMethods, discount]);

  // Calculate cash breakdown for receipt
  const cashBreakdown = useMemo((): CashBreakdown | null => {
    if (!derivedFinancials.hasCashPayment || derivedFinancials.cashTendered === 0) return null;

    const { grandTotal, nonCashTotal, cashTendered } = derivedFinancials;
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change = cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;
    const netCash = cashTendered - change;

    return { tendered: cashTendered, change, netCash };
  }, [derivedFinancials]);

  // Build the transaction object that feeds the receipt preview (and print)
  const selectedTransactionForReceipt: ReceiptTransactionShape = useMemo(() => ({
    receipt_number: receiptNumber,
    patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
    patient_number: activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A',
    created_at: new Date().toISOString(),
    charge_items: chargeItems,
    billing_data: {
      ...billingData,
      taxes: DEFAULT_TAXES.map((tax, index) => ({
        name: tax.name,
        rate: tax.rate,
        amount: billingData.taxes[index]?.amount || 0,
      })),
    },
    payment_methods: paymentMethods.filter(m => (Number(m.amount) || 0) > 0),
    additional_notes: additionalNotes,
    facilityData,
  }), [receiptNumber, activeVisit, activePatient, chargeItems, billingData, paymentMethods, additionalNotes, facilityData]);

  // Calculate cash change per payment-method row (for UI controls)
  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    paymentMethods.forEach((method, index) => {
      if (method.type !== 'cash') return;

      const otherPaymentsTotal = paymentMethods.reduce(
        (sum, m, i) => (i === index ? sum : sum + (Number(m.amount) || 0)), 0
      );

      const dueBefore = Math.max(0, billingData.grandTotal - otherPaymentsTotal);
      const tendered = Number(method.amount) || 0;
      const change = Math.max(0, tendered - dueBefore);

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, billingData.grandTotal]);

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

  const canFinalize = !isProcessing && !isSubmitting && !isReadOnly && 
    chargeItems.length > 0 && billingData.balance === 0 && hasRequiredIds;
  
  const canPrint = isFinalized && !!receiptNumber && !isProcessing && !isSubmitting;

  const paymentIcon = (type: string) => {
    switch (type) {
      case 'cash': return <FaCashRegister className="w-4 h-4 text-green-500" />;
      case 'card': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'insurance': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'mobile': return <Banknote className="w-4 h-4 text-yellow-500" />;
      default: return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              EVENT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handleDiscountChange = (type: 'percentage' | 'fixed', rawValue: string) => {
    if (isReadOnly) return;
    const numericValue = Number(rawValue) || 0;
    const maxValue = type === 'percentage' ? 100 : billingData.subtotal;
    const clampedValue = clamp(numericValue, 0, maxValue);
    const updatedDiscount = { type, value: clampedValue };
    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: typeof paymentMethods) => {
    if (isReadOnly) return;
    setLocalPaymentMethods(updatedMethods);
    updatedMethods.forEach((method, index) => {
      dispatch(updatePaymentMethod({
        index,
        method: { 
          type: method.type, 
          amount: Number(method.amount) || 0, 
          details: method.details 
        },
      }));
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
      (sum, m, i) => (i === index ? sum : sum + (Number(m.amount) || 0)), 0
    );
    const remainingBalance = Math.max(0, billingData.grandTotal - otherPaymentsTotal);
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], amount: remainingBalance };
    setFocusedAmountInputs(prev => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;
    const updatedMethods = [...paymentMethods, { type: 'cash' as const, amount: 0, details: '' }];
    setFocusedAmountInputs(prev => ({ ...prev, [updatedMethods.length - 1]: false }));
    syncPaymentMethodsToRedux(updatedMethods);
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
    syncPaymentMethodsToRedux(updatedMethods);
    dispatch(removePaymentMethod(index));
  };

  const handleMobilePhoneChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;
    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { 
      ...updatedMethods[index], 
      details: onlyDigits(rawValue) 
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
      await new Promise(resolve => setTimeout(resolve, 900));
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
        charge_items: chargeItems.map(item => ({
          service_key: item.service.code || `item_${item.id}`,
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
          reason: additionalNotes || undefined,
        },
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: billingData.taxes[index]?.amount || 0,
        })),
        payment_methods: paymentMethods
          .filter(m => (Number(m.amount) || 0) > 0)
          .map(m => ({
            type: m.type,
            amount: Number(m.amount),
            reference: m.details || undefined,
            details: m.details || undefined,
          })),
        billing_data: {
          subtotal: billingData.subtotal,
          discountAmount: billingData.discountAmount,
          taxableAmount: billingData.taxableAmount,
          taxTotal: billingData.taxTotal,
          grandTotal: billingData.grandTotal,
          totalPaid: billingData.totalPaid,
          balance: billingData.balance,
        },
        additional_notes: additionalNotes || undefined,
        status,
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
      setFocusedAmountInputs(prev => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (paymentMethods[index]?.amount === 0) {
      setFocusedAmountInputs(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (discount.value === 0) setLocalDiscount(p => ({ ...p, value: 0 }));
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
        {/* LEFT: Receipt Preview — receiptRef is printReceiptRef so print captures this */}
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
          billingData={billingData}
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
          billingData={billingData}
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