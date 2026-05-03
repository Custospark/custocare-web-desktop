import React from 'react';
import type { AllergiesThemeTokens } from './allergiesForm.types';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface AllergiesFieldProps {
  label: string;
  description?: string;
  placeholder?: string;
  value: string;
  type?: 'text' | 'textarea' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  icon: React.ReactNode;
  isDark: boolean;
  colors: AllergiesThemeTokens;
  autoFocus?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}

export const AllergiesField: React.FC<AllergiesFieldProps> = ({
  label,
  description,
  placeholder,
  value,
  type = 'text',
  options,
  required = false,
  error,
  icon,
//   isDark,
  colors,
  autoFocus = false,
  rows = 3,
  onChange,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const inputBaseClass = cn(
    'w-full rounded-lg border p-3 text-sm outline-none transition-all',
    colors.bg.input,
    colors.text.primary,
    colors.border.primary,
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    error && 'border-red-500 focus:ring-red-500'
  );

  return (
    <div className="space-y-1">
      <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
        {icon}
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>

      {description && (
        <p className={cn('mb-1 text-xs', colors.text.tertiary)}>{description}</p>
      )}

      {type === 'textarea' && (
        <textarea
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          autoFocus={autoFocus}
          className={cn(inputBaseClass, 'resize-y')}
        />
      )}

      {type === 'select' && options && (
        <select
          value={value}
          onChange={handleSelectChange}
          autoFocus={autoFocus}
          className={cn(inputBaseClass, 'cursor-pointer')}
        >
          <option value="">Select {label}...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {type === 'date' && (
        <input
          type="date"
          value={value}
          onChange={handleDateChange}
          autoFocus={autoFocus}
          className={cn(inputBaseClass, 'cursor-pointer')}
        />
      )}

      {type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={inputBaseClass}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default AllergiesField;