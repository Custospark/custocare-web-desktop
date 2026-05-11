import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Headphones, Loader2, RefreshCw, Search } from 'lucide-react';
import { imperativeToast } from '../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../shared/utils/classNameUtils';
import type {
  HubSupportTicketCategory,
  HubSupportTicketPriority,
  HubSupportTicketStatus,
} from '../../custocare-hub/api/support/supportTicketTypes';
import {
  usePlatformHubSupportTicketDetail,
  usePlatformHubSupportTicketList,
  useUpdatePlatformHubSupportTicket,
  type PlatformHubSupportTicketDetailDto,
  type PlatformHubSupportTicketRowDto,
} from './api/usePlatformHubSupportTicketQueries';

export interface HubSupportTicketsAdminPageProps {
  theme: 'light' | 'dark';
}

const STATUSES: HubSupportTicketStatus[] = ['submitted', 'acknowledged', 'in_progress', 'resolved', 'closed'];
const CATEGORIES: HubSupportTicketCategory[] = ['account_issue', 'facility_issue', 'general'];
const PRIORITIES: HubSupportTicketPriority[] = ['low', 'medium', 'high'];

function categoryLabel(c: string): string {
  if (c === 'account_issue') return 'Account';
  if (c === 'facility_issue') return 'Facility';
  if (c === 'general') return 'General';
  return c;
}

const HubSupportTicketsAdminPage: React.FC<HubSupportTicketsAdminPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      priority: priorityFilter || undefined,
      q: appliedQ.trim() || undefined,
    }),
    [appliedQ, categoryFilter, priorityFilter, statusFilter],
  );

  const { data, isLoading, isError, error, refetch } = usePlatformHubSupportTicketList(filters);
  const detailQuery = usePlatformHubSupportTicketDetail(selectedId);
  const updateMut = useUpdatePlatformHubSupportTicket();

  const rows = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);
  const detail = detailQuery.data?.data;

  const onSearch = useCallback(() => {
    setAppliedQ(q);
  }, [q]);

  const onSaveDetail = useCallback(
    async (payload: {
      status?: HubSupportTicketStatus;
      priority?: HubSupportTicketPriority;
      staff_reply?: string | null;
      admin_internal_notes?: string | null;
    }) => {
      if (selectedId == null) return;
      try {
        await updateMut.mutateAsync({ id: selectedId, payload });
        imperativeToast.show('success', 'Saved.');
        void detailQuery.refetch();
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        imperativeToast.show('error', msg ?? 'Update failed.');
      }
    },
    [detailQuery, selectedId, updateMut],
  );

  const shell = cn('rounded-xl border', isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-blue-50 text-blue-600')}>
            <Headphones className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className={cn('text-xl font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
              Hub support tickets
            </h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Review tickets opened from the Custocare Hub Support Center, update status and priority, and reply to
              submitters.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
            isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
          )}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      <div className={cn('flex flex-col gap-3 p-4', shell, 'sm:flex-row sm:flex-wrap sm:items-end')}>
        <label className="block min-w-[140px] flex-1">
          <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Status</span>
          <select
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
            )}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[140px] flex-1">
          <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Category
          </span>
          <select
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
            )}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[140px] flex-1">
          <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Priority
          </span>
          <select
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
            )}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1 sm:max-w-md">
          <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Search subject or body
          </span>
          <div className="flex gap-2">
            <input
              className={cn(
                'min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Keywords…"
            />
            <button
              type="button"
              onClick={onSearch}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              <Search className="h-4 w-4" aria-hidden />
              Search
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Failed to load list.'}
        </div>
      )}

      <div className={cn('overflow-hidden', shell)}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-950/80' : 'border-gray-200 bg-gray-50')}>
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden />
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((row: PlatformHubSupportTicketRowDto) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'cursor-pointer border-t',
                      isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-gray-100 hover:bg-gray-50',
                      selectedId === row.id && (isDark ? 'bg-gray-800/80' : 'bg-blue-50/80'),
                    )}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2">{row.user_display}</td>
                    <td className="px-4 py-2">{categoryLabel(row.category)}</td>
                    <td className="px-4 py-2">{row.priority}</td>
                    <td className="max-w-xs truncate px-4 py-2 font-medium">{row.subject}</td>
                    <td className="px-4 py-2">{row.status}</td>
                  </tr>
                ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    No rows match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId != null && (
        <DetailPanel
          isDark={isDark}
          shell={shell}
          selectedId={selectedId}
          detail={detail}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          errorMessage={detailQuery.error?.response?.data?.message ?? detailQuery.error?.message}
          onClose={() => setSelectedId(null)}
          onSave={onSaveDetail}
          saving={updateMut.isPending}
        />
      )}
    </div>
  );
};

