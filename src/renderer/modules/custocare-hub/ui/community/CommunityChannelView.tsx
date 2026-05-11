import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Loader2, MessageCircle } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { custocareHubActionPath } from '../../../../app/routes/constants/custocare-hub.paths';
import { cn } from '../../../../shared/utils/classNameUtils';
import type { HubCommunityChannel } from '../../api/community/hubCommunityTypes';
import {
  useCreateHubCommunityComment,
  useHubCommunityPostDetail,
  useHubCommunityPosts,
} from '../../api/community/useHubCommunityQueries';

export interface CommunityChannelViewProps {
  theme: 'light' | 'dark';
  channel: HubCommunityChannel;
  heading: string;
  description: string;
}

export function CommunityChannelView({ theme, channel, heading, description }: CommunityChannelViewProps) {
  const isDark = theme === 'dark';
  const readOnly = channel === 'product_update';
  const [page, setPage] = useState(1);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const listQuery = useHubCommunityPosts(channel, page);
  const detailQuery = useHubCommunityPostDetail(selectedUuid, { enabled: !!selectedUuid });

  const rows = Array.isArray(listQuery.data?.data) ? listQuery.data!.data : [];
  const meta = listQuery.data?.meta;

  const detail = detailQuery.data?.data;

  const commentMut = useCreateHubCommunityComment();
  const [commentDraft, setCommentDraft] = useState('');

  const onSubmitComment = useCallback(async () => {
    if (!selectedUuid || !commentDraft.trim()) return;
    try {
      const res = await commentMut.mutateAsync({ postUuid: selectedUuid, body: commentDraft.trim() });
      imperativeToast.show('success', res.message ?? 'Comment posted.');
      setCommentDraft('');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      imperativeToast.show('error', msg ?? 'Could not post comment.');
    }
  }, [commentDraft, commentMut, selectedUuid]);

  const pagination = useMemo(() => {
    if (!meta) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
        <span className={cn(isDark ? 'text-gray-500' : 'text-gray-600')}>
          Page {meta.current_page} of {meta.last_page} ({meta.total} posts)
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={meta.current_page <= 1 || listQuery.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              'cursor-pointer rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:opacity-40',
              isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
            )}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={meta.current_page >= meta.last_page || listQuery.isFetching}
            onClick={() => setPage((p) => p + 1)}
            className={cn(
              'cursor-pointer rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:opacity-40',
              isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
            )}
          >
            Next
          </button>
        </div>
      </div>
    );
  }, [isDark, listQuery.isFetching, meta]);

  if (selectedUuid && detailQuery.isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border px-4 py-10 text-sm',
          isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600',
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading post…
      </div>
    );
  }

  if (selectedUuid && (detailQuery.isError || !detail)) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelectedUuid(null)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 text-sm font-medium',
            isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="alert"
        >
          {detailQuery.error?.response?.data?.message ?? detailQuery.error?.message ?? 'Could not load this post.'}
        </div>
      </div>
    );
  }

  if (selectedUuid && detail) {
    const { post, comments } = detail;
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setSelectedUuid(null);
            setCommentDraft('');
          }}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 text-sm font-medium',
            isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <article
          className={cn(
            'rounded-xl border p-4 sm:p-5',
            isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white',
          )}
        >
          <h3 className={cn('text-xl font-semibold tracking-tight', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {post.title}
          </h3>
          <p className={cn('mt-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
            {post.author.display_name} · {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
          </p>
          <div
            className={cn(
              'mt-4 whitespace-pre-wrap text-sm leading-relaxed',
              isDark ? 'text-gray-200' : 'text-gray-800',
            )}
          >
            {post.body}
          </div>
        </article>

        {!readOnly && (
          <section className="space-y-3">
            <h4 className={cn('text-sm font-semibold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Comments ({comments.length})
            </h4>
            {comments.length === 0 ? (
              <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-600')}>
                No comments yet. Be the first to reply.
              </p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li
                    key={c.uuid}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm',
                      isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-gray-50',
                    )}
                  >
                    <p className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {c.author.display_name} · {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                    </p>
                    <p className={cn('mt-1 whitespace-pre-wrap', isDark ? 'text-gray-200' : 'text-gray-800')}>{c.body}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <label htmlFor="hub-community-comment" className="sr-only">
                Add a comment
              </label>
              <textarea
                id="hub-community-comment"
                rows={3}
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment…"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  isDark
                    ? 'border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-600 focus:ring-blue-600/40'
                    : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500/30',
                )}
              />
              <button
                type="button"
                disabled={!commentDraft.trim() || commentMut.isPending}
                onClick={() => void onSubmitComment()}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
                  isDark ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700',
                )}
              >
                {commentMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Post comment
              </button>
            </div>
          </section>
        )}

        {readOnly && (
          <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-600')}>
            Product updates are read-only. Platform administrators publish them from Platform Administration → Hub product
            updates.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>{heading}</h3>
          <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{description}</p>
        </div>
        {!readOnly && (
          <Link
            to={`${custocareHubActionPath('community', 'create-post')}?channel=${channel}`}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
              isDark
                ? 'border-blue-700/50 text-blue-200 hover:bg-gray-800'
                : 'border-blue-200 text-blue-700 hover:bg-blue-50',
            )}
          >
            New post
          </Link>
        )}
      </div>

      {listQuery.isLoading && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-10 text-sm',
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading posts…
        </div>
      )}

      {listQuery.isError && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="alert"
        >
          {listQuery.error?.response?.data?.message ?? listQuery.error?.message ?? 'Could not load posts.'}
          <button
            type="button"
            className={cn('ml-3 cursor-pointer underline', isDark ? 'text-blue-300' : 'text-blue-700')}
            onClick={() => void listQuery.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {!listQuery.isLoading && !listQuery.isError && rows.length === 0 && (
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>No posts in this channel yet.</p>
      )}

      {!listQuery.isLoading && !listQuery.isError && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.uuid}>
              <button
                type="button"
                onClick={() => setSelectedUuid(row.uuid)}
                className={cn(
                  'w-full cursor-pointer rounded-xl border p-4 text-left transition-colors',
                  isDark
                    ? 'border-gray-800 bg-gray-900/40 hover:border-blue-500/40 hover:bg-gray-800/60'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40',
                )}
              >
                <p className={cn('font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.title}</p>
                <p className={cn('mt-1 text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>{row.excerpt}</p>
                <p className={cn('mt-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  {row.author.display_name} · {row.comments_count} comment{row.comments_count === 1 ? '' : 's'}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!listQuery.isLoading && !listQuery.isError && pagination}
    </div>
  );
}

export default CommunityChannelView;
