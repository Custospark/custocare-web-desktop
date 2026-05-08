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
    return isDark ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-50 text-emerald-800';
  }
  if (status === 'missed') {
    return isDark ? 'bg-rose-900/30 text-rose-200' : 'bg-rose-50 text-rose-800';
  }
  if (status === 'skipped') {
    return isDark ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-800';
  }
  return isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800';
}

const NursingEncounterMedsView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
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
        Open a patient encounter so a visit is active. Scheduled doses load from{' '}
        <code className="text-xs">GET /nursing/medication-doses?visit_id=…</code>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn('text-lg font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
            <Pill className="w-5 h-5 opacity-90" aria-hidden />
            Visit medications (MAR)
          </h2>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Nursing medication doses for {activeVisit?.patient?.name?.trim() || 'this visit'}.
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

      <div className={cn('rounded-xl border p-3', cardShell)}>
        <label htmlFor="enc-med-status" className={cn('block text-xs mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Filter by dose status
        </label>
        <select
          id="enc-med-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter((e.target.value as NursingMedicationDoseStatus | '') || '');
            setPage(1);
          }}
          className={cn(
            'rounded-lg border px-2 py-1.5 text-sm max-w-xs',
            isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
          )}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="administered">Administered</option>
          <option value="missed">Missed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div className={cn('rounded-xl border divide-y', cardShell)}>
        {doses.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            No scheduled doses for this visit. Orders may still be pending pharmacy / MAR build-out.
          </div>
        ) : (
          doses.map((d) => (
            <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="min-w-0">
                <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>{medLabel(d)}</p>
                <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  Scheduled {formatWhen(d.scheduled_for)}
                  {d.schedule_notes ? ` · ${d.schedule_notes}` : ''}
                </p>
              </div>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0',
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
        <div className={cn('flex items-center justify-between text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border cursor-pointer disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border cursor-pointer disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? (
        <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>Loading doses…</p>
      ) : null}
    </div>
  );
};

export default NursingEncounterMedsView;
