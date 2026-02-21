import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Printer, Mail, Undo2, Ban } from 'lucide-react';
import { PaymentStatus, PAYMENT_STATUS_LABELS } from '../../../../../api/billing-review/BillingReviewTypes';

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

// Define the DerivedFinancials interface properly
interface DerivedFinancials {
  status: PaymentStatus;
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
  isPrinting: boolean;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
const getStatusPillClass = (isDark: boolean, status: PaymentStatus) => {
  const variants: Partial<Record<PaymentStatus, string>> = {
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
  
  // Use type assertion or check if status exists
  const variantClass = variants[status];
  return `${variantClass || (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300')} border`;
};

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'email' | 'warn' | 'danger';
  isDark: boolean;
}

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

export const ReceiptHeader: React.FC<ReceiptHeaderProps> = ({
  selectedTransaction,
  derivedFinancials,
  isDark,
  colors,
  isHeaderSticky,
  onPrintClick,
  onEmail,
  onRefund,
  onVoid,
  isPrinting,
}) => {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper function to safely get status label
  const getStatusLabel = (status: PaymentStatus | undefined): string => {
    if (!status) return 'Unknown';
    
    // Check if the status exists in PAYMENT_STATUS_LABELS
    const label = PAYMENT_STATUS_LABELS[status as PaymentStatus];
    return label || 'Unknown';
  };

    // Button configuration for DRY approach
    const buttonConfigs = [
      {
        onClick: onPrintClick,
        disabled: !selectedTransaction || isPrinting,
        icon: <Printer className="w-4 h-4" />,
        label: isPrinting ? 'Printing…' : 'Print',
        variant: 'primary' as const,
        key: 'print'
      },
      // {
      //   onClick: onEmail,
      //   disabled: !selectedTransaction,
      //   icon: <Mail className="w-4 h-4" />,
      //   label: 'Email',
      //   variant: 'email' as const,
      //   key: 'email'    //TODO: Implement email in the future.
      // },
      {
        onClick: onRefund,
        disabled: !selectedTransaction,
        icon: <Undo2 className="w-4 h-4" />,
        label: 'Refund',
        variant: 'warn' as const,
        key: 'refund'
      },
      {
        onClick: onVoid,
        disabled: !selectedTransaction,
        icon: <Ban className="w-4 h-4" />,
        label: 'Void',
        variant: 'danger' as const,
        key: 'void'
      }
    ];

  // Order buttons based on screen size
  const orderedButtons = isLargeScreen 
    ? [...buttonConfigs].reverse() // Desktop: Void, Refund, Email, Print
    : buttonConfigs; // Mobile: Print, Email, Refund, Void

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
                  ? 'Preview, print, email, refund, or void'
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
              getStatusPillClass(isDark, derivedFinancials.status)
            )}
          >
            {getStatusLabel(derivedFinancials.status)}
          </motion.span>
        )}
      </div>

      {/* Actions with animation - DRY implementation with responsive ordering */}
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
          />
        ))}
      </motion.div>
    </div>
  );
};