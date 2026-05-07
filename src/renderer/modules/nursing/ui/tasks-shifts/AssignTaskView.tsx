import React, { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useCreateFacilityTask } from '../../api/facility-tasks/facilityTaskQueries';
import type {
  FacilityTaskCategory,
  FacilityTaskPriority,
} from '../../api/facility-tasks/facilityTaskTypes';
import { useFacilityStaffAssignees } from '../../api/facility-tasks/useFacilityStaffAssignees';
import type { StaffAssigneeOption } from '../../api/facility-tasks/useFacilityStaffAssignees';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import {
  useGetStaffForForwarding,
  useGetVisitsByFacility,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import {
  VisitStatus,
  type ForwardingStaff,
  type Visit,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

interface Props {
  theme: 'light' | 'dark';
}

const CATEGORY_OPTIONS: { value: FacilityTaskCategory; label: string }[] = [
  { value: 'patient_care', label: 'Patient care' },
  { value: 'ward_ops', label: 'Ward operations' },
  { value: 'medication', label: 'Medication' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'clinical_escalation', label: 'Clinical escalation' },
  { value: 'other', label: 'Other' },
];

/** Same source as Medical Records → Visit action center → Forward (`/visits/staff/forwarding`). */
const STAFF_FORWARDING_FILTERS = { exclude_current_staff: false as const, limit: 150 };

/** API may return a non-array shape; `x ?? []` is not enough when `x` is a truthy object. */
function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function localDatetimeToIso(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function resolveAssigneeUserId(staff: ForwardingStaff, staffIdToUserId: Map<number, number>): number | null {
  if (typeof staff.user_id === 'number' && staff.user_id > 0) return staff.user_id;
  const mapped = staffIdToUserId.get(staff.staff_id);
  return mapped ?? null;
}

function formatVisitPickLabel(v: Visit): string {
  const pname = v.patient?.name?.trim() || `Patient #${v.patient_id}`;
  const statusLabel =
    v.status === VisitStatus.ACTIVE ? 'Active' : v.status === VisitStatus.IN_PROGRESS ? 'In progress' : String(v.status);
  return `${pname} · ${statusLabel} · visit #${v.id}`;
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
  const [assignedToUserId, setAssignedToUserId] = useState<string>('');
  const [wardId, setWardId] = useState<string>('');
  /** Selected visit UUID for `visit_uuid` on create; UI shows patient/visit context only. */
  const [visitUuid, setVisitUuid] = useState('');

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const staffUserMapQuery = useFacilityStaffAssignees(facilityId > 0 ? facilityId : null);
  const staffForwardingQuery = useGetStaffForForwarding(STAFF_FORWARDING_FILTERS, {
    enabled: facilityId > 0,
  });

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

  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });

  const createMutation = useCreateFacilityTask();

  const staffIdToUserId = useMemo(() => {
    const m = new Map<number, number>();
    for (const a of asArray<StaffAssigneeOption>(staffUserMapQuery.data)) {
      if (a.staffId > 0) m.set(a.staffId, a.userId);
    }
    return m;
  }, [staffUserMapQuery.data]);

  const forwardingStaff = useMemo(
    () => asArray<ForwardingStaff>(staffForwardingQuery.data?.data?.staff),
    [staffForwardingQuery.data]
  );

  const assigneeOptions = useMemo(() => {
    const byUserId = new Map<number, { userId: number; label: string }>();
    for (const s of forwardingStaff) {
      const uid = resolveAssigneeUserId(s, staffIdToUserId);
      if (uid == null) continue;
      if (byUserId.has(uid)) continue;
      const you = currentStaffId != null && s.staff_id === currentStaffId ? ' (you)' : '';
      byUserId.set(uid, {
        userId: uid,
        label: `${s.full_name}${you} — ${s.role_code}`,
      });
    }
    return [...byUserId.values()].sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }, [forwardingStaff, staffIdToUserId, currentStaffId]);

  const visitPicklist = useMemo(() => {
    const byId = new Map<number, Visit>();
    const activeList = asArray<Visit>(activeVisitsQuery.data?.data);
    const inProgressList = asArray<Visit>(inProgressVisitsQuery.data?.data);
    for (const v of [...activeList, ...inProgressList]) {
      byId.set(v.id, v);
    }
    return [...byId.values()].sort((a, b) => {
      const ta = new Date(a.arrived_at).getTime();
      const tb = new Date(b.arrived_at).getTime();
      return tb - ta;
    });
  }, [activeVisitsQuery.data, inProgressVisitsQuery.data]);

  const wards = asArray<Ward>(wardsQuery.data);

  const staffLoadError = staffForwardingQuery.isError || staffUserMapQuery.isError;
  const unmappedForwardingCount = useMemo(() => {
    let n = 0;
    for (const s of forwardingStaff) {
      if (resolveAssigneeUserId(s, staffIdToUserId) == null) n += 1;
    }
    return n;
  }, [forwardingStaff, staffIdToUserId]);

  const visitsLoading = activeVisitsQuery.isLoading || inProgressVisitsQuery.isLoading;
  const busy =
    staffUserMapQuery.isFetching ||
    staffForwardingQuery.isFetching ||
    visitsLoading ||
    wardsQuery.isFetching ||
    createMutation.isPending;

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
    isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('patient_care');
    setPriority('normal');
    setDueAtLocal('');
    setAssignedToUserId('');
    setWardId('');
    setVisitUuid('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;

    const t = title.trim();
    if (!t) {
      showToast('error', 'Enter a task title.', 4000);
      return;
    }

    const uid = assignedToUserId ? Number(assignedToUserId) : NaN;
    if (!Number.isFinite(uid) || uid <= 0) {
      showToast('error', 'Select a staff member to assign this task.', 5000);
      return;
    }

    try {
      await createMutation.mutateAsync({
        facility_id: facilityId,
        title: t,
        description: description.trim() || null,
        category,
        priority,
        due_at: localDatetimeToIso(dueAtLocal),
        assigned_to_user_id: uid,
        ward_id: wardId ? Number(wardId) : null,
        visit_uuid: visitUuid.trim() || null,
      });
      showToast('success', 'Task created and assigned.', 4000);
      resetForm();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not create task.', 5000);
    }
  };

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to assign tasks.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <UserPlus className="w-5 h-5 opacity-90" aria-hidden />
            Assign task
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Staff come from the same forwarding list as Medical Records (visit action center → Forward):{' '}
            <code className="text-xs opacity-90">/visits/staff/forwarding</code> with the current user included. Assignee is saved as{' '}
            <code className="text-xs opacity-90">assigned_to_user_id</code> (resolved from API or active facility role assignment).
          </p>
        </div>
      </div>

      <form onSubmit={submit} className={`rounded-xl border p-5 space-y-4 ${cardShell}`}>
        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-title">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="assign-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Short description of the task"
            autoComplete="off"
            disabled={busy}
            required
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-desc">
            Description
          </label>
          <textarea
            id="assign-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[88px] resize-y`}
            placeholder="Optional details"
            disabled={busy}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-category">
              Category
            </label>
            <select
              id="assign-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FacilityTaskCategory)}
              className={inputClass}
              disabled={busy}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-priority">
              Priority
            </label>
            <select
              id="assign-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as FacilityTaskPriority)}
              className={inputClass}
              disabled={busy}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-due">
              Due
            </label>
            <input
              id="assign-due"
              type="datetime-local"
              value={dueAtLocal}
              onChange={(e) => setDueAtLocal(e.target.value)}
              className={inputClass}
              disabled={busy}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-ward">
              Ward (optional)
            </label>
            <select
              id="assign-ward"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className={inputClass}
              disabled={busy || wardsQuery.isLoading}
            >
              <option value="">— None —</option>
              {wards.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                  {w.code ? ` (${w.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-staff">
            Assign to <span className="text-rose-500">*</span>
          </label>
          <select
            id="assign-staff"
            value={assignedToUserId}
            onChange={(e) => setAssignedToUserId(e.target.value)}
            className={inputClass}
            disabled={busy || staffForwardingQuery.isLoading}
            required
          >
            <option value="">— Select staff —</option>
            {assigneeOptions.map((a) => (
              <option key={a.userId} value={String(a.userId)}>
                {a.label}
              </option>
            ))}
          </select>
          {staffLoadError ? (
            <p className={`text-xs mt-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              Could not load staff forwarding or facility role map.
            </p>
          ) : null}
          {!staffForwardingQuery.isLoading &&
          forwardingStaff.length > 0 &&
          assigneeOptions.length === 0 &&
          !staffLoadError ? (
            <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
              No assignees could be linked to a user id. Ensure facility staff roles are active or the forwarding API returns{' '}
              <code className="text-xs">user_id</code>.
            </p>
          ) : null}
          {unmappedForwardingCount > 0 && assigneeOptions.length > 0 ? (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {unmappedForwardingCount} forwarding row(s) omitted (no user id).
            </p>
          ) : null}
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-visit-patient">
            Patient / visit (optional)
          </label>
          <select
            id="assign-visit-patient"
            value={visitUuid}
            onChange={(e) => setVisitUuid(e.target.value)}
            className={inputClass}
            disabled={busy || visitsLoading}
          >
            <option value="">— No visit linked —</option>
            {visitPicklist.map((v) => (
              <option key={v.visit_uuid} value={v.visit_uuid}>
                {formatVisitPickLabel(v)}
              </option>
            ))}
          </select>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Lists visits with status <strong className="font-medium">active</strong> or <strong className="font-medium">in progress</strong>{' '}
            at this facility. The task stores the visit UUID only.
          </p>
          {!visitsLoading && visitPicklist.length === 0 ? (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No active or in-progress visits found.</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {createMutation.isPending ? 'Creating…' : 'Create task'}
          </button>
          <button
            type="button"
            onClick={() => resetForm()}
            disabled={busy}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm border cursor-pointer disabled:opacity-50 ${
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignTaskView;
