import { useCallback } from 'react';
import { useAppDispatch } from './useApp';
import {
  addNotification,
  removeNotification,
  type Notification,
} from '../slices/notificationSlice'

interface UseNotificationReturn {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  remove: (id: string) => void;
}

/**
 * Custom hook for managing notifications/toasts
 */
export const useNotification = (): UseNotificationReturn => {
  const dispatch = useAppDispatch();

  const show = useCallback(
    (message: string, type: Notification['type'], duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      dispatch(addNotification({ id, message, type, duration }));

      if (duration > 0) {
        setTimeout(() => {
          dispatch(removeNotification(id));
        }, duration);
      }
    },
    [dispatch]
  );

  return {
    success: (message, duration) => show(message, 'success', duration),
    error: (message, duration) => show(message, 'error', duration),
    info: (message, duration) => show(message, 'info', duration),
    warning: (message, duration) => show(message, 'warning', duration),
    remove: (id) => dispatch(removeNotification(id)),
  };
};