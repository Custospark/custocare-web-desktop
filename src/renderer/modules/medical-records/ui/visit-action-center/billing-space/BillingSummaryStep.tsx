// BillingSummaryStep.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Printer,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  Phone,
  Zap,
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
  formatCurrency,
  DEFAULT_TAXES,
} from './billing-types';

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
}

const clamp = (n: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, n));

const onlyDigits = (v: string) => v.replace(/[^\d]/g, '');

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  // Determine if we're in read-only mode (settled status)
  const isReadOnly = status === 'settled';

  // Local UI state
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Load receipt number from state or generate on settlement
  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      const generatedReceiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
    }
  }, [status, receiptNumber]);

  // Track focused amount inputs to clear default zero values
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

  const canFinalize = !isProcessing && !isReadOnly && chargeItems.length > 0 && billingData.balance === 0;

  const canPrint = (status === 'settled' || status === 'ready') && !!receiptNumber && !isProcessing;

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

  // Calculate cash change for each cash payment method
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

  const paidMethods = useMemo(
    () => paymentMethods.filter((method) => (Number(method.amount) || 0) > 0),
    [paymentMethods]
  );

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

    // When switching to mobile payment, initialize phone details if empty
    if (newType === 'mobile' && !updatedMethods[index].details) {
      updatedMethods[index].details = '';
    }

    // Auto-fill remaining balance when selecting mobile payment
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
    if (!canFinalize) return;

    dispatch(setProcessing(true));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const generatedReceiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(saveDraft());
    } catch (error) {
      console.error('Payment processing failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handlePrintReceipt = () => {
    if (!canPrint) return;

    dispatch(setProcessing(true));
    setTimeout(() => {
      dispatch(setProcessing(false));
      window.print();
    }, 350);
  };

  // Get display value for amount input (clear zero when focused)
  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="absolute top-20 right-8 z-10 flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white dark:bg-blue-600 dark:text-white rounded-full shadow-md border border-blue-500 dark:border-blue-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Read-only mode - Payment settled</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT: Receipt (scroll) + Taxes (static) */}
        <div className="flex flex-col h-full min-h-0">
          <div
            className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
              isReadOnly ? 'opacity-90' : ''
            }`}
          >
            {/* Fixed header */}
            <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Receipt Preview</h3>
                  <p className={`text-xs ${colors.text.secondary} truncate`}>
                    {isReadOnly
                      ? 'Payment completed - receipt finalized'
                      : 'Live updates as you adjust discount, taxes, and payment'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap ${
                      status === 'draft'
                        ? colors.status.draft
                        : status === 'ready'
                        ? colors.status.ready
                        : colors.status.settled
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded border ${colors.border.primary} ${colors.bg.secondary} ${colors.text.primary}`}
                  >
                    {receiptNumber ? `# ${receiptNumber}` : '# Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable receipt */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
              style={{ scrollbarGutter: 'stable' }}
            >
              <div className="mx-auto w-full max-w-[360px] sm:max-w-[420px]">
                <div
                  className={`border ${colors.border.receipt} ${colors.bg.receipt} text-black p-4 sm:p-5 rounded shadow-md`}
                >
                  {/* Receipt Header */}
                  <div className="text-center mb-4">
                    <h2 className="text-lg sm:text-xl font-extrabold leading-tight">MEDICAL CLINIC</h2>
                    <p className="text-xs text-gray-600 mt-1">123 Health Street, Kampala</p>
                    <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
                  </div>

                  {/* Receipt Meta */}
                  <div className="border-t border-b border-gray-300 py-2 my-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receipt:</span>
                      <span className="font-bold">{receiptNumber || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-3">
                    <h3 className="text-sm font-extrabold mb-2">Services Rendered</h3>
                    {chargeItems.length === 0 ? (
                      <div className="text-xs text-gray-600 italic py-2">No items added yet</div>
                    ) : (
                      <div className="space-y-2">
                        {chargeItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs border-b border-gray-100 pb-1.5">
                            <div className="min-w-0 pr-2 flex-1">
                              <p className="font-semibold truncate">{item.service.name}</p>
                              <p className="text-[11px] text-gray-600">
                                {item.quantity} × {formatCurrency(item.service.unitPrice)}
                              </p>
                            </div>
                            <span className="font-extrabold flex-shrink-0">{formatCurrency(item.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-300 pt-2 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(billingData.subtotal)}</span>
                    </div>

                    {discount.value > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span className="font-semibold">-{formatCurrency(billingData.discountAmount)}</span>
                      </div>
                    )}

                    {DEFAULT_TAXES.map((tax, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tax.name}</span>
                        <span className="font-semibold">{formatCurrency(billingData.taxes[index]?.amount || 0)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between font-extrabold text-sm mt-2 pt-2 border-t border-gray-300">
                      <span>TOTAL</span>
                      <span>{formatCurrency(billingData.grandTotal)}</span>
                    </div>

                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Status</span>
                      <span
                        className={`font-extrabold ${
                          isReadOnly
                            ? 'text-blue-700'
                            : billingData.balance === 0
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {isReadOnly ? 'SETTLED' : billingData.balance === 0 ? 'PAID' : `DUE ${formatCurrency(billingData.balance)}`}
                      </span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
                    <h3 className="text-sm font-extrabold mb-2">Payment</h3>

                    {paidMethods.length === 0 ? (
                      <div className="text-xs text-gray-600 italic">No payments entered</div>
                    ) : (
                      <div className="space-y-1.5">
                        {paidMethods.map((method, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="capitalize">{method.type}</span>
                            <span className="font-semibold">{formatCurrency(method.amount)}</span>
                          </div>
                        ))}

                        {paymentMethods.map((method, index) => {
                          if (method.type !== 'cash') return null;
                          const cashCalculation = cashChangeByIndex[index];
                          if (!cashCalculation) return null;

                          const tendered = Number(method.amount) || 0;
                          if (!focusedAmountInputs[index] && tendered === 0) return null;

                          return (
                            <div key={`cash-change-${index}`} className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cash due</span>
                                <span className="font-semibold">{formatCurrency(cashCalculation.dueBefore)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cash tendered</span>
                                <span className="font-semibold">{formatCurrency(tendered)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Change</span>
                                <span className="font-extrabold">{formatCurrency(cashCalculation.change)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-4 pt-3 border-t border-gray-300">
                    <p className="text-[11px] text-gray-600">Computer generated receipt</p>
                    <p className="text-[11px] text-gray-600">Valid without signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Taxes and Additional Notes section */}
            <div className={`flex-shrink-0 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              {/* Additional Notes */}
              <div className="px-4 py-3">
                <label className={`block text-sm font-bold mb-1 ${colors.text.primary}`}>
                  Additional Notes <span className={`text-xs font-normal ${colors.text.secondary}`}>(optional)</span>
                </label>

                <textarea
                  value={additionalNotes}
                  onChange={(e) => handleAdditionalNotesChange(e.target.value)}
                  placeholder="E.g. patient paid in two installments, waived consultation fee…"
                  rows={2}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm border ${
                    isReadOnly
                      ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                  } rounded-lg transition-shadow resize-none`}
                />
              </div>

              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-bold ${colors.text.primary}`}>Taxes</div>
                  <div className={`text-xs ${colors.text.secondary}`}>Auto-calculated</div>
                </div>

                <div className="space-y-2">
                  {DEFAULT_TAXES.map((tax, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 border ${colors.border.primary} ${colors.bg.primary} rounded-lg ${
                        isReadOnly ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${colors.text.primary}`}>{tax.name}</p>
                        <p className={`text-xs ${colors.text.secondary}`}>{tax.rate}% rate</p>
                      </div>
                      <p className={`text-sm font-extrabold ${colors.text.primary}`}>
                        {formatCurrency(billingData.taxes[idx]?.amount || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Left footer info */}
            <div className={`flex-shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
                <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
                  {isReadOnly
                    ? 'Payment completed. Receipt is finalized and ready for printing.'
                    : 'Receipt preview updates in real-time. Final totals include taxes and discount.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Billing controls */}
        <div className="flex flex-col h-full min-h-0">
          <div
            className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
              isReadOnly ? 'opacity-90' : ''
            }`}
          >
            {/* Fixed header */}
            <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                {isReadOnly ? 'Payment Details (Read-only)' : 'Billing Controls'}
              </h3>
              <p className={`text-xs ${colors.text.secondary} mt-0.5`}>
                {isReadOnly
                  ? 'Payment has been finalized. Only receipt printing is available.'
                  : 'Enter cash tendered amount → system automatically calculates change'}
              </p>
            </div>

            {/* Scrollable controls content */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 space-y-4"
              style={{ scrollbarGutter: 'stable' }}
            >
              {/* Payment methods section */}
              <div className={`border ${colors.border.primary} rounded-lg overflow-hidden shadow-sm`}>
                <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h4 className={`text-sm font-bold ${colors.text.primary}`}>Payment Methods</h4>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleAddPaymentMethod}
                        disabled={paymentMethods.length >= 3}
                        className={`text-xs font-semibold px-3 py-1.5 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                        transition-all duration-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm active:scale-95`}
                      >
                        + Add Method
                      </button>
                    )}
                  </div>
                </div>

                <div className={`p-4 space-y-3 ${colors.bg.secondary}`}>
                  {paymentMethods.map((method, index) => {
                    const isMobile = method.type === 'mobile';
                    const isCash = method.type === 'cash';
                    const cashCalculation = isCash ? cashChangeByIndex[index] : undefined;
                    const tendered = Number(method.amount) || 0;
                    const showCashCalculation = isCash && (focusedAmountInputs[index] || tendered > 0);

                    return (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm ${
                          isReadOnly ? 'bg-opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {paymentIcon(method.type)}
                            <div
                              className={`border ${
                                isReadOnly ? colors.border.disabled : colors.select.border
                              } ${colors.select.wrap} px-2.5 py-1.5 rounded`}
                            >
                              <select
                                value={method.type}
                                onChange={(e) => handlePaymentTypeChange(index, e.target.value)}
                                disabled={isReadOnly}
                                className={`text-sm ${
                                  isReadOnly
                                    ? `${colors.select.disabled} cursor-not-allowed`
                                    : `${colors.select.text} cursor-pointer`
                                } bg-transparent capitalize outline-none`}
                              >
                                <option className={colors.select.option} value="cash">
                                  Cash
                                </option>
                                <option className={colors.select.option} value="card">
                                  Card
                                </option>
                                <option className={colors.select.option} value="insurance">
                                  Insurance
                                </option>
                                <option className={colors.select.option} value="mobile">
                                  Mobile Money
                                </option>
                                <option className={colors.select.option} value="mixed">
                                  Mixed
                                </option>
                              </select>
                            </div>
                          </div>

                          {!isReadOnly && paymentMethods.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentMethod(index)}
                              className={`p-2 ${colors.bg.hover} ${colors.text.secondary} transition-all duration-200 rounded cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600`}
                              aria-label="Remove payment method"
                              title="Remove"
                            >
                              <span className="text-lg leading-none">×</span>
                            </button>
                          )}
                        </div>

                        {/* Mobile phone input */}
                        {isMobile && (
                          <div className="mb-3 grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-8">
                              <div className="relative">
                                <Phone
                                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                    isReadOnly ? colors.text.disabled : colors.text.tertiary
                                  } pointer-events-none`}
                                />
                                <input
                                  type="tel"
                                  value={method.details || ''}
                                  onChange={(e) => handleMobilePhoneChange(index, e.target.value)}
                                  placeholder="Phone number (e.g. 2567xxxxxxx)"
                                  inputMode="numeric"
                                  readOnly={isReadOnly}
                                  disabled={isReadOnly}
                                  className={`w-full pl-10 pr-3 py-2.5 text-sm border ${
                                    isReadOnly
                                      ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                                  } rounded-lg transition-shadow`}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-4">
                              <button
                                type="button"
                                onClick={() => handleInitiateMobilePayment(index)}
                                disabled={isProcessing || isReadOnly}
                                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg
                                ${
                                  isProcessing || isReadOnly
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                                <span>Initiate</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Amount input */}
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={getDisplayAmount(index, method.amount)}
                            onFocus={() => {
                              if (isReadOnly) return;
                              if (!focusedAmountInputs[index]) {
                                setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
                              }
                            }}
                            onBlur={() => {
                              if (isReadOnly) return;
                              if (method.amount === 0) {
                                setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
                              }
                            }}
                            onChange={(e) => {
                              if (isReadOnly) return;
                              if (!focusedAmountInputs[index]) {
                                setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
                              }
                              handlePaymentAmountChange(index, e.target.value);
                            }}
                            placeholder={isCash ? 'Enter cash amount' : 'Enter amount'}
                            min={0}
                            step="0.01"
                            readOnly={isReadOnly}
                            disabled={isReadOnly}
                            className={`w-full px-3.5 py-2.5 text-sm border ${
                              isReadOnly
                                ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                                : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                            } rounded-lg transition-shadow`}
                          />

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleAutoFillRemaining(index)}
                              className={`w-full text-xs font-semibold px-3 py-2 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                              transition-all duration-200 rounded-lg cursor-pointer hover:shadow-sm active:scale-98`}
                            >
                              Fill Remaining Balance
                            </button>
                          )}

                          {/* Cash calculation */}
                          {showCashCalculation && cashCalculation && (
                            <div className={`p-3 sm:p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-lg`}>
                              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                  <p className={`text-xs ${colors.text.secondary} mb-1`}>Due</p>
                                  <p className={`text-sm sm:text-base font-extrabold ${colors.text.primary}`}>
                                    {formatCurrency(cashCalculation.dueBefore)}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${colors.text.secondary} mb-1`}>Tendered</p>
                                  <p className={`text-sm sm:text-base font-extrabold ${colors.text.primary}`}>
                                    {formatCurrency(tendered)}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${colors.text.secondary} mb-1`}>Change</p>
                                  <p className="text-sm sm:text-base font-extrabold text-green-600 dark:text-green-400">
                                    {formatCurrency(cashCalculation.change)}
                                  </p>
                                </div>
                              </div>

                              {!isReadOnly && tendered < cashCalculation.dueBefore && (
                                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-600 text-white dark:bg-yellow-500 dark:text-white">
                                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                                  <p className="text-sm font-medium">
                                    Insufficient cash by{' '}
                                    <span className="font-bold underline decoration-white/60">
                                      {formatCurrency(cashCalculation.dueBefore - tendered)}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Discount section - only show on last payment method */}
                          {index === paymentMethods.length - 1 && (
                            <div className={`mt-3 pt-3 border-t ${colors.border.primary}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`text-sm font-bold ${colors.text.primary}`}>Discount</div>
                                <div className={`text-xs ${colors.text.secondary}`}>
                                  {discount.value > 0 ? `Applied: ${formatCurrency(billingData.discountAmount)}` : 'Not applied'}
                                </div>
                              </div>

                              {!isReadOnly ? (
                                <div className="flex items-stretch gap-2">
                                  <input
                                    type="number"
                                    value={discount.value === 0 ? '' : String(discount.value)}
                                    onFocus={() => {
                                      if (discount.value === 0) setLocalDiscount((p) => ({ ...p, value: 0 }));
                                    }}
                                    onChange={(e) => handleDiscountChange(discount.type, e.target.value)}
                                    placeholder="0"
                                    min={0}
                                    max={discount.type === 'percentage' ? 100 : billingData.subtotal}
                                    step="0.01"
                                    className={`flex-1 px-3.5 py-2.5 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                    focus:outline-none focus:ring-2 ${colors.accent.ring} rounded-lg transition-shadow`}
                                  />

                                  <div className={`flex border ${colors.border.primary} overflow-hidden rounded-lg`}>
                                    <button
                                      type="button"
                                      onClick={() => handleDiscountChange('percentage', String(discount.value))}
                                      className={`px-3 sm:px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer
                                        ${
                                          discount.type === 'percentage'
                                            ? `${colors.accent.primary} ${colors.accent.text}`
                                            : `${colors.bg.hover} ${colors.text.secondary}`
                                        }`}
                                    >
                                      %
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDiscountChange('fixed', String(discount.value))}
                                      className={`px-3 sm:px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer border-l ${colors.border.primary}
                                        ${
                                          discount.type === 'fixed'
                                            ? `${colors.accent.primary} ${colors.accent.text}`
                                            : `${colors.bg.hover} ${colors.text.secondary}`
                                        }`}
                                    >
                                      Fixed
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`p-3 ${colors.bg.secondary} rounded-lg text-sm ${colors.text.secondary}`}>
                                  {discount.value > 0
                                    ? `${discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)} discount applied`
                                    : 'No discount applied'}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={handleFinalizePayment}
                                    disabled={!canFinalize}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg shadow-sm
                                      ${
                                        !canFinalize
                                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                                          : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
                                      }`}
                                  >
                                    {isProcessing ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Finalize Payment</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={handlePrintReceipt}
                                  disabled={!canPrint}
                                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg shadow-sm
                                    ${
                                      !canPrint
                                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                                        : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-md active:scale-95`
                                    }`}
                                >
                                  <Printer className="w-4 h-4" />
                                  <span>Print Receipt</span>
                                </button>
                              </div>

                              <div className="mt-2 flex items-start gap-2">
                                <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
                                <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
                                  {isReadOnly
                                    ? 'Print receipt is available. Payment has been finalized.'
                                    : 'Print receipt is only available after finalizing payment.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fixed footer info */}
            <div className={`flex-shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
                <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
                  {isReadOnly
                    ? 'Payment completed. You can still print the receipt.'
                    : 'Receipt preview updates in real-time. Finalize when balance is fully covered.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};