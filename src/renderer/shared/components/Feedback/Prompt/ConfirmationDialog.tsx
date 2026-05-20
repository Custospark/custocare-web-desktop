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
  theme?: 'light' | 'dark';
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
  theme = 'light',
}) => {
  const [internalInputValue, setInternalInputValue] = React.useState('');
  const isDark = theme === 'dark';

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
        return isDark ? 'bg-amber-900/30' : 'bg-amber-100';
      case 'error':
        return isDark ? 'bg-red-900/30' : 'bg-red-100';
      case 'success':
        return isDark ? 'bg-green-900/30' : 'bg-green-100';
      default:
        return isDark ? 'bg-blue-900/30' : 'bg-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className={cn(
        'mx-4 w-full max-w-md rounded-2xl shadow-xl',
        isDark ? 'bg-slate-900' : 'bg-white'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between border-b p-4',
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-2', getIconBg())}>
              {getIcon()}
            </div>
            <h2 className={cn('text-lg font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
              {title}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className={cn(
              'rounded-lg p-1',
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>{message}</p>

          {showInput && (
            <div className="mt-4">
              {inputLabel && (
                <label className={cn('mb-1 block text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-700')}>
                  {inputLabel}
                </label>
              )}
              <textarea
                value={externalInputValue !== undefined ? externalInputValue : internalInputValue}
                onChange={(e) => setInternalInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                rows={3}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  isDark ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300'
                )}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          'flex justify-end gap-3 border-t p-4',
          isDark ? 'border-slate-700' : 'border-slate-200'
        )}>
          <button
            onClick={handleCancel}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            )}
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
