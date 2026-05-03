import { useState } from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';
import { PrescriptionMedicationsHeader } from './PrescriptionMedicationsHeader';
import { PrescriptionMedicationsDataTable } from './PrescriptionMedicationsDataTable';
import { PrescriptionPreviewModal } from './PrescriptionPreviewModal';
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
  const [previewAction, setPreviewAction] = useState<'preview' | 'print' | 'download'>('preview');
  const previewItems = buildPreviewItems(medications);

  const handleOpenPreview = (action: 'preview' | 'print' | 'download' = 'preview') => {
    setPreviewAction(action);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewAction('preview');
  };

  return (
    <>
      <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
        <PrescriptionMedicationsHeader
          colors={colors}
          medicationCount={medications.length}
          showPreview={showPreview}
          onTogglePreview={() => handleOpenPreview('preview')}
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
        </div>
      </section>

      {/* Professional Preview Modal */}
      <PrescriptionPreviewModal
        open={showPreview}
        onClose={handleClosePreview}
        prescription={prescription}
        formData={formData}
        previewItems={previewItems}
        initialAction={previewAction}
      />
    </>
  );
}