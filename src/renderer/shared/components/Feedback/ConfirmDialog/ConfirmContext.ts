// shared/components/Feedback/ConfirmDialog/ConfirmContext.ts
import { createContext, useContext } from 'react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  theme?: string;
  /** Optional live countdown (seconds). The dialog re-renders to show remaining time. */
  countdownSec?: number;
  /** Optional third action button. When set, result may be 'extra' instead of boolean. */
  extraActionText?: string;
}

export interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean | 'extra'>;
}

export const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};
