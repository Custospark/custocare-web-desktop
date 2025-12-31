import React, { useState, useCallback } from 'react';
import Toast, { ToastContainer } from '../../../../shared/components/Feedback/Toast';
import { ToastVariant,ToastContext } from './useToast';

interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}




export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((variant: ToastVariant, message: string, duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, variant, message, duration }]);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            message={toast.message}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

