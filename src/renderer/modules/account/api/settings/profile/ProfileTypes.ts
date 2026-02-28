/**
 * ============================================================================
 * USER PROFILE TYPE DEFINITIONS
 * ============================================================================
 */

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  title: string | null;
  dob: string | null; // "YYYY-MM-DD"
  gender: Gender | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  profile_photo_path: string | null; // storage-relative path e.g. "profile-photos/1/abc.jpg"
}

export interface UpdateUserProfileRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  title?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
}

export interface UpdateUserProfileParams {
  userId: number | string;
  data: UpdateUserProfileRequest;
}

export interface UploadProfilePhotoParams {
  userId: number | string;
  file: File;
}

/* ----------------------------- API envelopes ----------------------------- */

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

export type GetUserProfileResponse = ApiSuccessResponse<UserProfile>;
export type UpdateUserProfileResponse = ApiSuccessResponse<UserProfile>;

export interface UploadProfilePhotoResponseData {
  profile_photo_path: string;
  url?: string; // optional absolute URL if backend returns it
}
export type UploadProfilePhotoResponse = ApiSuccessResponse<UploadProfilePhotoResponseData>;

/* ----------------------------- Mutations -------------------------------- */

export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* ----------------------------- Utilities -------------------------------- */

export function parsePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const match = raw.match(/^s:\d+:"(.+)";$/); // PHP serialize string: s:11:"+123...";
  return match ? match[1] : raw;
}
