/**
 * ============================================================================
 * PLATFORM ADMIN CONTROL REACT QUERY HOOKS
 * ============================================================================
 * 
 * React Query hooks for platform-wide facility, user, and patient management.
 * No caching to ensure real-time data for platform administrators.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import type {
  ApiResponse,
  ApiErrorResponse,
  FacilitiesResponse,
  UsersResponse,
  PatientsResponse,
  FacilityFilters,
  UserFilters,
  PatientFilters,
  UpdateStatusRequest,
  UpdateStatusResponse,
} from './PlatformControlTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const platformControlKeys = {
  all: ['platform-admin'] as const,
  facilities: (filters?: FacilityFilters) => 
    [...platformControlKeys.all, 'facilities', filters] as const,
  users: (filters?: UserFilters) => 
    [...platformControlKeys.all, 'users', filters] as const,
  patients: (filters?: PatientFilters) => 
    [...platformControlKeys.all, 'patients', filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                            FACILITIES QUERIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Fetch paginated list of all facilities with optional filters.
 */
export const usePlatformFacilities = (
  filters: FacilityFilters = {},
  options?: Omit<UseQueryOptions<ApiResponse<FacilitiesResponse>, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<FacilitiesResponse>, AxiosError<ApiErrorResponse>>({
    queryKey: platformControlKeys.facilities(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await axiosInstance.get<ApiResponse<FacilitiesResponse>>(
        `/platform-admin/list-all-platform-facilities?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Update a facility's status.
 */
export const useUpdateFacilityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<UpdateStatusResponse>,
    AxiosError<ApiErrorResponse>,
    { facilityId: number; data: UpdateStatusRequest }
  >({
    mutationFn: async ({ facilityId, data }) => {
      const response = await axiosInstance.patch<ApiResponse<UpdateStatusResponse>>(
        `/platform-admin/facilities/${facilityId}/status`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all facility queries to refresh the list
      queryClient.invalidateQueries({ queryKey: platformControlKeys.all });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                               USERS QUERIES                                */
/* -------------------------------------------------------------------------- */

/**
 * Fetch paginated list of all users with optional filters.
 */
export const usePlatformUsers = (
  filters: UserFilters = {},
  options?: Omit<UseQueryOptions<ApiResponse<UsersResponse>, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<UsersResponse>, AxiosError<ApiErrorResponse>>({
    queryKey: platformControlKeys.users(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await axiosInstance.get<ApiResponse<UsersResponse>>(
        `/platform-admin/list-all-platform-users?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Update a user's status.
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<UpdateStatusResponse>,
    AxiosError<ApiErrorResponse>,
    { userId: number; data: UpdateStatusRequest }
  >({
    mutationFn: async ({ userId, data }) => {
      const response = await axiosInstance.patch<ApiResponse<UpdateStatusResponse>>(
        `/platform-admin/users/${userId}/status`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformControlKeys.all });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                              PATIENTS QUERIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Fetch paginated list of all patients with optional filters.
 */
export const usePlatformPatients = (
  filters: PatientFilters = {},
  options?: Omit<UseQueryOptions<ApiResponse<PatientsResponse>, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<PatientsResponse>, AxiosError<ApiErrorResponse>>({
    queryKey: platformControlKeys.patients(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await axiosInstance.get<ApiResponse<PatientsResponse>>(
        `/platform-admin/list-all-platform-patients?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Extract error message from API error.
 */
export const extractPlatformErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred'
): string => {
  return error.response?.data?.message || error.message || fallback;
};

// Export all hooks as a namespace for convenience
export const PlatformControlQueries = {
  usePlatformFacilities,
  useUpdateFacilityStatus,
  usePlatformUsers,
  useUpdateUserStatus,
  usePlatformPatients,
  platformControlKeys,
  extractPlatformErrorMessage,
};

export default PlatformControlQueries;