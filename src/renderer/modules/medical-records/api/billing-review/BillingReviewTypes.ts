/**
 * BillingReviewTypes.ts
 * ============================================================================
 * BILLING REVIEW TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for billing review
 * operations in the healthcare billing system. These types support the
 * facility-level billing review endpoint.
 * 
 * @module billingReviewTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

export enum PaymentStatus {
  NOT_BILLED = 'not_billed',
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID_IN_FULL = 'paid_in_full',
  INSURANCE_PENDING = 'insurance_pending',
  DENIED = 'denied',
  BAD_DEBT = 'bad_debt',
  CHARITY_CARE = 'charity_care',
  ALL='all',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum PaymentMethodType {
  CASH = 'cash',
  CARD = 'card',
  INSURANCE = 'insurance',
  MOBILE = 'mobile',
  MIXED = 'mixed',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
}

export enum ServiceCategory {
  SURGICAL_PROCEDURE = 'surgical_procedure',
  MEDICATION = 'medication',
  MEDICAL_SUPPLY = 'medical_supply',
  CONSULTATION = 'consultation',
  LABORATORY = 'laboratory',
  RADIOLOGY = 'radiology',
  OTHER = 'other',
}

export enum BillingCycleStatus {
  DRAFT                  = 'draft',
  PENDING                  = 'pending',
  PENDING_REVIEW         = 'pending_review',
  PENDING_SUBMISSION     = 'pending_submission',
  SUBMITTED_TO_INSURANCE = 'submitted_to_insurance',
  PARTIALLY_PAID         = 'partially_paid',
  PAID_IN_FULL           = 'paid_in_full',
  PAYMENT_PLAN           = 'payment_plan',
  COLLECTIONS            = 'collections',
  DISPUTED               = 'disputed',
  WRITTEN_OFF            = 'written_off',
  CHARITY_CARE           = 'charity_care',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FULLY_REFUNDED = 'fully_refunded',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Core service information
 */
export interface ServiceCore {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
}

/* -------------------------------------------------------------------------- */
/*                           AUDIT TRAIL TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Actor who performed an audit event
 */
export interface AuditActor {
  type: 'staff' | 'patient' | 'system' | 'external_api' | 'scheduled_job' | string;
  id: number | null;
  identifier?: string | null;
  name?: string | null;
  role?: string | null;
  display?: string | null;
}

/**
 * Entity reference in audit log
 */
export interface AuditEntityReference {
  type: string;
  id: number | null;
  identifier?: string | null;
  billing_cycle_id?: number | null;
  line_item_id?: number | null;
  financial_adjustment_id?: number | null;
}

/**
 * Individual audit log entry
 */
export interface AuditLogEntry {
  id: number;
  audit_uuid: string;
  event_key: string;
  scope: 'billing_cycle' | 'line_item' | string;
  title: string;
  action: string;
  description?: string | null;
  reason?: string | null;
  why?: string | null;
  performed_at: string | null;
  performed_at_unix_ms?: number | null;
  performed_by: AuditActor;
  entity: AuditEntityReference;
  changed_fields: string[];
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  result: 'success' | 'failure' | 'partial' | 'denied' | string;
}

/**
 * Summary of audit logs for an entity
 */
export interface AuditLogSummary {
  count: number;
  last_event_at: string | null;
  last_event?: AuditLogEntry | null;
}

/* -------------------------------------------------------------------------- */
/*                           CHARGE ITEM TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Individual charge item within a billing cycle
 * Extended to support both active and refunded items
 */
export interface ChargeItem {
  id: string; // Format: "charge::uuid" or "refund::uuid"
  source?: string;
  persisted?: boolean;
  refunded?: boolean;
  line_item_id?: number | null;
  line_item_uuid?: string | null;
  billing_cycle_id?: number | null;
  service_key: string;
  serviceKey?: string;
  service: ServiceCore;
  quantity: number | {
    original: number;
    refunded: number;
    remaining: number;
  };
  totalAmount: number;
  line_item_status?: string;
  entered_by_staff_id?: number | null;
  entered_by_staff_name?: string | null;
  permissions?: {
    entered_by_staff_id?: number | null;
    current_staff_id?: number | null;
    requires_reason_on_cross_staff_edit: boolean;
    reason_required: boolean;
    can_edit_without_reason: boolean;
  };
  audit?: Record<string, any>;
  audit_logs?: AuditLogEntry[];
  audit_logs_summary?: AuditLogSummary;
  refund_info?: {
    refund_amount: number;
    patient_refund: number;
    insurance_refund: number;
    refund_methods: Array<{
      type: string;
      amount: number;
      reference?: string | null;
    }>;
    refund_reason?: string;
    refunded_at?: string;
    refunded_by_staff_id?: string | number | null;
    refunded_by_staff_name?: string;
  };
  amounts?: {
    original_subtotal: number;
    refund_subtotal: number;
    remaining_subtotal: number;
  };
  matched_reference?: {
    id?: number | null;
    type?: string | null;
  };
  [key: string]: any;
}

/**
 * Discount applied to the billing
 */
