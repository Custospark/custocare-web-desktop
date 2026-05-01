// lab-results/labresult-form-components/LabResultPreviewModal.tsx
import React, { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Download,
  Printer,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultPreviewModalProps } from './labResultForm.types';
import {
  buildLabResultFileName,
  flattenPreviewRows,
} from './labResultForm.utils';
import { LabResultPreviewHeader } from './LabResultPreviewHeader';
import { LabResultPreviewMetaInfo } from './LabResultPreviewMetaInfo';
import { LabResultPreviewTable } from './LabResultPreviewTable';
import { LabResultPreviewFooter } from './LabResultPreviewFooter';

export const LabResultPreviewModal: React.FC<LabResultPreviewModalProps> = ({
  open,
  onClose,
  request,
  resultsMap,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const previewRows = useMemo(
    () => flattenPreviewRows(request, resultsMap),
    [request, resultsMap]
  );

  // react-to-print hook for printing
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: buildLabResultFileName(request),
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onPrintError: (errorLocation, error) => {
      console.error('Print failed:', errorLocation, error);
    },
  });

  // Download as PDF using print-to-file approach
  const handleDownload = useReactToPrint({
    contentRef,
    documentTitle: buildLabResultFileName(request),
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    // Remove afterPrint callback to prevent modal closing on download
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        {/* Modal Header - NOT included in print */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 print:hidden">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Lab Result Report Preview
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Review, print, or download the formal laboratory report.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => handleDownload()}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-all hover:bg-gray-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
          {/* Print Container - This is what gets printed */}
          <div
            ref={contentRef}
            className={cn(
              'mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8',
              // Print-specific styles
              'print:max-w-none print:rounded-none print:border-0 print:shadow-none print:p-0 print:m-0'
            )}
          >
            <LabResultPreviewHeader request={request} />
            <LabResultPreviewMetaInfo request={request} rows={previewRows} />
            <LabResultPreviewTable rows={previewRows} />
            <LabResultPreviewFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultPreviewModal;