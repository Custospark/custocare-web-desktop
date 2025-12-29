import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  message: string;
  duration?: number;
  onClose: () => void;
  className?: string;
}

/**
 * Toast Component
 * 
 * Temporary notification message that auto-dismisses
 * 
 * Usage:
 * <Toast 
 *   variant="success"
 *   message="Patient record saved successfully"
 *   duration={3000}
 *   onClose={() => setShowToast(false)}
 * />
 */
const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  duration = 5000,
  onClose,
  className = ''
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variantConfig = {
    success: {
      bg: 'bg-success',
      icon: FaCheckCircle,
    },
    error: {
      bg: 'bg-critical',
      icon: FaExclamationTriangle,
    },
    warning: {
      bg: 'bg-warning',
      icon: FaExclamationTriangle,
    },
    info: {
      bg: 'bg-primary',
      icon: FaInfoCircle,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div 
      className={`${config.bg} text-neutral-white px-24 py-16 rounded-lg shadow-modal flex items-center gap-12 min-w-300 max-w-500 animate-slide-in ${className}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-20 h-20 flex-shrink-0" />
      <p className="flex-1 text-body">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Close notification"
      >
        <FaTimes className="w-16 h-16" />
      </button>
    </div>
  );
};

export default Toast;

/**
 * ToastContainer Component
 * 
 * Container for managing multiple toast notifications
 * Position: top-right by default
 */
export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="fixed top-24 right-24 z-50 flex flex-col gap-12">
      {children}
    </div>
  );
};