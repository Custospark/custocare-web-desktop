// components/billing-review/components/ReceiptView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { getActiveFacilityName } from '../../../../../../app/store/utils/contextSelectors';
import { 
  PaymentStatus, 
  type BillingReviewItem,
  type PaymentMethod,
  type ChargeItem,
  type Tax,
  type Discount,
} from '../../../../api/billing-review/BillingReviewTypes';

// Import the four modular components
import { ReceiptHeader } from './receipt-view/ReceiptHeader';
import { ReceiptEmptyState } from './receipt-view/ReceiptEmptyState';
import { PrintableReceipt } from './receipt-view/PrintableReceipt';
import { ReceiptSummary } from './receipt-view/ReceiptSummary';
import { ReceiptFooter } from './receipt-view/ReceiptFooter';
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

  // Calculate cash breakdown if there are cash payments
  const cashBreakdown: CashBreakdown | null = derivedFinancials?.hasCashPayment && derivedFinancials.cashTendered > 0
    ? calculateCashBreakdown(derivedFinancials.cashTendered)
    : null;

  // Safe access to change property
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
      <ReceiptHeader
        selectedTransaction={selectedTransaction}
        derivedFinancials={derivedFinancials}
        isDark={isDark}
        colors={colors}
        isHeaderSticky={isHeaderSticky}
        onPrintClick={onPrintClick}
        onEmail={onEmail}
        onRefund={onRefund}
        onVoid={onVoid}
        isPrinting={isPrinting}
      />

      {/* Receipt Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 min-h-0 scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {!selectedTransaction || !derivedFinancials ? (
          <ReceiptEmptyState isDark={isDark} colors={colors} />
        ) : (
          <div className="mx-auto w-full max-w-120">
            {/* Printable Receipt */}
            <PrintableReceipt
              ref={receiptRef}
              selectedTransaction={selectedTransaction}
              derivedFinancials={derivedFinancials}
              cashBreakdown={cashBreakdown}
              changeAmount={changeAmount}
              isPrinting={isPrinting}
              facilityName={facilityName || 'MEDICAL FACILITY'}
            />

            {/* Summary hint */}
            <ReceiptSummary
              derivedFinancials={derivedFinancials}
              changeAmount={changeAmount}
              isDark={isDark}
              colors={colors}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <ReceiptFooter
        selectedTransaction={selectedTransaction}
        colors={colors}
      />
    </motion.div>
  );
};