/**
 * ============================================================================
 * USER PROFILE REACT QUERY HOOKS
 * ============================================================================
 *
 * Query and mutation hooks for all user-profile API operations:
 *   • useGetUserProfile   – GET  /{user}/profile
 *   • useUpdateUserProfile – PUT  /{user}/profile
 *   • useUploadProfilePhoto – POST /{user}/profile/photo  (multipart)
 *
 * Toast notifications are emitted internally; callers receive clean
 * onSuccess / onError callbacks for navigation or extra side-effects.
 *
 * @module useProfileQueries
 * @requires @tanstack/react-query
 * @requires axios
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  GetUserProfileResponse,
  MutationCallbacks,
  UpdateUserProfileParams,
  UpdateUserProfileResponse,
  UploadProfilePhotoParams,
  UploadProfilePhotoResponse,
} from './ProfileTypes';


/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralised query-key factory for the profile domain.
 *
 * @example
 * // Invalidate after a successful update
 * queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
 */
export const profileKeys = {
  all:    ['profile'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail:  (userId: number | string) =>
    [...profileKeys.details(), userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the full profile for a given user.
 *
 * @param userId  - Numeric or string user identifier (route segment `{user}`)
 * @param options - Additional React Query options
 *
 * @example
 * const { data, isLoading, isError } = useGetUserProfile(42);
 * const profile = data?.data;
 */
export const useGetUserProfile = (
  userId: number | string,
  options?: Omit<
    UseQueryOptions<GetUserProfileResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<GetUserProfileResponse, AxiosError<ApiErrorResponse>>({
    queryKey: profileKeys.detail(userId),
    queryFn:  async () => {
      const response = await axiosInstance.get<GetUserProfileResponse>(
        `users/${userId}/profile`,
      );
      return response.data;
    },
    enabled: !!userId, // guard against undefined / 0 user IDs
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Updates any subset of the authenticated user's profile fields.
 * Automatically invalidates the cached profile on success.
 *
 * @param callbacks - Optional `onSuccess` / `onError` callbacks
 *
 * @example
 * const { mutate, isPending } = useUpdateUserProfile({
 *   onSuccess: () => setEditMode(false),
 * });
 *
 * mutate({
 *   userId: 42,
 *   data: { first_name: 'Jane', city: 'London' },
 * });
 */
export const useUpdateUserProfile = (
  callbacks: MutationCallbacks<
    UpdateUserProfileResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast }  = useToast();
  const queryClient    = useQueryClient();

  return useMutation<
    UpdateUserProfileResponse,
    AxiosError<ApiErrorResponse>,
    UpdateUserProfileParams
  >({
    mutationFn: async ({ userId, data }: UpdateUserProfileParams) => {
      const response = await axiosInstance.put<UpdateUserProfileResponse>(
        `users/${userId}/profile`,
        data,
      );
      return response.data;
    },

    onSuccess: (data, variables) => {
      const msg = data.message || 'Profile updated successfully!';
      showToast('success', msg, 8000);

      // Refresh the cached profile so the UI stays in sync
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile.';

      const errorDetails = _formatValidationErrors(
        error.response?.data?.errors,
      );

      const displayMessage = errorDetails
        ? `${apiMessage} (${errorDetails})`
        : apiMessage;

      showToast('error', displayMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Uploads a profile photo as multipart/form-data.
 * On success it invalidates the profile cache so the new photo is reflected
 * immediately without a manual refetch.
 *
 * The backend is expected to:
 *   1. Store the file.
 *   2. Return `{ data: { profile_photo_path, url? } }`.
 *
 * Endpoint assumed: POST /{user}/profile/photo
 *
 * @param callbacks - Optional `onSuccess` / `onError` callbacks
 *
 * @example
 * const { mutate: uploadPhoto, isPending: isUploading } =
 *   useUploadProfilePhoto({
 *     onSuccess: (res) => console.log('Stored at', res.data.profile_photo_path),
 *   });
 *
 * uploadPhoto({ userId: 42, file: selectedFile });
 */
export const useUploadProfilePhoto = (
  callbacks: MutationCallbacks<
    UploadProfilePhotoResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    UploadProfilePhotoResponse,
    AxiosError<ApiErrorResponse>,
    UploadProfilePhotoParams
  >({
    mutationFn: async ({ userId, file }: UploadProfilePhotoParams) => {
      const form = new FormData();
      form.append('photo', file);

      const response = await axiosInstance.post<UploadProfilePhotoResponse>(
        `/${userId}/profile/photo`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    },

    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Photo updated!', 5000);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage =
        error.response?.data?.message ||
        error.message ||
        'Photo upload failed.';

      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Formats a Laravel validation-errors map into a readable inline string.
 *
 * @internal
 */
export const _formatValidationErrors = (
  errors?: Record<string, string[]>,
): string => {
  if (!errors || Object.keys(errors).length === 0) return '';

  return Object.entries(errors)
    .map(([field, messages]) => {
      const label = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${label}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

/**
 * Extracts a human-readable message from an Axios error.
 *
 * @param error           - Axios error
 * @param fallbackMessage - Used when the API response is absent
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.',
): string =>
  error.response?.data?.message || error.message || fallbackMessage;

/* -------------------------------------------------------------------------- */
/*                            DEFAULT EXPORT                                  */
/* -------------------------------------------------------------------------- */

export default {
  // Query hooks
  useGetUserProfile,

  // Mutation hooks
  useUpdateUserProfile,
  useUploadProfilePhoto,

  // Query keys
  profileKeys,

  // Utilities
  extractErrorMessage,
  _formatValidationErrors,
};
