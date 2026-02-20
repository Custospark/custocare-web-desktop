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

/**
 * Individual charge item within a billing cycle
 */
export interface ChargeItem {
  id: string; // Format: "charge::uuid"
  service_key: string;
  service: ServiceCore;
  quantity: number;
  totalAmount: number;
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
  
  // Attending Staff Information
  attending_staff_id: number | null;
  attending_staff_name: string | null;
  attending_staff_role: string | null;
  attending_staff_display: string | null;
  
  charge_items: ChargeItem[];
  discount: Discount;
  taxes: Tax[];
  payment_methods: PaymentMethod[];
  additional_notes: string;
  payment_status: PaymentStatus;
  billing_data: BillingData;
  billed_at: string | null;
  created_at: string;
  updated_at: string;
  last_updated: number; // Timestamp in milliseconds
  is_dirty: boolean;
  is_processing: boolean;
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
    maximumFractionDigits: 2,
  }).format(amount);
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_CURRENCY = 'UGX';

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_BILLED]: 'error',
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.PARTIALLY_PAID]: 'info',
  [PaymentStatus.PAID_IN_FULL]: 'success',
  [PaymentStatus.INSURANCE_PENDING]: 'secondary',
  [PaymentStatus.DENIED]: 'error',
  [PaymentStatus.BAD_DEBT]: 'error',
  [PaymentStatus.CHARITY_CARE]: 'default',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_BILLED]: 'Not Billed',
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.PARTIALLY_PAID]: 'Partially Paid',
  [PaymentStatus.PAID_IN_FULL]: 'Paid in Full',
  [PaymentStatus.INSURANCE_PENDING]: 'Insurance Pending',
  [PaymentStatus.DENIED]: 'Denied',
  [PaymentStatus.BAD_DEBT]: 'Bad Debt',
  [PaymentStatus.CHARITY_CARE]: 'Charity Care',
};

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<PaymentStatus, 'error' | 'warning' | 'info' | 'success' | 'secondary' | 'default'> = {
  [PaymentStatus.NOT_BILLED]: 'error',
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.PARTIALLY_PAID]: 'info',
  [PaymentStatus.PAID_IN_FULL]: 'success',
  [PaymentStatus.INSURANCE_PENDING]: 'secondary',
  [PaymentStatus.DENIED]: 'error',
  [PaymentStatus.BAD_DEBT]: 'error',
  [PaymentStatus.CHARITY_CARE]: 'default',
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