import{ createContext, useContext} from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (variant: ToastVariant, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}
export const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};