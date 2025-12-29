import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'critical';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * ProgressBar Component
 * 
 * Visual indicator of progress or completion
 * 
 * Usage:
 * <ProgressBar value={75} showLabel />
 * <ProgressBar value={30} variant="warning" size="large" />
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  variant = 'primary',
  size = 'medium',
  className = ''
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const variantStyles = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-critical',
  };

  const sizeStyles = {
    small: 'h-4',
    medium: 'h-8',
    large: 'h-12',
  };

  return (
    <div className={className}>
      <div className={`w-full bg-neutral-gray-light rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`h-full ${variantStyles[variant]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="text-body-sm text-neutral-gray-dark mt-4 text-right">
          {clampedValue}%
        </p>
      )}
    </div>
  );
};

export default ProgressBar;