import React, { forwardRef, useState } from 'react';
import { FaChevronDown, FaExclamationCircle } from 'react-icons/fa';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

/**
 * Select Component
 * 
 * Dropdown select input with consistent styling
 * 
 * Usage:
 * <Select 
 *   label="Blood Type"
 *   options={[
 *     { value: 'A+', label: 'A Positive' },
 *     { value: 'B+', label: 'B Positive' },
 *   ]}
 *   placeholder="Select blood type"
 *   error={errors.bloodType}
 * />
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helpText,
  options,
  placeholder,
  fullWidth = true,
  className = '',
  disabled,
  required,
  ...props
}, ref) => {
  const [inputId] = useState(() => 
    props.id || `select-${Math.random().toString(36).substr(2, 9)}`
  );
  const hasError = !!error;

  const baseSelectStyles = 'h-44 px-16 py-12 text-body text-neutral-black rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 appearance-none cursor-pointer';
  
  const stateStyles = hasError
    ? 'border-critical focus:border-critical focus:ring-critical'
    : 'border-neutral-gray-light focus:border-primary focus:ring-primary';
  
  const disabledStyles = disabled ? 'bg-neutral-gray-bg cursor-not-allowed' : 'bg-neutral-white';
  
  const widthStyle = fullWidth ? 'w-full' : '';

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
        <select
          ref={ref}
          id={inputId}
          className={`${baseSelectStyles} ${stateStyles} ${disabledStyles} ${widthStyle} pr-40`}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
          <FaChevronDown className="w-16 h-16 text-neutral-gray-medium" />
        </div>
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

Select.displayName = 'Select';

export default Select;