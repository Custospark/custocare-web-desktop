//BillableItemsQueries.ts
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

import { useQuery, type UseQueryOptions, useQueryClient } from '@tanstack/react-query';
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
import type {
  BillingAdjustmentPayload,
  BillingAdjustmentResponse,
} from './BillingItemsTypes';

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
  const queryClient = useQueryClient();
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
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Billing saved successfully!';
      showToast('success', successMessage, 8000);

      queryClient.invalidateQueries({ queryKey: billingItemsKeys.detail(variables.visit_id) });

      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to save billing.';

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
/*                           OPTIMISTIC UPDATE HELPERS                        */
/* -------------------------------------------------------------------------- */

/**
 * Maps backend billing status to UI status
 */
const mapBackendBillingStatusToUiStatus = (billingStatus?: string): 'draft' | 'ready' | 'settled' => {
  switch (billingStatus) {
    case 'paid_in_full':
    case 'written_off':
    case 'charity_care':
      return 'settled';
    case 'pending':
    case 'partially_paid':
    case 'submitted_to_insurance':
    case 'payment_plan':
    default:
      return 'ready';
  }
};

/**
 * Tax item interface
 */
interface TaxItem {
  name: string;
  rate: number;
  amount: number;
}

/**
 * Billing data with taxes interface
 */
interface BillingDataWithTaxes {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  isPaid?: boolean;
  taxes?: TaxItem[];
}

/**
 * Apply optimistic update for line item adjustment
 */
