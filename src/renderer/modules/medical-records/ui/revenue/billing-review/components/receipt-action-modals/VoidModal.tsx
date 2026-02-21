// VoidModal.tsx
import React, { useState } from 'react';
import { X, Ban, AlertTriangle } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { ModalBackdrop, ModalContainer, } from './ModalPrimitives';
import { cx } from '../../utils';

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
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean;
  selectedTransaction: BillingReviewItem | null;
  onSubmit: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSubmit,
  isProcessing = false,
}) => {
  const isDark = theme === 'dark';
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      onSubmit();
      setReason('');
      setConfirmed(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <>
      <ModalBackdrop open={open} onClick={handleClose} />
      <ModalContainer open={open}>
        <div
          className={cx(
            'rounded-xl shadow-2xl border',
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

            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Void Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this transaction is being voided..."
                rows={3}
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

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="void-confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
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
                disabled={!confirmed || isProcessing}
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
