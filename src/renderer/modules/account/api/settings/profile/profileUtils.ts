import { STORAGE_BASE_URL } from '../../../../../app/api/apiConfig';

/**
 * Builds a safe absolute URL for a storage path returned by Laravel public disk.
 * Accepts:
 * - null -> null
 * - blob:... -> blob:...
 * - http(s)://... -> unchanged
 * - "/storage/..." -> STORAGE_BASE_URL + "/storage/..."
 * - "profile-photos/..." -> STORAGE_BASE_URL + "/storage/" + path
 */
export function resolveStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (path.startsWith('blob:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // backend might return "/storage/..."
  if (path.startsWith('/storage/')) return `${STORAGE_BASE_URL}${path}`;

  // backend might return "profile-photos/1/file.jpg"
  return `${STORAGE_BASE_URL}/storage/${path}`;
}
