/**
 * ============================================================================
 * SUBSCRIPTION / BILLING REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL) — strictly matching routes/api.php:
 *
 * ── PUBLIC (no auth) ─────────────────────────────────────────────────────────
 *   GET  /billing/plans                                → useGetPlans
 *   GET  /billing/plans/{plan}                         → useGetPlan
 *
 * ── FACILITY-FACING (auth:sanctum) ──────────────────────────────────────────
 *   facilityId is injected from activeContextSlice.activeFacilityId
 *
 *   GET    /facilities/{facility}/subscription         → useGetFacilitySubscription
 *   POST   /facilities/{facility}/subscription         → useCreateSubscription
 *   DELETE /facilities/{facility}/subscription         → useCancelSubscription
 *   POST   /facilities/{facility}/subscription/schedule-change
 *   POST   /facilities/{facility}/subscription/upgrade-now
 *   DELETE /facilities/{facility}/subscription/scheduled-change
 *   GET    /facilities/{facility}/subscription/payment-quote
 *   GET    /facilities/{facility}/payments             → useGetFacilityPayments
 *   POST   /facilities/{facility}/payments             → useRecordPayment
 *   GET    /facilities/{facility}/payments/{payment}   → useGetFacilityPayment
 *
 * ── ADMIN (auth:sanctum + admin.access) ─────────────────────────────────────
 *   GET    /admin/billing/plans                        → useGetAdminPlans
 *   POST   /admin/billing/plans                        → useAdminCreatePlan
 *   GET    /admin/billing/plans/{plan}                 → useGetAdminPlan
 *   PUT    /admin/billing/plans/{plan}                 → useAdminUpdatePlan
 *   DELETE /admin/billing/plans/{plan}                 → useAdminDeletePlan
 *   GET    /admin/billing/subscriptions                → useGetAdminSubscriptions
 *   GET    /admin/billing/subscriptions/{sub}          → useGetAdminSubscription
 *   POST   /admin/billing/subscriptions/{sub}/activate → useAdminActivateSubscription
 *   POST   /admin/billing/subscriptions/{sub}/suspend  → useAdminSuspendSubscription
 *   POST   /admin/billing/subscriptions/{sub}/cancel   → useAdminCancelSubscription
 *   GET    /admin/billing/payments                     → useGetAdminPayments
 *   GET    /admin/billing/payments/{payment}           → useGetAdminPayment
 *   POST   /admin/billing/payments/{payment}/approve   → useAdminApprovePayment ✅
 *   POST   /admin/billing/payments/{payment}/reject    → useAdminRejectPayment  ❌
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../../../app/store/rootReducer';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

import type {
  AdminApprovePaymentParams,
  AdminCancelInvoiceParams,
  AdminDeletePlanParams,
  AdminDeletePlanResponse,
  AdminInvoiceFilters,
  AdminManageSubscriptionParams,
  AdminMarkInvoicePaidParams,
  AdminPaymentFilters,
  AdminPaymentResponse,
  AdminPlanFilters,
  AdminPlanResponse,
  AdminRejectPaymentParams,
  AdminSubscriptionFilters,
  AdminSubscriptionResponse,
  AdminUpdatePlanParams,
  ApiErrorResponse,
  CancelSubscriptionParams,
  CancelSubscriptionResponse,
  PaymentQuoteParams,
  PaymentQuoteResponse,
  CreateSubscriptionParams,
  ScheduleChangeResponse,
  ScheduleSubscriptionChangeParams,
  UpgradeNowParams,
  CreateSubscriptionResponse,
  FacilityInvoiceFilters,
  FacilityPaymentFilters,
  GetAdminInvoicesResponse,
  GetFacilityInvoicesResponse,
  GetFacilityBillingInvoicesResponse,
  GetFacilityReceiptsResponse,
  GetBillingInvoiceDocumentResponse,
  GetBillingReceiptDocumentResponse,
  GetInvoiceResponse,
  GetPaymentResponse,
  GetPlanResponse,
  GetSubscriptionResponse,
  MutationCallbacks,
  PaginatedPaymentsResponse,
  PaginatedPlansResponse,
  PaginatedSubscriptionsResponse,
  PlansCollectionResponse,
  RecordPaymentParams,
  RecordPaymentResponse,
  StorePlanRequest,
  UsageResponse,
} from './SubscriptionTypes';

/* -------------------------------------------------------------------------- */
/*                                Query Keys                                  */
/* -------------------------------------------------------------------------- */

export const subscriptionKeys = {
  // ── Plans ──────────────────────────────────────────────────────────────────
  plans: {
    all: ['plans'] as const,

    // Public (unauthenticated) plan keys
    public:       ()                          => [...subscriptionKeys.plans.all, 'public'] as const,
    publicList:   ()                          => [...subscriptionKeys.plans.public(), 'list'] as const,
    publicDetail: (planId: number | string)   => [...subscriptionKeys.plans.public(), 'detail', planId] as const,

    // Admin plan keys
    admin:        ()                          => [...subscriptionKeys.plans.all, 'admin'] as const,
    adminList:    (filters?: AdminPlanFilters) => [...subscriptionKeys.plans.admin(), 'list', filters ?? {}] as const,
    adminDetail:  (planId: number | string)   => [...subscriptionKeys.plans.admin(), 'detail', planId] as const,
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────
  subscriptions: {
    all: ['subscriptions'] as const,

    /** Facility's own subscription (facility-facing) */
    facility:    (facilityId: number)                     => [...subscriptionKeys.subscriptions.all, 'facility', facilityId] as const,

    // Admin subscription keys
    adminList:   (filters?: AdminSubscriptionFilters)     => [...subscriptionKeys.subscriptions.all, 'admin', 'list', filters ?? {}] as const,
    adminDetail: (subscriptionId: number | string)        => [...subscriptionKeys.subscriptions.all, 'admin', 'detail', subscriptionId] as const,
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  payments: {
    all: ['payments'] as const,

    // Facility-facing payment keys
    facility:    (facilityId: number)                          => [...subscriptionKeys.payments.all, 'facility', facilityId] as const,
    facilityList: (facilityId: number, filters?: FacilityPaymentFilters) => [...subscriptionKeys.payments.facility(facilityId), 'list', filters ?? {}] as const,
    facilityDetail: (facilityId: number, paymentId: number | string) => [...subscriptionKeys.payments.facility(facilityId), 'detail', paymentId] as const,

    // Admin payment keys
    adminList:   (filters?: AdminPaymentFilters)    => [...subscriptionKeys.payments.all, 'admin', 'list', filters ?? {}] as const,
    adminDetail: (paymentId: number | string)       => [...subscriptionKeys.payments.all, 'admin', 'detail', paymentId] as const,
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: {
    all: ['invoices'] as const,

    facility:      (facilityId: number)                            => [...subscriptionKeys.invoices.all, 'facility', facilityId] as const,
    facilityList:  (facilityId: number, filters?: FacilityInvoiceFilters) => [...subscriptionKeys.invoices.facility(facilityId), 'list', filters ?? {}] as const,
    facilityDetail:(facilityId: number, invoiceId: number)        => [...subscriptionKeys.invoices.facility(facilityId), 'detail', invoiceId] as const,

    adminList:     (filters?: AdminInvoiceFilters)                 => [...subscriptionKeys.invoices.all, 'admin', 'list', filters ?? {}] as const,
    adminDetail:   (invoiceId: number | string)                    => [...subscriptionKeys.invoices.all, 'admin', 'detail', invoiceId] as const,
  },

  billingDocuments: {
    all: ['billing-documents'] as const,
    facility: (facilityId: number) => [...subscriptionKeys.billingDocuments.all, facilityId] as const,
    invoices: (facilityId: number, filters?: FacilityInvoiceFilters) =>
      [...subscriptionKeys.billingDocuments.facility(facilityId), 'invoices', filters ?? {}] as const,
    invoiceDoc: (facilityId: number, invoiceId: number) =>
      [...subscriptionKeys.billingDocuments.facility(facilityId), 'invoice-doc', invoiceId] as const,
    receipts: (facilityId: number, filters?: Record<string, unknown>) =>
      [...subscriptionKeys.billingDocuments.facility(facilityId), 'receipts', filters ?? {}] as const,
    receiptDoc: (facilityId: number, paymentId: number) =>
      [...subscriptionKeys.billingDocuments.facility(facilityId), 'receipt-doc', paymentId] as const,
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) return '';
  return Object.entries(errors)
    .map(([field, messages]) => {
      const label = field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return `${label}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred.',
): string => error.response?.data?.message || error.message || fallback;

/* -------------------------------------------------------------------------- */
/*                                 Selectors                                  */
/* -------------------------------------------------------------------------- */

/**
 * Reads the currently active facility ID from Redux.
 * Used to inject `{facility}` into all facility-scoped route parameters.
 * Source: activeContextSlice.activeFacilityId
 */
const useActiveFacilityId = (): number | null =>
  useSelector((state: RootState) => state.activeContext.activeFacilityId);

/* ========================================================================== */
/*                     PUBLIC — PLAN QUERIES                                  */
/* ========================================================================== */

/**
 * GET /billing/plans
 *
 * Lists all **active** subscription plans. No authentication required.
 * Suitable for the pricing/plan-selection page shown before a facility subscribes.
 *
 * Response: non-paginated collection `{ data: Plan[] }`.
 */
export const useGetPlans = (
  options?: Omit<
    UseQueryOptions<PlansCollectionResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<PlansCollectionResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.plans.publicList(),
    queryFn: async () => {
      const res = await axiosInstance.get<PlansCollectionResponse>('/billing/plans');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // Plans rarely change — cache for 5 minutes
    ...options,
  });
};

/**
 * GET /billing/plans/{plan}
 *Facility Administrator
 * Retrieves a single active plan by its ID. No authentication required.
 * Disabled automatically when `planId` is falsy.
 */
export const useGetPlan = (
  planId: number | string,
  options?: Omit<
    UseQueryOptions<GetPlanResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<GetPlanResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.plans.publicDetail(planId),
    enabled: !!planId,
    queryFn: async () => {
      const res = await axiosInstance.get<GetPlanResponse>(`/billing/plans/${planId}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/* ========================================================================== */
/*         FACILITY-FACING — SUBSCRIPTION QUERIES & MUTATIONS                 */
/* ========================================================================== */

/**
 * GET /facilities/{facility}/subscription
 *Facility Administrator
 * Retrieves the current subscription for the active facility.
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 * Query is disabled when no facility is selected.
 */
export const useGetFacilitySubscription = (
  options?: Omit<
    UseQueryOptions<GetSubscriptionResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  const facilityId = useActiveFacilityId();
  const { enabled: enabledOption = true, ...restOptions } = options ?? {};

  return useQuery<GetSubscriptionResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityId
      ? subscriptionKeys.subscriptions.facility(facilityId)
      : subscriptionKeys.subscriptions.all,
    queryFn: async () => {
      const res = await axiosInstance.get<GetSubscriptionResponse>(
        `/facilities/${facilityId}/subscription`,
      );
      return res.data;
    },
    ...restOptions,
    enabled: Boolean(facilityId) && enabledOption,
  });
};

/**
 * POST /facilities/{facility}/subscription
 *
 * Creates a new subscription for the active facility.
 * Subscription enters **trial** status immediately.
 * A payment must be submitted and admin-approved to transition to **active**.
 *
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 *Facility Administrator
 * @example
 * const { mutate } = useCreateSubscription({ onSuccess: () => navigate('/billing') });
 * mutate({ data: { plan_id: 2 } });
 */
export const useCreateSubscription = (
  callbacks: MutationCallbacks<
    CreateSubscriptionResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<
    CreateSubscriptionResponse,
    AxiosError<ApiErrorResponse>,
    CreateSubscriptionParams,
    { snapshot: unknown } | undefined
  >({
    mutationFn: async ({ data }) => {
      if (!facilityId) throw new Error('No active facility selected.');
      const res = await axiosInstance.post<CreateSubscriptionResponse>(
        `/facilities/${facilityId}/subscription`,
        data,
      );
      return res.data;
    },

    onMutate: async () => {
      if (!facilityId) return;
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      const snapshot = queryClient.getQueryData(subscriptionKeys.subscriptions.facility(facilityId));
      return { snapshot };
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Subscription created successfully!', 6000);
      if (facilityId) {
        queryClient.setQueryData(subscriptionKeys.subscriptions.facility(facilityId), data);
      }
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>, _vars, context) => {
      if (facilityId && context?.snapshot) {
        queryClient.setQueryData(subscriptionKeys.subscriptions.facility(facilityId), context.snapshot);
      }
      const base     = extractErrorMessage(error, 'Failed to create subscription.');
      const details  = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },

    onSettled: () => {
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      }
    },
  });
};

/**
 * DELETE /facilities/{facility}/subscription
 *
 * Cancels the active facility's current subscription.
 * An optional `reason` can be provided in the request body.
 *
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 *Facility Administrator
 * @example
 * const { mutate } = useCancelSubscription();
 * mutate({ data: { reason: 'Switching providers' } });
 */
export const useCancelSubscription = (
  callbacks: MutationCallbacks<
    CancelSubscriptionResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<
    CancelSubscriptionResponse,
    AxiosError<ApiErrorResponse>,
    CancelSubscriptionParams,
    { snapshot: unknown } | undefined
  >({
    mutationFn: async ({ data = {} }) => {
      if (!facilityId) throw new Error('No active facility selected.');
      const res = await axiosInstance.delete<CancelSubscriptionResponse>(
        `/facilities/${facilityId}/subscription`,
        { data },
      );
      return res.data;
    },

    onMutate: async () => {
      if (!facilityId) return;
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      const snapshot = queryClient.getQueryData(subscriptionKeys.subscriptions.facility(facilityId));
      return { snapshot };
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Cancellation scheduled successfully.', 6000);
      if (facilityId) {
        queryClient.setQueryData(subscriptionKeys.subscriptions.facility(facilityId), data);
      }
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>, _vars, context) => {
      if (facilityId && context?.snapshot) {
        queryClient.setQueryData(subscriptionKeys.subscriptions.facility(facilityId), context.snapshot);
      }
      const base     = extractErrorMessage(error, 'Failed to cancel subscription.');
      const details  = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },

    onSettled: () => {
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      }
    },
  });
};

/**
 * GET /facilities/{facility}/subscription/payment-quote
 */
export const useGetPaymentQuote = (
  params: PaymentQuoteParams | null,
  options?: Omit<
    UseQueryOptions<PaymentQuoteResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<PaymentQuoteResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityId
      ? [...subscriptionKeys.subscriptions.facility(facilityId), 'payment-quote', params ?? {}]
      : subscriptionKeys.subscriptions.all,
    enabled: Boolean(facilityId) && Boolean(params?.intent),
    queryFn: async () => {
      const res = await axiosInstance.get<PaymentQuoteResponse>(
        `/facilities/${facilityId}/subscription/payment-quote`,
        { params },
      );
      return res.data;
    },
    staleTime: 60 * 1000,
    ...options,
  });
};

