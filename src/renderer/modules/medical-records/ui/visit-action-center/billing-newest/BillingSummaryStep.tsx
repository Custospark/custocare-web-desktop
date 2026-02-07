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
  Shield,
  Loader2,
  Phone,
  Zap,
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
} from './billing-slice';
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

const toNumberOrZero = (raw: string) => {
  if (raw.trim() === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

export const BillingSummaryStep: React.FC<BillingSummaryStepProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();

  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const status = useSelector(selectBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  // Local UI (synced into redux)
  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [paymentMethods, setLocalPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // UI strings so inputs can be empty while state stays numeric (best UX for “0 clears on focus”)
  const [amountText, setAmountText] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    DEFAULT_PAYMENT_METHODS.forEach((m, i) => {
      init[i] = (Number(m.amount) || 0) === 0 ? '' : String(m.amount);
    });
    return init;
  });

  const [discountText, setDiscountText] = useState<string>(() => {
    const v = Number(DEFAULT_DISCOUNT.value) || 0;
    return v === 0 ? '' : String(v);
  });

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      receipt: 'bg-white',
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
      ring: 'focus:ring-blue-500/40',
    },
    select: {
      wrap: isDark ? 'bg-gray-950/40' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-300',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      option: isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
    },
    status: {
      paidBadge: isDark ? 'bg-green-500/15 text-green-300' : 'bg-green-50 text-green-700',
      balBadge: isDark ? 'bg-yellow-500/15 text-yellow-300' : 'bg-yellow-50 text-yellow-700',
    },
  };

  const canFinalize =
    !isProcessing &&
    chargeItems.length > 0 &&
    billingData.balance === 0 &&
    status !== 'settled';

  const canPrint = status === 'settled' && !!receiptNumber && !isProcessing;

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

  // Per-index: amount due before this method contributes (used for cash change & mobile initiation best practice)
  const dueBeforeByIndex = useMemo(() => {
    const out: Record<number, number> = {};
    paymentMethods.forEach((_, idx) => {
      const othersPaid = paymentMethods.reduce(
        (sum, x, j) => (j === idx ? sum : sum + (Number(x.amount) || 0)),
        0
      );
      out[idx] = Math.max(0, billingData.grandTotal - othersPaid);
    });
    return out;
  }, [paymentMethods, billingData.grandTotal]);

  // Cash change only
  const cashChangeByIndex = useMemo(() => {
    const out: Record<number, { dueBefore: number; change: number }> = {};
    paymentMethods.forEach((m, idx) => {
      if (m.type !== 'cash') return;
      const dueBefore = dueBeforeByIndex[idx] ?? 0;
      const tendered = Number(m.amount) || 0;
      out[idx] = { dueBefore, change: Math.max(0, tendered - dueBefore) };
    });
    return out;
  }, [paymentMethods, dueBeforeByIndex]);

  const paidLines = useMemo(
    () => paymentMethods.filter((m) => (Number(m.amount) || 0) > 0),
    [paymentMethods]
  );

  const syncMethodsToRedux = (next: typeof paymentMethods) => {
    next.forEach((m, i) => {
      dispatch(
        updatePaymentMethod({
          index: i,
          method: {
            type: m.type,
            amount: Number(m.amount) || 0,
            details: m.details,
          },
        })
      );
    });
  };

  const handleDiscountChange = (type: 'percentage' | 'fixed', raw: string) => {
    setDiscountText(raw);

    const value = toNumberOrZero(raw);
    const max = type === 'percentage' ? 100 : billingData.subtotal;
    const next = { type, value: clamp(value, 0, max) };

    setLocalDiscount(next);
    dispatch(setDiscount(next));
  };

  const handleDiscountType = (type: 'percentage' | 'fixed') => {
    const raw = discountText; // keep whatever user typed
    handleDiscountChange(type, raw);
  };

  const handlePaymentTypeChange = (index: number, type: string) => {
    const next = [...paymentMethods];
    const prev = next[index];

    next[index] = { ...prev, type: type as any };

    // If switching into mobile:
    // - ensure phone details exists
    // - set the amount to the remaining due at that moment (best practice)
    if (type === 'mobile') {
      const due = dueBeforeByIndex[index] ?? billingData.balance; // safe fallback
      next[index] = { ...next[index], details: next[index].details || '', amount: due };
      setAmountText((p) => ({ ...p, [index]: due === 0 ? '' : String(due) }));
    } else {
      // keep amount as-is; just ensure details exists
      next[index] = { ...next[index], details: next[index].details || '' };
    }

    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);
  };

  const handlePaymentAmountChange = (index: number, raw: string) => {
    // Keep empty string while typing; store numeric in state as 0 when empty
    setAmountText((p) => ({ ...p, [index]: raw }));

    const value = toNumberOrZero(raw);
    const next = [...paymentMethods];
    next[index] = { ...next[index], amount: value };

    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);
  };

  const handleAutoFillRemaining = (index: number) => {
    const remaining = dueBeforeByIndex[index] ?? 0;

    const next = [...paymentMethods];
    next[index] = { ...next[index], amount: remaining };

    setAmountText((p) => ({ ...p, [index]: remaining === 0 ? '' : String(remaining) }));

    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);
  };

  const handleAddPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;
    const next = [...paymentMethods, { type: 'cash', amount: 0, details: '' }];

    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);

    setAmountText((p) => ({ ...p, [next.length - 1]: '' }));
    dispatch(addPaymentMethod());
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (paymentMethods.length <= 1) return;

    const next = paymentMethods.filter((_, i) => i !== index);
    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);

    // Rebuild amountText to match new indices
    const rebuilt: Record<number, string> = {};
    next.forEach((m, i) => {
      const v = Number(m.amount) || 0;
      rebuilt[i] = v === 0 ? '' : String(v);
    });
    setAmountText(rebuilt);

    dispatch(removePaymentMethod(index));
  };

  const handleMobilePhoneChange = (index: number, raw: string) => {
    const phone = onlyDigits(raw);
    const next = [...paymentMethods];
    next[index] = { ...next[index], details: phone };

    setLocalPaymentMethods(next);
    syncMethodsToRedux(next);
  };

  const handleInitiateMobilePayment = async (index: number) => {
    const method = paymentMethods[index];
    if (method.type !== 'mobile') return;

    const phone = (method.details || '').trim();
    if (phone.length < 9) {
      alert('Enter a valid phone number for Mobile Money.');
      return;
    }

    // Best practice: initiate EXACTLY the due amount for that method (remaining due at that moment)
    const due = dueBeforeByIndex[index] ?? 0;
    if (due <= 0) {
      alert('Nothing to pay. Balance is already covered.');
      return;
    }

    // Ensure the method amount matches the initiated amount
    if ((Number(method.amount) || 0) !== due) {
      const next = [...paymentMethods];
      next[index] = { ...next[index], amount: due };
      setLocalPaymentMethods(next);
      syncMethodsToRedux(next);
      setAmountText((p) => ({ ...p, [index]: String(due) }));
    }

    dispatch(setProcessing(true));
    try {
      await new Promise((r) => setTimeout(r, 900));
      alert(`Payment request initiated to ${phone} for ${formatCurrency(due)} (mock).`);
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handleAdditionalNotesChange = (notes: string) => {
    setLocalAdditionalNotes(notes);
    dispatch(setAdditionalNotes(notes));
  };

  const handleFinalizePayment = async () => {
    if (!canFinalize) return;

    dispatch(setProcessing(true));
    try {
      await new Promise((r) => setTimeout(r, 1100));
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

  return (
    <div className="h-full min-h-0 p-4 sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT: receipt preview */}
        <div className="lg:col-span-6 min-h-0 flex flex-col">
          <div className={`border ${colors.border.primary} ${colors.bg.primary} overflow-hidden flex flex-col min-h-0`}>
            <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Receipt preview</h3>
                  <p className={`text-xs ${colors.text.secondary} truncate`}>
                    Updates live (discount, taxes, payment, change)
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`text-xs font-semibold px-2 py-1 border ${colors.border.primary} ${
                      billingData.balance === 0 ? colors.status.paidBadge : colors.status.balBadge
                    }`}
                  >
                    {billingData.balance === 0 ? 'PAID' : `DUE ${formatCurrency(billingData.balance)}`}
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 border ${colors.border.primary} ${colors.bg.secondary}`}>
                    {receiptNumber ? `# ${receiptNumber}` : '# Pending'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto">
              <div className="mx-auto w-full max-w-[360px] sm:max-w-[420px]">
                <div className={`border ${colors.border.receipt} ${colors.bg.receipt} text-black p-4`}>
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

                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-extrabold ${billingData.balance === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {billingData.balance === 0 ? 'PAID' : `DUE ${formatCurrency(billingData.balance)}`}
                      </span>
                    </div>
                  </div>

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

                        {paymentMethods.map((m, idx) => {
                          if (m.type !== 'cash') return null;
                          const calc = cashChangeByIndex[idx];
                          if (!calc) return null;

                          const tendered = Number(m.amount) || 0;
                          // show cash calc only when cashier actually typed something (or tendered > 0)
                          const typed = (amountText[idx] ?? '').trim().length > 0;
                          if (!typed && tendered === 0) return null;

                          return (
                            <div key={`cash-change-${idx}`} className="pt-2 mt-2 border-t border-gray-200">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cash due</span>
                                <span className="font-semibold">{formatCurrency(calc.dueBefore)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cash tendered</span>
                                <span className="font-semibold">{formatCurrency(tendered)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Change</span>
                                <span className="font-extrabold">{formatCurrency(calc.change)}</span>
                              </div>
                            </div>
                          );
                        })}
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

            {/* Actions: finalize near print */}
            <div className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleFinalizePayment}
                  disabled={!canFinalize}
                  className={`inline-flex items-center gap-2 px-4 py-2 font-semibold transition-colors
                    ${
                      !canFinalize
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
                    }`}
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
        </div>

        {/* RIGHT: controls */}
        <div className="lg:col-span-6 min-h-0 flex flex-col">
          <div className={`border ${colors.border.primary} ${colors.bg.primary} overflow-hidden flex flex-col min-h-0`}>
            <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Billing controls</h3>
              <p className={`text-xs ${colors.text.secondary}`}>
                Cash: enter tendered amount → system shows change.
              </p>
            </div>

            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-4">
              {/* Payment methods */}
              <div className={`border ${colors.border.primary} ${colors.bg.secondary} overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                  <div className="flex items-center justify-between gap-3">
                    <h4 className={`text-sm font-bold ${colors.text.primary}`}>Payment methods</h4>
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
                  {paymentMethods.map((method, index) => {
                    const isMobile = method.type === 'mobile';
                    const isCash = method.type === 'cash';

                    const cashCalc = isCash ? cashChangeByIndex[index] : undefined;
                    const tendered = Number(method.amount) || 0;

                    const amountValue = amountText[index] ?? '';

                    return (
                      <div key={index} className={`p-3 border ${colors.border.primary} ${colors.bg.primary}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {paymentIcon(method.type)}
                            <div className={`border ${colors.select.border} ${colors.select.wrap} px-2 py-1`}>
                              <select
                                value={method.type}
                                onChange={(e) => handlePaymentTypeChange(index, e.target.value)}
                                className={`text-sm ${colors.select.text} bg-transparent capitalize outline-none cursor-pointer`}
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

                          {paymentMethods.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentMethod(index)}
                              className={`p-2 ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer`}
                              aria-label="Remove payment method"
                              title="Remove"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Mobile phone row */}
                        {isMobile && (
                          <div className="mb-2 grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-8">
                              <div className="relative">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
                                <input
                                  value={method.details || ''}
                                  onChange={(e) => handleMobilePhoneChange(index, e.target.value)}
                                  placeholder="Phone number (e.g. 2567xxxxxxx)"
                                  inputMode="numeric"
                                  className={`w-full pl-9 pr-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                                  focus:outline-none focus:ring-2 ${colors.accent.ring}`}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-4">
                              <button
                                type="button"
                                onClick={() => handleInitiateMobilePayment(index)}
                                disabled={isProcessing || (dueBeforeByIndex[index] ?? 0) <= 0}
                                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 font-semibold transition-colors
                                ${
                                  isProcessing || (dueBeforeByIndex[index] ?? 0) <= 0
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer`
                                }`}
                                title={
                                  (dueBeforeByIndex[index] ?? 0) > 0
                                    ? `Initiate ${formatCurrency(dueBeforeByIndex[index] ?? 0)}`
                                    : 'Nothing due'
                                }
                              >
                                <Zap className="w-4 h-4" />
                                Initiate
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <input
                            type="number"
                            value={amountValue}
                            onFocus={() => {
                              // If the current visible value is 0 (or empty), clear for typing
                              if (amountValue === '0' || (Number(method.amount) || 0) === 0) {
                                setAmountText((p) => ({ ...p, [index]: '' }));
                              }
                            }}
                            onChange={(e) => handlePaymentAmountChange(index, e.target.value)}
                            placeholder={isCash ? 'Cash tendered' : 'Amount'}
                            min={0}
                            className={`w-full px-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                            focus:outline-none focus:ring-2 ${colors.accent.ring}`}
                          />

                          <button
                            type="button"
                            onClick={() => handleAutoFillRemaining(index)}
                            className={`w-full text-xs font-semibold px-2 py-2 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                            transition-colors cursor-pointer`}
                          >
                            Fill remaining balance
                          </button>

                          {/* Cash change output only */}
                          {isCash && cashCalc && ((amountText[index] ?? '').trim().length > 0 || tendered > 0) && (
                            <div className={`p-3 border ${colors.border.primary} ${colors.bg.secondary}`}>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <p className={`text-xs ${colors.text.secondary}`}>Due</p>
                                  <p className={`font-extrabold ${colors.text.primary}`}>
                                    {formatCurrency(cashCalc.dueBefore)}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${colors.text.secondary}`}>Tendered</p>
                                  <p className={`font-extrabold ${colors.text.primary}`}>
                                    {formatCurrency(tendered)}
                                  </p>
                                </div>
                                <div>
                                  <p className={`text-xs ${colors.text.secondary}`}>Change</p>
                                  <p className="font-extrabold text-green-500">
                                    {formatCurrency(cashCalc.change)}
                                  </p>
                                </div>
                              </div>

                              {tendered < cashCalc.dueBefore && (
                                <div className="mt-2 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                                  <p className={`text-xs ${colors.text.secondary}`}>
                                    Tendered cash is short by{' '}
                                    <span className="font-extrabold">
                                      {formatCurrency(cashCalc.dueBefore - tendered)}
                                    </span>
                                    .
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Balance indicator */}
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

              {/* Discount & taxes */}
              <div className={`border ${colors.border.primary} ${colors.bg.secondary} overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                  <h4 className={`text-sm font-bold ${colors.text.primary}`}>Discount & taxes</h4>
                </div>

                <div className="p-4 space-y-4">
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
                        value={discountText}
                        onFocus={() => {
                          // Clear default/zero on focus
                          if (discountText === '0' || (Number(discount.value) || 0) === 0) {
                            setDiscountText('');
                          }
                        }}
                        onChange={(e) => handleDiscountChange(discount.type, e.target.value)}
                        placeholder="0"
                        min={0}
                        max={discount.type === 'percentage' ? 100 : billingData.subtotal}
                        className={`w-full px-3.5 py-2.5 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
                        focus:outline-none focus:ring-2 ${colors.accent.ring}`}
                      />

                      <div className={`flex border ${colors.border.primary} overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() => handleDiscountType('percentage')}
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
                          onClick={() => handleDiscountType('fixed')}
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

                  <div className="space-y-2">
                    {DEFAULT_TAXES.map((tax, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 border ${colors.border.primary} ${colors.bg.primary}`}
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
                  focus:outline-none focus:ring-2 ${colors.accent.ring}`}
                />
              </div>
            </div>

            <div className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${colors.text.tertiary}`} />
                <p className={`text-xs ${colors.text.secondary}`}>
                  Print is enabled only after Finalize. Receipt preview stays live while editing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
