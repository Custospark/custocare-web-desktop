import React from 'react';
import { FileText, UserRound } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  CLINICAL_NOTES_SECTIONS,
  formatClinicalNoteDate,
  getClinicalNoteMeta,
  getPreviewSectionText,
} from './clinicalNotesForm.utils';
import type {
  ClinicalNoteListItem,
  ClinicalNotesFormValues,
} from './clinicalNotesForm.types';

interface ClinicalNotesPreviewDocumentProps {
  note: ClinicalNoteListItem | null;
  values: ClinicalNotesFormValues;
  noteTitle: string;
}

export const ClinicalNotesPreviewDocument: React.FC<ClinicalNotesPreviewDocumentProps> = ({
  note,
  values,
  noteTitle,
}) => {
  const meta = getClinicalNoteMeta(note);

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="border-b-2 border-blue-700 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 print:bg-transparent print:px-0">
              <FileText className="h-3.5 w-3.5 print:hidden" />
              Clinical Notes Report
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 print:text-xl">
              {noteTitle || 'Clinical Note'}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Generated from the current visit record.
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Printed: {formatClinicalNoteDate(new Date().toISOString())}</div>
            <div className="mt-1">Visit ID: {meta.visitId ?? 'N/A'}</div>
            <div className="mt-1">Patient ID: {meta.patientId ?? 'N/A'}</div>
          </div>
        </div>

        {(meta.author || meta.status || meta.updatedAt || meta.createdAt) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 print:bg-transparent">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Clinician
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                <UserRound className="h-4 w-4 print:hidden" />
                {meta.author || 'Not available'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 print:bg-transparent">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {meta.status || 'Draft'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 print:bg-transparent">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Last Updated
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatClinicalNoteDate(meta.updatedAt || meta.createdAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-5 print:mt-4">
        {CLINICAL_NOTES_SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <section
              key={section.key}
              className="rounded-xl border border-slate-200 p-4 print:break-inside-avoid"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Icon className="h-4 w-4 text-slate-500 print:hidden" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {section.label}
                </h2>
              </div>

              <div
                className={cn(
                  'whitespace-pre-wrap text-sm leading-7 text-slate-800',
                  !values[section.key].trim() && 'italic text-slate-500'
                )}
              >
                {getPreviewSectionText(values, section.key, section.previewFallback)}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8 border-t border-slate-200 pt-4 text-center">
        <p className="text-[11px] leading-5 text-slate-500">
          This clinical note is part of the patient’s medical record and should be interpreted in
          the full clinical context by an authorized healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default ClinicalNotesPreviewDocument;
