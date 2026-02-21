import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  Hash,
  User,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  FileText,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BILLING_CYCLE_STATUS_LABELS,
  formatCurrency,
  type BillingReviewItem,
  BillingCycleStatus,
  PaymentMethodType,
} from '../../../../../api/billing-review/BillingReviewTypes';

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

interface TransactionListItemProps {
  transaction: BillingReviewItem;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  uniqueKey: string;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onSelect: (id: string) => void;
  selectedItemRef?: React.RefObject<HTMLDivElement | null>;
}

// Utility function for conditional classes
const cx = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(' ');

// Status pill styling based on theme and status
const getStatusPillClass = (isDark: boolean, status: BillingCycleStatus): string => {
  const colorMap: Record<string, string> = {
    success: isDark 
      ? 'bg-green-500/20 text-green-300 border-green-500' 
      : 'bg-green-200 text-green-900 border-green-400',
    warning: isDark 
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' 
      : 'bg-yellow-200 text-yellow-900 border-yellow-400',
    error: isDark 
      ? 'bg-red-500/20 text-red-300 border-red-500' 
      : 'bg-red-200 text-red-900 border-red-400',
    info: isDark 
      ? 'bg-blue-500/20 text-blue-300 border-blue-500' 
      : 'bg-blue-200 text-blue-900 border-blue-400',
    secondary: isDark 
      ? 'bg-gray-600 text-gray-200 border-gray-500' 
      : 'bg-gray-300 text-gray-900 border-gray-500',
    default: isDark 
      ? 'bg-gray-600 text-gray-200 border-gray-500' 
      : 'bg-gray-300 text-gray-900 border-gray-500',
  };

  // Map billing status to color variant
  const statusColorMap: Partial<Record<BillingCycleStatus, string>> = {
    [BillingCycleStatus.PAID_IN_FULL]: 'success',
    [BillingCycleStatus.PARTIALLY_PAID]: 'info',
    [BillingCycleStatus.DRAFT]: 'info',
    [BillingCycleStatus.PENDING_REVIEW]: 'info',
    [BillingCycleStatus.PENDING_SUBMISSION]: 'info',
    [BillingCycleStatus.SUBMITTED_TO_INSURANCE]: 'secondary',
    [BillingCycleStatus.PAYMENT_PLAN]: 'secondary',
    [BillingCycleStatus.COLLECTIONS]: 'secondary',
    [BillingCycleStatus.WRITTEN_OFF]: 'error',
    [BillingCycleStatus.DISPUTED]: 'error',
    [BillingCycleStatus.CHARITY_CARE]: 'default',
  };

  const variant = statusColorMap[status] || 'default';
  return `${colorMap[variant]} border`;
};

// Payment icon component
const PaymentIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  const icons: Record<string, React.FC<any>> = {
    [PaymentMethodType.CASH]: Banknote,
    [PaymentMethodType.CARD]: CreditCard,
    [PaymentMethodType.INSURANCE]: Building2,
    [PaymentMethodType.MOBILE]: Smartphone,
    [PaymentMethodType.BANK_TRANSFER]: Building2,
    [PaymentMethodType.CHEQUE]: FileText,
  };
  
  const IconComponent = icons[type] || Banknote;
  return <IconComponent className={className} />;
};

// Date formatter
const formatDisplayDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction: t,
  index,
  isSelected,
  isFirst,
  uniqueKey,
  theme,
  colors,
  onSelect,
  selectedItemRef,
}) => {
  const isDark = theme === 'dark';
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

  return (
    <motion.div
      key={uniqueKey}
      layoutId={uniqueKey}
      ref={isSelected ? selectedItemRef : null}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
      onClick={() => onSelect(t.visit_uuid)}
      className={cx(
        'p-3 border rounded-lg transition-all duration-200 cursor-pointer group relative',
        colors.border.primary,
        index % 2 === 0 ? colors.bg.stripe : colors.bg.stripeAlt,
        isSelected
          ? cx(
              colors.bg.selected,
              isDark ? 'border-blue-700' : 'border-blue-300',
              'ring-2 ring-blue-500 ring-opacity-30',
              'scale-[1.01] z-10'
            )
          : cx(colors.bg.hover, 'hover:border-blue-300 hover:shadow-sm')
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(t.visit_uuid);
        }
      }}
    >
      {/* Selected indicator - blue bar on the left */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
        />
      )}

      {/* Check icon for first selected - positioned above status */}
      {isFirst && isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Check className="w-3.5 h-3.5 stroke-3" />
        </motion.div>
      )}

      {/* Top row: Receipt and Status */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Hash className={cx('w-3 h-3 shrink-0', colors.text.tertiary)} />
          <span className={cx('text-xs font-mono font-medium truncate', colors.text.primary)}>
            {t.receipt_number || 'DRAFT'}
          </span>
        </div>
        <span
          className={cx(
            'px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap',
            getStatusPillClass(isDark, t.billing_status)
          )}
        >
          {BILLING_CYCLE_STATUS_LABELS[t.billing_status]}
        </span>
      </div>

      {/* Middle row: Patient and Date */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className={cx('w-3 h-3 shrink-0', colors.text.tertiary)} />
          <span className={cx('text-xs font-medium truncate', colors.text.primary)}>
            {t.patient_name}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Calendar className={cx('w-3 h-3', colors.text.tertiary)} />
          <span className={cx('text-[10px]', colors.text.secondary)}>
            {formatDisplayDate(t.created_at)}
          </span>
        </div>
      </div>

      {/* Bottom row: Amount and Payment Methods */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          {formatCurrency(t.billing_data.grandTotal)}
        </span>

        <div className="flex items-center gap-1">
          {t.payment_methods.slice(0, 2).map((pm, idx) => (
            <motion.div
              key={`${uniqueKey}-pm-${idx}`}
              whileHover={{ scale: 1.1 }}
              className={cx(
                'p-1 rounded-md',
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              )}
              title={`${pm.type}: ${formatCurrency(pm.amount)}`}
            >
              <PaymentIcon type={pm.type} className="w-3 h-3" />
            </motion.div>
          ))}
          {t.payment_methods.length > 2 && (
            <span className={cx('text-[10px] font-medium px-1', colors.text.tertiary)}>
              +{t.payment_methods.length - 2}
            </span>
          )}
          
          {/* Mobile: Chevron for navigation */}
          {!isLargeScreen && (
            <ChevronRight 
              className={cx(
                'w-3.5 h-3.5 ml-1 transition-transform',
                colors.text.tertiary,
                'group-hover:translate-x-0.5',
                isSelected && 'text-blue-500'
              )} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};