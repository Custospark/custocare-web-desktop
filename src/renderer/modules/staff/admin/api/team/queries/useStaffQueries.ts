/**
 * ============================================================================
 * STAFF REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for staff
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useStaffQueries
 * @description Provides type-safe, reusable hooks for all staff CRUD
 * operations, license management, and compliance tracking. Component redirects
 * are handled externally.
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
  CreateStaffRequest,
  StaffFilters,
  Staff,
  StaffId,
  GetStaffResponse,
  StaffResponse,
  DeleteStaffResponse,
  MutationCallbacks,
  UpdateStaffParams,
  DeleteStaffParams,
  UpdateLicenseParams,
  UpdateEmploymentStatusParams,
  ValidateStaffActionParams,
  ExpiringCredentialsResponse,
  ValidateActionResponse,
} from '../types/staffTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all staff queries
 * queryClient.invalidateQueries({ queryKey: staffKeys.all });
 * 
 * // Invalidate specific staff
 * queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
 */
export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (filters: StaffFilters) => [...staffKeys.lists(), filters] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: StaffId) => [...staffKeys.details(), id] as const,
  expiringCredentials: (days: number) => [...staffKeys.all, 'expiring-credentials', days] as const,
  byFacility: (facilityId: number) => [...staffKeys.all, 'facility', facilityId] as const,
  byDepartment: (departmentId: number) => [...staffKeys.all, 'department', departmentId] as const,
  subordinates: (staffId: StaffId) => [...staffKeys.all, 'subordinates', staffId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a paginated list of staff with optional filtering.
 * 
 * @param filters - Query parameters for filtering and pagination
 * @param options - React Query options for customizing behavior
 * @returns Query result with staff list and pagination metadata
 * 
 * @example
 * const { data, isLoading, error } = useGetStaff({
 *   employment_status: 'employed',
 *   facility_id: 1,
 *   per_page: 20
 * });
 */
/* */
//Get staff members for a given facility.
export const useGetStaff = (
  filters: StaffFilters = {},
  options?: Omit<UseQueryOptions<GetStaffResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffResponse>('/staff', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single staff member by ID with full details.
 * Automatically loads relationships (user, supervisor, subordinates).
 * 
 * @param id - Staff ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete staff details
 * 
 * @example
 * const { data, isLoading } = useGetStaffById(123);
 */
export const useGetStaffById = (
  id: StaffId,
  options?: Omit<UseQueryOptions<Staff, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Staff, AxiosError<ApiErrorResponse>>({
    queryKey: staffKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<StaffResponse>(`/staff/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches staff with expiring credentials.
 * Useful for compliance tracking and renewal reminders.
 * 
 * @param days - Number of days threshold for expiration
 * @param options - React Query options for customizing behavior
 * @returns Query result with staff having expiring credentials
 * 
 * @example
 * const { data } = useGetStaffWithExpiringCredentials(30);
 */
export const useGetStaffWithExpiringCredentials = (
  days: number = 30,
  options?: Omit<UseQueryOptions<ExpiringCredentialsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ExpiringCredentialsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffKeys.expiringCredentials(days),
    queryFn: async () => {
      const response = await axiosInstance.get<ExpiringCredentialsResponse>('/staff/expiring-credentials', {
        params: { days },
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches all staff for a specific facility.
 * Useful for facility-scoped staff management.
 * 
 * @param facilityId - Facility ID to filter staff
 * @param filters - Additional filters (employment_status, global_role_level)
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific staff
 * 
 * @example
 * const { data } = useGetStaffByFacility(5, { employment_status: 'employed' });
 */
export const useGetStaffByFacility = (
  facilityId: number,
  filters: Omit<StaffFilters, 'facility_id'> = {},
  options?: Omit<UseQueryOptions<GetStaffResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffKeys.byFacility(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffResponse>('/staff', {
        params: { ...filters, facility_id: facilityId },
      });
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is provided
    ...options,
  });
};

/**
 * Fetches all staff for a specific department.
 * Useful for department-scoped staff management.
 * 
 * @param departmentId - Department ID to filter staff
 * @param options - React Query options for customizing behavior
 * @returns Query result with department-specific staff
 * 
 * @example
 * const { data } = useGetStaffByDepartment(10);
 */
export const useGetStaffByDepartment = (
  departmentId: number,
  options?: Omit<UseQueryOptions<GetStaffResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffKeys.byDepartment(departmentId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffResponse>('/staff', {
        params: { department_id: departmentId },
      });
      return response.data;
    },
    enabled: !!departmentId, // Only run query if departmentId is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new staff member in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateStaff({
 *   onSuccess: (data) => navigate(`/staff/${data.data.id}`),
 * });
 * 
 * mutate({
 *   user_id: 1,
 *   employee_id: 'EMP001',
 *   global_role_level: 'attending_physician',
 *   professional_title: 'Dr.'
 * });
 */
export const useCreateStaff = (
  callbacks: MutationCallbacks<StaffResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffResponse, AxiosError<ApiErrorResponse>, CreateStaffRequest>({
    mutationFn: async (data: CreateStaffRequest) => {
      const response = await axiosInstance.post<StaffResponse>('/staff', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff account created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create staff account.';

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
 * Updates an existing staff member by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateStaff({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: { professional_title: 'Dr.', accepts_new_patients: true }
 * });
 */
export const useUpdateStaff = (
  callbacks: MutationCallbacks<StaffResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffResponse, AxiosError<ApiErrorResponse>, UpdateStaffParams>({
    mutationFn: async ({ id, data }: UpdateStaffParams) => {
      const response = await axiosInstance.put<StaffResponse>(`/staff/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update staff.';

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
 * Soft-deletes a staff member by ID.
 * Staff can be restored later if needed.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteStaff({
 *   onSuccess: () => navigate('/staff'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useDeleteStaff = (
  callbacks: MutationCallbacks<DeleteStaffResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteStaffResponse, AxiosError<ApiErrorResponse>, DeleteStaffParams>({
    mutationFn: async ({ id }: DeleteStaffParams) => {
      const response = await axiosInstance.delete<DeleteStaffResponse>(`/staff/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete staff.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates staff license information.
 * Critical for maintaining compliance and credential tracking.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateStaffLicense({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: {
 *     license_number_encrypted: '...',
 *     license_number_hash: '...',
 *     issuing_state: 'CA',
 *     expiry_date: '2025-12-31'
 *   }
 * });
 */
export const useUpdateStaffLicense = (
  callbacks: MutationCallbacks<StaffResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffResponse, AxiosError<ApiErrorResponse>, UpdateLicenseParams>({
    mutationFn: async ({ id, data }: UpdateLicenseParams) => {
      const response = await axiosInstance.patch<StaffResponse>(`/staff/${id}/license`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'License information updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update license information.';

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
 * Updates staff employment status.
 * Handles status transitions like active, suspended, terminated, etc.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateEmploymentStatus({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: {
 *     status: 'suspended',
 *     reason: 'Pending investigation'
 *   }
 * });
 */
export const useUpdateEmploymentStatus = (
  callbacks: MutationCallbacks<StaffResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffResponse, AxiosError<ApiErrorResponse>, UpdateEmploymentStatusParams>({
    mutationFn: async ({ id, data }: UpdateEmploymentStatusParams) => {
      const response = await axiosInstance.patch<StaffResponse>(`/staff/${id}/status`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Employment status updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update employment status.';

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
 * Validates if a staff member can perform a specific action.
 * Checks credentials, permissions, and compliance requirements.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useValidateStaffAction({
 *   onSuccess: (data) => {
 *     if (data.data.valid) {
 *       proceedWithAction();
 *     } else {
 *       console.error('Validation errors:', data.data.errors);
 *     }
 *   },
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: { action: 'prescribe_medication' }
 * });
 */
export const useValidateStaffAction = (
  callbacks: MutationCallbacks<ValidateActionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ValidateActionResponse, AxiosError<ApiErrorResponse>, ValidateStaffActionParams>({
    mutationFn: async ({ id, data }: ValidateStaffActionParams) => {
      const response = await axiosInstance.post<ValidateActionResponse>(`/staff/${id}/validate-action`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Don't show toast for successful validation - component will handle it
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to validate staff action.';
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
  useGetStaff,
  useGetStaffById,
  useGetStaffWithExpiringCredentials,
  useGetStaffByFacility,
  useGetStaffByDepartment,

  // Mutation hooks
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useUpdateStaffLicense,
  useUpdateEmploymentStatus,
  useValidateStaffAction,

  // Utilities
  staffKeys,
  extractErrorMessage,
  formatValidationErrors,
};