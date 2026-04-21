import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  AdministrationInstructions,
  DosageForm,
  DosageUnit,
  DurationUnit,
  Frequency,
  Refills,
  Route,
  Substitution,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { BillableItem } from '../../../../api/billable-items/BillingItemsTypes';
import { ColorTokens } from '../prescription-form-components/prescriptionForm.types';
import MedicationAutocomplete from '../prescription-form-components/MedicationAutocomplete';

export interface MedicationFormData {
  medication_name: string;
  brand_name: string;
  strength: string;
  dosage_form: DosageForm;
  dosage_quantity: number;
  dosage_unit: DosageUnit;
  frequency: Frequency;
  duration_value: number;
  duration_unit: DurationUnit;
  route: Route;
  instructions: string;
  as_needed: boolean;
  as_needed_reason: string;
  administration_instructions: AdministrationInstructions;
  refills: Refills;
  substitution: Substitution;
}

const RequiredLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <label className={className}>
    {children} <span className="text-red-500">*</span>
  </label>
);

interface ClinicalTemplateMedicationModalProps {
  isOpen: boolean;
  isDark: boolean;
  colors: ColorTokens;
  medicationForm: MedicationFormData;
  editingMedicationIndex: number | null;
  isMutating: boolean;
  onClose: () => void;
  onChange: (
    field: keyof MedicationFormData,
    value:
      | string
      | number
      | boolean
      | DosageForm
      | DosageUnit
      | Frequency
      | DurationUnit
      | Route
      | AdministrationInstructions
      | Refills
      | Substitution
  ) => void;
  onSubmit: () => void;
  onMedicationSelect?: (medication: BillableItem) => void;
}

export const ClinicalTemplateMedicationModal: React.FC<
  ClinicalTemplateMedicationModalProps
