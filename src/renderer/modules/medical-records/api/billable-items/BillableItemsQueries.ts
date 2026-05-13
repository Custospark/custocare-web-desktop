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

import { useCallback, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type MutateOptions,
} from '@tanstack/react-query';
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
  BillingAdjustmentPayload,
  BillingAdjustmentResponse,
} from './BillingItemsTypes';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

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
    staleTime: 30_000,
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
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

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
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

    /**
     * Submit/finalize billing data for a visit.
     *
     * SAFETY GUARANTEE:
     * - Prevents duplicate HTTP POST requests while one billing save is already in-flight.
     * - This protects against rapid double-clicks / repeated taps on slow internet.
     * - Consumers should use mutateAsync (safe wrapped version returned here).
     */
    export const useSubmitBilling = (
      callbacks: MutationCallbacks<
        BillingSubmissionResponse,
        AxiosError<ApiErrorResponse>
      > = {}
    ) => {
      const queryClient = useQueryClient();
      const { showToast } = useToast();
      const facilityId = useSelector((state: RootState) =>
        getActiveFacilityId(state)
      );

      /**
       * Tracks current in-flight request (prevents duplicate POSTs)
       */
      const inFlightRequestRef = useRef<Promise<BillingSubmissionResponse> | null>(null);

      /**
       * Stores idempotency key for current request lifecycle
       */
      const idempotencyKeyRef = useRef<string | null>(null);

      /**
       * Generate unique idempotency key
       */
      const generateIdempotencyKey = () => {
        return crypto.randomUUID(); // modern & reliable
      };

      /**
       * Reset request state after completion
       */
      const resetRequestState = () => {
        inFlightRequestRef.current = null;
        idempotencyKeyRef.current = null;
      };

      /**
       * Core mutation
       */
      const mutation = useMutation<
        BillingSubmissionResponse,
        AxiosError<ApiErrorResponse>,
        BillingSubmissionPayload
      >({
        mutationFn: async (payload) => {
          // Ensure one key per request lifecycle
          if (!idempotencyKeyRef.current) {
            idempotencyKeyRef.current = generateIdempotencyKey();
          }

          const response = await axiosInstance.post<BillingSubmissionResponse>(
            '/billing/save',
            payload,
            {
              headers: {
                'X-Facility-Id': facilityId,
                'X-Idempotency-Key': idempotencyKeyRef.current,
              },
            }
          );

          return response.data;
        },

        onSuccess: (data, variables) => {
          const successMessage = data.message || 'Billing saved successfully!';
          showToast('success', successMessage, 8000);

          // Invalidate relevant queries
          void queryClient.invalidateQueries({
            queryKey: billingItemsKeys.detail(variables.visit_id),
          });

          callbacks.onSuccess?.(data);
        },

        onError: (error) => {
          const apiMessage =
            error.response?.data?.message ||
            error.message ||
            'Failed to save billing.';

          let errorDetails = '';

          if (error.response?.data?.errors) {
            errorDetails = Object.entries(error.response.data.errors)
              .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
              .join(' | ');
          }

          const displayMessage = errorDetails
            ? `${apiMessage} (${errorDetails})`
            : apiMessage;

          showToast('error', displayMessage, 8000);

          callbacks.onError?.(error);
        },
      });

      /**
       * Promise-based safe mutation (deduplicated)
       */
      const mutateOnceAsync = useCallback(
        (payload: BillingSubmissionPayload): Promise<BillingSubmissionResponse> => {
          if (inFlightRequestRef.current) {
            return inFlightRequestRef.current; // reuse existing request
          }

          const requestPromise = mutation
            .mutateAsync(payload)
            .finally(() => {
              resetRequestState();
            });

          inFlightRequestRef.current = requestPromise;
          return requestPromise;
        },
        [mutation]
      );

      /**
       * Callback-style safe mutation
       */
      const mutateOnce = useCallback(
        (
          payload: BillingSubmissionPayload,
          options?: MutateOptions<
            BillingSubmissionResponse,
            AxiosError<ApiErrorResponse>,
            BillingSubmissionPayload,
            unknown
          >
        ) => {
          if (inFlightRequestRef.current) {
            return; // ignore duplicate trigger
          }

          const requestPromise = mutation
            .mutateAsync(payload, options)
            .finally(() => {
              resetRequestState();
            });

          inFlightRequestRef.current = requestPromise;
        },
        [mutation]
      );

      return {
        ...mutation,
        mutate: mutateOnce,
        mutateAsync: mutateOnceAsync,
        mutateOnceAsync,
      };
    };
/* -------------------------------------------------------------------------- */
/*                           OPTIMISTIC UPDATE HELPERS                        */
/* -------------------------------------------------------------------------- */

const mapBackendBillingStatusToUiStatus = (
  billingStatus?: string
): 'draft' | 'ready' | 'settled' => {
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

interface TaxItem {
  name: string;
  rate: number;
  amount: number;
}

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

export const applyOptimisticLineItemAdjustment = (
  previous: BillingRetrievalResponse | undefined,
  payload: BillingAdjustmentPayload
): BillingRetrievalResponse | undefined => {
  if (!previous?.data?.charge_items?.length) return previous;

  const current = previous.data;
  const existingItem = current.charge_items?.find(
    (item) => item.line_item_id === payload.line_item_id
  );
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
    recalculatedTaxes
      .reduce((sum: number, tax: TaxItem) => sum + (Number(tax.amount) || 0), 0)
      .toFixed(2)
  );

  const newGrandTotal = Number((taxableAmount + newTaxTotal).toFixed(2));
  const totalPaid = Number(existingBillingData?.totalPaid ?? 0);
  const newBalance = Number(Math.max(0, newGrandTotal - totalPaid).toFixed(2));
  const isPaid = newBalance === 0;

  const newBillingStatus =
    newBalance === 0 ? 'paid_in_full' : totalPaid > 0 ? 'partially_paid' : 'pending';

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

  const updatedBillingData: BillingDataWithTaxes = {
    subtotal: newSubtotal,
    discountAmount,
    taxableAmount,
    taxTotal: newTaxTotal,
    grandTotal: newGrandTotal,
    totalPaid,
    balance: newBalance,
    isPaid,
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

export const useAdjustBillingLineItem = (
  visitId: number,
  callbacks: MutationCallbacks<BillingAdjustmentResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const queryClient = useQueryClient();

  interface MutationContext {
    previous: BillingRetrievalResponse | undefined;
  }

  return useMutation<
    BillingAdjustmentResponse,
    AxiosError<ApiErrorResponse>,
    BillingAdjustmentPayload,
    MutationContext
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
      if (context?.previous) {
        queryClient.setQueryData(billingItemsKeys.detail(visitId), context.previous);
      }

      const apiMessage =
        error.response?.data?.message || error.message || 'Failed to adjust billing item.';
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

export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

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

export default {
  useGetBillableItems,
  useGetBillingByVisit,
  useSubmitBilling,
  useAdjustBillingLineItem,
  billingItemsKeys,
  extractErrorMessage,
  formatValidationErrors,
};
