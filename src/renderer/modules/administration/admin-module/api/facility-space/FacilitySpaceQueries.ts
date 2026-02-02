/**
 * ============================================================================
 * FACILITY SPACE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for facility space
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useFacilitySpaceQueries
 * @description Provides type-safe, reusable hooks for all facility space CRUD
 * operations and custom queries. Component redirects are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CreateFacilitySpaceRequest,
  DeleteFacilitySpaceParams,
  DeleteFacilitySpaceResponse,
  FacilitySpaceFilters,
  FacilitySpaceResponse,
  SpaceId,
  FacilityId,
  GetFacilitySpacesResponse,
  MutationCallbacks,
  UpdateFacilitySpaceParams,
  FacilitySpaceType,
} from './FacilitySpaceTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all space queries
 * queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all });
 * 
 * // Invalidate specific space
 * queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.detail(id) });
 */
export const facilitySpaceKeys = {
  all: ['facilitySpaces'] as const,
  lists: () => [...facilitySpaceKeys.all, 'list'] as const,
  list: (filters: FacilitySpaceFilters) => [...facilitySpaceKeys.lists(), filters] as const,
  details: () => [...facilitySpaceKeys.all, 'detail'] as const,
  detail: (id: SpaceId) => [...facilitySpaceKeys.details(), id] as const,
  byFacility: (facilityId: FacilityId) => [...facilitySpaceKeys.all, 'facility', facilityId] as const,
  byType: (type: FacilitySpaceType) => [...facilitySpaceKeys.all, 'type', type] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a list of facility spaces with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with spaces list
 * 
 * @example
 * const { data, isLoading, error } = useGetFacilitySpaces({
 *   facility_id: 1,
 *   active_only: true,
 *   type: 'consultation'
 * });
 */
export const useGetFacilitySpaces = (
  filters: FacilitySpaceFilters = {},
  options?: Omit<UseQueryOptions<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilitySpaceKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilitySpacesResponse>('/facility/spaces', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single facility space by ID with details.
 * 
 * @param id - Facility space ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete space details
 * 
 * @example
 * const { data, isLoading } = useGetFacilitySpaceById(123);
 */
export const useGetFacilitySpaceById = (
  id: SpaceId,
  options?: Omit<UseQueryOptions<FacilitySpaceResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FacilitySpaceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilitySpaceKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<FacilitySpaceResponse>(`/facility/spaces/${id}`);
      return response.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches all spaces for a specific facility.
 * Useful for facility-scoped space selection and management.
 * 
 * @param facilityId - Facility ID to filter spaces
 * @param filters - Additional filters (type, active_only)
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific spaces
 * 
 * @example
 * const { data } = useGetFacilitySpacesByFacility(5, { active_only: true });
 */
export const useGetFacilitySpacesByFacility = (
  facilityId: FacilityId,
  filters: Pick<FacilitySpaceFilters, 'type' | 'active_only' | 'is_active'> = {},
  options?: Omit<UseQueryOptions<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilitySpaceKeys.byFacility(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilitySpacesResponse>('/facility/spaces', {
        params: { facility_id: facilityId, ...filters },
      });
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is provided
    ...options,
  });
};

/**
 * Fetches all spaces of a specific type across facilities.
 * Useful for cross-facility space analysis and reporting.
 * 
 * @param type - Space type to filter
 * @param filters - Additional filters (facility_id, active_only)
 * @param options - React Query options for customizing behavior
 * @returns Query result with type-specific spaces
 * 
 * @example
 * const { data } = useGetFacilitySpacesByType('consultation', { facility_id: 1 });
 */
export const useGetFacilitySpacesByType = (
  type: FacilitySpaceType,
  filters: Pick<FacilitySpaceFilters, 'facility_id' | 'active_only' | 'is_active'> = {},
  options?: Omit<UseQueryOptions<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilitySpacesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilitySpaceKeys.byType(type),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilitySpacesResponse>('/facility/spaces', {
        params: { type, ...filters },
      });
      return response.data;
    },
    enabled: !!type, // Only run query if type is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new facility space in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateFacilitySpace({
 *   onSuccess: (data) => navigate(`/facility/spaces/${data.data.id}`),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   name: 'Consultation Room 101',
 *   type: 'consultation',
 *   floor: '1',
 *   building: 'Main'
 * });
 */
export const useCreateFacilitySpace = (
  callbacks: MutationCallbacks<FacilitySpaceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<FacilitySpaceResponse, AxiosError<ApiErrorResponse>, CreateFacilitySpaceRequest>({
    mutationFn: async (data: CreateFacilitySpaceRequest) => {
      const response = await axiosInstance.post<FacilitySpaceResponse>('/facility/spaces', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility space created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create facility space.';

      // Extract validation errors if present
      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates an existing facility space by ID.
 * Uses PATCH method as per backend implementation.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateFacilitySpace({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all }),
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: { is_active: false, name: 'Updated Room Name' }
 * });
 */
export const useUpdateFacilitySpace = (
  callbacks: MutationCallbacks<FacilitySpaceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<FacilitySpaceResponse, AxiosError<ApiErrorResponse>, UpdateFacilitySpaceParams>({
    mutationFn: async ({ id, data }: UpdateFacilitySpaceParams) => {
      const response = await axiosInstance.patch<FacilitySpaceResponse>(`/facility/spaces/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility space updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update facility space.';

      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
  });
};

/**
 * Deletes a facility space by ID.
 * Note: This is a hard delete based on backend cascade delete.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteFacilitySpace({
 *   onSuccess: () => navigate('/facility/spaces'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useDeleteFacilitySpace = (
  callbacks: MutationCallbacks<DeleteFacilitySpaceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteFacilitySpaceResponse, AxiosError<ApiErrorResponse>, DeleteFacilitySpaceParams>({
    mutationFn: async ({ id }: DeleteFacilitySpaceParams) => {
      const response = await axiosInstance.delete<DeleteFacilitySpaceResponse>(`/facility/spaces/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility space deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete facility space.';
      const displayMessage = apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * Prioritizes API message, falls back to generic error message.
 * 
 * @param error - Axios error from failed request
 * @param fallbackMessage - Default message if API message unavailable
 * @returns Human-readable error message
 * 
 * @internal
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
 * 
 * @param errors - Validation errors object from API
 * @returns Formatted error string or empty string if no errors
 * 
 * @internal
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
  useGetFacilitySpaces,
  useGetFacilitySpaceById,
  useGetFacilitySpacesByFacility,
  useGetFacilitySpacesByType,

  // Mutation hooks
  useCreateFacilitySpace,
  useUpdateFacilitySpace,
  useDeleteFacilitySpace,

  // Utilities
  facilitySpaceKeys,
  extractErrorMessage,
  formatValidationErrors,
};