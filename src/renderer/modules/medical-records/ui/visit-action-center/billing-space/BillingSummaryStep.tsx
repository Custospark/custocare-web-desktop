// BillingSummaryStep.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Shield,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
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
import { PaymentStatus } from '../../../api/billing-review/BillingReviewTypes';
import {
  selectActiveVisitId,
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';
import { useFinalizeBilling } from '../../../api/billable-items/BillableItemsQueries';
import type { BillingSubmissionPayload } from '../../../api/billable-items/BillingItemsTypes';
import type { BillingReviewItem } from '../../../api/billing-review/BillingReviewTypes';
import { BillingControlsSection } from './billing-summary/BillingControlsSection';
import { ReceiptPreviewSection } from './billing-summary/ReceiptPreviewSection';

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
  visitId?: number;
  patientId?: number;
}

const clamp = (n: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, n));

const onlyDigits = (v: string) => v.replace(/[^\d]/g, '');

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({
  theme = 'light',
  visitId: propVisitId,
  patientId: propPatientId,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Retrieve from Redux store
  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);

  const visitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const patientId = propPatientId ?? activeVisit?.patient_id;

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const isReadOnly = status === 'settled';

  // Local UI state
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const hasRequiredIds = visitId != null && patientId != null;

  // Track focused amount inputs
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

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

  // Initialize the finalize billing mutation
  const { mutate: submitBilling, isPending: isSubmitting } = useFinalizeBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber = response.data.receipt_number;
      setReceiptNumber(generatedReceiptNumber);

      dispatch(finalizePayment());
      dispatch(saveDraft());

      console.log('Billing finalized successfully:', response);
    },
    onError: (error) => {
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

  // Calculate derived financials for PrintableReceipt
  const derivedFinancials = useMemo(() => {
    const totalPaidFromMethods = paymentMethods.reduce(
      (sum, method) => sum + (Number(method.amount) || 0),
      0
    );

    const cashPayments = paymentMethods.filter((m) => m.type === 'cash');
    const hasCashPayment = cashPayments.length > 0;
    const cashTendered = cashPayments.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const nonCashTotal = paymentMethods
      .filter((m) => m.type !== 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const cashDue = Math.max(0, billingData.grandTotal - nonCashTotal);
    const changeAmount = Math.max(0, cashTendered - cashDue);

    return {
      status: status as PaymentStatus,
      refunded: 0,
      netPaid: totalPaidFromMethods - changeAmount,
      balanceDue: billingData.balance,
      grandTotal: billingData.grandTotal,
      subtotal: billingData.subtotal,
      discountAmount: billingData.discountAmount,
      discountPercent: discount.type === 'percentage' ? discount.value : 0,
      discountType: discount.type,
      taxTotal: billingData.taxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment,
      nonCashTotal,
    };
  }, [billingData, paymentMethods, status, discount]);

  // Calculate cash breakdown for PrintableReceipt
  const cashBreakdown = useMemo(() => {
    const cashPayments = paymentMethods.filter((m) => m.type === 'cash');
    if (cashPayments.length === 0) return null;

    const tendered = cashPayments.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const nonCashTotal = paymentMethods
      .filter((m) => m.type !== 'cash')
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const cashDue = Math.max(0, billingData.grandTotal - nonCashTotal);
    const change = Math.max(0, tendered - cashDue);
    const netCash = tendered - change;

    return { tendered, change, netCash };
  }, [paymentMethods, billingData.grandTotal]);

  //// Build selectedTransaction object for PrintableReceipt
const selectedTransaction: BillingReviewItem = useMemo(() => {
  const patientDisplayName =
    activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient';
  const patientNumber =
    activeVisit?.patient?.patient_number || activePatient?.patient_number || 'N/A';

  // Get current timestamp
  const now = new Date().toISOString();

  return {
    // Core identifiers
    id: visitId || 0,
    visit_id: visitId || 0,
    visit_uuid: activeVisit?.visit_uuid || `temp_${Date.now()}`,
    patient_id: patientId || 0,
    patient_number: patientNumber,
    patient_name: patientDisplayName,
    
    // Billing cycle info
    billing_cycle_id: null,
    billing_cycle_uuid: null,
    
    // Receipt info
    receipt_number: receiptNumber || null,
    
    // Billing status
    has_billing: status === 'settled',
    payment_status: status === 'settled' ? PaymentStatus.PAID_IN_FULL : 
                   (billingData.balance === 0 ? PaymentStatus.PAID_IN_FULL : 
                    (billingData.balance < billingData.grandTotal ? PaymentStatus.PENDING : 
                     PaymentStatus.NOT_BILLED)),
    
    // Items and charges
    charge_items: chargeItems.map((item) => ({
      id: item.id,
      service: {
        id: item.service.id,
        code: item.service.code,
        name: item.service.name,
        unitPrice: item.service.unitPrice,
        category: item.service.category,
      },
      quantity: item.quantity,
      totalAmount: item.totalAmount,
    })),
    
    // Discount
    discount: {
      type: discount.type,
      value: discount.value,
      reason: additionalNotes || undefined,
    },
    
    // Taxes
    taxes: DEFAULT_TAXES.map((tax, index) => ({
      name: tax.name,
      rate: tax.rate,
      amount: billingData.taxes[index]?.amount || 0,
    })),
    
    // Payment methods
    payment_methods: paymentMethods
      .filter((method) => (Number(method.amount) || 0) > 0)
      .map((method) => ({
        type: method.type,
        amount: Number(method.amount),
        reference: method.details || undefined,
        details: method.details ? { phone: method.details } : undefined,
      })),
    
    // Billing data
    billing_data: {
      subtotal: billingData.subtotal,
      discountAmount: billingData.discountAmount,
      taxableAmount: billingData.taxableAmount,
      taxTotal: billingData.taxTotal,
      grandTotal: billingData.grandTotal,
      totalPaid: derivedFinancials.netPaid,
      balance: billingData.balance,
      taxes: DEFAULT_TAXES.map((tax, index) => ({
        name: tax.name,
        rate: tax.rate,
        amount: billingData.taxes[index]?.amount || 0,
      })),
    },
    
    // Additional fields
    additional_notes: additionalNotes || '',
    
    // Timestamps
    billed_at: status === 'settled' ? now : null,
    created_at: now,
    updated_at: now,
    
    // UI state flags
    last_updated: Date.now(),
    is_dirty: false,
    is_processing: isProcessing,
  };
}, [
  visitId,
  patientId,
  receiptNumber,
  activeVisit,
  activePatient,
  chargeItems,
  billingData,
  derivedFinancials,
  paymentMethods,
  discount,
  status,
  additionalNotes,
  isProcessing,
]);
  // Calculate cash change for each cash payment method (for controls UI)
  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    paymentMethods.forEach((method, index) => {
      if (method.type !== 'cash') return;

      const otherPaymentsTotal = paymentMethods.reduce(
        (sum, currentMethod, currentIndex) =>
          currentIndex === index ? sum : sum + (Number(currentMethod.amount) || 0),
        0
      );

      const dueBefore = Math.max(0, billingData.grandTotal - otherPaymentsTotal);
      const tendered = Number(method.amount) || 0;
      const change = Math.max(0, tendered - dueBefore);

      result[index] = { dueBefore, change };
    });

    return result;
  }, [paymentMethods, billingData.grandTotal]);

  const canFinalize =
    !isProcessing &&
    !isSubmitting &&
    !isReadOnly &&
    chargeItems.length > 0 &&
    billingData.balance === 0 &&
    hasRequiredIds;
  const canPrint =
    (status === 'settled' || status === 'ready') &&
    !!receiptNumber &&
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
    const currentMethod = updatedMethods[index];

    updatedMethods[index] = {
      ...currentMethod,
      type: newType as any,
    };

    if (newType === 'mobile' && !updatedMethods[index].details) {
      updatedMethods[index].details = '';
    }

    if (newType === 'mobile') {
      const otherPaymentsTotal = paymentMethods.reduce(
        (sum, method, i) => (i === index ? sum : sum + (Number(method.amount) || 0)),
        0
      );
      const remainingBalance = Math.max(0, billingData.grandTotal - otherPaymentsTotal);

      updatedMethods[index].amount = remainingBalance;
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
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
      (sum, method, i) => (i === index ? sum : sum + (Number(method.amount) || 0)),
      0
    );
    const remainingBalance = Math.max(0, billingData.grandTotal - otherPaymentsTotal);

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = { ...updatedMethods[index], amount: remainingBalance };

    setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;

    const updatedMethods = [
      ...paymentMethods,
      {
        type: 'cash' as const,
        amount: 0,
        details: '',
      },
    ];

    setFocusedAmountInputs((prev) => ({ ...prev, [updatedMethods.length - 1]: false }));
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

    const phoneNumber = onlyDigits(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      details: phoneNumber,
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
        charge_items: chargeItems.map((item) => ({
          service_key: item.service.code || `item_${item.id}`,
          service: {
            id: item.service.id,
            code: item.service.code,
            name: item.service.name,
            unitPrice: item.service.unitPrice,
            category: item.service.category,
          },
          quantity: item.quantity,
          totalAmount: item.totalAmount,
        })),
        discount: {
          type: discount.type,
          value: discount.value,
          reason: additionalNotes || undefined,
        },
        taxes: DEFAULT_TAXES.map((tax, index) => ({
          name: tax.name,
          rate: tax.rate,
          amount: billingData.taxes[index]?.amount || 0,
        })),
        payment_methods: paymentMethods
          .filter((method) => (Number(method.amount) || 0) > 0)
          .map((method) => ({
            type: method.type,
            amount: Number(method.amount),
            reference: method.details || undefined,
            details: method.details || undefined,
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
        status: status,
      };

      submitBilling(payload);
    } catch (error) {
      console.error('Payment processing failed:', error);
      dispatch(setProcessing(false));
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handlePrintReceipt = () => {
    if (!canPrint) return;

    setIsPrinting(true);
    dispatch(setProcessing(true));

    // Small delay to ensure print styles are applied
    setTimeout(() => {
      window.print();

      // Reset after print dialog closes (user prints or cancels)
      setTimeout(() => {
        setIsPrinting(false);
        dispatch(setProcessing(false));
      }, 500);
    }, 100);
  };

  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  const handleFocusAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (!focusedAmountInputs[index]) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly) return;
    if (paymentMethods[index].amount === 0) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (discount.value === 0) setLocalDiscount((p) => ({ ...p, value: 0 }));
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* Missing data warning */}
      {!hasRequiredIds && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg border border-red-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">
            Unable to finalize billing: {!visitId ? 'Visit ID missing' : 'Patient ID missing'}
          </span>
        </div>
      )}

      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Read-only mode - Payment settled</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT: Receipt Preview using ReceiptPreviewSection component */}
        <ReceiptPreviewSection
          colors={colors}
          isReadOnly={isReadOnly}
          status={status}
          receiptNumber={receiptNumber}
          receiptRef={receiptRef}
          selectedTransaction={selectedTransaction}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashBreakdown}
          isPrinting={isPrinting}
          additionalNotes={additionalNotes}
          billingData={billingData}
          onAdditionalNotesChange={handleAdditionalNotesChange}
        />

        {/* RIGHT: Billing controls using BillingControlsSection component */}
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

      {/* Print styles - same approach as PrintView */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            
            .receipt-print,
            .receipt-print * {
              visibility: visible;
            }
            
            .receipt-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            
            /* Hide non-receipt elements during print */
            button,
            .no-print {
              display: none !important;
            }
            
            /* Optimize receipt for printing */
            .receipt-print {
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};
