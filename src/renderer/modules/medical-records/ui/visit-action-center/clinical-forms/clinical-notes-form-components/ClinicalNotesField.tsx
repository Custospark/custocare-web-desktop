import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalNotesThemeTokens } from './clinicalNotesForm.types';

interface ClinicalNotesFieldProps {
  label: string;
  description?: string;
  placeholder: string;
  value: string;
  rows?: number;
  required?: boolean;
  error?: string;
  icon: LucideIcon;
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

export const ClinicalNotesField: React.FC<ClinicalNotesFieldProps> = ({
  label,
  description,
  placeholder,
  value,
  rows = 4,
  required = false,
  error,
  icon: Icon,
  isDark,
  colors,
  autoFocus = false,
  onChange,
}) => {
  return (
    <div>
      <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
        <Icon className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {description && (
        <p className={cn('mb-2 text-xs', colors.text.tertiary)}>
          {description}
        </p>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={cn(
          'w-full resize-y rounded-xl border p-3 text-sm outline-none transition-all duration-200',
          colors.bg.input,
          colors.text.primary,
          colors.border.primary,
          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error &&
            (isDark
              ? 'border-red-700 focus:ring-red-500'
              : 'border-red-300 focus:ring-red-500')
        )}
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ClinicalNotesField;