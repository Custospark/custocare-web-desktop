import React from 'react';
import { motion } from 'framer-motion';
import { 
  Hash, 
  User, 
  Tag, 
  Calendar, 
  Package, 
  Percent,
  Banknote,
  ArrowLeftRight,
  CreditCard, 
  Building2, 
  Smartphone, 
  FileText 
} from 'lucide-react';
import type { BillingReviewItem, ChargeItem, Tax, PaymentMethod } from '../../../../../api/billing-review/BillingReviewTypes';
import { formatCurrency, PaymentStatus } from '../../../../../api/billing-review/BillingReviewTypes';

interface DerivedFinancials {
  status: any;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: any;
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

interface PrintableReceiptProps {
  selectedTransaction: BillingReviewItem;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  changeAmount: number;
  isPrinting: boolean;
  facilityName: string;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const PaymentIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  const icons: Record<string, React.FC<any>> = {
    cash: Banknote,
    card: CreditCard,
    insurance: Building2,
    mobile: Smartphone,
    bank_transfer: Building2,
    cheque: FileText,
  };
  const IconComponent = icons[type] || Banknote;
  return <IconComponent className={className} />;
};

const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const watermarkForStatus = (derivedFinancials: DerivedFinancials) => {
  const { status, balanceDue, grandTotal, changeAmount } = derivedFinancials;
  
  if (changeAmount > 0) {
    return { text: 'CHANGE GIVEN', color: 'text-blue-600' };
  }
  if (status === PaymentStatus.PAID_IN_FULL || balanceDue === 0) {
    return { text: 'PAID', color: 'text-green-600' };
  }
  if (balanceDue > 0 && balanceDue < grandTotal) {
    return { text: 'PARTIAL', color: 'text-amber-600' };
  }
  if (balanceDue === grandTotal) {
    return { text: 'DUE', color: 'text-red-600' };
  }
  return { text: 'RECEIPT', color: 'text-gray-400' };
};

// Helper function to determine if we should show a discount percentage
const shouldShowDiscountPercentage = (discountAmount: number, subtotal: number): number | null => {
  if (!discountAmount || !subtotal || subtotal === 0) return null;
  
  // Calculate percentage
  const percentage = (discountAmount / subtotal) * 100;
  
  // Round to nearest 0.1% for display
  const roundedPercentage = Math.round(percentage * 10) / 10;
  
  // Only show percentage if:
  // 1. The discount is at least 0.5% (to avoid showing tiny percentages like 0.01%)
  // 2. The discount amount is significant enough (you can adjust these thresholds)
  const MIN_PERCENTAGE_TO_SHOW = 0.5;
  const MIN_DISCOUNT_AMOUNT = 100; // Only show percentage if discount is at least 100 UGX
  
  if (roundedPercentage >= MIN_PERCENTAGE_TO_SHOW && discountAmount >= MIN_DISCOUNT_AMOUNT) {
    return roundedPercentage;
  }
  
  return null;
};

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({
  selectedTransaction,
  derivedFinancials,
  cashBreakdown,
  changeAmount,
  isPrinting,
  facilityName,
}, ref) => {
  const watermark = watermarkForStatus(derivedFinancials);
  
  // Determine if we should show discount percentage
  const discountPercentage = shouldShowDiscountPercentage(
    derivedFinancials.discountAmount, 
    derivedFinancials.subtotal
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Static border wrapper */}
      <div className={`relative rounded-xl ${!isPrinting ? 'p-[2px]' : ''}`}>
        {/* Static gradient border track */}
        {!isPrinting && (
          <div
            className="absolute inset-0 rounded-xl z-0"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
            }}
          />
        )}

        {/* Inner receipt content */}
        <div ref={ref} className="receipt-print relative z-10">
          <div className={cx(
            'bg-white text-black p-6 rounded-[10px] shadow-lg relative overflow-hidden',
            'print:shadow-none print:border',
            !isPrinting && 'border-0'
          )}>
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.06]">
                <span className={cx('text-7xl font-black tracking-widest', watermark.color)}>
                  {watermark.text}
                </span>
              </div>
            </div>

            {/* Receipt Header */}
            <div className="text-center mb-5 relative">
              <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {facilityName || 'MEDICAL CLINIC'}
              </h2>
              <p className="text-xs text-gray-600 mt-1">123 Health Street, Kampala, Uganda</p>
              <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
              <p className="text-xs text-gray-600">Email: info@{facilityName?.toLowerCase().replace(/\s+/g, '') || 'clinic'}.ug</p>
            </div>

            {/* Receipt Meta with icons */}
            <div className="border-t-2 border-b-2 border-gray-300 py-3 my-4 text-xs space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Receipt Number:
                </span>
                <span className="font-black">{selectedTransaction.receipt_number || 'DRAFT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" /> Patient Name:
                </span>
                <span className="font-bold">{selectedTransaction.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Patient Number:
                </span>
                <span>{selectedTransaction.patient_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date:
                </span>
                <span>{formatDisplayDate(selectedTransaction.created_at)}</span>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4 relative">
              <h3 className="text-sm font-black mb-3 text-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4" /> SERVICES RENDERED
              </h3>
              <div className="space-y-2.5">
                {selectedTransaction.charge_items.map((item: ChargeItem, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between text-xs border-b border-gray-200 pb-2 hover:bg-gray-50 p-1 rounded transition-colors cursor-pointer"
                    whileHover={{ x: 2 }}
                  >
                    <div className="min-w-0 pr-3 flex-1">
                      <p className="font-bold truncate">{item.service.name}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {item.quantity} × {formatCurrency(item.service.unitPrice)} • Code: {item.service.code}
                      </p>
                    </div>
                    <span className="font-black shrink-0">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-3 text-xs space-y-2 relative">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold">
                  {formatCurrency(derivedFinancials.subtotal)}
                </span>
              </div>

              {derivedFinancials.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {discountPercentage ? `Discount (${discountPercentage}%)` : 'Discount'}
                  </span>
                  <span className="font-bold">
                    -{formatCurrency(derivedFinancials.discountAmount)}
                  </span>
                </div>
              )}

              {selectedTransaction.billing_data.taxes.map((tax: Tax, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
                  <span className="font-bold">{formatCurrency(tax.amount)}</span>
                </div>
              ))}

              <div className="flex justify-between font-black text-base mt-3 pt-3 border-t-2 border-gray-300">
                <span>TOTAL</span>
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(derivedFinancials.grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            {selectedTransaction.payment_methods && selectedTransaction.payment_methods.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300 text-xs relative">
                <h3 className="text-sm font-black mb-3 text-gray-800">PAYMENT DETAILS</h3>
                
                {/* Individual payment methods */}
                <div className="space-y-2">
                  {selectedTransaction.payment_methods.map((pm: PaymentMethod, index: number) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PaymentIcon type={pm.type} className="w-4 h-4 text-gray-600" />
                        <span className="capitalize font-bold">{pm.type.replace('_', ' ')}</span>
                        {pm.reference && (
                          <span className="text-[10px] text-gray-500 truncate">
                            Ref: {pm.reference}
                          </span>
                        )}
                      </div>
                      <span className="font-black">{formatCurrency(pm.amount)}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Cash-specific details */}
                {cashBreakdown && cashBreakdown.tendered > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5" /> Cash Tendered:
                      </span>
                      <span className="font-black text-gray-900">
                        {formatCurrency(cashBreakdown.tendered)}
                      </span>
                    </div>
                    
                    {cashBreakdown.change > 0 && (
                      <>
                        <div className="flex justify-between items-center text-blue-700">
                          <span className="font-semibold flex items-center gap-1">
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Change:
                          </span>
                          <span className="font-black">{formatCurrency(cashBreakdown.change)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-1 text-xs border-t border-dashed border-gray-200 mt-1">
                          <span className="text-gray-600">Net Cash Payment:</span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(cashBreakdown.netCash)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Show total paid from methods if multiple */}
                {selectedTransaction.payment_methods.length > 1 && (
                  <div className="flex justify-between pt-3 mt-3 border-t border-gray-200 font-bold">
                    <span>Total Payments</span>
                    <span className="text-green-700">
                      {formatCurrency(derivedFinancials.totalPaidFromMethods)}
                    </span>
                  </div>
                )}

                {/* Balance information */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Amount Paid</span>
                    <span className="font-black text-green-700">
                      {formatCurrency(derivedFinancials.netPaid)}
                    </span>
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600 font-semibold">Balance Due</span>
                    <span
                      className={cx(
                        'font-black text-base',
                        derivedFinancials.balanceDue === 0 
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                          : 'text-amber-700'
                      )}
                    >
                      {derivedFinancials.balanceDue === 0
                        ? 'PAID IN FULL'
                        : formatCurrency(derivedFinancials.balanceDue)}
                    </span>
                  </div>

                  {changeAmount > 0 && (
                    <div className="mt-2 text-xs text-gray-500 italic">
                      * Change of {formatCurrency(changeAmount)} returned to Patient.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-5 pt-4 border-t-2 border-gray-300 relative space-y-1">
              <p className="text-[11px] text-gray-600 font-semibold">
                This is a computer-generated receipt
              </p>
              <p className="text-[11px] text-gray-600">Valid without signature</p>
              <p className="text-[10px] text-gray-500 mt-2">
                Thank you for choosing {facilityName || 'Custocare AI'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';