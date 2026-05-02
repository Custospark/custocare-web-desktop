import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ClinicalNotesPreviewDocument } from './ClinicalNotesPreviewDocument';
import type {
  ClinicalNoteListItem,
  ClinicalNotesFormValues,
  ClinicalNotesPreviewAction,
} from './clinicalNotesForm.types';

interface ClinicalNotesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  note: ClinicalNoteListItem | null;
  values: ClinicalNotesFormValues;
  noteTitle: string;
  initialAction?: ClinicalNotesPreviewAction;
}

export const ClinicalNotesPreviewModal: React.FC<ClinicalNotesPreviewModalProps> = ({
  open,
  onClose,
  note,
  values,
  noteTitle,
  initialAction = 'preview',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const documentTitle = useMemo(() => {
    const safeTitle = (noteTitle || 'clinical-note')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();

    return safeTitle || 'clinical-note';
  }, [noteTitle]);

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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:hidden">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Clinical Note Preview</h3>
            <p className="mt-1 text-sm text-slate-600">
              Print or save the exact preview below using the browser print dialog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint?.()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => handleDownload?.()}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition-all hover:bg-slate-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
          <div ref={contentRef}>
            <ClinicalNotesPreviewDocument
              note={note}
              values={values}
              noteTitle={noteTitle}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 print:hidden">
          Printing and downloading use the exact same preview container above so the exported output
          matches what the clinician reviewed on screen.
        </div>
      </div>
    </div>
  );
};

export default ClinicalNotesPreviewModal;
