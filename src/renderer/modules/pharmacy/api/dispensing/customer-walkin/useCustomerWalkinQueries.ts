/**
 * ============================================================================
 * CUSTOMER WALK-IN REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for customer
 * walk-in management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useCustomerWalkinQueries
 * @description Provides type-safe, reusable hooks for all customer walk-in
 * operations. Automatically retrieves facilityId from Redux store context.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMemo } from 'react';
import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  CreateWalkInSessionParams,
  CreateWalkInSessionResponse,
  FacilityId,
  FacilityWalkInPatientResponse,
  MutationCallbacks,
  SystemWalkInUserValidationResponse,
  UpgradeWalkInSessionParams,
  UpgradeWalkInSessionResponse,
  ValidateSystemWalkInUserParams,
  WalkInSession,
} from './useCustomerWalkInTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all walk-in queries
 * queryClient.invalidateQueries({ queryKey: customerWalkInKeys.all });
 */
export const customerWalkInKeys = {
  all: ['customer-walk-in'] as const,
  lists: () => [...customerWalkInKeys.all, 'list'] as const,
  byFacility: (facilityId: FacilityId) => [...customerWalkInKeys.lists(), 'facility', facilityId] as const,
  walkInPatient: (facilityId: FacilityId) => [...customerWalkInKeys.all, 'walk-in-patient', facilityId] as const,
  session: (facilityId: FacilityId) => [...customerWalkInKeys.all, 'session', facilityId] as const,
  userValidation: (userId: number) => [...customerWalkInKeys.all, 'user-validation', userId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the walk-in patient for the current active facility.
 * Creates the walk-in patient if it doesn't exist.
 * 
 * @param options - React Query options for customizing behavior
 * @param customFacilityId - Optional custom facility ID (overrides active facility)
 * @returns Query result with facility walk-in patient details
 * 
 * @example
 * const { data, isLoading, error } = useGetFacilityWalkInPatient();
 * // Uses the active facility ID from Redux store
 * 
 * @example With custom facility ID
 * const { data } = useGetFacilityWalkInPatient({}, 123);
 */
export const useGetFacilityWalkInPatient = (
  options?: Omit<UseQueryOptions<FacilityWalkInPatientResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>,
  customFacilityId?: FacilityId
) => {
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const facilityId = customFacilityId || activeFacilityId;

  return useQuery<FacilityWalkInPatientResponse, AxiosError<ApiErrorResponse>>({
    queryKey: customerWalkInKeys.walkInPatient(facilityId as FacilityId),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('No facility ID available. User may not be in staff mode or no facility selected.');
      }
      
      const response = await axiosInstance.get<FacilityWalkInPatientResponse>(
        `/facilities/${facilityId}/walkin/patient`
      );
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is available
    ...options,
  });
};

/**
 * Validates if a user is the system walk-in user.
 * Useful for verifying user identity in walk-in flows.
 * 
 * @param userId - User ID to validate
 * @param options - React Query options for customizing behavior
 * @returns Query result with validation status
 * 
 * @example
 * const { data } = useValidateSystemWalkInUser({ userId: 123 });
 */
export const useValidateSystemWalkInUser = (
  { userId }: ValidateSystemWalkInUserParams,
  options?: Omit<UseQueryOptions<SystemWalkInUserValidationResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SystemWalkInUserValidationResponse, AxiosError<ApiErrorResponse>>({
    queryKey: customerWalkInKeys.userValidation(userId),
    queryFn: async () => {
      const response = await axiosInstance.get<SystemWalkInUserValidationResponse>(
        `/users/${userId}/validate-system-walkin`
      );
      return response.data;
    },
    enabled: !!userId, // Only run query if userId is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new walk-in session for a customer at the active facility.
 * Creates walk-in patient, visit, and billing cycle in a single transaction.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @param customFacilityId - Optional custom facility ID (overrides active facility)
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateWalkInSession({
 *   onSuccess: (data) => navigate(data.data.ui_next.route, { state: data.data.ui_next.params }),
 * });
 * 
 * // Uses active facility ID automatically
 * mutate();
 * 
 * @example With custom facility ID
 * const { mutate } = useCreateWalkInSession({}, 123);
 * mutate();
 */
export const useCreateWalkInSession = (
  callbacks: MutationCallbacks<CreateWalkInSessionResponse, AxiosError<ApiErrorResponse>> = {},
  customFacilityId?: FacilityId
) => {
  const { showToast } = useToast();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const facilityId = customFacilityId || activeFacilityId;

  return useMutation<CreateWalkInSessionResponse, AxiosError<ApiErrorResponse>, void>({
    mutationFn: async () => {
      if (!facilityId) {
        throw new Error('No facility ID available. User may not be in staff mode or no facility selected.');
      }
      
      const response = await axiosInstance.post<CreateWalkInSessionResponse>(
        `/facilities/${facilityId}/walkin/session`
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Walk-in session created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create walk-in session.';

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
 * Upgrades a walk-in session to a real patient.
 * Converts anonymous walk-in patient to registered patient with identity.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @param customFacilityId - Optional custom facility ID (overrides active facility)
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useUpgradeWalkInSession({
 *   onSuccess: (data) => navigate(data.data.ui_next.route, { state: data.data.ui_next.params }),
 * });
 * 
 * mutate({
 *   billingCycleId: 123,
 *   data: {
 *     first_name: 'John',
 *     last_name: 'Doe',
 *     phone: '+1234567890',
 *     email: 'john@example.com'
 *     // facility_id is automatically included from active facility
 *   }
 * });
 */
export const useUpgradeWalkInSession = (
  callbacks: MutationCallbacks<UpgradeWalkInSessionResponse, AxiosError<ApiErrorResponse>> = {},
  customFacilityId?: FacilityId
) => {
  const { showToast } = useToast();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const facilityId = customFacilityId || activeFacilityId;

  return useMutation<UpgradeWalkInSessionResponse, AxiosError<ApiErrorResponse>, Omit<UpgradeWalkInSessionParams, 'data'> & {
    data: Omit<UpgradeWalkInSessionResponse, 'facility_id'>
  }>({
    mutationFn: async ({ billingCycleId, data }) => {
      if (!facilityId) {
        throw new Error('No facility ID available. User may not be in staff mode or no facility selected.');
      }
      
      const requestData = {
        ...data,
        facility_id: facilityId,
      };
      
      const response = await axiosInstance.post<UpgradeWalkInSessionResponse>(
        `/walkin/session/${billingCycleId}/upgrade`,
        requestData
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Walk-in session upgraded successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to upgrade walk-in session.';

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

/* -------------------------------------------------------------------------- */
/*                      FACILITY-AWARE MUTATION HOOKS                         */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new walk-in session with explicit facility ID.
 * Use this when you need to specify a facility ID explicitly.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useCreateWalkInSessionWithFacility();
 * mutate({ facilityId: 123 });
 */
export const useCreateWalkInSessionWithFacility = (
  callbacks: MutationCallbacks<CreateWalkInSessionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<CreateWalkInSessionResponse, AxiosError<ApiErrorResponse>, CreateWalkInSessionParams>({
    mutationFn: async ({ facilityId }: CreateWalkInSessionParams) => {
      const response = await axiosInstance.post<CreateWalkInSessionResponse>(
        `/facilities/${facilityId}/walkin/session`
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Walk-in session created successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create walk-in session.';

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
 * Upgrades a walk-in session with explicit facility ID.
 * Use this when you need to specify a facility ID explicitly.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpgradeWalkInSessionWithFacility();
 * mutate({
 *   billingCycleId: 123,
 *   data: {
 *     facility_id: 456,
 *     first_name: 'John',
 *     last_name: 'Doe'
 *   }
 * });
 */
export const useUpgradeWalkInSessionWithFacility = (
  callbacks: MutationCallbacks<UpgradeWalkInSessionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<UpgradeWalkInSessionResponse, AxiosError<ApiErrorResponse>, UpgradeWalkInSessionParams>({
    mutationFn: async ({ billingCycleId, data }: UpgradeWalkInSessionParams) => {
      const response = await axiosInstance.post<UpgradeWalkInSessionResponse>(
        `/walkin/session/${billingCycleId}/upgrade`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Walk-in session upgraded successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to upgrade walk-in session.';

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
 * Helper function to extract UI navigation details from walk-in session.
 * Provides standardized navigation to next step in walk-in flow.
 * 
 * @param session - Walk-in session response
 * @returns Navigation configuration for UI routing
 * 
 * @example
 * const navigation = getWalkInSessionNavigation(sessionData);
 * navigate(navigation.route, { state: navigation.params });
 */
export const getWalkInSessionNavigation = (session: WalkInSession) => {
  return {
    route: session.ui_next.route,
    params: session.ui_next.params,
  };
};

/**
 * Custom hook to get the current facility ID with safety checks.
 * Useful for components that need to check if they can perform walk-in operations.
 * 
 * @returns Object with facilityId and validation state
 * 
 * @example
 * const { facilityId, isValid, error } = useCurrentFacility();
 * if (!isValid) {
 *   return <div>Please select a facility first</div>;
 * }
 */
export const useCurrentFacility = () => {
  const facilityId = useAppSelector(getActiveFacilityId);
  
  return useMemo(() => ({
    facilityId,
    isValid: !!facilityId,
    error: facilityId ? null : 'No facility ID available. User may not be in staff mode or no facility selected.',
  }), [facilityId]);
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
  useGetFacilityWalkInPatient,
  useValidateSystemWalkInUser,
  
  // Auto-facility mutation hooks
  useCreateWalkInSession,
  useUpgradeWalkInSession,
  
  // Explicit-facility mutation hooks
  useCreateWalkInSessionWithFacility,
  useUpgradeWalkInSessionWithFacility,
  
  // Utilities
  customerWalkInKeys,
  extractErrorMessage,
  formatValidationErrors,
  getWalkInSessionNavigation,
  useCurrentFacility,
};