import React, { useMemo, useCallback } from 'react';
import { Coins, AlertCircle, Plus, Trash2 } from 'lucide-react';
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
  onAddMethod?: () => void;
  onRemoveMethod?: (index: number) => void;
}

export const RefundMethodsDistributor = React.memo<RefundMethodsDistributorProps>(({
  refundMethods,
  isProcessing,
  colors,
  isDark,
  onUpdateMethod,
  onAddMethod,
  onRemoveMethod,
}) => {
  // Calculate total of all refund amounts
  const totalRefundAmount = useMemo(() => {
    return refundMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
  }, [refundMethods]);

  // Calculate total of original amounts
  const totalOriginalAmount = useMemo(() => {
    return refundMethods.reduce((sum, method) => sum + (method.originalAmount || 0), 0);
  }, [refundMethods]);

  // Check if total refund exceeds total original amount
  const totalExceeded = totalRefundAmount > totalOriginalAmount;

  // Calculate remaining amount available for distribution
  const remainingAmount = useMemo(() => {
    return Math.max(0, totalOriginalAmount - totalRefundAmount);
  }, [totalOriginalAmount, totalRefundAmount]);

  // Handle amount change with validation against total only
  const handleAmountChange = useCallback((index: number, value: string) => {
    const newAmount = parseFloat(value) || 0;
    const method = refundMethods[index];
    
    // Calculate what the new total would be
    const currentTotal = totalRefundAmount;
    const currentMethodAmount = method.amount || 0;
    const potentialNewTotal = currentTotal - currentMethodAmount + newAmount;
    
    // Only validate against total original amount, not individual caps
    if (potentialNewTotal <= totalOriginalAmount) {
      onUpdateMethod(index, 'amount', newAmount);
    } else {
      // If it would exceed total, set to maximum possible
      const maxPossible = totalOriginalAmount - (currentTotal - currentMethodAmount);
      onUpdateMethod(index, 'amount', Math.max(0, maxPossible));
    }
  }, [refundMethods, totalRefundAmount, totalOriginalAmount, onUpdateMethod]);

  // Handle adding a new refund method
  const handleAddMethod = useCallback(() => {
    if (onAddMethod && remainingAmount > 0) {
      onAddMethod();
    }
  }, [onAddMethod, remainingAmount]);

  // Handle removing a refund method
  const handleRemoveMethod = useCallback((index: number) => {
    if (onRemoveMethod && refundMethods.length > 1) {
      onRemoveMethod(index);
    }
  }, [onRemoveMethod, refundMethods.length]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={cx('text-sm font-semibold', colors.text.primary)}>
          Refund Methods <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <Coins className={cx('w-4 h-4', colors.text.secondary)} />
          <span className={cx('text-xs', colors.text.secondary)}>
            Total cannot exceed original payment
          </span>
        </div>
      </div>
      
      {/* Summary of totals */}
      <div className={cx(
        'flex justify-between items-center mb-3 p-2 rounded-lg text-sm',
        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
      )}>
        <span className={cx('font-medium', colors.text.secondary)}>
          Total Refund: {totalRefundAmount.toLocaleString()}
        </span>
        <span className={cx('font-medium', colors.text.secondary)}>
          Original Total: {totalOriginalAmount.toLocaleString()}
        </span>
        <span className={cx(
          'font-medium',
          remainingAmount > 0 ? 'text-green-600' : colors.text.tertiary
        )}>
          Remaining: {remainingAmount.toLocaleString()}
        </span>
      </div>
      
      {/* Error message - only for total exceeded */}
      {totalExceeded && (
        <div className={cx(
          'flex items-center gap-2 mb-3 p-2 rounded-lg text-sm',
          isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Total refund amount ({totalRefundAmount.toLocaleString()}) exceeds 
            original payment total ({totalOriginalAmount.toLocaleString()})
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        {refundMethods.map((method, index) => {          
          return (
            <div key={index} className="flex gap-2 items-center">
              <select
                value={method.type}
                onChange={(e) => onUpdateMethod(index, 'type', e.target.value as RefundMethodType)}
                required
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-3 py-2 rounded-lg border text-sm cursor-pointer',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                )}
              >
                <option value="">Select method</option>
                {Object.entries(REFUND_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              
              <div className="w-32 relative">
                <input
                  type="number"
                  value={method.amount}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
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

              {/* Remove button - only show if more than one method */}
              {refundMethods.length > 1 && onRemoveMethod && (
                <button
                  type="button"
                  onClick={() => handleRemoveMethod(index)}
                  disabled={isProcessing}
                  className={cx(
                    'p-2 rounded-lg transition cursor-pointer',
                    isDark ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                  title="Remove refund method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add method button */}
      {onAddMethod && remainingAmount > 0 && (
        <button
          type="button"
          onClick={handleAddMethod}
          disabled={isProcessing || remainingAmount <= 0}
          className={cx(
            'mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition cursor-pointer',
            isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
            (isProcessing || remainingAmount <= 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Refund Method
        </button>
      )}

      {/* Helper text */}
      <div className={cx(
        'mt-2 text-xs space-y-1',
        colors.text.tertiary
      )}>
        <p>• You can use one or multiple refund methods</p>
        <p>• The total refund amount cannot exceed {totalOriginalAmount.toLocaleString()}</p>
        <p>• Individual method amounts are not capped - you can put the entire refund on one method</p>
      </div>
    </div>
  );
});

RefundMethodsDistributor.displayName = 'RefundMethodsDistributor';