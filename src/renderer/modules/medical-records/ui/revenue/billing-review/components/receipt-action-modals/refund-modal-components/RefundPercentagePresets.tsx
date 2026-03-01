import React from 'react';
import { Percent } from 'lucide-react';
import { cx } from '../../../utils';
import { type ThemeColors } from '../../Modals';

interface RefundPercentagePresetsProps {
  refundPercentage: number;
  isProcessing: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onPercentageChange: (percentage: number) => void;
  selectedItemsCount: number;
  totalItemsCount: number;
}

const REFUND_PRESETS = [25, 50, 75, 100];

export const RefundPercentagePresets = React.memo<RefundPercentagePresetsProps>(({
  refundPercentage,
  isProcessing,
  colors,
  isDark,
  onPercentageChange,
  selectedItemsCount,
  totalItemsCount,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Percent className={cx('w-4 h-4', colors.text.secondary)} />
      <div className="flex gap-1 flex-wrap">
        {REFUND_PRESETS.map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => onPercentageChange(preset)}
            disabled={isProcessing}
            className={cx(
              'px-3 py-1 text-xs rounded transition',
              refundPercentage === preset
                ? isDark ? 'bg-amber-600 text-white' : 'bg-amber-600 text-white'
                : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {preset}%
          </button>
        ))}
      </div>
      <span className={cx('text-sm ml-2', colors.text.secondary)}>
        {selectedItemsCount} of {totalItemsCount} items
      </span>
    </div>
  );
});

RefundPercentagePresets.displayName = 'RefundPercentagePresets';