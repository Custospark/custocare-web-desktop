/**
 * ============================================================================
 * SUBSCRIPTION / BILLING TYPE DEFINITIONS
 * ============================================================================
 *
 * All TypeScript types for the Custocare Facility-Based Subscription Billing System.
 * Covers:
 *   - Plans          (public read-only + admin CRUD)
 *   - Subscriptions  (facility-facing + admin management)
 *   - Payments       (facility manual submission + admin approve / reject)
 *
 * Endpoint groups backed by routes/api.php:
 *   PUBLIC   → GET  /billing/plans[/{plan}]
 *   FACILITY → /facilities/{facility}/subscription[, /payments[/{payment}]]
 *   ADMIN    → /admin/billing/plans | /subscriptions | /payments
 *
 * Design rules:
 *   - Enum values mirror PHP enum backing strings exactly.
 *   - Resource shapes mirror Laravel API Resources (PlanResource, SubscriptionResource,
 *     PaymentResource) field-for-field.
 *   - Request shapes mirror validated FormRequest rules.
 *   - All nullable backend columns are typed `string | null`, `number | null`, etc.
 */

// ============================================================================
// ENUMS  (mirror app/Enums/Billing/*)
// ============================================================================

/**
 * Subscription lifecycle statuses.
 * trial → active → past_due → suspended | cancelled
 *
 * Mirrors: app/Enums/Billing/SubscriptionStatus.php
 */
