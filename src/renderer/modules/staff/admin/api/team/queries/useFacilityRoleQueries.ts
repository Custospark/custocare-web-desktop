/**
 * ============================================================================
 * FACILITY ROLES REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for facility role
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useFacilityRoleQueries
 * @description Provides type-safe, reusable hooks for all facility role CRUD
 * operations. Component redirects are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CreateFacilityRoleRequest,
  FacilityRoleFilters,
  FacilityRole,
  FacilityRoleId,
  GetFacilityRolesResponse,
  FacilityRoleResponse,
  DeleteFacilityRoleResponse,
  MutationCallbacks,
  UpdateFacilityRoleParams,
  DeleteFacilityRoleParams,
} from '../types/facilityRolesTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all facility role queries
 * queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all });
 * 
 * // Invalidate specific facility role
 * queryClient.invalidateQueries({ queryKey: facilityRoleKeys.detail(id) });
 */
export const facilityRoleKeys = {
  all: ['facility-roles'] as const,
  lists: () => [...facilityRoleKeys.all, 'list'] as const,
  list: (filters: FacilityRoleFilters) => [...facilityRoleKeys.lists(), filters] as const,
  details: () => [...facilityRoleKeys.all, 'detail'] as const,
  detail: (id: FacilityRoleId) => [...facilityRoleKeys.details(), id] as const,
  systemRoles: () => [...facilityRoleKeys.all, 'system-roles'] as const,
  facilitySpecific: (facilityId: number) => [...facilityRoleKeys.all, 'facility', facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a list of facility roles with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility roles list
 * 
 * @example
 * const { data, isLoading, error } = useGetFacilityRoles({
 *   is_system_role: true
 * });
 */
export const useGetFacilityRoles = (
  filters: FacilityRoleFilters = {},
  options?: Omit<UseQueryOptions<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityRoleKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityRolesResponse>('/facility-roles', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single facility role by ID with full details.
 * 
 * @param id - Facility role ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete facility role details
 * 
 * @example
 * const { data, isLoading } = useGetFacilityRoleById(1);
 */
export const useGetFacilityRoleById = (
  id: FacilityRoleId,
  options?: Omit<UseQueryOptions<FacilityRole, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FacilityRole, AxiosError<ApiErrorResponse>>({
    queryKey: facilityRoleKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<FacilityRoleResponse>(`/roles/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches all system-defined facility roles.
 * System roles are predefined and cannot be deleted.
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with system facility roles
 * 
 * @example
 * const { data } = useGetSystemFacilityRoles();
 */
export const useGetSystemFacilityRoles = (
  options?: Omit<UseQueryOptions<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityRoleKeys.systemRoles(),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityRolesResponse>('/roles', {
        params: { is_system_role: true },
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches all facility-specific custom roles.
 * Custom roles are created by facility administrators.
 * 
 * @param facilityId - Facility ID to filter roles
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific roles
 * 
 * @example
 * const { data } = useGetFacilitySpecificRoles(5);
 */
export const useGetFacilitySpecificRoles = (
  facilityId: number,
  options?: Omit<UseQueryOptions<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilityRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityRoleKeys.facilitySpecific(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityRolesResponse>('/roles', {
        params: { facility_id: facilityId, is_system_role: false },
      });
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new facility role in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateFacilityRole({
 *   onSuccess: (data) => navigate(`/roles/${data.data.id}`),
 * });
 * 
 * mutate({
 *   name: 'Senior Nurse',
 *   code: 'senior-nurse',
 *   description: 'Senior nursing staff'
 * });
 */
export const useCreateFacilityRole = (
  callbacks: MutationCallbacks<FacilityRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<FacilityRoleResponse, AxiosError<ApiErrorResponse>, CreateFacilityRoleRequest>({
    mutationFn: async (data: CreateFacilityRoleRequest) => {
      const response = await axiosInstance.post<FacilityRoleResponse>('/roles', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility role created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create facility role.';

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
 * Updates an existing facility role by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateFacilityRole({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all }),
 * });
 * 
 * mutate({
 *   id: 1,
 *   data: { description: 'Updated description' }
 * });
 */
export const useUpdateFacilityRole = (
  callbacks: MutationCallbacks<FacilityRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<FacilityRoleResponse, AxiosError<ApiErrorResponse>, UpdateFacilityRoleParams>({
    mutationFn: async ({ id, data }: UpdateFacilityRoleParams) => {
      const response = await axiosInstance.put<FacilityRoleResponse>(`/roles/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility role updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update facility role.';

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
 * Deletes a facility role by ID.
 * Note: System roles cannot be deleted and will return an error.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteFacilityRole({
 *   onSuccess: () => navigate('/roles'),
 * });
 * 
 * mutate({ id: 1 });
 */
export const useDeleteFacilityRole = (
  callbacks: MutationCallbacks<DeleteFacilityRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteFacilityRoleResponse, AxiosError<ApiErrorResponse>, DeleteFacilityRoleParams>({
    mutationFn: async ({ id }: DeleteFacilityRoleParams) => {
      const response = await axiosInstance.delete<DeleteFacilityRoleResponse>(`/roles/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Facility role deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete facility role.';

      // Handle specific error for system roles
      if (apiMessage.toLowerCase().includes('system role')) {
        showToast('error', 'System roles cannot be deleted.', 8000);
      } else {
        showToast('error', apiMessage, 8000);
      }

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
  useGetFacilityRoles,
  useGetFacilityRoleById,
  useGetSystemFacilityRoles,
  useGetFacilitySpecificRoles,

  // Mutation hooks
  useCreateFacilityRole,
  useUpdateFacilityRole,
  useDeleteFacilityRole,

  // Utilities
  facilityRoleKeys,
  extractErrorMessage,
  formatValidationErrors,
};