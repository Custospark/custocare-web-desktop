/**FacilityPatientAnalyticsQueries.ts
 * ============================================================================
 * DASHBOARD REACT QUERY HOOKS
 * ============================================================================
 *
 * React Query hooks for fetching clinic owner dashboard data.
 *
 * @module useDashboardQueries
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import type {
  DashboardResponse,
  DashboardQueryParams,
}  from './FacilityPatientAnalyticsTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: (facilityId: number, params: DashboardQueryParams) =>
    [...dashboardKeys.all, 'overview', facilityId, params] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useDashboardOverview = (
  params: DashboardQueryParams = { period: 'week' },
  options?: Omit<
    UseQueryOptions<DashboardResponse, AxiosError>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<DashboardResponse, AxiosError>({
    queryKey: dashboardKeys.overview(facilityId ?? 0, params),
    queryFn: async () => {
      const response = await axiosInstance.get<DashboardResponse>(
        '/patients/facility-patient-analytics',
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
          params: {
            period: params.period,
            date_from: params.date_from,
            date_to: params.date_to,
          },
        }
      );
      return response.data;
    },
    enabled: !!facilityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL                                      */
/* -------------------------------------------------------------------------- */

export default {
  useDashboardOverview,
  dashboardKeys,
};