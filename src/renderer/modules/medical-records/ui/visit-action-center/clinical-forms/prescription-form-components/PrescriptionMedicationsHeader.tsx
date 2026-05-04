import { Eye, Printer, Download, Plus } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from './prescriptionForm.types';

interface PrescriptionMedicationsHeaderProps {
  colors: ColorTokens;
  medicationCount: number;
  showPreview: boolean;
  onTogglePreview: () => void;
  onAddMedication: () => void;
  allowMedicationMutations?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function PrescriptionMedicationsHeader({
  colors,
  medicationCount,
  onTogglePreview,
  onAddMedication,
  allowMedicationMutations = true,
  onPrint,
  onDownload,
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
        {/* Preview Button - matches other modules */}
        <button
          type="button"
          onClick={onTogglePreview}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
            colors.border.primary,
            colors.text.primary,
            colors.bg.hover
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        {/* Print Button - matches other modules */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        )}

        {/* Download PDF Button - matches other modules */}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
              'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              'dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50'
            )}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        )}

        {allowMedicationMutations && (
          <button
            type="button"
            onClick={onAddMedication}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
              'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
              'dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Medication
          </button>
        )}
      </div>
    </div>
  );
}