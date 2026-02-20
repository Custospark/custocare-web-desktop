// components/billing-review/components/Modals.tsx
import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  AlertTriangle,
  Undo2,
  Ban,
  CheckCircle,
  Info,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import type { BillingReviewItem } from '../../../../api/billing-review/BillingReviewTypes';

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

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean; // Added for processing state
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Modal Backdrop Component
const ModalBackdrop: React.FC<{ open: boolean; onClick: () => void }> = ({ open, onClick }) => {
  if (!open) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black/25 z-40 animate-fadeIn cursor-pointer"
      onClick={onClick}
      aria-hidden="true"
    />
  );
};

// Modal Container Component
const ModalContainer: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg animate-slideUp">
        {children}
      </div>
    </div>
  );
};

// Email Modal
interface EmailModalProps extends BaseModalProps {
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

// Refund Modal
interface RefundModalProps extends BaseModalProps {
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

// Void Modal
interface VoidModalProps extends BaseModalProps {
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

// Toast Component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-900 dark:text-green-100',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-100',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-900 dark:text-amber-100',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div
        className={cx(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
          bgColor,
          borderColor
        )}
      >
        <Icon className={cx('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
        <p className={cx('text-sm font-medium flex-1', textColor)}>{message}</p>
        <button
          onClick={onClose}
          className={cx('flex-shrink-0 p-1 rounded transition cursor-pointer', iconColor, 'hover:opacity-70')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};