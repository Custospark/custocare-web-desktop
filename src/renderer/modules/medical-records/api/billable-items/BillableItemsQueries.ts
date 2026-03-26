/**
 * ============================================================================
 * BILLING ITEMS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for billing operations following the
 * department queries pattern with consistent error handling, toast notifications,
 * and type safety.
 * 
 * @module useBillingItemsQueries
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  BillableItemsFilters,
  BillableItemsResponse,
  BillingRetrievalResponse,
  BillingSubmissionResponse,
  BillingSubmissionPayload,
  ApiErrorResponse,
  MutationCallbacks,
} from './BillingItemsTypes';
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
 * // Invalidate all billing queries
 * queryClient.invalidateQueries({ queryKey: billingItemsKeys.all });
 * 
 * // Invalidate billable items list
 * queryClient.invalidateQueries({ queryKey: billingItemsKeys.lists() });
 */
export const billingItemsKeys = {
  all: ['billing'] as const,
  lists: () => [...billingItemsKeys.all, 'list'] as const,
  list: (facilityId: number, filters: BillableItemsFilters) => 
    [...billingItemsKeys.lists(), facilityId, filters] as const,
  details: () => [...billingItemsKeys.all, 'detail'] as const,
  detail: (visitId: number) => [...billingItemsKeys.details(), visitId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches billable items and services from the backend.
 * Calls exactly this endpoint: GET /billing/billable-items
 * Automatically uses active facility ID from Redux context.
 * 
 * @param filters - Optional filters (category, search, limit, include_inactive, type)
 * @param options - React Query options for customizing behavior
 * @returns Query result with billable items
 * 
 * @example
 * const { data, isLoading } = useGetBillableItems();
 * const { data } = useGetBillableItems({ search: 'paracetamol' });
 */
export const useGetBillableItems = (
  filters: BillableItemsFilters = {},
  options?: Omit<
    UseQueryOptions<BillableItemsResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillableItemsResponse, AxiosError<ApiErrorResponse>>({
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

/**
 * Retrieve billing data for a visit
 * 
 * @param visitId - Visit ID to fetch billing data for
 * @param options - React Query options for customizing behavior
 * @returns Query result with billing data
 * 
 * @example
 * const { data, isLoading } = useGetBillingByVisit(123);
 */
export const useGetBillingByVisit = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<BillingRetrievalResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<BillingRetrievalResponse, AxiosError<ApiErrorResponse>>({
    queryKey: billingItemsKeys.detail(visitId),
    queryFn: async () => {
      const response = await axiosInstance.get<BillingRetrievalResponse>(
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Submit/finalize billing data for a visit
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useSubmitBilling({
 *   onSuccess: (data) => navigate(`/billing/${data.data.billing_cycle_uuid}`),
 * });
 * 
 * mutate({
 *   visit_id: 123,
 *   charge_items: [...],
 *   discount: {...},
 *   payment_methods: [...]
 * });
 */
export const useSubmitBilling = (
  callbacks: MutationCallbacks<BillingSubmissionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useMutation<BillingSubmissionResponse, AxiosError<ApiErrorResponse>, BillingSubmissionPayload>({
    mutationFn: async (payload: BillingSubmissionPayload) => {
      const response = await axiosInstance.post<BillingSubmissionResponse>(
        '/billing/save',
        payload,
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Billing saved successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to save billing.';

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

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Query hooks
  useGetBillableItems,
  useGetBillingByVisit,

  // Mutation hooks
  useSubmitBilling,
  

  // Utilities
  billingItemsKeys,
  extractErrorMessage,
  formatValidationErrors,
};