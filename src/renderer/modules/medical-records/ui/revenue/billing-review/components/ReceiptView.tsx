// components/billing-review/components/ReceiptView.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  AlertCircle,
  Ban,
  Receipt,
  Mail,
  Printer,
  Undo2,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  CheckCircle2,
  FileText,
  Hash,
  Calendar,
  User,
  Package,
  Tag,
  Percent,
  ArrowLeftRight,
  Building,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState }  from '../../../../../../app/store/rootReducer';
import { getActiveFacilityName } from '../../../../../../app/store/utils/contextSelectors';
import { 
  PaymentStatus, 
  PAYMENT_STATUS_LABELS,
  formatCurrency,
  type BillingReviewItem,
  type PaymentMethod,
  type ChargeItem,
  type Tax,
  type Discount,
} from '../../../../api/billing-review/BillingReviewTypes';

interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
    stripe: string;
    stripeAlt: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  border: {
    primary: string;
    subtle: string;
  };
  ring: string;
  accent: {
    primary: string;
    hover: string;
    text: string;
  };
}

interface ReceiptViewProps {
  selectedTransaction: BillingReviewItem | null;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onPrint: () => void;
  onEmail: () => void;
  onRefund: () => void;
  onVoid: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'email' | 'warn' | 'danger';
  isDark: boolean;
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
  discountType: Discount['type'] | null;
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

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getStatusPillClass = (isDark: boolean, status: PaymentStatus) => {
  const variants = {
    [PaymentStatus.PAID_IN_FULL]: isDark 
      ? 'bg-green-900/30 text-green-300 border-green-700' 
      : 'bg-green-100 text-green-800 border-green-200',
    [PaymentStatus.PARTIALLY_PAID]: isDark 
      ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [PaymentStatus.PENDING]: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    [PaymentStatus.NOT_BILLED]: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
    [PaymentStatus.INSURANCE_PENDING]: isDark 
      ? 'bg-purple-900/30 text-purple-300 border-purple-700' 
      : 'bg-purple-100 text-purple-800 border-purple-200',
    [PaymentStatus.DENIED]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [PaymentStatus.BAD_DEBT]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [PaymentStatus.CHARITY_CARE]: isDark 
      ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700' 
      : 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return `${variants[status] || (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300')} border`;
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

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  icon,
  label,
  variant = 'primary',
  isDark,
}) => {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer';
  
  const styles = variant === 'primary'
    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-sm hover:shadow focus:ring-blue-500'
    : variant === 'email'
    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm hover:shadow focus:ring-purple-500'
    : variant === 'secondary'
    ? cx(
        isDark
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 shadow-sm'
          : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm'
      )
    : variant === 'warn'
    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow focus:ring-amber-500'
    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow focus:ring-red-500';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cx(base, styles, disabled && 'opacity-50 cursor-not-allowed')}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  selectedTransaction,
  theme,
  colors,
  onPrint,
  onEmail,
  onRefund,
  onVoid,
}) => {
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get facility info from Redux context selectors
  const facilityName = useSelector((state: RootState) => getActiveFacilityName(state));

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsHeaderSticky(scrollTop > 20);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: selectedTransaction?.receipt_number || 'receipt',
    onBeforePrint: async () => { setIsPrinting(true); },
    onAfterPrint: async () => { setIsPrinting(false); },
  });

  const onPrintClick = () => {
    if (!selectedTransaction || !receiptRef.current) return;
    handlePrint();
    onPrint();
  };

  const calculateCashBreakdown = (cashAmount: number): CashBreakdown => {
    if (!selectedTransaction) return { tendered: 0, change: 0, netCash: 0 };
    
    const grandTotal = selectedTransaction.billing_data.grandTotal || 0;
    const nonCashTotal = selectedTransaction.payment_methods
      ?.filter(pm => pm.type !== 'cash')
      ?.reduce((sum, pm) => sum + (pm.amount || 0), 0) || 0;
    
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const change = cashAmount > remainingAfterNonCash ? cashAmount - remainingAfterNonCash : 0;
    const netCash = cashAmount - change;
    
    return {
      tendered: cashAmount,
      change,
      netCash,
    };
  };

  const getDerivedFinancials = (): DerivedFinancials | null => {
    if (!selectedTransaction) return null;
    
    const billingData = selectedTransaction.billing_data;
    
    // Calculate subtotal from charge items
    const subtotal = selectedTransaction.charge_items?.reduce(
      (sum: number, item: ChargeItem) => sum + (item.totalAmount || 0), 
      0
    ) || 0;
    
    // Get discount information
    const discountAmount = billingData.discountAmount || 0;
    const discountType = selectedTransaction.discount?.type || null;
    const discountPercent = selectedTransaction.discount?.type === 'percentage' 
      ? selectedTransaction.discount.value 
      : 0;
    
    // Calculate tax total from billingData.taxes array
    const taxTotal = billingData.taxes?.reduce(
      (sum: number, tax: Tax) => sum + (tax.amount || 0), 
      0
    ) || 0;
    
    // Grand total from billing data
    const grandTotal = billingData.grandTotal || 0;
    
    // Payment method breakdown
    const paymentMethods = selectedTransaction.payment_methods || [];
    const hasCashPayment = paymentMethods.some(pm => pm.type === 'cash');
    
    // Calculate cash tendered (sum of all cash payments)
    const cashTendered = paymentMethods
      .filter(pm => pm.type === 'cash')
      .reduce((sum, pm) => sum + (pm.amount || 0), 0);
    
    // Calculate non-cash total
    const nonCashTotal = paymentMethods
      .filter(pm => pm.type !== 'cash')
      .reduce((sum, pm) => sum + (pm.amount || 0), 0);
    
    // Calculate change based on cash tendered vs remaining balance after non-cash payments
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount = cashTendered > remainingAfterNonCash 
      ? cashTendered - remainingAfterNonCash 
      : 0;
    
    // Total paid from all methods
    const totalPaidFromMethods = paymentMethods.reduce(
      (sum: number, pm: PaymentMethod) => sum + (pm.amount || 0), 
      0
    ) || 0;
    
    // Net paid after accounting for change
    const netPaid = totalPaidFromMethods - changeAmount;
    
    // Calculate refunded amount (placeholder)
    const refunded = 0;
    
    // Balance due
    const balanceDue = Math.max(0, grandTotal - netPaid);
    
    // Determine correct status based on calculated values
    let status = selectedTransaction.payment_status;
    
    if (grandTotal > 0) {
      if (changeAmount > 0) {
        status = PaymentStatus.PAID_IN_FULL; // Overpayment still results in paid status
      } else if (balanceDue === 0 && netPaid > 0) {
        status = PaymentStatus.PAID_IN_FULL;
      } else if (balanceDue > 0 && balanceDue < grandTotal) {
        status = PaymentStatus.PARTIALLY_PAID;
      } else if (balanceDue === grandTotal && netPaid === 0) {
        status = PaymentStatus.PENDING;
      }
    }
    
    return {
      status,
      refunded,
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
      hasCashPayment,
      nonCashTotal,
    };
  };

  const derivedFinancials = getDerivedFinancials();
  const watermark = derivedFinancials ? watermarkForStatus(derivedFinancials) : { text: 'RECEIPT', color: 'text-gray-400' };

  // Calculate cash breakdown if there are cash payments - FIXED: Type-safe access
  const cashBreakdown: CashBreakdown | null = derivedFinancials?.hasCashPayment && derivedFinancials.cashTendered > 0
    ? calculateCashBreakdown(derivedFinancials.cashTendered)
    : null;

  // Safe access to change property - FIXED: Optional chaining with nullish coalescing
  const changeAmount = cashBreakdown?.change ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cx(
        'flex flex-col h-full min-h-0 border rounded-xl shadow-sm overflow-hidden w-full relative',
        colors.border.primary,
        colors.bg.elevated
      )}
    >
      {/* Sticky Header with backdrop blur */}
      <div
        className={cx(
          'flex-shrink-0 px-5 py-4 border-b transition-all duration-200 z-20',
          colors.border.primary,
          colors.bg.secondary,
          isHeaderSticky && 'sticky top-0 bg-opacity-95 backdrop-blur-sm'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <motion.div
                whileHover={{ rotate: 5 }}
                className={cx('p-2 rounded-lg cursor-pointer', isDark ? 'bg-blue-900/30' : 'bg-blue-100')}
              >
                <Receipt className={cx('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
              </motion.div>
              <div>
                <h3 className={cx('text-base font-bold', colors.text.primary)}>
                  <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Receipt Details
                  </span>
                </h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  {selectedTransaction
                    ? 'Preview, print, email, refund, or void'
                    : 'Select a transaction to view receipt'}
                </p>
              </div>
            </div>
          </div>

          {selectedTransaction && derivedFinancials && (
            <motion.span
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={cx(
                'px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 cursor-default',
                getStatusPillClass(isDark, derivedFinancials.status)
              )}
            >
              {PAYMENT_STATUS_LABELS[derivedFinancials.status]}
            </motion.span>
          )}
        </div>

        {/* Actions with animation */}
        <motion.div 
          layout
          className="mt-4 flex flex-wrap gap-2 no-print"
        >
          <ActionButton
            onClick={onPrintClick}
            disabled={!selectedTransaction || isPrinting}
            icon={<Printer className="w-4 h-4" />}
            label={isPrinting ? 'Printing…' : 'Print'}
            variant="primary"
            isDark={isDark}
          />

          <ActionButton
            onClick={onEmail}
            disabled={!selectedTransaction}
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            variant="email"
            isDark={isDark}
          />

          <ActionButton
            onClick={onRefund}
            disabled={!selectedTransaction}
            icon={<Undo2 className="w-4 h-4" />}
            label="Refund"
            variant="warn"
            isDark={isDark}
          />

          <ActionButton
            onClick={onVoid}
            disabled={!selectedTransaction}
            icon={<Ban className="w-4 h-4" />}
            label="Void"
            variant="danger"
            isDark={isDark}
          />
        </motion.div>
      </div>

      {/* Receipt Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 min-h-0 scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {!selectedTransaction || !derivedFinancials ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className={cx('p-4 rounded-xl mb-4 cursor-pointer', isDark ? 'bg-gray-800' : 'bg-gray-100')}
              whileHover={{ scale: 1.05 }}
            >
              <Receipt className={cx('w-16 h-16', colors.text.tertiary)} />
            </motion.div>
            <p className={cx('text-sm text-center font-medium', colors.text.primary)}>
              No Transaction Selected
            </p>
            <p className={cx('text-xs text-center mt-1', colors.text.secondary)}>
              Select a transaction from the left panel to view the receipt
            </p>
          </motion.div>
        ) : (
          <div className="mx-auto w-full max-w-[480px]">
            {/* Printable Receipt with Calm Border */}
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
                <div ref={receiptRef} className="receipt-print relative z-10">
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

                    {/* Receipt Header - FIXED: Dynamic facility name */}
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
                            <span className="font-black flex-shrink-0">
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
                            Discount {derivedFinancials.discountPercent > 0 && derivedFinancials.discountType === 'percentage' 
                              ? `(${derivedFinancials.discountPercent}%)` 
                              : ''}
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

                        {/* Cash-specific details - FIXED: Type-safe access */}
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

                          {/* FIXED: Type-safe access to changeAmount */}
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

            {/* Summary hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cx(
                'mt-4 p-4 rounded-xl border no-print cursor-pointer transition-all hover:shadow-md',
                isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              )}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle2
                    className={cx(
                      'w-5 h-5 mt-0.5 flex-shrink-0',
                      isDark ? 'text-green-400' : 'text-green-600'
                    )}
                  />
                </motion.div>
                <div>
                  <p className={cx('text-sm font-semibold', colors.text.primary)}>
                    Payment Summary
                  </p>
                  <p className={cx('text-xs mt-1 leading-relaxed', colors.text.secondary)}>
                    Subtotal: {formatCurrency(derivedFinancials.subtotal)} | 
                    Discount: {derivedFinancials.discountAmount > 0 ? `-${formatCurrency(derivedFinancials.discountAmount)}` : 'None'} | 
                    Tax: +{formatCurrency(derivedFinancials.taxTotal)} | 
                    Paid: {formatCurrency(derivedFinancials.netPaid)} | 
                    {changeAmount > 0 && ` Change: ${formatCurrency(changeAmount)} | `}
                    Balance: {derivedFinancials.balanceDue === 0 ? 'Paid in Full' : formatCurrency(derivedFinancials.balanceDue)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cx('no-print flex-shrink-0 px-5 py-4 border-t', colors.border.primary, colors.bg.secondary)}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className={cx('w-4 h-4 flex-shrink-0 mt-0.5', colors.text.tertiary)} />
          <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
            {selectedTransaction
              ? `Viewing ${selectedTransaction.receipt_number || 'Draft'} • ${selectedTransaction.patient_name} • ${selectedTransaction.patient_number}`
              : 'Select a transaction to view its receipt details and perform actions'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};