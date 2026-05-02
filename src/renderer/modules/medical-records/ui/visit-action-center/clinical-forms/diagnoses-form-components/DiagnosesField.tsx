import React from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { DiagnosesThemeTokens, DiagnosesFieldDefinition, DiagnosesFormValues } from './diagnosesForm.types';

interface DiagnosesFieldProps {
  field: DiagnosesFieldDefinition;
  value: string | null;
  error?: string;
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof DiagnosesFormValues, value: string | null) => void;
}

export const DiagnosesField: React.FC<DiagnosesFieldProps> = ({
  field,
  value,
  error,
  // isDark,
  colors,
  autoFocus = false,
  onChange,
}) => {
  // Skip rendering for 'combobox' type - it's handled directly in DiagnosesEditor
  if (field.type === 'combobox') {
    return null;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(field.key, e.target.value || null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.key, e.target.value || null);
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
              value={value ?? ''}
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
              value={value ?? ''}
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

          {field.type === 'date' && (
            <input
              type="date"
              value={value ?? ''}
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

          {field.type === 'select' && field.options && (
            <select
              value={value ?? ''}
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

export default DiagnosesField;