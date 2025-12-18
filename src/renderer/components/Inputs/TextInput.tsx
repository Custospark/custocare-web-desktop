import React, { forwardRef, useState } from 'react';
import { IconType } from 'react-icons';
import { FaExclamationCircle } from 'react-icons/fa';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * TextInput Component
 * 
 * Standard text input with label, error states, and optional icons
 * 
 * Usage:
 * <TextInput 
 *   label="Patient Name" 
 *   placeholder="Enter full name"
 *   error={errors.name}
 *   required
 * />
 * 
 * <TextInput 
 *   label="Phone Number"
 *   icon={FaPhone}
 *   iconPosition="left"
 * />
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  label,
  error,
  helpText,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  disabled,
  required,
  ...props
}, ref) => {
  const [inputId] = useState(() => props.id || `input-${Math.random().toString(36).substr(2, 9)}`);
  const hasError = !!error;

  const baseInputStyles = 'h-44 px-16 py-12 text-body text-neutral-black placeholder:text-neutral-gray-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2';
  
  const stateStyles = hasError
    ? 'border-critical focus:border-critical focus:ring-critical'
    : 'border-neutral-gray-light focus:border-primary focus:ring-primary';
  
  const disabledStyles = disabled ? 'bg-neutral-gray-bg cursor-not-allowed' : 'bg-neutral-white';
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const iconPaddingStyles = Icon 
    ? iconPosition === 'left' ? 'pl-40' : 'pr-40'
    : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-body font-medium text-neutral-gray-dark mb-8"
        >
          {label}
          {required && <span className="text-critical ml-4">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className={`absolute top-1/2 -translate-y-1/2 ${iconPosition === 'left' ? 'left-12' : 'right-12'} pointer-events-none`}>
            <Icon className="w-20 h-20 text-neutral-gray-medium" />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${stateStyles} ${disabledStyles} ${widthStyle} ${iconPaddingStyles}`}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />
      </div>

      {error && (
        <div 
          id={`${inputId}-error`}
          className="flex items-center gap-4 mt-8 text-body-sm text-critical"
          role="alert"
        >
          <FaExclamationCircle className="w-12 h-12 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!error && helpText && (
        <p 
          id={`${inputId}-help`}
          className="mt-8 text-body-sm text-neutral-gray-medium"
        >
          {helpText}
        </p>
      )}
    </div>
  );
});

TextInput.displayName = 'TextInput';

export default TextInput