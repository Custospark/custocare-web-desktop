import React, { forwardRef } from 'react';
import { FaPlus, FaMinus, FaExclamationCircle } from 'react-icons/fa';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  showControls?: boolean;
  step?: number;
  unit?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  label,
  error,
  helpText,
  fullWidth = true,
  showControls = true,
  step = 1,
  unit,
  className = '',
  disabled,
  required,
  value,
  onChange,
  min,
  max,
  ...props
}, ref) => {
  const inputId = props.id;
  const hasError = !!error;

  const handleIncrement = () => {
    if (disabled) return;
    const currentValue = Number(value) || 0;
    const newValue = currentValue + step;
    if (max === undefined || newValue <= Number(max)) {
      onChange?.({ target: { value: String(newValue) } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const currentValue = Number(value) || 0;
    const newValue = currentValue - step;
    if (min === undefined || newValue >= Number(min)) {
      onChange?.({ target: { value: String(newValue) } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const baseInputStyles = 'h-44 px-16 py-12 text-body text-green-600 placeholder:text-neutral-gray-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2';


  const stateStyles = hasError
    ? 'border-red-600 focus:border-red-600 focus:ring-red-600'
    : 'border-gray-400 focus:border-blue-600 focus:ring-blue-600';

  const disabledStyles = disabled
    ? 'bg-gray-200 cursor-not-allowed text-gray-600'
    : 'bg-white text-black';

  const widthStyle = fullWidth ? 'w-full' : '';
  const paddingStyle = showControls ? 'pr-80' : unit ? 'pr-48' : '';

  const controlButtonStyles =
    'w-28 h-28 flex items-center justify-center rounded border border-gray-400 bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-body font-medium text-black mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          type="number"
          id={inputId}
          className={`${baseInputStyles} ${stateStyles} ${disabledStyles} ${widthStyle} ${paddingStyle}`}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />

        {!showControls && unit && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-700 text-body pointer-events-none">
            {unit}
          </div>
        )}

        {showControls && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabled || (min !== undefined && Number(value) <= Number(min))}
              className={controlButtonStyles}
              aria-label="Decrease value"
            >
              <FaMinus className="w-12 h-12 text-black" />
            </button>

            {unit && (
              <div className="flex items-center px-4 text-body-sm text-gray-700">
                {unit}
              </div>
            )}

            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabled || (max !== undefined && Number(value) >= Number(max))}
              className={controlButtonStyles}
              aria-label="Increase value"
            >
              <FaPlus className="w-12 h-12 text-black" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div id={`${inputId}-error`} className="flex items-center gap-2 mt-2 text-sm text-red-600" role="alert">
          <FaExclamationCircle className="w-12 h-12 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {!error && helpText && (
        <p id={`${inputId}-help`} className="mt-2 text-sm text-gray-700">
          {helpText}
        </p>
      )}
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
export default NumberInput;
