import React from 'react';
import { X, Undo2 } from 'lucide-react';
import { type ThemeColors } from '../../Modals';
import { cx } from '../../../utils';

interface RefundModalHeaderProps {
  colors: ThemeColors;
  isDark: boolean;
  isProcessing: boolean;
  onClose: () => void;
}

export const RefundModalHeader = React.memo<RefundModalHeaderProps>(({
  colors,
  isDark,
  isProcessing,
  onClose,
}) => {
  return (
    <div className={cx('flex items-center justify-between p-5 border-b sticky top-0 z-10', colors.border.primary, colors.bg.elevated)}>
      <div className="flex items-center gap-3">
        <div className={cx('p-2 rounded-lg', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
          <Undo2 className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
        </div>
        <div>
          <h3 className={cx('text-lg font-bold', colors.text.primary)}>Process Refund</h3>
          <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
            Smart refunds with automatic calculations
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={isProcessing}
        className={cx(
          'p-2 rounded-lg transition cursor-pointer',
          colors.text.tertiary,
          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
          isProcessing && 'cursor-not-allowed opacity-50'
        )}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
});

RefundModalHeader.displayName = 'RefundModalHeader';