export interface Discount {
  type: DiscountType;
  value: number;
  reason: string | null;
}

/**
 * Tax applied to the billing
 */
export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

/**
 * Payment method used for the billing
 */
export interface PaymentMethod {
  type: string; // Will match PaymentMethodType enum values
  amount: number;
  reference?: string;
  details?: string;
}

/**
 * Comprehensive billing calculations
 */
export interface BillingData {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxes: Tax[];
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  isPaid: boolean;
}

/**
 * Main billing review item (represents one billing cycle/visit)
 */
export interface BillingReviewItem {
  has_billing: boolean;
  visit_id: number;
  visit_uuid: string;
  patient_id: number;
  patient_number: string;
  patient_name: string;
  billing_cycle_id: number | null;
  billing_cycle_uuid: string | null;
  receipt_number: string | null;
  billing_status: BillingCycleStatus;
  
  // Attending Staff Information
  attending_staff_id: number | null;
  attending_staff_name: string | null;
  attending_staff_role: string | null;
  attending_staff_display: string | null;
  
  charge_items: ChargeItem[];
  refunded_items?: ChargeItem[];
  discount: Discount;
  taxes: Tax[];
  payment_methods: PaymentMethod[];
  additional_notes: string;
  payment_status: PaymentStatus;
  billing_data: BillingData;
  
  // Audit trail fields
  audit_logs?: AuditLogEntry[];
  audit_logs_summary?: AuditLogSummary;
  
  billed_at: string | null;
  created_at: string;
  updated_at: string;
  last_updated: number; // Timestamp in milliseconds
  is_dirty: boolean;
  is_processing: boolean;
  
  [key: string]: any;
}

/**
 * Pagination information
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  from: number;
  to: number;
  has_previous: boolean;
  has_next: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Filters that can be applied to the billing review list
 */
export interface BillingReviewFilters {
  page?: number;
  per_page?: number;
  search?: string;
  payment_status?: PaymentStatus | string;
  date_from?: string;
  date_to?: string;
  patient_id?: number;
  has_billing?: boolean;
  sort_by?: 'created_at' | 'updated_at' | 'patient_name' | 'grandTotal';
  sort_order?: 'asc' | 'desc';
  current_staff_id?: number;
}

/**
 * Complete API response for billing review endpoint
 */
export interface BillingReviewResponse {
  success: boolean;
  message: string;
  data: {
    items: BillingReviewItem[];
    pagination: Pagination;
    filters_applied: string[];
    search_term: string | null;
  };
}

/**
 * Summary statistics for billing review (useful for dashboard)
 */
export interface BillingReviewSummary {
  total_billed: number;
  total_pending: number;
  total_not_billed: number;
  total_insurance_pending: number;
  total_denied: number;
  total_bad_debt: number;
  total_charity_care: number;
  total_revenue: number;
  total_paid: number;
  total_outstanding: number;
  average_per_billing: number;
}

/**
 * Single billing item retrieval response
 */
export interface BillingDetailResponse {
  success: boolean;
  message: string;
  data: BillingReviewItem;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string; // Debug error message (only in development)
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type FacilityId = number;

/**
 * Type guard to check if a billing item has billing data
 */
export function hasBillingData(item: BillingReviewItem): boolean {
  return item.has_billing && item.billing_cycle_id !== null && item.billing_cycle_uuid !== null;
}

/**
 * Type guard to check if payment is complete
 */
export function isPaidInFull(item: BillingReviewItem): boolean {
  return item.payment_status === PaymentStatus.PAID_IN_FULL;
}

/**
 * Type guard to check if payment is pending insurance
 */
export function isInsurancePending(item: BillingReviewItem): boolean {
  return item.payment_status === PaymentStatus.INSURANCE_PENDING;
}

/**
 * Type guard to check if payment is denied
 */
export function isDenied(item: BillingReviewItem): boolean {
  return item.payment_status === PaymentStatus.DENIED;
}

/**
 * Type guard to check if payment is bad debt
 */
export function isBadDebt(item: BillingReviewItem): boolean {
  return item.payment_status === PaymentStatus.BAD_DEBT;
}

/**
 * Type guard to check if payment is charity care
 */
export function isCharityCare(item: BillingReviewItem): boolean {
  return item.payment_status === PaymentStatus.CHARITY_CARE;
}

/**
 * Get outstanding balance for a billing item
 */
export function getOutstandingBalance(item: BillingReviewItem): number {
  return item.billing_data.balance;
}

/**
 * Check if billing is collectible (not denied, bad debt, or charity)
 */
export function isCollectible(item: BillingReviewItem): boolean {
  return ![
    PaymentStatus.DENIED,
    PaymentStatus.BAD_DEBT,
    PaymentStatus.CHARITY_CARE,
  ].includes(item.payment_status);
}

/**
 * Check if billing is overdue (can be customized based on business rules)
 */
export function isOverdue(item: BillingReviewItem, daysThreshold: number = 30): boolean {
  if (!isCollectible(item) || isPaidInFull(item)) return false;
  
  const createdDate = new Date(item.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > daysThreshold;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Type guard to check if a charge item is a refunded item
 */
export function isRefundedItem(item: ChargeItem): boolean {
  return item.refunded === true || item.source === 'refund';
}

/**
 * Type guard to check if quantity is an object (refunded item) or number
 */
export function isRefundedQuantity(quantity: number | { original: number; refunded: number; remaining: number }): quantity is { original: number; refunded: number; remaining: number } {
  return typeof quantity === 'object' && 'original' in quantity && 'refunded' in quantity && 'remaining' in quantity;
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_CURRENCY = 'UGX';

// Define a type that excludes ALL
type PaymentStatusWithoutAll = Exclude<PaymentStatus, typeof PaymentStatus.ALL>;


export const PAYMENT_STATUS_COLORS: Record<PaymentStatusWithoutAll, string> = {
  [PaymentStatus.NOT_BILLED]: 'error',
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.PARTIALLY_PAID]: 'info',
  [PaymentStatus.PAID_IN_FULL]: 'success',
  [PaymentStatus.INSURANCE_PENDING]: 'secondary',
  [PaymentStatus.DENIED]: 'error',
  [PaymentStatus.BAD_DEBT]: 'error',
  [PaymentStatus.CHARITY_CARE]: 'default',
};

// Reuse PAYMENT_STATUS_COLORS for badge variants (they're the same values)
export const PAYMENT_STATUS_BADGE_VARIANTS = PAYMENT_STATUS_COLORS;

// Note: This payment status align with visits.
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_BILLED]: 'Not Billed',
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PARTIALLY_PAID]: 'Partially Paid',
  [PaymentStatus.PAID_IN_FULL]: 'Paid in Full',
  [PaymentStatus.INSURANCE_PENDING]: 'Insurance Pending',
  [PaymentStatus.DENIED]: 'Denied',
  [PaymentStatus.BAD_DEBT]: 'Bad Debt',
  [PaymentStatus.CHARITY_CARE]: 'Charity Care',
  [PaymentStatus.ALL]: 'All Statuses',
};

