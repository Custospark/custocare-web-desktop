/**
 * API Configuration & Endpoints
 * Centralized configuration for API calls, feature flags, and endpoints
 */

/* ======================================================
   Environment
====================================================== */

// Vite-native environment detection
const MODE = import.meta.env.MODE;
const APP_ENV = import.meta.env.VITE_APP_ENV ?? MODE ?? 'development';

const isDevelopment = APP_ENV === 'development';
const isProduction = APP_ENV === 'production';

/* ======================================================
   Base URL & Timeout
====================================================== */

// These keep the same export names so nothing breaks
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api'; // safe fallback

/** Origin of the Laravel app (where `/storage/...` is served). */
function storageOriginFromApiBase(apiBase: string): string {
  try {
    return new URL(apiBase).origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

const rawStorageEnv = (import.meta.env.VITE_STORAGE_BASE_URL as string | undefined)?.trim();

/**
 * Public disk files are at `{origin}/storage/...`. Prefer `VITE_STORAGE_BASE_URL` when set;
 * otherwise derive the origin from `VITE_API_BASE_URL` so thumbnails work when only the API URL is configured.
 */
export const STORAGE_BASE_URL = (
  rawStorageEnv ? rawStorageEnv.replace(/\/+$/, '') : storageOriginFromApiBase(API_BASE_URL)
) as string;

export const API_TIMEOUT = parseInt(
  import.meta.env.VITE_API_TIMEOUT || '30000',
  10
);

/* ======================================================
   Feature Flags
====================================================== */

export const FEATURES = {
  ENABLE_ANALYTICS: isProduction,
  ENABLE_ERROR_LOGGING: isProduction,
  ENABLE_PERFORMANCE_MONITORING: isProduction,
  ENABLE_DEBUG_MODE: isDevelopment,
} as const;

/* ======================================================
   API Config
====================================================== */

export const API_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  cacheDuration: {
    short: 1000 * 60 * 1,
    medium: 1000 * 60 * 5,
    long: 1000 * 60 * 30,
  },
} as const;

/* ======================================================
   Rate Limiting
====================================================== */

export const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 1000 * 60,
} as const;

/* ======================================================
   Default Export (Unchanged Structure)
====================================================== */

export default {
  API_BASE_URL,
  STORAGE_BASE_URL,
  API_TIMEOUT,
  FEATURES,
  API_CONFIG,
  RATE_LIMIT,
};