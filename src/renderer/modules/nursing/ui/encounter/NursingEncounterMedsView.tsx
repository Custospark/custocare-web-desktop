import React, { useMemo, useState } from 'react';
import { Pill, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { useNursingMedicationSchedule } from '../../api/medication-treatment/nursingMedicationQueries';
import type {
  NursingMedicationDose,
  NursingMedicationDoseStatus,
} from '../../api/medication-treatment/nursingMedicationTypes';
import { cn } from '../../../../shared/utils/classNameUtils';
import { getNursingEncounterChrome } from './nursingEncounterChrome';

interface Props {
  theme: 'light' | 'dark';
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

const STATUS_LABEL: Record<NursingMedicationDoseStatus, string> = {
  pending: 'Pending',
  administered: 'Administered',
  missed: 'Missed',
  skipped: 'Skipped',
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function medLabel(d: NursingMedicationDose): string {
  const pi = d.prescriptionItem;
  const parts = [pi?.medication_name, pi?.strength].filter(Boolean);
  return parts.length ? parts.join(' · ') : `Prescription item #${d.prescription_item_id}`;
}

function statusPillClass(isDark: boolean, status: NursingMedicationDoseStatus): string {
  if (status === 'administered') {
    return isDark ? 'bg-emerald-950/60 text-emerald-100 ring-1 ring-emerald-800/60' : 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200';
  }
  if (status === 'missed') {
    return isDark ? 'bg-rose-950/55 text-rose-50 ring-1 ring-rose-800/50' : 'bg-rose-50 text-rose-900 ring-1 ring-rose-200';
  }
  if (status === 'skipped') {
    return isDark ? 'bg-amber-950/50 text-amber-50 ring-1 ring-amber-800/50' : 'bg-amber-50 text-amber-950 ring-1 ring-amber-200';
  }
  return isDark ? 'bg-blue-950/60 text-blue-100 ring-1 ring-blue-800/50' : 'bg-blue-50 text-blue-900 ring-1 ring-blue-200';
}

const NursingEncounterMedsView: React.FC<Props> = ({ theme }) => {
  const chrome = getNursingEncounterChrome(theme);
  const { isDark } = chrome;
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const activeVisit = useAppSelector(selectActiveVisit);
  const visitId = activeVisit?.visit_id;

  const [statusFilter, setStatusFilter] = useState<NursingMedicationDoseStatus | ''>('');
  const [page, setPage] = useState(1);
  const perPage = 30;

  const query = useNursingMedicationSchedule({
    facilityId,
    visit_id: visitId,
    status: statusFilter || undefined,
    page,
    per_page: perPage,
    enabled: facilityId > 0 && !!visitId,
  });

  const doses = useMemo(() => asArray<NursingMedicationDose>(query.data?.data), [query.data?.data]);
  const meta = query.data?.meta;
  const busy = query.isFetching;

  const selectClass = isDark
    ? 'max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-sm text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30'
    : 'max-w-xs rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25';

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
          Open a patient encounter to view medications for their active prescriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', chrome.heading)}>
            <Pill className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            Visit medications (MAR)
          </h2>
          <p className={cn('text-sm leading-snug', chrome.subhead)}>
            Nursing medication doses for {activeVisit?.patient?.name?.trim() || 'this visit'}.
          </p>
        </div>
        <button type="button" onClick={() => query.refetch()} disabled={busy} className={cn(chrome.btnSecondary, 'shrink-0 cursor-pointer')}>
          <RefreshCw className={cn('h-4 w-4 shrink-0', busy ? 'animate-spin' : '')} aria-hidden />
          Refresh
        </button>
      </header>

      <div className={chrome.filterPanel}>
        <label htmlFor="enc-med-status" className={cn('mb-2 block text-xs font-semibold uppercase tracking-wide', chrome.muted)}>
          Filter by dose status
        </label>
        <select
          id="enc-med-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter((e.target.value as NursingMedicationDoseStatus | '') || '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="administered">Administered</option>
          <option value="missed">Missed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div className={cn(chrome.card, 'divide-y', chrome.divide)}>
        {doses.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm leading-relaxed', chrome.muted)}>
            No medications found for this visit. Prescriptions may not have active medication items.
          </div>
        ) : (
          doses.map((d) => (
            <div key={d.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className={cn('font-semibold leading-snug', chrome.rowTitle)}>{medLabel(d)}</p>
                <p className={cn('mt-1.5 text-xs leading-relaxed', chrome.subtle)}>
                  Scheduled {formatWhen(d.scheduled_for)}
                  {d.schedule_notes ? ` · ${d.schedule_notes}` : ''}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                  statusPillClass(isDark, d.status)
                )}
              >
                {STATUS_LABEL[d.status]}
              </span>
            </div>
          ))
        )}
      </div>

      {meta && meta.last_page > 1 ? (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', chrome.muted)}>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(chrome.btnPaging, 'cursor-pointer')}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className={cn(chrome.btnPaging, 'cursor-pointer')}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? <p className={cn('text-sm', chrome.muted)}>Loading doses…</p> : null}
    </div>
  );
};

export default NursingEncounterMedsView;
