/**
 * ============================================================================
 * PAYMENT GATEWAY — REACT QUERY HOOKS (TanStack React Query v5)
 * ============================================================================
 *
 * React Query v5 NOTE:
 * - useQuery() options no longer support onSuccess/onError callbacks.
 * - Side effects must be handled via useEffect on returned query data.
 *
 * Facility-based billing:
 * - Facility context comes from Redux: activeContextSlice.activeFacilityId
 * - Endpoints are facility-scoped.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../../../app/store/rootReducer';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

import type { ApiErrorResponse } from './SubscriptionTypes';
import {
  subscriptionKeys,
  extractErrorMessage,
  formatValidationErrors,
} from './SubscriptionQueries';

import type {
  GetAvailableGatewaysResponse,
  InitiateGatewayPaymentParams,
  InitiateGatewayPaymentResponse,
  GetGatewayPaymentStatusResponse,
  GatewayPaymentStatusParams,
  MutationCallbacks,
} from './PaymentGatewayTypes';

/* -------------------------------------------------------------------------- */
/*                                 Selectors                                  */
/* -------------------------------------------------------------------------- */

const useActiveFacilityId = (): number | null =>
  useSelector((state: RootState) => state.activeContext.activeFacilityId);

/* -------------------------------------------------------------------------- */
/*                                Query Keys                                  */
/* -------------------------------------------------------------------------- */

export const paymentGatewayKeys = {
  all: ['payment_gateway'] as const,

  gateways: {
    list: () => [...paymentGatewayKeys.all, 'gateways', 'list'] as const,
  },

  status: {
    detail: (facilityId: number, reference: number | string) =>
      [...paymentGatewayKeys.all, 'status', facilityId, reference] as const,
  },
};

/* -------------------------------------------------------------------------- */
/*                          Internal tiny type helpers                         */
/* -------------------------------------------------------------------------- */

type ApiAxiosError = AxiosError<ApiErrorResponse>;

/** Normalizes backend status values without assuming exact union shape. */
const getPaymentStatus = (
  res: GetGatewayPaymentStatusResponse | undefined,
): string | undefined => res?.data?.status ?? undefined;

/* ========================================================================== */
/*                        GET /billing/gateways (public)                       */
/* ========================================================================== */

export const useGetAvailablePaymentGateways = (
  options?: Omit<
    UseQueryOptions<GetAvailableGatewaysResponse, ApiAxiosError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<GetAvailableGatewaysResponse, ApiAxiosError> => {
  return useQuery<GetAvailableGatewaysResponse, ApiAxiosError>({
    queryKey: paymentGatewayKeys.gateways.list(),
    queryFn: async () => {
      const res = await axiosInstance.get<GetAvailableGatewaysResponse>('/billing/gateways');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/* ========================================================================== */
/*   POST /facilities/{facility}/payments/gateway/{gateway}/initiate (auth)    */
/* ========================================================================== */

export const useInitiateGatewayPayment = (
  callbacks: MutationCallbacks<
    InitiateGatewayPaymentResponse,
    ApiAxiosError
  > = {},
): UseMutationResult<
  InitiateGatewayPaymentResponse,
  ApiAxiosError,
  InitiateGatewayPaymentParams
> => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = useActiveFacilityId();

  return useMutation<
    InitiateGatewayPaymentResponse,
    ApiAxiosError,
    InitiateGatewayPaymentParams
  >({
    mutationFn: async ({ gateway, data }) => {
      if (!facilityId) throw new Error('No active facility selected.');

      const res = await axiosInstance.post<InitiateGatewayPaymentResponse>(
        `/facilities/${facilityId}/payments/gateway/${gateway}/initiate`,
        data,
      );

      return res.data;
    },

    onSuccess: (data) => {
      const flow = data.data?.type;
      const fallback =
        flow === 'redirect'
          ? 'Payment initiated. Redirect to complete payment.'
          : 'Payment initiated. Approve the USSD prompt on your phone.';

      showToast('success', data.message || fallback, 7000);

      if (facilityId) {
        // The initiation typically creates a new PENDING payment record.
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.payments.facilityList(facilityId),
        });
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.subscriptions.facility(facilityId),
        });
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error: unknown) => {
      const axiosErr = error as ApiAxiosError;
      const base = extractErrorMessage(axiosErr, 'Failed to initiate gateway payment.');
      const details = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/* ========================================================================== */
/*  GET /facilities/{facility}/payments/gateway/{reference}/status (auth)      */
/* ========================================================================== */

export const useGetGatewayPaymentStatus = (
  params: GatewayPaymentStatusParams,
  options?: Omit<
    UseQueryOptions<GetGatewayPaymentStatusResponse, ApiAxiosError>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<GetGatewayPaymentStatusResponse, ApiAxiosError> => {
  const facilityId = useActiveFacilityId();
  const queryClient = useQueryClient();

  const reference = params.reference;

  const queryKey = useMemo(() => {
    return facilityId
      ? paymentGatewayKeys.status.detail(facilityId, reference)
      : paymentGatewayKeys.all;
  }, [facilityId, reference]);

  const query = useQuery<GetGatewayPaymentStatusResponse, ApiAxiosError>({
    queryKey,
    enabled: !!facilityId && !!reference,

    queryFn: async () => {
      const res = await axiosInstance.get<GetGatewayPaymentStatusResponse>(
        `/facilities/${facilityId}/payments/gateway/${reference}/status`,
      );
      return res.data;
    },

    /**
     * Poll while pending; stop automatically once approved/rejected/etc.
     * (React Query v5 supports function refetchInterval.)
     */
    refetchInterval: (q) => {
      const status = getPaymentStatus(q.state.data);
      return status === 'pending' ? 5_000 : false;
    },

    ...options,
  });

  /**
   * React Query v5: do side effects here.
   * Invalidate caches ONLY when the status transitions to "approved"
   * to avoid repeated invalidations on every refetch.
   */
  const prevStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!facilityId) return;

    const status = getPaymentStatus(query.data);
    const prev = prevStatusRef.current;

    if (status === 'approved' && prev !== 'approved') {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.subscriptions.facility(facilityId),
      });

      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.payments.facilityList(facilityId),
      });
    }

    prevStatusRef.current = status;
  }, [facilityId, query.data, queryClient]);

  return query;
};
