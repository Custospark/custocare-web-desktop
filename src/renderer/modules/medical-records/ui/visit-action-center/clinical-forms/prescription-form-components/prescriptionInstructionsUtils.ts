// prescriptionInstructionsUtils.ts
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import {
  formatDosage,
  formatDuration,
  generatePatientInstructions,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';

export interface PreviewMedicationItem extends PrescriptionItem {
  patientInstruction: string;
  organizedInstructions: string;
}

// Helper function to capitalize first letter of each part
function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateOrganizedInstructions(med: PrescriptionItem): string {
  const parts: string[] = [];

  if (med.dosage_quantity && med.dosage_unit) {
    parts.push(`Take ${formatDosage(med.dosage_quantity, med.dosage_unit)}`);
  }

  if (med.dosage_form) {
    parts.push(capitalizeFirstLetter(med.dosage_form));
  }

  if (med.route) {
    parts.push(`Via ${med.route.toLowerCase()}`);
  }

  if (med.frequency) {
    parts.push(capitalizeFirstLetter(med.frequency));
  }

  if (med.as_needed) {
    const asNeededText = `As needed${med.as_needed_reason ? ` for ${med.as_needed_reason}` : ''}`;
    parts.push(capitalizeFirstLetter(asNeededText));
  }

  if (med.duration_value && med.duration_unit) {
    parts.push(`For ${formatDuration(med.duration_value, med.duration_unit)}`);
  }

  if (med.instructions) {
    parts.push(capitalizeFirstLetter(med.instructions));
  }

  // Join with newlines instead of dots
  return parts.join('\n');
}

export function buildPreviewItems(
  medications: PrescriptionItem[]
): PreviewMedicationItem[] {
  return medications.map((med) => ({
    ...med,
    patientInstruction:
      med.patient_instructions?.trim() || generatePatientInstructions(med),
    organizedInstructions: generateOrganizedInstructions(med),
  }));
}