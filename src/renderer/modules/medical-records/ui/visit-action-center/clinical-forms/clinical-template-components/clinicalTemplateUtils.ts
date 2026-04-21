import { DosageForm,DosageUnit,AdministrationInstructions, Frequency,DurationUnit,Route,Refills,Substitution} from "../../../../api/prescription-items/PrescriptionItemsTypes";
import type { MedicationFormData } from "./ClinicalTemplateMedicationModal";
export const defaultMedicationFormData: MedicationFormData = {
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