import React from 'react';
import { cx } from '../../../utils';
import { formatCurrency } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';
import type { RefundableLineItem } from '../../../../../../api/refund/RefundTypes';
import { type ThemeColors } from '../../Modals';

interface LineItemsTableProps {
  lineItems: RefundableLineItem[];
  isProcessing: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onToggleLineItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

export const LineItemsTable = React.memo<LineItemsTableProps>(({
  lineItems,
  isProcessing,
  colors,
  isDark,
  onToggleLineItem,
  onUpdateQuantity,
}) => {
  return (
    <div className={cx(
      'border rounded-lg overflow-hidden',
      colors.border.primary
    )}>
      {/* Header */}
      <div className={cx(
        'grid grid-cols-12 gap-2 p-3 text-xs font-semibold border-b',
        colors.border.primary,
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      )}>
        <div className="col-span-4">Item</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-2 text-right">Refund Qty</div>
      </div>

      {/* Items */}
      {lineItems.map((item, index) => (
        <div 
          key={item.id} 
          className={cx(
            'grid grid-cols-12 gap-2 p-3 text-xs border-b last:border-b-0',
            colors.border.primary,
            item.is_selected && (isDark ? 'bg-amber-900/20' : 'bg-amber-50')
          )}
        >
          {/* Item Name and Checkbox */}
          <div className="col-span-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.is_selected}
              onChange={() => onToggleLineItem(index)}
              disabled={isProcessing}
              className="cursor-pointer"
            />
            <div>
              <div className={cx('font-medium', colors.text.primary)}>
                {item.service_name}
              </div>
              <div className={cx('text-xs', colors.text.tertiary)}>
                {item.service_code}
              </div>
            </div>
          </div>

          {/* Original Quantity */}
          <div className="col-span-2 text-center self-center">
            {item.original_quantity}
          </div>

          {/* Unit Price */}
          <div className="col-span-2 text-right self-center">
            {formatCurrency(item.unit_price)}
          </div>

          {/* Total Amount */}
          <div className="col-span-2 text-right self-center">
            {formatCurrency(item.net_amount)}
          </div>

          {/* Refund Quantity Input */}
          <div className="col-span-2">
            <input
              type="number"
              value={item.quantity || 0}
              onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 0)}
              disabled={!item.is_selected || isProcessing}
              min={0}
              max={item.original_quantity}
              className={cx(
                'w-full px-2 py-1 rounded border text-right text-sm',
                colors.border.primary,
                isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                !item.is_selected && 'opacity-50'
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

LineItemsTable.displayName = 'LineItemsTable';