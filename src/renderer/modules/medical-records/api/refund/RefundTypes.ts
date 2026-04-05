/**
 * RefundTypes.ts
 * ============================================================================
 * REFUND AND VOID TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for refund and void
 * operations in the healthcare billing system. These types support the
 * refund and void endpoints.
 * 
 * @module refundTypes
 */

import  { BillingCycleStatus } from "../billing-review/BillingReviewTypes";
export   {BillingCycleStatus}

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

export enum RefundReason {
  BILLING_ERROR = 'billing_error',
  SERVICE_NOT_RENDERED = 'service_not_rendered',
  DUPLICATE_CHARGE = 'duplicate_charge',
  PATIENT_REQUEST = 'patient_request',
  INSURANCE_DENIAL = 'insurance_denial',
  ADMINISTRATIVE_CORRECTION = 'administrative_correction',
  PRICING_ERROR = 'pricing_error',
  CANCELLED_SERVICE = 'cancelled_service',
  OTHER = 'other',
}

export enum VoidReason {
  BILLING_ERROR = 'billing_error',
  SERVICE_NOT_RENDERED = 'service_not_rendered',
  DUPLICATE_CHARGE = 'duplicate_charge',
  PATIENT_REQUEST = 'patient_request',
  ADMINISTRATIVE_CORRECTION = 'administrative_correction',
  PRICING_ERROR = 'pricing_error',
  CANCELLED_SERVICE = 'cancelled_service',
  OTHER = 'other',
}

