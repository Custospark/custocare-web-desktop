import React, { useMemo, useState } from 'react';
import { CalendarClock, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { useNursingMedicationSchedule } from '../../api/medication-treatment/nursingMedicationQueries';
import type {
  NursingMedicationDose,
  NursingMedicationDoseStatus,
} from '../../api/medication-treatment/nursingMedicationTypes';

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

function formatPatientName(dose: NursingMedicationDose): string {
  const u = dose.patient?.user;
  if (u?.display_name?.trim()) return u.display_name.trim();
  const parts = [u?.first_name, u?.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : `Patient #${dose.patient_id}`;
}

function statusPillClass(isDark: boolean, status: NursingMedicationDoseStatus): string {
  if (status === 'administered') {
    return isDark
      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-700'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (status === 'missed') {
    return isDark
      ? 'bg-rose-900/30 text-rose-200 border-rose-700'
      : 'bg-rose-50 text-rose-800 border-rose-200';
  }
  if (status === 'skipped') {
    return isDark
      ? 'bg-amber-900/30 text-amber-200 border-amber-700'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return isDark ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-800 border-blue-200';
}

const MedicationScheduleView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;

  const [statusFilter, setStatusFilter] = useState<NursingMedicationDoseStatus | ''>('pending');
  const [wardId, setWardId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });
  const query = useNursingMedicationSchedule({
    facilityId,
    status: statusFilter || undefined,
    ward_id: wardId ? Number(wardId) : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    per_page: perPage,
    enabled: facilityId > 0,
  });

  const wards = asArray<Ward>(wardsQuery.data);
  const doses = useMemo(() => asArray<NursingMedicationDose>(query.data?.data), [query.data?.data]);
  const meta = query.data?.meta;

  const busy = query.isFetching || wardsQuery.isFetching;
  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  if (!facilityId) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        }`}
      >
        Select an active facility to view medication schedule.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <CalendarClock className="w-5 h-5 opacity-90" aria-hidden />
            Medication schedule
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            View all scheduled medication doses at this facility. Filter by status, ward, or date range.
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={busy}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50 ${
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={`rounded-xl border p-3 ${cardShell}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="ms-status" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Status
            </label>
            <select
              id="ms-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter((e.target.value as NursingMedicationDoseStatus | '') || '');
                setPage(1);
              }}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="administered">Administered</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          <div>
            <label htmlFor="ms-ward" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ward
            </label>
            <select
              id="ms-ward"
              value={wardId}
              onChange={(e) => {
                setWardId(e.target.value);
                setPage(1);
              }}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All wards</option>
              {wards.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ms-from" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              From
            </label>
            <input
              id="ms-from"
              type="datetime-local"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label htmlFor="ms-to" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              To
            </label>
            <input
              id="ms-to"
              type="datetime-local"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <div
            className={`inline-block h-8 w-8 animate-spin rounded-full border-2 ${
              isDark ? 'border-gray-600 border-t-blue-400' : 'border-gray-200 border-t-blue-600'
            }`}
          />
        </div>
      ) : doses.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No scheduled doses found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {doses.map((dose) => (
            <li key={dose.id} className={`rounded-xl border p-4 ${cardShell}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {dose.prescriptionItem?.medication_name || `Medication item #${dose.prescription_item_id}`}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${statusPillClass(isDark, dose.status)}`}>
                      {STATUS_LABEL[dose.status]}
                    </span>
                  </div>

                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dose.prescriptionItem?.strength ? `${dose.prescriptionItem.strength}` : '—'}
                    {dose.prescriptionItem?.route ? ` · ${dose.prescriptionItem.route}` : ''}
                  </div>

                  <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span>Patient: {formatPatientName(dose)}</span>
                    <span>Visit: {dose.visit?.visit_uuid || '—'}</span>
                    <span>Ward: {dose.ward?.name || '—'}</span>
                    <span>Scheduled: {formatWhen(dose.scheduled_for)}</span>
                  </div>
                  {dose.schedule_notes ? (
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Notes: {dose.schedule_notes}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.last_page > 1 ? (
        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${cardShell}`}>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Page {meta.current_page} of {meta.last_page} ({meta.total} doses)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer disabled:opacity-40 ${
                isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer disabled:opacity-40 ${
                isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MedicationScheduleView;
