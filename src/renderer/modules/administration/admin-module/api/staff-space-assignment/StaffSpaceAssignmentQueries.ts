/**
 * ============================================================================
 * STAFF SPACE ASSIGNMENT REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for staff space
 * assignment management operations. Handles API communication, error handling,
 * and toast notifications.
 * 
 * @module useStaffSpaceAssignmentQueries
 * @description Provides type-safe, reusable hooks for all staff space assignment
 * operations including self-service and admin management.
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
  AssignSpaceParams,
  AssignSpaceRequest,
  AvailableSpacesFilters,
  AvailableSpacesResponse,
  CurrentSpaceQuery,
  CurrentSpaceResponse,
  FacilityId,
  MutationCallbacks,
  OccupancyFilters,
  OccupancyResponse,
  ReleaseSpaceByAdminRequest,
  ReleaseSpaceParams,
  ReleaseSpaceRequest,
  StaffForAssignmentFilters,
  StaffForAssignmentResponse,
  AssignmentResponse,
} from './StaffSpaceAssignmentTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 */
export const staffSpaceAssignmentKeys = {
  all: ['staffSpaceAssignments'] as const,
  lists: () => [...staffSpaceAssignmentKeys.all, 'list'] as const,
  list: (filters: OccupancyFilters) => [...staffSpaceAssignmentKeys.lists(), filters] as const,
  current: (query: CurrentSpaceQuery) => [...staffSpaceAssignmentKeys.all, 'current', query] as const,
  details: () => [...staffSpaceAssignmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...staffSpaceAssignmentKeys.details(), id] as const,
  byFacility: (facilityId: FacilityId) => [...staffSpaceAssignmentKeys.all, 'facility', facilityId] as const,
  availableSpaces: (filters: AvailableSpacesFilters) => [...staffSpaceAssignmentKeys.all, 'available', filters] as const,
  staffForAssignment: (facilityId: FacilityId, filters: StaffForAssignmentFilters) => 
    [...staffSpaceAssignmentKeys.all, 'staff-list', facilityId, filters] as const,
  occupancy: (filters: OccupancyFilters) => [...staffSpaceAssignmentKeys.all, 'occupancy', filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the current space assignment for the authenticated staff member.
 * 
 * @param query - Query parameters including facility_id
 * @param options - React Query options
 * @returns Query result with current space assignment
 * 
 * @example
 * const { data, isLoading } = useGetCurrentSpace({ facility_id: 1 });
 */
export const useGetCurrentSpace = (
  query: CurrentSpaceQuery,
  options?: Omit<UseQueryOptions<CurrentSpaceResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CurrentSpaceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffSpaceAssignmentKeys.current(query),
    queryFn: async () => {
      const response = await axiosInstance.get<CurrentSpaceResponse>('/staff/space', {
        params: query,
      });
      return response.data;
    },
    enabled: !!query.facility_id,
    ...options,
  });
};

/**
 * Fetches current occupancy for a facility with optional filters.
 * 
 * @param filters - Query parameters for filtering occupancy
 * @param options - React Query options
 * @returns Query result with spaces and their current assignments
 * 
 * @example
 * const { data, isLoading } = useGetCurrentOccupancy({
 *   facility_id: 1,
 *   space_type: 'consultation',
 *   per_page: 20
 * });
 */
export const useGetCurrentOccupancy = (
  filters: OccupancyFilters,
  options?: Omit<UseQueryOptions<OccupancyResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<OccupancyResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffSpaceAssignmentKeys.occupancy(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<OccupancyResponse>('/facility/spaces-occupancy', {
        params: filters,
      });
      return response.data;
    },
    enabled: !!filters.facility_id,
    ...options,
  });
};

/**
 * Fetches available spaces for assignment in a facility.
 * 
 * @param filters - Query parameters for filtering available spaces
 * @param options - React Query options
 * @returns Query result with available spaces
 * 
 * @example
 * const { data, isLoading } = useGetAvailableSpaces({
 *   facility_id: 1,
 *   space_type: 'consultation',
 *   per_page: 20
 * });
 */
export const useGetAvailableSpaces = (
  filters: AvailableSpacesFilters,
  options?: Omit<UseQueryOptions<AvailableSpacesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AvailableSpacesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffSpaceAssignmentKeys.availableSpaces(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<AvailableSpacesResponse>('/facility/spaces-available', {
        params: filters,
      });
      return response.data;
    },
    enabled: !!filters.facility_id,
    ...options,
  });
};

/**
 * Fetches staff members for admin space assignment dropdown.
 * 
 * @param facilityId - Facility ID to filter staff
 * @param filters - Additional filters (search, pagination)
 * @param options - React Query options
 * @returns Query result with staff list for assignment
 * 
 * @example
 * const { data, isLoading } = useGetStaffForAssignment(1, { search: 'John' });
 */
