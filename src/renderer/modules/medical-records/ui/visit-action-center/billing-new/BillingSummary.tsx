// BillingSummary.tsx
// Billing summary with discounts, taxes, payment, and settlement

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ArrowLeft, 
  Percent, 
  CreditCard, 
  CheckCircle2,
  Loader2 
} from 'lucide-react';
import { 
  setStep, 
  setDiscount, 
  setPaymentMethods, 
  resetBilling, 
  markClean,
  selectCharges,
  selectBillingState 
} from './billingSlice';
import { formatCurrency, generateReceiptNumber } from '../billing/billing-types';
import type { Discount, PaymentMethod } from '../billing/billing-types';

interface BillingSummaryProps {
  theme?: 'light' | 'dark';
  onConfirm: (options: any) => Promise<boolean>;
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({ theme = 'light', onConfirm }) => {
  const dispatch = useDispatch();
  const charges = useSelector(selectCharges);
  const { discount: stateDiscount, paymentMethods: stateMethods } = useSelector(selectBillingState);
  const isDark = theme === 'dark';
  
  const [discount, setLocalDiscount] = useState<Discount>(stateDiscount);
  const [paymentMethods, setLocalPaymentMethods] = useState<PaymentMethod[]>(stateMethods);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptNumber] = useState(generateReceiptNumber());
  
  const { subtotal, discountAmount, taxAmount, grandTotal, totalPaid, balance } = useMemo(() => {
    const subtotal = charges.reduce((sum, c) => sum + c.totalAmount, 0);
    
    const discountAmount = discount.type === 'percentage'
      ? subtotal * (discount.value / 100)
      : discount.value;
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.16; // 16% VAT
    
    const grandTotal = taxableAmount + taxAmount;
    const totalPaid = paymentMethods.reduce((sum, m) => sum + m.amount, 0);
    const balance = Math.max(0, grandTotal - totalPaid);
    
    return { subtotal, discountAmount, taxAmount, grandTotal, totalPaid, balance };
  }, [charges, discount, paymentMethods]);
  
  const handleDiscountChange = (type: 'percentage' | 'fixed', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newDiscount = { type, value: numValue };
    setLocalDiscount(newDiscount);
    dispatch(setDiscount(newDiscount));
  };
  
  const handlePaymentChange = (index: number, field: keyof PaymentMethod, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setLocalPaymentMethods(updated);
    dispatch(setPaymentMethods(updated));
  };
  
  const autoFillPayment = (index: number) => {
    const alreadyPaid = paymentMethods.reduce((sum, m, i) => i === index ? sum : sum + m.amount, 0);
    const remaining = Math.max(0, grandTotal - alreadyPaid);
    handlePaymentChange(index, 'amount', remaining);
  };
  
  const handleSettle = async () => {
    if (balance > 0) {
      alert(`Balance of ${formatCurrency(balance)} still pending.`);
      return;
    }
    
    const confirmed = await onConfirm({
      title: 'Finalize Payment?',
      message: 'This will settle the bill and cannot be undone. Continue?',
      confirmText: 'Settle',
      cancelText: 'Cancel',
      variant: 'info',
    });
    
    if (!confirmed) return;
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment settled successfully!');
      dispatch(markClean());
      dispatch(resetBilling());
    }, 1500);
  };
  
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
    },
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => dispatch(setStep('charge_entry'))}
        className={`flex items-center gap-2 text-sm ${colors.text.secondary} hover:${colors.text.primary}`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Charge Entry
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items & Adjustments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className={`${colors.bg.secondary} rounded-lg p-4`}>
            <h3 className={`font-semibold mb-3 ${colors.text.primary}`}>
              Items ({charges.length})
            </h3>
            <div className="space-y-2">
              {charges.map(charge => (
                <div key={charge.id} className="flex items-center justify-between">
                  <div>
                    <p className={colors.text.primary}>{charge.service.name}</p>
                    <p className={`text-sm ${colors.text.secondary}`}>
                      {charge.quantity} × {formatCurrency(charge.service.unitPrice)}
                    </p>
                  </div>
                  <p className={`font-bold ${colors.text.primary}`}>
                    {formatCurrency(charge.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Discount */}
          <div className={`${colors.bg.secondary} rounded-lg p-4`}>
            <h3 className={`font-semibold mb-3 ${colors.text.primary} flex items-center gap-2`}>
              <Percent className="w-4 h-4" />
              Discount
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={discount.value}
                onChange={(e) => handleDiscountChange(discount.type, e.target.value)}
                min="0"
                className={`flex-1 px-3 py-2 rounded border ${colors.border} ${colors.bg.primary} ${colors.text.primary}`}
              />
              <div className="flex border rounded overflow-hidden">
                <button
                  onClick={() => handleDiscountChange('percentage', discount.value.toString())}
                  className={`px-3 py-2 ${discount.type === 'percentage' ? 'bg-blue-600 text-white' : colors.bg.primary}`}
                >
                  %
                </button>
                <button
                  onClick={() => handleDiscountChange('fixed', discount.value.toString())}
                  className={`px-3 py-2 ${discount.type === 'fixed' ? 'bg-blue-600 text-white' : colors.bg.primary}`}
                >
                  Fixed
                </button>
              </div>
            </div>
            {discount.value > 0 && (
              <p className="text-sm text-green-500 mt-2">
                Discount: {formatCurrency(discountAmount)}
              </p>
            )}
          </div>
        </div>
        
        {/* Right: Payment & Totals */}
        <div className="space-y-6">
          {/* Payment */}
          <div className={`${colors.bg.secondary} rounded-lg p-4`}>
            <h3 className={`font-semibold mb-3 ${colors.text.primary} flex items-center gap-2`}>
              <CreditCard className="w-4 h-4" />
              Payment
            </h3>
            {paymentMethods.map((method, index) => (
              <div key={index} className="space-y-2 mb-3">
                <select
                  value={method.type}
                  onChange={(e) => handlePaymentChange(index, 'type', e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${colors.border} ${colors.bg.primary} ${colors.text.primary}`}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="mobile">Mobile Money</option>
                </select>
                <input
                  type="number"
                  value={method.amount}
                  onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="Amount"
                  className={`w-full px-3 py-2 rounded border ${colors.border} ${colors.bg.primary} ${colors.text.primary}`}
                />
                <button
                  onClick={() => autoFillPayment(index)}
                  className={`w-full text-sm py-1 rounded ${colors.text.secondary} hover:${colors.text.primary}`}
                >
                  Fill Remaining
                </button>
              </div>
            ))}
          </div>
          
          {/* Totals */}
          <div className={`${colors.bg.secondary} rounded-lg p-4`}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={colors.text.secondary}>Subtotal</span>
                <span className={colors.text.primary}>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={colors.text.secondary}>VAT (16%)</span>
                <span className={colors.text.primary}>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className={`font-bold ${colors.text.primary}`}>Grand Total</span>
                <span className={`text-xl font-bold text-green-500`}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              <div className={`pt-2 flex justify-between ${balance === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                <span className="font-medium">Balance</span>
                <span className="font-bold">{balance === 0 ? 'Paid' : formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
          
          {/* Settle Button */}
          <button
            onClick={handleSettle}
            disabled={isProcessing || balance > 0 || charges.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium ${
              isProcessing || balance > 0 || charges.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Settle Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingSummary;