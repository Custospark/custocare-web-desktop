import React, { useCallback, useMemo, useState } from 'react';
import { CircleHelp, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { imperativeToast } from '../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../shared/utils/classNameUtils';
import {
  useCreatePlatformHubSupportFaq,
  useDeletePlatformHubSupportFaq,
  usePlatformHubSupportFaqs,
  useUpdatePlatformHubSupportFaq,
  type PlatformSupportFaqAdminDto,
  type SupportFaqPayload,
} from './api/usePlatformHubSupportFaqQueries';

export interface HubSupportFaqsAdminPageProps {
  theme: 'light' | 'dark';
}

const emptyForm: SupportFaqPayload = {
  question: '',
  answer: '',
  sort_order: 0,
  is_published: true,
};

const HubSupportFaqsAdminPage: React.FC<HubSupportFaqsAdminPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [includeTrash, setIncludeTrash] = useState(false);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');

  const filters = useMemo(() => {
    const f: { is_published?: boolean; include_trash?: boolean; q?: string } = {};
    if (publishedFilter === '1') f.is_published = true;
    if (publishedFilter === '0') f.is_published = false;
    if (includeTrash) f.include_trash = true;
    if (appliedQ.trim()) f.q = appliedQ.trim();
    return f;
  }, [appliedQ, includeTrash, publishedFilter]);

  const { data, isLoading, isError, error, refetch, isFetching } = usePlatformHubSupportFaqs(filters);
  const createMut = useCreatePlatformHubSupportFaq();
  const updateMut = useUpdatePlatformHubSupportFaq();
  const deleteMut = useDeletePlatformHubSupportFaq();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformSupportFaqAdminDto | null>(null);
  const [form, setForm] = useState<SupportFaqPayload>(emptyForm);

  const rows = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: PlatformSupportFaqAdminDto) => {
    setEditing(row);
    setForm({
      question: row.question,
      answer: row.answer,
      sort_order: row.sort_order,
      is_published: row.is_published,
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const onSubmit = useCallback(async () => {
    const payload: SupportFaqPayload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sort_order: Number(form.sort_order ?? 0),
      is_published: Boolean(form.is_published),
    };
    if (!payload.question || !payload.answer) {
      imperativeToast.show('warning', 'Question and answer are required.');
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        imperativeToast.show('success', 'FAQ updated.');
      } else {
        await createMut.mutateAsync(payload);
        imperativeToast.show('success', 'FAQ created.');
      }
      closeModal();
      void refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      imperativeToast.show('error', msg ?? 'Save failed.');
    }
  }, [closeModal, createMut, editing, form, refetch, updateMut]);

  const onDelete = useCallback(
    async (row: PlatformSupportFaqAdminDto) => {
      if (row.deleted_at) return;
      if (!window.confirm(`Archive FAQ “${row.question.slice(0, 60)}${row.question.length > 60 ? '…' : ''}”?`)) return;
      try {
        await deleteMut.mutateAsync({ id: row.id });
        imperativeToast.show('success', 'FAQ archived.');
        void refetch();
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        imperativeToast.show('error', msg ?? 'Archive failed.');
      }
    },
    [deleteMut, refetch],
  );

  const shell = cn('rounded-xl border', isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-blue-50 text-blue-600')}>
            <CircleHelp className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className={cn('text-xl font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Support Center FAQs</h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Questions and answers shown to all users under Custocare Hub → Support Center.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50',
              isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add FAQ
          </button>
        </div>
      </div>

      <div className={cn('flex flex-col gap-3 p-4', shell, 'lg:flex-row lg:flex-wrap lg:items-end')}>
        <label className="block min-w-[160px] flex-1">
          <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Published</span>
          <select
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
            )}
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="1">Published only</option>
            <option value="0">Draft only</option>
          </select>
        </label>
        <label className={cn('flex items-center gap-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
          <input type="checkbox" checked={includeTrash} onChange={(e) => setIncludeTrash(e.target.checked)} />
          Include archived
        </label>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1 lg:max-w-md">
          <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Search</span>
          <div className="flex gap-2">
            <input
              className={cn(
                'min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm',
                isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
              )}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setAppliedQ(q)}
              placeholder="Question or answer…"
            />
            <button
              type="button"
              onClick={() => setAppliedQ(q)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              <Search className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <div
          className={cn('rounded-lg border px-4 py-3 text-sm', isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Failed to load FAQs.'}
        </div>
      )}

      <div className={cn('overflow-hidden', shell)}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-950/80' : 'border-gray-200 bg-gray-50')}>
              <tr>
                <th className="px-4 py-3 font-semibold">Sort</th>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Published</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden />
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id} className={cn('border-t', isDark ? 'border-gray-800' : 'border-gray-100')}>
                    <td className="px-4 py-2">{row.sort_order}</td>
                    <td className="max-w-md px-4 py-2">
                      <div className={cn('font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.question}</div>
                    </td>
                    <td className="px-4 py-2">{row.is_published ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2 text-xs">{row.deleted_at ? 'Archived' : 'Active'}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={Boolean(row.deleted_at)}
                          onClick={() => openEdit(row)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40',
                            isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(row.deleted_at)}
                          onClick={() => void onDelete(row)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-40',
                            isDark ? 'border-red-900/60 text-red-300 hover:bg-red-950/40' : 'border-red-200 text-red-700 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    No FAQs match filters. Click Add FAQ to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={closeModal} />
          <div
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl',
              isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-dialog-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="faq-dialog-title" className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                {editing ? 'Edit FAQ' : 'New FAQ'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className={cn('rounded-lg p-1.5', isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100')}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Question</span>
                <input
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  maxLength={500}
                />
              </label>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Answer</span>
                <textarea
                  rows={10}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Sort order</span>
                <input
                  type="number"
                  min={0}
                  className={cn(
                    'w-full max-w-[200px] rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </label>
              <label className={cn('flex items-center gap-2 text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                <input
                  type="checkbox"
                  checked={Boolean(form.is_published)}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                />
                Published (visible in the hub)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium',
                  isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createMut.isPending || updateMut.isPending}
                onClick={() => void onSubmit()}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60',
                  isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
                )}
              >
                {editing ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubSupportFaqsAdminPage;
