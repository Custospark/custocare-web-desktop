import React from 'react';
import { cx } from '../../../utils';
import { REFUND_REASON_LABELS, RefundReason }  from '../../../../../../api/refund/RefundTypes';
import type { ThemeColors } from '../RefundModal';

interface RefundTypeAndReasonSelectorProps {
  refundType: 'full' | 'partial';
  reason: RefundReason | '';
  reasonNotes: string;
  isProcessing: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onRefundTypeChange: (type: 'full' | 'partial') => void;
  onReasonChange: (reason: RefundReason | '') => void;
  onReasonNotesChange: (notes: string) => void;
}

export const RefundTypeAndReasonSelector = React.memo<RefundTypeAndReasonSelectorProps>(({
  refundType,
  reason,
  reasonNotes,
  isProcessing,
  colors,
  isDark,
  onRefundTypeChange,
  onReasonChange,
  onReasonNotesChange,
}) => {
  const requiresNotes = reason === 'other';

  return (
    <div className="space-y-4">
      {/* Refund Type & Reason Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Refund Type */}
        <div>
          <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
            Refund Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="refundType"
                value="full"
                checked={refundType === 'full'}
                onChange={() => onRefundTypeChange('full')}
                disabled={isProcessing}
                className="cursor-pointer"
              />
              <span className={cx('text-sm', colors.text.secondary)}>Full Refund</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="refundType"
                value="partial"
                checked={refundType === 'partial'}
                onChange={() => onRefundTypeChange('partial')}
                disabled={isProcessing}
                className="cursor-pointer"
              />
              <span className={cx('text-sm', colors.text.secondary)}>Partial Refund</span>
            </label>
          </div>
        </div>

        {/* Refund Reason */}
        <div>
          <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
            Refund Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => onReasonChange(e.target.value as RefundReason)}
            required
            disabled={isProcessing}
            className={cx(
              'w-full px-4 py-2.5 rounded-lg border text-sm cursor-pointer',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
              colors.ring,
              isProcessing && 'cursor-not-allowed opacity-50'
            )}
          >
            <option value="">Select a reason</option>
            {Object.entries(REFUND_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reason Notes */}
      {requiresNotes && (
        <div>
          <textarea
            value={reasonNotes}
            onChange={(e) => onReasonNotesChange(e.target.value)}
            placeholder="Please provide details for 'Other' reason..."
            rows={2}
            required
            disabled={isProcessing}
            className={cx(
              'w-full px-4 py-2.5 rounded-lg border text-sm resize-none',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
              colors.ring,
              isProcessing && 'cursor-not-allowed opacity-50'
            )}
          />
        </div>
      )}
    </div>
  );
});

RefundTypeAndReasonSelector.displayName = 'RefundTypeAndReasonSelector';