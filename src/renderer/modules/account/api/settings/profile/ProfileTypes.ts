/**
 * ============================================================================
 * USER PROFILE TYPE DEFINITIONS
 * ============================================================================
 *
 * All TypeScript type declarations for user-profile read / update operations.
 * Mirrors the shape returned by GET /{user}/profile and accepted by
 * PUT /{user}/profile, including the separate photo-upload flow.
 *
 * @module profileTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Allowed gender values. Must match Laravel validation: in:male,female,other
 */
export enum Gender {
  MALE   = 'male',
  FEMALE = 'female',
  OTHER  = 'other',
}

/* -------------------------------------------------------------------------- */
/*                             CORE PROFILE ENTITY                            */
/* -------------------------------------------------------------------------- */

/**
 * Full user-profile shape as returned by the API.
 *
 * Notes:
 *  - `phone` may arrive as a PHP-serialised string  (e.g. `s:11:"+123…";`)
 *    when the backend hasn't stripped the serialisation wrapper.
 *    Use `parsePhone()` from profileUtils to extract the plain number.
 *  - `profile_photo_path` is a storage-relative path; build the full URL
 *    with your CDN / storage base URL in the component.
 */
export interface UserProfile {
  id:                  number;
  first_name:          string;
  last_name:           string;
  display_name:        string;
  title:               string | null;
  dob:                 string | null;   // ISO date: "YYYY-MM-DD"
  gender:              Gender | null;
  phone:               string | null;   // may be PHP-serialised
  address_line1:       string | null;
  address_line2:       string | null;
  city:                string | null;
  state:               string | null;
  country:             string | null;
  postal_code:         string | null;
  profile_photo_path:  string | null;   // storage-relative path
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST / PAYLOAD TYPES                           */
/* -------------------------------------------------------------------------- */

/**
 * Payload for PUT /{user}/profile.
 * All fields are optional – only sent fields are updated (Laravel `sometimes`).
 */
export interface UpdateUserProfileRequest {
  first_name?:         string;
  last_name?:          string;
  display_name?:       string;
  title?:              string | null;
  dob?:                string | null;   // "YYYY-MM-DD"
  gender?:             Gender | null;
  phone?:              string | null;   // plain text – backend encrypts it
  address_line1?:      string | null;
  address_line2?:      string | null;
  city?:               string | null;
  state?:              string | null;
  country?:            string | null;
  postal_code?:        string | null;
  profile_photo_path?: string | null;
}

/**
 * Params passed to the updateProfile mutation.
 * Bundles the user ID (route param) with the request body.
 */
export interface UpdateUserProfileParams {
  userId:  number | string;
  data:    UpdateUserProfileRequest;
}

/**
 * Params for the uploadProfilePhoto mutation.
 * The file is sent as multipart/form-data.
 */
export interface UploadProfilePhotoParams {
  userId: number | string;
  file:   File;
}

/* -------------------------------------------------------------------------- */
/*                             API RESPONSE TYPES                             */
/* -------------------------------------------------------------------------- */

/**
 * Generic success envelope shared across this module.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data:    T;
  meta?:   Record<string, unknown>;
}

/**
 * Generic error envelope. Matches the Laravel failedValidation structure.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?:  string; // debug-only, development mode
}

/** Response for GET /{user}/profile */
export type GetUserProfileResponse = ApiSuccessResponse<UserProfile>;

/** Response for PUT /{user}/profile */
export type UpdateUserProfileResponse = ApiSuccessResponse<UserProfile>;

/**
 * Response for the photo-upload endpoint.
 * The `data` object returns the persisted storage path so we can
 * patch the profile immediately after a successful upload.
 */
export interface UploadProfilePhotoResponseData {
  profile_photo_path: string;
  url?:               string; // optional full CDN URL if backend returns it
}
export type UploadProfilePhotoResponse =
  ApiSuccessResponse<UploadProfilePhotoResponseData>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/** Reusable callback options for all mutations. */
export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?:   (error: TError) => void;
}

/**
 * Convenience alias – imported where needed so callers don't have to
 * import AxiosError directly alongside these types.
 */
export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

/* -------------------------------------------------------------------------- */
/*                             TYPE GUARDS / UTILS                            */
/* -------------------------------------------------------------------------- */

/**
 * Returns true when the response is an error envelope.
 *
 * @example
 * if (isApiErrorResponse(res)) console.error(res.message);
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse,
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Extracts a plain phone number from a PHP-serialised string.
 * e.g.  `s:11:"+1234567890";`  →  `+1234567890`
 * Falls back to the raw value when the format is not recognised.
 */
export function parsePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  // PHP serialize format for strings: s:<len>:"<value>";
  const match = raw.match(/^s:\d+:"(.+)";$/);
  return match ? match[1] : raw;
}
