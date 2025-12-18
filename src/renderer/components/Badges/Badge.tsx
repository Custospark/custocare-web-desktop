import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

type BadgeVariant = 'critical' | 'warning' | 'success' | 'gray' | 'info';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge Component
 * 
 * Vibrant status indicators with icons for quick recognition
 * 
 * Usage:
 * <Badge variant="critical">Urgent</Badge>
 * <Badge variant="success" size="large">Completed</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
  variant,
  size = 'medium',
  children,
  className = ''
}) => {
  const variantStyles: Record<BadgeVariant, { color: string; icon: React.ReactNode }> = {
    critical: { color: 'bg-red-600 text-white border-red-700', icon: <FaTimesCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" /> },
    warning: { color: 'bg-yellow-400 text-black border-yellow-500', icon: <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" /> },
    success: { color: 'bg-green-600 text-white border-green-700', icon: <FaCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" /> },
    gray: { color: 'bg-gray-300 text-gray-900 border-gray-400', icon: <FaExclamationCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" /> },
    info: { color: 'bg-blue-500 text-white border-blue-600', icon: <FaInfoCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1" /> },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base',
  };

  const { color, icon } = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border ${color} ${sizeStyles[size]} ${className} transition-all duration-200`}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
