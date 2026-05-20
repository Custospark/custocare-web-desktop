import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { DiagnosesPreviewDocument } from './DiagnosesPreviewDocument';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import type {
  DiagnosisResponse,
  DiagnosesFormValues,
  DiagnosesPreviewAction,
} from './diagnosesForm.types';

interface DiagnosesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  diagnosis: DiagnosisResponse | null;
  values: DiagnosesFormValues;
  patientName?: string;
  initialAction?: DiagnosesPreviewAction;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
}

export const DiagnosesPreviewModal: React.FC<DiagnosesPreviewModalProps> = ({
  open,
  onClose,
  diagnosis,
  values,
  patientName = 'this patient',
  initialAction = 'preview',
  isLoading = false,
  theme = 'light',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const documentTitle = useMemo(() => {
    const patientName = diagnosis?.patient?.full_name || 'patient';
    const safePatientName = patientName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const diagnosisCode = diagnosis?.diagnosis_code?.toLowerCase() || 'diagnosis';
    const safeDiagnosisCode = diagnosisCode.replace(/[^\w-]/g, '');
    const todayDate = new Date().toISOString().split('T')[0];
    const fileName = `${safePatientName}_${safeDiagnosisCode}_${todayDate}`;
    return fileName || 'diagnosis-report';
  }, [diagnosis]);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } .no-print { display: none !important; } }
    `,
  });

  const handleDownload = useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; } }
    `,
  });

  useEffect(() => {
    if (!open) return;
    if (initialAction === 'print') {
      const timer = window.setTimeout(() => { handlePrint?.(); }, 150);
      return () => window.clearTimeout(timer);
    }
    if (initialAction === 'download') {
      const timer = window.setTimeout(() => { handleDownload?.(); }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [handleDownload, handlePrint, initialAction, open]);

  if (!open) return null;

  const cardBg = isDark ? 'bg-gray-900' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-slate-200';
  const bodyBg = isDark ? 'bg-gray-800' : 'bg-slate-100';
  const textPrimary = isDark ? 'text-gray-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-gray-500' : 'text-slate-400';
  const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-slate-50';
  const btnBorder = isDark ? 'border-gray-600' : 'border-slate-200';

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
        <div className={`no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl ${cardBg} shadow-2xl sm:h-[92vh] sm:rounded-2xl`}>
          <div className={`flex items-center justify-between border-b ${borderColor} px-5 py-4 print:hidden`}>
            <div>
              <h3 className={`text-base font-semibold ${textPrimary}`}>Diagnosis Preview</h3>
              <p className={`mt-1 text-sm ${textSecondary}`}>Loading report data...</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${btnBorder} p-2 ${textSecondary} transition-all ${hoverBg}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={`flex-1 overflow-y-auto ${bodyBg} p-4 sm:p-6`}>
            <LoadingSkeleton variant="default" message="Loading diagnosis report..." />
          </div>
        </div>
      </div>
    );
  }
  if (!diagnosis) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <div className={`no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl ${cardBg} shadow-2xl sm:h-[92vh] sm:rounded-2xl`}>
          <div className={`flex items-center justify-between border-b ${borderColor} px-5 py-4 print:hidden`}>
            <div>
              <h3 className={`text-base font-semibold ${textPrimary}`}>Diagnosis Preview</h3>
              <p className={`mt-1 text-sm ${textSecondary}`}>No diagnosis report found</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${btnBorder} p-2 ${textSecondary} transition-all ${hoverBg}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={`flex-1 overflow-y-auto ${bodyBg} p-4 sm:p-6`}>
            <div className={`flex flex-col items-center justify-center rounded-lg ${cardBg} p-12 text-center`}>
              <div className={`mb-4 rounded-full ${bodyBg} p-4`}>
                <Eye className={`h-8 w-8 ${textMuted}`} />
              </div>
              <h3 className={`mb-2 text-lg font-semibold ${textPrimary}`}>No Diagnosis Found</h3>
              <p className={`text-sm ${textSecondary}`}>No diagnosis report found for {patientName} yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={`no-print flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl ${cardBg} shadow-2xl sm:h-[92vh] sm:rounded-2xl`}>
        <div className={`flex items-center justify-between border-b ${borderColor} px-5 py-4 print:hidden`}>
          <div>
            <h3 className={`text-base font-semibold ${textPrimary}`}>Diagnosis Preview</h3>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              Review the diagnosis report before printing or saving as PDF.
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
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${isDark ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} px-4 py-2 text-sm font-medium transition-all`}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              disabled
              className={`inline-flex cursor-not-allowed items-center gap-2 rounded-lg border ${btnBorder} px-4 py-2 text-sm font-medium ${textMuted}`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${btnBorder} p-2 ${textSecondary} transition-all ${hoverBg}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${bodyBg} p-4 sm:p-6`}>
          <div ref={contentRef}>
            <DiagnosesPreviewDocument diagnosis={diagnosis} values={values} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosesPreviewModal;
