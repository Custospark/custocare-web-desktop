import React, { useMemo, useState } from 'react';
import { ListTodo, RefreshCw } from 'lucide-react';

import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useFacilityTasks, useUpdateFacilityTask } from '../../api/facility-tasks/facilityTaskQueries';
import type {
  FacilityTask,
  FacilityTaskPriority,
  FacilityTaskStatus,
  UpdateFacilityTaskPayload,
} from '../../api/facility-tasks/facilityTaskTypes';
import { cn } from '../../../../shared/utils/classNameUtils';

interface Props {
  theme: 'light' | 'dark';
}

const PRIORITY_STYLES: Record<
  FacilityTaskPriority,
  { label: string; classLight: string; classDark: string }
> = {
  low: { label: 'Low', classLight: 'bg-slate-100 text-slate-700', classDark: 'bg-slate-800/80 text-slate-200' },
  normal: { label: 'Normal', classLight: 'bg-blue-50 text-blue-800', classDark: 'bg-blue-950/50 text-blue-200' },
  high: { label: 'High', classLight: 'bg-amber-50 text-amber-900', classDark: 'bg-amber-950/40 text-amber-100' },
  urgent: { label: 'Urgent', classLight: 'bg-rose-50 text-rose-900', classDark: 'bg-rose-950/40 text-rose-100' },
};

const STATUS_LABEL: Record<FacilityTaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

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

const NursingEncounterTasksView: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const activeVisit = useAppSelector(selectActiveVisit);
  const visitUuid = activeVisit?.visit_uuid ?? '';
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const perPage = 25;

  const query = useFacilityTasks({
    facilityId,
    visit_uuid: visitUuid,
    page,
    per_page: perPage,
    enabled: facilityId > 0 && !!visitUuid,
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
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : '';
      showToast('error', msg || 'Could not update task.', 5000);
    }
  };

  const cardShell = isDark ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-white';

  const emptyVisit = useMemo(
    () => (
      <div
        className={cn(
          'rounded-xl border p-6 text-sm',
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        )}
      >
        Open a nursing encounter from <strong>Wards &amp; Patients</strong> or <strong>My ward patients</strong> so a visit is active in the workspace. Tasks listed here are scoped to{' '}
        <code className="text-xs">facility_tasks.visit_uuid</code>.
      </div>
    ),
    [isDark]
  );

  if (!facilityId) {
    return (
      <div
        className={cn(
          'rounded-xl border p-6 text-sm',
          isDark ? 'border-gray-700 bg-gray-900 text-gray-300' : 'border-gray-200 bg-white text-gray-600'
        )}
      >
        Select an active facility first.
      </div>
    );
  }

  if (!visitUuid) {
    return emptyVisit;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn('text-lg font-semibold flex items-center gap-2', isDark ? 'text-white' : 'text-gray-900')}>
            <ListTodo className="w-5 h-5 opacity-90" aria-hidden />
            Visit tasks
          </h2>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Facility tasks linked to this visit ({activeVisit?.patient?.name?.trim() || 'patient'}). Backend:{' '}
            <code className="text-xs">GET /facility-tasks?visit_uuid=…</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={busy}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer disabled:opacity-50',
            isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', busy ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <div className={cn('rounded-xl border divide-y', cardShell)}>
        {tasks.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            No tasks are assigned to this visit yet. Create tasks from <strong>Tasks &amp; Shifts → Assign task</strong> with this visit selected.
          </div>
        ) : (
          tasks.map((task) => {
            const due = formatDue(task.due_at);
            const ps = PRIORITY_STYLES[task.priority];
            return (
              <div key={task.id} className={cn('p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between')}>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>{task.title}</span>
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full',
                        isDark ? ps.classDark : ps.classLight
                      )}
                    >
                      {ps.label}
                    </span>
                    <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                  {task.description ? (
                    <p className={cn('text-sm line-clamp-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {task.description}
                    </p>
                  ) : null}
                  <p className={cn('text-xs', due.overdue ? 'text-rose-400' : isDark ? 'text-gray-500' : 'text-gray-500')}>
                    Due: {due.text}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {task.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => patchTask(task, { status: 'in_progress' })}
                      disabled={busy}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-50',
                        isDark ? 'border-blue-600 text-blue-300 hover:bg-blue-950/40' : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                      )}
                    >
                      Start
                    </button>
                  ) : null}
                  {task.status === 'in_progress' || task.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => patchTask(task, { status: 'completed' })}
                      disabled={busy}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50',
                        isDark ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700' : 'bg-emerald-600 text-white'
                      )}
                    >
                      Complete
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {meta && meta.last_page > 1 ? (
        <div className={cn('flex items-center justify-between text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg border cursor-pointer disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border cursor-pointer disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? (
        <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>Loading tasks…</p>
      ) : null}
    </div>
  );
};

export default NursingEncounterTasksView;
