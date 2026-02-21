// RefundModal.tsx
import React, { useState } from 'react';
import { X, Undo2, AlertTriangle } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { ModalBackdrop, ModalContainer } from './ModalPrimitives';
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

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean;
  selectedTransaction: BillingReviewItem | null;
  onSubmit: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      onSubmit();
      setReason('');
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
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
                <Undo2 className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Refund Transaction</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Item-based and quantity-based refunds
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
            <div className={cx('p-4 rounded-lg border', isDark ? 'bg-amber-900/10 border-amber-700' : 'bg-amber-50 border-amber-200')}>
              <div className="flex gap-3">
                <AlertTriangle className={cx('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
                <div>
                  <p className={cx('text-sm font-semibold', colors.text.primary)}>
                    Refund Policy
                  </p>
                  <p className={cx('text-xs mt-1 leading-relaxed', colors.text.secondary)}>
                    Refunds are processed item-by-item. You can refund full or partial quantities.
                    All refunds require approval and documentation.
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
                  <span className={colors.text.secondary}>Total Paid:</span>
                  <span className={cx('font-semibold', colors.text.primary)}>
                    UGX {selectedTransaction.billing_data.totalPaid.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Refund Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this refund is being issued..."
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
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer',
                  'bg-amber-600 hover:bg-amber-700 text-white',
                  'flex items-center justify-center gap-2',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                <Undo2 className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </>
  );
};
