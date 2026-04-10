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
};

/* -------------------------------------------------------------------------- */
/*                               MAIN HOOK                                    */
/* -------------------------------------------------------------------------- */

export const useFacilityAdminAnalyticsQuery = (
  filters: FacilityAdminAnalyticsFilters = {},
  options?: UseFacilityAdminAnalyticsQueryOptions
) => {
  const activeFacilityId = useSelector((state: RootState) =>
    getActiveFacilityId(state)
  );

  const facilityId = options?.facilityId ?? activeFacilityId;
  const cleanedFilters = cleanAnalyticsFilters(filters);

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
        throw new Error('Active facility ID is required to fetch facility analytics.');
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