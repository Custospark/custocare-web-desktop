// EmailModal.tsx
import React, { useState } from 'react';
import { X, Mail, Send } from 'lucide-react';
import type { BillingReviewItem } from  '../../../../../api/billing-review/BillingReviewTypes';
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

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean;
  selectedTransaction: BillingReviewItem | null;
  onSubmit: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSubmit,
  isProcessing = false,
}) => {
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      onSubmit();
      setEmail('');
      setMessage('');
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
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-blue-900/30' : 'bg-blue-100')}>
                <Mail className={cx('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Email Receipt</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Send to patient or custom email
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
            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Recipient Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                required
                disabled={isProcessing}
                className={cx(
                  'w-full px-4 py-2.5 rounded-lg border text-sm cursor-text',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring,
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              />
            </div>

            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message..."
                rows={3}
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

            {selectedTransaction && (
              <div className={cx('p-3 rounded-lg text-xs', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                <p className={cx('font-semibold', colors.text.primary)}>
                  Receipt: {selectedTransaction.receipt_number || 'Draft'}
                </p>
                <p className={colors.text.secondary}>
                  Patient: {selectedTransaction.patient_name}
                </p>
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
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'flex items-center justify-center gap-2',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </>
  );
};
