// PrescriptionMedicationsTable.tsx
import { useState } from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';
import { PrescriptionMedicationsHeader } from './PrescriptionMedicationsHeader';
import { PrescriptionMedicationsDataTable } from './PrescriptionMedicationsDataTable';
import { PrescriptionMedicationsPreview } from './PrescriptionMedicationsPreview';
// Import the functions and type from the utility file
import { 
  buildPreviewItems, 
} from './prescriptionInstructionsUtils';

export interface PrescriptionMedicationsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  medications: PrescriptionItem[];
  onAddMedication: () => void;
  onEditMedication: (item: PrescriptionItem) => void;
  onDeleteMedication: (item: PrescriptionItem) => void;
}

export default function PrescriptionMedicationsTable({
  isDark,
  colors,
  prescription,
  formData,
  medications,
  onAddMedication,
  onEditMedication,
  onDeleteMedication,
}: PrescriptionMedicationsTableProps) {
  const [showPreview, setShowPreview] = useState(false);
  const previewItems = buildPreviewItems(medications);

  return (
    <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <PrescriptionMedicationsHeader
        colors={colors}
        medicationCount={medications.length}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((prev) => !prev)}
        onAddMedication={onAddMedication}
      />

      <div className="space-y-4 p-4">
        <PrescriptionMedicationsDataTable
          isDark={isDark}
          colors={colors}
          medications={medications}
          onEditMedication={onEditMedication}
          onDeleteMedication={onDeleteMedication}
        />

        {showPreview && (
          <PrescriptionMedicationsPreview
            isDark={isDark}
            colors={colors}
            prescription={prescription}
            formData={formData}
            previewItems={previewItems}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </section>
  );
}
