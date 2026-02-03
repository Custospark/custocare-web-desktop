/**
 * ============================================================================
 * WARD REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for ward
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useWardQueries
 * @description Provides type-safe, reusable hooks for all ward CRUD
 * operations and custom queries.
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
  CreateWardRequest,
  DeleteWardParams,
  DeleteWardResponse,
  WardFilters,
  GetWardsResponse,
  WardResponse,
  WardId,
  FacilityId,
  MutationCallbacks,
  UpdateWardParams,
  Ward,
  GetWardParams,
} from './wardTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all ward queries
 * queryClient.invalidateQueries({ queryKey: wardKeys.all });
 * 
 * // Invalidate specific facility's wards
 * queryClient.invalidateQueries({ queryKey: wardKeys.byFacility(1) });
 */
export const wardKeys = {
  all: ['wards'] as const,
  lists: () => [...wardKeys.all, 'list'] as const,
  list: (filters: WardFilters) => [...wardKeys.lists(), filters] as const,
  details: () => [...wardKeys.all, 'detail'] as const,
  detail: (id: WardId, facilityId: FacilityId) => [...wardKeys.details(), id, facilityId] as const,
  byFacility: (facilityId: FacilityId) => [...wardKeys.all, 'facility', facilityId] as const,
  byStatus: (facilityId: FacilityId, status: string) => [...wardKeys.all, 'facility', facilityId, 'status', status] as const,
  byType: (facilityId: FacilityId, wardType: string) => [...wardKeys.all, 'facility', facilityId, 'type', wardType] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a list of wards with filtering options.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with wards list
 * 
 * @example
 * const { data, isLoading, error } = useGetWards({
 *   facility_id: 1,
 *   status: 'active',
 *   ward_type: 'medical',
 *   search: 'med'
 * });
 */
export const useGetWards = (
  filters: WardFilters,
  options?: Omit<UseQueryOptions<GetWardsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetWardsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: wardKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: GetWardsResponse }>('/wards', {
        params: filters,
      });
      return response.data.data;
    },
    enabled: !!filters.facility_id, // Only run query if facility_id is provided
    ...options,
  });
};

/**
 * Fetches a single ward by ID with facility scope.
 * 
 * @param params - Ward ID and facility ID
 * @param options - React Query options for customizing behavior
 * @returns Query result with ward details
 * 
 * @example
 * const { data, isLoading } = useGetWardById({ id: 1, facility_id: 1 });
 */
export const useGetWardById = (
  params: GetWardParams,
  options?: Omit<UseQueryOptions<Ward, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Ward, AxiosError<ApiErrorResponse>>({
    queryKey: wardKeys.detail(params.id, params.facility_id),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Ward }>(`/wards/${params.id}`, {
        params: { facility_id: params.facility_id },
      });
      return response.data.data;
    },
    enabled: !!params.id && !!params.facility_id,
    ...options,
  });
};

/**
 * Fetches all wards for a specific facility.
 * 
 * @param facilityId - Facility ID to filter wards
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific wards
 * 
 * @example
 * const { data } = useGetWardsByFacility(1);
 */
export const useGetWardsByFacility = (
  facilityId: FacilityId,
  options?: Omit<UseQueryOptions<GetWardsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetWardsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: wardKeys.byFacility(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: GetWardsResponse }>('/wards', {
        params: { facility_id: facilityId },
      });
      return response.data.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Fetches all wards of a specific status within a facility.
 * 
 * @param facilityId - Facility ID
 * @param status - Ward status to filter
 * @param options - React Query options for customizing behavior
 * @returns Query result with status-filtered wards
 * 
 * @example
 * const { data } = useGetWardsByStatus(1, 'active');
 */
export const useGetWardsByStatus = (
  facilityId: FacilityId,
  status: string,
  options?: Omit<UseQueryOptions<GetWardsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetWardsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: wardKeys.byStatus(facilityId, status),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: GetWardsResponse }>('/wards', {
        params: { facility_id: facilityId, status },
      });
      return response.data.data;
    },
    enabled: !!facilityId && !!status,
    ...options,
  });
};

/**
 * Fetches all wards of a specific type within a facility.
 * 
 * @param facilityId - Facility ID
 * @param wardType - Ward type to filter
 * @param options - React Query options for customizing behavior
 * @returns Query result with type-filtered wards
 * 
 * @example
 * const { data } = useGetWardsByType(1, 'medical');
 */
export const useGetWardsByType = (
  facilityId: FacilityId,
  wardType: string,
  options?: Omit<UseQueryOptions<GetWardsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetWardsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: wardKeys.byType(facilityId, wardType),
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: GetWardsResponse }>('/wards', {
        params: { facility_id: facilityId, ward_type: wardType },
      });
      return response.data.data;
    },
    enabled: !!facilityId && !!wardType,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new ward in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateWard({
 *   onSuccess: (data) => navigate(`/wards`),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   name: 'Medical Ward',
 *   ward_type: 'medical'
 * });
 */
export const useCreateWard = (
  callbacks: MutationCallbacks<WardResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<WardResponse, AxiosError<ApiErrorResponse>, CreateWardRequest>({
    mutationFn: async (data: CreateWardRequest) => {
      const response = await axiosInstance.post<WardResponse>('/wards', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Ward created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create ward.';

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
 * Updates an existing ward.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateWard({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: wardKeys.all }),
 * });
 * 
 * mutate({
 *   id: 1,
 *   facility_id: 1,
 *   data: { status: 'inactive', capacity_operational: 30 }
 * });
 */
export const useUpdateWard = (
  callbacks: MutationCallbacks<WardResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<WardResponse, AxiosError<ApiErrorResponse>, UpdateWardParams>({
    mutationFn: async ({ id, facility_id, data }: UpdateWardParams) => {
      const response = await axiosInstance.patch<WardResponse>(`/wards/${id}`, data, {
        params: { facility_id },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Ward updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update ward.';

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
 * Deletes a ward by ID.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteWard({
 *   onSuccess: () => navigate('/wards'),
 * });
 * 
 * mutate({ id: 1, facility_id: 1 });
 */
export const useDeleteWard = (
  callbacks: MutationCallbacks<DeleteWardResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteWardResponse, AxiosError<ApiErrorResponse>, DeleteWardParams>({
    mutationFn: async ({ id, facility_id }: DeleteWardParams) => {
      const response = await axiosInstance.delete<DeleteWardResponse>(`/wards/${id}`, {
        params: { facility_id },
      });
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Ward deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete ward.';
      showToast('error', apiMessage, 8000);
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
  useGetWards,
  useGetWardById,
  useGetWardsByFacility,
  useGetWardsByStatus,
  useGetWardsByType,

  // Mutation hooks
  useCreateWard,
  useUpdateWard,
  useDeleteWard,

  // Utilities
  wardKeys,
  extractErrorMessage,
  formatValidationErrors,
};