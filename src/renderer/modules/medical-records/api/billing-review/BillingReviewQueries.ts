/**
 * BillingReviewQueries.ts
 * ============================================================================
 * BILLING REVIEW REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for billing review operations following
 * the department queries pattern with consistent error handling, toast notifications,
 * and type safety.
 * 
 * @module useBillingReviewQueries
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  BillingReviewResponse,
  BillingReviewFilters,
  ApiErrorResponse,
  BillingDetailResponse,
} from './BillingReviewTypes';
import { type RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all billing review queries
 * queryClient.invalidateQueries({ queryKey: billingReviewKeys.all });
 * 
 * // Invalidate billing review list for facility 1
 * queryClient.invalidateQueries({ queryKey: billingReviewKeys.lists(1) });
 */
export const billingReviewKeys = {
  all: ['billing-review'] as const,
  lists: (facilityId: number) => [...billingReviewKeys.all, 'list', facilityId] as const,
  list: (facilityId: number, filters: BillingReviewFilters) => 
    [...billingReviewKeys.lists(facilityId), filters] as const,
  details: (facilityId: number) => [...billingReviewKeys.all, 'detail', facilityId] as const,
  detail: (facilityId: number, visitId: number) => 
    [...billingReviewKeys.details(facilityId), visitId] as const,
  // New key for single visit in facility format
  facilityVisit: (facilityId: number, visitId: number) => 
    [...billingReviewKeys.all, 'facility-visit', facilityId, visitId] as const,
  summaries: (facilityId: number) => [...billingReviewKeys.all, 'summary', facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches billing review data for a specific facility.
 * Calls exactly this endpoint: GET /billing/facility/{facilityId}
 * Automatically uses active facility ID from Redux context.
 * 
 * @param filters - Optional filters (page, per_page, search, payment_status, etc.)
 * @param options - React Query options for customizing behavior
 * @returns Query result with paginated billing review items
 * 
 * @example
 * const { data, isLoading } = useGetBillingReview();
 * const { data } = useGetBillingReview({ payment_status: 'paid_in_full', page: 2 });
 */
export const useGetBillingReview = (
  filters: BillingReviewFilters = {},
  options?: Omit<
    UseQueryOptions<BillingReviewResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillingReviewResponse, AxiosError<ApiErrorResponse>>({
    queryKey: billingReviewKeys.list(facilityId ?? 0, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<BillingReviewResponse>(
        `/billing/facility/${facilityId}`,
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
          params: {
            page: filters.page || undefined,
            per_page: filters.per_page || undefined,
            search: filters.search || undefined,
            payment_status: filters.payment_status || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            patient_id: filters.patient_id || undefined,
            has_billing: filters.has_billing !== undefined ? filters.has_billing : undefined,
            sort_by: filters.sort_by || undefined,
            sort_order: filters.sort_order || undefined,
          },
        }
      );
      return response.data;
    },
    enabled: !!facilityId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
    ...options,
  });
};

/**
 * Fetches billing data for a single visit in the facility endpoint format.
 * This returns data structured the same way as getByFacility but for a single visit.
 * 
 * This is the primary hook to use after billing finalization.
 * 
 * @param visitId - The visit ID to fetch billing data for
 * @param options - React Query options
 * @returns Query result with billing data in facility format
 * 
 * @example
 * const { data, refetch } = useGetBillingByVisitForFacility(visitId);
 */
export const useGetBillingByVisitForFacility = (
  visitId: number | null,
  options?: Omit<
    UseQueryOptions<BillingReviewResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillingReviewResponse, AxiosError<ApiErrorResponse>>({
    queryKey: billingReviewKeys.facilityVisit(facilityId ?? 0, visitId ?? 0),
    queryFn: async () => {
      const response = await axiosInstance.get<BillingReviewResponse>(
        `/billing/visit/${visitId}/facility-format`,
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
        }
      );
      return response.data;
    },
    enabled: !!facilityId && !!visitId,
    staleTime: 0, // Always fresh after finalization
    retry: 1,
    ...options,
  });
};

/**
 * Fetches billing data for a single visit (original method - for backward compatibility)
 * 
 * @param visitId - The visit ID to fetch billing data for
 * @param options - React Query options
 * @returns Query result with single billing item
 */
export const useGetBillingByVisit = (
  visitId: number | null,
  options?: Omit<
    UseQueryOptions<BillingDetailResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillingDetailResponse, AxiosError<ApiErrorResponse>>({
    queryKey: billingReviewKeys.detail(facilityId ?? 0, visitId ?? 0),
    queryFn: async () => {
      const response = await axiosInstance.get<BillingDetailResponse>(
        `/billing/visit/${visitId}`,
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
        }
      );
      return response.data;
    },
    enabled: !!facilityId && !!visitId,
    staleTime: 3 * 60 * 1000,
    ...options,
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
 * Prefetch next page of billing review for better UX
 * 
 * @param facilityId - Facility ID
 * @param currentPage - Current page number
 * @param filters - Current filters
 * @param queryClient - React Query client instance
 */
export const prefetchNextBillingPage = async (
  facilityId: number,
  currentPage: number,
  filters: BillingReviewFilters,
  queryClient: ReturnType<typeof useQueryClient>
) => {
  const totalPages = queryClient.getQueryData<BillingReviewResponse>(
    billingReviewKeys.list(facilityId, { ...filters, page: currentPage })
  )?.data.pagination.total_pages;

  if (totalPages && currentPage < totalPages) {
    await queryClient.prefetchQuery({
      queryKey: billingReviewKeys.list(facilityId, { ...filters, page: currentPage + 1 }),
      queryFn: async () => {
        const response = await axiosInstance.get<BillingReviewResponse>(
          `/facility/${facilityId}`,
          {
            headers: { 'X-Facility-Id': facilityId },
            params: { ...filters, page: currentPage + 1 },
          }
        );
        return response.data;
      },
    });
  }
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
  useGetBillingReview,
  useGetBillingByVisitForFacility,
  useGetBillingByVisit,
  
  // Utilities
  billingReviewKeys,
  extractErrorMessage,
  formatValidationErrors,
  prefetchNextBillingPage,
};