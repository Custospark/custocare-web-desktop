import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CirclePlay, ListTodo, RefreshCw, X } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useMyFacilityTasks, useUpdateFacilityTask } from '../../api/facility-tasks/facilityTaskQueries';
import type {
  FacilityTask,
  FacilityTaskPriority,
  FacilityTaskStatus,
  UpdateFacilityTaskPayload,
} from '../../api/facility-tasks/facilityTaskTypes';

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

function formatUserName(u: FacilityTask['assigned_by']): string {
  if (!u) return '—';
  if (u.display_name?.trim()) return u.display_name.trim();
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

function formatDue(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: 'No due date', overdue: false };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: '—', overdue: false };
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startDue = new Date(d);
  startDue.setHours(0, 0, 0, 0);
  const overdue = startDue.getTime() < startToday.getTime();
  return {
    text: d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    overdue,
  };
}

const MyTasksView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'open' | 'pending' | 'in_progress'>('open');
  const [priorityFilter, setPriorityFilter] = useState<FacilityTaskPriority | ''>('');
  const [page, setPage] = useState(1);
  const [completeFor, setCompleteFor] = useState<FacilityTask | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [cancelFor, setCancelFor] = useState<FacilityTask | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const statusParam = useMemo(() => {
    if (statusFilter === 'open') return undefined;
    if (statusFilter === 'pending') return 'pending';
    return 'in_progress';
  }, [statusFilter]);

  const query = useMyFacilityTasks({
    facilityId,
    status: statusParam,
    priority: priorityFilter || undefined,
    page,
    per_page: 15,
    enabled: facilityId > 0,
  });

  const updateMutation = useUpdateFacilityTask();

  const tasks = query.data?.data ?? [];
  const meta = query.data?.meta;

  const busy = query.isFetching || updateMutation.isPending;

  const patchTask = async (task: FacilityTask, patch: Omit<UpdateFacilityTaskPayload, 'facility_id'>) => {
    if (!facilityId) return;
    try {
      await updateMutation.mutateAsync({
        taskId: task.id,
        payload: { ...patch, facility_id: facilityId },
      });
      showToast('success', 'Task updated.', 3000);
      setCompleteFor(null);
      setCancelFor(null);
      setCompleteNotes('');
      setCancelReason('');
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message) : '';
      showToast('error', msg || 'Could not update task.', 5000);
    }
  };

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  if (!facilityId) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'}`}>
        Select an active facility to view tasks assigned to you.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <ListTodo className="w-5 h-5 opacity-90" aria-hidden />
            My Tasks
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tasks assigned to you in this facility. Use actions to update progress.
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
        <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Status</span>
        {(['open', 'pending', 'in_progress'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setStatusFilter(key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
              statusFilter === key
                ? isDark
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-blue-600 border-blue-600 text-white'
                : isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {key === 'open' ? 'Open' : key === 'pending' ? 'Pending' : 'In progress'}
          </button>
        ))}
        <span className={`mx-2 h-4 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} aria-hidden />
        <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} htmlFor="my-tasks-priority">
          Priority
        </label>
        <select
          id="my-tasks-priority"
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
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-2 ${isDark ? 'border-gray-600 border-t-blue-400' : 'border-gray-200 border-t-blue-600'}`} />
        </div>
      ) : tasks.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center ${cardShell}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No tasks match your filters.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const due = formatDue(task.due_at);
            const pr = PRIORITY_STYLES[task.priority];
            return (
              <li
                key={task.id}
                className={`rounded-xl border p-4 ${cardShell} ${due.overdue && task.status !== 'completed' && task.status !== 'cancelled' ? (isDark ? 'ring-1 ring-amber-700/50' : 'ring-1 ring-amber-300') : ''}`}
              >
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
                    </div>
                    {task.description ? (
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.description}</p>
                    ) : null}
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <span>
                        Due:{' '}
                        <span className={due.overdue ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>{due.text}</span>
                      </span>
                      {task.ward?.name ? <span>Ward: {task.ward.name}</span> : null}
                      <span>From: {formatUserName(task.assigned_by)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {task.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => patchTask(task, { status: 'in_progress' })}
                        disabled={busy}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-50 ${
                          isDark ? 'border-blue-700 text-blue-200 hover:bg-blue-950/50' : 'border-blue-300 text-blue-800 hover:bg-blue-50'
                        }`}
                      >
                        <CirclePlay className="w-3.5 h-3.5" />
                        Start
                      </button>
                    ) : null}
                    {task.status === 'pending' || task.status === 'in_progress' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteFor(task);
                            setCompleteNotes('');
                          }}
                          disabled={busy}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelFor(task);
                            setCancelReason('');
                          }}
                          disabled={busy}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-50 ${
                            isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta && meta.last_page > 1 ? (
        <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${cardShell}`}>
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Page {meta.current_page} of {meta.last_page} ({meta.total} tasks)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-md border disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {completeFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50 cursor-pointer" aria-label="Close" onClick={() => setCompleteFor(null)} />
          <div
            className={`relative z-10 w-full max-w-md rounded-xl border p-4 shadow-lg ${isDark ? 'border-gray-600 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-task-title"
          >
            <h4 id="complete-task-title" className="font-semibold">
              Complete task
            </h4>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{completeFor.title}</p>
            <label className="block text-xs font-medium mt-3 mb-1" htmlFor="complete-notes">
              Notes (optional)
            </label>
            <textarea
              id="complete-notes"
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'bg-gray-950 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCompleteFor(null)}
                className={`px-3 py-2 rounded-lg border text-sm cursor-pointer ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  patchTask(completeFor, {
                    status: 'completed',
                    completion_notes: completeNotes.trim() || undefined,
                  })
                }
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                Mark complete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50 cursor-pointer" aria-label="Close" onClick={() => setCancelFor(null)} />
          <div
            className={`relative z-10 w-full max-w-md rounded-xl border p-4 shadow-lg ${isDark ? 'border-gray-600 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
            role="dialog"
            aria-modal="true"
          >
            <h4 className="font-semibold">Cancel task</h4>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{cancelFor.title}</p>
            <label className="block text-xs font-medium mt-3 mb-1" htmlFor="cancel-reason">
              Reason
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'bg-gray-950 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCancelFor(null)}
                className={`px-3 py-2 rounded-lg border text-sm cursor-pointer ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  patchTask(cancelFor, {
                    status: 'cancelled',
                    cancellation_reason: cancelReason.trim() || undefined,
                  })
                }
                disabled={busy}
                className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                Cancel task
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MyTasksView;
