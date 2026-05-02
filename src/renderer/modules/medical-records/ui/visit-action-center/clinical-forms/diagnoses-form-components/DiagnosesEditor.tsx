import React, { useState, useMemo } from 'react';
import {
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SquarePen,
  X,
  CheckCircle,
  AlertTriangle,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { DiagnosesField } from './DiagnosesField';
import {
  addCustomField,
  removeCustomField,
  updateCustomField,
} from './diagnosesForm.utils';
import {
  DIAGNOSIS_TYPE_OPTIONS,
  DIAGNOSIS_CERTAINTY_OPTIONS,
  DIAGNOSIS_CLINICAL_STATUS_OPTIONS,
  DiagnosisVerificationStatus,
} from '../../../../api/diagnosis/diagnosisTypes';
import type {
  DiagnosesFormValues,
  DiagnosesMode,
  DiagnosesThemeTokens,
  DynamicCustomFields,
  DynamicCustomField,
  CustomFieldValueType,
} from './diagnosesForm.types';

// Predefined diagnosis codes (ICD-10 common codes)
const PREDEFINED_DIAGNOSIS_CODES = [
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified' },
  { code: 'B34.9', description: 'Viral infection, unspecified' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'J15.0', description: 'Pneumonia due to Mycoplasma pneumoniae' },
  { code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified' },
  { code: 'R50.9', description: 'Fever, unspecified' },
  { code: 'R51', description: 'Headache' },
  { code: 'Z23', description: 'Encounter for immunization' },
];

// Searchable combobox component for diagnosis code
interface DiagnosisCodeComboboxProps {
  value: string;
  error?: string;
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

const DiagnosisCodeCombobox: React.FC<DiagnosisCodeComboboxProps> = ({
  value,
  error,
//   isDark,
  colors,
  autoFocus,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);

  // Filter codes based on search term
  const filteredCodes = useMemo(() => {
    if (!searchTerm) return PREDEFINED_DIAGNOSIS_CODES;
    const term = searchTerm.toLowerCase();
    return PREDEFINED_DIAGNOSIS_CODES.filter(
      (item) =>
        item.code.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleSelect = (code: string) => {
    onChange(code);
    setSearchTerm(code);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow click selection
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="e.g., J15.0, I10, E11.9 or enter custom code"
          autoFocus={autoFocus}
          className={cn(
            'w-full rounded-lg border px-3 py-2 pl-9 text-sm outline-none transition-all',
            colors.bg.input,
            colors.text.primary,
            colors.border.primary,
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error && 'border-red-500 focus:ring-red-500'
          )}
        />
        <Search
          className={cn(
            'absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2',
            colors.text.tertiary
          )}
        />
      </div>

      {isOpen && filteredCodes.length > 0 && (
        <div
          className={cn(
            'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg',
            colors.bg.card,
            colors.border.primary
          )}
        >
          {filteredCodes.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <span className="font-semibold">{item.code}</span>
              <span className={cn('ml-2 text-xs', colors.text.secondary)}>
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredCodes.length === 0 && (
        <div
          className={cn(
            'absolute z-10 mt-1 w-full rounded-lg border p-3 text-center text-sm shadow-lg',
            colors.bg.card,
            colors.border.primary,
            colors.text.secondary
          )}
        >
          No matching codes. You can enter a custom code.
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Field definitions for diagnoses form
const DIAGNOSES_FIELD_DEFINITIONS = [
  // Diagnosis Code & Description
  {
    key: 'diagnosisCode' as const,
    label: 'Diagnosis Code',
    type: 'combobox' as const,
    placeholder: 'Search or enter ICD-10 code...',
    description: 'ICD-10/11 code (search from list or enter custom code)',
    required: true,
    previewFallback: 'No diagnosis code recorded',
    colSpan: 1,
  },
  {
    key: 'diagnosisDescription' as const,
    label: 'Diagnosis Description',
    type: 'textarea' as const,
    placeholder: 'e.g., Pneumonia due to Mycoplasma pneumoniae',
    description: 'Human-readable diagnosis description',
    required: true,
    previewFallback: 'No diagnosis description recorded',
    colSpan: 2,
  },
  // Diagnosis Classification
  {
    key: 'diagnosisType' as const,
    label: 'Diagnosis Type',
    type: 'select' as const,
    description: 'Type/role of this diagnosis',
    options: DIAGNOSIS_TYPE_OPTIONS,
    previewFallback: 'No diagnosis type selected',
    colSpan: 1,
  },
  {
    key: 'certainty' as const,
    label: 'Certainty',
    type: 'select' as const,
    description: 'Diagnostic certainty level',
    options: DIAGNOSIS_CERTAINTY_OPTIONS,
    previewFallback: 'No certainty level selected',
    colSpan: 1,
  },
  {
    key: 'clinicalStatus' as const,
    label: 'Clinical Status',
    type: 'select' as const,
    description: 'Current clinical status',
    options: DIAGNOSIS_CLINICAL_STATUS_OPTIONS,
    previewFallback: 'No clinical status selected',
    colSpan: 1,
  },
  // Dates
  {
    key: 'onsetDate' as const,
    label: 'Onset Date',
    type: 'date' as const,
    description: 'When symptoms/disease started',
    previewFallback: 'No onset date recorded',
    colSpan: 1,
  },
  {
    key: 'abatementDate' as const,
    label: 'Abatement Date',
    type: 'date' as const,
    description: 'When condition resolved (if applicable)',
    previewFallback: 'No abatement date recorded',
    colSpan: 1,
  },
  // Clinical Notes
  {
    key: 'clinicalNotes' as const,
    label: 'Clinical Notes',
    type: 'textarea' as const,
    placeholder: 'Additional clinical notes specific to this diagnosis',
    description: 'Any relevant notes about this diagnosis',
    previewFallback: 'No clinical notes recorded',
    colSpan: 2,
  },
  // Diagnostic Criteria
  {
    key: 'diagnosticCriteriaMet' as const,
    label: 'Diagnostic Criteria Met',
    type: 'textarea' as const,
    placeholder: 'e.g., Fever >38°C for 48 hours, Positive PCR, Chest X-ray findings',
    description: 'Specific criteria used to establish this diagnosis',
    previewFallback: 'No diagnostic criteria recorded',
    colSpan: 2,
  },
];

interface DiagnosesEditorProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  mode: DiagnosesMode;
  formData: DiagnosesFormValues;
  customFields: DynamicCustomFields;
  fieldErrors: Partial<Record<keyof DiagnosesFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  isVerifying?: boolean;
  isDisputing?: boolean;
  isResolving?: boolean;
  isReactivating?: boolean;
  onChange: (field: keyof DiagnosesFormValues, value: string | null) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVerify?: () => void;
  onDispute?: () => void;
  onResolve?: () => void;
  onReactivate?: () => void;
}

export const DiagnosesEditor: React.FC<DiagnosesEditorProps> = ({
  isDark,
  colors,
  mode,
  formData,
  customFields,
  fieldErrors,
  formError,
  isSubmitting,
  isVerifying,
  isDisputing,
  isResolving,
  isReactivating,
  onChange,
  onCustomFieldsChange,
  onCancel,
  onPreview,
  onSubmit,
  onVerify,
  onDispute,
  onResolve,
  onReactivate,
}) => {
  const isEditing = mode === 'edit';
  const isVerified = formData.verificationStatus === DiagnosisVerificationStatus.VERIFIED;
  const isDisputed = formData.verificationStatus === DiagnosisVerificationStatus.DISPUTED;
  const isResolved = formData.clinicalStatus === 'resolved';

  const handleAddCustomField = () => {
    onCustomFieldsChange(addCustomField(customFields, 'text'));
  };

  const handleUpdateCustomField = (index: number, updates: Partial<DynamicCustomField>) => {
    onCustomFieldsChange(updateCustomField(customFields, index, updates));
  };

  const handleRemoveCustomField = (index: number) => {
    onCustomFieldsChange(removeCustomField(customFields, index));
  };

  // Group fields for grid layout
//   const row1Fields = DIAGNOSES_FIELD_DEFINITIONS.slice(0, 2);
  const row2Fields = DIAGNOSES_FIELD_DEFINITIONS.slice(2, 5);
  const row3Fields = DIAGNOSES_FIELD_DEFINITIONS.slice(5, 7);
  const row4Fields = DIAGNOSES_FIELD_DEFINITIONS.slice(7, 8);
  const row5Fields = DIAGNOSES_FIELD_DEFINITIONS.slice(8, 9);

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
                isDark ? 'bg-blue-950/40' : 'bg-blue-50'
              )}
            >
              <SquarePen
                className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-700')}
              />
            </div>

            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                {isEditing ? 'Edit Diagnosis' : 'Add Diagnosis'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Record diagnosis using ICD codes or free-text description.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Action Buttons (for edit mode) */}
            {isEditing && onVerify && !isVerified && !isDisputed && (
              <button
                type="button"
                onClick={onVerify}
                disabled={isVerifying}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-green-600 text-white hover:bg-green-700',
                  isVerifying && 'cursor-not-allowed opacity-50'
                )}
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Verify
              </button>
            )}

            {isEditing && onDispute && !isDisputed && (
              <button
                type="button"
                onClick={onDispute}
                disabled={isDisputing}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
                  isDark && 'border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-950/50',
                  isDisputing && 'cursor-not-allowed opacity-50'
                )}
              >
                {isDisputing ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Dispute
              </button>
            )}

            {isEditing && onResolve && !isResolved && isVerified && (
              <button
                type="button"
                onClick={onResolve}
                disabled={isResolving}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-teal-600 text-white hover:bg-teal-700',
                  isResolving && 'cursor-not-allowed opacity-50'
                )}
              >
                {isResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Resolve
              </button>
            )}

            {isEditing && onReactivate && isResolved && (
              <button
                type="button"
                onClick={onReactivate}
                disabled={isReactivating}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-amber-600 text-white hover:bg-amber-700',
                  isReactivating && 'cursor-not-allowed opacity-50'
                )}
              >
                {isReactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Reactivate
              </button>
            )}

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

        {/* Diagnosis Code & Description - Row 1 */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Diagnosis Code - Custom Combobox */}
          <div>
            <label className={cn('mb-1 flex items-center gap-1 text-sm font-medium', colors.text.primary)}>
              Diagnosis Code <span className="text-red-500 text-xs">*</span>
            </label>
            <p className={cn('mb-2 text-xs', colors.text.tertiary)}>
              Search from predefined ICD codes or enter your own
            </p>
            <DiagnosisCodeCombobox
              value={formData.diagnosisCode}
              error={fieldErrors.diagnosisCode}
              isDark={isDark}
              colors={colors}
              autoFocus={true}
              onChange={(value) => onChange('diagnosisCode', value)}
            />
          </div>

          {/* Diagnosis Description */}
          <div className="lg:col-span-2">
            <label className={cn('mb-1 flex items-center gap-1 text-sm font-medium', colors.text.primary)}>
              Diagnosis Description <span className="text-red-500 text-xs">*</span>
            </label>
            <p className={cn('mb-2 text-xs', colors.text.tertiary)}>
              Human-readable diagnosis description
            </p>
            <textarea
              value={formData.diagnosisDescription || ''}
              onChange={(e) => onChange('diagnosisDescription', e.target.value)}
              placeholder="e.g., Pneumonia due to Mycoplasma pneumoniae"
              rows={3}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all resize-y',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                fieldErrors.diagnosisDescription && 'border-red-500 focus:ring-red-500'
              )}
            />
            {fieldErrors.diagnosisDescription && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.diagnosisDescription}</p>
            )}
          </div>
        </div>

        {/* Diagnosis Classification - Row 2 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {row2Fields.map((field) => (
            <DiagnosesField
              key={field.key}
              field={field}
              value={formData[field.key] as string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Dates - Row 3 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {row3Fields.map((field) => (
            <DiagnosesField
              key={field.key}
              field={field}
              value={formData[field.key] as string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Clinical Notes - Row 4 */}
        <div className="mb-6">
          {row4Fields.map((field) => (
            <DiagnosesField
              key={field.key}
              field={field}
              value={formData[field.key] as string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Diagnostic Criteria Met - Row 5 */}
        <div className="mb-6">
          {row5Fields.map((field) => (
            <DiagnosesField
              key={field.key}
              field={field}
              value={formData[field.key] as string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Dynamic Custom Fields Section */}
        <div className="mt-8 border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                Additional Information
              </h4>
              <p className={cn('text-xs', colors.text.tertiary)}>
                Add custom fields specific to this diagnosis
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCustomField}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                'text-blue-600 hover:bg-blue-50',
                isDark && 'hover:bg-blue-950/40'
              )}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div
                key={field.id}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-lg border p-3',
                  colors.border.primary
                )}
              >
                <input
                  type="text"
                  placeholder="Field name (e.g., Treatment Response)"
                  value={field.label}
                  onChange={(e) => handleUpdateCustomField(index, { label: e.target.value })}
                  className={cn(
                    'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />

                <select
                  value={field.type}
                  onChange={(e) => handleUpdateCustomField(index, { type: e.target.value as CustomFieldValueType })}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Text Area</option>
                  <option value="date">Date</option>
                </select>

                {field.type === 'date' ? (
                  <input
                    type="date"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    className={cn(
                      'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder="Value"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    rows={2}
                    className={cn(
                      'flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm outline-none transition-all resize-y',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Value"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    className={cn(
                      'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(index)}
                  className={cn(
                    'cursor-pointer rounded-lg p-2 transition-all',
                    'text-red-500 hover:bg-red-50',
                    isDark && 'hover:bg-red-950/40'
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {customFields.length === 0 && (
            <p className={cn('py-4 text-center text-sm', colors.text.tertiary)}>
              No additional fields. Click "Add Field" to add custom information.
            </p>
          )}
        </div>

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
              ? 'Update Diagnosis'
              : 'Save Diagnosis'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default DiagnosesEditor;