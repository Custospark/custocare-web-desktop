// EmailModal.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Mail, Send, ReceiptText } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { ActionModal, type ThemeColors } from './ModalPrimitives';
import { cx } from '../../utils';

interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean;
  selectedTransaction: BillingReviewItem | null;
  onSubmit: (payload: { email: string; message: string }) => void | Promise<void>;
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

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setMessage('');
  }, [open]);

  const defaultMessage = useMemo(() => {
    if (!selectedTransaction) return '';
    return `Hello,

Please find your receipt attached for visit ${selectedTransaction.receipt_number || 'Draft'}.

Thank you.`;
  }, [selectedTransaction]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isProcessing) return;

      await onSubmit({
        email: email.trim(),
        message: message.trim(),
      });

      setEmail('');
      setMessage('');
    },
    [email, message, isProcessing, onSubmit]
  );

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    onClose();
  }, [isProcessing, onClose]);

  if (!selectedTransaction) return null;

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      theme={theme}
      colors={colors}
      title="Email Receipt"
      subtitle="Send a copy of the receipt to the patient or a custom recipient."
      icon={<Mail className={cx('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />}
      maxWidthClass="max-w-lg"
      isBusy={isProcessing}
      disableClose={isProcessing}
      busyTitle="Sending receipt"
      busyDescription="We’re preparing the receipt and delivering it to the selected email address."
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className={cx('rounded-xl p-4', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
          <div className="flex items-start gap-3">
            <div className={cx('rounded-xl p-2', isDark ? 'bg-blue-900/20' : 'bg-blue-100')}>
              <ReceiptText className={cx('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
            </div>

            <div className="min-w-0 flex-1">
              <p className={cx('text-sm font-semibold', colors.text.primary)}>
                {selectedTransaction.receipt_number || 'Draft Receipt'}
              </p>
              <p className={cx('mt-1 text-sm', colors.text.secondary)}>
                Patient: {selectedTransaction.patient_name}
              </p>
              <p className={cx('mt-1 text-sm', colors.text.secondary)}>
                Amount: UGX {selectedTransaction.billing_data.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className={cx('mb-2 block text-sm font-semibold', colors.text.primary)}>
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
              'w-full rounded-xl border px-4 py-3 text-sm',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100 placeholder:text-gray-500' : 'bg-white text-gray-900 placeholder:text-gray-400',
              colors.ring,
              isProcessing && 'cursor-not-allowed opacity-60'
            )}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={cx('block text-sm font-semibold', colors.text.primary)}>
              Message
            </label>

            {!message && (
              <button
                type="button"
                onClick={() => setMessage(defaultMessage)}
                disabled={isProcessing}
                className={cx(
                  'text-xs font-medium transition-colors',
                  isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'
                )}
              >
                Use suggested message
              </button>
            )}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a short message for the recipient..."
            rows={4}
            disabled={isProcessing}
            className={cx(
              'w-full resize-none rounded-xl border px-4 py-3 text-sm',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100 placeholder:text-gray-500' : 'bg-white text-gray-900 placeholder:text-gray-400',
              colors.ring,
              isProcessing && 'cursor-not-allowed opacity-60'
            )}
          />
        </div>

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
            disabled={isProcessing || !email.trim()}
            className={cx(
              'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <Send className="h-4 w-4" />
            {isProcessing ? 'Sending...' : 'Send Receipt'}
          </button>
        </div>
      </form>
    </ActionModal>
  );
};
