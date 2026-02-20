/**
 * ============================================================================
 * FACILITY IDENTITY REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for facility identity operations.
 * Exactly matches the response structure from FacilityController@getFacilityDetails.
 * 
 * @module useFacilityQueries
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  FacilityIdentityResponse,
  ApiErrorResponse,
  FacilityId,
} from './FacilityTypes';
import { type RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 */
 const facilityKeys = {
  all: ['facility'] as const,
  identity: () => [...facilityKeys.all, 'identity'] as const,
  identityWithId: (facilityId: FacilityId) => [...facilityKeys.identity(), facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches facility identity details from the backend.
 * Calls exactly this endpoint: GET /facility/identity
 * Uses X-Facility-ID header with the active facility ID from Redux context.
 * 
 * The response structure exactly matches the JSON from FacilityController@getFacilityDetails:
 * {
 *   success: true,
 *   message: "Facility identity details retrieved successfully",
 *   data: {
 *     facility: { id, uuid, code, name, legal_name, type, tier, status, phone, email, address },
 *     retrieved_via: "header",
 *     header_used: "X-Facility-ID",
 *     timestamp: "2026-02-20T07:11:56+00:00"
 *   },
 *   errors: null
 * }
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility identity data
 * 
 * @example
 * const { data, isLoading, error } = useGetFacilityIdentity();
 * 
 * // Access facility data
 * const facilityName = data?.data?.facility?.name;
 * const facilityAddress = data?.data?.facility?.address?.formatted;
 * const facilityType = data?.data?.facility?.type;
 */
export const useGetFacilityIdentity = (
  options?: Omit<
    UseQueryOptions<FacilityIdentityResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const { showToast } = useToast();

  return useQuery<FacilityIdentityResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityKeys.identityWithId(facilityId ?? 0),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<FacilityIdentityResponse>(
          '/facility/identity',
          {
            headers: {
              'X-Facility-ID': facilityId,
            },
          }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        
        // Handle specific error cases based on status codes
        if (axiosError.response) {
          const status = axiosError.response.status;
          const errorData = axiosError.response.data;
          
          // Don't show toast for 404s as they might be expected
          if (status !== 404) {
            const errorMessage = errorData?.message || 'Failed to fetch facility identity';
            showToast('error', errorMessage, 5000);
          }
        } else {
          // Network errors or other issues
          showToast('error', 'Network error. Please check your connection.', 5000);
        }
        
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 30 * 60 * 1000, // 30 minutes - facility identity rarely changes
    retry: (failureCount, error: AxiosError<ApiErrorResponse>) => {
      // Don't retry on 4xx errors (client errors)
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      // Retry up to 2 times for server errors
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Fetches facility identity for a specific facility ID.
 * Useful when you need to get identity for a different facility than the active one.
 * 
 * @param facilityId - The facility ID to fetch identity for
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility identity data
 * 
 * @example
 * const { data } = useGetFacilityIdentityById(123);
 */
export const useGetFacilityIdentityById = (
  facilityId: number | null,
  options?: Omit<
    UseQueryOptions<FacilityIdentityResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<FacilityIdentityResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityKeys.identityWithId(facilityId ?? 0),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<FacilityIdentityResponse>(
          '/facility/identity',
          {
            headers: {
              'X-Facility-ID': facilityId,
            },
          }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        
        if (axiosError.response && axiosError.response.status !== 404) {
          const errorMessage = axiosError.response.data?.message || 'Failed to fetch facility identity';
          showToast('error', errorMessage, 5000);
        }
        
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 30 * 60 * 1000,
    retry: (failureCount, error: AxiosError<ApiErrorResponse>) => {
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * Matches the error structure from your controller.
 * 
 * @param error - Axios error from failed request
 * @param fallbackMessage - Default message if API message unavailable
 * @returns Human-readable error message
 * 
 * @example
 * const errorMessage = extractErrorMessage(error, 'Failed to load facility');
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  // Try to get message from response data
  const apiMessage = error.response?.data?.message;
  if (apiMessage) {
    return apiMessage;
  }
  
  // Handle specific HTTP status codes
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'You do not have permission to access this facility.';
    case 404:
      return 'Facility not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || fallbackMessage;
  }
};

/**
 * Helper function to extract validation errors from error response.
 * 
 * @param error - Axios error from failed request
 * @returns Record of field errors or null if none
 */
export const extractFieldErrors = (
  error: AxiosError<ApiErrorResponse>
): Record<string, string[]> | null => {
  return error.response?.data?.errors || null;
};

/**
 * Helper function to format facility address for display.
 * 
 * @param facility - Facility identity object
 * @returns Formatted address string
 * 
 * @example
 * const address = getFacilityAddress(facility); // "123 Main St, New York, NY 10001, USA"
 */
export const getFacilityAddress = (facility: { address: { formatted: string } }): string => {
  return facility.address.formatted;
};

/**
 * Helper function to get facility display name with type.
 * 
 * @param facility - Facility identity object
 * @returns Formatted display name
 * 
 * @example
 * const displayName = getFacilityDisplayName(facility); // "City General Hospital (Hospital)"
 */
export const getFacilityDisplayName = (facility: {
  name: string;
  type: string;
}): string => {
  const typeDisplay = facility.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `${facility.name} (${typeDisplay})`;
};

/**
 * Check if the facility is fully operational.
 * 
 * @param facility - Facility identity object
 * @returns boolean indicating if facility is fully operational
 */
export const isFullyOperational = (facility: { status: string }): boolean => {
  return facility.status === 'fully_operational';
};

/**
 * Check if the facility is closed.
 * 
 * @param facility - Facility identity object
 * @returns boolean indicating if facility is closed
 */
export const isClosed = (facility: { status: string }): boolean => {
  return ['temporarily_closed', 'permanently_closed'].includes(facility.status);
};



/**
 * Default export for convenience.
 */
export default {
  // Query hooks
  useGetFacilityIdentity,
  useGetFacilityIdentityById,

  // Keys
  facilityKeys,

  // Utilities
  extractErrorMessage,
  extractFieldErrors,
  getFacilityAddress,
  getFacilityDisplayName,
  isFullyOperational,
  isClosed,
};