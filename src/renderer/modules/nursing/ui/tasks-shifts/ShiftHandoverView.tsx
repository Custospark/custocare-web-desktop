import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorClosed,
  Loader2,
  RefreshCw,
  User,
  Users,
} from 'lucide-react';

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
import { useGetStaffForForwarding, useBulkReassignStaff } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { ForwardingStaff, StaffPresenceStatus } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface Props {
  theme: 'light' | 'dark';
}

const STAFF_FORWARDING_FILTERS = { exclude_current_staff: false as const, limit: 150 };

type StaffFilterStatus = 'all' | 'on_duty' | 'busy' | 'available';

interface StatusInfo {
  bg: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}

function getStatusInfo(isDark: boolean, status: StaffPresenceStatus): StatusInfo {
  const dark = isDark;
  switch (status) {
    case 'on_duty':
      return {
        bg: dark ? 'bg-emerald-900/60' : 'bg-emerald-100',
        text: dark ? 'text-emerald-300' : 'text-emerald-800',
        label: 'On Duty',
        icon: <span className={`w-2 h-2 rounded-full ${dark ? 'bg-emerald-400' : 'bg-emerald-500'}`} />,
      };
    case 'busy':
      return {
        bg: dark ? 'bg-amber-900/60' : 'bg-amber-100',
        text: dark ? 'text-amber-300' : 'text-amber-800',
        label: 'Busy',
        icon: <span className={`w-2 h-2 rounded-full ${dark ? 'bg-amber-400' : 'bg-amber-500'}`} />,
      };
    case 'on_break':
      return {
        bg: dark ? 'bg-blue-900/60' : 'bg-blue-100',
        text: dark ? 'text-blue-300' : 'text-blue-800',
        label: 'On Break',
        icon: <span className={`w-2 h-2 rounded-full ${dark ? 'bg-blue-400' : 'bg-blue-500'}`} />,
      };
    default:
      return {
        bg: dark ? 'bg-gray-800' : 'bg-gray-100',
        text: dark ? 'text-gray-400' : 'text-gray-600',
        label: status ?? 'Unknown',
        icon: <span className={`w-2 h-2 rounded-full ${dark ? 'bg-gray-500' : 'bg-gray-400'}`} />,
      };
  }
}

function formatPerson(u: FacilityTaskUserBrief | null | undefined): string {
  if (!u) return '—';
  if (u.display_name?.trim()) return u.display_name.trim();
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function filterAndSortStaff(staff: ForwardingStaff[], search: string, filter: StaffFilterStatus): ForwardingStaff[] {
  let filtered = staff;

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.role_code.toLowerCase().includes(q) ||
      s.employee_id?.toLowerCase().includes(q)
    );
  }

  switch (filter) {
    case 'available':
      filtered = filtered.filter(s => s.is_available);
      break;
    case 'on_duty':
      filtered = filtered.filter(s => s.presence_status === 'on_duty');
      break;
    case 'busy':
      filtered = filtered.filter(s => s.presence_status === 'busy');
      break;
  }

  return filtered.sort((a, b) => {
    if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
    const order: Record<string, number> = { on_duty: 0, busy: 1, on_break: 2, unavailable: 3, off_duty: 4 };
    return (order[a.presence_status] ?? 99) - (order[b.presence_status] ?? 99);
  });
}

const ShiftHandoverView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const currentStaffId = useAppSelector(getStaffId);
  const { showToast } = useToast();

  const [summary, setSummary] = useState('');
  const [wardId, setWardId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StaffFilterStatus>('available');
  const [page, setPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const perPage = 10;
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm]);

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const staffForwardingQuery = useGetStaffForForwarding(STAFF_FORWARDING_FILTERS, {
    enabled: facilityId > 0,
  });
  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });
  const listQuery = useFacilityShiftHandovers({
    facilityId,
    page: listPage,
    per_page: perPage,
    enabled: facilityId > 0,
  });
  const createHandoverMutation = useCreateFacilityShiftHandover();
  const reassignMutation = useBulkReassignStaff();

  const forwardingStaff: ForwardingStaff[] = useMemo(
    () => staffForwardingQuery.data?.data?.staff ?? [],
    [staffForwardingQuery.data]
  );

  const filteredStaff = useMemo(
    () => filterAndSortStaff(forwardingStaff, debouncedSearch, filterStatus),
    [forwardingStaff, debouncedSearch, filterStatus]
  );

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / 10));
  const safePage = Math.min(page, totalPages);
  const paginatedStaff = filteredStaff.slice((safePage - 1) * 10, safePage * 10);

  const selectedStaff = useMemo(
    () => forwardingStaff.find(s => s.staff_id === selectedStaffId) ?? null,
    [forwardingStaff, selectedStaffId]
  );

  const wards: Ward[] = useMemo(
    () => (Array.isArray(wardsQuery.data) ? wardsQuery.data : []),
    [wardsQuery.data]
  );
  const rows: FacilityShiftHandover[] = useMemo(
    () => (Array.isArray(listQuery.data?.data) ? listQuery.data!.data : []),
    [listQuery.data]
  );
  const meta = listQuery.data?.meta;

  const submitting = createHandoverMutation.isPending || reassignMutation.isPending;

  const resetForm = () => {
    setSummary('');
    setWardId('');
    setSelectedStaffId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;

    const text = summary.trim();
    if (!text) {
      showToast('error', 'Enter a handover summary.', 4000);
      return;
    }
    if (!selectedStaffId) {
      showToast('error', 'Select a staff member to hand over to.', 5000);
      return;
    }

    try {
      await createHandoverMutation.mutateAsync({
        facility_id: facilityId,
        summary: text,
        ward_id: wardId ? Number(wardId) : null,
        handed_over_to_user_id: selectedStaff ? selectedStaff.user_id : null,
      });

      let reassignMsg = '';
      try {
        const reassignResult = await reassignMutation.mutateAsync({ to_staff_id: selectedStaffId });
        reassignMsg = reassignResult.reassigned_count > 0 ? ` ${reassignResult.reassigned_count} visit(s) reassigned.` : '';
      } catch {
        reassignMsg = ' Visit reassignment failed.';
      }

      showToast('success', `Shift handover recorded.${reassignMsg}`, 6000);
      resetForm();
      setListPage(1);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not save handover.', 5000);
    }
  };

  const summaryData = useMemo(() => {
    const available = forwardingStaff.filter(s => s.is_available).length;
    const busy = forwardingStaff.filter(s => s.presence_status === 'busy').length;
    return { available, busy, total: forwardingStaff.length };
  }, [forwardingStaff]);

  const handleSelectStaff = useCallback((staffId: number) => {
    const staff = forwardingStaff.find(s => s.staff_id === staffId);
    if (staff) {
      setSelectedStaffId(staffId);
      setSearchTerm('');
      setDebouncedSearch('');
    }
  }, [forwardingStaff]);

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to record shift handovers.
      </div>
    );
  }

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
    isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ArrowRightLeft className="w-5 h-5 opacity-90" aria-hidden />
            Shift handover
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Hand over your caseload to another staff member. All your active visits will be reassigned.
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
                <option value="">— Facility-wide —</option>
                {wards.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.name}
                    {w.code ? ` (${w.code})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Hand over to <span className="text-rose-500">*</span>
            <span className={`block text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              All your active visits will be reassigned to the selected staff member.
            </span>
          </label>

          {staffForwardingQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className="ml-2 text-sm text-gray-500">Loading staff...</span>
            </div>
          ) : staffForwardingQuery.isError ? (
            <div className={`py-6 text-center rounded-lg border ${cardShell}`}>
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Failed to load staff</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Unable to load staff list. Please try again.</p>
              <button
                type="button"
                onClick={() => staffForwardingQuery.refetch()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search staff..."
                    className={`${inputClass} pl-8`}
                  />
                  <User className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                {(['available', 'on_duty', 'busy', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFilterStatus(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                      filterStatus === f
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'available' ? 'Available' : f === 'on_duty' ? 'On Duty' : f === 'busy' ? 'Busy' : 'All'}
                  </button>
                ))}
              </div>

              {filteredStaff.length === 0 ? (
                <div className={`py-6 text-center rounded-lg border ${cardShell}`}>
                  <Users className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {debouncedSearch ? 'No staff match your search.' : 'No staff available.'}
                  </p>
                  {debouncedSearch ? (
                    <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }}
                      className="mt-2 text-xs text-blue-500 hover:underline cursor-pointer">Clear search</button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                    {paginatedStaff.map((staff) => {
                      const si = getStatusInfo(isDark, staff.presence_status);
                      const isSel = selectedStaffId === staff.staff_id;
                      const isYou = currentStaffId != null && staff.staff_id === currentStaffId;

                      return (
                        <div
                          key={staff.staff_id}
                          onClick={() => handleSelectStaff(staff.staff_id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSel
                              ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                              : isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {staff.full_name}
                                </span>
                                {isYou ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">you</span>
                                ) : null}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${si.bg} ${si.text}`}>{si.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                  {staff.role_code.replace(/_/g, ' ')}
                                </span>
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                  #{staff.employee_id}
                                </span>
                                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Activity className="w-3 h-3" />
                                  {staff.current_patient_count}/{staff.max_concurrent_patients}
                                </span>
                                {staff.current_space?.name ? (
                                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <DoorClosed className="w-3 h-3" />
                                    {staff.current_space.name}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {isSel ? (
                              <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            ) : (
                              <div className={`w-5 h-5 shrink-0 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 ? (
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {filteredStaff.length} staff — Page {safePage}/{totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button type="button" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}
                          className={`p-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}
                          className={`p-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-2 text-xs mt-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Available: {summaryData.available}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      Busy: {summaryData.busy}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      Total: {summaryData.total}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {selectedStaff ? (
            <div className={`mt-3 p-3 rounded-lg border ${cardShell}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Handing over to:</p>
              <div className="flex items-center gap-3">
                <User className={`w-8 h-8 p-1.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedStaff.full_name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedStaff.role_code.replace(/_/g, ' ')} — {selectedStaff.current_patient_count} active patients
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedStaffId(null)}
                  className={`ml-auto text-xs underline cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                  Change
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting || !selectedStaffId}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : 'Record handover & reassign visits'}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            disabled={submitting}
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
              {rows.map((row) => (
                <li key={row.id} className={`rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-200 bg-gray-50/80'}`}>
                  <div className={`flex flex-wrap justify-between gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <span>{new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>From {formatPerson(row.handed_over_by)} → To {formatPerson(row.handed_over_to)}</span>
                  </div>
                  {row.ward?.name ? <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Ward: {row.ward.name}</p> : null}
                  <p className={`text-sm mt-2 whitespace-pre-wrap break-words ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {row.summary.length > 480 ? `${row.summary.slice(0, 480)}…` : row.summary}
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
                  <button type="button" disabled={listPage <= 1} onClick={() => setListPage(p => p - 1)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                    }`}> <ChevronLeft className="w-4 h-4" /> Prev </button>
                  <button type="button" disabled={!meta || listPage >= meta.last_page} onClick={() => setListPage(p => p + 1)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
                    }`}> Next <ChevronRight className="w-4 h-4" /> </button>
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
