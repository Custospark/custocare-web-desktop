// components/Modals.tsx
// Modal components with non-functional handlers

import React from 'react';
import { X } from 'lucide-react';

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

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  theme: 'light' | 'dark';
  colors: ThemeColors;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const Modal: React.FC<ModalProps> = ({ open, onClose, children, title, theme, colors }) => {
  const isDark = theme === 'dark';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={cx(
        'relative w-full max-w-md rounded-lg shadow-xl',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className={cx('flex items-center justify-between p-4 border-b', colors.border.primary)}>
          <h3 className={cx('text-lg font-extrabold', colors.text.primary)}>{title}</h3>
          <button
            onClick={onClose}
            className={cx('p-1 rounded-lg hover:bg-gray-100', isDark && 'hover:bg-gray-700')}
          >
            <X className={cx('w-5 h-5', colors.text.secondary)} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface RefundModalProps {
  open: boolean;
  selectedTransaction: any | null;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onSubmit: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal open={open} onClose={onClose} title="Process Refund" theme={theme} colors={colors}>
      <div className="space-y-4">
        <p className={cx('text-sm', colors.text.secondary)}>
          Refund for transaction: {selectedTransaction?.receipt_number || selectedTransaction?.visit_uuid}
        </p>
        <p className={cx('text-xs italic', colors.text.secondary)}>
          Refund functionality - backend integration pending
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cx(
              'px-4 py-2 text-sm font-extrabold rounded-lg border',
              colors.border.primary,
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            )}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-extrabold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
          >
            Process Refund
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface EmailModalProps {
  open: boolean;
  selectedTransaction: any | null;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onSubmit: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal open={open} onClose={onClose} title="Email Receipt" theme={theme} colors={colors}>
      <div className="space-y-4">
        <p className={cx('text-sm', colors.text.secondary)}>
          Send receipt for: {selectedTransaction?.receipt_number || selectedTransaction?.visit_uuid}
        </p>
        <input
          type="email"
          placeholder="Email address"
          className={cx(
            'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none',
            colors.border.primary,
            isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
            colors.ring
          )}
        />
        <p className={cx('text-xs italic', colors.text.secondary)}>
          Email functionality - backend integration pending
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cx(
              'px-4 py-2 text-sm font-extrabold rounded-lg border',
              colors.border.primary,
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            )}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-extrabold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Send Email
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface VoidModalProps {
  open: boolean;
  selectedTransaction: any | null;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onSubmit: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal open={open} onClose={onClose} title="Void Transaction" theme={theme} colors={colors}>
      <div className="space-y-4">
        <p className={cx('text-sm', colors.text.secondary)}>
          Void transaction: {selectedTransaction?.receipt_number || selectedTransaction?.visit_uuid}
        </p>
        <textarea
          placeholder="Reason for void"
          rows={3}
          className={cx(
            'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none',
            colors.border.primary,
            isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
            colors.ring
          )}
        />
        <p className={cx('text-xs italic', colors.text.secondary)}>
          Void functionality - backend integration pending
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={cx(
              'px-4 py-2 text-sm font-extrabold rounded-lg border',
              colors.border.primary,
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
            )}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm font-extrabold text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Void Transaction
          </button>
        </div>
      </div>
    </Modal>
  );
};