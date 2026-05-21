import React, { useMemo, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useFacilityTasks } from '../../api/facility-tasks/facilityTaskQueries';
import type {
  FacilityTask,
  FacilityTaskCategory,
  FacilityTaskPriority,
  FacilityTaskStatus,
} from '../../api/facility-tasks/facilityTaskTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface Props {
  theme: 'light' | 'dark';
}

const PRIORITY_STYLES: Record<
  FacilityTaskPriority,
  { label: string; classLight: string; classDark: string }
> = {
  low: {
    label: 'Low',
    classLight: 'bg-slate-100 text-slate-700 border-slate-200',
    classDark: 'bg-slate-800/80 text-slate-200 border-slate-600',
  },
  normal: {
    label: 'Normal',
    classLight: 'bg-blue-50 text-blue-800 border-blue-200',
    classDark: 'bg-blue-950/50 text-blue-200 border-blue-800',
  },
  high: {
    label: 'High',
    classLight: 'bg-amber-50 text-amber-900 border-amber-200',
    classDark: 'bg-amber-950/40 text-amber-100 border-amber-800',
  },
  urgent: {
    label: 'Urgent',
    classLight: 'bg-rose-50 text-rose-900 border-rose-200',
    classDark: 'bg-rose-950/40 text-rose-100 border-rose-800',
  },
};

const STATUS_LABEL: Record<FacilityTaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const CATEGORY_LABEL: Record<FacilityTaskCategory, string> = {
  patient_care: 'Patient care',
  ward_ops: 'Ward ops',
  medication: 'Medication',
  documentation: 'Documentation',
  clinical_escalation: 'Clinical escalation',
  other: 'Other',
};

function formatUserName(u: FacilityTask['assigned_to']): string {
  if (!u) return '—';
  if (u.display_name?.trim()) return u.display_name.trim();
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function formatDue(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const TaskHistoryView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;

  const [statusFilter, setStatusFilter] = useState<FacilityTaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<FacilityTaskPriority | ''>('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const query = useFacilityTasks({
    facilityId,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page,
    per_page: perPage,
    enabled: facilityId > 0,
  });

  const tasks: FacilityTask[] = useMemo(
    () => (Array.isArray(query.data?.data) ? query.data!.data : []),
    [query.data]
  );
  const meta = query.data?.meta;

  const busy = query.isFetching;

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to browse task history.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Clock3 className="w-5 h-5 opacity-90" aria-hidden />
            Task history
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            All facility tasks for this site. Filter by status or priority.
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

      <div className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 ${cardShell}`}>
        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="th-status">
          Status
        </label>
        <select
          id="th-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter((e.target.value as FacilityTaskStatus | '') || '');
            setPage(1);
          }}
          className={`rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
            isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className={`mx-1 h-4 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} aria-hidden />
        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="th-priority">
          Priority
        </label>
        <select
          id="th-priority"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter((e.target.value as FacilityTaskPriority | '') || '');
            setPage(1);
          }}
          className={`rounded-lg border px-2 py-1.5 text-sm cursor-pointer ${
            isDark ? 'bg-gray-950 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {query.isLoading ? (
        <LoadingSkeleton variant="list" rows={5} theme={isDark ? 'dark' : 'light'} />
      ) : tasks.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No tasks match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const pr = PRIORITY_STYLES[task.priority];
            return (
              <li key={task.id} className={`rounded-xl border p-4 ${cardShell}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border ${isDark ? pr.classDark : pr.classLight}`}
                      >
                        {pr.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border ${
                          isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {STATUS_LABEL[task.status]}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border ${
                          isDark ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {CATEGORY_LABEL[task.category]}
                      </span>
                    </div>
                    {task.description ? (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.description}</p>
                    ) : null}
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>Due: {formatDue(task.due_at)}</span>
                      {task.ward?.name ? <span>Ward: {task.ward.name}</span> : null}
                      <span>Assigned to: {formatUserName(task.assigned_to)}</span>
                      <span>From: {formatUserName(task.assigned_by)}</span>
                      {task.visit_uuid ? (
                        <span className="font-mono text-[11px] opacity-90" title="Visit UUID">
                          Visit: {task.visit_uuid}
                        </span>
                      ) : null}
                    </div>
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                      <span>Created: {formatWhen(task.created_at)}</span>
                      {task.completed_at ? <span>Completed: {formatWhen(task.completed_at)}</span> : null}
                      {task.cancelled_at ? <span>Cancelled: {formatWhen(task.cancelled_at)}</span> : null}
                    </div>
                    {task.status === 'cancelled' && task.cancellation_reason ? (
                      <p className={`text-xs mt-2 ${isDark ? 'text-rose-400/90' : 'text-rose-700'}`}>
                        Cancellation: {task.cancellation_reason}
                      </p>
                    ) : null}
                    {task.status === 'completed' && task.completion_notes ? (
                      <p className={`text-xs mt-2 ${isDark ? 'text-emerald-400/90' : 'text-emerald-800'}`}>
                        Completion notes: {task.completion_notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && meta.last_page > 1 ? (
        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${cardShell}`}>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Page {meta.current_page} of {meta.last_page} ({meta.total} tasks)
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

export default TaskHistoryView;
