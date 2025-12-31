import React, { useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  message: string;
  duration?: number;
  onClose: () => void;
  className?: string;
}

/**
 * Enhanced Toast Component
 * 
 * Temporary notification with theme-aware styling, smooth animations,
 * and accessibility features
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

  // Theme-aware configuration with proper contrast
  const variantConfig = {
    success: {
      icon: CheckCircle,
      iconClasses: 'text-emerald-600 dark:text-emerald-400',
      bgClasses: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
      textClasses: 'text-emerald-800 dark:text-emerald-200',
      progressClasses: 'bg-emerald-500 dark:bg-emerald-400',
      ringClasses: 'ring-emerald-500/20 dark:ring-emerald-400/20'
    },
    error: {
      icon: XCircle,
      iconClasses: 'text-red-600 dark:text-red-400',
      bgClasses: 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800',
      textClasses: 'text-red-800 dark:text-red-200',
      progressClasses: 'bg-red-500 dark:bg-red-400',
      ringClasses: 'ring-red-500/20 dark:ring-red-400/20'
    },
    warning: {
      icon: AlertTriangle,
      iconClasses: 'text-amber-600 dark:text-amber-400',
      bgClasses: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
      textClasses: 'text-amber-800 dark:text-amber-200',
      progressClasses: 'bg-amber-500 dark:bg-amber-400',
      ringClasses: 'ring-amber-500/20 dark:ring-amber-400/20'
    },
    info: {
      icon: Info,
      iconClasses: 'text-blue-600 dark:text-blue-400',
      bgClasses: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800',
      textClasses: 'text-blue-800 dark:text-blue-200',
      progressClasses: 'bg-blue-500 dark:bg-blue-400',
      ringClasses: 'ring-blue-500/20 dark:ring-blue-400/20'
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: { 
          type: "spring", 
          damping: 25, 
          stiffness: 300 
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 50, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden
        min-w-[300px] max-w-[500px]
        ${config.bgClasses}
        border
        rounded-xl
        shadow-lg
        ${config.ringClasses}
        ring-1
        backdrop-blur-sm
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`absolute top-0 left-0 h-1 ${config.progressClasses}`}
        aria-hidden="true"
      />
      
      {/* Toast content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            damping: 15, 
            stiffness: 200,
            delay: 0.1 
          }}
          className="flex-shrink-0"
        >
          <Icon className={`w-5 h-5 ${config.iconClasses}`} aria-hidden="true" />
        </motion.div>
        
        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`flex-1 text-sm font-medium leading-relaxed ${config.textClasses}`}
        >
          {message}
        </motion.p>
        
        {/* Close button */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className={`
            flex-shrink-0 
            p-1 
            rounded-lg 
            transition-colors 
            hover:bg-black/5 dark:hover:bg-white/10
            focus:outline-none focus:ring-2 focus:ring-current
            ${config.iconClasses}
          `}
          aria-label="Close notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * ToastContainer Component
 * 
 * Container for managing multiple toast notifications
 * Position: top-right corner with proper stacking and spacing
 */
interface ToastContainerProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div 
      className={`
        fixed 
        ${positionClasses[position]}
        z-[9999]
        flex 
        flex-col 
        gap-3
        pointer-events-none
      `}
    >
      {children}
    </div>
  );
};

/**
 * ToastManager Component (Optional)
 * 
 * For managing multiple toasts with AnimatePresence
 */
interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemove }) => {
  return (
    <ToastContainer position="top-right">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ 
              layout: { type: "spring", bounce: 0.4, duration: 0.8 },
              opacity: { duration: 0.2 }
            }}
            className="pointer-events-auto"
          >
            <Toast
              variant={toast.variant}
              message={toast.message}
              duration={toast.duration}
              onClose={() => onRemove(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </ToastContainer>
  );
};

export default Toast;