// VoidModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Ban, AlertTriangle } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import type { VoidReason } from '../../../../../api/refund/RefundTypes';
import { VOID_REASON_LABELS } from '../../../../../api/refund/RefundTypes';
import { useVoidTransaction } from '../../../../../api/refund/RefundQueries';
import { ModalBackdrop, ModalContainer } from './ModalPrimitives';
import { cx } from '../../utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
  };
  ring: string;
}

interface VoidModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  selectedTransaction: BillingReviewItem | null;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSuccess,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [reason, setReason] = useState<VoidReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setReason('');
      setReasonNotes('');
      setRestoreInventory(true);
      setConfirmed(false);
      setValidationError(null);
    }
  }, [open]);

  const billingCycleId = selectedTransaction?.billing_cycle_id;

  const { mutate: voidTransaction, isPending: isProcessing } = useVoidTransaction(
    billingCycleId || 0,
    {
      onSuccess: (response) => {
        if (response.success) {
          showToast('success', 'Transaction voided successfully', 3000);
          onClose();
          onSuccess?.(); // This will trigger refresh in parent
        } else {
          const errorMsg = response.message || 'Failed to void transaction';
          setValidationError(errorMsg);
          showToast('error', errorMsg, 5000);
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while voiding';
        setValidationError(errorMessage);
        showToast('error', errorMessage, 5000);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!billingCycleId) {
      const errorMsg = 'No transaction selected';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    if (!reason) {
      const errorMsg = 'Please select a void reason';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    if (reason === 'other' && !reasonNotes.trim()) {
      const errorMsg = 'Please provide notes for "Other" reason';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    voidTransaction({
      reason: reason as VoidReason,
      reason_notes: reason === 'other' ? reasonNotes : undefined,
      restore_inventory: restoreInventory,
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (!selectedTransaction) return null;

  const requiresNotes = reason === 'other';

  return (
    <>
      <ModalBackdrop open={open} onClick={handleClose} />
      <ModalContainer open={open}>
        <div
          className={cx(
            'rounded-xl shadow-2xl border w-full max-w-md',
            colors.border.primary,
            colors.bg.elevated,
            isProcessing && 'pointer-events-none opacity-75'
          )}
        >
          {/* Header */}
          <div className={cx('flex items-center justify-between p-5 border-b', colors.border.primary)}>
            <div className="flex items-center gap-3">
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                <Ban className={cx('w-5 h-5', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Void Transaction</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Permanently void this transaction
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
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

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Warning Banner */}
            <div className={cx('p-4 rounded-lg border', isDark ? 'bg-red-900/10 border-red-700' : 'bg-red-50 border-red-200')}>
              <div className="flex gap-3">
                <AlertTriangle className={cx('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
                <div>
                  <p className={cx('text-sm font-semibold', colors.text.primary)}>
                    Warning: Irreversible Action
                  </p>
                  <p className={cx('text-xs mt-1 leading-relaxed', colors.text.secondary)}>
                    Voiding a transaction is permanent and cannot be undone. This will mark the
                    transaction as void in all records and reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
            {selectedTransaction && (
              <div className={cx('p-3 rounded-lg text-xs space-y-2', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                <div className="flex justify-between">
                  <span className={colors.text.secondary}>Receipt:</span>
                  <span className={cx('font-semibold', colors.text.primary)}>
                    {selectedTransaction.receipt_number || 'Draft'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.secondary}>Patient:</span>
                  <span className={colors.text.primary}>{selectedTransaction.patient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.secondary}>Amount:</span>
                  <span className={cx('font-semibold', colors.text.primary)}>
                    UGX {selectedTransaction.billing_data.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Void Reason Dropdown */}
            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Void Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value as VoidReason);
                  setValidationError(null);
                }}
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
                {Object.entries(VOID_REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Notes (only for "other") */}
            {requiresNotes && (
              <div>
                <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                  Additional Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => {
                    setReasonNotes(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Please provide details..."
                  rows={2}
                  required
                  disabled={isProcessing}
                  className={cx(
                    'w-full px-4 py-2.5 rounded-lg border text-sm resize-none cursor-text',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring,
                    isProcessing && 'cursor-not-allowed opacity-50'
                  )}
                />
              </div>
            )}

            {/* Restore Inventory Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="restore-inventory"
                checked={restoreInventory}
                onChange={(e) => setRestoreInventory(e.target.checked)}
                disabled={isProcessing}
                className={cx(
                  'w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              />
              <label 
                htmlFor="restore-inventory" 
                className={cx(
                  'text-sm cursor-pointer',
                  colors.text.secondary,
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                Restore inventory items
              </label>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="void-confirm"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setValidationError(null);
                }}
                disabled={isProcessing}
                className={cx(
                  'mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              />
              <label 
                htmlFor="void-confirm" 
                className={cx(
                  'text-sm cursor-pointer',
                  colors.text.secondary,
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                I understand this action is permanent and cannot be undone. I have the authority
                to void this transaction.
              </label>
            </div>

            {/* Validation Error - Only show if not already shown in toast */}
            {validationError && (
              <div className={cx(
                'p-3 rounded-lg text-sm',
                isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
              )}>
                {validationError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition cursor-pointer',
                  colors.border.primary,
                  isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!confirmed || !reason || isProcessing || (requiresNotes && !reasonNotes.trim())}
                className={cx(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer',
                  'bg-red-600 hover:bg-red-700 text-white',
                  'flex items-center justify-center gap-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Ban className="w-4 h-4" />
                {isProcessing ? 'Voiding...' : 'Void Transaction'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </>
  );
};