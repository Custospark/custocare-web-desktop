import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrescriptionPreviewDocument } from './PrescriptionPreviewDocument';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionFormData } from './prescriptionForm.types';
import type { PreviewMedicationItem } from './prescriptionInstructionsUtils';

interface PrescriptionPreviewModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  previewItems: PreviewMedicationItem[];
  patientName?: string;
  initialAction?: 'preview' | 'print' | 'download';
  isLoading?: boolean;
}

export const PrescriptionPreviewModal: React.FC<PrescriptionPreviewModalProps> = ({
  open,
  onClose,
  prescription,
  formData,
  previewItems,
  patientName = 'this patient',
  initialAction = 'preview',
  isLoading = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate proper filename: patient_name_prescription_YYYY-MM-DD
  const documentTitle = useMemo(() => {
    // Get patient name from prescription
    const patientName = prescription?.patient?.name || 'patient';
    
    // Sanitize patient name: lowercase, replace spaces with hyphens, remove special chars
    const safePatientName = patientName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    
    // Get today's date in YYYY-MM-DD format
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Build filename: patientName_prescription_2026-05-03
    const fileName = `${safePatientName}_prescription_${todayDate}`;
    
    return fileName || 'prescription';
  }, [prescription]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
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
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  const handleDownload = useReactToPrint({
    contentRef,
    documentTitle,
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

  useEffect(() => {
    if (!open) return;

    if (initialAction === 'print') {
      const timer = window.setTimeout(() => {
        handlePrint?.();
      }, 150);
      return () => window.clearTimeout(timer);
    }

    if (initialAction === 'download') {
      const timer = window.setTimeout(() => {
        handleDownload?.();
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [handleDownload, handlePrint, initialAction, open]);

  if (!open) return null;
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
        <div className="no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:hidden">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Prescription Preview</h3>
              <p className="mt-1 text-sm text-slate-600">Loading report data...</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
            <LoadingSkeleton variant="default" message="Loading prescription report..." />
          </div>
        </div>
      </div>
    );
  }
  if (!prescription) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:hidden">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Prescription Preview</h3>
              <p className="mt-1 text-sm text-slate-600">No prescription report found</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Eye className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No Prescription Found</h3>
              <p className="text-sm text-slate-600">No prescription report found for {patientName} yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:hidden">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Prescription Preview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review the prescription before printing or saving as PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint?.()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => handleDownload?.()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div ref={contentRef}>
            <PrescriptionPreviewDocument
              prescription={prescription}
              formData={formData}
              previewItems={previewItems}
            />
          </div>
        </div>

        {/* Footer removed - no clinical value */}
      </div>
    </div>
  );
};

export default PrescriptionPreviewModal;