export enum SubscriptionStatus {
  TRIAL     = 'trial',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

/**
 * Payment record statuses.
 * pending → approved | rejected | refunded
 *
 * Mirrors: app/Enums/Billing/PaymentStatus.php
 */
export enum PaymentStatus {
  PENDING  = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

/**
 * Supported payment channels.
 * GATEWAY is stubbed for future MTN MoMo / Flutterwave integration.
 *
 * Mirrors: app/Enums/Billing/PaymentMethod.php
 */
export enum PaymentMethod {
  MOBILE_MONEY  = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CASH          = 'cash',
  GATEWAY       = 'gateway',   // reserved — not yet active on the backend
}

/**
 * Payment classification — what a payment covers.
 *
 * Mirrors: app/Enums/Billing/PaymentType.php
 */
export enum PaymentType {
  ONBOARDING   = 'onboarding',   // one-time setup fee
  SUBSCRIPTION = 'subscription', // initial subscription payment
  RENEWAL      = 'renewal',      // monthly renewal
}

/**
 * Supported billing cycles.
 *
 * Mirrors: app/Enums/Billing/BillingCycle.php
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
}

// ============================================================================
// PLAN RESOURCE SHAPES  (mirror app/Http/Resources/Billing/PlanResource.php)
// ============================================================================

/** Pricing block within PlanResource. */
export interface PlanPricing {
  usd: number;
  ugx: number;
  billing_cycle: BillingCycle | string;
}

/** Onboarding-fee block within PlanResource. */
export interface PlanOnboardingFee {
  usd: number;
  ugx: number;
  /** True when either currency fee is > 0. */
  applicable: boolean;
}

/** Capacity-limits block within PlanResource. */
export interface PlanLimits {
  max_staff: number | null;              // null = unlimited
  max_departments: number | null;
  max_patients_per_month: number | null;
}

/**
 * Full plan shape as returned by PlanResource.
 *
 * @example
 * const { data } = useGetPlan(2);
 * console.log(data?.data.pricing.ugx); // 440000
 */
export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  pricing: PlanPricing;
  onboarding_fee: PlanOnboardingFee;
  trial_days: number;
  limits: PlanLimits;
  /** Module + addon flags aligned with `PlanFeatures` on the backend. */
  features: Record<string, boolean | unknown>;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
}

// ============================================================================
// PAYMENT RESOURCE SHAPE  (mirror app/Http/Resources/Billing/PaymentResource.php)
// ============================================================================

/** Minimal approved-by block embedded in PaymentResource. */
export interface PaymentApprovedBy {
  user_id: number;
}

/**
 * Full payment shape as returned by PaymentResource.
 *
 * @example
 * const { data } = useGetFacilityPayment(12);
 * console.log(data?.data.status);         // 'pending'
 * console.log(data?.data.receipt_url);    // 'https://...'
 */
export interface Payment {
  id: number;
  facility_id: number;
  subscription_id: number;
  amount: number;
  currency: string;             // ISO-4217, e.g. 'UGX'
  method: PaymentMethod | string;
  method_label: string;         // e.g. 'Mobile Money'
  payment_type: PaymentType | string;
  payment_type_label: string;   // e.g. 'Subscription'
  status: PaymentStatus | string;
  status_label: string;         // e.g. 'Pending Review'
  transaction_reference: string | null;
  receipt_url: string | null;   // Public URL to uploaded receipt (if any)
  receipt_download_url?: string | null; // Auth-protected download endpoint
  receipt_path?: string | null;
  receipt_notes: string | null;
  paid_at: string | null;       // ISO-8601 datetime
  approved_at: string | null;
  approved_by: PaymentApprovedBy | null;
  rejection_reason: string | null;
  /** Gateway name — null until payment gateway integration is active. */
  gateway_name: string | null;
  /** Gateway transaction ID — null until integration is active. */
  gateway_transaction_id: string | null;
  created_at: string | null;
}

// ============================================================================
// SUBSCRIPTION RESOURCE SHAPE  (mirror SubscriptionResource.php)
// ============================================================================

/** Facility summary embedded inside SubscriptionResource. */
export interface SubscriptionFacilityInfo {
  id: number;
  facility_name: string | null;
  facility_code: string | null;
}

/**
 * Full subscription shape as returned by SubscriptionResource.
 *
 * @example
 * const { data } = useGetFacilitySubscription();
 * if (data?.data.has_access) {
 *   // facility may use the platform
 * }
 */
export interface Subscription {
  id: number;
  facility: SubscriptionFacilityInfo;
  /** Loaded plan details; null if relationship was not eager-loaded. */
  plan: Plan | null;
  status: SubscriptionStatus | string;
  status_label: string;
  /** True when status is active, valid trial, or within grace period. */
  has_access: boolean;
  trial_ends_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  next_billing_date: string | null;
  grace_period_ends_at: string | null;
  /** Days until billing period ends (0 if already past). */
  days_remaining: number;
  suspended_at: string | null;
  cancelled_at: string | null;
  approved_at: string | null;
  onboarding_fee_paid: boolean;
  /** Payments loaded only when the relationship is eager-loaded. */
  payments: Payment[];
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================================================
// PAGINATION  (Laravel ResourceCollection + paginate())
// ============================================================================

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * Generic paginated collection envelope.
 * Laravel emits { data, links, meta } when using ->paginate().
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

// ============================================================================
// API RESPONSE ENVELOPES
// ============================================================================

/**
 * Standard success envelope used by all billing controllers.
 * Shape: { success: true, message: string, data: T }
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Standard error envelope (validation failures, 4xx, 5xx).
 * Shape: { success: false, message: string, errors?: {...} }
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  /** Client-action hint, e.g. 'subscribe' sent with 402 responses. */
  action?: string;
}

// ── Typed response aliases ───────────────────────────────────────────────────

/** GET /billing/plans → non-paginated collection (getAllActive) */
export interface PlansCollectionResponse {
  data: Plan[];
}

/** GET /billing/plans/{plan} */
export type GetPlanResponse = ApiSuccessResponse<Plan>;

/** GET /facilities/{facility}/subscription */
export type GetSubscriptionResponse = ApiSuccessResponse<Subscription>;

/** POST /facilities/{facility}/subscription */
export type CreateSubscriptionResponse = ApiSuccessResponse<Subscription>;

/** DELETE /facilities/{facility}/subscription */
export type CancelSubscriptionResponse = ApiSuccessResponse<Subscription>;

/** GET /facilities/{facility}/payments/{payment} */
export type GetPaymentResponse = ApiSuccessResponse<Payment>;

/** POST /facilities/{facility}/payments */
export type RecordPaymentResponse = ApiSuccessResponse<Payment>;

/** GET /admin/billing/plans — paginated */
export type PaginatedPlansResponse = PaginatedResponse<Plan>;

/** Admin plan create / update */
export type AdminPlanResponse = ApiSuccessResponse<Plan>;

/** Admin plan delete */
export type AdminDeletePlanResponse = ApiSuccessResponse<null>;

/** GET /admin/billing/subscriptions — paginated */
export type PaginatedSubscriptionsResponse = PaginatedResponse<Subscription>;

/** Admin subscription show / activate / suspend / cancel */
export type AdminSubscriptionResponse = ApiSuccessResponse<Subscription>;

/** GET /admin/billing/payments — paginated */
export type PaginatedPaymentsResponse = PaginatedResponse<Payment>;

/** Admin payment show / approve / reject */
export type AdminPaymentResponse = ApiSuccessResponse<Payment>;

// ============================================================================
// REQUEST / PAYLOAD TYPES  (mirror FormRequest rules)
// ============================================================================

/**
 * POST /facilities/{facility}/subscription
 * Validated by: StoreSubscriptionRequest
 */
export interface StoreSubscriptionRequest {
  /** ID of an active plan from GET /billing/plans */
  plan_id: number;
  notes?: string | null;
}

/**
 * DELETE /facilities/{facility}/subscription
 * Body is optional — controller does nullable validation on reason.
 */
export interface CancelSubscriptionRequest {
  reason?: string | null;
}

/**
 * POST /facilities/{facility}/payments
 * Sent as multipart/form-data because an optional receipt file may be attached.
 * The `receipt` File is kept separate in {@link RecordPaymentParams}.
 *
 * Validated by: StorePaymentRequest
 */
export interface StorePaymentRequest {
  /** Must be ≥ 1. */
  amount: number;
  /** ISO-4217 currency code, e.g. 'UGX' or 'USD'. */
  currency: string;
  method: PaymentMethod | string;
  payment_type: PaymentType | string;
  /** Mobile money / bank reference number. */
  transaction_reference?: string | null;
  receipt_notes?: string | null;
  /** ISO date string; must be past or present (before_or_equal:now). */
  paid_at: string;
}

/**
 * POST /admin/billing/plans
 * Validated by: StorePlanRequest
 */
export interface StorePlanRequest {
  name: string;
  /** URL-friendly, lowercase, hyphens only — e.g. 'professional'. */
  slug: string;
  description?: string | null;
  price_usd: number;
  price_ugx: number;
  onboarding_fee_usd?: number | null;
  onboarding_fee_ugx?: number | null;
  billing_cycle: BillingCycle | 'monthly';
  /** 0–90 days; defaults to 7 on the backend. */
  trial_days?: number | null;
  features?: Record<string, boolean | unknown> | null;
  max_staff?: number | null;
  max_departments?: number | null;
  max_patients_per_month?: number | null;
  sort_order?: number | null;
  is_popular?: boolean | null;
  is_active?: boolean | null;
}

/**
 * PUT /admin/billing/plans/{plan}
 * All fields are optional (sometimes validation on the backend).
 * Validated by: UpdatePlanRequest
 */
export type UpdatePlanRequest = Partial<StorePlanRequest>;

/**
 * POST /admin/billing/payments/{payment}/approve
 * Validated by: ApprovePaymentRequest
 */
export interface ApprovePaymentRequest {
  /** Optional internal note appended to the payment's receipt_notes. */
  notes?: string | null;
}

/**
 * POST /admin/billing/payments/{payment}/reject
 * Validated by: RejectPaymentRequest
 * `reason` is required (min:10) on the backend.
 */
export interface RejectPaymentRequest {
  reason: string;
}

/**
 * POST /admin/billing/subscriptions/{subscription}/activate|suspend|cancel
 * Validated by: ManageSubscriptionRequest
 */
export interface ManageSubscriptionRequest {
  reason?: string | null;
}

// ============================================================================
// FILTER TYPES  (query-string params accepted by paginated endpoints)
// ============================================================================

/** Filters for GET /facilities/{facility}/payments */
export interface FacilityPaymentFilters {
  status?: PaymentStatus | string;
  payment_type?: PaymentType | string;
  per_page?: number;
}

/** Filters for GET /admin/billing/plans */
export interface AdminPlanFilters {
  is_active?: boolean;
  search?: string;
  per_page?: number;
  page?: number;
}

/** Filters for GET /admin/billing/subscriptions */
export interface AdminSubscriptionFilters {
  status?: SubscriptionStatus | string;
  facility_id?: number;
  plan_id?: number;
  per_page?: number;
}

/** Filters for GET /admin/billing/payments */
export interface AdminPaymentFilters {
  status?: PaymentStatus | string;
  facility_id?: number;
  payment_type?: PaymentType | string;
  method?: PaymentMethod | string;
  per_page?: number;
}

// ============================================================================
// MUTATION PARAMS TYPES  (variables passed to useMutation hooks)
// ============================================================================

/**
 * POST /facilities/{facility}/subscription
 * facilityId is injected from Redux; only payload is needed here.
 */
export interface CreateSubscriptionParams {
  data: StoreSubscriptionRequest;
}

/**
 * DELETE /facilities/{facility}/subscription
 * facilityId is injected from Redux; body is optional.
 */
export interface CancelSubscriptionParams {
  data?: CancelSubscriptionRequest;
}

/**
 * POST /facilities/{facility}/payments
 * facilityId is injected from Redux.
 * `receipt` is the optional file (JPEG / PNG / PDF ≤ 5 MB).
 */
export interface RecordPaymentParams {
  data: StorePaymentRequest;
  receipt?: File | null;
}

/** PUT /admin/billing/plans/{plan} */
export interface AdminUpdatePlanParams {
  planId: number;
  data: UpdatePlanRequest;
}

/** DELETE /admin/billing/plans/{plan} */
export interface AdminDeletePlanParams {
  planId: number;
}

/** POST /admin/billing/subscriptions/{subscription}/activate | suspend | cancel */
export interface AdminManageSubscriptionParams {
  subscriptionId: number;
  data?: ManageSubscriptionRequest;
}

/** POST /admin/billing/payments/{payment}/approve */
export interface AdminApprovePaymentParams {
  paymentId: number;
  data?: ApprovePaymentRequest;
}

/** POST /admin/billing/payments/{payment}/reject */
export interface AdminRejectPaymentParams {
  paymentId: number;
  data: RejectPaymentRequest;
}

// ============================================================================
// INVOICE ENUMS & TYPES
// ============================================================================

export enum InvoiceStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  OVERDUE = 'overdue',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  RENEWAL = 'renewal',
  ONBOARDING = 'onboarding',
  ADJUSTMENT = 'adjustment',
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  facility_id: number;
  subscription_id: number;
  invoice_number: string;
  invoice_type: InvoiceType | string;
  invoice_type_label: string;
  status: InvoiceStatus | string;
  status_label: string;
  amount: number;
  currency: string;
  paid_amount: number;
  balance_due: number;
  description: string | null;
  line_items: InvoiceLineItem[] | null;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  subscription?: {
    id: number;
    status: string;
    plan?: { id: number; name: string; slug: string } | null;
  } | null;
  facility?: {
    id: number;
    facility_name: string | null;
    facility_code: string | null;
  } | null;
  created_at: string | null;
}

