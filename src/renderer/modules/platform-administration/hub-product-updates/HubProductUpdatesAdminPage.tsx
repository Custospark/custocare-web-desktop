import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Megaphone, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { imperativeToast } from '../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../shared/utils/classNameUtils';
import {
  useCreatePlatformHubProductUpdate,
  useDeletePlatformHubProductUpdate,
  usePlatformHubProductUpdateDetail,
  usePlatformHubProductUpdates,
  useUpdatePlatformHubProductUpdate,
  type PlatformHubProductUpdateRowDto,
} from './api/usePlatformHubProductUpdateQueries';

export interface HubProductUpdatesAdminPageProps {
  theme: 'light' | 'dark';
}

const emptyForm = { title: '', body: '' };

const HubProductUpdatesAdminPage: React.FC<HubProductUpdatesAdminPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, error, refetch, isFetching } = usePlatformHubProductUpdates({ page, q: appliedQ });
  const detailQuery = usePlatformHubProductUpdateDetail(editingId, {
    enabled: modalOpen && editingId != null,
  });
  const createMut = useCreatePlatformHubProductUpdate();
  const updateMut = useUpdatePlatformHubProductUpdate();
  const deleteMut = useDeletePlatformHubProductUpdate();

  const rows = Array.isArray(data?.data) ? data!.data : [];
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [appliedQ]);

  useEffect(() => {
    const d = detailQuery.data?.data;
    if (!modalOpen || editingId == null || !d) return;
    setForm({ title: d.title, body: d.body });
  }, [detailQuery.data, editingId, modalOpen]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: PlatformHubProductUpdateRowDto) => {
    setForm({ title: row.title, body: '' });
    setEditingId(row.id);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }, []);

  const onSubmit = useCallback(async () => {
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      imperativeToast.show('warning', 'Title and body are required.');
      return;
    }
    try {
      if (editingId != null) {
        await updateMut.mutateAsync({ id: editingId, payload: { title, body } });
        imperativeToast.show('success', 'Product update saved.');
      } else {
        await createMut.mutateAsync({ title, body });
        imperativeToast.show('success', 'Product update published.');
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
  }, [closeModal, createMut, editingId, form.body, form.title, refetch, updateMut]);

  const onDelete = useCallback(
    async (row: PlatformHubProductUpdateRowDto) => {
      if (!window.confirm(`Delete product update “${row.title.slice(0, 80)}${row.title.length > 80 ? '…' : ''}”?`)) return;
      try {
        await deleteMut.mutateAsync({ id: row.id });
        imperativeToast.show('success', 'Deleted.');
        void refetch();
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        imperativeToast.show('error', msg ?? 'Delete failed.');
      }
    },
    [deleteMut, refetch],
  );

  const shell = cn('rounded-xl border', isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white');
  const detailLoading = modalOpen && editingId != null && detailQuery.isLoading && !detailQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600')}>
            <Megaphone className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className={cn('text-xl font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Hub product updates</h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Publish announcements for <span className="font-medium">Custocare Hub → Community → Product updates</span> (read-only
              for hub users).
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
              'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New update
          </button>
        </div>
      </div>

      <div className={cn('flex flex-col gap-3 p-4', shell, 'sm:flex-row sm:flex-wrap sm:items-end')}>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1 sm:max-w-md">
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
              placeholder="Title or body…"
            />
            <button
              type="button"
              onClick={() => setAppliedQ(q)}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold',
                isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700',
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
          {error?.response?.data?.message ?? error?.message ?? 'Failed to load product updates.'}
        </div>
      )}

      <div className={cn('overflow-hidden', shell)}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-950/80' : 'border-gray-200 bg-gray-50')}>
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={3} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" aria-hidden />
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((row) => (
                  <tr key={row.id} className={cn('border-t', isDark ? 'border-gray-800' : 'border-gray-100')}>
                    <td className="max-w-lg px-4 py-2">
                      <div className={cn('font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.title}</div>
                      <div className={cn('mt-1 line-clamp-2 text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>{row.excerpt}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium',
                            isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-200 text-gray-800 hover:bg-gray-50',
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(row)}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium',
                            isDark ? 'border-red-900/60 text-red-300 hover:bg-red-950/40' : 'border-red-200 text-red-700 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    No product updates yet. Click New update to publish one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className={cn(isDark ? 'text-gray-500' : 'text-gray-600')}>
            Page {meta.current_page} of {meta.last_page} ({meta.total} items)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || isLoading}
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
              disabled={meta.current_page >= meta.last_page || isLoading}
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
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-black/50"
            aria-label="Close"
            onClick={closeModal}
          />
          <div
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl',
              isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pu-dialog-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="pu-dialog-title" className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                {editingId != null ? 'Edit product update' : 'New product update'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className={cn(
                  'cursor-pointer rounded-lg p-1.5',
                  isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100',
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className={cn('flex justify-center py-10', isDark ? 'text-gray-400' : 'text-gray-600')}>
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="block">
                    <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Title</span>
                    <input
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm',
                        isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                      )}
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      maxLength={255}
                    />
                  </label>
                  <label className="block">
                    <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Body</span>
                    <textarea
                      rows={12}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm',
                        isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                      )}
                      value={form.body}
                      onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={cn(
                      'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium',
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
                      'cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60',
                      isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700',
                    )}
                  >
                    {editingId != null ? 'Save' : 'Publish'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HubProductUpdatesAdminPage;
