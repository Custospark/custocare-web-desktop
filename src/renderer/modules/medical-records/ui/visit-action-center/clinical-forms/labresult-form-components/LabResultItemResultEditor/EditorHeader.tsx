// lab-results/labresult-form-components/LabResultItemResultEditor/EditorHeader.tsx
import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labResultForm.types';

interface EditorHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  testName: string;
  onClose: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  isDark,
  colors,
  testName,
  onClose,
}) => {
  return (
    <div className={cn('flex items-center justify-between border-b px-5 py-4', colors.border.primary)}>
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', isDark ? 'bg-blue-950/40' : 'bg-blue-50')}>
          <Sparkles className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
        </div>

        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Result Editor — {testName || 'Lab Test'}
          </h3>
          <p className={cn('mt-1 text-sm', colors.text.secondary)}>
            Record structured laboratory result values for this request item.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={cn('rounded-lg p-2 transition-colors', colors.bg.hover, colors.text.secondary)}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};