export const useGetStaffForAssignment = (
  facilityId: FacilityId,
  filters: StaffForAssignmentFilters = {},
  options?: Omit<UseQueryOptions<StaffForAssignmentResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<StaffForAssignmentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffSpaceAssignmentKeys.staffForAssignment(facilityId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<StaffForAssignmentResponse>(
        `/facility/${facilityId}/staff-for-space-assignment`,
        { params: filters }
      );
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
 * Assigns a space to the authenticated staff member (self-service).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useAssignMySpace({
 *   onSuccess: (data) => console.log('Space assigned:', data.data.id),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   space_id: 123,
 *   note: 'Assigned for morning shift'
 * });
 */
export const useAssignMySpace = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AssignmentResponse, AxiosError<ApiErrorResponse>, AssignSpaceRequest>({
    mutationFn: async (data: AssignSpaceRequest) => {
      const response = await axiosInstance.post<AssignmentResponse>('/staff/space/assign', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Space assigned successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to assign space.';

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
 * Assigns a space to any staff member (admin operation).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useAssignSpaceByAdmin({
 *   onSuccess: (data) => queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all }),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   space_id: 123,
 *   staff_id: 456,
 *   note: 'Admin assignment for rotation'
 * });
 */
export const useAssignSpaceByAdmin = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AssignmentResponse, AxiosError<ApiErrorResponse>, AssignSpaceRequest>({
    mutationFn: async (data: AssignSpaceRequest) => {
      const response = await axiosInstance.post<AssignmentResponse>('/admin/staff/space/assign', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Space assigned successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to assign space.';

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
 * Releases the current space for the authenticated staff member (self-service).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useReleaseMySpace({
 *   onSuccess: (data) => console.log('Space released'),
 * });
 * 
 * mutate({ facility_id: 1 });
 */
export const useReleaseMySpace = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AssignmentResponse, AxiosError<ApiErrorResponse>, ReleaseSpaceRequest>({
    mutationFn: async (data: ReleaseSpaceRequest) => {
      const response = await axiosInstance.post<AssignmentResponse>('/staff/space/release', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Space released successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to release space.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Releases a space for any staff member (admin operation).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useReleaseSpaceByAdmin({
 *   onSuccess: (data) => queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all }),
 * });
 * 
 * mutate({
 *   facility_id: 1,
 *   staff_id: 456
 * });
 */
export const useReleaseSpaceByAdmin = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AssignmentResponse, AxiosError<ApiErrorResponse>, ReleaseSpaceByAdminRequest>({
    mutationFn: async (data: ReleaseSpaceByAdminRequest) => {
      const response = await axiosInstance.post<AssignmentResponse>('/admin/staff/space/release', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Space released successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to release space.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Smart assign space hook that automatically chooses between self and admin assignment
 * based on the presence of staff_id in the request.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useAssignSpace();
 * 
 * // Self assignment
 * mutate({ data: { facility_id: 1, space_id: 123 } });
 * 
 * // Admin assignment
 * mutate({ 
 *   data: { facility_id: 1, space_id: 123, staff_id: 456 },
 *   isAdmin: true 
 * });
 */
export const useAssignSpace = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const assignSelf = useAssignMySpace(callbacks);
  const assignAdmin = useAssignSpaceByAdmin(callbacks);

  return {
    mutate: (params: AssignSpaceParams) => {
      if (params.isAdmin || params.data.staff_id) {
        return assignAdmin.mutate(params.data);
      } else {
        return assignSelf.mutate(params.data);
      }
    },
    mutateAsync: (params: AssignSpaceParams) => {
      if (params.isAdmin || params.data.staff_id) {
        return assignAdmin.mutateAsync(params.data);
      } else {
        return assignSelf.mutateAsync(params.data);
      }
    },
    isPending: assignSelf.isPending || assignAdmin.isPending,
    isError: assignSelf.isError || assignAdmin.isError,
    error: assignSelf.error || assignAdmin.error,
    isSuccess: assignSelf.isSuccess || assignAdmin.isSuccess,
    data: assignSelf.data || assignAdmin.data,
    reset: () => {
      assignSelf.reset();
      assignAdmin.reset();
    },
  };
};

/**
 * Smart release space hook that automatically chooses between self and admin release.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useReleaseSpace();
 * 
 * // Self release
 * mutate({ facilityId: 1 });
 * 
 * // Admin release
 * mutate({ facilityId: 1, staffId: 456, isAdmin: true });
 */
export const useReleaseSpace = (
  callbacks: MutationCallbacks<AssignmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const releaseSelf = useReleaseMySpace(callbacks);
  const releaseAdmin = useReleaseSpaceByAdmin(callbacks);

  return {
    mutate: (params: ReleaseSpaceParams) => {
      if (params.isAdmin || params.staffId) {
        return releaseAdmin.mutate({ 
          facility_id: params.facilityId, 
          staff_id: params.staffId! 
        });
      } else {
        return releaseSelf.mutate({ facility_id: params.facilityId });
      }
    },
    mutateAsync: (params: ReleaseSpaceParams) => {
      if (params.isAdmin || params.staffId) {
        return releaseAdmin.mutateAsync({ 
          facility_id: params.facilityId, 
          staff_id: params.staffId! 
        });
      } else {
        return releaseSelf.mutateAsync({ facility_id: params.facilityId });
      }
    },
    isPending: releaseSelf.isPending || releaseAdmin.isPending,
    isError: releaseSelf.isError || releaseAdmin.isError,
    error: releaseSelf.error || releaseAdmin.error,
    isSuccess: releaseSelf.isSuccess || releaseAdmin.isSuccess,
    data: releaseSelf.data || releaseAdmin.data,
    reset: () => {
      releaseSelf.reset();
      releaseAdmin.reset();
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
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
 */
export default {
  // Query hooks
  useGetCurrentSpace,
  useGetCurrentOccupancy,
  useGetAvailableSpaces,
  useGetStaffForAssignment,

  // Mutation hooks
  useAssignMySpace,
  useAssignSpaceByAdmin,
  useReleaseMySpace,
  useReleaseSpaceByAdmin,
  useAssignSpace,
  useReleaseSpace,

  // Utilities
  staffSpaceAssignmentKeys,
  extractErrorMessage,
  formatValidationErrors,
};