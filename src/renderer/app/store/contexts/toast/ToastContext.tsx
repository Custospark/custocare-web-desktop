// src/renderer/app/store/contexts/toast/ToastContext.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ToastManager,
  type ToastPosition,
} from '../../../../shared/components/Feedback/Toast';
import { type ToastVariant, ToastContext } from './useToast';
import { imperativeToast } from './imperativeToast';

interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
  position: ToastPosition;
  elevated: boolean;
}

const DEFAULT_POSITION: ToastPosition = 'top-right';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      variant: ToastVariant,
      message: string,
      duration = 5000,
      position: ToastPosition = DEFAULT_POSITION,
      elevated = false,
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [
        ...prev,
        { id, variant, message, duration, position, elevated },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
      }
    },
    [],
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    imperativeToast.register(showToast);
    return () => imperativeToast.unregister();
  }, [showToast]);

  const positions = useMemo(() => {
    const unique = new Set(toasts.map((t) => t.position));
    return Array.from(unique);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {positions.map((position) => {
        const positionToasts = toasts.filter((t) => t.position === position);
        const elevated = positionToasts.some((t) => t.elevated);

        return (
          <ToastManager
            key={position}
            position={position}
            zIndex={elevated ? 10001 : 9999}
            toasts={positionToasts.map((t) => ({
              id: t.id,
              variant: t.variant,
              message: t.message,
              duration: t.duration,
              position: t.position,
            }))}
            onRemove={hideToast}
          />
        );
      })}
    </ToastContext.Provider>
  );
};
