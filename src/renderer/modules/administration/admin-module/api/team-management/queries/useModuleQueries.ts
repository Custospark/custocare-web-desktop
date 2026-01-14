/**
 * ============================================================================
 * MODULE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for module
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useModuleQueries
 * @description Provides type-safe, reusable hooks for all module CRUD
 * operations and role-module assignment. Component redirects are handled externally.
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
  CreateModuleRequest,
  ModuleFilters,
  Module,
  ModuleId,
  GetModulesResponse,
  ModuleResponse,
  DeactivateModuleResponse,
  MutationCallbacks,
  UpdateModuleParams,
  DeactivateModuleParams,
  AssignRoleModuleDefaultRequest,
  GetRoleModuleDefaultsResponse,
  AssignRoleModuleDefaultResponse,
} from '../types/moduleTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all module queries
 * queryClient.invalidateQueries({ queryKey: moduleKeys.all });
 * 
 * // Invalidate specific module
 * queryClient.invalidateQueries({ queryKey: moduleKeys.detail(id) });
 */
export const moduleKeys = {
  all: ['modules'] as const,
  lists: () => [...moduleKeys.all, 'list'] as const,
  list: (filters: ModuleFilters) => [...moduleKeys.lists(), filters] as const,
  details: () => [...moduleKeys.all, 'detail'] as const,
  detail: (id: ModuleId) => [...moduleKeys.details(), id] as const,
  roleDefaults: () => [...moduleKeys.all, 'role-defaults'] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a list of modules with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with modules list
 * 
 * @example
 * const { data, isLoading, error } = useGetModules({
 *   is_active: true
 * });
 */
export const useGetModules = (
  filters: ModuleFilters = {},
  options?: Omit<UseQueryOptions<GetModulesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetModulesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: moduleKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetModulesResponse>('/modules', {
        params: filters,
      });
      console.log(response.data?.data)
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single module by ID with full details.
 * 
 * @param id - Module ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete module details
 * 
 * @example
 * const { data, isLoading } = useGetModuleById(1);
 */
export const useGetModuleById = (
  id: ModuleId,
  options?: Omit<UseQueryOptions<Module, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Module, AxiosError<ApiErrorResponse>>({
    queryKey: moduleKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<ModuleResponse>(`/modules/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches all role-module default assignments.
 * Shows which modules are assigned to which roles by default.
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with role-module defaults
 * 
 * @example
 * const { data } = useGetRoleModuleDefaults();
 */
export const useGetRoleModuleDefaults = (
  options?: Omit<UseQueryOptions<GetRoleModuleDefaultsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetRoleModuleDefaultsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: moduleKeys.roleDefaults(),
    queryFn: async () => {
      const response = await axiosInstance.get<GetRoleModuleDefaultsResponse>('/modules/role-defaults');
      return response.data;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new module in the system.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateModule({
 *   onSuccess: (data) => navigate(`/modules/${data.data.id}`),
 * });
 * 
 * mutate({
 *   code: 'clinical',
 *   name: 'Clinical Management',
 *   description: 'Core clinical functionality'
 * });
 */
export const useCreateModule = (
  callbacks: MutationCallbacks<ModuleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ModuleResponse, AxiosError<ApiErrorResponse>, CreateModuleRequest>({
    mutationFn: async (data: CreateModuleRequest) => {
      const response = await axiosInstance.post<ModuleResponse>('/modules', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Module created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create module.';

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
 * Updates an existing module by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateModule({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
 * });
 * 
 * mutate({
 *   id: 1,
 *   data: { is_active: false }
 * });
 */
export const useUpdateModule = (
  callbacks: MutationCallbacks<ModuleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ModuleResponse, AxiosError<ApiErrorResponse>, UpdateModuleParams>({
    mutationFn: async ({ id, data }: UpdateModuleParams) => {
      const response = await axiosInstance.put<ModuleResponse>(`/modules/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Module updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update module.';

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
 * Deactivates a module by ID.
 * Module is not deleted but marked as inactive.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeactivateModule({
 *   onSuccess: () => navigate('/modules'),
 * });
 * 
 * mutate({ id: 1 });
 */
export const useDeactivateModule = (
  callbacks: MutationCallbacks<DeactivateModuleResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeactivateModuleResponse, AxiosError<ApiErrorResponse>, DeactivateModuleParams>({
    mutationFn: async ({ id }: DeactivateModuleParams) => {
      const response = await axiosInstance.delete<DeactivateModuleResponse>(`/modules/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Module deactivated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to deactivate module.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Assigns default module access for a facility role.
 * Determines which modules are automatically granted when staff is assigned a role.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useAssignRoleModuleDefault({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: moduleKeys.roleDefaults() }),
 * });
 * 
 * mutate({
 *   role_code: 'attending_physician',
 *   module_code: 'clinical',
 *   default_access: true
 * });
 */
export const useAssignRoleModuleDefault = (
  callbacks: MutationCallbacks<AssignRoleModuleDefaultResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AssignRoleModuleDefaultResponse, AxiosError<ApiErrorResponse>, AssignRoleModuleDefaultRequest>({
    mutationFn: async (data: AssignRoleModuleDefaultRequest) => {
      const response = await axiosInstance.post<AssignRoleModuleDefaultResponse>('/modules/assign-default', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Role module default assigned successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to assign role module default.';

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
  useGetModules,
  useGetModuleById,
  useGetRoleModuleDefaults,

  // Mutation hooks
  useCreateModule,
  useUpdateModule,
  useDeactivateModule,
  useAssignRoleModuleDefault,

  // Utilities
  moduleKeys,
  extractErrorMessage,
  formatValidationErrors,
};