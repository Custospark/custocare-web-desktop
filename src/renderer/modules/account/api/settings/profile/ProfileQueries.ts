/**
 * ============================================================================
 * PROFILE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for user profile
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useProfileQueries
 * @description Provides type-safe, reusable hooks for profile CRUD operations
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  GetProfileResponse,
  UpdateProfileParams,
  UpdateProfileResponse,
  UserParams,
  MutationCallbacks,
  ProfilePhotoUploadParams,
  ProfilePhotoUploadResponse,
} from './ProfileTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 */
export const profileKeys = {
  all: ['profiles'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (user: number | string) => [...profileKeys.details(), user] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches user profile by user ID or 'me' for current user.
 * 
 * @param params - User parameters (ID or 'me')
 * @param options - React Query options for customizing behavior
 * @returns Query result with user profile data
 * 
 * @example
 * // Get current user profile
 * const { data, isLoading } = useGetProfile({ user: 'me' });
 * 
 * // Get specific user profile
 * const { data } = useGetProfile({ user: 123 });
 */
export const useGetProfile = (
  params: UserParams,
  options?: Omit<UseQueryOptions<GetProfileResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { user } = params;

  return useQuery<GetProfileResponse, AxiosError<ApiErrorResponse>>({
    queryKey: profileKeys.detail(user),
    queryFn: async () => {
      const response = await axiosInstance.get<GetProfileResponse>(`users/${user}/profile`);
      return response.data;
    },
    enabled: !!user, // Only run query if user is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Updates user profile information.
 * Supports partial updates - only provided fields are modified.
 * Matches validation rules from UpdateUserProfileRequest.
 * 
 * @param callbacks - Optional onSuccess, onError, and onSettled callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useUpdateProfile({
 *   onSuccess: (data) => console.log('Profile updated:', data),
 *   onError: (error) => console.error('Update failed:', error),
 * });
 * 
 * mutate({
 *   user: 'me',
 *   data: {
 *     first_name: 'John',
 *     last_name: 'Smith',
 *     title: 'Senior Developer',
 *   }
 * });
 */
export const useUpdateProfile = (
  callbacks: MutationCallbacks<UpdateProfileResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, AxiosError<ApiErrorResponse>, UpdateProfileParams>({
    mutationFn: async ({ user, data }: UpdateProfileParams) => {
      const response = await axiosInstance.put<UpdateProfileResponse>(`users/${user}/profile`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Profile updated successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate and refetch profile query to reflect changes
      queryClient.invalidateQueries({ 
        queryKey: profileKeys.detail(variables.user) 
      });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update profile.';

      // Extract validation errors if present (from UpdateUserProfileRequest)
      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => {
            // Format field names for better readability
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            return `${fieldName}: ${msgs.join(', ')}`;
          })
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Updates profile photo by uploading a file.
 * Photo upload should be handled separately, then profile_photo_path is updated.
 * 
 * @param callbacks - Optional callbacks for upload progress and completion
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useProfilePhotoUpload({
 *   onSuccess: (data) => console.log('Photo uploaded:', data),
 *   onProgress: (percentage) => console.log(`${percentage}% uploaded`),
 * });
 * 
 * mutate({
 *   photo: fileInput.files[0],
 *   onProgress: (p) => setUploadProgress(p),
 * });
 */
export const useProfilePhotoUpload = (
  callbacks: MutationCallbacks<ProfilePhotoUploadResponse, AxiosError<ApiErrorResponse>> & {
    onProgress?: (percentage: number) => void;
  } = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ProfilePhotoUploadResponse, AxiosError<ApiErrorResponse>, ProfilePhotoUploadParams>({
    mutationFn: async ({ photo, onProgress }: ProfilePhotoUploadParams) => {
      const formData = new FormData();
      formData.append('photo', photo);

      const response = await axiosInstance.post<ProfilePhotoUploadResponse>(
        '/profile/photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentage);
            } else if (onProgress) {
              onProgress(0);
            }
            callbacks.onProgress?.(progressEvent.loaded && progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total) 
              : 0);
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Profile photo uploaded successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate profile queries to refresh photo path
      queryClient.invalidateQueries({ 
        queryKey: profileKeys.all 
      });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to upload profile photo.';
      
      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([, msgs]) => msgs.join(', '))
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * Prioritizes API message, falls back to generic error message.
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
 * Converts Laravel validation error format to user-friendly display.
 */
export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) {
    return '';
  }

  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Query hooks
  useGetProfile,
  
  // Mutation hooks
  useUpdateProfile,
  useProfilePhotoUpload,
  
  // Utilities
  profileKeys,
  extractErrorMessage,
  formatValidationErrors,
};