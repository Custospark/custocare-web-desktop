import { axiosInstance } from '../../app/api/axiosConfig';
import { API_BASE_URL } from '../../app/api/apiConfig';

type ResolvedEndpoint = {
  path: string;
  useAbsoluteUrl: boolean;
};

/** Map API receipt/download URLs to axios paths (Bearer token is attached by axiosConfig). */
function resolveAuthenticatedEndpoint(urlOrPath: string): ResolvedEndpoint {
  const trimmed = urlOrPath.trim();
  if (!trimmed) {
    return { path: '', useAbsoluteUrl: false };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const apiBase = API_BASE_URL.replace(/\/$/, '');
    if (trimmed.startsWith(apiBase)) {
      const relative = trimmed.slice(apiBase.length);
      return {
        path: relative.startsWith('/') ? relative : `/${relative}`,
        useAbsoluteUrl: false,
      };
    }
    return { path: trimmed, useAbsoluteUrl: true };
  }

  if (trimmed.startsWith('/api/')) {
    return { path: trimmed.replace(/^\/api/, '') || '/', useAbsoluteUrl: false };
  }

  return {
    path: trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
    useAbsoluteUrl: false,
  };
}

function fileNameFromContentDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  return match?.[1]?.trim().replace(/"/g, '') ?? null;
}

export type OpenAuthenticatedFileOptions = {
  /** Prefer inline preview in a new tab (default). Set true to force download. */
  download?: boolean;
  fileName?: string;
};

/**
 * Fetches a protected file with session Bearer auth and opens or downloads it.
 * Plain `<a href>` to API routes will not send Authorization and returns 401.
 */
export async function openAuthenticatedFile(
  urlOrPath: string,
  options: OpenAuthenticatedFileOptions = {},
): Promise<void> {
  const { path, useAbsoluteUrl } = resolveAuthenticatedEndpoint(urlOrPath);
  if (!path) {
    throw new Error('Missing file URL.');
  }

  const response = await axiosInstance.get(path, {
    responseType: 'blob',
    ...(useAbsoluteUrl ? { baseURL: '' } : {}),
  });

  const blob = response.data as Blob;
  const contentType =
    (response.headers['content-type'] as string | undefined) ?? blob.type ?? 'application/octet-stream';
  const typedBlob = blob.type ? blob : new Blob([blob], { type: contentType });
  const objectUrl = URL.createObjectURL(typedBlob);

  const serverName = fileNameFromContentDisposition(
    response.headers['content-disposition'] as string | undefined,
  );
  const fileName = options.fileName ?? serverName ?? 'receipt';

  if (options.download) {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
