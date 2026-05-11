import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import type { HubSupportTicketDto, HubSupportTicketStatus } from '../../api/support/supportTicketTypes';
import { useHubSupportTicketDetail } from '../../api/support/useSupportTicketQueries';

export interface SupportTicketsTrackViewProps {
  theme: 'light' | 'dark';
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function formatMaybeDate(d: string | null | undefined) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export function SupportTicketsTrackView({ theme }: SupportTicketsTrackViewProps) {
  const isDark = theme === 'dark';

  const [inputRef, setInputRef] = useState('');
  const [lookupRef, setLookupRef] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useHubSupportTicketDetail(lookupRef);
  const ticket: HubSupportTicketDto | null = data?.data ? data.data : null;

  const shell = useMemo(
    () => cn('rounded-xl border p-5', isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'),
    [isDark],
  );

  const onSubmit = () => {
    const ref = inputRef.trim();
    if (!ref) {
      imperativeToast.show('warning', 'Please enter a ticket reference.');
      return;
    }
    setLookupRef(ref);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Track a ticket</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Enter your ticket reference to see current status and updates.
        </p>
      </div>

      <div className={shell}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-lg">
            <Search
              className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-gray-500' : 'text-gray-400')}
              aria-hidden
            />
            <input
              type="search"
              className={cn(
                'w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              placeholder="Ticket reference (UUID)…"
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              aria-label="Ticket reference"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSubmit()}
              disabled={isLoading}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60',
                isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Track'}
            </button>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={!lookupRef || isLoading}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-60',
                isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
              )}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-12 text-sm',
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading ticket…
        </div>
      )}

      {isError && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Could not load the ticket.'}
        </div>
      )}

      {!isLoading && !isError && ticket ? (
        <div className="space-y-3">
          <div
            className={cn(
              'rounded-xl border p-4',
              isDark ? 'border-gray-800 bg-gray-900/40 text-gray-100' : 'border-gray-200 bg-white text-gray-900',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{ticket.subject}</p>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800',
                )}
              >
                {STATUS_LABEL[ticket.status] ?? (ticket.status as HubSupportTicketStatus)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-500">{ticket.body}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                Ref: <span className="font-mono">{ticket.uuid}</span>
              </span>
              {ticket.priority ? <span>Priority: {ticket.priority}</span> : null}
              {ticket.category ? <span>Category: {ticket.category}</span> : null}
              <span>Created: {formatMaybeDate(ticket.created_at)}</span>
            </div>
          </div>

          {ticket.staff_reply ? (
            <div
              className={cn(
                'rounded-xl border p-4',
                isDark ? 'border-blue-900/50 bg-blue-950/30 text-blue-100' : 'border-blue-100 bg-blue-50 text-blue-900',
              )}
            >
              <p className="font-semibold">Team reply</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{ticket.staff_reply}</p>
            </div>
          ) : null}

          {Array.isArray(ticket.timeline) && ticket.timeline.length > 0 ? (
            <div className={cn('rounded-xl border p-4', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <p className="font-semibold">Updates</p>
              <ul className="mt-3 space-y-2">
                {ticket.timeline.map((t, idx) => (
                  <li
                    // idx is acceptable for static timeline ordering from the backend.
                    key={t.uuid ?? `${ticket.uuid}-t-${idx}`}
                    className={cn('rounded-lg border px-3 py-2 text-sm', isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-100 bg-white')}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{STATUS_LABEL[t.status] ?? String(t.status)}</span>
                      <span className="text-xs text-gray-500">{formatMaybeDate(t.created_at)}</span>
                    </div>
                    {t.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{t.note}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !isError && lookupRef && !ticket ? (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          No ticket found for that reference.
        </p>
      ) : null}
    </div>
  );
}

export default SupportTicketsTrackView;

