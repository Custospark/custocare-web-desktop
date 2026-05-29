import React, { useCallback, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { DISCHARGE_DISPOSITION_OPTIONS } from './dischargeForm.types';
import type {
  DischargeFormValues,
  DischargeMode,
  ColorTokens,
  DischargeMedicationFormItem,
} from './dischargeForm.types';
import { MedicationEditorModal } from '../../clinical-forms/prescription-form-components/MedicationEditorModal';
import type { MedicationFormData } from '../../clinical-forms/prescription-form-components/prescriptionForm.types';
import { EMPTY_MEDICATION } from '../../clinical-forms/prescription-form-components/prescriptionForm.types';

const generateTempId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

interface DischargeEditorProps {
  theme?: 'light' | 'dark';
  colors: ColorTokens;
  mode: DischargeMode;
  formData: DischargeFormValues;
  fieldErrors: Record<string, string>;
  formError: string | null;
  isSubmitting: boolean;
  onFieldChange: (field: keyof DischargeFormValues, value: unknown) => void;
  onAddMedication: (medication: DischargeMedicationFormItem) => void;
  onRemoveMedication: (tempId: string) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const InputField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  colors: ColorTokens;
}> = ({ label, error, required, children, colors }) => (
  <div>
    <label className={cn('mb-1 block text-sm font-medium', colors.text.secondary)}>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const toDischargeMedication = (form: MedicationFormData): DischargeMedicationFormItem => ({
  tempId: generateTempId(),
  name: form.medication_name,
  dosage: form.dosage_quantity ? `${form.dosage_quantity} ${form.dosage_unit}` : '',
  frequency: form.frequency,
  route: form.route,
  durationDays: form.duration_value || null,
});

export const DischargeEditor: React.FC<DischargeEditorProps> = ({
  theme = 'light',
  colors,
  mode,
  formData,
  fieldErrors,
  formError,
  isSubmitting,
  onFieldChange,
  onAddMedication,
  onRemoveMedication,
  onCancel,
  onSubmit,
}) => {
  const isDark = theme === 'dark';
  const isEditing = mode === 'edit';

  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [medicationForm, setMedicationForm] = useState<MedicationFormData>(EMPTY_MEDICATION);
  const [isMutating, setIsMutating] = useState(false);
  const medicationNameRef = useRef<HTMLInputElement | null>(null);

  const inputClass = cn(
    'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all',
    colors.bg.input, colors.text.primary, colors.border.primary,
    'focus:ring-2', colors.border.focus
  );

  const selectClass = cn(
    'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-all',
    colors.bg.input, colors.text.primary, colors.border.primary,
    'focus:ring-2', colors.border.focus
  );

  const openAddMedication = useCallback(() => {
    setMedicationForm(EMPTY_MEDICATION);
    setShowMedicationModal(true);
  }, []);

  const handleMedFormChange = useCallback(
    (field: keyof MedicationFormData, value: string | number | boolean) => {
      setMedicationForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleMedSubmit = useCallback(() => {
    if (!medicationForm.medication_name.trim()) return;
    setIsMutating(true);
    const dischargeMed = toDischargeMedication(medicationForm);
    onAddMedication(dischargeMed);
    setShowMedicationModal(false);
    setMedicationForm(EMPTY_MEDICATION);
    setIsMutating(false);
  }, [medicationForm, onAddMedication]);

  return (
    <section
      className={cn('rounded-2xl border mb-6', colors.border.primary, colors.bg.card)}
    >
      <div className={cn('border-b p-5', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-xl p-2.5', colors.bg.brandSoft)}>
              <SquarePen className={cn('h-5 w-5', colors.text.brand)} />
            </div>
            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                {isEditing ? 'Edit Discharge Summary' : 'New Discharge Summary'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                {isEditing
                  ? 'Update the discharge information for this patient.'
                  : 'Complete the discharge process by filling out the details below.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary, colors.text.secondary, colors.bg.hover
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputField colors={colors} label="Discharge Date" required error={fieldErrors.dischargedAt}>
            <input
              type="datetime-local"
              value={formData.dischargedAt}
              onChange={(e) => onFieldChange('dischargedAt', e.target.value)}
              className={inputClass}
            />
          </InputField>

          <InputField colors={colors} label="Disposition" error={fieldErrors.dischargeDisposition}>
            <select
              value={formData.dischargeDisposition}
              onChange={(e) => onFieldChange('dischargeDisposition', e.target.value)}
              className={selectClass}
            >
              <option value="">Select disposition...</option>
              {DISCHARGE_DISPOSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </InputField>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <InputField colors={colors} label="Discharge Diagnosis" error={fieldErrors.dischargeDiagnosis}>
            <textarea
              value={formData.dischargeDiagnosis}
              onChange={(e) => onFieldChange('dischargeDiagnosis', e.target.value)}
              placeholder="Enter discharge diagnosis..."
              rows={4}
              className={inputClass}
            />
          </InputField>

          <InputField colors={colors} label="Discharge Instructions" required error={fieldErrors.dischargeInstructions}>
            <textarea
              value={formData.dischargeInstructions}
              onChange={(e) => onFieldChange('dischargeInstructions', e.target.value)}
              placeholder="Enter discharge instructions for the patient..."
              rows={6}
              className={inputClass}
            />
          </InputField>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className={cn('text-sm font-semibold', colors.text.primary)}>Discharge Medications</h4>
              <p className={cn('text-xs', colors.text.tertiary)}>
                Add medications the patient should take after discharge
              </p>
            </div>
            <button
              type="button"
              onClick={openAddMedication}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                colors.text.brand, colors.bg.hover
              )}
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </button>
          </div>

          {formData.dischargeMedications.length > 0 ? (
            <div className="space-y-2">
              {formData.dischargeMedications.map((med) => (
                <div
                  key={med.tempId}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-4 py-3',
                    colors.border.primary, colors.bg.subtle
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', colors.text.primary)}>{med.name}</p>
                    <p className={cn('text-xs', colors.text.tertiary)}>
                      {[med.dosage, med.frequency, med.route, med.durationDays ? `${med.durationDays} days` : '']
                        .filter(Boolean)
                        .join(' — ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveMedication(med.tempId)}
                    className={cn('cursor-pointer rounded-lg p-1.5 transition-all shrink-0', colors.state.danger, colors.state.dangerSoft)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={cn('py-4 text-center text-sm', colors.text.tertiary)}>
              No medications added. Click &quot;Add Medication&quot; above to prescribe discharge medications.
            </p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputField colors={colors} label="Follow-up Date" error={fieldErrors.followupScheduledAt}>
            <input
              type="datetime-local"
              value={formData.followupScheduledAt}
              onChange={(e) => onFieldChange('followupScheduledAt', e.target.value)}
              className={inputClass}
            />
          </InputField>

          <InputField colors={colors} label="Follow-up Provider" error={fieldErrors.followupProviderStaffId}>
            <select
              value={formData.followupProviderStaffId ?? ''}
              onChange={(e) => onFieldChange('followupProviderStaffId', e.target.value ? parseInt(e.target.value, 10) : null)}
              className={selectClass}
            >
              <option value="">Select provider (if available)...</option>
            </select>
            <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
              Note: Provider list will be loaded from available staff.
            </p>
          </InputField>
        </div>

        <div className={cn('mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5', colors.border.primary)}>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              colors.text.secondary, colors.bg.hover
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
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Update Discharge'
              : 'Complete Discharge'}
          </button>
        </div>
      </form>

      <MedicationEditorModal
        open={showMedicationModal}
        isDark={isDark}
        colors={colors}
        editingMedication={null}
        medicationForm={medicationForm}
        allergyAlertVisible={null}
        isMutating={isMutating}
        onClose={() => setShowMedicationModal(false)}
        onChange={handleMedFormChange}
        onSubmit={handleMedSubmit}
        onAddNewMedication={() => {}}
        medicationNameRef={medicationNameRef}
      />
    </section>
  );
};

export default DischargeEditor;
