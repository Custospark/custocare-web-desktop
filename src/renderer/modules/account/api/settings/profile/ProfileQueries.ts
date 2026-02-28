/**
 * ============================================================================
 * USER PROFILE REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL):
 *   GET  /users/{user}/profile
 *   PUT  /users/{user}/profile
 *   POST /users/{user}/profile/photo
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
/*                                  Keys                                      */
/* -------------------------------------------------------------------------- */

export const profileKeys = {
  all: ['profile'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (userId: number | string) => [...profileKeys.details(), userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
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

export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred.',
): string => error.response?.data?.message || error.message || fallback;

/* -------------------------------------------------------------------------- */
/*                                  Queries                                   */
/* -------------------------------------------------------------------------- */

export const useGetUserProfile = (
  userId: number | string,
  options?: Omit<
    UseQueryOptions<GetUserProfileResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<GetUserProfileResponse, AxiosError<ApiErrorResponse>>({
    queryKey: profileKeys.detail(userId),
    enabled: !!userId,
    queryFn: async () => {
      // NOTE: includes /users here (per your request)
      const res = await axiosInstance.get<GetUserProfileResponse>(`/users/${userId}/profile`);
      return res.data;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                                Mutations                                   */
/* -------------------------------------------------------------------------- */

export const useUpdateUserProfile = (
  callbacks: MutationCallbacks<
    UpdateUserProfileResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    UpdateUserProfileResponse,
    AxiosError<ApiErrorResponse>,
    UpdateUserProfileParams
  >({
    mutationFn: async ({ userId, data }) => {
      const res = await axiosInstance.put<UpdateUserProfileResponse>(
        `/users/${userId}/profile`,
        data,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Profile updated successfully!', 6000);

      queryClient.invalidateQueries({ queryKey: profileKeys.detail(vars.userId) });
      callbacks.onSuccess?.(data);
    },

    onError: (error) => {
      const base = extractErrorMessage(error, 'Failed to update profile.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

export const useUploadProfilePhoto = (
  callbacks: MutationCallbacks<
    UploadProfilePhotoResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<
    UploadProfilePhotoResponse,
    AxiosError<ApiErrorResponse>,
    UploadProfilePhotoParams
  >({
    mutationFn: async ({ userId, file }) => {
      const form = new FormData();
        form.append('photo', file);

        // DEBUG: verify content
        for (const [k, v] of form.entries()) {
        console.log('FormData entry:', k, v);
        }


      // IMPORTANT:
      // Do NOT force Content-Type. Axios sets the multipart boundary correctly.
      const res = await axiosInstance.post<UploadProfilePhotoResponse>(
        `/users/${userId}/profile/photo`,
        form,
      );

      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Photo updated!', 5000);

      // Patch cache immediately so UI reflects the new path without waiting.
      queryClient.setQueryData(profileKeys.detail(vars.userId), (prev: any) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            profile_photo_path: data.data.profile_photo_path,
          },
        };
      });

      // Also refetch to sync any backend-side computed fields.
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(vars.userId) });

      callbacks.onSuccess?.(data);
    },

    onError: (error) => {
      const msg = extractErrorMessage(error, 'Photo upload failed.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${msg} (${details})` : msg, 9000);
      callbacks.onError?.(error);
    },
  });
};