/** GET /facilities/{facility}/invoices */
export type GetFacilityInvoicesResponse = PaginatedResponse<Invoice>;

/** GET /admin/billing/invoices */
export type GetAdminInvoicesResponse = PaginatedResponse<Invoice>;

/** GET /facilities/{facility}/invoices/{invoice} */
export type GetInvoiceResponse = ApiSuccessResponse<Invoice>;

/** Filters for GET /facilities/{facility}/invoices */
export interface FacilityInvoiceFilters {
  status?: InvoiceStatus | string;
  invoice_type?: InvoiceType | string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

/** Filters for GET /admin/billing/invoices */
export interface AdminInvoiceFilters {
  status?: InvoiceStatus | string;
  facility_id?: number;
  invoice_type?: InvoiceType | string;
  per_page?: number;
}

/** POST /admin/billing/invoices/{invoice}/mark-paid */
export interface MarkInvoicePaidRequest {
  amount: number;
  paid_at?: string | null;
}

/** POST /admin/billing/invoices/{invoice}/mark-paid params */
export interface AdminMarkInvoicePaidParams {
  invoiceId: number;
  data: MarkInvoicePaidRequest;
}

/** POST /admin/billing/invoices/{invoice}/cancel params */
export interface AdminCancelInvoiceParams {
  invoiceId: number;
}

// ============================================================================
// USAGE TYPES
// ============================================================================

export interface FacilityUsageLimits {
  max_staff: number | null;
  max_departments: number | null;
  max_patients_per_month: number | null;
}

export interface FacilityUsage {
  staff: number;
  departments: number;
  visits: number;
  limits?: FacilityUsageLimits | null;
}

export interface UsageResponse {
  success: boolean;
  message: string;
  data: FacilityUsage;
}

/** Labels for invoice statuses (mirrors backend InvoiceStatus::label()). */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.UNPAID]: 'Unpaid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.PARTIALLY_PAID]: 'Partially Paid',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
  [InvoiceStatus.REFUNDED]: 'Refunded',
};

/** Labels for invoice types (mirrors backend InvoiceType::label()). */
export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  [InvoiceType.SUBSCRIPTION]: 'Subscription',
  [InvoiceType.RENEWAL]: 'Renewal',
  [InvoiceType.ONBOARDING]: 'Onboarding Fee',
  [InvoiceType.ADJUSTMENT]: 'Adjustment',
};

// ============================================================================
// UTILITY TYPES & CONSTANTS
// ============================================================================

export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/** UI labels for subscription statuses (mirrors backend SubscriptionStatus::label()). */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIAL]:     'Trial',
  [SubscriptionStatus.ACTIVE]:    'Active',
  [SubscriptionStatus.PAST_DUE]:  'Past Due',
  [SubscriptionStatus.SUSPENDED]: 'Suspended',
  [SubscriptionStatus.CANCELLED]: 'Cancelled',
};

/** UI labels for payment statuses (mirrors backend PaymentStatus::label()). */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:  'Pending Review',
  [PaymentStatus.APPROVED]: 'Approved',
  [PaymentStatus.REJECTED]: 'Rejected',
  [PaymentStatus.REFUNDED]: 'Refunded',
};

/** UI labels for payment methods (mirrors backend PaymentMethod::label()). */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.MOBILE_MONEY]:  'Mobile Money',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CASH]:          'Cash',
  [PaymentMethod.GATEWAY]:       'Payment Gateway',
};

/** UI labels for payment types (mirrors backend PaymentType::label()). */
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.ONBOARDING]:   'Onboarding Fee',
  [PaymentType.SUBSCRIPTION]: 'Subscription',
  [PaymentType.RENEWAL]:      'Renewal',
};

/**
 * Statuses that grant full platform access.
 * Mirrors: SubscriptionStatus::accessGranted()
 */
export const SUBSCRIPTION_ACCESS_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE, // within 7-day grace window
];
