import { useCallback, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import type { HubFeedbackCategory } from '../../api/feedback/hubFeedbackTypes';
import { useCreateHubFeedback } from '../../api/feedback/useHubFeedbackQueries';

export interface FeedbackSubmitFormProps {
  theme: 'light' | 'dark';
  defaultCategory: HubFeedbackCategory;
  heading: string;
  description: string;
}

export function FeedbackSubmitForm({ theme, defaultCategory, heading, description }: FeedbackSubmitFormProps) {
  const isDark = theme === 'dark';
  const createMut = useCreateHubFeedback();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [includeInRoadmap, setIncludeInRoadmap] = useState(defaultCategory === 'feature_request');

  const onSubmit = useCallback(async () => {
    const s = subject.trim();
    const b = body.trim();
    if (!s || !b) {
      imperativeToast.show('warning', 'Please add a subject and details before sending.');
      return;
    }
    try {
      await createMut.mutateAsync({
        category: defaultCategory,
        subject: s,
        body: b,
        include_in_roadmap: defaultCategory === 'feature_request' ? includeInRoadmap : false,
      });
      imperativeToast.show('success', 'Thanks — your message was sent to the platform team.');
      setSubject('');
      setBody('');
      setIncludeInRoadmap(defaultCategory === 'feature_request');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      imperativeToast.show('error', msg ?? 'Could not send your submission. Please try again.');
    }
  }, [body, createMut, defaultCategory, includeInRoadmap, subject]);

  const shell = cn('rounded-xl border p-5', isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white');

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>{heading}</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{description}</p>
      </div>

      <div className={shell}>
        <div className="space-y-4">
          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Subject
            </span>
            <input
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="Short summary"
            />
          </label>
          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Details
            </span>
            <textarea
              rows={8}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={20000}
              placeholder="Describe your feedback or request in as much detail as you like."
            />
          </label>
          {defaultCategory === 'feature_request' ? (
            <label className={cn('flex items-start gap-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
              <input
                type="checkbox"
                className="mt-0.5 cursor-pointer"
                checked={includeInRoadmap}
                onChange={(e) => setIncludeInRoadmap(e.target.checked)}
              />
              <span>
                Allow this idea on the public roadmap so others can vote (recommended). You can turn this off for
                private requests.
              </span>
            </label>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={createMut.isPending}
              onClick={() => void onSubmit()}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60',
                isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {createMut.isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackSubmitForm;
