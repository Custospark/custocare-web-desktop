import React from 'react';

type SpinnerSize = 'small' | 'medium' | 'large';
type SpinnerVariant = 'primary' | 'white' | 'gray';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

/**
 * Spinner Component
 * 
 * Loading spinner indicator
 * 
 * Usage:
 * <Spinner size="medium" variant="primary" />
 * <Spinner size="large" variant="white" />
 */
const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium',
  variant = 'primary',
  className = ''
}) => {
  const sizeStyles = {
    small: 'w-16 h-16 border-2',
    medium: 'w-32 h-32 border-3',
    large: 'w-48 h-48 border-4',
  };

  const variantStyles = {
    primary: 'border-primary border-t-transparent',
    white: 'border-neutral-white border-t-transparent',
    gray: 'border-neutral-gray-medium border-t-transparent',
  };

  return (
    <div 
      className={`inline-block rounded-full animate-spin ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;

/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay with spinner
 */
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-white rounded-lg p-32 flex flex-col items-center gap-16">
        <Spinner size="large" variant="primary" />
        {message && <p className="text-body text-neutral-gray-dark">{message}</p>}
      </div>
    </div>
  );
};