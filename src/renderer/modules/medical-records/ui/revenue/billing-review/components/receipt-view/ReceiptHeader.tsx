// components/billing-review/components/receipt-view/ReceiptHeader.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Printer, Undo2, Ban, History, Clock, FileText } from 'lucide-react';
import { BillingCycleStatus, BILLING_CYCLE_STATUS_LABELS, PaymentStatus } from '../../../../../api/billing-review/BillingReviewTypes';

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

type ReceiptStatus = BillingCycleStatus | PaymentStatus;

// Define the DerivedFinancials interface properly
interface DerivedFinancials {
  status: ReceiptStatus;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: any | null;
  taxTotal: number;
  totalPaidFromMethods: number;
  cashTendered: number;
  changeAmount: number;
  hasCashPayment: boolean;
  nonCashTotal: number;
}

interface ReceiptHeaderProps {
  selectedTransaction: any | null;
  derivedFinancials: DerivedFinancials | null;
  isDark: boolean;
  colors: ThemeColors;
  isHeaderSticky: boolean;
  onPrintClick: () => void;
  onEmail: () => void;
  onRefund: () => void;
  onVoid: () => void;
  onHistory: () => void;
  isPrinting: boolean;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getStatusPillClass = (isDark: boolean, status: BillingCycleStatus) => {
  const variants: Partial<Record<BillingCycleStatus, string>> = {
    [BillingCycleStatus.PAID_IN_FULL]: isDark 
      ? 'bg-green-900/30 text-green-300 border-green-700' 
      : 'bg-green-100 text-green-800 border-green-200',
    [BillingCycleStatus.PENDING]: isDark 
      ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [BillingCycleStatus.PENDING_SUBMISSION]: isDark 
      ? 'bg-orange-900/30 text-orange-300 border-orange-700' 
      : 'bg-orange-100 text-orange-800 border-orange-200',
    [BillingCycleStatus.PARTIALLY_PAID]: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    [BillingCycleStatus.DRAFT]: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    [BillingCycleStatus.PAYMENT_PLAN]: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
    [BillingCycleStatus.PENDING_REVIEW]: isDark 
      ? 'bg-purple-900/30 text-purple-300 border-purple-700' 
      : 'bg-purple-100 text-purple-800 border-purple-200',
    [BillingCycleStatus.WRITTEN_OFF]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [BillingCycleStatus.FULLY_REFUNDED]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [BillingCycleStatus.PARTIALLY_REFUNDED]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [BillingCycleStatus.DISPUTED]: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    [BillingCycleStatus.CHARITY_CARE]: isDark 
      ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700' 
      : 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  
  const variantClass = variants[status];
  return `${variantClass || (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300')} border`;
};

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'email' | 'warn' | 'danger' | 'history';
  isDark: boolean;
  show?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  icon,
  label,
  variant = 'primary',
  isDark,
  show = true,
}) => {
  if (!show) return null;
  
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
    : variant === 'danger'
    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow focus:ring-red-500'
    : variant === 'history'
    ? cx(
        'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm hover:shadow focus:ring-purple-500',
        'before:content-[""] before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-400 before:to-purple-500 before:opacity-0 hover:before:opacity-20 before:transition-opacity relative overflow-hidden'
      )
    : '';

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

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({
  selectedTransaction,
  derivedFinancials,
  isDark,
  colors,
  isHeaderSticky,
  onPrintClick,
  onRefund,
  onVoid,
  onHistory,
  isPrinting,
}) => {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getStatusLabel = (status: BillingCycleStatus | undefined): string => {
    if (!status) return 'Unknown';
    const label = BILLING_CYCLE_STATUS_LABELS[status as BillingCycleStatus];
    return label || 'Unknown';
  };

  // Smart button visibility based on billing status
  const buttonVisibility = useMemo(() => {
    if (!selectedTransaction || !derivedFinancials) {
      return {
        showPrint: true,
        showRefund: false,
        showVoid: false,
        showHistory: true,
      };
    }

    const status = selectedTransaction.billing_status;
    const hasPayment = derivedFinancials.totalPaidFromMethods > 0;

    switch (status) {
      case BillingCycleStatus.PAID_IN_FULL:
        return {
          showPrint: true,
          showRefund: true,
          showVoid: false,
          showHistory: true,
        };
      
      case BillingCycleStatus.PARTIALLY_PAID:
        return {
          showPrint: true,
          showRefund: true,
          showVoid: false,
          showHistory: true,
        };
      
      case BillingCycleStatus.PARTIALLY_REFUNDED:
        return {
          showPrint: true,
          showRefund: true, // Allow additional refunds
          showVoid: false,
          showHistory: true,
        };
      
      case BillingCycleStatus.FULLY_REFUNDED:
        return {
          showPrint: true,
          showRefund: false,
          showVoid: false,
          showHistory: true,
        };
      
      case BillingCycleStatus.PENDING:
        // Generic pending state - can void but not refund
        return {
          showPrint: true,
          showRefund: false,
          showVoid: true,
          showHistory: true,
        };
      
      case BillingCycleStatus.PENDING_SUBMISSION:
        // Ready to submit to insurance - can void but not refund
        return {
          showPrint: true,
          showRefund: false,
          showVoid: true,
          showHistory: true,
        };
      
      case BillingCycleStatus.PENDING_REVIEW:
        // Under review - can void but not refund
        return {
          showPrint: true,
          showRefund: false,
          showVoid: true,
          showHistory: true,
        };
      
      case BillingCycleStatus.DRAFT:
        // Draft status - can void but not refund
        return {
          showPrint: true,
          showRefund: false,
          showVoid: true,
          showHistory: true,
        };
      
      case BillingCycleStatus.WRITTEN_OFF:
      case BillingCycleStatus.DISPUTED:
        return {
          showPrint: true,
          showRefund: false,
          showVoid: false,
          showHistory: true,
        };
      
      default:
        return {
          showPrint: true,
          showRefund: hasPayment,
          showVoid: status === BillingCycleStatus.DRAFT || 
                   status === BillingCycleStatus.PENDING ||
                   status === BillingCycleStatus.PENDING_SUBMISSION ||
                   status === BillingCycleStatus.PENDING_REVIEW,
          showHistory: true,
        };
    }
  }, [selectedTransaction, derivedFinancials]);

  const buttonConfigs = useMemo(() => [
    {
      onClick: onPrintClick,
      disabled: !selectedTransaction || isPrinting,
      icon: <Printer className="w-4 h-4" />,
      label: isPrinting ? 'Printing…' : 'Print',
      variant: 'primary' as const,
      key: 'print',
      show: buttonVisibility.showPrint
    },
    {
      onClick: onRefund,
      disabled: !selectedTransaction,
      icon: <Undo2 className="w-4 h-4" />,
      label: 'Refund',
      variant: 'warn' as const,
      key: 'refund',
      show: buttonVisibility.showRefund
    },
    {
      onClick: onVoid,
      disabled: !selectedTransaction,
      icon: <Ban className="w-4 h-4" />,
      label: 'Void',
      variant: 'danger' as const,
      key: 'void',
      show: buttonVisibility.showVoid
    },
    {
      onClick: onHistory,
      disabled: !selectedTransaction,
      icon: <History className="w-4 h-4" />,
      label: 'History',
      variant: 'history' as const,
      key: 'history',
      show: buttonVisibility.showHistory
    }
  ].filter(config => config.show), [selectedTransaction, isPrinting, onPrintClick, onRefund, onVoid, onHistory, buttonVisibility]);

  const orderedButtons = isLargeScreen 
    ? [...buttonConfigs].reverse()
    : buttonConfigs;

  return (
    <div
      className={cx(
        'shrink-0 px-5 py-4 border-b transition-all duration-200 z-20',
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
                <span className="bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Payment Details
                </span>
              </h3>
              <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                {selectedTransaction
                  ? getActionHint(selectedTransaction.billing_status, buttonVisibility)
                  : 'Select a transaction to view receipt'}
              </p>
            </div>
          </div>
        </div>

        {selectedTransaction && derivedFinancials && derivedFinancials.status && (
          <motion.span
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className={cx(
              'px-3 py-1.5 rounded-full text-xs font-bold flex-linear-0 cursor-default',
              getStatusPillClass(isDark, selectedTransaction.billing_status)
            )}
          >
            {getStatusLabel(selectedTransaction.billing_status)}
          </motion.span>
        )}
      </div>

      <motion.div 
        layout
        className="mt-4 flex flex-wrap gap-2 no-print"
      >
        {orderedButtons.map((button) => (
          <ActionButton
            key={button.key}
            onClick={button.onClick}
            disabled={button.disabled}
            icon={button.icon}
            label={button.label}
            variant={button.variant}
            isDark={isDark}
            show={button.show}
          />
        ))}
      </motion.div>
    </div>
  );
};

const getActionHint = (status: BillingCycleStatus, visibility: any): string => {
  if (visibility.showRefund && visibility.showVoid) {
    return 'Print, refund, or void this transaction';
  }
  if (visibility.showRefund) {
    return 'Print or refund this transaction';
  }
  if (visibility.showVoid) {
    switch (status) {
      case BillingCycleStatus.PENDING:
        return 'Print or void this pending transaction';
      case BillingCycleStatus.PENDING_SUBMISSION:
        return 'Print or void this pending submission';
      case BillingCycleStatus.PENDING_REVIEW:
        return 'Print or void this pending review';
      case BillingCycleStatus.DRAFT:
        return 'Print or void this draft';
      default:
        return 'Print or void this transaction';
    }
  }
  return 'View transaction details or history';
};