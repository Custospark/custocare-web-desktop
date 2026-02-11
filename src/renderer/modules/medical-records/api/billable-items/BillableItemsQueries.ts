/**
 * ============================================================================
 * BILLING ITEMS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains ONE query hook to call the billable items API endpoint.
 * STRICTLY one method as requested.
 * 
 * @module useBillingItemsQueries
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  BillableItemsFilters,
  BillableItemsResponse,
} from './BillingItemsTypes';
import { type RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const billingItemsKeys = {
  all: ['billable-items'] as const,
  list: (facilityId: number, filters: BillableItemsFilters) => 
    [...billingItemsKeys.all, facilityId, filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                          ONE SINGLE QUERY HOOK                             */
/* -------------------------------------------------------------------------- */

/**
 * THE ONLY METHOD - Fetches billable items and services from the backend.
 * Calls exactly this endpoint: GET /billing/billable-items
 * Automatically uses active facility ID from Redux context.
 * 
 * @param filters - Optional filters (category, search, limit, include_inactive, type)
 * @param options - React Query options
 * 
 * @example
 * const { data, isLoading } = useGetBillableItems();
 * const { data } = useGetBillableItems({ search: 'paracetamol' });
 */
export const useGetBillableItems = (
  filters: BillableItemsFilters = {},
  options?: Omit<
    UseQueryOptions<BillableItemsResponse, AxiosError>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillableItemsResponse, AxiosError>({
    queryKey: billingItemsKeys.list(facilityId ?? 0, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<BillableItemsResponse>(
        '/billing/billable-items',
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
          params: {
            category: filters.category || undefined,
            search: filters.search || undefined,
            limit: filters.limit || undefined,
            include_inactive: filters.include_inactive || undefined,
            type: filters.type || undefined,
          },
        }
      );
      return response.data;
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export default {
  useGetBillableItems,
  billingItemsKeys,
};