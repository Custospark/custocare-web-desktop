import React from 'react';
import { X } from 'lucide-react';
import type { ThemeColors } from '../RefundModal';
import { cx } from '../../../utils';

interface RefundModalHeaderProps {
  colors: ThemeColors;
  isDark: boolean;
  isProcessing: boolean;
  onClose: () => void;
}

export const MainRefundModalHeader: React.FC<RefundModalHeaderProps> = ({
  colors,
  isDark,
  isProcessing,
  onClose,
}) => {
  return (
    <div className={cx(
      'flex items-center justify-between px-5 py-4 border-b rounded-t-xl',
      colors.border.primary,
      colors.bg.primary
    )}>
      <h2 className={cx('text-lg font-bold', colors.text.primary)}>
        Process Refund
      </h2>
      <button
        type="button"
        onClick={onClose}
        disabled={isProcessing}
        style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
        className={cx(
          'p-2 rounded-lg transition',
          isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600',
          isProcessing && 'opacity-50',
          // Force cursor styles with important if needed
          !isProcessing && 'cursor-pointer'
        )}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};