export const applyOptimisticLineItemAdjustment = (
  previous: BillingRetrievalResponse | undefined,
  payload: BillingAdjustmentPayload
): BillingRetrievalResponse | undefined => {
  if (!previous?.data?.charge_items?.length) return previous;

  const current = previous.data;
  const existingItem = current.charge_items?.find((item) => item.line_item_id === payload.line_item_id);
  if (!existingItem) return previous;

  const action = payload.action;
  const changeQty = Math.max(0, Number(payload.quantity ?? 1));
  const oldQty = Number(existingItem.quantity || 0);
  const unitPrice = Number(existingItem.service?.unitPrice || 0);

  let newQty = oldQty;

  if (action === 'increase') newQty = oldQty + changeQty;
  if (action === 'decrease') newQty = Math.max(0, oldQty - changeQty);
  if (action === 'remove') newQty = 0;

  const oldLineTotal = Number(existingItem.totalAmount || 0);
  const newLineTotal = Number((newQty * unitPrice).toFixed(2));
  const lineDelta = Number((newLineTotal - oldLineTotal).toFixed(2));

  // Type-safe billing data extraction
  const existingBillingData = current.billing_data as BillingDataWithTaxes | undefined;
  const taxes: TaxItem[] = existingBillingData?.taxes ?? [];

  const newSubtotal = Number(((existingBillingData?.subtotal ?? 0) + lineDelta).toFixed(2));
  const discountAmount = Number(existingBillingData?.discountAmount ?? 0);
  const taxableAmount = Number(Math.max(0, newSubtotal - discountAmount).toFixed(2));

  const recalculatedTaxes: TaxItem[] = taxes.map((tax: TaxItem) => ({
    name: tax.name,
    rate: tax.rate,
    amount: Number((taxableAmount * ((Number(tax.rate) || 0) / 100)).toFixed(2)),
  }));

  const newTaxTotal = Number(
    recalculatedTaxes.reduce((sum: number, tax: TaxItem) => sum + (Number(tax.amount) || 0), 0).toFixed(2)
  );

  const newGrandTotal = Number((taxableAmount + newTaxTotal).toFixed(2));
  const totalPaid = Number(existingBillingData?.totalPaid ?? 0);
  const newBalance = Number(Math.max(0, newGrandTotal - totalPaid).toFixed(2));
  const isPaid = newBalance === 0;

  const newBillingStatus =
    newBalance === 0 ? 'paid_in_full' : totalPaid > 0 ? 'partially_paid' : 'pending';

  // Type-safe charge_items handling
  const updatedItems = (current.charge_items ?? [])
    .map((item) => {
      if (item.line_item_id !== payload.line_item_id) return item;

      if (newQty <= 0) {
        return {
          ...item,
          quantity: 0,
          totalAmount: 0,
          line_item_status: 'adjusted',
          audit: {
            ...item.audit,
            last_adjusted_at: new Date().toISOString(),
            last_adjustment_reason: payload.reason || null,
          } as any,
        };
      }

      return {
        ...item,
        quantity: newQty,
        totalAmount: newLineTotal,
        line_item_status: 'adjusted',
        audit: {
          ...item.audit,
          last_adjusted_at: new Date().toISOString(),
          last_adjustment_reason: payload.reason || null,
        } as any,
      };
    })
    .filter((item) => Number(item.quantity || 0) > 0);

  // Type-safe billing_data update with taxes
  const updatedBillingData: BillingDataWithTaxes = {
    subtotal: newSubtotal,
    discountAmount: discountAmount,
    taxableAmount: taxableAmount,
    taxTotal: newTaxTotal,
    grandTotal: newGrandTotal,
    totalPaid: totalPaid,
    balance: newBalance,
    isPaid: isPaid,
    taxes: recalculatedTaxes,
  };

  return {
    ...previous,
    data: {
      ...current,
      charge_items: updatedItems,
      billing_status: newBillingStatus,
      status: mapBackendBillingStatusToUiStatus(newBillingStatus),
      billing_data: updatedBillingData,
      updated_at: new Date().toISOString(),
      last_updated: Date.now(),
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                             ADJUSTMENT HOOK                                */
/* -------------------------------------------------------------------------- */

/**
 * Adjust a persisted backend billing line item.
 * Used for enterprise-safe edits to already saved charges.
 *//**
 * Adjust a persisted backend billing line item.
 * Used for enterprise-safe edits to already saved charges.
 */
export const useAdjustBillingLineItem = (
  visitId: number,
  callbacks: MutationCallbacks<BillingAdjustmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const queryClient = useQueryClient();

  // Define the context type for the mutation
  interface MutationContext {
    previous: BillingRetrievalResponse | undefined;
  }

  return useMutation<
    BillingAdjustmentResponse, 
    AxiosError<ApiErrorResponse>, 
    BillingAdjustmentPayload,
    MutationContext  // This is the key - add the context type as the 4th generic parameter
  >({
    mutationFn: async (payload: BillingAdjustmentPayload) => {
      const response = await axiosInstance.patch<BillingAdjustmentResponse>(
        `/billing/line-item/${payload.line_item_id}/adjust`,
        payload,
        {
          headers: {
            'X-Facility-Id': facilityId,
          },
        }
      );
      return response.data;
    },

    onMutate: async (payload): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: billingItemsKeys.detail(visitId) });

      const previous = queryClient.getQueryData<BillingRetrievalResponse>(
        billingItemsKeys.detail(visitId)
      );

      const optimistic = applyOptimisticLineItemAdjustment(previous, payload);

      if (optimistic) {
        queryClient.setQueryData(billingItemsKeys.detail(visitId), optimistic);
      }

      return { previous };
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Billing item adjusted successfully.', 8000);
      callbacks.onSuccess?.(data);
    },

    onError: (error, _payload, context) => {
      // Now TypeScript knows that context has a 'previous' property
      if (context?.previous) {
        queryClient.setQueryData(billingItemsKeys.detail(visitId), context.previous);
      }

      const apiMessage = error.response?.data?.message || error.message || 'Failed to adjust billing item.';
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${apiMessage} (${details})` : apiMessage, 8000);

      callbacks.onError?.(error);
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: billingItemsKeys.detail(visitId) });
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
  useAdjustBillingLineItem,

  // Utilities
  billingItemsKeys,
  extractErrorMessage,
  formatValidationErrors,
};