// components/billing-review/components/TransactionListItem.tsx
import React from 'react';
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
  PaymentStatus, 
  PAYMENT_STATUS_LABELS, 
  PAYMENT_STATUS_BADGE_VARIANTS, 
  formatCurrency,
  type BillingReviewItem,
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

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getStatusPillClass = (isDark: boolean, status: PaymentStatus) => {
  const variant = PAYMENT_STATUS_BADGE_VARIANTS[status] || 'default';
  const variants = {
    success: isDark 
      ? 'bg-green-900/30 text-green-300 border-green-700' 
      : 'bg-green-100 text-green-800 border-green-200',
    warning: isDark 
      ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    info: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
    default: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return `${variants[variant] || variants.default} border`;
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
      {/* Selected indicator */}
      {isSelected && (
        <>
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
          />
          
          {isFirst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-3.5 h-3.5 stroke-3" />
            </motion.div>
          )}
        </>
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
            getStatusPillClass(isDark, t.payment_status)
          )}
        >
          {PAYMENT_STATUS_LABELS[t.payment_status]}
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
          {t.payment_methods.slice(0, 2).map((pm, idx: number) => (
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
          <ChevronRight 
            className={cx(
              'w-3.5 h-3.5 ml-1',
              colors.text.tertiary,
              isSelected && 'text-blue-500'
            )} 
          />
        </div>
      </div>
    </motion.div>
  );
};
