/**
 * ============================================================================
 * ALLERGY REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for allergy
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useAllergyQueries
 * @description Provides type-safe, reusable hooks for all allergy CRUD
 * operations and custom queries.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

/**
 * AllergyQueries.ts
 */
import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  AllergyFilters,
  AllergyResponse,
  AllergyId,
  CreateAllergyParams,
  DeleteAllergyParams,
  DeleteAllergyResponse,
  GetAllergiesResponse,
  GetActiveAllergiesResponse,
  MutationCallbacks,
  PatientId,
  ResolveAllergyParams,
  ResolveAllergyResponse,
  RestoreAllergyParams,
  RestoreAllergyResponse,
  UpdateAllergyParams,
} from './AllergyTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all allergy queries for a patient
 * queryClient.invalidateQueries({ queryKey: allergyKeys.all(patientId) });
 * 
 * // Invalidate specific allergy
 * queryClient.invalidateQueries({ queryKey: allergyKeys.detail(patientId, allergyId) });
 */
export const allergyKeys = {
  all: (patientId: PatientId) => ['patients', patientId, 'allergies'] as const,
  lists: (patientId: PatientId) => [...allergyKeys.all(patientId), 'list'] as const,
  list: (patientId: PatientId, filters: AllergyFilters = {}) => 
    [...allergyKeys.lists(patientId), filters] as const,
  active: (patientId: PatientId) => [...allergyKeys.all(patientId), 'active'] as const,
  details: (patientId: PatientId) => [...allergyKeys.all(patientId), 'detail'] as const,
  detail: (patientId: PatientId, allergyId: AllergyId) => 
    [...allergyKeys.details(patientId), allergyId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches all allergies for a specific patient with optional filtering.
 * 
 * @param patientId - Patient ID to fetch allergies for
 * @param filters - Query parameters for filtering (active, severity, search)
 * @param options - React Query options for customizing behavior
 * @returns Query result with allergies list and metadata
 * 
 * @example
 * const { data, isLoading, error } = useGetAllergies(33, {
 *   is_active: true,
 *   severity: 'severe'
 * });
 */
export const useGetAllergies = (
  patientId: PatientId,
  filters: AllergyFilters = {},
  options?: Omit<UseQueryOptions<GetAllergiesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetAllergiesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: allergyKeys.list(patientId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetAllergiesResponse>(
        `/patients/${patientId}/allergies`,
        { params: filters }
      );
      return response.data;
    },
    enabled: !!patientId, // Only run query if patientId is provided
    ...options,
  });
};

/**
 * Fetches only active allergies for a specific patient.
 * Includes warning text for UI display (e.g., allergy alerts in clinical care).
 * 
 * @param patientId - Patient ID to fetch active allergies for
 * @param options - React Query options for customizing behavior
 * @returns Query result with active allergies and warning metadata
 * 
 * @example
 * const { data } = useGetActiveAllergies(33);
 * if (data?.meta.warning_text) {
 *   showAlert(data.meta.warning_text);
 * }
 */
