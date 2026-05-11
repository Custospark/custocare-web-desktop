import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { custocareHubActionPath } from '../../../../app/routes/constants/custocare-hub.paths';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useCreateHubCommunityPost } from '../../api/community/useHubCommunityQueries';

const CHANNEL_OPTIONS: { value: 'discussion' | 'feature_idea'; label: string }[] = [
  { value: 'discussion', label: 'General discussion' },
  { value: 'feature_idea', label: 'Feature idea' },
];

function listPathForChannel(channel: 'discussion' | 'feature_idea'): string {
  switch (channel) {
    case 'discussion':
      return 'view-discussions';
    case 'feature_idea':
      return 'feature-ideas';
    default:
      return 'view-discussions';
  }
}

export interface CommunityCreatePostViewProps {
  theme: 'light' | 'dark';
  /** When set (e.g. from hub action), used as initial channel; URL `?channel=` still wins. */
  suggestedChannel?: 'discussion' | 'feature_idea' | null;
}

export function CommunityCreatePostView({ theme, suggestedChannel }: CommunityCreatePostViewProps) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const channelFromQuery = searchParams.get('channel') as HubCommunityChannel | null;

  const initialChannel = useMemo((): 'discussion' | 'feature_idea' => {
    const q = channelFromQuery;
    if (q === 'discussion' || q === 'feature_idea') return q;
    if (suggestedChannel === 'discussion' || suggestedChannel === 'feature_idea') return suggestedChannel;
    return 'discussion';
  }, [channelFromQuery, suggestedChannel]);

  const [channel, setChannel] = useState<'discussion' | 'feature_idea'>(initialChannel);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const createMut = useCreateHubCommunityPost();

  useEffect(() => {
    const q = searchParams.get('channel');
    if (q === 'discussion' || q === 'feature_idea') {
      setChannel(q);
    }
  }, [searchParams]);

  const onSubmit = useCallback(async () => {
    if (!title.trim() || !body.trim()) {
      imperativeToast.show('error', 'Title and body are required.');
      return;
    }
    try {
      const res = await createMut.mutateAsync({
        channel,
        title: title.trim(),
        body: body.trim(),
      });
      imperativeToast.show('success', res.message ?? 'Post created.');
      navigate(custocareHubActionPath('community', listPathForChannel(channel)));
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      imperativeToast.show('error', msg ?? 'Could not create post.');
    }
  }, [body, channel, createMut, navigate, title]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Create a post</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Share with other Custocare users in discussion or feature-idea channels. Product updates are published by platform
          administrators only.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="hub-community-channel" className={cn('mb-1 block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Channel
          </label>
          <select
            id="hub-community-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as 'discussion' | 'feature_idea')}
            className={cn(
              'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
              isDark
                ? 'border-gray-700 bg-gray-950 text-gray-100 focus:ring-blue-600/40'
                : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-500/30',
            )}
          >
            {CHANNEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hub-community-title" className={cn('mb-1 block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Title
          </label>
          <input
            id="hub-community-title"
            type="text"
            maxLength={255}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline"
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
              isDark
                ? 'border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-600 focus:ring-blue-600/40'
                : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500/30',
            )}
          />
        </div>

        <div>
          <label htmlFor="hub-community-body" className={cn('mb-1 block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Body
          </label>
          <textarea
            id="hub-community-body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Details, context, steps to reproduce…"
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
              isDark
                ? 'border-gray-700 bg-gray-950 text-gray-100 placeholder-gray-600 focus:ring-blue-600/40'
                : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500/30',
            )}
          />
        </div>

        <button
          type="button"
          disabled={createMut.isPending}
          onClick={() => void onSubmit()}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50',
            isDark ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700',
          )}
        >
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publish post
        </button>
      </div>
    </div>
  );
}

export default CommunityCreatePostView;