export const BILLING_CYCLE_STATUS_LABELS: Record<BillingCycleStatus, string> = {
  [BillingCycleStatus.DRAFT]: 'Draft',
  [BillingCycleStatus.PENDING_REVIEW]: 'Pending Review',
  [BillingCycleStatus.PENDING]: 'Pending',
  [BillingCycleStatus.PENDING_SUBMISSION]: 'Pending Submission',
  [BillingCycleStatus.SUBMITTED_TO_INSURANCE]: 'Submitted to Insurance',
  [BillingCycleStatus.PARTIALLY_PAID]: 'Partial',
  [BillingCycleStatus.PAID_IN_FULL]: 'Paid',
  [BillingCycleStatus.PAYMENT_PLAN]: 'Payment Plan',
  [BillingCycleStatus.COLLECTIONS]: 'Collections',
  [BillingCycleStatus.DISPUTED]: 'Disputed',
  [BillingCycleStatus.WRITTEN_OFF]: 'Void',
  [BillingCycleStatus.CHARITY_CARE]: 'Charity Care',
  [BillingCycleStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
  [BillingCycleStatus.FULLY_REFUNDED]: 'Fully Refunded',
};

export const BILLING_CYCLE_STATUS_COLORS: Record<BillingCycleStatus, string> = {
  [BillingCycleStatus.PAID_IN_FULL]: 'success',
  [BillingCycleStatus.PARTIALLY_PAID]: 'info',
  [BillingCycleStatus.DRAFT]: 'info',
  [BillingCycleStatus.PENDING_REVIEW]: 'info',
  [BillingCycleStatus.PENDING_SUBMISSION]: 'info',
  [BillingCycleStatus.PENDING]: 'warning',
  [BillingCycleStatus.SUBMITTED_TO_INSURANCE]: 'secondary',
  [BillingCycleStatus.PAYMENT_PLAN]: 'secondary',
  [BillingCycleStatus.COLLECTIONS]: 'secondary',
  [BillingCycleStatus.WRITTEN_OFF]: 'error',
  [BillingCycleStatus.DISPUTED]: 'error',
  [BillingCycleStatus.FULLY_REFUNDED]: 'error',
  [BillingCycleStatus.PARTIALLY_REFUNDED]: 'error',
  [BillingCycleStatus.CHARITY_CARE]: 'default',
};

/**
 * Groups of payment statuses for filtering
 */
export const PAYMENT_STATUS_GROUPS = {
  ACTIVE: [
    PaymentStatus.NOT_BILLED,
    PaymentStatus.PENDING,
    PaymentStatus.PARTIALLY_PAID,
    PaymentStatus.INSURANCE_PENDING,
  ],
  COMPLETED: [PaymentStatus.PAID_IN_FULL],
  PROBLEMATIC: [PaymentStatus.DENIED, PaymentStatus.BAD_DEBT],
  CHARITABLE: [PaymentStatus.CHARITY_CARE],
  ALL: Object.values(PaymentStatus),
} as const;