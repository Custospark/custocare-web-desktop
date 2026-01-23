/**
 * ============================================================================
 * PATIENT REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for patient
 * management operations. Handles patient search and creation with proper
 * error handling and toast notifications.
 * 
 * @module usePatientQueries
 * @description Provides type-safe, reusable hooks for all patient operations
 * including search, creation, and conflict resolution.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 * @version React Query v5 compatible
 */

import { 
  useQuery, 
  useMutation, 
  useInfiniteQuery, 
  type UseQueryOptions, 
  type UseMutationOptions,
  type InfiniteData
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import type {
  PatientSearchRequest,
  PatientSearchResponse,
  PatientSearchResult,
  CreatePatientRequest,
  PatientCreateResponse,
  PatientCreateSuccessResponse,
  ApiErrorResponse,
  PatientCreationMetadata,
} from './usePatientTypes';
import {
  ExistingUserAction,
  DuplicateAction,
} from './usePatientTypes';
import {
  isPatientCreateConflictResponse,
  isPatientCreateSuccessResponse,
  isPossibleDuplicateResponse,
  isExistingUserResponse,
  isNewPatientCreatedResponse,
  DEFAULT_SEARCH_CRITERIA
} from './usePatientTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation
 */
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: PatientSearchRequest) => [...patientKeys.lists(), filters] as const,
  search: (query: string, filters: Omit<PatientSearchRequest, 'q' | 'limit'>) => 
    [...patientKeys.lists(), 'search', { q: query, ...filters }] as const,
  detail: (patientUuid: string) => [...patientKeys.all, 'detail', patientUuid] as const,
  byId: (patientId: number) => [...patientKeys.all, 'by-id', patientId] as const,
  byUser: (userId: number) => [...patientKeys.all, 'by-user', userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Search patients with various filters
 * 
 * @param searchParams - Search criteria including query and filters
 * @param options - React Query options
 * @returns Query result with patient search results
 * 
 * @example
 * const { data, isLoading, error } = usePatientSearch({
 *   q: 'John',
 *   status: PatientStatus.ACTIVE,
 *   limit: 10
 * });
 */
export const usePatientSearch = (
  searchParams: PatientSearchRequest,
  options?: Omit<UseQueryOptions<PatientSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PatientSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: patientKeys.list(searchParams),
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Add all non-undefined, non-null, non-empty parameters
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString 
        ? `/patients/search/lean?${queryString}`
        : `/patients/search/lean`;
      
      const response = await axiosInstance.get<PatientSearchResponse>(url);
      return response.data;
    },
    // Don't automatically refetch on window focus for search queries
    refetchOnWindowFocus: false,
    // Cache search results for 5 minutes
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Infinite scroll version of patient search
 * 
 * @param searchParams - Base search criteria
 * @param pageSize - Number of results per page
 * @returns Infinite query result for paginated search
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfinitePatientSearch({
 *   status: PatientStatus.ACTIVE
 * }, 15);
 */
export const useInfinitePatientSearch = (
  searchParams: Omit<PatientSearchRequest, 'limit'>,
  pageSize: number = 15
) => {
  return useInfiniteQuery<
    PatientSearchResponse,
    AxiosError<ApiErrorResponse>,
    InfiniteData<PatientSearchResponse>,
    readonly unknown[],
    number
  >({
    queryKey: patientKeys.search(searchParams.q || '', searchParams),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      
      // Add search parameters
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      // Add pagination
      params.append('limit', String(pageSize));
      params.append('offset', String((pageParam - 1) * pageSize));
      
      const response = await axiosInstance.get<PatientSearchResponse>(
        `/patients/search/lean?${params.toString()}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = lastPage.meta?.total || 0;
      const loadedItems = allPages.length * pageSize;
      return loadedItems < totalItems ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

/**
 * Get patient by UUID
 * 
 * @param patientUuid - Patient UUID
 * @param options - React Query options
 * @returns Query result with patient details
 * 
 * @example
 * const { data: patient, isLoading } = usePatientByUuid('abc-123-def');
 */
export const usePatientByUuid = (
  patientUuid: string,
  options?: Omit<UseQueryOptions<PatientSearchResult, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PatientSearchResult, AxiosError<ApiErrorResponse>>({
    queryKey: patientKeys.detail(patientUuid),
    queryFn: async () => {
      const params = new URLSearchParams({
        patient_uuid: patientUuid,
        limit: '1'
      });
      
      const response = await axiosInstance.get<PatientSearchResponse>(
        `patients/search/lean?${params.toString()}`
      );
      
      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('Patient not found');
      }
      
      return response.data.data[0];
    },
    enabled: !!patientUuid && patientUuid.trim().length > 0,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Create a new patient by staff (with duplicate detection)
 * 
 * @param callbacks - Mutation callbacks
 * @returns Mutation object with state and mutate function
 * 
 * @example
 * const { mutate, isPending, data } = useCreatePatientByStaff({
 *   onSuccess: (response) => {
 *     if (isPatientCreateSuccessResponse(response)) {
 *       // Handle successful creation
 *       navigate(`/patients/${response.data.patient_number}`);
 *     } else if (isPatientCreateConflictResponse(response)) {
 *       // Handle conflict - show duplicate warning
 *       showDuplicateWarning(response.meta);
 *     }
 *   }
 * });
 * 
 * mutate({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   date_of_birth: '1990-01-01',
 *   biological_sex: BiologicalSex.MALE,
 *   email: 'john@example.com'
 * });
 */
export const useCreatePatientByStaff = (
  callbacks?: {
    onSuccess?: (data: PatientCreateResponse, variables: CreatePatientRequest, context: unknown) => void;
    onError?: (error: AxiosError<ApiErrorResponse>, variables: CreatePatientRequest, context: unknown) => void;
    onSettled?: (data: PatientCreateResponse | undefined, error: AxiosError<ApiErrorResponse> | null, variables: CreatePatientRequest, context: unknown) => void;
  }
) => {
  const { showToast } = useToast();
  const activeFacilityId = useAppSelector(getActiveFacilityId);

  return useMutation<
    PatientCreateResponse, 
    AxiosError<ApiErrorResponse>, 
    CreatePatientRequest
  >({
    mutationFn: async (patientData: CreatePatientRequest) => {
      // Build request with facility ID if available
      const requestData: CreatePatientRequest = {
        ...patientData,
        created_from_facility_id: activeFacilityId || patientData.created_from_facility_id,
      };
      
      const response = await axiosInstance.post<PatientCreateResponse>(
        `/patients/create-by-staff`,
        requestData
      );
      return response.data;
    },
    onSuccess: (response, variables, context) => {
      if (isPatientCreateSuccessResponse(response)) {
        const message = response.message || 'Patient created successfully';
        const meta = response.meta;
        
        // Show appropriate message based on creation status
        if (meta.status === 'already_has_patient') {
          showToast('info', 'Patient record already exists for this user', 5000);
        } else if (meta.status === 'created') {
          showToast('success', message, 5000);
          
          // Show onboarding notice if needed
          if (meta.onboarding_link_required) {
            showToast('info', 'Onboarding link will be sent to the patient', 8000);
          }
        }
      }
      // For conflict responses, don't show automatic toast - let UI handle it
      
      callbacks?.onSuccess?.(response, variables, context);
    },
    onError: (error, variables, context) => {
      let message = error.response?.data?.message || 'Failed to create patient';
      let duration = 5000;
      let type: 'error' | 'warning' = 'error';
      
      // Handle specific error cases
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          if (errors.contact && Array.isArray(errors.contact) && errors.contact.length > 0) {
            message = errors.contact[0];
          } else {
            // Show first validation error
            const firstErrorKey = Object.keys(errors)[0];
            const firstError = errors[firstErrorKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              message = firstError[0];
            } else {
              message = 'Validation error occurred';
            }
          }
        }
        type = 'warning';
      } else if (error.response?.status === 409) {
        message = 'A conflicting patient or user record already exists';
        duration = 6000;
      } else if (error.response?.status === 500) {
        message = 'Server error occurred while creating patient';
      }
      
      showToast(type, message, duration);
      callbacks?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      callbacks?.onSettled?.(data, error, variables, context);
    },
  });
};

/**
 * Create patient with conflict resolution
 * This hook handles the complete flow including conflict resolution
 * 
 * @param options - Mutation options
 * @returns Enhanced mutation with conflict resolution
 * 
 * @example
 * const { mutate } = useCreatePatientWithConflictResolution({
 *   onSuccess: (response) => {
 *     // Handle both success and conflict cases
 *   }
 * });
 */
export const useCreatePatientWithConflictResolution = (
  options?: UseMutationOptions<
    PatientCreateResponse, 
    AxiosError<ApiErrorResponse>, 
    CreatePatientRequest
  >
) => {
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  
  return useMutation<
    PatientCreateResponse, 
    AxiosError<ApiErrorResponse>, 
    CreatePatientRequest
  >({
    mutationFn: async (patientData: CreatePatientRequest) => {
      // First attempt - with block on conflicts
      const requestData: CreatePatientRequest = {
        ...patientData,
        created_from_facility_id: activeFacilityId || patientData.created_from_facility_id,
        action_on_possible_duplicate: DuplicateAction.BLOCK,
        existing_user_action: ExistingUserAction.BLOCK,
      };
      
      const response = await axiosInstance.post<PatientCreateResponse>(
        `/api/patients/create-by-staff`,
        requestData
      );
      
      return response.data;
    },
    ...options,
  });
};

/**
 * Force create patient (override duplicate warnings)
 * Use after user confirms they want to proceed despite warnings
 * 
 * @param callbacks - Mutation callbacks
 * @returns Mutation for force creation
 * 
 * @example
 * const { mutate: forceCreate } = useForceCreatePatient({
 *   onSuccess: (response) => {
 *     // Patient definitely created, handle success
 *     navigate(`/patients/${response.data.patient_number}`);
 *   }
 * });
 * 
 * // After user confirms to proceed
 * forceCreate(originalFormData);
 */
export const useForceCreatePatient = (
  callbacks?: {
    onSuccess?: (data: PatientCreateSuccessResponse, variables: CreatePatientRequest, context: unknown) => void;
    onError?: (error: AxiosError<ApiErrorResponse>, variables: CreatePatientRequest, context: unknown) => void;
    onSettled?: (data: PatientCreateSuccessResponse | undefined, error: AxiosError<ApiErrorResponse> | null, variables: CreatePatientRequest, context: unknown) => void;
  }
) => {
  const { showToast } = useToast();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  
  return useMutation<
    PatientCreateSuccessResponse, 
    AxiosError<ApiErrorResponse>, 
    CreatePatientRequest
  >({
    mutationFn: async (patientData: CreatePatientRequest) => {
      const requestData: CreatePatientRequest = {
        ...patientData,
        created_from_facility_id: activeFacilityId || patientData.created_from_facility_id,
        action_on_possible_duplicate: DuplicateAction.ALLOW,
        existing_user_action: ExistingUserAction.USE_EXISTING,
      };
      
      const response = await axiosInstance.post<PatientCreateResponse>(
        `/api/patients/create-by-staff`,
        requestData
      );
      
      // This should always be a success response when forcing
      if (!isPatientCreateSuccessResponse(response.data)) {
        throw new Error('Unexpected conflict response when forcing creation');
      }
      
      return response.data;
    },
    onSuccess: (response, variables, context) => {
      const message = response.message || 'Patient created successfully';
      showToast('success', message, 5000);
      
      if (response.meta.onboarding_link_required) {
        showToast('info', 'Onboarding link will be sent to the patient', 8000);
      }
      
      callbacks?.onSuccess?.(response, variables, context);
    },
    onError: (error, variables, context) => {
      const message = error.response?.data?.message || 'Failed to create patient';
      showToast('error', message, 5000);
      callbacks?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      callbacks?.onSettled?.(data, error, variables, context);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                      HOOKS WITH BUILT-IN ERROR HANDLING                    */
/* -------------------------------------------------------------------------- */

/**
 * Patient search with automatic error toast notifications
 * Use this when you want automatic error handling
 * 
 * @param searchParams - Search criteria
 * @param options - React Query options
 * @returns Query result with automatic error handling
 */
export const usePatientSearchWithErrorHandling = (
  searchParams: PatientSearchRequest,
  options?: Omit<UseQueryOptions<PatientSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { showToast } = useToast();
  
  const query = usePatientSearch(searchParams, options);
  
  // Handle errors in useEffect-like pattern
  if (query.error && query.isError) {
    const message = query.error.response?.data?.message || 'Failed to search patients';
    showToast('error', message, 5000);
  }
  
  return query;
};

/**
 * Patient by UUID with automatic error toast notifications
 * Use this when you want automatic error handling
 * 
 * @param patientUuid - Patient UUID
 * @param options - React Query options
 * @returns Query result with automatic error handling
 */
export const usePatientByUuidWithErrorHandling = (
  patientUuid: string,
  options?: Omit<UseQueryOptions<PatientSearchResult, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const { showToast } = useToast();
  
  const query = usePatientByUuid(patientUuid, options);
  
  // Handle errors
  if (query.error && query.isError) {
    const message = query.error.message === 'Patient not found' 
      ? 'Patient not found' 
      : query.error.response?.data?.message || 'Failed to load patient';
    showToast('error', message, 5000);
  }
  
  return query;
};

/**
 * Infinite patient search with automatic error toast notifications
 * 
 * @param searchParams - Search parameters
 * @param pageSize - Items per page
 * @returns Infinite query with error handling
 */
export const useInfinitePatientSearchWithErrorHandling = (
  searchParams: Omit<PatientSearchRequest, 'limit'>,
  pageSize: number = 15
) => {
  const { showToast } = useToast();
  
  const query = useInfinitePatientSearch(searchParams, pageSize);
  
  // Handle errors
  if (query.error && query.isError) {
    const message = query.error.response?.data?.message || 'Failed to load more patients';
    showToast('error', message, 5000);
  }
  
  return query;
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Extract validation errors from API response
 * 
 * @param error - Axios error response
 * @returns Record of field names to error messages
 */
export const extractValidationErrors = (
  error: AxiosError<ApiErrorResponse>
): Record<string, string[]> => {
  return error.response?.data?.errors || {};
};

/**
 * Format validation errors for display
 * 
 * @param errors - Validation errors object
 * @returns Formatted error string
 */
export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join('\n');
};

/**
 * Build search query parameters from search state
 * 
 * @param query - Search query string
 * @param filters - Additional filters
 * @returns Complete search request object
 */
export const buildSearchParams = (
  query: string,
  filters: Partial<PatientSearchRequest> = {}
): PatientSearchRequest => {
  const params: PatientSearchRequest = {
    ...DEFAULT_SEARCH_CRITERIA,
    ...filters,
  };
  
  // Only add query if it's not empty
  if (query && query.trim().length > 0) {
    params.q = query.trim();
  }
  
  return params;
};

/**
 * Hook to get search suggestions for autocomplete
 * 
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Query result with suggestions
 */
export const usePatientSearchSuggestions = (
  query: string, 
  limit: number = 5
) => {
  return usePatientSearch(
    { q: query, limit },
    {
      enabled: query.trim().length >= 2, // Only search after 2 characters
      staleTime: 30000, // 30 seconds
      gcTime: 60000, // 1 minute (formerly cacheTime)
    }
  );
};

/**
 * Type-safe search parameters builder
 * 
 * @param query - Search query string
 * @param additionalParams - Additional parameters
 * @returns Clean search params object
 */
export const createSearchParams = (
  query: string,
  additionalParams: Partial<PatientSearchRequest> = {}
): PatientSearchRequest => {
  const params: PatientSearchRequest = {
    ...DEFAULT_SEARCH_CRITERIA,
    ...additionalParams,
  };
  
  // Add query if provided
  if (query && query.trim().length > 0) {
    params.q = query.trim();
  }
  
  // Remove undefined/null/empty values
  const cleanedParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key as keyof PatientSearchRequest] = value;
    }
    return acc;
  }, {} as PatientSearchRequest);
  
  return cleanedParams;
};

/**
 * Extract patient data from creation response
 * 
 * @param response - Patient creation response
 * @returns Patient data or null
 */
export const extractPatientFromResponse = (
  response: PatientCreateResponse
): PatientSearchResult | null => {
  if (isPatientCreateSuccessResponse(response)) {
    return response.data;
  }
  return null;
};

/**
 * Extract conflict data from creation response
 * 
 * @param response - Patient creation response
 * @returns Conflict metadata or null
 */
export const extractConflictData = (
  response: PatientCreateResponse
): PatientCreationMetadata | null => {
  if (isPatientCreateConflictResponse(response)) {
    return response.meta;
  }
  return null;
};

/**
 * Check if response indicates a successful patient creation
 * 
 * @param response - Patient creation response
 * @returns True if patient was newly created
 */
export const isSuccessfulPatientCreation = (
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse => {
  return isPatientCreateSuccessResponse(response) && 
         response.meta.status === 'created';
};

/**
 * Check if response indicates patient already exists
 * 
 * @param response - Patient creation response
 * @returns True if patient already existed
 */
export const isExistingPatient = (
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse => {
  return isPatientCreateSuccessResponse(response) && 
         response.meta.status === 'already_has_patient';
};

/**
 * Get readable error message from error response
 * 
 * @param error - Axios error
 * @returns Human-readable error message
 */
export const getErrorMessage = (error: AxiosError<ApiErrorResponse>): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 404) {
    return 'Resource not found';
  }
  
  if (error.response?.status === 401) {
    return 'Unauthorized access';
  }
  
  if (error.response?.status === 403) {
    return 'Access forbidden';
  }
  
  if (error.response?.status === 500) {
    return 'Internal server error';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Default export with all hooks and utilities
 */
export default {
  // Query hooks
  usePatientSearch,
  useInfinitePatientSearch,
  usePatientByUuid,
  usePatientSearchSuggestions,
  
  // Query hooks with built-in error handling
  usePatientSearchWithErrorHandling,
  usePatientByUuidWithErrorHandling,
  useInfinitePatientSearchWithErrorHandling,
  
  // Mutation hooks
  useCreatePatientByStaff,
  useCreatePatientWithConflictResolution,
  useForceCreatePatient,
  
  // Query keys
  patientKeys,
  
  // Utility functions
  extractValidationErrors,
  formatValidationErrors,
  buildSearchParams,
  createSearchParams,
  extractPatientFromResponse,
  extractConflictData,
  isSuccessfulPatientCreation,
  isExistingPatient,
  getErrorMessage,
  
  // Type guards re-exported for convenience
  isPatientCreateConflictResponse,
  isPatientCreateSuccessResponse,
  isPossibleDuplicateResponse,
  isExistingUserResponse,
  isNewPatientCreatedResponse,
};