import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { useGetVisitClinicalNotes } from '../../../medical-records/api/clinical-notes/clinicalNoteQueries';
import type { ClinicalNoteResponse } from '../../../medical-records/api/clinical-notes/clinicalNoteTypes';
import { cn } from '../../../../shared/utils/classNameUtils';

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
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const activeVisit = useAppSelector(selectActiveVisit);
  const visitId = activeVisit?.visit_id ?? 0;

  const query = useGetVisitClinicalNotes(visitId, {
    enabled: facilityId > 0 && visitId > 0,
  });

  const notes = query.data?.data ?? [];
  const busy = query.isFetching;
  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  if (!facilityId) {
    return (
      <div
        className={cn(
          'rounded-xl border p-6 text-sm',
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        )}
      >
        Select an active facility first.
      </div>
    );
  }

  if (!visitId) {
    return (
      <div
        className={cn(
          'rounded-xl border p-6 text-sm',
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        )}
      >
        Open a patient encounter to load clinical notes for the active visit. Data comes from{' '}
        <code className="text-xs">GET /clinical-notes/visit/&#123;id&#125;</code>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn('text-lg font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
            <FileText className="w-5 h-5 opacity-90" aria-hidden />
            Clinical notes
          </h2>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Notes recorded for {activeVisit?.patient?.name?.trim() || 'this visit'}. Full authoring remains in Medical Records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50',
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', busy ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <div className={cn('rounded-xl border divide-y', cardShell)}>
        {notes.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            No clinical notes for this visit yet.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn('font-semibold uppercase tracking-wide', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {note.note_type}
                </span>
                <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                  {note.note_status} · {note.noted_at ? new Date(note.noted_at).toLocaleString() : '—'}
                </span>
                {note.staff_name ? (
                  <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>· {note.staff_name}</span>
                ) : null}
              </div>
              <p className={cn('text-sm whitespace-pre-wrap', isDark ? 'text-gray-300' : 'text-gray-800')}>
                {previewText(note)}
              </p>
            </div>
          ))
        )}
      </div>

      {query.isLoading ? (
        <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>Loading notes…</p>
      ) : null}
    </div>
  );
};

export default NursingEncounterNotesView;
