// components/billing-review/components/ReceiptSummary.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../../../api/billing-review/BillingReviewTypes';
interface ThemeColors {
  text: {
    primary: string;
    secondary: string;
  };
}

interface DerivedFinancials {
  subtotal: number;
  discountAmount: number;
  taxTotal: number;
  netPaid: number;
  balanceDue: number;
}

interface ReceiptSummaryProps {
  derivedFinancials: DerivedFinancials;
  changeAmount: number;
  isDark: boolean;
  colors: ThemeColors;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({
  derivedFinancials,
  changeAmount,
  isDark,
  colors,
}) => {
  return (
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
  );
};