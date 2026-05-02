// src/renderer/shared/components/ConfirmationDialog.tsx

import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
export type DialogType = 'info' | 'warning' | 'error' | 'success' | 'prompt';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showInput = false,
  inputLabel,
  inputPlaceholder = 'Enter reason...',
  inputValue: externalInputValue,
}) => {
  const [internalInputValue, setInternalInputValue] = React.useState('');

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(internalInputValue);
    } else {
      onConfirm();
    }
    setInternalInputValue('');
    onClose();
  };

  const handleCancel = () => {
    setInternalInputValue('');
    onClose();
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-100';
      case 'error':
        return 'bg-red-100';
      case 'success':
        return 'bg-green-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', getIconBg())}>
              {getIcon()}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>

          {/* Input field for prompt */}
          {showInput && (
            <div className="mt-4">
              {inputLabel && (
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {inputLabel}
                </label>
              )}
              <textarea
                value={externalInputValue !== undefined ? externalInputValue : internalInputValue}
                onChange={(e) => setInternalInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            onClick={handleCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
              type === 'error' && 'bg-red-600 hover:bg-red-700',
              type === 'warning' && 'bg-amber-600 hover:bg-amber-700',
              type === 'success' && 'bg-green-600 hover:bg-green-700',
              type !== 'error' && type !== 'warning' && type !== 'success' && 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;