import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import {
  useCreateFacilityShiftHandover,
  useFacilityShiftHandovers,
} from '../../api/shift-handover/shiftHandoverQueries';
import type { FacilityShiftHandover } from '../../api/shift-handover/shiftHandoverTypes';
import type { FacilityTaskUserBrief } from '../../api/facility-tasks/facilityTaskTypes';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { useGetStaffForForwarding } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { ForwardingStaff } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface Props {
  theme: 'light' | 'dark';
}

const STAFF_FORWARDING_FILTERS = { exclude_current_staff: false as const, limit: 150 };

function formatPerson(u: FacilityTaskUserBrief | null | undefined): string {
  if (!u) return '—';
  if (u.display_name?.trim()) return u.display_name.trim();
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

const ShiftHandoverView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const currentStaffId = useAppSelector(getStaffId);
  const { showToast } = useToast();

  const [summary, setSummary] = useState('');
  const [wardId, setWardId] = useState('');
  const [handoverToUserId, setHandoverToUserId] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const staffForwardingQuery = useGetStaffForForwarding(STAFF_FORWARDING_FILTERS, {
    enabled: facilityId > 0,
  });
  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });

  const listQuery = useFacilityShiftHandovers({
    facilityId,
    page,
    per_page: perPage,
    enabled: facilityId > 0,
  });

  const createMutation = useCreateFacilityShiftHandover();

  const forwardingStaff: ForwardingStaff[] = useMemo(
    () => staffForwardingQuery.data?.data?.staff ?? [],
    [staffForwardingQuery.data]
  );

  const assigneeOptions = useMemo(() => {
    const byUserId = new Map<number, { userId: number; label: string }>();
    for (const s of forwardingStaff) {
      if (!s.user_id || s.user_id <= 0) continue;
      if (byUserId.has(s.user_id)) continue;
      const you = currentStaffId != null && s.staff_id === currentStaffId ? ' (you)' : '';
      byUserId.set(s.user_id, {
        userId: s.user_id,
        label: `${s.full_name}${you} — ${s.role_code}`,
      });
    }
    return [...byUserId.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }, [forwardingStaff, currentStaffId]);

  const wards: Ward[] = useMemo(
    () => (Array.isArray(wardsQuery.data) ? wardsQuery.data : []),
    [wardsQuery.data]
  );
  const rows: FacilityShiftHandover[] = useMemo(
    () => (Array.isArray(listQuery.data?.data) ? listQuery.data!.data : []),
    [listQuery.data]
  );
  const meta = listQuery.data?.meta;

  const submitting = createMutation.isPending;

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
    isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const resetForm = () => {
    setSummary('');
    setWardId('');
    setHandoverToUserId('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;

    const text = summary.trim();
    if (!text) {
      showToast('error', 'Enter a handover summary.', 4000);
      return;
    }

    const toUid = handoverToUserId ? Number(handoverToUserId) : null;

    try {
      await createMutation.mutateAsync({
        facility_id: facilityId,
        summary: text,
        ward_id: wardId ? Number(wardId) : null,
        handed_over_to_user_id: toUid && Number.isFinite(toUid) && toUid > 0 ? toUid : null,
      });
      showToast('success', 'Shift handover recorded.', 4000);
      resetForm();
      setPage(1);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not save handover.', 5000);
    }
  };

  const truncate = (s: string, len: number) => (s.length <= len ? s : `${s.slice(0, len)}…`);

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to record shift handovers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ArrowRightLeft className="w-5 h-5 opacity-90" aria-hidden />
            Shift handover
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Document handover notes for this facility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50 ${
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} />
          Refresh list
        </button>
      </div>

      <form onSubmit={submit} className={`rounded-xl border p-5 space-y-4 ${cardShell}`}>
        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="ho-summary">
            Handover summary <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="ho-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="Patients of concern, pending tasks, equipment, incidents…"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="ho-ward">
              Ward (optional)
            </label>
            {wardsQuery.isLoading ? (
              <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
            ) : (
              <select
                id="ho-ward"
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Facility-wide / not ward-specific —</option>
                {wards.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name}
                    {w.code ? ` (${w.code})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="ho-to">
              Hand over to (optional)
            </label>
            {staffForwardingQuery.isLoading ? (
              <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
            ) : (
              <>
                <select
                  id="ho-to"
                  value={handoverToUserId}
                  onChange={(e) => setHandoverToUserId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— Not specified —</option>
                  {assigneeOptions.map((a) => (
                    <option key={a.userId} value={String(a.userId)}>
                      {a.label}
                    </option>
                  ))}
                </select>
                {staffForwardingQuery.isError ? (
                  <p className={`text-xs mt-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>Could not load staff list.</p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {submitting ? 'Saving…' : 'Record handover'}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
      </form>

      <div className={`rounded-xl border p-4 ${cardShell}`}>
        <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent handovers</h3>
        {listQuery.isLoading ? (
          <LoadingSkeleton variant="list" rows={3} theme={isDark ? 'dark' : 'light'} />
        ) : rows.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No handovers recorded yet.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {rows.map((row: FacilityShiftHandover) => (
                <li
                  key={row.id}
                  className={`rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-200 bg-gray-50/80'}`}
                >
                  <div className={`flex flex-wrap justify-between gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span>
                      {new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span>
                      From {formatPerson(row.handed_over_by)} → To {formatPerson(row.handed_over_to)}
                    </span>
                  </div>
                  {row.ward?.name ? (
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Ward: {row.ward.name}</p>
                  ) : null}
                  <p className={`text-sm mt-2 whitespace-pre-wrap break-words ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {truncate(row.summary, 480)}
                  </p>
                </li>
              ))}
            </ul>

            {meta && meta.last_page > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-600/30">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={!meta || page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftHandoverView;