export enum RefundMethodType {
  CASH = 'cash',
  CARD = 'card',
  INSURANCE = 'insurance',
  MOBILE = 'mobile',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

export enum RefundType {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
}

export enum AdjustmentStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/* -------------------------------------------------------------------------- */
/*                              REQUEST TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Base refund/void request headers
 */
export interface RefundHeaders {
  'X-Facility-Id': number;
  'X-Staff-Id': number;
}

/**
 * Void transaction request payload
 */
export interface VoidRequest {
  reason: VoidReason | string;
  reason_notes?: string;
  restore_inventory?: boolean;
}

/**
 * Refund method item
 */
export interface RefundMethod {
  type: RefundMethodType | string;
  amount: number;
  reference?: string | null;
}

/**
 * Line item for partial refund
 */
export interface RefundLineItem {
  line_item_id: number;
  refund_amount?: number | null;
}

/**
 * Base refund request (shared fields)
 */
export interface BaseRefundRequest {
  reason: RefundReason | string;
  reason_notes?: string;
  line_items?: Array<{                    // Optional - omit for full refund
    line_item_id: number;                  // Backend expects integer
    refund_amount: number;
    quantity?: number;                      // Optional as per schema
  }>;
  refund_methods: Array<{
    type: RefundMethodType;
    amount: number;
    reference: string | null;
  }>;
  restore_inventory?: boolean;
}




/* -------------------------------------------------------------------------- */
/*                              RESPONSE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Base refund response structure
 */
export interface BaseRefundResponse {
  success: boolean;
  message: string;
  data?: RefundResponseData;
  errors?: Record<string, string[]>;
  error?: string; // Debug mode only
}

/**
 * Refund response data (success case)
 */
export interface RefundResponseData {
  adjustment_id: number;
  reference_number: string;
  refund_amount: number;
  patient_refund?: number;
  insurance_refund?: number;
  inventory_restored: boolean;
  completed_at: string;
}

/**
 * Full refund response data
 */
export interface FullRefundResponseData extends RefundResponseData {
  refund_type: 'full_refund';
}

/**
 * Partial refund response data
 */
export interface PartialRefundResponseData extends RefundResponseData {
  refund_type: 'partial_refund';
  affected_line_items?: number;
  remaining_balance?: number;
}

/**
 * Void response data
 */
export interface VoidResponseData {
  adjustment_id: number;
  reference_number: string;
  voided_amount: number;
  inventory_restored: boolean;
  completed_at: string;
}

/**
 * Void response
 */
export interface VoidResponse {
  success: boolean;
  message: string;
  data?: VoidResponseData;
  errors?: Record<string, string[]>;
  error?: string; // Debug mode only
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: Record<string, string[]>;
}

/* -------------------------------------------------------------------------- */
/*                              TRANSACTION TYPES                             */
/* -------------------------------------------------------------------------- */

/**
 * Represents a line item in a billing cycle for refund selection
 */
export interface RefundableLineItem {
  id: number;
  line_item_uuid: string;
  service_code: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  net_amount: number;
  max_refundable_amount: number;
  is_selected: boolean;
  refund_amount: number;
  original_quantity: number;
}

/**
 * Refund summary for UI display
 */
export interface RefundSummary {
  totalRefundAmount: number;
  patientRefund: number;
  insuranceRefund: number;
  affectedItemsCount: number;
  remainingBalance: number;
  isFullRefund: boolean;
}

/**
 * Transaction eligibility check result
 */
export interface EligibilityResult {
  eligible: boolean;
  message?: string;
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

// /**
//  * Type guard to check if a refund request is a partial refund
//  */
// export function isPartialRefund(request: RefundRequest): request is PartialRefundRequest {
//   return 'line_items' in request && Array.isArray(request.line_items) && request.line_items.length > 0;
// }

/**
 * Type guard to check if a refund response is a full refund
 */
export function isFullRefundResponse(data: RefundResponseData): data is FullRefundResponseData {
  return 'refund_type' in data && data.refund_type === 'full_refund';
}

/**
 * Type guard to check if a refund response is a partial refund
 */
export function isPartialRefundResponse(data: RefundResponseData): data is PartialRefundResponseData {
  return 'refund_type' in data && data.refund_type === 'partial_refund';
}

/**
 * Check if a billing cycle is voidable
 */
export function isVoidable(transaction: {
  billing_status?: string;
  created_at?: string;
  insurance_claim_submitted_at?: string | null;
}): EligibilityResult {
  if (transaction.billing_status === 'written_off') {
    return {
      eligible: false,
      message: 'This transaction has already been voided.',
      reason: 'already_voided',
    };
  }

  const hoursSinceCreation = transaction.created_at 
    ? Math.abs(new Date().getTime() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60)
    : 0;

  if (transaction.billing_status !== 'draft' && hoursSinceCreation > 24) {
    return {
      eligible: false,
      message: 'Only draft billings or those created within 24 hours can be voided.',
      reason: 'too_old',
    };
  }

  if (transaction.insurance_claim_submitted_at) {
    return {
      eligible: false,
      message: 'Cannot void after an insurance claim has been submitted.',
      reason: 'insurance_claimed',
    };
  }

  return { eligible: true };
}

/**
 * Check if a billing cycle is refundable
 */
export const isRefundable = (data: { 
  billing_status: BillingCycleStatus; 
  patient_payment_received: number;
  insurance_payment_received: number;
}): { eligible: boolean; message?: string } => {
  const { billing_status, patient_payment_received, insurance_payment_received } = data;
  const totalPaid = patient_payment_received + insurance_payment_received;

  // Can't refund if no payment received
  if (totalPaid <= 0) {
    return { eligible: false, message: 'No payment received to refund' };
  }

  // Check status-based eligibility
  switch (billing_status) {
    case BillingCycleStatus.FULLY_REFUNDED:
      return { eligible: false, message: 'Transaction has already been fully refunded' };
    
    case BillingCycleStatus.PARTIALLY_REFUNDED:
      return { eligible: true, message: 'Additional refund can be processed' };
    
    case BillingCycleStatus.PAID_IN_FULL:
    case BillingCycleStatus.PARTIALLY_PAID:
      return { eligible: true };
    
    case BillingCycleStatus.DRAFT:
    case BillingCycleStatus.PENDING_REVIEW:
    case BillingCycleStatus.PENDING_SUBMISSION:
      return { eligible: false, message: 'Transaction not yet paid' };
    
    case BillingCycleStatus.WRITTEN_OFF:
    case BillingCycleStatus.DISPUTED:
      return { eligible: false, message: `Cannot refund ${billing_status.replace('_', ' ')} transaction` };
    
    default:
      return { eligible: false, message: 'Transaction not eligible for refund' };
  }
};

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  [RefundReason.BILLING_ERROR]: 'Billing Error',
  [RefundReason.SERVICE_NOT_RENDERED]: 'Service Not Rendered',
  [RefundReason.DUPLICATE_CHARGE]: 'Duplicate Charge',
  [RefundReason.PATIENT_REQUEST]: 'Patient Request',
  [RefundReason.INSURANCE_DENIAL]: 'Insurance Denial',
  [RefundReason.ADMINISTRATIVE_CORRECTION]: 'Administrative Correction',
  [RefundReason.PRICING_ERROR]: 'Pricing Error',
  [RefundReason.CANCELLED_SERVICE]: 'Cancelled Service',
  [RefundReason.OTHER]: 'Other',
};

export const VOID_REASON_LABELS: Record<VoidReason, string> = {
  [VoidReason.BILLING_ERROR]: 'Billing Error',
  [VoidReason.SERVICE_NOT_RENDERED]: 'Service Not Rendered',
  [VoidReason.DUPLICATE_CHARGE]: 'Duplicate Charge',
  [VoidReason.PATIENT_REQUEST]: 'Patient Request',
  [VoidReason.ADMINISTRATIVE_CORRECTION]: 'Administrative Correction',
  [VoidReason.PRICING_ERROR]: 'Pricing Error',
  [VoidReason.CANCELLED_SERVICE]: 'Cancelled Service',
  [VoidReason.OTHER]: 'Other',
};

export const REFUND_METHOD_LABELS: Record<RefundMethodType, string> = {
  [RefundMethodType.CASH]: 'Cash',
  [RefundMethodType.CARD]: 'Card',
  [RefundMethodType.INSURANCE]: 'Insurance',
  [RefundMethodType.MOBILE]: 'Mobile Money',
  [RefundMethodType.BANK_TRANSFER]: 'Bank Transfer',
  [RefundMethodType.CHEQUE]: 'Cheque',
  [RefundMethodType.OTHER]: 'Other',
};

export const REFUND_METHOD_COLORS: Record<RefundMethodType, string> = {
  [RefundMethodType.CASH]: 'success',
  [RefundMethodType.CARD]: 'info',
  [RefundMethodType.INSURANCE]: 'secondary',
  [RefundMethodType.MOBILE]: 'warning',
  [RefundMethodType.BANK_TRANSFER]: 'default',
  [RefundMethodType.CHEQUE]: 'default',
  [RefundMethodType.OTHER]: 'default',
};