export const useGetActiveAllergies = (
  patientId: PatientId,
  options?: Omit<UseQueryOptions<GetActiveAllergiesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetActiveAllergiesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: allergyKeys.active(patientId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetActiveAllergiesResponse>(
        `/patients/${patientId}/allergies/active`
      );
      return response.data;
    },
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Fetches a single allergy by ID for a specific patient.
 * 
 * @param patientId - Patient ID
 * @param allergyId - Allergy ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete allergy details
 * 
 * @example
 * const { data, isLoading } = useGetAllergyById(33, 1);
 */
export const useGetAllergyById = (
  patientId: PatientId,
  allergyId: AllergyId,
  options?: Omit<UseQueryOptions<AllergyResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<AllergyResponse, AxiosError<ApiErrorResponse>>({
    queryKey: allergyKeys.detail(patientId, allergyId),
    queryFn: async () => {
      const response = await axiosInstance.get<AllergyResponse>(
        `/patients/${patientId}/allergies/${allergyId}`
      );
      return response.data;
    },
    enabled: !!patientId && !!allergyId, // Only run if both IDs are provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new allergy record for a patient.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateAllergy({
 *   onSuccess: (data) => console.log('Created:', data.data),
 * });
 * 
 * mutate({
 *   patientId: 33,
 *   data: {
 *     allergen: 'Penicillin',
 *     severity: 'severe',
 *     reaction: 'Skin rash, difficulty breathing',
 *     visit_id: 166,
 *   }
 * });
 */
export const useCreateAllergy = (
  callbacks: MutationCallbacks<AllergyResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AllergyResponse, AxiosError<ApiErrorResponse>, CreateAllergyParams>({
    mutationFn: async ({ patientId, data }: CreateAllergyParams) => {
      const response = await axiosInstance.post<AllergyResponse>(
        `/patients/${patientId}/allergies`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Allergy recorded successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create allergy record.';

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
 * Updates an existing allergy by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateAllergy({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: allergyKeys.all(33) }),
 * });
 * 
 * mutate({
 *   patientId: 33,
 *   allergyId: 1,
 *   data: { is_active: false, resolved_at: new Date().toISOString() }
 * });
 */
export const useUpdateAllergy = (
  callbacks: MutationCallbacks<AllergyResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AllergyResponse, AxiosError<ApiErrorResponse>, UpdateAllergyParams>({
    mutationFn: async ({ patientId, allergyId, data }: UpdateAllergyParams) => {
      const response = await axiosInstance.put<AllergyResponse>(
        `/patients/${patientId}/allergies/${allergyId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Allergy updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update allergy.';

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
 * Soft-deletes an allergy by ID.
 * Allergy can be restored later using the restore endpoint.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteAllergy({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: allergyKeys.all(33) }),
 * });
 * 
 * mutate({ patientId: 33, allergyId: 1 });
 */
export const useDeleteAllergy = (
  callbacks: MutationCallbacks<DeleteAllergyResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteAllergyResponse, AxiosError<ApiErrorResponse>, DeleteAllergyParams>({
    mutationFn: async ({ patientId, allergyId }: DeleteAllergyParams) => {
      const response = await axiosInstance.delete<DeleteAllergyResponse>(
        `/patients/${patientId}/allergies/${allergyId}`
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Allergy deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete allergy.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Restores a previously soft-deleted allergy.
 * Only works on allergies that have been soft-deleted (deleted_at is not null).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useRestoreAllergy({
 *   onSuccess: (data) => console.log('Restored:', data.data.allergen),
 * });
 * 
 * mutate({ patientId: 33, allergyId: 1 });
 */
export const useRestoreAllergy = (
  callbacks: MutationCallbacks<RestoreAllergyResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<RestoreAllergyResponse, AxiosError<ApiErrorResponse>, RestoreAllergyParams>({
    mutationFn: async ({ patientId, allergyId }: RestoreAllergyParams) => {
      const response = await axiosInstance.post<RestoreAllergyResponse>(
        `/patients/${patientId}/allergies/${allergyId}/restore`
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Allergy restored successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to restore allergy.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Marks an allergy as resolved (sets resolved_at timestamp and is_active to false).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useResolveAllergy({
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: allergyKeys.active(33) });
 *   },
 * });
 * 
 * mutate({ patientId: 33, allergyId: 1 });
 */
export const useResolveAllergy = (
  callbacks: MutationCallbacks<ResolveAllergyResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ResolveAllergyResponse, AxiosError<ApiErrorResponse>, ResolveAllergyParams>({
    mutationFn: async ({ patientId, allergyId }: ResolveAllergyParams) => {
      const response = await axiosInstance.post<ResolveAllergyResponse>(
        `/patients/${patientId}/allergies/${allergyId}/resolve`
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Allergy marked as resolved!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to resolve allergy.';
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
 * Helper function to get severity badge color.
 * Useful for UI components.
 * 
 * @param severity - Allergy severity level
 * @returns CSS color class or value
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'severe':
      return 'text-red-600 bg-red-100';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-100';
    case 'mild':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Helper function to get severity badge label.
 * 
 * @param severity - Allergy severity level
 * @returns Human-readable label
 */
export const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'severe':
      return 'Severe';
    case 'moderate':
      return 'Moderate';
    case 'mild':
      return 'Mild';
    default:
      return severity;
  }
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Default export for convenience.
 */
export default {
  // Query hooks
  useGetAllergies,
  useGetActiveAllergies,
  useGetAllergyById,

  // Mutation hooks
  useCreateAllergy,
  useUpdateAllergy,
  useDeleteAllergy,
  useRestoreAllergy,
  useResolveAllergy,

  // Utilities
  allergyKeys,
  extractErrorMessage,
  formatValidationErrors,
  getSeverityColor,
  getSeverityLabel,
};