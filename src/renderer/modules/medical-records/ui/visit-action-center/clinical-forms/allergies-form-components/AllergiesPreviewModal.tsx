import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { AllergiesPreviewDocument } from './AllergiesPreviewDocument';
import { buildAllergyFileName } from './allergiesForm.utils';
import type { Allergy } from '../../../../api/allergies/AllergyTypes';
import type { AllergiesPreviewAction } from './allergiesForm.types';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
interface AllergiesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  allergies: Allergy[];
  patientName: string;
  patientNumber: string;
  initialAction?: AllergiesPreviewAction;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
}

export const AllergiesPreviewModal: React.FC<AllergiesPreviewModalProps> = ({
  open,
  onClose,
  allergies,
  patientName,
  patientNumber,
  initialAction = 'preview',
  isLoading = false,
  theme = 'light',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate proper filename: patientName_allergies_YYYY-MM-DD
  const documentTitle = useMemo(() => {
    return buildAllergyFileName(patientName);
  }, [patientName]);

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
    if (!open || isLoading) return;

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
  }, [handleDownload, handlePrint, initialAction, open, isLoading]);

  if (!open) return null;

  // Loading State
  if (isLoading) {
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
              <h3 className="text-base font-semibold text-slate-900">Allergy Report Preview</h3>
              <p className="mt-1 text-sm text-slate-600">
                Loading allergy data...
              </p>
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
            <LoadingSkeleton 
              variant="default" 
              message="Loading allergy data..."
              theme={theme}
            />
          </div>
        </div>
      </div>
    );
  }

  // Empty State (no allergies)
  if (allergies.length === 0) {
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
              <h3 className="text-base font-semibold text-slate-900">Allergy Report Preview</h3>
              <p className="mt-1 text-sm text-slate-600">
                No allergy records found
              </p>
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
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No Allergies Recorded</h3>
              <p className="text-sm text-slate-600">
                No allergy records found for {patientName}.
              </p>
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
            <h3 className="text-base font-semibold text-slate-900">Allergy Report Preview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review the allergy report before printing or saving as PDF.
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
            <AllergiesPreviewDocument
              allergies={allergies}
              patientName={patientName}
              patientNumber={patientNumber}
            />
          </div>
        </div>

        {/* Footer removed - no clinical value */}
      </div>
    </div>
  );
};

export default AllergiesPreviewModal;