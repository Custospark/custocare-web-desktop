import React, { forwardRef } from 'react';
import { FaCalendar, FaExclamationCircle } from 'react-icons/fa';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  type?: 'date' | 'time' | 'datetime-local';
}

/**
 * DateInput Component
 * 
 * Date, time, or datetime input with calendar icon
 * 
 * Usage:
 * <DateInput 
 *   label="Date of Birth"
 *   type="date"
 *   max={new Date().toISOString().split('T')[0]}
 * />
 * 
 * <DateInput 
 *   label="Appointment Time"
 *   type="datetime-local"
 * />
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({
  label,
  error,
  helpText,
  fullWidth = true,
  type = 'date',
  className = '',
  disabled,
  required,
  ...props
}, ref) => {
  const inputId = props.id;
  const hasError = !!error;

  const baseInputStyles = 'h-44 pl-40 pr-16 py-12 text-body text-neutral-black placeholder:text-neutral-gray-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2';
  
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
        <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none">
          <FaCalendar className="w-16 h-16 text-neutral-gray-medium" />
        </div>
        
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={`${baseInputStyles} ${stateStyles} ${disabledStyles} ${widthStyle}`}
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

DateInput.displayName = 'DateInput';

export default DateInput;
