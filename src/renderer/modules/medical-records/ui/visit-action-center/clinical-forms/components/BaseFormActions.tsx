// BaseFormActions.tsx
import React from 'react';
import { Save, X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface BaseFormActionsProps {
  theme: 'light' | 'dark';
  onCancel: () => void;
  onSave: () => void;
  isSaveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  showSave?: boolean;
  showCancel?: boolean;
}

export const BaseFormActions: React.FC<BaseFormActionsProps> = ({
  theme,
  onCancel,
  onSave,
  isSaveDisabled = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  showSave = true,
  showCancel = true,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-end gap-3">
      {showCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            isDark
              ? 'hover:bg-gray-800 text-gray-400'
              : 'hover:bg-gray-50 text-gray-600'
          )}
        >
          <X className="h-4 w-4" />
          {cancelLabel}
        </button>
      )}
      
      {showSave && (
        <button
          type="submit"
          onClick={onSave}
          disabled={isSaveDisabled}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            !isSaveDisabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed text-gray-200'
          )}
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
      )}
    </div>
  );
};