// components/billing-review/components/ReceiptView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import {
  PaymentStatus,
  type PaymentMethod,
  type Discount,
} from '../../../../api/billing-review/BillingReviewTypes';

// Import the four modular components
import { ReceiptHeader } from './receipt-view/ReceiptHeader';
import { ReceiptEmptyState } from './receipt-view/ReceiptEmptyState';
import { PrintableReceipt } from './receipt-view/PrintableReceipt';
import { ReceiptSummary } from './receipt-view/ReceiptSummary';
import { ReceiptFooter } from './receipt-view/ReceiptFooter';
import type { ReceiptTransactionShape } from './receipt-view/printable-receipt/ReceiptTypes';

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
  selectedTransaction: ReceiptTransactionShape;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onPrint: () => void;
  onEmail: () => void;
  onRefund: () => void;
  onVoid: () => void;
  onHistory: () => void;
  onLineItemHistory: (item: any) => void;
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
  onHistory,
}) => {
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: async () => {
      setIsPrinting(false);
    },
  });

  const onPrintClick = () => {
    if (!selectedTransaction || !receiptRef.current) return;
    handlePrint();
    onPrint();
  };

  const resolveDiscountAmount = (subtotal: number, discount?: Discount | null): number => {
    if (!discount) return 0;

    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    const safeValue = Math.max(0, Number(discount.value) || 0);

    const rawDiscount =
      discount.type === 'percentage'
        ? safeSubtotal * (safeValue / 100)
        : safeValue;

    return Math.min(rawDiscount, safeSubtotal);
  };

  const calculateCashBreakdown = (cashAmount: number): CashBreakdown => {
    if (!selectedTransaction) {
      return { tendered: 0, change: 0, netCash: 0 };
    }

    // Calculate grand total from actual transaction data
    const chargeItems = selectedTransaction.charge_items || [];
    const subtotal = chargeItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // FIX: respect discount type so percentage discounts are applied correctly
    const discountAmount = resolveDiscountAmount(subtotal, selectedTransaction.discount);
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const taxes = selectedTransaction.taxes || [];
    const taxTotal = taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);
    const grandTotal = taxableAmount + taxTotal;

    const nonCashTotal =
      selectedTransaction.payment_methods
        ?.filter((pm) => pm.type !== 'cash')
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

    // ========== CALCULATE FROM ACTUAL TRANSACTION DATA ==========
    // selectedTransaction represents the rendered billing state, so use its
    // current charge items, discount, taxes, and payment methods as-is.

    // 1. SUBTOTAL: Sum of all charge items
    const chargeItems = selectedTransaction.charge_items || [];
    const subtotal = chargeItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // 2. DISCOUNT
    // Percentage discount must be converted into an amount from subtotal
    const discountType = selectedTransaction.discount?.type || null;
    const discountValue = Number(selectedTransaction.discount?.value || 0);
    const discountAmount = resolveDiscountAmount(subtotal, selectedTransaction.discount);
    const discountPercent = discountType === 'percentage' ? discountValue : 0;

    // 3. TAXABLE AMOUNT
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // 4. TAX TOTAL
    const taxes = selectedTransaction.taxes || [];
    const taxTotal = taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);

    // 5. GRAND TOTAL
    const grandTotal = taxableAmount + taxTotal;

    // 6. PAYMENT METHODS
    const paymentMethods = selectedTransaction.payment_methods || [];
    const hasCashPayment = paymentMethods.some((pm) => pm.type === 'cash');

    const cashTendered = paymentMethods
      .filter((pm) => pm.type === 'cash')
      .reduce((sum, pm) => sum + (pm.amount || 0), 0);

    const nonCashTotal = paymentMethods
      .filter((pm) => pm.type !== 'cash')
      .reduce((sum, pm) => sum + (pm.amount || 0), 0);

    const totalPaidFromMethods = paymentMethods.reduce(
      (sum: number, pm: PaymentMethod) => sum + (pm.amount || 0),
      0
    );

    // 7. CHANGE
    const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
    const changeAmount =
      cashTendered > remainingAfterNonCash
        ? cashTendered - remainingAfterNonCash
        : 0;

    // 8. NET PAID (FIXED)
    // Net paid = actual cash applied to bill + all non-cash payments
    const cashApplied = cashTendered - changeAmount;
    const netPaid = cashApplied + nonCashTotal;

    // 9. BALANCE DUE
    const balanceDue = Math.max(0, grandTotal - netPaid);

    // 10. REFUNDED placeholder
    const refunded = 0;

    // 11. STATUS
    let status = selectedTransaction.payment_status as PaymentStatus;

    if (grandTotal > 0) {
      if (balanceDue === 0 && netPaid > 0) {
        status = PaymentStatus.PAID_IN_FULL;
      } else if (balanceDue > 0 && balanceDue < grandTotal) {
        status = PaymentStatus.PARTIALLY_PAID;
      } else if (balanceDue === grandTotal && netPaid === 0) {
        status = PaymentStatus.PENDING;
      } else if (changeAmount > 0) {
        status = PaymentStatus.PAID_IN_FULL;
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

  const cashBreakdown: CashBreakdown | null =
    derivedFinancials?.hasCashPayment && derivedFinancials.cashTendered > 0
      ? calculateCashBreakdown(derivedFinancials.cashTendered)
      : null;

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
        onHistory={onHistory}
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