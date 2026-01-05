/**
 * ============================================================================
 * DEPARTMENT REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for department
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useDepartmentQueries
 * @description Provides type-safe, reusable hooks for all department CRUD
 * operations and custom queries. Component redirects are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CreateDepartmentRequest,
  DeleteDepartmentParams,
  DeleteDepartmentResponse,
  DepartmentFilters,
  DepartmentResponse,
  DepartmentUUID,
  FacilityId,
  GetDepartmentsByFacilityResponse,
  GetDepartmentsByTypeResponse,
  GetDepartmentsResponse,
  MutationCallbacks,
  RestoreDepartmentParams,
  RestoreDepartmentResponse,
  UpdateDepartmentParams,
  DepartmentType,
} from './departmentTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all department queries
 * queryClient.invalidateQueries({ queryKey: departmentKeys.all });
 * 
 * // Invalidate specific department
 * queryClient.invalidateQueries({ queryKey: departmentKeys.detail(uuid) });
 */
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: DepartmentFilters) => [...departmentKeys.lists(), filters] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (uuid: DepartmentUUID) => [...departmentKeys.details(), uuid] as const,
  byFacility: (facilityId: FacilityId) => [...departmentKeys.all, 'facility', facilityId] as const,
  byType: (type: DepartmentType) => [...departmentKeys.all, 'type', type] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a paginated list of departments with optional filtering.
 * 
 * @param filters - Query parameters for filtering and pagination
 * @param options - React Query options for customizing behavior
 * @returns Query result with departments list and pagination metadata
 * 
 * @example
 * const { data, isLoading, error } = useGetDepartments({
 *   facility_id: 1,
 *   status: 'active',
 *   per_page: 20
 * });
 */
export const useGetDepartments = (
  filters: DepartmentFilters = {},
  options?: Omit<UseQueryOptions<GetDepartmentsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetDepartmentsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: departmentKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetDepartmentsResponse>('/departments', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single department by UUID with full details.
 * Automatically loads relationships (facility, parent, children, head).
 * 
 * @param uuid - Department UUID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete department details
 * 
 * @example
 * const { data, isLoading } = useGetDepartmentByUUID('abc-123-def');
 */
export const useGetDepartmentByUUID = (
  uuid: DepartmentUUID,
  options?: Omit<UseQueryOptions<DepartmentResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<DepartmentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: departmentKeys.detail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<DepartmentResponse>(`/departments/${uuid}`);
      return response.data;
    },
    enabled: !!uuid, // Only run query if UUID is provided
    ...options,
  });
};

/**
 * Fetches all departments for a specific facility.
 * Useful for facility-scoped department selection and management.
 * 
 * @param facilityId - Facility ID to filter departments
 * @param filters - Additional filters (type, status, with_children)
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific departments
 * 
 * @example
 * const { data } = useGetDepartmentsByFacility(5, { status: 'active' });
 */
