// components/billing-review/components/ReceiptView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import type { ChargeItem } from '../../../../api/billing-review/BillingReviewTypes';

// Import the four modular components
import { ReceiptHeader } from './receipt-view/ReceiptHeader';
import { ReceiptEmptyState } from './receipt-view/ReceiptEmptyState';
import { PrintableReceipt } from './receipt-view/PrintableReceipt';
import { ReceiptSummary } from './receipt-view/ReceiptSummary';
import { ReceiptFooter } from './receipt-view/ReceiptFooter';
import type { ReceiptTransactionShape } from './receipt-view/printable-receipt/ReceiptTypes';
import {
  getCashBreakdownForTransaction,
  getDerivedFinancialsFromReceiptTransaction,
} from '../deriveReceiptPrintModel';

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
  onLineItemHistory: (item: ChargeItem) => void;
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

  const derivedFinancials = getDerivedFinancialsFromReceiptTransaction(selectedTransaction);

  const cashBreakdown =
    derivedFinancials?.hasCashPayment && derivedFinancials.cashTendered > 0
      ? getCashBreakdownForTransaction(selectedTransaction, derivedFinancials.cashTendered)
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