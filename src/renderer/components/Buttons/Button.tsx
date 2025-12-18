import React from 'react';
import { IconType } from 'react-icons';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  focusRing?:boolean,
}

/**
 * Button Component
 * 
 * Primary UI button with multiple variants and states
 * 
 * Usage:
 * <Button variant="primary" onClick={handleSave}>Save Patient</Button>
 * <Button variant="danger" icon={FaTrash} loading={isDeleting}>Delete</Button>
 * <Button variant="secondary" size="small" fullWidth>Cancel</Button>
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-neutral-white hover:bg-primary-hover active:scale-95 focus:ring-primary shadow-sm',
    secondary: 'bg-neutral-white text-primary border-2 border-primary hover:bg-primary-light active:scale-95 focus:ring-primary',
    danger: 'bg-critical text-neutral-white hover:bg-critical-dark active:scale-95 focus:ring-critical shadow-sm',
    success: 'bg-success text-neutral-white hover:bg-green-600 active:scale-95 focus:ring-success shadow-sm',
    warning: 'bg-warning text-neutral-white hover:bg-yellow-600 active:scale-95 focus:ring-warning shadow-sm',
    ghost: 'bg-transparent text-neutral-gray-dark hover:bg-neutral-gray-bg active:scale-95',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    small: 'px-12 py-8 text-body-sm gap-4',
    medium: 'px-24 py-12 text-body gap-8',
    large: 'px-32 py-16 text-body-lg gap-8',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-16 w-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-16 h-16" />}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-16 h-16" />}
    </button>
  );
};

export default Button;