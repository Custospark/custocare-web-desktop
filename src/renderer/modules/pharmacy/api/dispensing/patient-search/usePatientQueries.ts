/**
 * ============================================================================
 * PATIENT REACT QUERY HOOKS
 * ============================================================================
 *
 * Type-safe query and mutation hooks for patient search and healthcare-grade
 * patient creation with explicit duplicate-resolution handling.
 *
 * @module usePatientQueries
 */

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type InfiniteData,
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
  DEFAULT_SEARCH_CRITERIA,
} from './usePatientTypes';

/* -------------------------------------------------------------------------- */
/*                               CONSTANTS                                    */
/* -------------------------------------------------------------------------- */

const CREATE_PATIENT_ENDPOINT = '/patients/create-by-admin';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

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
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

type SearchParamValue = string | number | boolean | null | undefined;

type SearchParamsInput = Partial<Record<keyof PatientSearchRequest, SearchParamValue>>;

const appendSearchParams = (
  params: URLSearchParams,
  searchParams: SearchParamsInput
): void => {
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
};


const buildSearchUrl = (searchParams: PatientSearchRequest): string => {
  const params = new URLSearchParams();
  appendSearchParams(params, searchParams);

  const queryString = params.toString();
  return queryString
    ? `/patients/search/lean?${queryString}`
    : '/patients/search/lean';
};

const normalizeCreatePatientRequest = (
  patientData: CreatePatientRequest,
  activeFacilityId?: number | null
): CreatePatientRequest => ({
  ...patientData,
  first_name: patientData.first_name.trim(),
  last_name: patientData.last_name.trim(),
  email: patientData.email?.trim()
    ? patientData.email.trim().toLowerCase()
    : undefined,
  phone: patientData.phone?.trim()
    ? patientData.phone.replace(/\s+/g, '')
    : undefined,
  date_of_birth: patientData.date_of_birth.trim(),
  created_from_facility_id: activeFacilityId || patientData.created_from_facility_id,
  action_on_possible_duplicate:
    patientData.action_on_possible_duplicate ?? DuplicateAction.BLOCK,
  existing_user_action:
    patientData.existing_user_action ?? ExistingUserAction.BLOCK,
});

