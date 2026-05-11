import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Loader2, Search } from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { usePublishedSupportFaqs } from '../../api/support/useSupportFaqQueries';

export interface SupportFaqsViewProps {
  theme: 'light' | 'dark';
  /** `search` emphasizes the search field (Support Center → Search Help); `browse` for View FAQs. */
  variant: 'search' | 'browse';
}

export function SupportFaqsView({ theme, variant }: SupportFaqsViewProps) {
  const isDark = theme === 'dark';
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), 400);
    return () => window.clearTimeout(t);
  }, [input]);

  const searchParam = debounced.length > 0 ? debounced : undefined;
  const { data, isLoading, isError, error, refetch } = usePublishedSupportFaqs(searchParam);
  const items = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);

  const heading = variant === 'search' ? 'Search help' : 'Frequently asked questions';
  const sub =
    variant === 'search'
      ? 'Search published answers from the platform team. Same knowledge base as “View FAQs”, with search up front.'
      : 'Answers maintained by your platform administrators. Open a row to read the full response.';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-blue-50 text-blue-600')}>
            <HelpCircle className="h-7 w-7 shrink-0" aria-hidden />
          </div>
          <div>
            <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>{heading}</h3>
            <p className={cn('mt-1 max-w-2xl text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{sub}</p>
          </div>
        </div>
      </div>

      <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', isDark ? '' : '')}>
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
            placeholder="Search questions and answers…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search FAQs"
          />
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold',
            isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
          )}
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-12 text-sm',
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading answers…
        </div>
      )}

      {isError && (
        <div
          className={cn('rounded-xl border px-4 py-3 text-sm', isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Could not load FAQs.'}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {debounced
            ? 'No published answers match that search yet. Try different keywords, or ask the platform team to add an FAQ.'
            : 'No published FAQs yet. When administrators add entries in Platform Administration, they will appear here.'}
        </p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="space-y-2">
          <p className={cn('text-xs font-medium uppercase tracking-wide', isDark ? 'text-gray-500' : 'text-gray-500')}>
            {items.length} article{items.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <details
                key={item.uuid}
                name="custocare-hub-faq"
                className={cn(
                  'group rounded-xl border transition-colors',
                  isDark ? 'border-gray-800 bg-gray-900/40 open:border-cyan-900/50' : 'border-gray-200 bg-white open:border-blue-200',
                )}
              >
                <summary
                  className={cn(
                    'cursor-pointer list-none px-4 py-3 pr-10 text-sm font-semibold leading-snug outline-none [&::-webkit-details-marker]:hidden',
                    isDark ? 'text-gray-100 hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-50',
                  )}
                >
                  <span className="block">{item.question}</span>
                </summary>
                <div
                  className={cn(
                    'border-t px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    isDark ? 'border-gray-800 text-gray-300' : 'border-gray-100 text-gray-700',
                  )}
                >
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
          <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
            Panels use an exclusive accordion where your browser supports it (same group name on each entry).
          </p>
        </div>
      )}
    </div>
  );
}

export function SupportTicketsPlaceholder({
  theme,
  actionKey,
}: {
  theme: 'light' | 'dark';
  actionKey: 'open-ticket' | 'track-ticket';
}) {
  const isDark = theme === 'dark';
  const title = actionKey === 'open-ticket' ? 'Open a ticket' : 'Track a ticket';
  const body =
    actionKey === 'open-ticket'
      ? 'Guided ticketing from the hub is not enabled yet. For product feedback or feature ideas, use Feedback & Requests in this hub. For account or facility issues, contact your administrator or platform support through your usual channel.'
      : 'Ticket tracking from the hub is not enabled yet. If you submitted feedback under Feedback & Requests, open Track request status there to follow progress.';

  return (
    <div className="space-y-2">
      <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>{title}</h3>
      <p className={cn('max-w-2xl text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>{body}</p>
    </div>
  );
}
