import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import LabResultPreviewHeader from '../labresult-form-components/LabResultPreviewHeader';
import LabResultPreviewMetaInfo from '../labresult-form-components/LabResultPreviewMetaInfo';
import LabResultPreviewTable from '../labresult-form-components/LabResultPreviewTable';
import LabResultPreviewFooter from '../labresult-form-components/LabResultPreviewFooter';
import { flattenPreviewRows, buildLabResultFileName } from'../labresult-form-components/labResultForm.utils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import { type LabResultHydratedMap } from '../labresult-form-components/labResultForm.types';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

interface LabRequestResultsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  request: LabRequest | null;
  resultsMap: LabResultHydratedMap;
  patientName?: string;
  initialAction?: 'preview' | 'print' | 'download';
  isLoading?: boolean;
}

export const LabRequestResultsPreviewModal: React.FC<LabRequestResultsPreviewModalProps> = ({
  open,
  onClose,
  request,
  resultsMap,
  patientName = 'this patient',
  initialAction = 'preview',
  isLoading = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Generate proper filename using existing lab result utility
  const documentTitle = useMemo(() => {
    if (!request) return 'lab-results';
    return buildLabResultFileName(request);
  }, [request]);

  const previewRows = useMemo(() => {
    if (!request) return [];
    return flattenPreviewRows(request, resultsMap);
  }, [request, resultsMap]);

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
              <h3 className="text-base font-semibold text-slate-900">Laboratory Results Preview</h3>
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
            <LoadingSkeleton variant="default" message="Loading laboratory results report..." />
          </div>
        </div>
      </div>
    );
  }
  const hasRequest = !!request;
  const hasResults = hasRequest && previewRows.length > 0;

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
            <h3 className="text-base font-semibold text-slate-900">Laboratory Results Preview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review the laboratory results before printing or saving as PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint?.()}
              disabled={!hasRequest}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => handleDownload?.()}
              disabled={!hasRequest}
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
          <div ref={contentRef} className="mx-auto max-w-5xl">
            {!hasRequest ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-slate-500">No laboratory report found for {patientName} yet.</p>
              </div>
            ) : !hasResults ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-slate-500">No results have been recorded for this lab request yet.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0">
                <LabResultPreviewHeader request={request} />
                <LabResultPreviewMetaInfo request={request} rows={previewRows} />
                <LabResultPreviewTable rows={previewRows} />
                <LabResultPreviewFooter />
              </div>
            )}
          </div>
        </div>

        {/* Footer removed - no clinical value */}
      </div>
    </div>
  );
};

export default LabRequestResultsPreviewModal;