const extractFirstValidationMessage = (
  error: AxiosError<ApiErrorResponse>
): string | null => {
  const errors = error.response?.data?.errors;
  if (!errors) return null;

  if (errors.contact?.length) {
    return errors.contact[0];
  }

  const firstErrorKey = Object.keys(errors)[0];
  if (!firstErrorKey) return null;

  const firstError = errors[firstErrorKey];
  return Array.isArray(firstError) && firstError.length > 0
    ? firstError[0]
    : null;
};
const getConflictPersistenceMessage = (response: PatientCreateResponse): string => {
  if (!isPatientCreateConflictResponse(response)) {
    return 'Patient creation could not be completed.';
  }

  if (isPossibleDuplicateResponse(response)) {
    return 'Possible duplicate still detected. Manual review is required before creating a new patient.';
  }

  if (isExistingUserResponse(response)) {
    return response.meta.conflict_code === 'IDENTITY_MISMATCH'
      ? 'Existing contact belongs to a different identity. Manual reconciliation is required.'
      : 'Existing user conflict still exists. Manual review is required before linking.';
  }

  return 'Patient creation conflict requires manual review.';
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const usePatientSearch = (
  searchParams: PatientSearchRequest,
  options?: Omit<
    UseQueryOptions<PatientSearchResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PatientSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: patientKeys.list(searchParams),
    queryFn: async () => {
      const response = await axiosInstance.get<PatientSearchResponse>(
        buildSearchUrl(searchParams)
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

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
      appendSearchParams(params, searchParams);
      params.append('limit', String(pageSize));
      params.append('offset', String((pageParam - 1) * pageSize));

      const response = await axiosInstance.get<PatientSearchResponse>(
        `/patients/search/lean?${params.toString()}`
      );

      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = lastPage.meta?.total || 0;
      const loadedItems = allPages.reduce(
        (sum, page) => sum + (page.data?.length || 0),
        0
      );

      return loadedItems < totalItems ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const usePatientByUuid = (
  patientUuid: string,
  options?: Omit<
    UseQueryOptions<PatientSearchResult, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<PatientSearchResult, AxiosError<ApiErrorResponse>>({
    queryKey: patientKeys.detail(patientUuid),
    queryFn: async () => {
      const params = new URLSearchParams({
        patient_uuid: patientUuid,
        limit: '1',
      });

      const response = await axiosInstance.get<PatientSearchResponse>(
        `/patients/search/lean?${params.toString()}`
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

export const useCreatePatientByAdmin = (
  callbacks?: {
    onSuccess?: (
      data: PatientCreateResponse,
      variables: CreatePatientRequest,
      context: unknown
    ) => void | Promise<void>;
    onError?: (
      error: AxiosError<ApiErrorResponse>,
      variables: CreatePatientRequest,
      context: unknown
    ) => void;
    onSettled?: (
      data: PatientCreateResponse | undefined,
      error: AxiosError<ApiErrorResponse> | null,
      variables: CreatePatientRequest,
      context: unknown
    ) => void;
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
      const requestData = normalizeCreatePatientRequest(patientData, activeFacilityId);

      const response = await axiosInstance.post<PatientCreateResponse>(
        CREATE_PATIENT_ENDPOINT,
        requestData,
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 409,
        }
      );

      return response.data;
    },

    onSuccess: async (response, variables, context) => {
      if (isPatientCreateConflictResponse(response)) {
        await callbacks?.onSuccess?.(response, variables, context);
        return;
      }

      if (isPatientCreateSuccessResponse(response)) {
        if (response.meta.status === 'created') {
          showToast('success', response.message || 'Patient created successfully', 4000);
        } else if (response.meta.status === 'already_has_patient') {
          showToast('info', response.message || 'Matching patient record already exists', 4000);
        }

        if (response.meta.onboarding_link_required) {
          // showToast('info', 'Patient onboarding is required.', 6000);
        }
      }

      await callbacks?.onSuccess?.(response, variables, context);
    },

    onError: (error, variables, context) => {
      let message = error.response?.data?.message || 'Failed to create patient';
      const duration = 5000;
      let type: 'error' | 'warning' = 'error';

      if (error.response?.status === 422) {
        message = extractFirstValidationMessage(error) || 'Validation error occurred';
        type = 'warning';
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
 * Backward-compatible alias for existing UI imports.
 */
export const useCreatePatientByStaff = useCreatePatientByAdmin;

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
      const requestData = normalizeCreatePatientRequest(
        {
          ...patientData,
          action_on_possible_duplicate: DuplicateAction.BLOCK,
          existing_user_action: ExistingUserAction.BLOCK,
        },
        activeFacilityId
      );

      const response = await axiosInstance.post<PatientCreateResponse>(
        CREATE_PATIENT_ENDPOINT,
        requestData,
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 409,
        }
      );

      return response.data;
    },
    ...options,
  });
};

export const useForceCreatePatient = (
  callbacks?: {
    onSuccess?: (
      data: PatientCreateSuccessResponse,
      variables: CreatePatientRequest,
      context: unknown
    ) => void;
    onError?: (
      error: AxiosError<ApiErrorResponse>,
      variables: CreatePatientRequest,
      context: unknown
    ) => void;
    onSettled?: (
      data: PatientCreateSuccessResponse | undefined,
      error: AxiosError<ApiErrorResponse> | null,
      variables: CreatePatientRequest,
      context: unknown
    ) => void;
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
      const requestData = normalizeCreatePatientRequest(
        {
          ...patientData,
          action_on_possible_duplicate: DuplicateAction.ALLOW,
          existing_user_action: ExistingUserAction.USE_EXISTING,
        },
        activeFacilityId
      );

      const response = await axiosInstance.post<PatientCreateResponse>(
        CREATE_PATIENT_ENDPOINT,
        requestData,
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 409,
        }
      );

      if (!isPatientCreateSuccessResponse(response.data)) {
        throw new Error(getConflictPersistenceMessage(response.data));
      }

      return response.data;
    },

    onSuccess: (response, variables, context) => {
      showToast('success', response.message || 'Patient created successfully', 5000);

      if (response.meta.onboarding_link_required) {
        showToast('info', 'Patient onboarding is required.', 6000);
      }

      callbacks?.onSuccess?.(response, variables, context);
    },

    onError: (error, variables, context) => {
      const message =
        error.message ||
        error.response?.data?.message ||
        'Failed to create patient';

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

export const usePatientSearchWithErrorHandling = (
  searchParams: PatientSearchRequest,
  options?: Omit<
    UseQueryOptions<PatientSearchResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();
  const query = usePatientSearch(searchParams, options);

  useEffect(() => {
    if (query.error && query.isError) {
      const message =
        query.error.response?.data?.message || 'Failed to search patients';
      showToast('error', message, 5000);
    }
  }, [query.error, query.isError, showToast]);

  return query;
};

export const usePatientByUuidWithErrorHandling = (
  patientUuid: string,
  options?: Omit<
    UseQueryOptions<PatientSearchResult, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();
  const query = usePatientByUuid(patientUuid, options);

  useEffect(() => {
    if (query.error && query.isError) {
      const message =
        query.error.message === 'Patient not found'
          ? 'Patient not found'
          : query.error.response?.data?.message || 'Failed to load patient';
      showToast('error', message, 5000);
    }
  }, [query.error, query.isError, showToast]);

  return query;
};

export const useInfinitePatientSearchWithErrorHandling = (
  searchParams: Omit<PatientSearchRequest, 'limit'>,
  pageSize: number = 15
) => {
  const { showToast } = useToast();
  const query = useInfinitePatientSearch(searchParams, pageSize);

  useEffect(() => {
    if (query.error && query.isError) {
      const message =
        query.error.response?.data?.message || 'Failed to load more patients';
      showToast('error', message, 5000);
    }
  }, [query.error, query.isError, showToast]);

  return query;
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export const extractValidationErrors = (
  error: AxiosError<ApiErrorResponse>
): Record<string, string[]> => {
  return error.response?.data?.errors || {};
};

export const formatValidationErrors = (
  errors: Record<string, string[]>
): string => {
  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join('\n');
};

export const buildSearchParams = (
  query: string,
  filters: Partial<PatientSearchRequest> = {}
): PatientSearchRequest => {
  const params: PatientSearchRequest = {
    ...DEFAULT_SEARCH_CRITERIA,
    ...filters,
  };

  if (query && query.trim().length > 0) {
    params.q = query.trim();
  }

  return params;
};

export const usePatientSearchSuggestions = (
  query: string,
  limit: number = 5
) => {
  return usePatientSearch(
    { q: query, limit },
    {
      enabled: query.trim().length >= 2,
      staleTime: 30_000,
      gcTime: 60_000,
    }
  );
};

export const createSearchParams = (
  query: string,
  additionalParams: Partial<PatientSearchRequest> = {}
): PatientSearchRequest => {
  const params: PatientSearchRequest = {
    ...DEFAULT_SEARCH_CRITERIA,
    ...additionalParams,
  };

  if (query && query.trim().length > 0) {
    params.q = query.trim();
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key as keyof PatientSearchRequest] = value as never;
    }
    return acc;
  }, {} as PatientSearchRequest);
};

export const extractPatientFromResponse = (
  response: PatientCreateResponse
): PatientSearchResult | null => {
  if (isPatientCreateSuccessResponse(response)) {
    return response.data;
  }

  return null;
};

export const extractConflictData = (
  response: PatientCreateResponse
): PatientCreationMetadata | null => {
  if (isPatientCreateConflictResponse(response)) {
    return response.meta;
  }

  return null;
};

export const isSuccessfulPatientCreation = (
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse => {
  return (
    isPatientCreateSuccessResponse(response) &&
    response.meta.status === 'created'
  );
};

export const isExistingPatient = (
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse => {
  return (
    isPatientCreateSuccessResponse(response) &&
    response.meta.status === 'already_has_patient'
  );
};

export const getErrorMessage = (
  error: AxiosError<ApiErrorResponse>
): string => {
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

  if (error.response?.status === 409) {
    return 'A conflicting patient or user record already exists';
  }

  if (error.response?.status === 422) {
    return extractFirstValidationMessage(error) || 'Validation failed';
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

export default {
  usePatientSearch,
  useInfinitePatientSearch,
  usePatientByUuid,
  usePatientSearchSuggestions,

  usePatientSearchWithErrorHandling,
  usePatientByUuidWithErrorHandling,
  useInfinitePatientSearchWithErrorHandling,

  useCreatePatientByAdmin,
  useCreatePatientByStaff,
  useCreatePatientWithConflictResolution,
  useForceCreatePatient,

  patientKeys,

  extractValidationErrors,
  formatValidationErrors,
  buildSearchParams,
  createSearchParams,
  extractPatientFromResponse,
  extractConflictData,
  isSuccessfulPatientCreation,
  isExistingPatient,
  getErrorMessage,

  isPatientCreateConflictResponse,
  isPatientCreateSuccessResponse,
  isPossibleDuplicateResponse,
  isExistingUserResponse,
  isNewPatientCreatedResponse,
};