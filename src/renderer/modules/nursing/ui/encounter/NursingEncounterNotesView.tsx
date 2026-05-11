import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { useGetVisitClinicalNotes } from '../../../medical-records/api/clinical-notes/clinicalNoteQueries';
import type { ClinicalNoteResponse } from '../../../medical-records/api/clinical-notes/clinicalNoteTypes';
import { cn } from '../../../../shared/utils/classNameUtils';
import { getNursingEncounterChrome } from './nursingEncounterChrome';

interface Props {
  theme: 'light' | 'dark';
}

function previewText(note: ClinicalNoteResponse): string {
  const t = note.full_note_text?.trim();
  if (t) return t.length > 280 ? `${t.slice(0, 280)}…` : t;
  const soap = [note.subjective, note.objective, note.assessment, note.plan].filter(Boolean).join('\n');
  return soap.length > 280 ? `${soap.slice(0, 280)}…` : soap || '—';
}

const NursingEncounterNotesView: React.FC<Props> = ({ theme }) => {
  const chrome = getNursingEncounterChrome(theme);
  const { isDark } = chrome;
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const activeVisit = useAppSelector(selectActiveVisit);
  const visitId = activeVisit?.visit_id ?? 0;

  const query = useGetVisitClinicalNotes(visitId, {
    enabled: facilityId > 0 && visitId > 0,
  });

  const notes = query.data?.data ?? [];
  const busy = query.isFetching;

  if (!facilityId) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={chrome.body}>Select an active facility first.</p>
      </div>
    );
  }

  if (!visitId) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={cn(chrome.body, 'leading-relaxed')}>
          Open a patient encounter to load clinical notes for the active visit. Data comes from{' '}
          <code className={chrome.code}>GET /clinical-notes/visit/&#123;id&#125;</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', chrome.heading)}>
            <FileText className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            Clinical notes
          </h2>
          <p className={cn('text-sm leading-snug', chrome.subhead)}>
            Notes recorded for {activeVisit?.patient?.name?.trim() || 'this visit'}. Full authoring remains in Medical Records.
          </p>
        </div>
        <button type="button" onClick={() => query.refetch()} disabled={busy} className={cn(chrome.btnSecondary, 'shrink-0 cursor-pointer')}>
          <RefreshCw className={cn('h-4 w-4 shrink-0', busy ? 'animate-spin' : '')} aria-hidden />
          Refresh
        </button>
      </header>

      <div className={cn(chrome.card, 'divide-y', chrome.divide)}>
        {notes.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm leading-relaxed', chrome.muted)}>No clinical notes for this visit yet.</div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                <span className={cn('font-bold uppercase tracking-wide', isDark ? 'text-slate-200' : 'text-slate-800')}>
                  {note.note_type}
                </span>
                <span className={chrome.subtle}>
                  {note.note_status} · {note.noted_at ? new Date(note.noted_at).toLocaleString() : '—'}
                  {note.staff_name ? ` · ${note.staff_name}` : ''}
                </span>
              </div>
              <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', chrome.body)}>{previewText(note)}</p>
            </article>
          ))
        )}
      </div>

      {query.isLoading ? <p className={cn('text-sm', chrome.muted)}>Loading notes…</p> : null}
    </div>
  );
};

export default NursingEncounterNotesView;
