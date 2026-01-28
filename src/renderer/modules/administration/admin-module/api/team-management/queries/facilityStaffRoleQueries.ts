/**
 * ============================================================================
 * FACILITY STAFF ROLE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for facility
 * staff role management operations. Handles API communication, error handling,
 * and toast notifications.
 * 
 * @module useFacilityStaffRoleQueries
 * @description Provides type-safe, reusable hooks for all facility staff role
 * CRUD operations and assignments.
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
  FacilityStaffRoleFilters,
  FacilityStaffRole,
  FacilityStaffRoleId,
  GetFacilityStaffRolesResponse,
  FacilityStaffRoleResponse,
  UpdateFacilityStaffRoleResponse,
  DeleteFacilityStaffRoleResponse,
  MutationCallbacks,
  UpdateFacilityStaffRoleParams,
  DeleteFacilityStaffRoleParams,
  CreateFacilityStaffRoleParams,
  CreateFacilityStaffRoleResponse,
  GetFacilityStaffRoleParams,
} from '../types/facilityStaffRoleTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 */
export const facilityStaffRoleKeys = {
  all: ['facility-staff-roles'] as const,
  lists: () => [...facilityStaffRoleKeys.all, 'list'] as const,
  list: (filters: FacilityStaffRoleFilters) => [...facilityStaffRoleKeys.lists(), filters] as const,
  details: () => [...facilityStaffRoleKeys.all, 'detail'] as const,
  detail: (id: FacilityStaffRoleId) => [...facilityStaffRoleKeys.details(), id] as const,
  staffAssignments: () => [...facilityStaffRoleKeys.all, 'staff-assignments'] as const,
  staffAssignment: (staffId: number, facilityId?: number) => [
    ...facilityStaffRoleKeys.staffAssignments(),
    staffId,
    facilityId
  ] as const,
  facilityAssignments: () => [...facilityStaffRoleKeys.all, 'facility-assignments'] as const,
  facilityAssignment: (facilityId: number, status?: string) => [
    ...facilityStaffRoleKeys.facilityAssignments(),
    facilityId,
    status
  ] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a list of facility staff roles with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility staff roles list
 * 
 * @example
 * const { data, isLoading, error } = useGetFacilityStaffRoles({
 *   facility_id: 1,
 *   assignment_status: 'active'
 * });
 */
export const useGetFacilityStaffRoles = (
  filters: FacilityStaffRoleFilters = {},
  options?: Omit<UseQueryOptions<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStaffRoleKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityStaffRolesResponse>('/facility-staff-roles', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single facility staff role by ID with full details.
 * 
 * @param id - Facility staff role ID to fetch
 * @param params - Optional parameters like include relationships
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete facility staff role details
 * 
 * @example
 * const { data, isLoading } = useGetFacilityStaffRoleById(1, { include: ['facility', 'staff'] });
 */
export const useGetFacilityStaffRoleById = (
  id: FacilityStaffRoleId,
  params: GetFacilityStaffRoleParams = { id },
  options?: Omit<UseQueryOptions<FacilityStaffRole, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<FacilityStaffRole, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStaffRoleKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<FacilityStaffRoleResponse>(
        `/facility-staff-roles/${id}`,
        { params: { include: params.include } }
      );
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches all facility staff role assignments for a specific staff member.
 * 
 * @param staffId - Staff ID to fetch assignments for
 * @param facilityId - Optional facility ID to filter by specific facility
 * @param options - React Query options for customizing behavior
 * @returns Query result with staff's facility assignments
 * 
 * @example
 * const { data } = useGetStaffFacilityAssignments(123);
 */
export const useGetStaffFacilityAssignments = (
  staffId: number,
  facilityId?: number,
  options?: Omit<UseQueryOptions<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const filters: FacilityStaffRoleFilters = { staff_id: staffId };
  if (facilityId) {
    filters.facility_id = facilityId;
  }

  return useQuery<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStaffRoleKeys.staffAssignment(staffId, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityStaffRolesResponse>('/facility-staff-roles', {
        params: filters,
      });
      return response.data;
    },
    enabled: !!staffId,
    ...options,
  });
};

/**
 * Fetches all staff role assignments for a specific facility.
 * 
 * @param facilityId - Facility ID to fetch assignments for
 * @param status - Optional assignment status filter
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility's staff assignments
 * 
 * @example
 * const { data } = useGetFacilityStaffAssignments(1, 'active');
 */
export const useGetFacilityStaffAssignments = (
  facilityId: number,
  status?: string,
  options?: Omit<UseQueryOptions<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const filters: FacilityStaffRoleFilters = { facility_id: facilityId };
  if (status) {
    filters.assignment_status = status as any;
  }

  return useQuery<GetFacilityStaffRolesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityStaffRoleKeys.facilityAssignment(facilityId, status),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityStaffRolesResponse>('/facility-staff-roles', {
        params: filters,
      });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new facility staff role assignment.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateFacilityStaffRole({
 *   onSuccess: (data) => navigate(`/facility-staff-roles/${data.data.id}`),
 * });
 * 
 * mutate({
 *   data: {
 *     facility_id: 1,
 *     staff_id: 123,
 *     role_code: 'attending_physician',
 *     department_ids: [1, 2]
 *   }
 * });
 */
export const useCreateFacilityStaffRole = (
  callbacks: MutationCallbacks<CreateFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<CreateFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>, CreateFacilityStaffRoleParams>({
    mutationFn: async ({ data }: CreateFacilityStaffRoleParams) => {
      const response = await axiosInstance.post<CreateFacilityStaffRoleResponse>('/facility-staff-roles', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff role assignment created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create staff role assignment.';

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
 * Updates an existing facility staff role assignment by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateFacilityStaffRole({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: facilityStaffRoleKeys.all }),
 * });
 * 
 * mutate({
 *   id: 1,
 *   data: {
 *     assignment_status: 'active',
 *     hours_per_week: 40
 *   }
 * });
 */
export const useUpdateFacilityStaffRole = (
  callbacks: MutationCallbacks<UpdateFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<UpdateFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>, UpdateFacilityStaffRoleParams>({
    mutationFn: async ({ id, data }: UpdateFacilityStaffRoleParams) => {
      const response = await axiosInstance.put<UpdateFacilityStaffRoleResponse>(`/facility-staff-roles/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage ='Staff role assignment updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update staff role assignment.';

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
 * Deletes/Deactivates a facility staff role assignment by ID.
 * Role is not deleted but marked as terminated/deactivated.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteFacilityStaffRole({
 *   onSuccess: () => navigate('/facility-staff-roles'),
 * });
 * 
 * mutate({
 *   id: 1,
 *   deactivation_reason: 'Staff resigned'
 * });
 */
export const useDeleteFacilityStaffRole = (
  callbacks: MutationCallbacks<DeleteFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteFacilityStaffRoleResponse, AxiosError<ApiErrorResponse>, DeleteFacilityStaffRoleParams>({
    mutationFn: async ({ id, deactivation_reason }: DeleteFacilityStaffRoleParams) => {
      const config = deactivation_reason ? {
        data: { deactivation_reason }
      } : {};
      
      const response = await axiosInstance.delete<DeleteFacilityStaffRoleResponse>(
        `/facility-staff-roles/${id}`,
        config
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff role assignment deactivated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to deactivate staff role assignment.';
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

/**
 * Helper to get active assignments for a staff member at a facility.
 * 
 * @param assignments - Array of staff role assignments
 * @returns Active assignments only
 */
export const getActiveAssignments = (assignments: FacilityStaffRole[]): FacilityStaffRole[] => {
  return assignments.filter(assignment => 
    assignment.assignment_status === 'active' && 
    (!assignment.effective_to || new Date(assignment.effective_to) >= new Date())
  );
};

/**
 * Helper to get primary facility assignment for a staff member.
 * 
 * @param assignments - Array of staff role assignments
 * @returns Primary facility assignment or null
 */
export const getPrimaryFacilityAssignment = (assignments: FacilityStaffRole[]): FacilityStaffRole | null => {
  return assignments.find(assignment => assignment.is_primary_facility) || null;
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Query keys
  facilityStaffRoleKeys,
  
  // Query hooks
  useGetFacilityStaffRoles,
  useGetFacilityStaffRoleById,
  useGetStaffFacilityAssignments,
  useGetFacilityStaffAssignments,
  
  // Mutation hooks
  useCreateFacilityStaffRole,
  useUpdateFacilityStaffRole,
  useDeleteFacilityStaffRole,
  
  // Utility functions
  extractErrorMessage,
  formatValidationErrors,
  getActiveAssignments,
  getPrimaryFacilityAssignment,
};