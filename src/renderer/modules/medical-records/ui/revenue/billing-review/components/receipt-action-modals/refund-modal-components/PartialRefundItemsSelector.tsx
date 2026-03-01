import React from 'react';
import { cx } from '../../../utils';
import type { RefundableLineItem } from '../../../../../../api/refund/RefundTypes';
import { type ThemeColors } from '../../Modals';
import { RefundPercentagePresets } from './RefundPercentagePresets';
import { LineItemsTable } from './LineItemsTable';

interface PartialRefundItemsSelectorProps {
  lineItems: RefundableLineItem[];
  refundPercentage: number;
  selectedItemsCount: number;
  isProcessing: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onPercentageChange: (percentage: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onToggleLineItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

export const PartialRefundItemsSelector = React.memo<PartialRefundItemsSelectorProps>(({
  lineItems,
  refundPercentage,
  selectedItemsCount,
  isProcessing,
  colors,
  isDark,
  onPercentageChange,
  onSelectAll,
  onClearAll,
  onToggleLineItem,
  onUpdateQuantity,
}) => {
  return (
    <div className="space-y-3">
      {/* Header with Selection Controls */}
      <div className="flex items-center justify-between">
        <label className={cx('text-sm font-semibold', colors.text.primary)}>
          Select Items to Refund
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={isProcessing}
            className={cx(
              'px-3 py-1 text-xs rounded transition',
              isDark ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            )}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={isProcessing}
            className={cx(
              'px-3 py-1 text-xs rounded transition',
              isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Percentage Presets Component */}
      <RefundPercentagePresets
        refundPercentage={refundPercentage}
        isProcessing={isProcessing}
        colors={colors}
        isDark={isDark}
        onPercentageChange={onPercentageChange}
        selectedItemsCount={selectedItemsCount}
        totalItemsCount={lineItems.length}
      />

      {/* Line Items Table Component */}
      <LineItemsTable
        lineItems={lineItems}
        isProcessing={isProcessing}
        colors={colors}
        isDark={isDark}
        onToggleLineItem={onToggleLineItem}
        onUpdateQuantity={onUpdateQuantity}
      />
    </div>
  );
});

PartialRefundItemsSelector.displayName = 'PartialRefundItemsSelector';