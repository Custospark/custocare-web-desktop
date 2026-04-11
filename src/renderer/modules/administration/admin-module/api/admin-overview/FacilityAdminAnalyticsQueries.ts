/**
 * FacilityAdminAnalyticsQueries.ts
 * ============================================================================
 * FACILITY ADMIN ANALYTICS DASHBOARD REACT QUERY HOOKS
 * ============================================================================
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import type { RootState } from '../../../../../app/store/store';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  FacilityAdminAnalyticsFilters,
  FacilityAdminAnalyticsResponse,
} from './FacilityAdminAnalyticsTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const facilityAdminAnalyticsKeys = {
  all: ['facility-admin-analytics'] as const,
  dashboard: (facilityId: number, filters: FacilityAdminAnalyticsFilters) =>
    [...facilityAdminAnalyticsKeys.all, facilityId, filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                               UTILITIES                                    */
/* -------------------------------------------------------------------------- */

export const cleanAnalyticsFilters = (
  filters: FacilityAdminAnalyticsFilters
): FacilityAdminAnalyticsFilters => {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b))
  ) as FacilityAdminAnalyticsFilters;
};

const getFacilityAdminAnalytics = async (
  facilityId: number,
  filters: FacilityAdminAnalyticsFilters
): Promise<FacilityAdminAnalyticsResponse> => {
  const cleanedFilters = cleanAnalyticsFilters(filters);

  const response = await axiosInstance.get<FacilityAdminAnalyticsResponse>(
    '/dashboard/facility-analytics',
    {
      headers: {
        'X-Facility-Id': facilityId,
      },
      params: cleanedFilters,
    }
  );

  return response.data;
};

/* -------------------------------------------------------------------------- */
/*                                QUERY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type UseFacilityAdminAnalyticsQueryOptions = Omit<
  UseQueryOptions<
    FacilityAdminAnalyticsResponse,
    AxiosError<ApiErrorResponse>,
    FacilityAdminAnalyticsResponse,
    ReturnType<typeof facilityAdminAnalyticsKeys.dashboard>
  >,
  'queryKey' | 'queryFn'
> & {
  facilityId?: number;
  showErrorToast?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                               MAIN HOOK                                    */
/* -------------------------------------------------------------------------- */

export const useFacilityAdminAnalyticsQuery = (
  filters: FacilityAdminAnalyticsFilters = {},
  options?: UseFacilityAdminAnalyticsQueryOptions
) => {
  const { showToast } = useToast();
  const activeFacilityId = useSelector((state: RootState) =>
    getActiveFacilityId(state)
  );

  const facilityId = options?.facilityId ?? activeFacilityId;
  const cleanedFilters = cleanAnalyticsFilters(filters);
  const showErrorToast = options?.showErrorToast ?? true;

  return useQuery<
    FacilityAdminAnalyticsResponse,
    AxiosError<ApiErrorResponse>,
    FacilityAdminAnalyticsResponse,
    ReturnType<typeof facilityAdminAnalyticsKeys.dashboard>
  >({
    queryKey: facilityAdminAnalyticsKeys.dashboard(
      Number(facilityId ?? 0),
      cleanedFilters
    ),
    queryFn: () => {
      if (!facilityId) {
        const errorMessage = 'Active facility ID is required to fetch facility analytics.';
        if (showErrorToast) {
          showToast('error', errorMessage, 8000);
        }
        throw new Error(errorMessage);
      }
      return getFacilityAdminAnalytics(Number(facilityId), cleanedFilters);
    },
    enabled: Boolean(facilityId) && (options?.enabled ?? true),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                              EXPORT HELPERS                                */
/* -------------------------------------------------------------------------- */

export { getFacilityAdminAnalytics };

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