import { useCallback, useMemo, useState } from 'react';
import { Loader2, Ticket } from 'lucide-react';
import { imperativeToast } from '../../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import type {
  HubSupportTicketCategory,
  HubSupportTicketDto,
  HubSupportTicketPriority,
} from '../../api/support/supportTicketTypes';
import { useCreateHubSupportTicket } from '../../api/support/useSupportTicketQueries';

export interface SupportTicketsOpenViewProps {
  theme: 'light' | 'dark';
}

const CATEGORY_LABEL: Record<HubSupportTicketCategory, string> = {
  account_issue: 'Account issue',
  facility_issue: 'Facility issue',
  general: 'General support',
};

const PRIORITY_LABEL: Record<HubSupportTicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function SupportTicketsOpenView({ theme }: SupportTicketsOpenViewProps) {
  const isDark = theme === 'dark';
  const createMut = useCreateHubSupportTicket();

  const [category, setCategory] = useState<HubSupportTicketCategory>('general');
  const [priority, setPriority] = useState<HubSupportTicketPriority>('medium');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [createdTicket, setCreatedTicket] = useState<HubSupportTicketDto | null>(null);

  const shell = useMemo(
    () => cn('rounded-xl border p-5', isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'),
    [isDark],
  );

  const onSubmit = useCallback(async () => {
    const s = subject.trim();
    const b = body.trim();

    if (!s || !b) {
      imperativeToast.show('warning', 'Please add a subject and details before sending.');
      return;
    }

    try {
      const res = await createMut.mutateAsync({
        category,
        priority,
        subject: s,
        body: b,
      });

      setCreatedTicket(res.data);
      imperativeToast.show('success', res.message ?? 'Ticket submitted successfully.');
      setSubject('');
      setBody('');
      setPriority('medium');
      setCategory('general');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      imperativeToast.show('error', msg ?? 'Could not submit your ticket. Please try again.');
    }
  }, [body, category, createMut, priority, subject]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Open a ticket</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Tell us what you need. The platform team will acknowledge and update the ticket as it progresses.
        </p>
      </div>

      <div className={shell}>
        <div className="space-y-4">
          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Category</span>
            <select
              className={cn(
                'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={category}
              onChange={(e) => setCategory(e.target.value as HubSupportTicketCategory)}
            >
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Priority</span>
            <select
              className={cn(
                'w-full cursor-pointer rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={priority}
              onChange={(e) => setPriority(e.target.value as HubSupportTicketPriority)}
            >
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Subject</span>
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
            <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Details</span>
            <textarea
              rows={8}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={20000}
              placeholder="Describe the issue and include any helpful context (what happened, when, and impact)."
            />
          </label>

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
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Ticket className="h-4 w-4" aria-hidden />}
              {createMut.isPending ? 'Submitting…' : 'Submit ticket'}
            </button>
          </div>
        </div>
      </div>

      {createdTicket ? (
        <div
          className={cn(
            'rounded-xl border p-4',
            isDark ? 'border-blue-900/50 bg-blue-950/30 text-blue-100' : 'border-blue-100 bg-blue-50 text-blue-900',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">Ticket created</p>
            <p className={cn('text-xs', isDark ? 'text-blue-100' : 'text-blue-900')}>
              Ref: <span className="font-mono">{createdTicket.uuid}</span>
            </p>
          </div>
          <p className={cn('mt-2 whitespace-pre-wrap text-sm leading-relaxed', isDark ? 'text-blue-100' : 'text-blue-900')}>
            {createdTicket.subject}
          </p>
          <p className={cn('mt-1 text-xs opacity-80', isDark ? 'text-blue-200' : 'text-blue-800')}>
            Save this reference number to track your ticket later under Track Ticket.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default SupportTicketsOpenView;

