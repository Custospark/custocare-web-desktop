import { useRef,useState } from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../../api/prescription-items/PrescriptionItemsTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';
import { PrescriptionMedicationsHeader } from './PrescriptionMedicationsHeader';
import { PrescriptionMedicationsDataTable } from './PrescriptionMedicationsDataTable';
import { PrescriptionPreviewModal } from './PrescriptionPreviewModal';
import { useReactToPrint } from 'react-to-print';
import { 
  buildPreviewItems, 
} from './prescriptionInstructionsUtils';
import PrescriptionPreviewDocument from './PrescriptionPreviewDocument';

export interface PrescriptionMedicationsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  medications: PrescriptionItem[];
  onAddMedication: () => void;
  onEditMedication: (item: PrescriptionItem) => void;
  onDeleteMedication: (item: PrescriptionItem) => void;
  /** When false, row edit/remove and duplicate add are disabled in UI (parent still guards mutations). */
  allowMedicationMutations?: boolean;
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
  allowMedicationMutations = true,
}: PrescriptionMedicationsTableProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewAction, setPreviewAction] = useState<'preview' | 'print' | 'download'>('preview');
  const previewItems = buildPreviewItems(medications);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${prescription?.patient?.name || 'patient'}_prescription_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white;
        }
      }
    `,
  });

  const handleDownload = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${prescription?.patient?.name || 'patient'}_prescription_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background: white;
        }
      }
    `,
  });

  const handleOpenPreview = () => {
    setPreviewAction('preview');
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
          onTogglePreview={handleOpenPreview}
          onAddMedication={onAddMedication}
          allowMedicationMutations={allowMedicationMutations}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />

        <div className="space-y-4 p-4">
          <PrescriptionMedicationsDataTable
            isDark={isDark}
            colors={colors}
            medications={medications}
            onEditMedication={onEditMedication}
            onDeleteMedication={onDeleteMedication}
            allowMedicationMutations={allowMedicationMutations}
          />
        </div>
      </section>

      {/* Hidden print content */}
      <div className="hidden">
        <div ref={printRef}>
          <PrescriptionPreviewDocument
            prescription={prescription}
            formData={formData}
            previewItems={previewItems}
          />
        </div>
      </div>

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