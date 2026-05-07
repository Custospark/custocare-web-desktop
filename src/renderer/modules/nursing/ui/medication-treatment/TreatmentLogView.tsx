import React, { useMemo, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { useGetVisitsByFacility } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { VisitStatus } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import {
  useCreateNursingTreatmentLog,
  useNursingTreatmentLogs,
} from '../../api/medication-treatment/nursingMedicationQueries';
import type {
  NursingTreatmentLog,
  NursingTreatmentLogCategory,
} from '../../api/medication-treatment/nursingMedicationTypes';

interface Props {
  theme: 'light' | 'dark';
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

const CATEGORY_OPTIONS: Array<{ value: NursingTreatmentLogCategory; label: string }> = [
  { value: 'wound_care', label: 'Wound care' },
  { value: 'dressing_change', label: 'Dressing change' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'education', label: 'Education' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'comfort_measures', label: 'Comfort measures' },
  { value: 'device_care', label: 'Device care' },
  { value: 'other', label: 'Other' },
];

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatPerson(
  u: { display_name?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined
): string {
  if (!u) return '—';
  if (u.display_name?.trim()) return u.display_name.trim();
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

const TreatmentLogView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const { showToast } = useToast();

  const [visitUuid, setVisitUuid] = useState('');
  const [wardId, setWardId] = useState('');
  const [performedAt, setPerformedAt] = useState('');
  const [category, setCategory] = useState<NursingTreatmentLogCategory>('other');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const [categoryFilter, setCategoryFilter] = useState<NursingTreatmentLogCategory | ''>('');
  const [page, setPage] = useState(1);

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);
  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });

  const activeVisitsQuery = useGetVisitsByFacility(
    facilityId,
    { status: VisitStatus.ACTIVE, per_page: 100 },
    { enabled: facilityId > 0 }
  );
  const inProgressVisitsQuery = useGetVisitsByFacility(
    facilityId,
    { status: VisitStatus.IN_PROGRESS, per_page: 100 },
    { enabled: facilityId > 0 }
  );

  const logsQuery = useNursingTreatmentLogs({
    facilityId,
    category: categoryFilter || undefined,
    page,
    per_page: 15,
    enabled: facilityId > 0,
  });

  const createMutation = useCreateNursingTreatmentLog();

  const wards = asArray<Ward>(wardsQuery.data);
  const logs = useMemo(() => asArray<NursingTreatmentLog>(logsQuery.data?.data), [logsQuery.data?.data]);

  const visitPicklist = useMemo(() => {
    const byId = new Map<number, { id: number; visit_uuid: string; patient_id: number; patientName: string }>();

    for (const v of [...asArray(activeVisitsQuery.data?.data), ...asArray(inProgressVisitsQuery.data?.data)]) {
      byId.set(v.id, {
        id: v.id,
        visit_uuid: v.visit_uuid,
        patient_id: v.patient_id,
        patientName: v.patient?.name?.trim() || `Patient #${v.patient_id}`,
      });
    }

    return [...byId.values()];
  }, [activeVisitsQuery.data, inProgressVisitsQuery.data]);

  const selectedVisit = useMemo(
    () => visitPicklist.find((v) => v.visit_uuid === visitUuid) ?? null,
    [visitPicklist, visitUuid]
  );

  const busy =
    wardsQuery.isFetching ||
    activeVisitsQuery.isFetching ||
    inProgressVisitsQuery.isFetching ||
    logsQuery.isFetching ||
    createMutation.isPending;

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  const resetForm = () => {
    setVisitUuid('');
    setWardId('');
    setPerformedAt('');
    setCategory('other');
    setTitle('');
    setNotes('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !selectedVisit) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('error', 'Enter a treatment title.', 4000);
      return;
    }

    try {
      await createMutation.mutateAsync({
        facility_id: facilityId,
        visit_id: selectedVisit.id,
        patient_id: selectedVisit.patient_id,
        ward_id: wardId ? Number(wardId) : null,
        performed_at: performedAt ? new Date(performedAt).toISOString() : new Date().toISOString(),
        category,
        title: trimmedTitle,
        notes: notes.trim() || null,
      });
      showToast('success', 'Treatment log recorded.', 3500);
      resetForm();
      setPage(1);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not save treatment log.', 5000);
    }
  };

  if (!facilityId) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        }`}
      >
        Select an active facility to manage treatment logs.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ClipboardList className="w-5 h-5 opacity-90" aria-hidden />
            Treatment log
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create and review treatment entries from <code className="text-xs opacity-90">/nursing/treatment-logs</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => logsQuery.refetch()}
          disabled={busy}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50 ${
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={submit} className={`rounded-xl border p-4 space-y-3 ${cardShell}`}>
        <div>
          <label htmlFor="tl-visit" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Patient / visit <span className="text-rose-500">*</span>
          </label>
          <select
            id="tl-visit"
            value={visitUuid}
            onChange={(e) => setVisitUuid(e.target.value)}
            required
            className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
              isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
            }`}
            disabled={busy}
          >
            <option value="">— Select active/in-progress visit —</option>
            {visitPicklist.map((v) => (
              <option key={v.visit_uuid} value={v.visit_uuid}>
                {v.patientName} · {v.visit_uuid}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="tl-category" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Category
            </label>
            <select
              id="tl-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as NursingTreatmentLogCategory)}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={busy}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tl-ward" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Ward
            </label>
            <select
              id="tl-ward"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={busy}
            >
              <option value="">— Optional —</option>
              {wards.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tl-performed" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Performed at
            </label>
            <input
              id="tl-performed"
              type="datetime-local"
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tl-title" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="tl-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
              isDark
                ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            }`}
            placeholder="e.g. Dressing change - left lower limb"
            required
            disabled={busy}
          />
        </div>

        <div>
          <label htmlFor="tl-notes" className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Notes
          </label>
          <textarea
            id="tl-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`w-full min-h-[90px] rounded-lg border px-2 py-1.5 text-sm ${
              isDark
                ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
            }`}
            disabled={busy}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={busy || !visitUuid}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {createMutation.isPending ? 'Saving…' : 'Record treatment'}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm border cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
      </form>

      <div className={`rounded-xl border p-4 ${cardShell}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent treatment logs</h3>
          <select
            aria-label="Filter treatment logs by category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter((e.target.value as NursingTreatmentLogCategory | '') || '');
              setPage(1);
            }}
            className={`rounded-lg border px-2 py-1 text-xs cursor-pointer ${
              isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {logsQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <div
              className={`inline-block h-8 w-8 animate-spin rounded-full border-2 ${
                isDark ? 'border-gray-600 border-t-blue-400' : 'border-gray-200 border-t-blue-600'
              }`}
            />
          </div>
        ) : logs.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No treatment logs found.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((row) => (
              <li
                key={row.id}
                className={`rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-200 bg-gray-50/80'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md border ${
                      isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {CATEGORY_OPTIONS.find((c) => c.value === row.category)?.label || row.category}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{formatWhen(row.performed_at)}</span>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{row.title}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Visit: {row.visit?.visit_uuid || row.visit_id} · Patient: {formatPerson(row.patient?.user)} · By:{' '}
                  {formatPerson(row.loggedBy)}
                </p>
                {row.notes ? (
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Notes: {row.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {logsQuery.data?.meta && logsQuery.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-600/30">
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Page {logsQuery.data.meta.current_page} of {logsQuery.data.meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || busy}
                className={`px-3 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= logsQuery.data.meta.last_page || busy}
                className={`px-3 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TreatmentLogView;
