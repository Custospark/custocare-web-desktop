import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GraduationCap, ImageIcon, Loader2, Pencil, Plus, RefreshCw, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { imperativeToast } from '../../../app/store/contexts/toast/imperativeToast';
import { cn } from '../../../shared/utils/classNameUtils';
import type { LearningMaterialDto } from '../../custocare-hub/api/learning/learningMaterialTypes';
import { LEARNING_CENTER_CATEGORIES } from '../../custocare-hub/api/learning/learningMaterialTypes';
import { resolveLearningMaterialThumbnailSrc } from '../../custocare-hub/api/learning/learningMaterialThumbnail';
import {
  useCreateLearningMaterial,
  useDeleteLearningMaterial,
  usePlatformLearningMaterials,
  usePreviewThumbnailFromVideo,
  useUpdateLearningMaterial,
  useUploadLearningThumbnail,
  type LearningMaterialPayload,
} from './api/usePlatformLearningMaterialQueries';

export interface LearningMaterialsAdminPageProps {
  theme: 'light' | 'dark';
}

const emptyForm: LearningMaterialPayload = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_path: '',
  thumbnail_url: '',
  banner_image_url: '',
  category: 'watch-tutorials',
  sort_order: 0,
  is_published: true,
};

const LearningMaterialsAdminPage: React.FC<LearningMaterialsAdminPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error, refetch, isFetching } = usePlatformLearningMaterials({});
  const createMut = useCreateLearningMaterial();
  const updateMut = useUpdateLearningMaterial();
  const deleteMut = useDeleteLearningMaterial();
  const previewThumbMut = usePreviewThumbnailFromVideo();
  const uploadThumbMut = useUploadLearningThumbnail();
  const thumbFileRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LearningMaterialDto | null>(null);
  const [form, setForm] = useState<LearningMaterialPayload>(emptyForm);
  const [thumbHint, setThumbHint] = useState<string | null>(null);

  const rows = useMemo(() => (Array.isArray(data?.data) ? data!.data : []), [data]);

  const dialogThumbSrc = useMemo(
    () =>
      resolveLearningMaterialThumbnailSrc({
        thumbnail_path: form.thumbnail_path?.trim() || null,
        thumbnail_url: form.thumbnail_url?.trim() || null,
        thumbnail_video_preview_url: editing?.thumbnail_video_preview_url ?? null,
      }),
    [editing?.thumbnail_video_preview_url, form.thumbnail_path, form.thumbnail_url],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setThumbHint(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((row: LearningMaterialDto) => {
    setEditing(row);
    setForm({
      title: row.title,
      description: row.description ?? '',
      video_url: row.video_url,
      thumbnail_path: row.thumbnail_path ?? '',
      thumbnail_url: row.thumbnail_url ?? '',
      banner_image_url: row.banner_image_url ?? '',
      category: row.category,
      sort_order: row.sort_order,
      is_published: row.is_published,
    });
    setThumbHint(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setThumbHint(null);
  }, []);

  const onGenerateThumbnailFromVideo = useCallback(async () => {
    setThumbHint(null);
    const url = form.video_url?.trim();
    if (!url) {
      setThumbHint('Add a video URL first.');
      return;
    }
    try {
      const res = await previewThumbMut.mutateAsync({ video_url: url });
      const thumb = res.data?.thumbnail_url;
      if (thumb) {
        setForm((f) => ({ ...f, thumbnail_url: thumb }));
        setThumbHint('Preview URL applied — save to store it on this material.');
      } else {
        setThumbHint(res.message ?? 'No automatic preview for this link. Upload an image instead.');
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : null;
      setThumbHint(msg ?? 'Could not resolve preview.');
    }
  }, [form.video_url, previewThumbMut]);

  const onPickThumbnailFile = useCallback(() => {
    thumbFileRef.current?.click();
  }, []);

  const onThumbnailFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setThumbHint(null);
      try {
        const res = await uploadThumbMut.mutateAsync({
          file,
          learningMaterialId: editing?.id,
          previousThumbnailPath:
            editing == null && form.thumbnail_path?.trim() ? form.thumbnail_path.trim() : undefined,
        });
        const path = res.data?.thumbnail_path;
        if (path) {
          setForm((f) => ({ ...f, thumbnail_path: path, thumbnail_url: '' }));
          imperativeToast.show('success', 'Thumbnail uploaded. Save to keep it on this material.');
          setThumbHint(null);
        }
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : null;
        setThumbHint(msg ?? 'Upload failed.');
      }
    },
    [editing, form.thumbnail_path, uploadThumbMut],
  );

  const onSubmit = useCallback(async () => {
    const payload: LearningMaterialPayload = {
      ...form,
      description: form.description?.trim() || null,
      thumbnail_path: form.thumbnail_path?.trim() || null,
      thumbnail_url: form.thumbnail_url?.trim() || null,
      banner_image_url: form.banner_image_url?.trim() || null,
      sort_order: Number(form.sort_order ?? 0),
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    closeModal();
    void refetch();
  }, [closeModal, createMut, editing, form, refetch, updateMut]);

  const onDelete = useCallback(
    async (row: LearningMaterialDto) => {
      if (!window.confirm(`Archive learning material “${row.title}”?`)) return;
      await deleteMut.mutateAsync({ id: row.id });
      void refetch();
    },
    [deleteMut, refetch],
  );

  const shell = cn('rounded-xl border', isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-blue-50 text-blue-600')}>
            <GraduationCap className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className={cn('text-xl font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>Learning materials</h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Publish videos with thumbnails and descriptions for the Custocare Hub Learning Center.
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
            Add material
          </button>
        </div>
      </div>

      {isError && (
        <div
          className={cn('rounded-lg border px-4 py-3 text-sm', isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800')}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Failed to load materials.'}
        </div>
      )}

      <div className={cn('overflow-hidden', shell)}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-950/80' : 'border-gray-200 bg-gray-50')}>
              <tr>
                <th className="w-16 px-2 py-3 font-semibold">Thumb</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Published</th>
                <th className="px-4 py-3 font-semibold">Sort</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn('px-4 py-8 text-center', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    No learning materials yet. Click “Add material”.
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((row) => {
                  const rowThumb = resolveLearningMaterialThumbnailSrc(row);
                  return (
                  <tr key={row.id} className={cn('border-t', isDark ? 'border-gray-800' : 'border-gray-100')}>
                    <td className="px-2 py-2 align-middle">
                      <div
                        className={cn(
                          'relative h-12 w-12 overflow-hidden rounded-lg border',
                          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100',
                        )}
                      >
                        {rowThumb ? (
                          <img src={rowThumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 opacity-40" aria-hidden />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className={cn('font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>{row.title}</div>
                      <div className="mt-0.5 truncate text-xs text-gray-500">{row.video_url}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.is_published ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{row.sort_order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium',
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
                            'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium',
                            isDark ? 'border-red-900/60 text-red-300 hover:bg-red-950/40' : 'border-red-200 text-red-700 hover:bg-red-50',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl',
              isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lm-dialog-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="lm-dialog-title" className={cn('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                {editing ? 'Edit learning material' : 'New learning material'}
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
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Title</span>
                <input
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Description</span>
                <textarea
                  rows={4}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Video URL (YouTube, Vimeo, etc.)
                </span>
                <input
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                  placeholder="https://"
                />
              </label>
              <div className={cn('space-y-3 rounded-xl border p-3', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    Thumbnail
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void onGenerateThumbnailFromVideo()}
                      disabled={previewThumbMut.isPending || uploadThumbMut.isPending}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                        isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
                        (previewThumbMut.isPending || uploadThumbMut.isPending) && 'opacity-60',
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      Preview from video
                    </button>
                    <button
                      type="button"
                      onClick={onPickThumbnailFile}
                      disabled={uploadThumbMut.isPending}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                        isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50',
                        uploadThumbMut.isPending && 'opacity-60',
                      )}
                    >
                      {uploadThumbMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      ) : (
                        <Upload className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {uploadThumbMut.isPending ? 'Uploading…' : 'Upload image'}
                    </button>
                    <input
                      ref={thumbFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void onThumbnailFileChange(e)}
                    />
                  </div>
                </div>
                {uploadThumbMut.isPending ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className={cn('flex items-center gap-2 text-xs font-medium', isDark ? 'text-cyan-300' : 'text-blue-700')}
                  >
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                    Uploading thumbnail…
                  </p>
                ) : null}
                {thumbHint ? (
                  <p className={cn('text-xs', isDark ? 'text-cyan-300/90' : 'text-blue-700')}>{thumbHint}</p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="sm:w-44 shrink-0">
                    <div
                      className={cn(
                        'relative aspect-video w-full overflow-hidden rounded-lg border',
                        isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-200 bg-gray-50',
                      )}
                    >
                      {dialogThumbSrc ? (
                        <img src={dialogThumbSrc} alt="Thumbnail preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                          <ImageIcon className={cn('h-8 w-8', isDark ? 'text-gray-600' : 'text-gray-400')} aria-hidden />
                          <span className={cn('text-[10px] leading-tight', isDark ? 'text-gray-500' : 'text-gray-500')}>
                            No thumbnail yet
                          </span>
                        </div>
                      )}
                      {uploadThumbMut.isPending ? (
                        <div
                          className={cn(
                            'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-2 text-center',
                            isDark ? 'bg-gray-950/85 text-gray-100' : 'bg-white/90 text-gray-900',
                          )}
                          aria-hidden
                        >
                          <Loader2 className={cn('h-8 w-8 animate-spin', isDark ? 'text-cyan-400' : 'text-blue-600')} />
                          <span className="text-[11px] font-medium leading-tight">Uploading thumbnail…</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <label className="block min-w-0 flex-1">
                    <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      External thumbnail URL (optional; uploaded image takes priority)
                    </span>
                    <input
                      disabled={uploadThumbMut.isPending}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm',
                        isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                        uploadThumbMut.isPending && 'cursor-not-allowed opacity-60',
                      )}
                      value={form.thumbnail_url ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                      placeholder="https://… or leave empty and use Preview / Upload"
                    />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Banner image URL (optional)</span>
                <input
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.banner_image_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, banner_image_url: e.target.value }))}
                  placeholder="https://"
                />
              </label>
              <label className="block">
                <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Hub section</span>
                <select
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                  )}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {LEARNING_CENTER_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="block flex-1 min-w-[120px]">
                  <span className={cn('mb-1 block text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>Sort order</span>
                  <input
                    type="number"
                    min={0}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm',
                      isDark ? 'border-gray-700 bg-gray-950 text-gray-100' : 'border-gray-300 bg-white text-gray-900',
                    )}
                    value={form.sort_order ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </label>
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_published)}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  />
                  <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>Published</span>
                </label>
              </div>
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
                disabled={createMut.isPending || updateMut.isPending || uploadThumbMut.isPending}
                onClick={() => void onSubmit()}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60',
                  isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-blue-600 text-white hover:bg-blue-700',
                )}
              >
                {editing ? 'Save changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningMaterialsAdminPage;