interface DetailPanelProps {
  isDark: boolean;
  shell: string;
  selectedId: number;
  detail: PlatformHubSupportTicketDetailDto | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSave: (p: {
    status?: HubSupportTicketStatus;
    priority?: HubSupportTicketPriority;
    staff_reply?: string | null;
    admin_internal_notes?: string | null;
  }) => void;
  saving: boolean;
}

function DetailPanel({
  isDark,
  shell,
  selectedId,
  detail,
  isLoading,
  isError,
  errorMessage,
  onClose,
  onSave,
  saving,
}: DetailPanelProps) {
  const [status, setStatus] = useState<HubSupportTicketStatus>('submitted');
  const [priority, setPriority] = useState<HubSupportTicketPriority>('medium');
  const [staffReply, setStaffReply] = useState('');
  const [internal, setInternal] = useState('');

  useEffect(() => {
    if (!detail) return;
    setStatus(detail.status as HubSupportTicketStatus);
    setPriority(detail.priority as HubSupportTicketPriority);
    setStaffReply(detail.staff_reply ?? '');
    setInternal(detail.admin_internal_notes ?? '');
  }, [detail]);

  return (
    <div className={cn('space-y-4 p-5', shell)}>
      <div className="flex items-start justify-between gap-2">
        <h2 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
          Support ticket #{selectedId}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={cn('text-sm underline', isDark ? 'text-gray-400' : 'text-gray-600')}
        >
          Close
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden />
        </div>
      )}
      {isError && <p className="text-sm text-red-600">{errorMessage ?? 'Could not load detail.'}</p>}

      {!isLoading && detail && (
        <div className="space-y-4">
          <div
            className={cn('rounded-lg border p-3 text-sm', isDark ? 'border-gray-800 bg-gray-950/50' : 'border-gray-100 bg-gray-50')}
          >
            <p>
              <span className="font-semibold">From: </span>
              {detail.user_display} (user #{detail.user_id})
            </p>
            <p className="mt-1">
              <span className="font-semibold">UUID: </span>
              {detail.uuid}
            </p>
            <p className="mt-1">
              <span className="font-semibold">Category: </span>
              {categoryLabel(detail.category)}
            </p>
            <p className={cn('mt-3 font-semibold', isDark ? 'text-gray-200' : 'text-gray-900')}>{detail.subject}</p>
            <p className={cn('mt-2 whitespace-pre-wrap', isDark ? 'text-gray-300' : 'text-gray-800')}>{detail.body}</p>
          </div>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Status</span>
            <select
              className={cn(
                'w-full max-w-md rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={status}
              onChange={(e) => setStatus(e.target.value as HubSupportTicketStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Priority
            </span>
            <select
              className={cn(
                'w-full max-w-md rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={priority}
              onChange={(e) => setPriority(e.target.value as HubSupportTicketPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Staff reply (visible to the submitter in Hub)
            </span>
            <textarea
              rows={4}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={staffReply}
              onChange={(e) => setStaffReply(e.target.value)}
            />
          </label>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Internal notes (not shown to users)
            </span>
            <textarea
              rows={3}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={internal}
              onChange={(e) => setInternal(e.target.value)}
            />
          </label>

          {Array.isArray(detail.timeline) && detail.timeline.length > 0 ? (
            <div className={cn('rounded-lg border p-3', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <p className={cn('text-sm font-semibold', isDark ? 'text-gray-200' : 'text-gray-900')}>Timeline</p>
              <ul className="mt-2 space-y-2 text-sm">
                {detail.timeline.map((t, idx) => (
                  <li
                    key={t.uuid ?? `${detail.uuid}-tl-${idx}`}
                    className={cn(
                      'rounded border px-2 py-1.5',
                      isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-100 bg-white',
                    )}
                  >
                    <span className="font-medium">{String(t.status)}</span>
                    {t.created_at ? (
                      <span className="ml-2 text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</span>
                    ) : null}
                    {t.note ? <p className="mt-1 whitespace-pre-wrap text-gray-600">{t.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onSave({
                  status,
                  priority,
                  staff_reply: staffReply.trim() || null,
                  admin_internal_notes: internal.trim() || null,
                })
              }
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60',
                isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HubSupportTicketsAdminPage;
