import React, { useMemo, useCallback } from 'react';
import { Coins, AlertCircle, Plus, Trash2, CheckCircle, Percent } from 'lucide-react';
import { cx } from '../../../utils';
import { formatCurrency } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';
import { REFUND_METHOD_LABELS, RefundMethodType } from '../../../../../../api/refund/RefundTypes';
import { type BillingReviewItem, type ThemeColors } from '../../Modals';
import type { RefundableLineItem } from '../../../../../../api/refund/RefundTypes';

export interface RefundMethod {
  type: RefundMethodType | '';
  amount: number;
  reference: string;
  originalAmount?: number;
}

interface RefundMethodsDistributorProps {
  selectedTransaction: BillingReviewItem;
  refundMethods: RefundMethod[];
  isProcessing: boolean;
  totalRefund: number;
  colors: ThemeColors;
  isDark: boolean;
  refundType: 'full' | 'partial';
  selectedLineItems?: RefundableLineItem[]; // For partial refund breakdown display
  onUpdateMethod: (index: number, field: 'type' | 'amount' | 'reference', value: string | number) => void;
  onAddMethod?: () => void;
  onRemoveMethod?: (index: number) => void;
}

export const RefundMethodsDistributor = React.memo<RefundMethodsDistributorProps>(({
  refundMethods,
  isProcessing,
  totalRefund,
  colors,
  isDark,
  selectedTransaction,
  refundType,
  selectedLineItems = [],
  onUpdateMethod,
  onAddMethod,
  onRemoveMethod,
}) => {
  // Calculate total of all refund method amounts
  const totalAllocatedAmount = useMemo(() => {
    return refundMethods.reduce((sum, method) => sum + (method.amount || 0), 0);
  }, [refundMethods]);

  // Get original financial data from transaction
  const originalData = useMemo(() => {
    const billingData = selectedTransaction.billing_data;
    return {
      subtotal: billingData?.subtotal || 0,
      discountAmount: billingData?.discountAmount || 0,
      taxes: billingData?.taxes || [],
      grandTotal: billingData?.grandTotal || 0,
      totalPaid: billingData?.totalPaid || 0
    };
  }, [selectedTransaction]);

  // Calculate tax breakdown for the refund amount
  const taxBreakdown = useMemo(() => {
    if (refundType === 'full') {
      // For full refund, use original tax amounts
      return {
        itemsSubtotal: originalData.subtotal,
        taxableAmount: originalData.subtotal - originalData.discountAmount,
        discountAmount: originalData.discountAmount,
        taxes: originalData.taxes,
        totalTax: originalData.taxes.reduce((sum, tax) => sum + tax.amount, 0)
      };
    } else {
      // For partial refund, calculate based on selected items
      const selectedItems = selectedLineItems.filter(item => item.is_selected);
      if (selectedItems.length === 0) return null;
      
      // Calculate items subtotal
      const itemsSubtotal = selectedItems.reduce((sum, item) => 
        sum + (item.refund_amount || 0), 0
      );
      
      
      // Calculate refund ratio based on subtotal (not taxable amount)
      const refundRatio = originalData.subtotal > 0 
        ? itemsSubtotal / originalData.subtotal 
        : 0;
      
      // Calculate proportional discount
      const proportionalDiscount = originalData.discountAmount * refundRatio;
      
      // Calculate taxable amount after discount
      const taxableAmount = itemsSubtotal - proportionalDiscount;
      
      // Calculate proportional taxes based on original tax rates applied to taxable amount
      const proportionalTaxes = originalData.taxes.map(tax => ({
        ...tax,
        amount: (taxableAmount * tax.rate) / 100
      }));
      
      const totalTax = proportionalTaxes.reduce((sum, tax) => sum + tax.amount, 0);
      
      return {
        itemsSubtotal,
        taxableAmount,
        discountAmount: proportionalDiscount,
        taxes: proportionalTaxes,
        totalTax
      };
    }
  }, [refundType, originalData, selectedLineItems]);

  // Check if total allocated exceeds original grand total
  const totalExceeded = totalAllocatedAmount > originalData.grandTotal;

  // Check if allocated matches totalRefund (with small tolerance for floating point)
  const totalsMatch = Math.abs(totalAllocatedAmount - totalRefund) < 0.01;

  // Calculate remaining amount needed to match totalRefund
  const remainingToMatch = useMemo(() => {
    return Math.max(0, totalRefund - totalAllocatedAmount);
  }, [totalRefund, totalAllocatedAmount]);

  // Calculate excess amount if allocated > totalRefund
  const excessAmount = useMemo(() => {
    return Math.max(0, totalAllocatedAmount - totalRefund);
  }, [totalRefund, totalAllocatedAmount]);

  // Handle adding a new refund method
  const handleAddMethod = useCallback(() => {
    if (onAddMethod && remainingToMatch > 0) {
      onAddMethod();
    }
  }, [onAddMethod, remainingToMatch]);

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
      
      {/* Original Transaction Summary */}
      <div className={cx(
        'mb-3 p-3 rounded-lg text-sm space-y-2',
        isDark ? 'bg-gray-700/50' : 'bg-gray-100'
      )}>
        <div className="flex justify-between items-center font-semibold">
          <span className={colors.text.primary}>Original Transaction</span>
          <span className="text-blue-600 dark:text-blue-400">{formatCurrency(originalData.grandTotal)}</span>
        </div>
        
        <div className={cx('text-xs space-y-1', colors.text.secondary)}>
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(originalData.subtotal)}</span>
          </div>
          
          {originalData.discountAmount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Discount:</span>
              <span>-{formatCurrency(originalData.discountAmount)}</span>
            </div>
          )}
          
          {/* Tax Breakdown */}
          {originalData.taxes.map((tax, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3" />
                {tax.name} ({tax.rate}%):
              </span>
              <span>{formatCurrency(tax.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refund Tax Calculation - Now visible for both full and partial refunds */}
      {taxBreakdown && totalRefund > 0 && (
        <div className={cx(
          'mb-3 p-3 rounded-lg text-sm',
          isDark ? 'bg-blue-900/20' : 'bg-blue-50'
        )}>
          <div className="flex justify-between items-center mb-2">
            <span className={cx('font-semibold', colors.text.primary)}>
              {refundType === 'full' ? 'Full Refund' : 'Partial Refund'} Breakdown
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {formatCurrency(totalRefund)}
            </span>
          </div>
          
          <div className={cx('text-xs space-y-1', colors.text.secondary)}>
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span>{formatCurrency(taxBreakdown.itemsSubtotal)}</span>
            </div>
            
            {taxBreakdown.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({((taxBreakdown.discountAmount / taxBreakdown.itemsSubtotal) * 100).toFixed(1)}%):</span>
                <span>-{formatCurrency(taxBreakdown.discountAmount)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-medium pt-1">
              <span>Taxable Amount:</span>
              <span>{formatCurrency(taxBreakdown.taxableAmount)}</span>
            </div>
            
            {taxBreakdown.taxes.map((tax, idx) => (
              <div key={idx} className="flex justify-between pl-2">
                <span>↳ {tax.name} ({tax.rate}%):</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}
            
            <div className="flex justify-between font-semibold pt-1 border-t border-dashed mt-1">
              <span>Total Tax:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCurrency(taxBreakdown.totalTax)}</span>
            </div>
            
            <div className="flex justify-between font-bold pt-1 mt-1 text-blue-600 dark:text-blue-400">
              <span>Total Refund Amount:</span>
              <span>{formatCurrency(taxBreakdown.itemsSubtotal - taxBreakdown.discountAmount + taxBreakdown.totalTax)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary of totals */}
      <div className={cx(
        'grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg text-sm',
        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
      )}>
        <div>
          <span className={cx('text-xs block', colors.text.tertiary)}>
            {refundType === 'full' ? 'Full Refund' : 'To Refund'}
          </span>
          <span className={cx('font-bold', colors.text.primary)}>
            {formatCurrency(totalRefund)}
          </span>
        </div>
        <div>
          <span className={cx('text-xs block', colors.text.tertiary)}>Allocated</span>
          <span className={cx('font-bold', 
            totalsMatch ? 'text-green-600' : 'text-amber-600'
          )}>
            {formatCurrency(totalAllocatedAmount)}
          </span>
        </div>
        <div>
          <span className={cx('text-xs block', colors.text.tertiary)}>Original Total</span>
          <span className={cx('font-bold', colors.text.primary)}>
            {formatCurrency(originalData.grandTotal)}
          </span>
        </div>
      </div>
      
      {/* Success message when totals match */}
      {totalsMatch && totalRefund > 0 && (
        <div className={cx(
          'flex items-center gap-2 mb-3 p-2 rounded-lg text-sm cursor-default',
          isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
        )}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Allocation matches refund amount ({formatCurrency(totalRefund)})
          </span>
        </div>
      )}
      
      {/* Error message - total exceeded original */}
      {totalExceeded && (
        <div className={cx(
          'flex items-center gap-2 mb-3 p-2 rounded-lg text-sm cursor-default',
          isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
        )}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Total allocated ({formatCurrency(totalAllocatedAmount)}) exceeds 
            original payment total ({formatCurrency(originalData.grandTotal)})
          </span>
        </div>
      )}
      
      {/* Warning - allocation doesn't match refund amount */}
      {!totalsMatch && !totalExceeded && totalRefund > 0 && (
        <div className={cx(
          'flex items-center gap-2 mb-3 p-2 rounded-lg text-sm cursor-default',
          isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
        )}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {remainingToMatch > 0 
              ? `Need to allocate ${formatCurrency(remainingToMatch)} more to match refund amount`
              : `Exceeds refund amount by ${formatCurrency(excessAmount)}`
            }
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
                  colors.text.primary,
                  isProcessing && 'opacity-50 cursor-not-allowed'
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
                <div className={cx(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  colors.border.primary,
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600',
                  'cursor-not-allowed'
                )}>
                  {formatCurrency(method.amount)}
                </div>
              </div>
              
              <input
                type="text"
                value={method.reference}
                onChange={(e) => onUpdateMethod(index, 'reference', e.target.value)}
                placeholder="Refund notes (optional)"
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-3 py-2 rounded-lg border text-sm cursor-pointer',
                  colors.border.primary,
                  colors.text.primary,
                  isProcessing && 'opacity-50 cursor-not-allowed'
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

      {/* Add method button - only when there's remaining amount to match */}
      {onAddMethod && remainingToMatch > 0 && !totalExceeded && (
        <button
          type="button"
          onClick={handleAddMethod}
          disabled={isProcessing || remainingToMatch <= 0}
          className={cx(
            'mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition cursor-pointer',
            colors.text.primary,
            (isProcessing || remainingToMatch <= 0) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Refund Method ({formatCurrency(remainingToMatch)} remaining)
        </button>
      )}

      {/* Auto-distribute button when totals don't match */}
      {!totalsMatch && !totalExceeded && totalRefund > 0 && (
        <button
          type="button"
          onClick={() => {
            // Auto-distribute the remaining amount to the first method
            if (refundMethods.length > 0) {
              const newAmount = refundMethods[0].amount + remainingToMatch;
              onUpdateMethod(0, 'amount', newAmount);
            }
          }}
          disabled={isProcessing}
          className={cx(
            'mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition cursor-pointer',
            isDark ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Coins className="w-4 h-4" />
          Auto-match refund amount
        </button>
      )}
    </div>
  );
});

RefundMethodsDistributor.displayName = 'RefundMethodsDistributor';