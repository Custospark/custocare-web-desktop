import { resolveStorageUrl } from '../../../account/api/settings/profile/profileUtils';
import type { LearningMaterialDto } from './learningMaterialTypes';

/** Legacy rows may store a public-disk relative path in `thumbnail_url` instead of `thumbnail_path`. */
function looksLikePublicDiskRelativePath(s: string): boolean {
  if (!s || /\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s) || s.startsWith('//') || s.startsWith('blob:')) return false;
  return (
    s.startsWith('learning-material-thumbnails/') ||
    s.startsWith('learning-materials/thumbnails/') ||
    s.startsWith('profile-photos/')
  );
}

/**
 * Display priority: uploaded file on the public disk → external thumbnail URL → auto preview from video host.
 * Matches how profile photos use {@link resolveStorageUrl} for disk-backed paths.
 */
export function resolveLearningMaterialThumbnailSrc(
  m: Pick<LearningMaterialDto, 'thumbnail_path' | 'thumbnail_url' | 'thumbnail_video_preview_url'>,
): string | null {
  const uploaded = resolveStorageUrl(m.thumbnail_path ?? null);
  if (uploaded) return uploaded;

  const ext = m.thumbnail_url?.trim() ?? '';
  if (ext) {
    if (ext.startsWith('http://') || ext.startsWith('https://') || ext.startsWith('//')) return ext;
    if (looksLikePublicDiskRelativePath(ext)) {
      const fromUrlField = resolveStorageUrl(ext);
      if (fromUrlField) return fromUrlField;
    }
  }

  const preview = m.thumbnail_video_preview_url?.trim();
  if (preview && (preview.startsWith('http://') || preview.startsWith('https://') || preview.startsWith('//')))
    return preview;

  return null;
}
