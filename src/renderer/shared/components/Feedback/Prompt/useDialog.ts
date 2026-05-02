// src/renderer/shared/hooks/useDialog.ts

import { useState, useCallback } from 'react';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
}

export const useDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const showDialog = useCallback((options: Omit<DialogState, 'isOpen'>) => {
    return new Promise<string | boolean | undefined>((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: (value?: string) => {
          resolve(value ?? true);
          setDialogState(null);
        },
        onCancel: () => {
          resolve(false);
          setDialogState(null);
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  return {
    dialogState,
    showDialog,
    closeDialog,
  };
};

export default useDialog;