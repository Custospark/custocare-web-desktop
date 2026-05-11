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
import { getNursingEncounterChrome } from './nursingEncounterChrome';

interface Props {
  theme: 'light' | 'dark';
}

const PRIORITY_STYLES: Record<
  FacilityTaskPriority,
  { label: string; classLight: string; classDark: string }
> = {
  low: { label: 'Low', classLight: 'bg-slate-100 text-slate-800', classDark: 'bg-slate-800 text-slate-100' },
  normal: { label: 'Normal', classLight: 'bg-blue-50 text-blue-900', classDark: 'bg-blue-950/70 text-blue-100' },
  high: { label: 'High', classLight: 'bg-amber-50 text-amber-950', classDark: 'bg-amber-950/55 text-amber-50' },
  urgent: { label: 'Urgent', classLight: 'bg-rose-50 text-rose-950', classDark: 'bg-rose-950/55 text-rose-50' },
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
  const chrome = getNursingEncounterChrome(theme);
  const { isDark } = chrome;
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

  const emptyVisit = useMemo(() => {
    const c = getNursingEncounterChrome(theme);
    return (
      <div className={c.emptyPanel}>
        <p className={cn(c.body)}>
          Open a nursing encounter from <strong className={c.heading}>Wards &amp; Patients</strong> or{' '}
          <strong className={c.heading}>My ward patients</strong> so a visit is active in the workspace. Tasks listed here are scoped to{' '}
          <code className={c.code}>facility_tasks.visit_uuid</code>.
        </p>
      </div>
    );
  }, [theme]);

  if (!facilityId) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={chrome.body}>Select an active facility first.</p>
      </div>
    );
  }

  if (!visitUuid) {
    return emptyVisit;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', chrome.heading)}>
            <ListTodo className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            Visit tasks
          </h2>
          <p className={cn('text-sm leading-snug', chrome.subhead)}>
            Facility tasks linked to this patient ({activeVisit?.patient?.name?.trim() || 'patient'}).
          </p>
        </div>
        <button type="button" onClick={() => query.refetch()} disabled={busy} className={cn(chrome.btnSecondary, 'shrink-0 cursor-pointer')}>
          <RefreshCw className={cn('h-4 w-4 shrink-0', busy ? 'animate-spin' : '')} aria-hidden />
          Refresh
        </button>
      </header>

      <div className={cn(chrome.card, 'divide-y', chrome.divide)}>
        {tasks.length === 0 && !query.isLoading ? (
          <div className={cn('p-6 text-sm leading-relaxed', chrome.muted)}>
            No tasks are assigned to this visit yet. Create tasks from <strong className={chrome.body}>Tasks &amp; Shifts → Assign task</strong> with this visit selected.
          </div>
        ) : (
          tasks.map((task) => {
            const due = formatDue(task.due_at);
            const ps = PRIORITY_STYLES[task.priority];
            return (
              <div key={task.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-medium', chrome.rowTitle)}>{task.title}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        isDark ? ps.classDark : ps.classLight
                      )}
                    >
                      {ps.label}
                    </span>
                    <span className={cn('text-xs font-medium', chrome.subtle)}>{STATUS_LABEL[task.status]}</span>
                  </div>
                  {task.description ? (
                    <p className={cn('line-clamp-2 text-sm leading-relaxed', chrome.body)}>{task.description}</p>
                  ) : null}
                  <p
                    className={cn(
                      'text-xs font-medium',
                      due.overdue ? (isDark ? 'text-rose-300' : 'text-rose-700') : chrome.subtle
                    )}
                  >
                    Due: {due.text}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {task.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => patchTask(task, { status: 'in_progress' })}
                      disabled={busy}
                      className={cn(
                        'cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                        isDark
                          ? 'border-sky-600/80 bg-slate-950 text-sky-100 hover:bg-sky-950/50'
                          : 'border-sky-400 bg-white text-sky-900 hover:bg-sky-50'
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
                        'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50',
                        isDark
                          ? 'border border-emerald-700/80 bg-emerald-950/50 text-emerald-100 hover:bg-emerald-950'
                          : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
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
        <div className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', chrome.muted)}>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(chrome.btnPaging, 'cursor-pointer')}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page || busy}
              onClick={() => setPage((p) => p + 1)}
              className={cn(chrome.btnPaging, 'cursor-pointer')}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {query.isLoading ? <p className={cn('text-sm', chrome.muted)}>Loading tasks…</p> : null}
    </div>
  );
};

export default NursingEncounterTasksView;
