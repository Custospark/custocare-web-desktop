import { STORAGE_BASE_URL } from '../../../../../app/api/apiConfig';

/**
 * Converts DB paths like:
 *  "profile-photos/64/file.jpg"
 * into a browser URL:
 *  "http://127.0.0.1:8000/storage/profile-photos/64/file.jpg"
 */
export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (path == null) return null;
  const p = String(path).trim();
  if (!p) return null;

  const base = STORAGE_BASE_URL.replace(/\/+$/, '');

  // preview blobs or absolute urls
  if (p.startsWith('blob:')) return p;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  // protocol-relative — valid for <img src>
  if (p.startsWith('//')) return p;

  // backend may return "/storage/..." or "storage/..." (no leading slash)
  if (p.startsWith('/storage/')) return `${base}${p}`;
  if (p.startsWith('storage/')) return `${base}/${p}`;

  // normal case: "profile-photos/...", "learning-material-thumbnails/..."
  const rel = p.replace(/^\/+/, '');
  return `${base}/storage/${rel}`;
}
