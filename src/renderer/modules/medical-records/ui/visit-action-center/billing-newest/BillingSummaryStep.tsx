// BillingSummaryStep.tsx
import React, { useMemo, useState } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Loader2,
  Receipt,
  Check,
  Calculator,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import {
  setStep,
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
} from './billing-slice';
import { DEFAULT_DISCOUNT, DEFAULT_PAYMENT_METHODS, formatCurrency, DEFAULT_TAXES } from './billing-types';

interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
}

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // NOTE: cash received is UI-only for now (not in redux). It still updates receipt preview in real-time.
  const [cashReceived, setCashReceived] = useState<number>(0);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50',
      overlay: isDark ? 'bg-black/70' : 'bg-black/50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      receipt: 'bg-white',
      topbar: isDark ? 'bg-gray-900/70' : 'bg-white/70',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      receipt: 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      success: isDark ? 'text-green-400' : 'text-green-600',
      warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
    },
  };

  const canFinalize =
    !isProcessing &&
    chargeItems.length > 0 &&
    billingData.balance === 0 &&
    status !== 'settled';

  const canPrint = status === 'settled' && !!receiptNumber && !isProcessing;

  const paidLines = useMemo(
    () => paymentMethods.filter((m) => (m.amount || 0) > 0),
    [paymentMethods]
  );

  const cashMethodIndex = useMemo(
    () => paymentMethods.findIndex((m) => m.type === 'cash'),
    [paymentMethods]
  );

  const cashPayAmount = useMemo(() => {
    if (cashMethodIndex < 0) return 0;
    return Number(paymentMethods[cashMethodIndex]?.amount || 0);
  }, [paymentMethods, cashMethodIndex]);

  // Change logic:
  // - Cash received is what cashier inputs (notes given by patient)
  // - Cash due is the cash method amount (what we intend to take as cash)
  // - Change = received - due (if positive). Never negative.
  const cashChange = useMemo(() => {
    const received = Number(cashReceived || 0);
    const due = Number(cashPayAmount || 0);
    return Math.max(0, received - due);
  }, [cashReceived, cashPayAmount]);

  const cashShort = useMemo(() => {
    const received = Number(cashReceived || 0);
    const due = Number(cashPayAmount || 0);
    return Math.max(0, due - received);
  }, [cashReceived, cashPayAmount]);

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

  const handleBackToCharges = () => dispatch(setStep('charge_entry'));

  const handleDiscountChange = (type: 'percentage' | 'fixed', raw: string) => {
    const value = Number(raw) || 0;
    const max = type === 'percentage' ? 100 : billingData.subtotal;
    const clamped = Math.max(0, Math.min(max, value));

    const next = { type, value: clamped };
    setLocalDiscount(next);
    dispatch(setDiscount(next));
  };

  const handlePaymentMethodChange = (
    index: number,
    field: 'type' | 'amount' | 'details',
    value: any
  ) => {
    const next = [...paymentMethods];
    next[index] = { ...next[index], [field]: value };
    setLocalPaymentMethods(next);

    if (field === 'amount') {
      dispatch(updatePaymentMethod({ index, method: { amount: Number(value) || 0 } }));
    } else if (field === 'type') {
      dispatch(updatePaymentMethod({ index, method: { type: value } }));
    } else {
      dispatch(updatePaymentMethod({ index, method: { details: value } }));
    }
  };

  const handleAddPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;
    setLocalPaymentMethods((p) => [...p, { type: 'cash', amount: 0, details: '' }]);
    dispatch(addPaymentMethod());
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (paymentMethods.length <= 1) return;
    // If removing cash method, clear cashReceived too (avoid stale change UI)
    const isRemovingCash = paymentMethods[index]?.type === 'cash';
    if (isRemovingCash) setCashReceived(0);

    setLocalPaymentMethods((p) => p.filter((_, i) => i !== index));
    dispatch(removePaymentMethod(index));
  };

  const handleAutoFillRemaining = (index: number) => {
    const alreadyPaid = paymentMethods.reduce(
      (sum, m, i) => (i === index ? sum : sum + (m.amount || 0)),
      0
    );
    const remaining = Math.max(0, billingData.grandTotal - alreadyPaid);

    const next = [...paymentMethods];
    next[index] = { ...next[index], amount: remaining };
    setLocalPaymentMethods(next);

    dispatch(updatePaymentMethod({ index, method: { amount: remaining } }));

    // If auto-filling cash amount, make cash received default to same amount for quick close-out
    if (next[index].type === 'cash') setCashReceived(remaining);
  };

  const handleAdditionalNotesChange = (notes: string) => {
    setLocalAdditionalNotes(notes);
    dispatch(setAdditionalNotes(notes));
  };

  const handleFinalizePayment = async () => {
    // Extra guard for cash change workflow:
    // If cash payment exists and cashier entered a cash received amount that is less than cash due, block finalize.
    if (cashMethodIndex >= 0 && cashShort > 0) {
      alert(`Cash received is short by ${formatCurrency(cashShort)}. Adjust cash received or cash amount.`);
      return;
    }

    if (billingData.balance > 0) return;

    dispatch(setProcessing(true));
    try {
      await new Promise((r) => setTimeout(r, 1200));

      const receiptNum = `REC-${Date.now().toString().slice(-8)}`;
      setReceiptNumber(receiptNum);

      dispatch(finalizePayment());
      dispatch(saveDraft());
    } catch (e) {
      console.error(e);
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

  const ReceiptPreview = () => (
    <div className={`border ${colors.border.primary} ${colors.bg.primary} overflow-hidden flex flex-col min-h-0`}>
      <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Receipt preview</h3>
            <p className={`text-xs ${colors.text.secondary} truncate`}>
              Live updates • Print enabled after finalization
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`text-xs font-semibold px-2 py-1 border ${colors.border.primary} ${
                billingData.balance === 0 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}
            >
              {billingData.balance === 0 ? 'PAID' : `BAL: ${formatCurrency(billingData.balance)}`}
            </div>

            <div className={`text-xs font-semibold px-2 py-1 border ${colors.border.primary} ${colors.bg.secondary}`}>
              {receiptNumber ? `# ${receiptNumber}` : '# Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Narrower receipt "paper" and centered */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-[360px] sm:max-w-[420px]">
          <div className={`border ${colors.border.receipt} ${colors.bg.receipt} text-black p-4`}>
            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-extrabold leading-tight">MEDICAL CLINIC</h2>
              <p className="text-xs text-gray-600">123 Health Street, Kampala</p>
              <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
            </div>

            <div className="border-t border-b border-gray-300 py-2 my-3 text-xs">
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

            {/* Items */}
            <div className="mb-3">
              <h3 className="text-sm font-extrabold mb-2">Services rendered</h3>

              {chargeItems.length === 0 ? (
                <div className="text-xs text-gray-600">No items yet.</div>
              ) : (
                <div className="space-y-2">
                  {chargeItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs border-b border-gray-100 pb-1">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold truncate">{item.service.name}</p>
                        <p className="text-[11px] text-gray-600">
                          {item.quantity} × {formatCurrency(item.service.unitPrice)}
                        </p>
                      </div>
                      <span className="font-extrabold">{formatCurrency(item.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-300 pt-2 text-xs">
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

              {DEFAULT_TAXES.map((tax, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{tax.name}</span>
                  <span className="font-semibold">{formatCurrency(billingData.taxes[idx]?.amount || 0)}</span>
                </div>
              ))}

              <div className="flex justify-between font-extrabold mt-2 pt-2 border-t border-gray-300">
                <span>TOTAL</span>
                <span>{formatCurrency(billingData.grandTotal)}</span>
              </div>
            </div>

            {/* Payment + change */}
            <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
              <h3 className="text-sm font-extrabold mb-2">Payment</h3>

              {paidLines.length === 0 ? (
                <div className="text-xs text-gray-600">No payments entered.</div>
              ) : (
                <div className="space-y-1">
                  {paidLines.map((m, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="capitalize">{m.type}</span>
                      <span className="font-semibold">{formatCurrency(m.amount)}</span>
                    </div>
                  ))}

                  {/* Cash received + change lines */}
                  {cashMethodIndex >= 0 && cashPayAmount > 0 && (
                    <>
                      <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                        <span className="text-gray-600">Cash received</span>
                        <span className="font-semibold">{formatCurrency(cashReceived || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Change</span>
                        <span className="font-extrabold">{formatCurrency(cashChange)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                    <span className="text-gray-600">Total paid</span>
                    <span className="font-extrabold">{formatCurrency(billingData.totalPaid)}</span>
                  </div>
                </div>
              )}

              {billingData.balance === 0 ? (
                <div className="text-center mt-3 pt-3 border-t border-gray-300">
                  <p className="text-green-700 font-extrabold">PAID IN FULL</p>
                  <p className="text-[11px] text-gray-600 mt-1">Thank you for your payment</p>
                </div>
              ) : (
                <div className="text-center mt-3 pt-3 border-t border-gray-300">
                  <p className="text-yellow-700 font-extrabold">
                    BALANCE: {formatCurrency(billingData.balance)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1">Complete payment to enable printing.</p>
                </div>
              )}
            </div>

            <div className="text-center mt-4 pt-3 border-t border-gray-300">
              <p className="text-[11px] text-gray-600">Computer generated receipt</p>
              <p className="text-[11px] text-gray-600">Valid without signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt actions */}
      <div className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className={`w-4 h-4 ${colors.text.secondary}`} />
            <span className={`text-xs ${colors.text.secondary}`}>
              {canPrint ? 'Ready to print' : 'Print enabled after finalization'}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrintReceipt}
            disabled={!canPrint}
            className={`inline-flex items-center gap-2 px-4 py-2 font-semibold transition-colors
              ${
                !canPrint
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
              }`}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full min-h-0 p-4 sm:p-5 lg:p-6">
      {/* TOP BAR */}
      <div className={`sticky top-0 z-20 ${colors.bg.topbar} backdrop-blur border-b ${colors.border.primary}`}>
        <div className="py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackToCharges}
            className={`inline-flex items-center gap-2 px-3.5 py-2 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
            transition-colors cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-2 border ${colors.border.primary} ${
                status === 'settled' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
              }`}
            >
              <span className="text-xs font-semibold">{status === 'settled' ? 'Settled' : 'Billing'}</span>
            </div>

            <div
              className={`px-3 py-2 border ${colors.border.primary} ${
                billingData.balance === 0 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}
            >
              <span className="text-xs font-semibold">
                {billingData.balance === 0 ? 'Balance: 0' : `Balance: ${formatCurrency(billingData.balance)}`}
              </span>
            </div>
          </div>

          {/* Finalize is NOT hidden: always visible in top bar */}
          <button
            type="button"
            onClick={handleFinalizePayment}
            disabled={!canFinalize || (cashMethodIndex >= 0 && cashShort > 0)}
            className={`inline-flex items-center gap-2 px-4 py-2 font-semibold transition-colors
              ${
                !canFinalize || (cashMethodIndex >= 0 && cashShort > 0)
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
              }`}
            title={
              cashMethodIndex >= 0 && cashShort > 0
                ? `Cash received is short by ${formatCurrency(cashShort)}`
                : billingData.balance > 0
                ? 'Balance must be zero to finalize'
                : ''
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Finalize
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 h-full min-h-0 mt-4">
        {/* LEFT: receipt preview */}
        <div className="lg:col-span-6 xl:col-span-6 min-h-0">
          <ReceiptPreview />
        </div>

        {/* RIGHT: controls */}
        <div className="lg:col-span-6 xl:col-span-6 min-h-0">
          <div className="space-y-4">
            {/* Adjustments */}
            <div className={`border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Adjustments</h3>
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colors.text.secondary}`}>
                    <span className="inline-flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={discount.value}
                      onChange={(e) => handleDiscountChange(discount.type, e.target.value)}
                      min={0}
                      max={discount.type === 'percentage' ? 100 : billingData.subtotal}
                      className={`w-full px-3.5 py-2.5 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                      focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                    />

                    <div className={`flex border ${colors.border.primary} overflow-hidden`}>
                      <button
                        type="button"
                        onClick={() => handleDiscountChange('percentage', String(discount.value))}
                        className={`px-3 py-2 text-sm font-semibold transition-colors cursor-pointer
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
                        className={`px-3 py-2 text-sm font-semibold transition-colors cursor-pointer
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
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${colors.text.secondary}`}>
                    Taxes applied
                  </label>

                  <div className="space-y-2">
                    {DEFAULT_TAXES.map((tax, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 border ${colors.border.primary} ${colors.bg.secondary}`}
                      >
                        <div>
                          <p className={`font-semibold ${colors.text.primary}`}>{tax.name}</p>
                          <p className={`text-xs ${colors.text.secondary}`}>{tax.rate}% rate</p>
                        </div>
                        <p className={`font-extrabold ${colors.text.primary}`}>
                          {formatCurrency(billingData.taxes[idx]?.amount || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={`border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Payment</h3>
                  <button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    disabled={paymentMethods.length >= 3}
                    className={`text-xs font-semibold px-2.5 py-1.5 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className={`p-3 border ${colors.border.primary} ${colors.bg.secondary}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {paymentIcon(method.type)}
                        <select
                          value={method.type}
                          onChange={(e) => handlePaymentMethodChange(index, 'type', e.target.value)}
                          className={`text-sm ${colors.text.primary} bg-transparent capitalize outline-none cursor-pointer`}
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="insurance">Insurance</option>
                          <option value="mobile">Mobile Money</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>

                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(index)}
                          className={`p-2 ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer`}
                          aria-label="Remove payment method"
                          title="Remove"
                        >
                          {/* simple X with text is ok, but keep icon minimal */}
                          <span className="text-sm font-bold">×</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) =>
                          handlePaymentMethodChange(index, 'amount', Number(e.target.value) || 0)
                        }
                        placeholder="Amount"
                        min={0}
                        className={`w-full px-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                        focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                      />

                      <button
                        type="button"
                        onClick={() => handleAutoFillRemaining(index)}
                        className={`w-full text-xs font-semibold px-2 py-2 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                        transition-colors cursor-pointer`}
                      >
                        Fill remaining balance
                      </button>

                      {/* CASH RECEIVED + CHANGE CALCULATOR (only when this method is cash) */}
                      {method.type === 'cash' && (
                        <div className={`mt-2 p-3 border ${colors.border.primary} ${colors.bg.primary}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator className="w-4 h-4 text-green-500" />
                            <p className={`text-sm font-semibold ${colors.text.primary}`}>Cash change</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className={`text-xs ${colors.text.secondary} mb-1`}>Cash due</p>
                              <div className={`px-3 py-2 border ${colors.border.primary} ${colors.bg.secondary}`}>
                                <span className={`font-extrabold ${colors.text.primary}`}>
                                  {formatCurrency(Number(method.amount || 0))}
                                </span>
                              </div>
                            </div>

                            <div>
                              <p className={`text-xs ${colors.text.secondary} mb-1`}>Cash received</p>
                              <input
                                type="number"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                                min={0}
                                placeholder="e.g. 50000"
                                className={`w-full px-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className={`p-3 border ${colors.border.primary} ${cashShort > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                              <p className={`text-xs ${colors.text.secondary}`}>{cashShort > 0 ? 'Short' : 'Change'}</p>
                              <p className={`text-lg font-extrabold ${cashShort > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                                {cashShort > 0 ? formatCurrency(cashShort) : formatCurrency(cashChange)}
                              </p>
                            </div>

                            <div className={`p-3 border ${colors.border.primary} ${colors.bg.secondary}`}>
                              <p className={`text-xs ${colors.text.secondary}`}>Tip</p>
                              <p className={`text-xs ${colors.text.secondary}`}>
                                Enter the note amount the patient gives. The receipt will show cash received and change.
                              </p>
                            </div>
                          </div>

                          {cashShort > 0 && (
                            <div className={`mt-3 p-3 border ${colors.border.primary} bg-yellow-500/10`}>
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                <p className={`text-xs ${colors.text.secondary}`}>
                                  Cash received is short by <span className="font-bold">{formatCurrency(cashShort)}</span>.
                                  Finalize will be disabled until cash received covers cash due (or reduce cash due).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Balance */}
                <div
                  className={`p-3 border ${colors.border.primary} ${
                    billingData.balance === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        billingData.balance === 0 ? 'text-green-500' : 'text-yellow-500'
                      }`}
                    >
                      Balance
                    </span>
                    <span
                      className={`font-extrabold ${
                        billingData.balance === 0 ? 'text-green-500' : 'text-yellow-500'
                      }`}
                    >
                      {billingData.balance === 0 ? 'Paid' : formatCurrency(billingData.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${colors.text.secondary}`}>
                Additional notes
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => handleAdditionalNotesChange(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={3}
                className={`w-full px-3.5 py-2.5 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
              />
            </div>

            {/* After settled badge */}
            {status === 'settled' && (
              <div className={`p-3 border ${colors.border.primary} bg-green-500/10`}>
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-semibold">
                    Payment settled. Print is available in the receipt panel.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
