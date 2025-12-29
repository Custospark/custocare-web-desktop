import React from 'react';
import type { IconType } from 'react-icons';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertCardProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: IconType;
  onClose?: () => void;
  className?: string;
}

/**
 * AlertCard Component
 * 
 * Vibrant, color-coded alerts for immediate visual recognition.
 * 
 * Usage:
 * <AlertCard variant="error" title="Critical Alert">
 *   Patient has severe penicillin allergy
 * </AlertCard>
 */
const AlertCard: React.FC<AlertCardProps> = ({
  variant,
  title,
  children,
  icon,
  onClose,
  className = ''
}) => {
  const variantConfig: Record<AlertVariant, { container: string; icon: string; IconComponent: IconType }> = {
    success: {
      container: 'bg-green-100 border-green-500 text-green-900',
      icon: 'text-green-600',
      IconComponent: FaCheckCircle
    },
    warning: {
      container: 'bg-yellow-100 border-yellow-500 text-yellow-900',
      icon: 'text-yellow-600',
      IconComponent: FaExclamationTriangle
    },
    error: {
      container: 'bg-red-100 border-red-600 text-red-900',
      icon: 'text-red-600',
      IconComponent: FaExclamationTriangle
    },
    info: {
      container: 'bg-blue-100 border-blue-500 text-blue-900',
      icon: 'text-blue-600',
      IconComponent: FaInfoCircle
    }
  };

  const config = variantConfig[variant];
  const IconComponent = icon || config.IconComponent;

  return (
    <div
      className={`${config.container} border-l-4 rounded-md p-4 flex items-start gap-3 shadow-md ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className={`${config.icon} flex-shrink-0 mt-1`}>
        <IconComponent className="w-6 h-6" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <p className="text-sm">{children}</p>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-500 hover:text-gray-800 transition-colors ml-2"
          aria-label="Dismiss alert"
        >
          <FaTimesCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default AlertCard;
