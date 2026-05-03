import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  FileText,
  CalendarDays,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  SquarePen,
  X,
} from 'lucide-react';
import { AllergiesField } from './AllergiesField';
import { AllergySeverity } from '../../../../api/allergies/AllergyTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type {
  AllergiesFormValues,
  AllergiesMode,
  AllergiesThemeTokens,
} from './allergiesForm.types';

// Severity options for select dropdown
const SEVERITY_OPTIONS = [
  { value: AllergySeverity.MILD, label: 'Mild' },
  { value: AllergySeverity.MODERATE, label: 'Moderate' },
  { value: AllergySeverity.SEVERE, label: 'Severe' },
];

interface AllergiesEditorProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  mode: AllergiesMode;
  formData: AllergiesFormValues;
  fieldErrors: Partial<Record<keyof AllergiesFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  editingAllergyId?: number | null;
  onChange: (field: keyof AllergiesFormValues, value: string | boolean) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const AllergiesEditor: React.FC<AllergiesEditorProps> = ({
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
        'rounded-2xl border mb-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      {/* Header */}
      <div className={cn('border-b p-5', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                isDark ? 'bg-red-900/20' : 'bg-red-50'
              )}
            >
              <SquarePen
                className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-600')}
              />
            </div>

            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                {isEditing ? 'Edit Allergy' : 'Add New Allergy'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                {isEditing
                  ? 'Update the allergy record with accurate information.'
                  : 'Capture allergen, severity, reaction, and clinical notes.'}
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

      {/* Form */}
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

        {/* Allergen Field */}
        <div className="mb-4">
          <AllergiesField
            label="Allergen"
            description="Substance that triggers the allergic reaction"
            placeholder="e.g., Penicillin, Peanuts, Latex, Pollen"
            value={formData.allergen}
            type="text"
            required={true}
            error={fieldErrors.allergen}
            icon={<AlertTriangle className="h-4 w-4" />}
            isDark={isDark}
            colors={colors}
            autoFocus={true}
            onChange={(value) => onChange('allergen', value)}
          />
        </div>

        {/* Severity Field */}
        <div className="mb-4">
          <AllergiesField
            label="Severity"
            description="Clinical severity level of the allergy"
            value={formData.severity}
            type="select"
            options={SEVERITY_OPTIONS}
            required={true}
            error={fieldErrors.severity}
            icon={<Activity className="h-4 w-4" />}
            isDark={isDark}
            colors={colors}
            onChange={(value) => onChange('severity', value)}
          />
        </div>

        {/* Reaction Field */}
        <div className="mb-4">
          <AllergiesField
            label="Reaction"
            description="Signs and symptoms experienced during reaction"
            placeholder="e.g., Skin rash, difficulty breathing, swelling, anaphylaxis"
            value={formData.reaction}
            type="textarea"
            rows={3}
            error={fieldErrors.reaction}
            icon={<AlertCircle className="h-4 w-4" />}
            isDark={isDark}
            colors={colors}
            onChange={(value) => onChange('reaction', value)}
          />
        </div>

        {/* Diagnosis Date Field */}
        <div className="mb-4">
          <AllergiesField
            label="Diagnosis Date"
            description="When the allergy was first diagnosed"
            value={formData.diagnosedAt}
            type="date"
            error={fieldErrors.diagnosedAt}
            icon={<CalendarDays className="h-4 w-4" />}
            isDark={isDark}
            colors={colors}
            onChange={(value) => onChange('diagnosedAt', value)}
          />
        </div>

        {/* Clinical Notes Field */}
        <div className="mb-4">
          <AllergiesField
            label="Clinical Notes"
            description="Additional clinical information, precautions, or management notes"
            placeholder="e.g., Patient carries epinephrine auto-injector, avoid cross-contamination, family history of severe allergies..."
            value={formData.clinicalNotes}
            type="textarea"
            rows={4}
            error={fieldErrors.clinicalNotes}
            icon={<FileText className="h-4 w-4" />}
            isDark={isDark}
            colors={colors}
            onChange={(value) => onChange('clinicalNotes', value)}
          />
        </div>

        {/* Active Status Toggle */}
        <div
          className={cn(
            'mb-6 rounded-xl border p-4',
            colors.border.primary,
            colors.bg.subtle
          )}
        >
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => onChange('isActive', e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className={cn('text-sm font-medium', colors.text.primary)}>
                Allergy is active
              </p>
              <p className={cn('text-xs', colors.text.secondary)}>
                Uncheck if the allergy has been resolved or is no longer clinically relevant
              </p>
            </div>
          </label>
        </div>

        {/* Validation Warning */}
        {!formData.allergen.trim() && (
          <div
            className={cn(
              'mb-4 flex items-center gap-2 rounded-lg p-3 text-xs',
              isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
            )}
          >
            <AlertCircle className="h-4 w-4" />
            Allergen name is required before saving
          </div>
        )}

        {/* Form Actions */}
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
            Discard & Close
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !formData.allergen.trim()}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all',
              isSubmitting || !formData.allergen.trim()
                ? 'cursor-not-allowed bg-slate-400'
                : isEditing
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Update Allergy'
              : 'Save Allergy'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AllergiesEditor;