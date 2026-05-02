import React from 'react';
import {
  Eye,
  Loader2,
  RotateCcw,
  Save,
  SquarePen,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { CLINICAL_NOTES_SECTIONS } from './clinicalNotesForm.utils';
import { ClinicalNotesField } from './ClinicalNotesField';
import type {
  ClinicalNotesFormData,
  ClinicalNotesMode,
  ClinicalNotesThemeTokens,
} from './clinicalNotesForm.types';

interface ClinicalNotesEditorProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  mode: ClinicalNotesMode;
  formData: ClinicalNotesFormData;
  fieldErrors: Partial<Record<keyof ClinicalNotesFormData, string>>;
  formError: string | null;
  isSubmitting: boolean;
  onChange: (field: keyof ClinicalNotesFormData, value: string) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const ClinicalNotesEditor: React.FC<ClinicalNotesEditorProps> = ({
  isDark,
  colors,
  mode,
  formData,
  fieldErrors,
  formError,
  isSubmitting,
  onChange,
  onCancel,
  onPreview,
  onSubmit,
}) => {
  const isEditing = mode === 'edit';

  return (
    <section
      className={cn(
        'rounded-2xl border',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className={cn('border-b p-5', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                isDark ? 'bg-blue-950/40' : 'bg-blue-50'
              )}
            >
              <SquarePen
                className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-700')}
              />
            </div>

            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                {isEditing ? 'Edit Clinical Note' : 'Create Clinical Note'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Use clear, easy-to-understand wording and record today's findings accurately.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.secondary,
                colors.bg.hover
              )}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-5 sm:p-6">
        {formError && (
          <div
            className={cn(
              'mb-6 rounded-xl border p-4 text-sm',
              isDark
                ? 'border-red-800/60 bg-red-950/30 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {formError}
          </div>
        )}

        <div className="space-y-6">
          {CLINICAL_NOTES_SECTIONS.map((section, index) => (
            <ClinicalNotesField
              key={section.key}
              label={section.label}
              description={section.description}
              placeholder={section.placeholder}
              value={formData[section.key]}
              rows={section.rows}
              required={section.required}
              error={fieldErrors[section.key]}
              icon={section.icon}
              isDark={isDark}
              colors={colors}
              autoFocus={index === 0}
              onChange={(value) => onChange(section.key, value)}
            />
          ))}
        </div>

        <div className={cn('mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5', colors.border.primary)}>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              colors.text.secondary,
              colors.bg.hover
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Discard Changes
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all',
              isSubmitting
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Update Clinical Note'
              : 'Save Clinical Note'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ClinicalNotesEditor;