// BaseTextField.tsx
import React from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface BaseTextFieldProps {
  theme: 'light' | 'dark';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'textarea' | 'select';
  rows?: number;
  options?: { value: string; label: string }[];
  className?: string;
}

export const BaseTextField: React.FC<BaseTextFieldProps> = ({
  theme,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  rows = 3,
  options = [],
  className,
}) => {
  const isDark = theme === 'dark';

  const colors = {
    bg: isDark ? 'bg-gray-800' : 'bg-gray-50',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    label: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
  };

  const baseInputClass = cn(
    'w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all resize-y',
    colors.bg,
    colors.text,
    colors.border,
    colors.focus
  );

  return (
    <div className={className}>
      <label className={`block text-sm font-medium mb-2 ${colors.label}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClass}
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(baseInputClass, 'cursor-pointer')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}
    </div>
  );
};