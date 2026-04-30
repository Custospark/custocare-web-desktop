// lab-results/labresult-form-components/LabResultPreviewModal.tsx
import React, { useMemo } from 'react';
import {
  Download,
  Printer,
  X,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultPreviewModalProps } from './labResultForm.types';
import {
  buildLabResultFileName,
  buildLabResultReportHtml,
  downloadHtmlDocument,
  flattenPreviewRows,
  triggerPrintWindow,
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
  const previewRows = useMemo(
    () => flattenPreviewRows(request, resultsMap),
    [request, resultsMap]
  );

  const html = useMemo(
    () =>
      buildLabResultReportHtml(request, resultsMap, {
        name: request.facility?.facility_name || 'Medical Facility',
        address: request.facility?.facility_name || 'Address not available',
        phone: null,
        email: null,
        code: request.facility?.facility_uuid || null,
      }),
    [request, resultsMap]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
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
              onClick={() => triggerPrintWindow(html)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => downloadHtmlDocument(buildLabResultFileName(request), html)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Download
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

        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <div className={cn('mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8')}>
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
