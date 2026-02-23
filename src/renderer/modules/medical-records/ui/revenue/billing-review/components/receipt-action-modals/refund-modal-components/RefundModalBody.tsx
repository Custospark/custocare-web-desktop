import React from 'react';
import { Undo2, AlertTriangle } from 'lucide-react';
import { BillingReviewItem } from '../../Modals';
import { RefundReason, RefundableLineItem } from '../../../../../../api/refund/RefundTypes';
import type { ThemeColors } from '../RefundModal';
import { cx } from '../../../utils';
// Import sub-components
import { TransactionSummaryCard } from './TransactionSummaryCard';
import { RefundTypeAndReasonSelector } from './RefundTypeAndReasonSelector';
import { PartialRefundItemsSelector } from './PartialRefundItemsSelector';
import { RefundMethodsDistributor, type RefundMethod }  from './RefundMethodsDistributor';

interface RefundModalBodyProps {
  selectedTransaction: BillingReviewItem | null;
  colors: ThemeColors;
  isDark: boolean;
  isProcessing: boolean;
  eligibilityWarning: string | null;
  refundType: 'full' | 'partial';
  reason: RefundReason | '';
  reasonNotes: string;
  totalRefund: number;
  refundMethods: RefundMethod[];
  lineItems: RefundableLineItem[];
  refundPercentage: number;
  selectedItemsCount: number;
  restoreInventory: boolean;
  validationError: string | null;
  onRefundTypeChange: (type: 'full' | 'partial') => void;
  onReasonChange: (reason: RefundReason | '') => void;
  onReasonNotesChange: (notes: string) => void;
  onPercentageChange: (percentage: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onToggleLineItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateRefundMethod: (index: number, field: 'type' | 'amount' | 'reference', value: string | number) => void;
  onRestoreInventoryChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const RefundModalBody: React.FC<RefundModalBodyProps> = ({
  selectedTransaction,
  colors,
  isDark,
  isProcessing,
  eligibilityWarning,
  refundType,
  reason,
  reasonNotes,
  totalRefund,
  refundMethods,
  lineItems,
  refundPercentage,
  selectedItemsCount,
  restoreInventory,
  validationError,
  onRefundTypeChange,
  onReasonChange,
  onReasonNotesChange,
  onPercentageChange,
  onSelectAll,
  onClearAll,
  onToggleLineItem,
  onUpdateQuantity,
  onUpdateRefundMethod,
  onRestoreInventoryChange,
  onSubmit,
  onClose,
}) => {
  if (!selectedTransaction) return null;

  const requiresNotes = reason === 'other';

  return (
    <form onSubmit={onSubmit} className="p-5 space-y-4">
      {/* Eligibility Warning */}
      {eligibilityWarning && (
        <div className={cx(
          'p-4 rounded-lg border',
          isDark ? 'bg-red-900/10 border-red-700' : 'bg-red-50 border-red-200'
        )}>
          <div className="flex gap-3">
            <AlertTriangle className={cx('w-5 h-5 shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
            <p className={cx('text-sm', colors.text.secondary)}>{eligibilityWarning}</p>
          </div>
        </div>
      )}

      {/* Transaction Summary Card */}
      <TransactionSummaryCard
        selectedTransaction={selectedTransaction}
        totalRefund={totalRefund}
        colors={colors}
        isDark={isDark}
      />

      {/* Refund Type & Reason Selector */}
      <RefundTypeAndReasonSelector
        refundType={refundType}
        reason={reason}
        reasonNotes={reasonNotes}
        isProcessing={isProcessing}
        colors={colors}
        isDark={isDark}
        onRefundTypeChange={onRefundTypeChange}
        onReasonChange={onReasonChange}
        onReasonNotesChange={onReasonNotesChange}
      />

      {/* Partial Refund Section */}
      {refundType === 'partial' && (
        <PartialRefundItemsSelector
          lineItems={lineItems}
          refundPercentage={refundPercentage}
          selectedItemsCount={selectedItemsCount}
          isProcessing={isProcessing}
          colors={colors}
          isDark={isDark}
          onPercentageChange={onPercentageChange}
          onSelectAll={onSelectAll}
          onClearAll={onClearAll}
          onToggleLineItem={onToggleLineItem}
          onUpdateQuantity={onUpdateQuantity}
        />
      )}

      {/* Refund Methods - Auto-populated */}
      <RefundMethodsDistributor
        refundMethods={refundMethods}
        refundType={refundType}
        isProcessing={isProcessing}
        colors={colors}
        isDark={isDark}
        totalRefund={totalRefund}
        onUpdateMethod={onUpdateRefundMethod}
        selectedTransaction={selectedTransaction}
      />

      {/* Restore Inventory Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={restoreInventory}
          onChange={(e) => onRestoreInventoryChange(e.target.checked)}
          disabled={isProcessing}
          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
        />
        <span className={cx('text-sm', colors.text.secondary)}>
          Restore inventory items
        </span>
      </label>

      {/* Validation Error */}
      {validationError && (
        <div className={cx(
          'p-3 rounded-lg text-sm',
          isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
        )}>
          {validationError}
        </div>
      )}

      {/* Actions */}
      <div className={cx(
        'flex gap-3 pt-4 sticky bottom-0 border-t',
        colors.border.primary,
        colors.bg.elevated
      )}>
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className={cx(
            'flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition cursor-pointer',
            colors.border.primary,
            isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50',
            isProcessing && 'cursor-not-allowed opacity-50'
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!reason || isProcessing || (requiresNotes && !reasonNotes.trim()) || totalRefund <= 0}
          className={cx(
            'flex-1 px-4 py-3 rounded-lg text-sm font-bold transition cursor-pointer',
            'bg-amber-600 hover:bg-amber-700 text-white',
            'flex items-center justify-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Undo2 className="w-4 h-4" />
          {isProcessing ? 'Processing...' : `Refund UGX ${totalRefund.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
};