import React, { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { useNursingMissedMedicationDoses } from '../../api/medication-treatment/nursingMedicationQueries';
import type { NursingMedicationDose } from '../../api/medication-treatment/nursingMedicationTypes';

interface Props {
  theme: 'light' | 'dark';
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function patientNameFromDose(dose: NursingMedicationDose): string {
  const u = dose.patient?.user;
  if (u?.display_name?.trim()) return u.display_name.trim();
  const parts = [u?.first_name, u?.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : `Patient #${dose.patient_id}`;
}

const MissedMedicationsView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;

  const [wardId, setWardId] = useState('');
  const [asOf, setAsOf] = useState('');
  const [page, setPage] = useState(1);

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);
  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });

  const query = useNursingMissedMedicationDoses({
    facilityId,
    ward_id: wardId ? Number(wardId) : undefined,
    as_of: asOf ? new Date(asOf).toISOString() : undefined,
    page,
    per_page: 20,
    enabled: facilityId > 0,
  });

  const wards = asArray<Ward>(wardsQuery.data);
  const doses = useMemo(() => asArray<NursingMedicationDose>(query.data?.data), [query.data?.data]);
  const meta = query.data?.meta;

  const busy = query.isFetching || wardsQuery.isFetching;
  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to view missed medications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden />
            Missed medications
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Doses past their scheduled time that still need attention.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="mm-ward" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ward</label>
            <select
              id="mm-ward"
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
            <label htmlFor="mm-asof" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>As of</label>
            <input
              id="mm-asof"
              type="datetime-local"
              value={asOf}
              onChange={(e) => {
                setAsOf(e.target.value);
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
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-2 ${isDark ? 'border-gray-600 border-t-blue-400' : 'border-gray-200 border-t-blue-600'}`} />
        </div>
      ) : doses.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No missed doses found.</p>
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
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${isDark ? 'border-rose-700 text-rose-200 bg-rose-900/30' : 'border-rose-200 text-rose-800 bg-rose-50'}`}>
                      Missed
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Patient: {patientNameFromDose(dose)} · Visit: {dose.visit?.visit_uuid || '—'}
                  </div>
                  <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span>Ward: {dose.ward?.name || '—'}</span>
                    <span>Scheduled: {formatWhen(dose.scheduled_for)}</span>
                    <span>Rx: {dose.prescription?.prescription_number || `#${dose.prescription_id}`}</span>
                  </div>
                  {dose.schedule_notes ? <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Notes: {dose.schedule_notes}</p> : null}
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

export default MissedMedicationsView;
