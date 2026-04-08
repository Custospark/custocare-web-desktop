/**
 * BillingRevenueDashboardQueries.ts
 * ============================================================================
 * BILLING REVENUE DASHBOARD REACT QUERY HOOKS
 * ============================================================================
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  BillingRevenueDashboardFilters,
  BillingRevenueDashboardResponse,
} from './BillingRevenueDashboardTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const billingRevenueDashboardKeys = {
  all: ['billing-revenue-dashboard'] as const,
  dashboard: (facilityId: number, filters: BillingRevenueDashboardFilters) =>
    [...billingRevenueDashboardKeys.all, facilityId, filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                               UTILITIES                                    */
/* -------------------------------------------------------------------------- */

export const cleanDashboardFilters = (
  filters: BillingRevenueDashboardFilters
): BillingRevenueDashboardFilters => {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b))
  ) as BillingRevenueDashboardFilters;
};

const getBillingRevenueDashboard = async (
  facilityId: number,
  filters: BillingRevenueDashboardFilters
): Promise<BillingRevenueDashboardResponse> => {
  const cleanedFilters = cleanDashboardFilters(filters);

  const response = await axiosInstance.get<BillingRevenueDashboardResponse>(
    '/billing/dashboard/revenue',
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

export type UseBillingRevenueDashboardQueryOptions = Omit<
  UseQueryOptions<
    BillingRevenueDashboardResponse,
    AxiosError<ApiErrorResponse>,
    BillingRevenueDashboardResponse,
    ReturnType<typeof billingRevenueDashboardKeys.dashboard>
  >,
  'queryKey' | 'queryFn'
> & {
  facilityId?: number;
};

/* -------------------------------------------------------------------------- */
/*                               MAIN HOOK                                    */
/* -------------------------------------------------------------------------- */

export const useBillingRevenueDashboardQuery = (
  filters: BillingRevenueDashboardFilters = {} as BillingRevenueDashboardFilters,
  options?: UseBillingRevenueDashboardQueryOptions
) => {
  const activeFacilityId = useSelector((state: RootState) =>
    getActiveFacilityId(state)
  );

  const facilityId = options?.facilityId ?? activeFacilityId;
  const cleanedFilters = cleanDashboardFilters(filters);

  return useQuery<
    BillingRevenueDashboardResponse,
    AxiosError<ApiErrorResponse>,
    BillingRevenueDashboardResponse,
    ReturnType<typeof billingRevenueDashboardKeys.dashboard>
  >({
    queryKey: billingRevenueDashboardKeys.dashboard(
      Number(facilityId ?? 0),
      cleanedFilters
    ),
    queryFn: () => {
      if (!facilityId) {
        throw new Error('Active facility ID is required to fetch dashboard data.');
      }

      return getBillingRevenueDashboard(Number(facilityId), cleanedFilters);
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

export { getBillingRevenueDashboard };
