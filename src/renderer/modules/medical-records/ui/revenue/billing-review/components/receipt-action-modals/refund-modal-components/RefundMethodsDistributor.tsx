import React from 'react';
import { Coins } from 'lucide-react';
import { cx } from '../../../utils';
import { REFUND_METHOD_LABELS, RefundMethodType } from '../../../../../../api/refund/RefundTypes';
import { ThemeColors } from '../../Modals';
export interface RefundMethod {
  type: RefundMethodType | '';
  amount: number;
  reference: string;
  originalAmount?: number;
}

interface RefundMethodsDistributorProps {
  refundMethods: RefundMethod[];
  isProcessing: boolean;
  colors: ThemeColors;
  isDark: boolean;
  onUpdateMethod: (index: number, field: 'type' | 'amount' | 'reference', value: string | number) => void;
}

export const RefundMethodsDistributor = React.memo<RefundMethodsDistributorProps>(({
  refundMethods,
  isProcessing,
  colors,
  isDark,
  onUpdateMethod,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={cx('text-sm font-semibold', colors.text.primary)}>
          Refund Methods <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <Coins className={cx('w-4 h-4', colors.text.secondary)} />
          <span className={cx('text-xs', colors.text.secondary)}>
            Auto-calculated from original payment
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {refundMethods.map((method, index) => (
          <div key={index} className="flex gap-2 items-center">
            <select
              value={method.type}
              onChange={(e) => onUpdateMethod(index, 'type', e.target.value)}
              required
              disabled={isProcessing}
              className={cx(
                'flex-1 px-3 py-2 rounded-lg border text-sm cursor-pointer',
                colors.border.primary,
                isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
              )}
            >
              {Object.entries(REFUND_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            
            <div className="w-32">
              <input
                type="number"
                value={method.amount}
                onChange={(e) => onUpdateMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="Amount"
                required
                min={0}
                step={100}
                disabled={isProcessing}
                className={cx(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                )}
              />
            </div>
            
            <input
              type="text"
              value={method.reference}
              onChange={(e) => onUpdateMethod(index, 'reference', e.target.value)}
              placeholder="Reference (opt)"
              disabled={isProcessing}
              className={cx(
                'flex-1 px-3 py-2 rounded-lg border text-sm',
                colors.border.primary,
                isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

RefundMethodsDistributor.displayName = 'RefundMethodsDistributor';