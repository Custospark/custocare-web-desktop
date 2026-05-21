import React from 'react';
import {
  Download,
  Eye,
  FilePenLine,
  Printer,
  UserRound,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  CLINICAL_NOTES_SECTIONS,
  formatClinicalNoteDate,
  getClinicalNoteMeta,
  getPreviewSectionText,
} from './clinicalNotesForm.utils';
import type {
  ClinicalNoteResponse,
  ClinicalNotesFormValues,
  ClinicalNotesThemeTokens,
} from './clinicalNotesForm.types';
import { formatText } from '../../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface ClinicalNotesSummaryCardProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  note: ClinicalNoteResponse;
  values: ClinicalNotesFormValues;
  noteTitle: string;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export const ClinicalNotesSummaryCard: React.FC<ClinicalNotesSummaryCardProps> = ({
  isDark,
  colors,
  note,
  values,
  // noteTitle,
  onEdit,
  onPreview,
  onPrint,
  onDownload,
}) => {
  const meta = getClinicalNoteMeta(note);

  return (
    <section
      className={cn(
        'rounded-2xl border',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className={cn('border-b p-5 sm:p-6', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
          
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {meta.status && (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-semibold',
                    isDark ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  )}
                >
                  {formatText(meta.status)}
                </span>
              )}

              {meta.noteType && (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 font-medium',
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {formatText(meta.noteType)}
                </span>
              )}

              
              <span
                className={cn(
                  'rounded-full px-3 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                Patient Number: {note?.patient_number ?? 'N/A'}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                className={cn(
                  'rounded-xl border p-3',
                  colors.border.primary,
                  colors.bg.subtle
                )}
              >
                <p className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                  Created
                </p>
                <p className={cn('mt-1 text-sm font-medium', colors.text.primary)}>
                  {formatClinicalNoteDate(meta.createdAt)}
                </p>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-3',
                  colors.border.primary,
                  colors.bg.subtle
                )}
              >
                <p className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                  Last Updated
                </p>
                <p className={cn('mt-1 text-sm font-medium', colors.text.primary)}>
                  {formatClinicalNoteDate(meta.updatedAt || meta.createdAt)}
                </p>
              </div>
            </div>

            {meta.author && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm">
                <UserRound className={cn('h-4 w-4', colors.text.tertiary)} />
                <span className={colors.text.secondary}>Clinician:</span>
                <span className={cn('font-medium', colors.text.primary)}>Dr.  {meta.author}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={onDownload}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            <button
              type="button"
              onClick={onEdit}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              )}
            >
              <FilePenLine className="h-4 w-4" />
              Edit Note
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        {CLINICAL_NOTES_SECTIONS.map((section) => {
          const Icon = section.icon;
          // Get the display value from form values
          const displayValue = getPreviewSectionText(values, section.key, section.previewFallback);

          return (
            <div
              key={section.key}
              className={cn(
                'rounded-xl border p-4',
                colors.border.primary,
                colors.bg.subtle
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className={cn('h-4 w-4', colors.text.tertiary)} />
                <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                  {section.label}
                </h4>
              </div>

              <p className={cn(
                'whitespace-pre-wrap break-words text-sm leading-6',
                !displayValue || displayValue === section.previewFallback
                  ? 'italic text-slate-500'
                  : colors.text.secondary
              )}>
                {displayValue}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ClinicalNotesSummaryCard;