/**
 * POST /facilities/{facility}/subscription/schedule-change
 */
export const useScheduleSubscriptionChange = (
  callbacks: MutationCallbacks<ScheduleChangeResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<
    ScheduleChangeResponse,
    AxiosError<ApiErrorResponse>,
    ScheduleSubscriptionChangeParams
  >({
    mutationFn: async ({ data }) => {
      if (!facilityId) throw new Error('No active facility selected.');
      const res = await axiosInstance.post<ScheduleChangeResponse>(
        `/facilities/${facilityId}/subscription/schedule-change`,
        data,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Plan change scheduled.', 6000);
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      }
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base    = extractErrorMessage(error, 'Failed to schedule plan change.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * POST /facilities/{facility}/subscription/upgrade-now
 */
export const useUpgradeNow = (
  callbacks: MutationCallbacks<ScheduleChangeResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<
    ScheduleChangeResponse,
    AxiosError<ApiErrorResponse>,
    UpgradeNowParams
  >({
    mutationFn: async ({ data }) => {
      if (!facilityId) throw new Error('No active facility selected.');
      const res = await axiosInstance.post<ScheduleChangeResponse>(
        `/facilities/${facilityId}/subscription/upgrade-now`,
        data,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Upgrade quote ready.', 6000);
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      }
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base    = extractErrorMessage(error, 'Failed to prepare upgrade.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * DELETE /facilities/{facility}/subscription/scheduled-change
 */
export const useCancelScheduledChange = (
  callbacks: MutationCallbacks<CancelSubscriptionResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<CancelSubscriptionResponse, AxiosError<ApiErrorResponse>, void>({
    mutationFn: async () => {
      if (!facilityId) throw new Error('No active facility selected.');
      const res = await axiosInstance.delete<CancelSubscriptionResponse>(
        `/facilities/${facilityId}/subscription/scheduled-change`,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Scheduled change cancelled.', 6000);
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.facility(facilityId) });
      }
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base    = extractErrorMessage(error, 'Failed to cancel scheduled change.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/* ========================================================================== */
/*           FACILITY-FACING — PAYMENT QUERIES & MUTATIONS                    */
/* ========================================================================== */

/**
 * GET /facilities/{facility}/payments
 *
 * Lists all payments for the active facility. Supports optional status / type
 * filters and pagination via `per_page`.
 *
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 *Platform Administrator
 * @example
 * const { data } = useGetFacilityPayments({ status: 'pending', per_page: 10 });
 */
export const useGetFacilityPayments = (
  filters?: FacilityPaymentFilters,
  options?: Omit<
    UseQueryOptions<PaginatedPaymentsResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<PaginatedPaymentsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityId
      ? subscriptionKeys.payments.facilityList(facilityId, filters)
      : subscriptionKeys.payments.all,
    enabled: !!facilityId,
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedPaymentsResponse>(
        `/facilities/${facilityId}/payments`,
        { params: filters },
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * GET /facilities/{facility}/payments/{payment}
 *
 * Retrieves a single payment for the active facility.
 * Disabled when either `facilityId` or `paymentId` is falsy.
 *Facility Administrator
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 */
export const useGetFacilityPayment = (
  paymentId: number | string,
  options?: Omit<
    UseQueryOptions<GetPaymentResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetPaymentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityId
      ? subscriptionKeys.payments.facilityDetail(facilityId, paymentId)
      : [...subscriptionKeys.payments.all, 'detail', paymentId],
    enabled: !!facilityId && !!paymentId,
    queryFn: async () => {
      const res = await axiosInstance.get<GetPaymentResponse>(
        `/facilities/${facilityId}/payments/${paymentId}`,
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * POST /facilities/{facility}/payments
 *
 * Records a manual payment for the active facility's current subscription.
 * Sent as `multipart/form-data` to support an optional receipt file upload.
 * Payment enters **pending** status; an admin must approve it to activate the subscription.
 *
 * **facilityId is injected from `activeContextSlice.activeFacilityId`.**
 *
 * @example
 * const { mutate } = useRecordPayment();
 * Facility Administrator
 * mutate({
 *   data: { amount: 440000, currency: 'UGX', method: 'mobile_money',
 *           payment_type: 'subscription', paid_at: '2024-03-10',
 *           transaction_reference: 'MTN-REF-XXXX' },
 *   receipt: fileInputRef.current.files[0],
 * });
 */
export const useRecordPayment = (
  callbacks: MutationCallbacks<
    RecordPaymentResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();
  const facilityId    = useActiveFacilityId();

  return useMutation<
    RecordPaymentResponse,
    AxiosError<ApiErrorResponse>,
    RecordPaymentParams
  >({
    mutationFn: async ({ data, receipt }) => {
      if (!facilityId) throw new Error('No active facility selected.');

      // Build FormData — required because `receipt` is a File upload.
      const form = new FormData();
      form.append('amount',       String(data.amount));
      form.append('currency',     data.currency);
      form.append('method',       data.method as string);
      form.append('payment_type', data.payment_type as string);
      form.append('paid_at',      data.paid_at);

      if (data.transaction_reference) {
        form.append('transaction_reference', data.transaction_reference);
      }
      if (data.receipt_notes) {
        form.append('receipt_notes', data.receipt_notes);
      }
      if (receipt) {
        // Field name must match StorePaymentRequest: 'receipt'
        form.append('receipt', receipt);
      }

      // IMPORTANT: Do NOT set Content-Type manually.
      // axios derives the correct multipart/form-data boundary automatically.
      const res = await axiosInstance.post<RecordPaymentResponse>(
        `/facilities/${facilityId}/payments`,
        form,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Payment recorded. Awaiting admin approval.', 6000);

      if (facilityId) {
        // Refresh payment list so new pending entry appears
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.payments.facilityList(facilityId),
        });
        // Refresh subscription — UI may show "payment submitted" banner
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.subscriptions.facility(facilityId),
        });
        // Refresh invoice list — new invoice was created
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.billingDocuments.facility(facilityId),
        });
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to record payment.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/* ========================================================================== */
/*                  ADMIN — PLAN QUERIES & MUTATIONS                          */
/* ========================================================================== */

/**
 * GET /admin/billing/plans
 *Platform Administrator
 * Admin: Lists all plans (including inactive), paginated.
 * Supports `is_active`, `search`, and `per_page` filters.
 */
export const useGetAdminPlans = (
  filters?: AdminPlanFilters,
  options?: Omit<
    UseQueryOptions<PaginatedPlansResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<PaginatedPlansResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.plans.adminList(filters),
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedPlansResponse>('/admin/billing/plans', {
        params: filters,
      });
      return res.data;
    },
    ...options,
  });
};

/**
 * GET /admin/billing/plans/{plan}
 *Platform Administrator
 * Admin: Retrieves a single plan by ID (includes inactive plans).
 */
export const useGetAdminPlan = (
  planId: number | string,
  options?: Omit<
    UseQueryOptions<GetPlanResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<GetPlanResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.plans.adminDetail(planId),
    enabled: !!planId,
    queryFn: async () => {
      const res = await axiosInstance.get<GetPlanResponse>(`/admin/billing/plans/${planId}`);
      return res.data;
    },
    ...options,
  });
};

/**
 * POST /admin/billing/plans
 *Platform Administrator
 * Admin: Creates a new subscription plan.
 * Invalidates both admin and public plan lists on success.
 */
export const useAdminCreatePlan = (
  callbacks: MutationCallbacks<AdminPlanResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminPlanResponse,
    AxiosError<ApiErrorResponse>,
    { data: StorePlanRequest }
  >({
    mutationFn: async ({ data }) => {
      const res = await axiosInstance.post<AdminPlanResponse>('/admin/billing/plans', data);
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Plan created successfully!', 6000);

      // Refresh both admin list and public pricing page
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.admin() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.publicList() });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to create plan.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/**
 * PUT /admin/billing/plans/{plan}
 *
 * Platform Administrator: Updates an existing plan.
 * Patches both admin and public caches, then invalidates lists.
 */
export const useAdminUpdatePlan = (
  callbacks: MutationCallbacks<AdminPlanResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminPlanResponse,
    AxiosError<ApiErrorResponse>,
    AdminUpdatePlanParams
  >({
    mutationFn: async ({ planId, data }) => {
      const res = await axiosInstance.put<AdminPlanResponse>(
        `/admin/billing/plans/${planId}`,
        data,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Plan updated successfully!', 6000);

      // Patch individual caches immediately for snappy UX
      queryClient.setQueryData(subscriptionKeys.plans.adminDetail(vars.planId), data);
      queryClient.setQueryData(subscriptionKeys.plans.publicDetail(vars.planId), data);

      // Invalidate list queries to sync sort order / filter results
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.admin() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.publicList() });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to update plan.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/**
 * DELETE /admin/billing/plans/{plan}
 *
 * Platform Administrator: Deletes a plan.
 * The backend rejects deletion when any non-cancelled subscription references this plan.
 * On success, removes the plan from all relevant caches.
 */
export const useAdminDeletePlan = (
  callbacks: MutationCallbacks<
    AdminDeletePlanResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminDeletePlanResponse,
    AxiosError<ApiErrorResponse>,
    AdminDeletePlanParams
  >({
    mutationFn: async ({ planId }) => {
      const res = await axiosInstance.delete<AdminDeletePlanResponse>(
        `/admin/billing/plans/${planId}`,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Plan deleted successfully.', 6000);

      // Remove stale detail entries immediately
      queryClient.removeQueries({ queryKey: subscriptionKeys.plans.adminDetail(vars.planId) });
      queryClient.removeQueries({ queryKey: subscriptionKeys.plans.publicDetail(vars.planId) });

      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.admin() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.plans.publicList() });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to delete plan.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/* ========================================================================== */
/*          ADMIN — SUBSCRIPTION QUERIES & MUTATIONS                          */
/* ========================================================================== */

/**
 * GET /admin/billing/subscriptions
 *
 * Platform Administrator: Lists all subscriptions across all facilities, paginated.
 * Filters: status, facility_id, plan_id, per_page.
 */
export const useGetAdminSubscriptions = (
  filters?: AdminSubscriptionFilters,
  options?: Omit<
    UseQueryOptions<PaginatedSubscriptionsResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<PaginatedSubscriptionsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.subscriptions.adminList(filters),
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedSubscriptionsResponse>(
        '/admin/billing/subscriptions',
        { params: filters },
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * GET /admin/billing/subscriptions/{subscription}
 *
 * Platform Administrator: Retrieves a single subscription by ID with full relation data
 * (facility, plan, payments, approvedBy).
 */
export const useGetAdminSubscription = (
  subscriptionId: number | string,
  options?: Omit<
    UseQueryOptions<AdminSubscriptionResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<AdminSubscriptionResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.subscriptions.adminDetail(subscriptionId),
    enabled: !!subscriptionId,
    queryFn: async () => {
      const res = await axiosInstance.get<AdminSubscriptionResponse>(
        `/admin/billing/subscriptions/${subscriptionId}`,
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * POST /admin/billing/subscriptions/{subscription}/activate
 *
 * Platform Administrator: Manually activates a subscription.
 * Used for edge cases where payment was verified offline (e.g. cash paid directly).
 * Creates a synthetic approved payment record on the backend for the audit trail.
 */
export const useAdminActivateSubscription = (
  callbacks: MutationCallbacks<AdminSubscriptionResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminSubscriptionResponse,
    AxiosError<ApiErrorResponse>,
    AdminManageSubscriptionParams
  >({
    mutationFn: async ({ subscriptionId, data = {} }) => {
      const res = await axiosInstance.post<AdminSubscriptionResponse>(
        `/admin/billing/subscriptions/${subscriptionId}/activate`,
        data,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Subscription activated successfully.', 6000);

      queryClient.setQueryData(
        subscriptionKeys.subscriptions.adminDetail(vars.subscriptionId),
        data,
      );
      // Broad invalidation: list views, payment queues all need refreshing
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.payments.all });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to activate subscription.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/**
 * POST /admin/billing/subscriptions/{subscription}/suspend
 *
 * Platform Administrator: Manually suspends a facility's subscription, blocking API access (402).
 */
export const useAdminSuspendSubscription = (
  callbacks: MutationCallbacks<AdminSubscriptionResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminSubscriptionResponse,
    AxiosError<ApiErrorResponse>,
    AdminManageSubscriptionParams
  >({
    mutationFn: async ({ subscriptionId, data = {} }) => {
      const res = await axiosInstance.post<AdminSubscriptionResponse>(
        `/admin/billing/subscriptions/${subscriptionId}/suspend`,
        data,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Subscription suspended.', 6000);

      queryClient.setQueryData(
        subscriptionKeys.subscriptions.adminDetail(vars.subscriptionId),
        data,
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.all });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to suspend subscription.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/**
 * POST /admin/billing/subscriptions/{subscription}/cancel
 *
 * Platform Administrator & Facility Administrator: Administratively cancels a subscription. An optional `reason` is appended
 * to the subscription's notes on the backend.
 */
export const useAdminCancelSubscription = (
  callbacks: MutationCallbacks<AdminSubscriptionResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminSubscriptionResponse,
    AxiosError<ApiErrorResponse>,
    AdminManageSubscriptionParams
  >({
    mutationFn: async ({ subscriptionId, data = {} }) => {
      const res = await axiosInstance.post<AdminSubscriptionResponse>(
        `/admin/billing/subscriptions/${subscriptionId}/cancel`,
        data,
      );
      return res.data;
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Subscription cancelled.', 6000);

      queryClient.setQueryData(
        subscriptionKeys.subscriptions.adminDetail(vars.subscriptionId),
        data,
      );
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.all });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to cancel subscription.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/* ========================================================================== */
/*                 ADMIN — PAYMENT QUERIES & MUTATIONS                        */
/* ========================================================================== */

/**
 * GET /admin/billing/payments
 *
 * Platform Administrator: Lists all payments across all facilities, paginated.
 * Pass `{ status: 'pending' }` to load the **approval queue**.
 * Filters: status, facility_id, payment_type, method, per_page.
 */
export const useGetAdminPayments = (
  filters?: AdminPaymentFilters,
  options?: Omit<
    UseQueryOptions<PaginatedPaymentsResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<PaginatedPaymentsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.payments.adminList(filters),
    queryFn: async () => {
      const res = await axiosInstance.get<PaginatedPaymentsResponse>(
        '/admin/billing/payments',
        { params: filters },
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * GET /admin/billing/payments/{payment}
 *
 * Platform Administrator: Retrieves a single payment with full relation data including
 * receipt URL, approvedBy staff, and linked subscription/plan.
 */
export const useGetAdminPayment = (
  paymentId: number | string,
  options?: Omit<
    UseQueryOptions<AdminPaymentResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<AdminPaymentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.payments.adminDetail(paymentId),
    enabled: !!paymentId,
    queryFn: async () => {
      const res = await axiosInstance.get<AdminPaymentResponse>(
        `/admin/billing/payments/${paymentId}`,
      );
      return res.data;
    },
    ...options,
  });
};

/**
 * POST /admin/billing/payments/{payment}/approve
 *
 * ✅ THE PRIMARY MANUAL BILLING APPROVAL ENDPOINT.
 *
 * Confirms the facility's payment receipt / evidence.
 * The backend automatically triggers the correct subscription transition:
 *   - PaymentType.ONBOARDING   → SubscriptionService::activateSubscription()
 *   - PaymentType.SUBSCRIPTION → SubscriptionService::activateSubscription()
 *   - PaymentType.RENEWAL      → SubscriptionService::renewSubscription()
 *
 * On success, this hook invalidates **all subscription and payment caches**
 * so every affected view refreshes automatically.
 *Platform Administrator
 * @example
 * const { mutate } = useAdminApprovePayment({
 *   onSuccess: () => navigate('/admin/billing/payments'),
 * });
 * mutate({ paymentId: 7, data: { notes: 'MTN receipt verified.' } });
 */
export const useAdminApprovePayment = (
  callbacks: MutationCallbacks<AdminPaymentResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminPaymentResponse,
    AxiosError<ApiErrorResponse>,
    AdminApprovePaymentParams,
    { snapshot: unknown } | undefined
  >({
    mutationFn: async ({ paymentId, data = {} }) => {
      const res = await axiosInstance.post<AdminPaymentResponse>(
        `/admin/billing/payments/${paymentId}/approve`,
        data,
      );
      return res.data;
    },

    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.payments.all });
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.subscriptions.all });

      const snapshot = {
        payments: queryClient.getQueriesData({ queryKey: subscriptionKeys.payments.all }),
        subscriptions: queryClient.getQueriesData({ queryKey: subscriptionKeys.subscriptions.all }),
      };

      queryClient.setQueriesData({ queryKey: subscriptionKeys.payments.all }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in (old as Record<string, unknown>))) return old;
        const data = (old as Record<string, unknown>).data;
        if (!Array.isArray(data)) return old;
        return {
          ...(old as Record<string, unknown>),
          data: data.map((p: Record<string, unknown>) =>
            p.id === vars.paymentId ? { ...p, status: 'approved', status_label: 'Approved' } : p
          ),
        };
      });

      return { snapshot };
    },

    onSuccess: (data, vars) => {
      showToast(
        'success',
        data.message || 'Payment approved. Facility subscription has been activated.',
        7000,
      );

      queryClient.setQueryData(subscriptionKeys.payments.adminDetail(vars.paymentId), data);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.subscriptions.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.billingDocuments.all });

      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>, _vars, context) => {
      if (context?.snapshot) {
        const snap = context.snapshot as { payments: [unknown, unknown][]; subscriptions: [unknown, unknown][] };
        snap.payments.forEach(([key, data]) => queryClient.setQueryData(key as readonly unknown[], data));
        snap.subscriptions.forEach(([key, data]) => queryClient.setQueryData(key as readonly unknown[], data));
      }
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base     = extractErrorMessage(axiosErr, 'Failed to approve payment.');
      const details  = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

/**
 * POST /admin/billing/payments/{payment}/reject
 *
 * ❌ Rejects a pending payment with a mandatory reason string.
 * The subscription remains in its current status — no transition is triggered.
 * The backend requires `reason` to be at least 10 characters.
 *Platform Administrator
 * @example
 * const { mutate } = useAdminRejectPayment();
 * mutate({
 *   paymentId: 7,
 *   data: { reason: 'Transaction reference could not be verified with MTN.' },
 * });
 */
export const useAdminRejectPayment = (
  callbacks: MutationCallbacks<AdminPaymentResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    AdminPaymentResponse,
    AxiosError<ApiErrorResponse>,
    AdminRejectPaymentParams,
    { snapshot: unknown } | undefined
  >({
    mutationFn: async ({ paymentId, data }) => {
      const res = await axiosInstance.post<AdminPaymentResponse>(
        `/admin/billing/payments/${paymentId}/reject`,
        data,
      );
      return res.data;
    },

    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.payments.all });
      const snapshot = queryClient.getQueriesData({ queryKey: subscriptionKeys.payments.all });

      queryClient.setQueriesData({ queryKey: subscriptionKeys.payments.all }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('data' in (old as Record<string, unknown>))) return old;
        const data = (old as Record<string, unknown>).data;
        if (!Array.isArray(data)) return old;
        return {
          ...(old as Record<string, unknown>),
          data: data.map((p: Record<string, unknown>) =>
            p.id === vars.paymentId ? { ...p, status: 'rejected', status_label: 'Rejected' } : p
          ),
        };
      });

      return { snapshot };
    },

    onSuccess: (data, vars) => {
      showToast('success', data.message || 'Payment rejected. Facility has been notified.', 6000);
      queryClient.setQueryData(subscriptionKeys.payments.adminDetail(vars.paymentId), data);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.billingDocuments.all });
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>, _vars, context) => {
      if (context?.snapshot) {
        const snap = context.snapshot as [unknown, unknown][];
        snap.forEach(([key, data]) => queryClient.setQueryData(key as readonly unknown[], data));
      }
      const base     = extractErrorMessage(error, 'Failed to reject payment.');
      const details  = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/* ========================================================================== */
/*                         INVOICE QUERIES                                    */
/* ========================================================================== */

/**
 * GET /facilities/{facility}/invoices
 *
 * Lists all invoices for the currently active facility.
 *
 * @example
 * const { data, isLoading } = useGetFacilityInvoices({ status: 'unpaid' });
 */
export const useGetFacilityInvoices = (filters?: FacilityInvoiceFilters) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetFacilityInvoicesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.invoices.facilityList(facilityId!, filters),
    queryFn: async () => {
      const res = await axiosInstance.get<GetFacilityInvoicesResponse>(
        `/facilities/${facilityId}/invoices`,
        { params: filters },
      );
      return res.data;
    },
    enabled: !!facilityId,
  });
};

/**
 * GET /facilities/{facility}/invoices/{invoice}
 *
 * Fetches a single invoice detail for the facility.
 */
export const useGetFacilityInvoice = (invoiceId: number) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetInvoiceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.invoices.facilityDetail(facilityId!, invoiceId),
    queryFn: async () => {
      const res = await axiosInstance.get<GetInvoiceResponse>(
        `/facilities/${facilityId}/invoices/${invoiceId}`,
      );
      return res.data;
    },
    enabled: !!facilityId && !!invoiceId,
  });
};

/**
 * GET /admin/billing/invoices
 *
 * Lists all invoices across all facilities (admin only).
 */
export const useGetAdminInvoices = (filters?: AdminInvoiceFilters) => {
  return useQuery<GetAdminInvoicesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.invoices.adminList(filters),
    queryFn: async () => {
      const res = await axiosInstance.get<GetAdminInvoicesResponse>(
        '/admin/billing/invoices',
        { params: filters },
      );
      return res.data;
    },
  });
};

/**
 * GET /admin/billing/invoices/{invoice}
 *
 * Fetches a single invoice detail for admin view.
 */
export const useGetAdminInvoice = (invoiceId: number) => {
  return useQuery<GetInvoiceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.invoices.adminDetail(invoiceId),
    queryFn: async () => {
      const res = await axiosInstance.get<GetInvoiceResponse>(
        `/admin/billing/invoices/${invoiceId}`,
      );
      return res.data;
    },
    enabled: !!invoiceId,
  });
};

/**
 * POST /admin/billing/invoices/{invoice}/mark-paid
 *
 * Admin marks an invoice as paid (full or partial).
 */
export const useAdminMarkInvoicePaid = (
  callbacks: MutationCallbacks<GetInvoiceResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    GetInvoiceResponse,
    AxiosError<ApiErrorResponse>,
    AdminMarkInvoicePaidParams
  >({
    mutationFn: async ({ invoiceId, data }) => {
      const res = await axiosInstance.post<GetInvoiceResponse>(
        `/admin/billing/invoices/${invoiceId}/mark-paid`,
        data,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Invoice marked as paid.', 6000);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.invoices.all });
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base     = extractErrorMessage(error, 'Failed to mark invoice as paid.');
      const details  = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * POST /admin/billing/invoices/{invoice}/cancel
 *
 * Admin cancels an unpaid invoice.
 */
export const useAdminCancelInvoice = (
  callbacks: MutationCallbacks<GetInvoiceResponse, AxiosError<ApiErrorResponse>> = {},
) => {
  const { showToast } = useToast();
  const queryClient   = useQueryClient();

  return useMutation<
    GetInvoiceResponse,
    AxiosError<ApiErrorResponse>,
    AdminCancelInvoiceParams
  >({
    mutationFn: async ({ invoiceId }) => {
      const res = await axiosInstance.post<GetInvoiceResponse>(
        `/admin/billing/invoices/${invoiceId}/cancel`,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Invoice cancelled.', 6000);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.invoices.all });
      callbacks.onSuccess?.(data);
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      const base     = extractErrorMessage(error, 'Failed to cancel invoice.');
      const details  = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};

/* ========================================================================== */
/*                    BILLING DOCUMENT QUERIES                                */
/* ========================================================================== */

export const useGetFacilityBillingInvoices = (filters?: FacilityInvoiceFilters) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetFacilityBillingInvoicesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.billingDocuments.invoices(facilityId!, filters),
    queryFn: async () => {
      const res = await axiosInstance.get<GetFacilityBillingInvoicesResponse>(
        `/facilities/${facilityId}/billing-documents/invoices`,
        { params: { ...filters, payable_only: true } },
      );
      return res.data;
    },
    enabled: !!facilityId,
  });
};

export const useGetBillingInvoiceDocument = (invoiceId: number | null) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetBillingInvoiceDocumentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.billingDocuments.invoiceDoc(facilityId!, invoiceId ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<GetBillingInvoiceDocumentResponse>(
        `/facilities/${facilityId}/billing-documents/invoices/${invoiceId}`,
      );
      return res.data;
    },
    enabled: !!facilityId && !!invoiceId,
  });
};

export const useGetFacilityReceipts = (filters?: { per_page?: number }) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetFacilityReceiptsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.billingDocuments.receipts(facilityId!, filters),
    queryFn: async () => {
      const res = await axiosInstance.get<GetFacilityReceiptsResponse>(
        `/facilities/${facilityId}/billing-documents/receipts`,
        { params: filters },
      );
      return res.data;
    },
    enabled: !!facilityId,
  });
};

export const useGetBillingReceiptDocument = (paymentId: number | null) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetBillingReceiptDocumentResponse, AxiosError<ApiErrorResponse>>({
    queryKey: subscriptionKeys.billingDocuments.receiptDoc(facilityId!, paymentId ?? 0),
    queryFn: async () => {
      const res = await axiosInstance.get<GetBillingReceiptDocumentResponse>(
        `/facilities/${facilityId}/billing-documents/receipts/${paymentId}`,
      );
      return res.data;
    },
    enabled: !!facilityId && !!paymentId,
  });
};

/* ========================================================================== */
/*                          USAGE QUERIES                                     */
/* ========================================================================== */

/**
 * GET /facilities/{facility}/usage
 *
 * Returns current usage counts for the active facility:
 * - staff (active + on_leave assignments + pending invitations)
 * - departments (active)
 * - visits (visits created in the current calendar month)
 * - limits (from accessible subscription plan, when present)
 */
export const useGetFacilityUsage = () => {
  const facilityId = useActiveFacilityId();

  return useQuery<UsageResponse, AxiosError<ApiErrorResponse>>({
    queryKey: [...subscriptionKeys.subscriptions.facility(facilityId!), 'usage'],
    queryFn: async () => {
      const res = await axiosInstance.get<UsageResponse>(
        `/facilities/${facilityId}/usage`,
      );
      return res.data;
    },
    enabled: !!facilityId,
  });
};