> = ({
  isOpen,
  isDark,
  colors,
  medicationForm,
  editingMedicationIndex,
  isMutating,
  onClose,
  onChange,
  onSubmit,
  onMedicationSelect,
}) => {
  const isInvalid =
    !medicationForm.medication_name.trim() ||
    medicationForm.dosage_quantity <= 0 ||
    medicationForm.duration_value <= 0 ||
    (medicationForm.as_needed && !medicationForm.as_needed_reason.trim());

  // Consistent focus ring style matching MedicationAutocomplete
  const focusRingClass = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  // Handle medication selection from autocomplete
  const handleMedicationSelect = (medication: BillableItem) => {
    // Auto-fill strength if available from inventory item
    if (isDark) {
      // Type guard for inventory items
      if ('strength' in medication && medication.strength) {
        onChange('strength', medication.strength);
      }
    } else {
      if ('strength' in medication && medication.strength) {
        onChange('strength', medication.strength);
      }
    }

    // Auto-fill dosage form if available
    if ('dosage_form' in medication && medication.dosage_form) {
      // Map the dosage form to the enum value
      const matchedForm = Object.values(DosageForm).find(
        form => form.toLowerCase() === medication.dosage_form?.toLowerCase()
      );
      if (matchedForm) {
        onChange('dosage_form', matchedForm);
      }
    }

    // Call the optional callback
    if (onMedicationSelect) {
      onMedicationSelect(medication);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn(
              'w-full max-w-3xl rounded-2xl border shadow-xl',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                {editingMedicationIndex !== null ? 'Edit Medication' : 'Add Medication'}
              </h3>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'cursor-pointer rounded p-1 transition-colors',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Medication Name
                    </RequiredLabel>
                    <MedicationAutocomplete
                      value={medicationForm.medication_name}
                      onChange={(value) => onChange('medication_name', value)}
                      onSelect={handleMedicationSelect}
                      placeholder="Search for medication..."
                      required
                      isDark={isDark}
                      colors={colors}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={medicationForm.brand_name}
                      onChange={(e) => onChange('brand_name', e.target.value)}
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                      placeholder="e.g., Amoxil"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Strength
                    </label>
                    <input
                      type="text"
                      value={medicationForm.strength}
                      onChange={(e) => onChange('strength', e.target.value)}
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Dosage Form
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.dosage_form}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (Object.values(DosageForm).includes(value as DosageForm)) {
                          onChange('dosage_form', value as DosageForm);
                        }
                      }}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(DosageForm).map((form) => (
                        <option key={form} value={form}>
                          {form}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Dosage Quantity
                    </RequiredLabel>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      required
                      value={medicationForm.dosage_quantity}
                      onChange={(e) => onChange('dosage_quantity', parseFloat(e.target.value))}
                      className={cn(
                        'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    />
                  </div>

                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Dosage Unit
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.dosage_unit}
                      onChange={(e) => onChange('dosage_unit', e.target.value as DosageUnit)}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(DosageUnit).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Route
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.route}
                      onChange={(e) => onChange('route', e.target.value as Route)}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(Route).map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Frequency
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.frequency}
                      onChange={(e) => onChange('frequency', e.target.value as Frequency)}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(Frequency).map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Duration
                      </RequiredLabel>
                      <input
                        type="number"
                        min="1"
                        required
                        value={medicationForm.duration_value}
                        onChange={(e) => onChange('duration_value', parseInt(e.target.value, 10))}
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          focusRingClass
                        )}
                      />
                    </div>

                    <div>
                      <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        Unit
                      </RequiredLabel>
                      <select
                        required
                        value={medicationForm.duration_unit}
                        onChange={(e) => onChange('duration_unit', e.target.value as DurationUnit)}
                        className={cn(
                          'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          focusRingClass
                        )}
                      >
                        {Object.values(DurationUnit).map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                    Special Instructions
                  </label>
                  <textarea
                    value={medicationForm.instructions}
                    onChange={(e) => onChange('instructions', e.target.value)}
                    rows={2}
                    className={cn(
                      'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      focusRingClass
                    )}
                    placeholder="e.g., Take with food"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={medicationForm.as_needed}
                      onChange={(e) => onChange('as_needed', e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span className={cn('text-sm', colors.text.primary)}>As Needed (PRN)</span>
                  </label>

                  {medicationForm.as_needed && (
                    <div>
                      <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                        PRN Reason
                      </RequiredLabel>
                      <input
                        type="text"
                        required
                        value={medicationForm.as_needed_reason}
                        onChange={(e) => onChange('as_needed_reason', e.target.value)}
                        placeholder="Reason, e.g. pain, fever"
                        className={cn(
                          'w-full rounded-lg border p-2.5 text-sm transition-all duration-200',
                          colors.bg.input,
                          colors.text.primary,
                          colors.border.primary,
                          focusRingClass
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Administration Instructions
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.administration_instructions}
                      onChange={(e) =>
                        onChange(
                          'administration_instructions',
                          e.target.value as AdministrationInstructions
                        )
                      }
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(AdministrationInstructions).map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Refills
                    </RequiredLabel>
                    <select
                      required
                      value={medicationForm.refills}
                      onChange={(e) => onChange('refills', e.target.value as Refills)}
                      className={cn(
                        'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        focusRingClass
                      )}
                    >
                      {Object.values(Refills).map((ref) => (
                        <option key={ref} value={ref}>
                          {ref}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <RequiredLabel className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                    Substitution Policy
                  </RequiredLabel>
                  <select
                    required
                    value={medicationForm.substitution}
                    onChange={(e) => onChange('substitution', e.target.value as Substitution)}
                    className={cn(
                      'w-full cursor-pointer rounded-lg border p-2.5 text-sm transition-all duration-200',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      focusRingClass
                    )}
                  >
                    {Object.values(Substitution).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isMutating || isInvalid}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isMutating || isInvalid
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                )}
              >
                {editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClinicalTemplateMedicationModal;