import {
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SquarePen,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { VitalsField } from './VitalsField';
import {
  addCustomField,
  removeCustomField,
  updateCustomField,
} from './vitalsForm.utils';
import type {
  VitalsFormValues,
  VitalsMode,
  VitalsThemeTokens,
  DynamicCustomFields,
  DynamicCustomField,
  CustomFieldValueType,
} from './vitalsForm.types';

// Field definitions for standard vitals with proper typing
type UnitValueType = 'celsius' | 'fahrenheit' | 'cm' | 'inches' | 'kg' | 'lbs';

const VITALS_FIELD_DEFINITIONS = [
  // Core Vitals - Row 1
  {
    key: 'temperature' as const,
    label: 'Temperature',
    type: 'number' as const,
    placeholder: 'e.g., 98.6',
    description: 'Body temperature',
    min: 25,  // Backend: min:25, max:45 (Celsius)
    max: 45,
    step: 0.1,
    unitOptions: [
      { value: 'celsius' as const, label: '°C' },
      { value: 'fahrenheit' as const, label: '°F' },
    ],
    unitField: 'temperatureUnit' as const,
    previewFallback: 'No temperature recorded',
    colSpan: 1,
  },
  {
    key: 'heartRate' as const,
    label: 'Heart Rate',
    type: 'number' as const,
    placeholder: 'e.g., 72',
    description: 'Beats per minute',
    min: 0,    // Backend: min:0, max:300
    max: 300,
    step: 1,
    previewFallback: 'No heart rate recorded',
    colSpan: 1,
  },
  {
    key: 'respiratoryRate' as const,
    label: 'Respiratory Rate',
    type: 'number' as const,
    placeholder: 'e.g., 16',
    description: 'Breaths per minute',
    min: 0,    // Backend: min:0, max:100
    max: 100,
    step: 1,
    previewFallback: 'No respiratory rate recorded',
    colSpan: 1,
  },
  {
    key: 'oxygenSaturation' as const,
    label: 'Oxygen Saturation',
    type: 'number' as const,
    placeholder: 'e.g., 98',
    description: 'SpO2 percentage',
    min: 0,    // Backend: min:0, max:100
    max: 100,
    step: 1,
    previewFallback: 'No SpO2 recorded',
    colSpan: 1,
  },
  // Core Vitals - Row 2 (BP)
  {
    key: 'systolicBp' as const,
    label: 'Systolic BP',
    type: 'number' as const,
    placeholder: 'Systolic',
    description: 'Systolic blood pressure (top number)',
    min: 30,   // Backend: min:30, max:300
    max: 300,
    step: 1,
    previewFallback: 'No systolic BP recorded',
    colSpan: 1,
  },
  {
    key: 'diastolicBp' as const,
    label: 'Diastolic BP',
    type: 'number' as const,
    placeholder: 'Diastolic',
    description: 'Diastolic blood pressure (bottom number)',
    min: 30,   // Backend: min:30, max:200
    max: 200,
    step: 1,
    previewFallback: 'No diastolic BP recorded',
    colSpan: 1,
  },
  // Anthropometrics
  {
    key: 'height' as const,
    label: 'Height',
    type: 'number' as const,
    placeholder: 'e.g., 170',
    description: 'Patient height',
    min: 10,   // Backend: min:10, max:300
    max: 300,
    step: 0.1,
    unitOptions: [
      { value: 'cm' as const, label: 'cm' },
      { value: 'inches' as const, label: 'in' },
    ],
    unitField: 'heightUnit' as const,
    previewFallback: 'No height recorded',
    colSpan: 1,
  },
  {
    key: 'weight' as const,
    label: 'Weight',
    type: 'number' as const,
    placeholder: 'e.g., 70',
    description: 'Patient weight',
    min: 0.1,  // Backend: min:0.1, max:500
    max: 500,
    step: 0.1,
    unitOptions: [
      { value: 'kg' as const, label: 'kg' },
      { value: 'lbs' as const, label: 'lbs' },
    ],
    unitField: 'weightUnit' as const,
    previewFallback: 'No weight recorded',
    colSpan: 1,
  },
  {
    key: 'bmi' as const,
    label: 'BMI',
    type: 'number' as const,
    placeholder: 'Auto-calculated',
    description: 'Body Mass Index (auto-calculated from height/weight)',
    // min: 10,   
    // max: 500,
    step: 0.1,
    previewFallback: 'BMI not calculated',
    colSpan: 1,
  },
  // Pain Assessment
  {
    key: 'painScore' as const,
    label: 'Pain Score',
    type: 'number' as const,
    placeholder: '0-10',
    description: 'Pain level (0 = no pain, 10 = worst pain)',
    min: 0,    // Backend: min:0, max:10
    max: 10,
    step: 1,
    previewFallback: 'No pain score recorded',
    colSpan: 1,
  },
  {
    key: 'painLocation' as const,
    label: 'Pain Location',
    type: 'text' as const,
    placeholder: 'e.g., Chest, Abdomen, Head',
    description: 'Where is the pain located?',
    previewFallback: 'No pain location recorded',
    colSpan: 2,
  },
  // Measurement Context
  {
    key: 'consciousnessLevel' as const,
    label: 'Consciousness Level',
    type: 'select' as const,
    placeholder: 'Select level',
    description: 'AVPU Scale (Alert, Verbal, Pain, Unresponsive)',
    options: [
      { value: 'alert', label: 'Alert' },
      { value: 'verbal', label: 'Responds to Verbal' },
      { value: 'pain', label: 'Responds to Pain' },
      { value: 'unresponsive', label: 'Unresponsive' },
    ],
    previewFallback: 'No consciousness level recorded',
    colSpan: 1,
  },
  {
    key: 'generalAppearance' as const,
    label: 'General Appearance',
    type: 'textarea' as const,
    placeholder: 'e.g., Alert, well-nourished, no acute distress',
    description: 'General observation notes',
    previewFallback: 'No general appearance recorded',
    colSpan: 2,
  },
];

// Helper function to get unit value with proper type
const getUnitValue = (
  field: string,
  formData: VitalsFormValues
): UnitValueType => {
  if (field === 'temperature') return formData.temperatureUnit;
  if (field === 'height') return formData.heightUnit;
  if (field === 'weight') return formData.weightUnit;
  return 'celsius';
};

interface VitalsEditorProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  mode: VitalsMode;
  formData: VitalsFormValues;
  customFields: DynamicCustomFields;
  fieldErrors: Partial<Record<keyof VitalsFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  onChange: (field: keyof VitalsFormValues, value: number | string | null) => void;
  onUnitChange: (field: keyof VitalsFormValues, value: string) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const VitalsEditor: React.FC<VitalsEditorProps> = ({
  isDark,
  colors,
  mode,
  formData,
  customFields,
  fieldErrors,
  formError,
  isSubmitting,
  onChange,
  onUnitChange,
  onCustomFieldsChange,
  onCancel,
  onPreview,
  onSubmit,
}) => {
  const isEditing = mode === 'edit';

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
  const row1Fields = VITALS_FIELD_DEFINITIONS.slice(0, 4);
  const row2Fields = VITALS_FIELD_DEFINITIONS.slice(4, 6);
  const row3Fields = VITALS_FIELD_DEFINITIONS.slice(6, 9);
  const row4Fields = VITALS_FIELD_DEFINITIONS.slice(9, 11);
  const row5Fields = VITALS_FIELD_DEFINITIONS.slice(11, 13);

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
                {isEditing ? 'Edit Vital Signs' : 'Record Vital Signs'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Enter the patient's vital signs accurately. Fields with * are recommended.
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

        {/* Core Vitals - Row 1 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {row1Fields.map((field) => (
            <VitalsField
              key={field.key}
              field={field}
              value={formData[field.key] as number | string | null}
              unitValue={getUnitValue(field.key, formData)}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
              onUnitChange={field.unitField ? onUnitChange : undefined}
            />
          ))}
        </div>

        {/* Blood Pressure - Row 2 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {row2Fields.map((field) => (
            <VitalsField
              key={field.key}
              field={field}
              value={formData[field.key] as number | string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
          {/* BP Position & Location */}
          <div className="sm:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                  BP Position
                </label>
                <select
                  value={formData.bpPosition || ''}
                  onChange={(e) => onChange('bpPosition', e.target.value || null)}
                  className={cn(
                    'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                >
                  <option value="">Select position...</option>
                  <option value="sitting">Sitting</option>
                  <option value="standing">Standing</option>
                  <option value="supine">Supine</option>
                  <option value="lying">Lying</option>
                </select>
              </div>
              <div>
                <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                  BP Location
                </label>
                <input
                  type="text"
                  value={formData.bpLocation || ''}
                  onChange={(e) => onChange('bpLocation', e.target.value || null)}
                  placeholder="e.g., Left arm, Right arm"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Anthropometrics - Row 3 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {row3Fields.map((field) => (
            <VitalsField
              key={field.key}
              field={field}
              value={formData[field.key] as number | string | null}
              unitValue={field.unitField ? getUnitValue(field.key, formData) : undefined}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
              onUnitChange={field.unitField ? onUnitChange : undefined}
            />
          ))}
        </div>

        {/* Pain Assessment - Row 4 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {row4Fields.map((field) => (
            <VitalsField
              key={field.key}
              field={field}
              value={formData[field.key] as number | string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Clinical Context - Row 5 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {row5Fields.map((field) => (
            <VitalsField
              key={field.key}
              field={field}
              value={formData[field.key] as number | string | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Pediatric Section (conditional - shown when head circumference or length has value) */}
        {(formData.headCircumference || formData.length) && (
          <div className="mb-6 rounded-xl border border-dashed p-4">
            <h4 className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>
              Pediatric Measurements
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                  Head Circumference (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.headCircumference ?? ''}
                  onChange={(e) => onChange('headCircumference', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 35.5"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>
              <div>
                <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                  Length (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.length ?? ''}
                  onChange={(e) => onChange('length', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 50.0"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields Section */}
        <div className="mt-8 border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                Additional Measurements
              </h4>
              <p className={cn('text-xs', colors.text.tertiary)}>
                Add custom measurements not listed above
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
                  placeholder="Field name (e.g., Blood Glucose)"
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
                  <option value="number">Number</option>
                  <option value="textarea">Text Area</option>
                  <option value="date">Date</option>
                </select>

                <input
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  placeholder="Value"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    let val: string | number | null = e.target.value;
                    if (field.type === 'number') {
                      val = e.target.value ? parseFloat(e.target.value) : null;
                    }
                    handleUpdateCustomField(index, { value: val });
                  }}
                  className={cn(
                    'flex-1 min-w-[120px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />

                <input
                  type="text"
                  placeholder="Unit (optional)"
                  value={field.unit || ''}
                  onChange={(e) => handleUpdateCustomField(index, { unit: e.target.value })}
                  className={cn(
                    'w-24 rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />

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
              No additional measurements. Click "Add Field" to add custom vitals.
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
              ? 'Update Vital Signs'
              : 'Save Vital Signs'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default VitalsEditor;