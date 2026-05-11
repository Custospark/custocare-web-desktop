import { Loader2 } from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useHubFeedbackMine } from '../../api/feedback/useHubFeedbackQueries';

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export interface FeedbackMyRequestsViewProps {
  theme: 'light' | 'dark';
}

export function FeedbackMyRequestsView({ theme }: FeedbackMyRequestsViewProps) {
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error, refetch } = useHubFeedbackMine();
  const rows = Array.isArray(data?.data) ? data!.data : [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Your submissions</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Track status and any replies from the platform team for feedback and feature requests you have sent.
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
          Loading…
        </div>
      )}

      {isError && (
        <div
          className={cn('rounded-xl border px-4 py-3 text-sm', isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Could not load your submissions.'}
          <button
            type="button"
            className={cn('ml-3 cursor-pointer underline', isDark ? 'text-blue-300' : 'text-blue-700')}
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          You have not submitted anything yet. Use Submit Feedback or Request Feature to reach the platform team.
        </p>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.uuid}
              className={cn(
                'rounded-xl border p-4',
                isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn('font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.subject}</p>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800',
                  )}
                >
                  {STATUS_LABEL[row.status] ?? row.status}
                </span>
              </div>
              <p className={cn('mt-2 text-xs uppercase tracking-wide', isDark ? 'text-gray-500' : 'text-gray-500')}>
                {row.category === 'feature_request' ? 'Feature request' : 'Feedback'}
              </p>
              <p className={cn('mt-2 whitespace-pre-wrap text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {row.body}
              </p>
              {row.staff_reply ? (
                <div
                  className={cn(
                    'mt-3 rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-blue-900/50 bg-blue-950/30 text-blue-100' : 'border-blue-100 bg-blue-50 text-blue-900',
                  )}
                >
                  <span className="font-semibold">Team reply: </span>
                  {row.staff_reply}
                </div>
              ) : null}
              <p className={cn('mt-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                Ref. {row.uuid.slice(0, 8)}… ·{' '}
                {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FeedbackMyRequestsView;
