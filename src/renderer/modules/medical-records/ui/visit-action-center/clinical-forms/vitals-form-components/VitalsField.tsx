import React from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { VitalsThemeTokens, VitalsFieldDefinition, VitalsFormValues } from './vitalsForm.types';

interface VitalsFieldProps {
  field: VitalsFieldDefinition;
  value: number | string | null;
  unitValue?: 'celsius' | 'fahrenheit' | 'cm' | 'inches' | 'kg' | 'lbs';
  error?: string;
  isDark: boolean;
  colors: VitalsThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof VitalsFormValues, value: number | string | null) => void;
  onUnitChange?: (key: keyof VitalsFormValues, value: string) => void;
}

export const VitalsField: React.FC<VitalsFieldProps> = ({
  field,
  value,
  unitValue,
  error,
//   isDark,
  colors,
  autoFocus = false,
  onChange,
  onUnitChange,
}) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(field.key, null);
    } else {
      const num = parseFloat(val);
      onChange(field.key, isNaN(num) ? null : num);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field.key, e.target.value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(field.key, e.target.value);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onUnitChange) {
      onUnitChange(field.key as keyof VitalsFormValues, e.target.value);
    }
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
        {/* Main Input */}
        <div className="flex-1">
          {field.type === 'number' && (
            <input
              type="number"
              value={value ?? ''}
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

          {field.type === 'select' && field.options && (
            <select
              value={value ?? ''}
              onChange={handleSelectChange}
              autoFocus={autoFocus}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all cursor-pointer',
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

        {/* Unit Toggle (if applicable) */}
        {field.type === 'number' && field.unitOptions && field.unitField && onUnitChange && (
          <select
            value={unitValue || (field.unitOptions[0]?.value as string)}
            onChange={handleUnitChange}
            className={cn(
              'w-24 rounded-lg border px-2 py-2 text-sm outline-none transition-all cursor-pointer',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            )}
          >
            {field.unitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default VitalsField;