import type {
  Prescription,
} from '../../../../api/prescription/PrescriptionTypes';
import  {
  PrescriptionType,PrescriptionPriority
} from '../../../../api/prescription/PrescriptionTypes';
import {
  type CreatePrescriptionItemRequest,
  type PrescriptionItem,
  AdministrationInstructions,
  DosageForm,
  DosageUnit,
  DurationUnit,
  Frequency,
  Refills,
  Route,
  Substitution,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';

export interface PrescriptionFormData {
  prescription_type: PrescriptionType;
  priority: PrescriptionPriority;
  diagnosis: string;
  clinical_notes: string;
  special_instructions: string;
  patient_education_notes: string;
  follow_up_instructions: string;
  follow_up_date: string;
  valid_until: string;
}

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

export interface AllergyLike {
  id: number | string;
  allergen: string;
  severity: string;
}

export interface ColorTokens {
  bg: {
    card: string;
    input: string;
    subtle: string;
    hover: string;
    muted: string;
    modal: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
  };
  border: {
    primary: string;
    subtle: string;
    focus: string;
  };
}

export const EMPTY_PRESCRIPTION: PrescriptionFormData = {
  prescription_type: PrescriptionType.NEW,
  priority: PrescriptionPriority.ROUTINE,
  diagnosis: '',
  clinical_notes: '',
  special_instructions: '',
  patient_education_notes: '',
  follow_up_instructions: '',
  follow_up_date: '',
  valid_until: '',
};

export const EMPTY_MEDICATION: MedicationFormData = {
  medication_name: '',
  brand_name: '',
  strength: '',
  dosage_form: DosageForm.TABLET,
  dosage_quantity: 1,
  dosage_unit: DosageUnit.TABLETS,
  frequency: Frequency.ONCE_DAILY,
  duration_value: 7,
  duration_unit: DurationUnit.DAYS,
  route: Route.ORAL,
  instructions: '',
  as_needed: false,
  as_needed_reason: '',
  administration_instructions: AdministrationInstructions.NONE,
  refills: Refills.ZERO,
  substitution: Substitution.GENERIC_ALLOWED,
};

export const toPrescriptionFormData = (
  prescription?: Prescription | null
): PrescriptionFormData => {
  if (!prescription) return EMPTY_PRESCRIPTION;

  return {
    prescription_type: prescription.prescription_type,
    priority: prescription.priority,
    diagnosis: prescription.diagnosis || '',
    clinical_notes: prescription.clinical_notes || '',
    special_instructions: prescription.special_instructions || '',
    patient_education_notes: prescription.patient_education_notes || '',
    follow_up_instructions: prescription.follow_up_instructions || '',
    follow_up_date: prescription.follow_up_date?.split('T')[0] || '',
    valid_until: prescription.valid_until?.split('T')[0] || '',
  };
};

export const toMedicationFormData = (
  item: PrescriptionItem
): MedicationFormData => ({
  medication_name: item.medication_name,
  brand_name: item.brand_name || '',
  strength: item.strength || '',
  dosage_form: item.dosage_form,
  dosage_quantity: item.dosage_quantity,
  dosage_unit: item.dosage_unit,
  frequency: item.frequency,
  duration_value: item.duration_value,
  duration_unit: item.duration_unit,
  route: item.route,
  instructions: item.instructions || '',
  as_needed: item.as_needed,
  as_needed_reason: item.as_needed_reason || '',
  administration_instructions: item.administration_instructions,
  refills: item.refills,
  substitution: item.substitution,
});

export const toPrescriptionItemRequest = (
  form: MedicationFormData
): CreatePrescriptionItemRequest => ({
  medication_name: form.medication_name.trim(),
  brand_name: form.brand_name.trim() || null,
  strength: form.strength.trim() || null,
  dosage_form: form.dosage_form,
  dosage_quantity: form.dosage_quantity,
  dosage_unit: form.dosage_unit,
  frequency: form.frequency,
  duration_value: form.duration_value,
  duration_unit: form.duration_unit,
  route: form.route,
  instructions: form.instructions.trim() || null,
  as_needed: form.as_needed,
  as_needed_reason: form.as_needed ? form.as_needed_reason.trim() || null : null,
  administration_instructions: form.administration_instructions,
  refills: form.refills,
  substitution: form.substitution,
});

export const buildLocalPrescriptionItem = (
  itemData: CreatePrescriptionItemRequest,
  localId: number
): PrescriptionItem => ({
  id: localId,
  prescription_id: 0,
  medication_name: itemData.medication_name,
  brand_name: itemData.brand_name || null,
  strength: itemData.strength || null,
  full_name: `${itemData.medication_name}${itemData.strength ? ` ${itemData.strength}` : ''}${itemData.brand_name ? ` (${itemData.brand_name})` : ''}`,
  dosage_form: itemData.dosage_form,
  dosage_quantity: itemData.dosage_quantity,
  dosage_unit: itemData.dosage_unit,
  dosage_text: `${itemData.dosage_quantity} ${itemData.dosage_unit}`,
  frequency: itemData.frequency,
  duration_value: itemData.duration_value,
  duration_unit: itemData.duration_unit,
  duration_text: `${itemData.duration_value} ${itemData.duration_unit}`,
  total_quantity: 0,
  route: itemData.route,
  instructions: itemData.instructions || null,
  patient_instructions: '',
  as_needed: itemData.as_needed || false,
  as_needed_reason: itemData.as_needed_reason || null,
  administration_instructions: itemData.administration_instructions,
  refills: itemData.refills,
  refill_instructions: null,
  refill_instructions_text: '',
  medication_type: null,
  monitoring_required: null,
  common_side_effects: null,
  clinical_reasoning: null,
  substitution: itemData.substitution,
  substitution_instructions: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
});
