/**
 * ============================================================================
 * USER PREFERENCES TYPE DEFINITIONS
 * ============================================================================
 * 
 * Based on backend:
 * - GET /{user}/preferences - returns array with theme_mode, ui_density, timezone, locale
 * - PUT /{user}/preferences - updates with same fields
 * 
 * Data structure from backend:
 * {
 *   theme_mode: 'light' | 'dark' | 'system',
 *   ui_density: 'compact' | 'comfortable' | 'spacious',
 *   timezone: string,
 *   locale: string
 * }
 */

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum UiDensity {
  COMPACT = 'compact',
  COMFORTABLE = 'comfortable',
  SPACIOUS = 'spacious',
}

/**
 * User preferences data structure
 * Matches exactly what the backend returns in the array
 */
export interface UserPreferences {
  theme_mode: ThemeMode;
  ui_density: UiDensity;
  timezone: string; // IANA timezone identifier (e.g., "America/New_York")
  locale: string;   // Locale code (e.g., "en_us", "fr_fr")
}

/**
 * Request payload for updating preferences
 * All fields are optional since you can update one or more at a time
 */
export interface UpdateUserPreferencesRequest {
  theme_mode?: ThemeMode;
  ui_density?: UiDensity;
  timezone?: string;
  locale?: string;
}

export interface UpdateUserPreferencesParams {
  userId: number | string;
  data: UpdateUserPreferencesRequest;
}

/* ----------------------------- API envelopes ----------------------------- */

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T; // For GET /preferences, T is UserPreferences object
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type GetUserPreferencesResponse = ApiSuccessResponse<UserPreferences>;
export type UpdateUserPreferencesResponse = ApiSuccessResponse<UserPreferences>;

/* ----------------------------- Mutations -------------------------------- */

export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* ----------------------------- Utilities -------------------------------- */

/**
 * Normalize locale string to lowercase (matches backend prepareForValidation)
 * Example: "en_US" → "en_us"
 */
export function normalizeLocale(locale: string): string {
  return locale.toLowerCase().trim();
}

/**
 * Map backend theme_mode to UI theme
 * 'system' should be resolved to actual dark/light based on system preference
 */
export function mapBackendThemeToUI(themeMode: ThemeMode): 'dark' | 'light' {
  if (themeMode === ThemeMode.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeMode;
}

/**
 * Map UI theme to backend theme_mode
 * Note: UI only stores 'dark'|'light', so we lose 'system' preference
 */
export function mapUIThemeToBackend(uiTheme: 'dark' | 'light'): ThemeMode {
  return uiTheme === 'dark' ? ThemeMode.DARK : ThemeMode.LIGHT;
}