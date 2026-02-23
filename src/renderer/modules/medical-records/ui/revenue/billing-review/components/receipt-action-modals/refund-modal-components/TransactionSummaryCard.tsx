import React from 'react';
import { cx } from '../../../utils';
import type { BillingReviewItem } from '../../../../../../api/billing-review/BillingReviewTypes';
import type { ThemeColors } from '../../Modals';

interface TransactionSummaryCardProps {
  selectedTransaction: BillingReviewItem;
  totalRefund: number;
  colors: ThemeColors;
  isDark: boolean;
}

export const TransactionSummaryCard = React.memo<TransactionSummaryCardProps>(({
  selectedTransaction,
  totalRefund,
  colors,
  isDark,
}) => {
  return (
    <div className={cx(
      'p-4 rounded-lg border grid grid-cols-2 md:grid-cols-4 gap-4',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    )}>
      <div>
        <div className={cx('text-xs', colors.text.secondary)}>Receipt</div>
        <div className={cx('font-semibold', colors.text.primary)}>
          {selectedTransaction.receipt_number || 'Draft'}
        </div>
      </div>
      <div>
        <div className={cx('text-xs', colors.text.secondary)}>Patient</div>
        <div className={cx('font-semibold', colors.text.primary)}>
          {selectedTransaction.patient_name}
        </div>
      </div>
      <div>
        <div className={cx('text-xs', colors.text.secondary)}>Total Paid</div>
        <div className={cx('font-semibold text-green-600')}>
          UGX {selectedTransaction.billing_data.grandTotal.toLocaleString()}
        </div>
      </div>
      <div>
        <div className={cx('text-xs', colors.text.secondary)}>Refund Amount</div>
        <div className={cx('font-semibold text-amber-600')}>
          UGX {totalRefund.toLocaleString()}
        </div>
      </div>
    </div>
  );
});

TransactionSummaryCard.displayName = 'TransactionSummaryCard';