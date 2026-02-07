import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  X,
  Loader2,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import {
  ChargeItem,
  Discount,
  Tax,
  PaymentMethod,
  Theme,
  getColorConfig,
  formatCurrency,
  generateReceiptNumber,
  calculateDiscountAmount,
  calculateTaxes,
  calculateGrandTotal,
  calculateBalance,
  DEFAULT_TAXES,
} from './billing-types';

/**
 * Props for BillingSummary component
 */
interface BillingSummaryProps {
  visitId?: string;
  onBack?: () => void;
  theme?: Theme;
}

/**
 * BillingSummary Component
 * Handles discounts, taxes, and payment processing
 */
export const BillingSummary: React.FC<BillingSummaryProps> = ({
  visitId = 'VIS-2024-001',
  onBack,
  theme = 'light',
}) => {
  const navigate = useNavigate();
  const colors = getColorConfig(theme);

  // State management
  const [chargeItems, setChargeItems] = useState<ChargeItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState<Discount>({ type: 'percentage', value: 0 });
  const [taxes, setTaxes] = useState<Tax[]>(DEFAULT_TAXES);
  const [grandTotal, setGrandTotal] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([{ type: 'cash', amount: 0, details: '' }]);
  const [balance, setBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // Load charge items from sessionStorage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('billingChargeItems');
    if (storedData) {
      try {
        const { items, subtotal } = JSON.parse(storedData);
        setChargeItems(items);
        setSubtotal(subtotal);
      } catch (error) {
        console.error('Failed to load billing data:', error);
      }
    }
  }, []);

  // Generate receipt number on mount
  useEffect(() => {
    setReceiptNumber(generateReceiptNumber());
  }, []);

  // Calculate totals whenever dependencies change
  useEffect(() => {
    const discountAmount = calculateDiscountAmount(subtotal, discount);
    const taxableAmount = subtotal - discountAmount;
    const updatedTaxes = calculateTaxes(taxableAmount, taxes);
    setTaxes(updatedTaxes);

    const newGrandTotal = calculateGrandTotal(subtotal, discount, updatedTaxes);
    setGrandTotal(newGrandTotal);

    const newBalance = calculateBalance(newGrandTotal, paymentMethods);
    setBalance(newBalance);
  }, [subtotal, discount, paymentMethods]);

  /**
   * Handle discount change
   */
  const handleDiscountChange = useCallback((type: 'percentage' | 'fixed', value: string) => {
    const numValue = parseFloat(value) || 0;
    setDiscount({ type, value: numValue });
  }, []);

  /**
   * Handle payment method change
   */
  const handlePaymentMethodChange = useCallback((index: number, field: keyof PaymentMethod, value: any) => {
    setPaymentMethods(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  }, []);

  /**
   * Add payment method
   */
  const addPaymentMethod = useCallback(() => {
    if (paymentMethods.length >= 3) return;
    setPaymentMethods(prev => [...prev, { type: 'cash', amount: 0, details: '' }]);
  }, [paymentMethods.length]);

  /**
   * Remove payment method
   */
  const removePaymentMethod = useCallback(
    (index: number) => {
      if (paymentMethods.length <= 1) return;
      setPaymentMethods(prev => prev.filter((_, i) => i !== index));
    },
    [paymentMethods.length]
  );

  /**
   * Auto-calculate remaining payment
   */
  const autoCalculatePayment = useCallback(
    (index: number) => {
      const totalPaid = paymentMethods.reduce((sum, method, i) => (i === index ? sum : sum + method.amount), 0);
      const remaining = Math.max(0, grandTotal - totalPaid);

      setPaymentMethods(prev => {
        const updated = [...prev];
        updated[index].amount = remaining;
        return updated;
      });
    },
    [paymentMethods, grandTotal]
  );

  /**
   * Handle print receipt
   */
  const handlePrintReceipt = useCallback(() => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setShowReceiptPreview(true);
      window.print();
    }, 1000);
  }, []);

  /**
   * Handle finalize payment
   */
  const handleFinalizePayment = useCallback(() => {
    if (balance > 0) {
      alert(`Balance of ${formatCurrency(balance)} still pending. Please adjust payment.`);
      return;
    }

    if (chargeItems.length === 0) {
      alert('No items to process.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment processed successfully!');
      sessionStorage.removeItem('billingChargeItems');
      // Navigate or clear form as needed
    }, 1500);
  }, [balance, chargeItems.length]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(MEDICAL_RECORDS_ROUTES.ENTRY_CHARGES);
    }
  }, [onBack, navigate]);

  /**
   * Render receipt preview modal
   */
  const renderReceiptPreview = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${colors.bg.elevated}`}>
        {/* Receipt Header */}
        <div className={`p-6 border-b ${colors.border.primary}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${colors.text.primary}`}>Receipt Preview</h3>
            <button onClick={() => setShowReceiptPreview(false)} className={`p-2 rounded-lg ${colors.bg.hover}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={colors.text.secondary}>Review before printing</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="p-6 border border-gray-300 rounded-lg bg-white text-black">
            {/* Clinic Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">MEDICAL CLINIC</h2>
              <p className="text-sm text-gray-600">123 Health Street, Nairobi</p>
              <p className="text-sm text-gray-600">Phone: (254) 712-345-678</p>
            </div>

            <div className="border-t border-b border-gray-300 py-3 my-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Receipt:</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Visit Info */}
            <div className="mb-4">
              <div className="text-sm">
                <p>
                  <span className="font-medium">Visit:</span> {visitId}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Services Rendered</h3>
              <div className="space-y-2">
                {chargeItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                    <div>
                      <p className="font-medium">{item.service.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × {formatCurrency(item.service.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount.value > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(calculateDiscountAmount(subtotal, discount))}</span>
                </div>
              )}
              {taxes.map((tax, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{tax.name}:</span>
                  <span>{formatCurrency(tax.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h3 className="font-bold mb-2">Payment</h3>
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="capitalize">{method.type}:</span>
                  <span>{formatCurrency(method.amount)}</span>
                </div>
              ))}
              {balance === 0 && (
                <div className="text-center mt-4 pt-4 border-t border-gray-300">
                  <p className="text-green-600 font-bold">PAID IN FULL</p>
                  <p className="text-xs text-gray-600 mt-1">Thank you for your payment</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600">This is a computer generated receipt</p>
              <p className="text-xs text-gray-600">Valid without signature</p>
            </div>
          </div>

          {/* Print Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => setShowReceiptPreview(false)}
              className={`px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
            >
              Close
            </button>
            <button
              onClick={handlePrintReceipt}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`}
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Receipt className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h2 className={`text-xl font-bold ${colors.text.primary}`}>Billing Summary</h2>
              <p className={colors.text.secondary}>Apply discounts, taxes, and process payment</p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-lg ${colors.bg.secondary}`}>
            <div className="text-sm">
              <span className={colors.text.secondary}>Receipt: </span>
              <span className={`font-mono font-bold ${colors.text.primary}`}>{receiptNumber}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className={`p-3 rounded-lg ${colors.bg.secondary} flex-1`}>
            <p className={`text-xs ${colors.text.secondary}`}>Visit ID</p>
            <p className={`font-medium ${colors.text.primary}`}>{visitId}</p>
          </div>

          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} whitespace-nowrap`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Charges
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items List */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>Selected Items ({chargeItems.length})</h3>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {chargeItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                    <p className={colors.text.secondary}>No items selected</p>
                  </div>
                ) : (
                  chargeItems.map((item, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className={`font-medium ${colors.text.primary}`}>{item.service.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}
                            >
                              {item.service.code}
                            </span>
                            <span className={`text-xs ${colors.text.secondary}`}>
                              {item.quantity} × {formatCurrency(item.service.unitPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${colors.text.primary}`}>{formatCurrency(item.totalAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Discount & Tax Configuration */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>Adjustments</h3>
              </div>

              <div className="p-4 space-y-4">
                {/* Discount */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount
                    </div>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={discount.value}
                        onChange={e => handleDiscountChange(discount.type, e.target.value)}
                        min="0"
                        max={discount.type === 'percentage' ? 100 : subtotal}
                        className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
                      />
                    </div>

                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleDiscountChange('percentage', discount.value.toString())}
                        className={`px-3 py-2 text-sm ${
                          discount.type === 'percentage'
                            ? colors.accent.primary + ' ' + colors.accent.text
                            : colors.bg.hover + ' ' + colors.text.secondary
                        }`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => handleDiscountChange('fixed', discount.value.toString())}
                        className={`px-3 py-2 text-sm ${
                          discount.type === 'fixed'
                            ? colors.accent.primary + ' ' + colors.accent.text
                            : colors.bg.hover + ' ' + colors.text.secondary
                        }`}
                      >
                        Fixed
                      </button>
                    </div>
                  </div>

                  {discount.value > 0 && (
                    <p className={`text-sm mt-2 ${colors.status.success}`}>
                      Discount: {formatCurrency(calculateDiscountAmount(subtotal, discount))}
                    </p>
                  )}
                </div>

                {/* Taxes */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>Taxes Applied</label>

                  <div className="space-y-2">
                    {taxes.map((tax, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${colors.border.primary}`}
                      >
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>{tax.name}</p>
                          <p className={`text-sm ${colors.text.secondary}`}>{tax.rate}% rate</p>
                        </div>
                        <p className={`font-bold ${colors.text.primary}`}>{formatCurrency(tax.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment & Totals */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${colors.text.primary}`}>Payment Methods</h3>
                  {paymentMethods.length < 3 && (
                    <button
                      onClick={addPaymentMethod}
                      className={`text-xs px-2 py-1 rounded ${colors.bg.hover} ${colors.text.secondary}`}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-3">
                {paymentMethods.map((method, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${colors.border.primary}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {method.type === 'cash' && <FaCashRegister className="w-4 h-4 text-green-500" />}
                        {method.type === 'card' && <CreditCard className="w-4 h-4 text-blue-500" />}
                        {method.type === 'insurance' && <Shield className="w-4 h-4 text-purple-500" />}
                        {method.type === 'mobile' && <Banknote className="w-4 h-4 text-yellow-500" />}
                        {method.type === 'mixed' && <Wallet className="w-4 h-4 text-gray-500" />}

                        <select
                          value={method.type}
                          onChange={e => handlePaymentMethodChange(index, 'type', e.target.value)}
                          className={`text-sm bg-transparent ${colors.text.primary} capitalize`}
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="insurance">Insurance</option>
                          <option value="mobile">Mobile Money</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>

                      {paymentMethods.length > 1 && (
                        <button onClick={() => removePaymentMethod(index)} className={`p-1 rounded ${colors.bg.hover}`}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <input
                          type="number"
                          value={method.amount}
                          onChange={e =>
                            handlePaymentMethodChange(index, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Amount"
                          className={`w-full px-3 py-1.5 rounded border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
                        />
                      </div>

                      <button
                        onClick={() => autoCalculatePayment(index)}
                        className={`w-full text-xs px-2 py-1 rounded ${colors.bg.hover} ${colors.text.secondary}`}
                      >
                        Fill Remaining Balance
                      </button>
                    </div>
                  </div>
                ))}

                <div className={`p-3 rounded-lg ${balance === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${balance === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      Balance
                    </span>
                    <span className={`font-bold ${balance === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {balance === 0 ? 'Paid' : formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>Bill Summary</h3>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Subtotal</span>
                  <span className={`font-medium ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
                </div>

                {discount.value > 0 && (
                  <div className="flex items-center justify-between text-green-500">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(calculateDiscountAmount(subtotal, discount))}</span>
                  </div>
                )}

                {taxes.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={colors.text.secondary}>{tax.name}</span>
                    <span className={colors.text.secondary}>{formatCurrency(tax.amount)}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-700 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-semibold ${colors.text.primary}`}>Grand Total</span>
                    <span className={`text-2xl font-bold ${colors.status.success}`}>{formatCurrency(grandTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.text.secondary}`}>Total Paid</span>
                    <span className={`font-medium ${colors.text.primary}`}>
                      {formatCurrency(paymentMethods.reduce((sum, method) => sum + method.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>Additional Notes</label>
              <textarea
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={2}
                className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowReceiptPreview(true)}
                disabled={chargeItems.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Receipt className="w-4 h-4" />
                Preview Receipt
              </button>

              <button
                onClick={handleFinalizePayment}
                disabled={isProcessing || chargeItems.length === 0 || balance > 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isProcessing || chargeItems.length === 0 || balance > 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
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
                    Finalize Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {showReceiptPreview && renderReceiptPreview()}
    </div>
  );
};

export default BillingSummary;