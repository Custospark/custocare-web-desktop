import React, { useCallback } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useHubFeedbackRoadmap, useVoteHubFeedback } from '../../api/feedback/useHubFeedbackQueries';

export interface FeedbackRoadmapViewProps {
  theme: 'light' | 'dark';
}

export function FeedbackRoadmapView({ theme }: FeedbackRoadmapViewProps) {
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error, refetch } = useHubFeedbackRoadmap();
  const voteMut = useVoteHubFeedback();
  const items = Array.isArray(data?.data) ? data!.data : [];

  const onVote = useCallback(
    async (uuid: string) => {
      try {
        const res = await voteMut.mutateAsync(uuid);
        imperativeToast.show('success', res.message ?? 'Vote saved.');
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        imperativeToast.show('error', msg ?? 'Could not record your vote.');
      }
    },
    [voteMut],
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Vote on ideas</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Feature requests that authors chose to list publicly. Vote once per idea; you cannot vote on your own
          submission.
        </p>
      </div>

      {isLoading && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-10 text-sm',
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading roadmap…
        </div>
      )}

      {isError && (
        <div
          className={cn('rounded-xl border px-4 py-3 text-sm', isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Could not load roadmap.'}
          <button
            type="button"
            className={cn('ml-3 underline', isDark ? 'text-cyan-300' : 'text-blue-700')}
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          No public feature ideas yet. When teammates submit feature requests and opt in to the roadmap, they will
          appear here.
        </p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((row) => (
            <li
              key={row.uuid}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between',
                isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white',
              )}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className={cn('font-medium leading-snug', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.subject}</p>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>{row.excerpt}</p>
                <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  {row.votes_count} vote{row.votes_count === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                disabled={row.voted_by_you || voteMut.isPending}
                onClick={() => void onVote(row.uuid)}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
                  row.voted_by_you
                    ? isDark
                      ? 'border-gray-700 text-gray-500'
                      : 'border-gray-200 text-gray-500'
                    : isDark
                      ? 'border-cyan-800 text-cyan-200 hover:bg-cyan-950/50'
                      : 'border-blue-200 text-blue-800 hover:bg-blue-50',
                  (row.voted_by_you || voteMut.isPending) && 'opacity-70',
                )}
              >
                <Heart className={cn('h-4 w-4', row.voted_by_you ? 'fill-current' : '')} aria-hidden />
                {row.voted_by_you ? 'Voted' : 'Vote'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FeedbackRoadmapView;
