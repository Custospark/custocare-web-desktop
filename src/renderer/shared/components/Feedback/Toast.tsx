import React, { useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-center'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left';

interface ToastProps {
  variant: ToastVariant;
  message: string;
  duration?: number;
  onClose: () => void;
  className?: string;
  position?: ToastPosition;
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
 *   position="bottom-center"
 * />
 */
const Toast: React.FC<ToastProps> = ({
  variant,
  message,
  duration = 5000,
  onClose,
  className = '',
  position = 'bottom-center'
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Get animation based on position
  const getAnimationProps = () => {
    switch (position) {
      case 'top-center':
        return {
          initial: { opacity: 0, y: -50, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -50, scale: 0.95 }
        };
      case 'bottom-center':
        return {
          initial: { opacity: 0, y: 50, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 50, scale: 0.95 }
        };
      case 'top-right':
      case 'bottom-right':
        return {
          initial: { opacity: 0, x: 50, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: 50, scale: 0.95 }
        };
      case 'top-left':
      case 'bottom-left':
        return {
          initial: { opacity: 0, x: -50, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -50, scale: 0.95 }
        };
      default:
        return {
          initial: { opacity: 0, y: 50, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 50, scale: 0.95 }
        };
    }
  };

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
  const animationProps = getAnimationProps();

  return (
    <motion.div
      {...animationProps}
      transition={{ 
        type: "spring", 
        damping: 25, 
        stiffness: 300 
      }}
      whileHover={{ 
        y: position.includes('top') ? -2 : 2, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`
        relative overflow-hidden
        w-full
        sm:min-w-[320px] sm:max-w-[380px]
        md:min-w-[360px] md:max-w-[420px]
        lg:min-w-[400px] lg:max-w-[480px]
        ${config.bgClasses}
        border
        rounded-xl
        shadow-lg
        ${config.ringClasses}
        ring-1
        backdrop-blur-sm
        pointer-events-auto
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
      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
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
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.iconClasses}`} aria-hidden="true" />
        </motion.div>
        
        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`
            flex-1 
            text-xs sm:text-sm 
            font-medium leading-relaxed 
            break-words
            ${config.textClasses}
          `}
        >
          {message}
        </motion.p>
        
        {/* Close button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
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
            cursor-pointer
            self-start
          `}
          aria-label="Close notification"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * ToastContainer Component
 * 
 * Container for managing multiple toast notifications
 * Supports various positions with bottom-center as default
 */
interface ToastContainerProps {
  children: React.ReactNode;
  position?: ToastPosition;
  /** Above modals / offline overlay when needed (default 9999). */
  zIndex?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  children,
  position = 'top-right',
  zIndex = 9999,
}) => {
  const positionClasses = {
    'top-center': 'top-2 sm:top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-2 sm:top-4 right-2 sm:right-4',
    'top-left': 'top-2 sm:top-4 left-2 sm:left-4',
    'bottom-center': 'bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-2 sm:bottom-4 right-2 sm:right-4',
    'bottom-left': 'bottom-2 sm:bottom-4 left-2 sm:left-4',
  };

  // Responsive width classes based on position
  const getWidthClasses = () => {
    if (position.includes('center')) {
      return 'w-[calc(100%-2rem)] sm:w-auto sm:max-w-md';
    }
    return 'w-auto max-w-[90vw] sm:max-w-md';
  };

  return (
    <div
      className={`
        fixed
        ${positionClasses[position]}
        flex
        flex-col
        gap-2 sm:gap-3
        pointer-events-none
        ${getWidthClasses()}
      `}
      style={{ zIndex }}
    >
      {children}
    </div>
  );
};

/**
 * ToastManager Component
 * 
 * For managing multiple toasts with AnimatePresence
 */
interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
  position?: ToastPosition;
}

interface ToastManagerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  position?: ToastPosition;
  zIndex?: number;
}

export const ToastManager: React.FC<ToastManagerProps> = ({
  toasts,
  onRemove,
  position = 'top-right',
  zIndex,
}) => {
  return (
    <ToastContainer position={position} zIndex={zIndex}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              layout: { type: "spring", bounce: 0.3, duration: 0.6 },
              opacity: { duration: 0.2 }
            }}
            className="pointer-events-auto w-full"
          >
            <Toast
              variant={toast.variant}
              message={toast.message}
              duration={toast.duration}
              position={toast.position || position}
              onClose={() => onRemove(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </ToastContainer>
  );
};

export default Toast;