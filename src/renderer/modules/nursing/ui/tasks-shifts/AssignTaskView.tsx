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
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import {
  useGetStaffForForwarding,
  useGetVisitsByFacility,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import type { ForwardingStaff, Visit } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

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

const STAFF_FORWARDING_FILTERS = { exclude_current_staff: false as const, limit: 150 };

function localDatetimeToIso(local: string): string | null {
  const t = local.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatVisitPickLabel(v: Visit): string {
  const pname = v.patient?.name?.trim() || `Patient #${v.patient_id}`;
  let statusLabel = 'Active';
  if (v.status === 'in_progress') statusLabel = 'In progress';
  else if (v.status === 'active') statusLabel = 'Active';
  else statusLabel = String(v.status);
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
  const [visitUuid, setVisitUuid] = useState('');

  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const staffForwardingQuery = useGetStaffForForwarding(STAFF_FORWARDING_FILTERS, {
    enabled: facilityId > 0,
  });

  const visitsQuery = useGetVisitsByFacility(
    facilityId,
    { status: 'active,in_progress', per_page: 200 },
    { enabled: facilityId > 0 }
  );

  const wardsQuery = useGetWards(wardFilters, { enabled: facilityId > 0 });

  const createMutation = useCreateFacilityTask();

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

  const visitPicklist: Visit[] = useMemo(() => {
    const raw = visitsQuery.data?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return [...list].sort((a, b) => {
      const ta = new Date(a.arrived_at).getTime();
      const tb = new Date(b.arrived_at).getTime();
      return tb - ta;
    });
  }, [visitsQuery.data]);

  const wards: Ward[] = useMemo(
    () => (Array.isArray(wardsQuery.data) ? wardsQuery.data : []),
    [wardsQuery.data]
  );

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

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm ${
    isDark ? 'bg-gray-950 border-gray-600 text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;
  const submitting = createMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <UserPlus className="w-5 h-5 opacity-90" aria-hidden />
            Assign task
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Delegate a task to any staff member with an active role at this facility.
            Your name is marked as <strong>(you)</strong>.
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
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-ward">
              Ward (optional)
            </label>
            {wardsQuery.isLoading ? (
              <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
            ) : (
              <select
                id="assign-ward"
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className={inputClass}
              >
                <option value="">— None —</option>
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
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-staff">
            Assign to <span className="text-rose-500">*</span>
          </label>
          {staffForwardingQuery.isLoading ? (
            <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
          ) : (
            <>
              <select
                id="assign-staff"
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">— Select staff —</option>
                {assigneeOptions.map((a) => (
                  <option key={a.userId} value={String(a.userId)}>
                    {a.label}
                  </option>
                ))}
              </select>
              {staffForwardingQuery.isError ? (
                <p className={`text-xs mt-1 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                  Could not load staff list. Try refreshing.
                </p>
              ) : null}
              {!staffForwardingQuery.isError && assigneeOptions.length === 0 && !staffForwardingQuery.isLoading ? (
                <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                  No staff with active roles found at this facility.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="assign-visit-patient">
            Patient / visit (optional)
          </label>
          {visitsQuery.isLoading ? (
            <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
          ) : (
            <>
              <select
                id="assign-visit-patient"
                value={visitUuid}
                onChange={(e) => setVisitUuid(e.target.value)}
                className={inputClass}
              >
                <option value="">— No visit linked —</option>
                {visitPicklist.map((v) => (
                  <option key={v.visit_uuid} value={v.visit_uuid}>
                    {formatVisitPickLabel(v)}
                  </option>
                ))}
              </select>
              {visitPicklist.length === 0 ? (
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No active or in-progress visits at this facility.</p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {submitting ? 'Creating…' : 'Create task'}
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
    </div>
  );
};

export default AssignTaskView;
