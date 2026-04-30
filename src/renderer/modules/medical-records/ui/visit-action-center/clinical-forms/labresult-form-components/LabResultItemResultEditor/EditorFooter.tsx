// lab-results/labresult-form-components/LabResultItemResultEditor/EditorFooter.tsx
import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labResultForm.types';

interface EditorFooterProps {
  colors: ColorTokens;
  readOnly: boolean;
  saving: boolean;
  hasConfiguredFields: boolean;
  missingRequiredField: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const EditorFooter: React.FC<EditorFooterProps> = ({
  colors,
  readOnly,
  saving,
  hasConfiguredFields,
  missingRequiredField,
  onClose,
  onSave,
}) => {
  return (
    <div className={cn('flex items-center justify-between border-t px-5 py-4', colors.border.primary)}>
      <div className={cn('text-xs', colors.text.secondary)}>
        {readOnly
          ? 'This editor is read-only.'
          : missingRequiredField
          ? 'Required fields must be completed before save.'
          : 'Save results to attach them to this lab request item.'}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-medium transition-all',
            colors.border.primary,
            colors.bg.hover,
            colors.text.secondary
          )}
        >
          Close
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={readOnly || saving || !hasConfiguredFields}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
            readOnly || saving || !hasConfiguredFields
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Results'}
        </button>
      </div>
    </div>
  );
};