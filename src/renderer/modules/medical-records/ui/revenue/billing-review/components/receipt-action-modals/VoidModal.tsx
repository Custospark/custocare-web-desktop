// VoidModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Ban, AlertTriangle } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import type { VoidReason } from '../../../../../api/refund/RefundTypes';
import { VOID_REASON_LABELS } from '../../../../../api/refund/RefundTypes';
import { useVoidTransaction } from '../../../../../api/refund/RefundQueries';
import { ActionModal, type ThemeColors } from './ModalPrimitives';
import { cx } from '../../utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { formatText } from '../../../stats/billing-revenue-stats-component/revenueDashboardUtils';

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    setReason('');
    setReasonNotes('');
    setRestoreInventory(true);
    setConfirmed(false);
    setValidationError(null);
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const billingCycleId = selectedTransaction?.billing_cycle_id || 0;

  const { mutate: voidTransaction, isPending: isProcessing } = useVoidTransaction(
    billingCycleId,
    {
      onSuccess: (response) => {
        if (response.success) {
          showToast('success', 'Transaction voided successfully.', 3000);
          onClose();
          onSuccess?.();
          return;
        }

        const errorMsg = response.message || 'Failed to void transaction.';
        setValidationError(errorMsg);
        showToast('error', errorMsg, 4500);
      },
      onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred while voiding the transaction.';
        setValidationError(errorMessage);
        showToast('error', errorMessage, 4500);
      },
    }
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!billingCycleId) {
      const msg = 'No transaction selected.';
      setValidationError(msg);
      showToast('error', msg, 2500);
      return;
    }

    if (!reason) {
      const msg = 'Please select a void reason.';
      setValidationError(msg);
      showToast('error', msg, 2500);
      return;
    }

    if (reason === 'other' && !reasonNotes.trim()) {
      const msg = 'Please provide notes for "Other" reason.';
      setValidationError(msg);
      showToast('error', msg, 2500);
      return;
    }

    if (!confirmed) {
      const msg = 'Please confirm that you understand this action is permanent.';
      setValidationError(msg);
      showToast('error', msg, 2500);
      return;
    }

    voidTransaction({
      reason: reason as VoidReason,
      reason_notes: reason === 'other' ? reasonNotes.trim() : undefined,
      restore_inventory: restoreInventory,
    });
  }, [billingCycleId, confirmed, reason, reasonNotes, restoreInventory, showToast, voidTransaction]);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    onClose();
  }, [isProcessing, onClose]);

  if (!selectedTransaction) return null;

  const requiresNotes = reason === 'other';

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      theme={theme}
      colors={colors}
      title="Void Transaction"
      subtitle="This permanently voids the billing transaction and updates operational records."
      icon={<Ban className={cx('h-5 w-5', isDark ? 'text-red-300' : 'text-red-600')} />}
      maxWidthClass="max-w-lg"
      isBusy={isProcessing}
      disableClose={isProcessing}
      busyTitle="Voiding transaction"
      busyDescription="We’re finalizing the void action and updating reporting and audit records."
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className={cx(
          'rounded-xl border p-4',
          isDark ? 'border-red-700 bg-red-900/10' : 'border-red-200 bg-red-50'
        )}>
          <div className="flex gap-3">
            <AlertTriangle className={cx('mt-0.5 h-5 w-5 flex-shrink-0', isDark ? 'text-red-300' : 'text-red-600')} />
            <div>
              <p className={cx('text-sm font-semibold', colors.text.primary)}>
                Permanent action
              </p>
              <p className={cx('mt-1 text-sm leading-relaxed', colors.text.secondary)}>
                Voiding is irreversible. The transaction will remain visible for audit history but marked as void across records and reports.
              </p>
            </div>
          </div>
        </div>

        <div className={cx('rounded-xl p-4 text-sm', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className={colors.text.secondary}>Receipt</p>
              <p className={cx('font-semibold', colors.text.primary)}>
                {selectedTransaction.receipt_number || 'Draft'}
              </p>
            </div>
            <div>
              <p className={colors.text.secondary}>Patient</p>
              <p className={cx('font-semibold', colors.text.primary)}>
                {selectedTransaction.patient_name}
              </p>
            </div>
            <div>
              <p className={colors.text.secondary}>Amount</p>
              <p className={cx('font-semibold', colors.text.primary)}>
                UGX {selectedTransaction.billing_data.grandTotal.toLocaleString()}
              </p>
            </div>
            <div>
              <p className={colors.text.secondary}>Status</p>
              <p className={cx('font-semibold capitalize', colors.text.primary)}>
                {formatText(String(selectedTransaction.billing_status || 'unknown'))}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className={cx('mb-2 block text-sm font-semibold', colors.text.primary)}>
            Void Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as VoidReason);
              setValidationError(null);
            }}
            disabled={isProcessing}
            className={cx(
              'w-full rounded-xl border px-4 py-3 text-sm',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
              colors.ring
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

        {requiresNotes && (
          <div>
            <label className={cx('mb-2 block text-sm font-semibold', colors.text.primary)}>
              Additional Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasonNotes}
              onChange={(e) => {
                setReasonNotes(e.target.value);
                setValidationError(null);
              }}
              rows={3}
              placeholder="Provide the reason details..."
              disabled={isProcessing}
              className={cx(
                'w-full rounded-xl border px-4 py-3 text-sm resize-none',
                colors.border.primary,
                isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                colors.ring
              )}
            />
          </div>
        )}

        <div className="space-y-3 rounded-xl border p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={restoreInventory}
              onChange={(e) => setRestoreInventory(e.target.checked)}
              disabled={isProcessing}
              className="mt-1 h-4 w-4 rounded"
            />
            <span className={cx('text-sm', colors.text.secondary)}>
              Restore inventory items associated with this transaction.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setValidationError(null);
              }}
              disabled={isProcessing}
              className="mt-1 h-4 w-4 rounded"
            />
            <span className={cx('text-sm', colors.text.secondary)}>
              I understand this action is permanent and I have authority to void this transaction.
            </span>
          </label>
        </div>

        {validationError && (
          <div className={cx(
            'rounded-xl p-3 text-sm',
            isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
          )}>
            {validationError}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className={cx(
              'rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
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
              'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Ban className="h-4 w-4" />
            {isProcessing ? 'Voiding...' : 'Void Transaction'}
          </button>
        </div>
      </form>
    </ActionModal>
  );
};
