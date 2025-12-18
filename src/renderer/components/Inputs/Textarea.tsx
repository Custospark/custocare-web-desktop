import React, { forwardRef, useEffect, useRef } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

/**
 * Textarea Component
 * 
 * Multi-line text input with optional auto-resize
 * 
 * Usage:
 * <Textarea 
 *   label="Clinical Notes"
 *   placeholder="Enter detailed notes..."
 *   autoResize
 *   minRows={3}
 *   maxRows={10}
 * />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helpText,
  fullWidth = true,
  autoResize = false,
  minRows = 3,
  maxRows = 10,
  className = '',
  disabled,
  required,
  onChange,
  ...props
}, ref) => {
  const inputId = props.id;
  const hasError = !!error;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize logic
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      const minHeight = minRows * 20; // Approximate line height
      const maxHeight = maxRows * 20;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      if (scrollHeight < minHeight) {
        textarea.style.height = `${minHeight}px`;
      } else if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [props.value, autoResize, minRows, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e);
  };

  const baseTextareaStyles = 'px-16 py-12 text-body text-neutral-black placeholder:text-neutral-gray-medium rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 resize-none';
  
  const stateStyles = hasError
    ? 'border-critical focus:border-critical focus:ring-critical'
    : 'border-neutral-gray-light focus:border-primary focus:ring-primary';
  
  const disabledStyles = disabled ? 'bg-neutral-gray-bg cursor-not-allowed' : 'bg-neutral-white';
  
  const widthStyle = fullWidth ? 'w-full' : '';

  const heightStyle = autoResize ? '' : `min-h-[${minRows * 24}px] max-h-[${maxRows * 24}px]`;

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
      
      <textarea
        ref={(node) => {
          textareaRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        id={inputId}
        rows={minRows}
        className={`${baseTextareaStyles} ${stateStyles} ${disabledStyles} ${widthStyle} ${heightStyle}`}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        onChange={handleChange}
        {...props}
      />

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

Textarea.displayName = 'Textarea';

export default Textarea;