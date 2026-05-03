import React from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ConsultationsThemeTokens, ConsultationsFieldDefinition, ConsultationsFormValues } from './consultationsForm.types';

interface ConsultationsFieldProps {
  field: ConsultationsFieldDefinition;
  value: string | number | boolean | string[] | null;
  error?: string;
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof ConsultationsFormValues, value: string | number | boolean | string[] | null) => void;
}

export const ConsultationsField: React.FC<ConsultationsFieldProps> = ({
  field,
  value,
  error,
//   isDark,
  colors,
  autoFocus = false,
  onChange,
}) => {
  // Skip rendering for 'combobox' type - handled directly in Editor if needed
  if (field.type === 'combobox') {
    return null;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(field.key, null);
    } else {
      const num = parseFloat(val);
      onChange(field.key, isNaN(num) ? null : num);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.key, e.target.checked);
  };

  return (
    <div className="space-y-1">
      <label className={cn('flex items-center gap-1 text-sm font-medium', colors.text.primary)}>
        {field.label}
        {field.required && <span className="text-red-500 text-xs">*</span>}
      </label>

      {field.description && (
        <p className={cn('text-xs', colors.text.tertiary)}>{field.description}</p>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          {field.type === 'text' && (
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={handleTextChange}
              placeholder={field.placeholder}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              value={typeof value === 'string' ? value : ''}
              onChange={handleTextChange}
              placeholder={field.placeholder}
              rows={field.colSpan === 2 ? 3 : 2}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all resize-y',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={typeof value === 'number' ? value : ''}
              onChange={handleNumberChange}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              value={typeof value === 'string' ? value : ''}
              onChange={handleDateChange}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          )}

          {field.type === 'datetime-local' && (
            <input
              type="datetime-local"
              value={typeof value === 'string' ? value : ''}
              onChange={handleDatetimeChange}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error && 'border-red-500 focus:ring-red-500'
              )}
            />
          )}

          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={typeof value === 'boolean' ? value : false}
                onChange={handleCheckboxChange}
                autoFocus={autoFocus}
                className={cn(
                  'h-4 w-4 rounded border transition-all cursor-pointer',
                  colors.border.primary,
                  'focus:ring-2 focus:ring-blue-500',
                  error && 'border-red-500'
                )}
              />
              <span className={cn('text-sm', colors.text.secondary)}>
                Yes, requires follow-up
              </span>
            </div>
          )}

          {field.type === 'select' && field.options && (
            <select
              value={typeof value === 'string' ? value : ''}
              onChange={handleSelectChange}
              autoFocus={autoFocus}
              className={cn(
                'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                !value && 'text-slate-400',
                error && 'border-red-500 focus:ring-red-500'
              )}
            >
              <option value="">Select {field.label}...</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsultationsField;