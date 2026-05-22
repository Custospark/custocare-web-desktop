import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorClosed,
  Loader2,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useCreateFacilityTask } from '../../api/facility-tasks/facilityTaskQueries';
import type { FacilityTaskCategory, FacilityTaskPriority } from '../../api/facility-tasks/facilityTaskTypes';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { useGetStaffForForwarding, useGetVisitsByFacility } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { ForwardingStaff, StaffPresenceStatus, Visit } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { VisitStatus } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface Props { theme: 'light' | 'dark'; }

const CATEGORY_OPTIONS: { value: FacilityTaskCategory; label: string }[] = [
  { value: 'patient_care', label: 'Patient care' },
  { value: 'ward_ops', label: 'Ward operations' },
  { value: 'medication', label: 'Medication' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'clinical_escalation', label: 'Clinical escalation' },
  { value: 'other', label: 'Other' },
];

const STAFF_FORWARDING_FILTERS = { exclude_current_staff: false as const, limit: 150 };

type StaffFilterStatus = 'all' | 'on_duty' | 'busy' | 'available';

function localDatetimeToIso(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatVisitPickLabel(v: Visit): string {
  const pname = v.patient?.name?.trim() || `Patient #${v.patient_id}`;
  let s = 'Active';
  if (v.status === 'in_progress') s = 'In progress';
  return `${pname} · ${s} · visit #${v.id}`;
}

function getStatusBadge(isDark: boolean, status: StaffPresenceStatus) {
  const d = isDark;
  switch (status) {
    case 'on_duty': return { bg: d ? 'bg-emerald-900/60' : 'bg-emerald-100', text: d ? 'text-emerald-300' : 'text-emerald-800', label: 'On Duty' };
    case 'busy': return { bg: d ? 'bg-amber-900/60' : 'bg-amber-100', text: d ? 'text-amber-300' : 'text-amber-800', label: 'Busy' };
    case 'on_break': return { bg: d ? 'bg-blue-900/60' : 'bg-blue-100', text: d ? 'text-blue-300' : 'text-blue-800', label: 'Break' };
    default: return { bg: d ? 'bg-gray-800' : 'bg-gray-100', text: d ? 'text-gray-400' : 'text-gray-600', label: status ?? 'Unknown' };
  }
}

function filterAndSortStaff(staff: ForwardingStaff[], search: string, filter: StaffFilterStatus): ForwardingStaff[] {
  let f = staff;
  if (search.trim()) {
    const q = search.toLowerCase();
    f = f.filter(s => s.full_name.toLowerCase().includes(q) || s.role_code.toLowerCase().includes(q) || s.employee_id?.toLowerCase().includes(q));
  }
  switch (filter) {
    case 'available': f = f.filter(s => s.is_available); break;
    case 'on_duty': f = f.filter(s => s.presence_status === 'on_duty'); break;
    case 'busy': f = f.filter(s => s.presence_status === 'busy'); break;
  }
  return f.sort((a, b) => {
    if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
    const order: Record<string, number> = { on_duty: 0, busy: 1, on_break: 2, unavailable: 3, off_duty: 4 };
    return (order[a.presence_status] ?? 99) - (order[b.presence_status] ?? 99);
  });
}

const AssignTaskView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const currentStaffId = useAppSelector(getStaffId);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FacilityTaskCategory>('patient_care');
  const [priority, setPriority] = useState<FacilityTaskPriority>('normal');
  const [dueAtLocal, setDueAtLocal] = useState('');
  const [wardId, setWardId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [visitUuid, setVisitUuid] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StaffFilterStatus>('available');
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(searchTerm); setPage(1); }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchTerm]);

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const staffForwardingQuery = useGetStaffForForwarding(STAFF_FORWARDING_FILTERS, { enabled: facilityId > 0 });
  const visitsQuery = useGetVisitsByFacility(facilityId, { status: `${VisitStatus.ACTIVE},${VisitStatus.IN_PROGRESS}` as unknown as VisitStatus, per_page: 200 }, { enabled: facilityId > 0 });
  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });
  const createMutation = useCreateFacilityTask();

  const forwardingStaff: ForwardingStaff[] = useMemo(() => staffForwardingQuery.data?.data?.staff ?? [], [staffForwardingQuery.data]);

  const filteredStaff = useMemo(() => filterAndSortStaff(forwardingStaff, debouncedSearch, filterStatus), [forwardingStaff, debouncedSearch, filterStatus]);
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / 10));
  const safePage = Math.min(page, totalPages);
  const paginatedStaff = filteredStaff.slice((safePage - 1) * 10, safePage * 10);

  const selectedStaff = useMemo(() => forwardingStaff.find(s => s.staff_id === selectedStaffId) ?? null, [forwardingStaff, selectedStaffId]);

  const visitPicklist: Visit[] = useMemo(() => {
    const raw = visitsQuery.data?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return [...list].sort((a, b) => new Date(b.arrived_at).getTime() - new Date(a.arrived_at).getTime());
  }, [visitsQuery.data]);

  const wards: Ward[] = useMemo(() => (Array.isArray(wardsQuery.data) ? wardsQuery.data : []), [wardsQuery.data]);

  const summaryData = useMemo(() => ({
    available: forwardingStaff.filter(s => s.is_available).length,
    busy: forwardingStaff.filter(s => s.presence_status === 'busy').length,
    total: forwardingStaff.length,
  }), [forwardingStaff]);

  const handleSelectStaff = useCallback((staffId: number) => {
    setSelectedStaffId(staffId);
    setSearchTerm('');
    setDebouncedSearch('');
  }, []);

  const submitting = createMutation.isPending;

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('patient_care'); setPriority('normal');
    setDueAtLocal(''); setSelectedStaffId(null); setWardId(''); setVisitUuid('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    const t = title.trim();
    if (!t) { showToast('error', 'Enter a task title.', 4000); return; }
    if (!selectedStaff) { showToast('error', 'Select a staff member to assign this task.', 5000); return; }
    try {
      await createMutation.mutateAsync({
        facility_id: facilityId, title: t, description: description.trim() || null, category, priority,
        due_at: localDatetimeToIso(dueAtLocal), assigned_to_user_id: selectedStaff.user_id,
        ward_id: wardId ? Number(wardId) : null, visit_uuid: visitUuid.trim() || null,
      });
      showToast('success', 'Task created and assigned.', 4000);
      resetForm();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message) : '';
      showToast('error', msg || 'Could not create task.', 5000);
    }
  };

  if (!facilityId) {
    return <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
      Select an active facility to assign tasks.</div>;
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
            <UserPlus className="w-5 h-5 opacity-90" /> Assign task
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Delegate a task to any staff member with an active role at this facility.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className={`rounded-xl border p-5 space-y-4 ${cardShell}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-title">Title <span className="text-rose-500">*</span></label>
            <input id="at-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Short description of the task" autoComplete="off" required />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-category">Category</label>
            <select id="at-category" value={category} onChange={(e) => setCategory(e.target.value as FacilityTaskCategory)} className={inputClass}>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-desc">Description</label>
          <textarea id="at-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Optional details" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-priority">Priority</label>
            <select id="at-priority" value={priority} onChange={(e) => setPriority(e.target.value as FacilityTaskPriority)} className={inputClass}>
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-due">Due</label>
            <input id="at-due" type="datetime-local" value={dueAtLocal} onChange={(e) => setDueAtLocal(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-ward">Ward</label>
            {wardsQuery.isLoading ? <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} /> : (
              <select id="at-ward" value={wardId} onChange={(e) => setWardId(e.target.value)} className={inputClass}>
                <option value="">— None —</option>
                {wards.map(w => <option key={w.id} value={String(w.id)}>{w.name}{w.code ? ` (${w.code})` : ''}</option>)}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Assign to <span className="text-rose-500">*</span>
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
              <button type="button" onClick={() => staffForwardingQuery.refetch()} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer">Retry</button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="relative flex-1 min-w-[160px]">
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search staff..." className={`${inputClass} pl-8`} />
                  <User className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                {(['available', 'on_duty', 'busy', 'all'] as const).map(f => (
                  <button key={f} type="button" onClick={() => { setFilterStatus(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer ${
                      filterStatus === f ? 'bg-blue-600 text-white border-blue-600'
                        : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>{f === 'available' ? 'Available' : f === 'on_duty' ? 'On Duty' : f === 'busy' ? 'Busy' : 'All'}</button>
                ))}
              </div>

              {filteredStaff.length === 0 ? (
                <div className={`py-6 text-center rounded-lg border ${cardShell}`}>
                  <Users className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {debouncedSearch ? 'No staff match your search.' : 'No staff available.'}
                  </p>
                  {debouncedSearch ? <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="mt-2 text-xs text-blue-500 hover:underline cursor-pointer">Clear search</button> : null}
                </div>
              ) : (
                <>
                  <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                    {paginatedStaff.map((staff) => {
                      const badge = getStatusBadge(isDark, staff.presence_status);
                      const isSel = selectedStaffId === staff.staff_id;
                      const isYou = currentStaffId != null && staff.staff_id === currentStaffId;
                      return (
                        <div key={staff.staff_id} onClick={() => handleSelectStaff(staff.staff_id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSel ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                              : isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                          }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{staff.full_name}</span>
                                {isYou ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">you</span> : null}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{staff.role_code.replace(/_/g, ' ')}</span>
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>#{staff.employee_id}</span>
                                <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Activity className="w-3 h-3" />{staff.current_patient_count}/{staff.max_concurrent_patients}
                                </span>
                                {staff.current_space?.name ? (
                                  <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <DoorClosed className="w-3 h-3" />{staff.current_space.name}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {isSel ? <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                              : <div className={`w-5 h-5 shrink-0 rounded-full border ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 ? (
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{filteredStaff.length} staff — Page {safePage}/{totalPages}</span>
                      <div className="flex gap-1">
                        <button type="button" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}
                          className={`p-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <ChevronLeft className="w-4 h-4" /></button>
                        <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}
                          className={`p-1 rounded border text-xs cursor-pointer disabled:opacity-40 ${isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
                          <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-2 text-xs mt-2">
                    <span className="px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-800/60 dark:text-emerald-200">Available: {summaryData.available}</span>
                    <span className="px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/60 dark:text-amber-200">Busy: {summaryData.busy}</span>
                    <span className="px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100">Total: {summaryData.total}</span>
                  </div>
                </>
              )}
            </>
          )}

          {selectedStaff ? (
            <div className={`mt-3 p-3 rounded-lg border ${cardShell}`}>
              <div className="flex items-center gap-3">
                <User className={`w-8 h-8 p-1.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedStaff.full_name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedStaff.role_code.replace(/_/g, ' ')} — {selectedStaff.current_patient_count} active patients</p>
                </div>
                <button type="button" onClick={() => setSelectedStaffId(null)} className={`ml-auto text-xs underline cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Change</button>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="at-visit">Patient / visit (optional)</label>
          {visitsQuery.isLoading ? <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} /> : (
            <select id="at-visit" value={visitUuid} onChange={(e) => setVisitUuid(e.target.value)} className={inputClass}>
              <option value="">— No visit linked —</option>
              {visitPicklist.map(v => <option key={v.visit_uuid} value={v.visit_uuid}>{formatVisitPickLabel(v)}</option>)}
            </select>
          )}
          {!visitsQuery.isLoading && visitPicklist.length === 0 ? (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No active or in-progress visits at this facility.</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="submit" disabled={submitting || !selectedStaff}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>{submitting ? 'Creating…' : 'Create task'}</button>
          <button type="button" onClick={() => resetForm()}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}>Clear</button>
        </div>
      </form>
    </div>
  );
};

export default AssignTaskView;