export const useGetDepartmentsByFacility = (
  facilityId: FacilityId,
  filters: Pick<DepartmentFilters, 'department_type' | 'status' | 'with_children'> = {},
  options?: Omit<UseQueryOptions<GetDepartmentsByFacilityResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetDepartmentsByFacilityResponse, AxiosError<ApiErrorResponse>>({
    queryKey: departmentKeys.byFacility(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetDepartmentsByFacilityResponse>(
        `/departments/facility/${facilityId}`,
        { params: filters }
      );
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is provided
    ...options,
  });
};

/**
 * Fetches all departments of a specific type across facilities.
 * Useful for cross-facility department analysis and reporting.
 * 
 * @param type - Department type to filter
 * @param filters - Additional filters (facility_id, status)
 * @param options - React Query options for customizing behavior
 * @returns Query result with type-specific departments
 * 
 * @example
 * const { data } = useGetDepartmentsByType('emergency', { facility_id: 1 });
 */
export const useGetDepartmentsByType = (
  type: DepartmentType,
  filters: Pick<DepartmentFilters, 'facility_id' | 'status'> = {},
  options?: Omit<UseQueryOptions<GetDepartmentsByTypeResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetDepartmentsByTypeResponse, AxiosError<ApiErrorResponse>>({
    queryKey: departmentKeys.byType(type),
    queryFn: async () => {
      const response = await axiosInstance.get<GetDepartmentsByTypeResponse>(
        `/departments/type/${type}`,
        { params: filters }
      );
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
 * Creates a new department in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateDepartment({
 *   onSuccess: (data) => navigate(`/departments/${data.data.department_uuid}`),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   department_name: 'Emergency Department',
 *   department_type: 'emergency'
 * });
 */
export const useCreateDepartment = (
  callbacks: MutationCallbacks<DepartmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DepartmentResponse, AxiosError<ApiErrorResponse>, CreateDepartmentRequest>({
    mutationFn: async (data: CreateDepartmentRequest) => {
      const response = await axiosInstance.post<DepartmentResponse>('/departments', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Department created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create department.';

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
 * Updates an existing department by UUID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateDepartment({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
 * });
 * 
 * mutate({
 *   uuid: 'abc-123',
 *   data: { status: 'inactive', bed_count: 50 }
 * });
 */
export const useUpdateDepartment = (
  callbacks: MutationCallbacks<DepartmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DepartmentResponse, AxiosError<ApiErrorResponse>, UpdateDepartmentParams>({
    mutationFn: async ({ uuid, data }: UpdateDepartmentParams) => {
      const response = await axiosInstance.put<DepartmentResponse>(`/departments/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Department updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update department.';

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
 * Partially updates a department using PATCH method.
 * More semantically correct for partial updates than PUT.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = usePatchDepartment();
 * 
 * mutate({
 *   uuid: 'abc-123',
 *   data: { accepts_walk_ins: true }
 * });
 */
export const usePatchDepartment = (
  callbacks: MutationCallbacks<DepartmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DepartmentResponse, AxiosError<ApiErrorResponse>, UpdateDepartmentParams>({
    mutationFn: async ({ uuid, data }: UpdateDepartmentParams) => {
      const response = await axiosInstance.patch<DepartmentResponse>(`/departments/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Department updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update department.';

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
 * Soft-deletes a department by UUID.
 * Department can be restored later using the restore endpoint.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteDepartment({
 *   onSuccess: () => navigate('/departments'),
 * });
 * 
 * mutate({ uuid: 'abc-123' });
 */
export const useDeleteDepartment = (
  callbacks: MutationCallbacks<DeleteDepartmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteDepartmentResponse, AxiosError<ApiErrorResponse>, DeleteDepartmentParams>({
    mutationFn: async ({ uuid }: DeleteDepartmentParams) => {
      const response = await axiosInstance.delete<DeleteDepartmentResponse>(`/departments/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Department deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete department.';

      // Note: Delete operations typically don't have field-level validation errors
      const displayMessage = apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
  });
};

/**
 * Restores a previously soft-deleted department.
 * Only works on departments that have been soft-deleted (deleted_at is not null).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useRestoreDepartment({
 *   onSuccess: (data) => console.log('Restored:', data.data.department_name),
 * });
 * 
 * mutate({ uuid: 'abc-123' });
 */
export const useRestoreDepartment = (
  callbacks: MutationCallbacks<RestoreDepartmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<RestoreDepartmentResponse, AxiosError<ApiErrorResponse>, RestoreDepartmentParams>({
    mutationFn: async ({ uuid }: RestoreDepartmentParams) => {
      const response = await axiosInstance.post<RestoreDepartmentResponse>(`/departments/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Department restored successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to restore department.';
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
  useGetDepartments,
  useGetDepartmentByUUID,
  useGetDepartmentsByFacility,
  useGetDepartmentsByType,

  // Mutation hooks
  useCreateDepartment,
  useUpdateDepartment,
  usePatchDepartment,
  useDeleteDepartment,
  useRestoreDepartment,

  // Utilities
  departmentKeys,
  extractErrorMessage,
  formatValidationErrors,
};