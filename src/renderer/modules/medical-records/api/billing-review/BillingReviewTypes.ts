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

import { formatCurrency as sharedFormatCurrency, formatCurrencyWithCustomCurrency as sharedFormatCurrencyWithCustom } from '../../../shared/utils/formatCurrency';

/**
 * Format currency amount using facility's configured currency
 * Falls back to USD if no facility currency is set
 */
export function formatCurrency(amount: number, currency?: string): string {
  return sharedFormatCurrency(amount, currency);
}

/**
 * Format currency with custom currency parameter (overrides facility config)
 */
export function formatCurrencyWithCustomCurrency(amount: number, currencyCode: string): string {
  return sharedFormatCurrencyWithCustom(amount, currencyCode);
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

// Dynamic DEFAULT_CURRENCY that reads from facility config
// For static imports, we use a getter function instead
let _cachedCurrency: string | null = null;

export const getDefaultCurrency = (): string => {
  if (_cachedCurrency) return _cachedCurrency;
  try {
    const currency = getCurrentFacilityCurrency();
    _cachedCurrency = currency;
    return currency;
  } catch {
    return 'UGX';
  }
};

// For backward compatibility - this will be dynamically resolved
// Note: This is a getter, not a static value
export const DEFAULT_CURRENCY = (() => {
  try {
    return getCurrentFacilityCurrency();
  } catch {
    return 'UGX';
  }
})();

// Static fallback for when the dynamic value is needed as a constant
export const STATIC_DEFAULT_CURRENCY = 'UGX';

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