import { STORAGE_BASE_URL } from '../../../../../app/api/apiConfig';

/**
 * Converts DB paths like:
 *  "profile-photos/64/file.jpg"
 * into a browser URL:
 *  "http://127.0.0.1:8000/storage/profile-photos/64/file.jpg"
 */
export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // preview blobs or absolute urls
  if (path.startsWith('blob:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // backend may return "/storage/..."
  if (path.startsWith('/storage/')) return `${STORAGE_BASE_URL}${path}`;

  // normal case: "profile-photos/..."
  return `${STORAGE_BASE_URL}/storage/${path}`;
}
