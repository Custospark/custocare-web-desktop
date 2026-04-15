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
  Facility,
  Patient,
  UsersResponse,
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
 * Backend returns: { success, data: Facility[], meta: { ... } }
 */
export const usePlatformFacilities = (
  filters: FacilityFilters = {},
  options?: Omit<UseQueryOptions<ApiResponse<Facility[]>, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Facility[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformControlKeys.facilities(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await axiosInstance.get<ApiResponse<Facility[]>>(
        `/platform-admin/list-all-platform-facilities?${params.toString()}`
      );
      // ✅ Return the actual ApiResponse (contains data and meta)
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
      queryClient.invalidateQueries({ queryKey: platformControlKeys.all });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                               USERS QUERIES                                */
/* -------------------------------------------------------------------------- */

// ✅ These stay exactly as they were (unchanged)
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
 * Backend returns: { success, data: Patient[], meta: { ... } }
 */
export const usePlatformPatients = (
  filters: PatientFilters = {},
  options?: Omit<UseQueryOptions<ApiResponse<Patient[]>, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ApiResponse<Patient[]>, AxiosError<ApiErrorResponse>>({
    queryKey: platformControlKeys.patients(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await axiosInstance.get<ApiResponse<Patient[]>>(
        `/platform-admin/list-all-platform-patients?${params.toString()}`
      );
      // ✅ Return the actual ApiResponse
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

export const extractPlatformErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred'
): string => {
  return error.response?.data?.message || error.message || fallback;
};

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