import { Eye, Pill } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from './prescriptionForm.types';

interface PrescriptionMedicationsHeaderProps {
  colors: ColorTokens;
  medicationCount: number;
  showPreview: boolean;
  onTogglePreview: () => void;
  onAddMedication: () => void;
}

export function PrescriptionMedicationsHeader({
  colors,
  medicationCount,
  showPreview,
  onTogglePreview,
  onAddMedication,
}: PrescriptionMedicationsHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-b p-4',
        colors.border.primary
      )}
    >
      <div>
        <h3 className={cn('text-base font-semibold', colors.text.primary)}>
          Prescription Medications
        </h3>
        <p className={cn('text-sm', colors.text.secondary)}>
          {medicationCount} medication{medicationCount === 1 ? '' : 's'} documented for this prescription
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePreview}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <Eye className="h-4 w-4" />
          {showPreview ? 'Hide Preview' : 'Preview / Print'}
        </button>

        <button
          type="button"
          onClick={onAddMedication}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Pill className="h-4 w-4" />
          Add Medication
        </button>
      </div>
    </div>
  );
}
