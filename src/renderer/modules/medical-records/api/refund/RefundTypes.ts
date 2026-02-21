/**
 * RefundTypes.ts
 * ============================================================================
 * REFUND & VOID TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for refund and void
 * operations in the healthcare billing system. These types support the
 * billing cycle refund and void endpoints.
 * 
 * @module refundTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reasons for voiding a transaction
 */
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

/**
 * Reasons for refunding a transaction
 */
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

/**
 * Payment method types for refunds
 */
export enum RefundMethodType {
  CASH = 'cash',
  CARD = 'card',
  INSURANCE = 'insurance',
  MOBILE = 'mobile',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  OTHER = 'other',
}

/**
 * Status of adjustment/refund processing
 */
export enum AdjustmentStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST PAYLOAD TYPES                             */
/* -------------------------------------------------------------------------- */

/**
 * Payload for voiding a transaction
 * POST /api/billing-cycles/{billingCycleId}/void
 */
export interface VoidTransactionRequest {
  /** Reason for voiding (required) */
  reason: VoidReason;
  
  /** Additional notes (required when reason = "other") */
  reason_notes?: string;
  
  /** Whether to restore inventory (optional, defaults to true in backend) */
  restore_inventory?: boolean;
}

/**
 * Individual line item for partial refund
 */
export interface RefundLineItem {
  /** Line item ID from invoice_line_items table (required) */
  line_item_id: number;
  
  /** Amount to refund for this line item (optional, defaults to full line amount) */
  refund_amount?: number;
}

/**
 * Refund method details
 */
export interface RefundMethod {
  /** Type of refund method (required) */
  type: RefundMethodType;
  
  /** Amount to refund via this method (required) */
  amount: number;
  
  /** Reference number/transaction ID (optional) */
  reference?: string;
}

/**
 * Payload for full refund
 * POST /api/billing-cycles/{billingCycleId}/refund
 */
export interface FullRefundRequest {
  /** Reason for refund (required) */
  reason: RefundReason;
  
  /** Additional notes (required when reason = "other") */
  reason_notes?: string;
  
  /** Refund methods (required, min 1) */
  refund_methods: RefundMethod[];
  
  /** Whether to restore inventory (optional) */
  restore_inventory?: boolean;
}

/**
 * Payload for partial refund
 * POST /api/billing-cycles/{billingCycleId}/refund
 */
export interface PartialRefundRequest extends FullRefundRequest {
  /** Line items to refund (required for partial refund, min 1) */
  line_items: RefundLineItem[];
}

/**
 * Union type for refund requests (auto-detected by backend)
 */
export type RefundTransactionRequest = FullRefundRequest | PartialRefundRequest;

/* -------------------------------------------------------------------------- */
/*                          RESPONSE DATA TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Response data for void transaction
 */
export interface VoidTransactionData {
  /** Financial adjustment ID */
  adjustment_id: number;
  
  /** Reference number for this void */
  reference_number: string;
  
  /** Amount that was voided */
  voided_amount: number;
  
  /** Whether inventory was restored */
  inventory_restored: boolean;
  
  /** Timestamp when void was completed */
  completed_at: string;
}

/**
 * Affected line item in partial refund
 */
export interface AffectedLineItem {
  /** Line item ID */
  line_item_id: number;
  
  /** Line item UUID */
  line_item_uuid: string;
  
  /** Service code */
  service_code: string;
  
  /** Service name/description */
  service_name: string;
  
  /** Original line item amount */
  original_amount: number;
  
  /** Amount refunded for this line item */
  refund_amount: number;
  
  /** Quantity of the line item */
  quantity: number;
}

/**
 * Response data for full refund
 */
export interface FullRefundData {
  /** Type of refund */
  refund_type: 'full_refund';
  
  /** Financial adjustment ID */
  adjustment_id: number;
  
  /** Reference number for this refund */
  reference_number: string;
  
  /** Total refund amount */
  refund_amount: number;
  
  /** Amount refunded to patient */
  patient_refund: number;
  
  /** Amount refunded to insurance */
  insurance_refund: number;
  
  /** Whether inventory was restored */
  inventory_restored: boolean;
  
  /** Timestamp when refund was completed */
  completed_at: string;
}

/**
 * Response data for partial refund
 */
export interface PartialRefundData extends FullRefundData {
  /** Type of refund */
  refund_type: 'partial_refund';
  
  /** Number of affected line items */
  affected_line_items: number;
  
  /** Remaining balance after refund */
  remaining_balance: number;
}

/**
 * Union type for refund response data
 */
export type RefundTransactionData = FullRefundData | PartialRefundData;

/* -------------------------------------------------------------------------- */
/*                          API RESPONSE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Success response for void transaction
 */
export interface VoidTransactionResponse {
  success: true;
  message: string;
  data: VoidTransactionData;
}

/**
 * Success response for refund transaction
 */
export interface RefundTransactionResponse {
  success: true;
  message: string;
  data: RefundTransactionData;
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
/*                            CONSTANTS & LABELS                              */
/* -------------------------------------------------------------------------- */

/**
 * Human-readable labels for void reasons
 */
export const VOID_REASON_LABELS: Record<VoidReason, string> = {
  [VoidReason.BILLING_ERROR]: 'Billing Error',
  [VoidReason.SERVICE_NOT_RENDERED]: 'Service Not Rendered',
  [VoidReason.DUPLICATE_CHARGE]: 'Duplicate Charge',
  [VoidReason.PATIENT_REQUEST]: 'Patient Request',
  [VoidReason.ADMINISTRATIVE_CORRECTION]: 'Administrative Correction',
  [VoidReason.PRICING_ERROR]: 'Pricing Error',
  [VoidReason.CANCELLED_SERVICE]: 'Cancelled Service',
  [VoidReason.OTHER]: 'Other (Specify in Notes)',
};

/**
 * Human-readable labels for refund reasons
 */
export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  [RefundReason.BILLING_ERROR]: 'Billing Error',
  [RefundReason.SERVICE_NOT_RENDERED]: 'Service Not Rendered',
  [RefundReason.DUPLICATE_CHARGE]: 'Duplicate Charge',
  [RefundReason.PATIENT_REQUEST]: 'Patient Request',
  [RefundReason.INSURANCE_DENIAL]: 'Insurance Denial',
  [RefundReason.ADMINISTRATIVE_CORRECTION]: 'Administrative Correction',
  [RefundReason.PRICING_ERROR]: 'Pricing Error',
  [RefundReason.CANCELLED_SERVICE]: 'Cancelled Service',
  [RefundReason.OTHER]: 'Other (Specify in Notes)',
};

/**
 * Human-readable labels for refund method types
 */
export const REFUND_METHOD_LABELS: Record<RefundMethodType, string> = {
  [RefundMethodType.CASH]: 'Cash',
  [RefundMethodType.CARD]: 'Card',
  [RefundMethodType.INSURANCE]: 'Insurance',
  [RefundMethodType.MOBILE]: 'Mobile Money',
  [RefundMethodType.BANK_TRANSFER]: 'Bank Transfer',
  [RefundMethodType.CHEQUE]: 'Cheque',
  [RefundMethodType.OTHER]: 'Other',
};

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type guard to check if a refund request is partial
 */
export function isPartialRefundRequest(
  request: RefundTransactionRequest
): request is PartialRefundRequest {
  return 'line_items' in request && Array.isArray(request.line_items);
}

/**
 * Type guard to check if a refund response is partial
 */
export function isPartialRefundData(
  data: RefundTransactionData
): data is PartialRefundData {
  return data.refund_type === 'partial_refund';
}

/**
 * Validate void transaction request
 */
export function validateVoidRequest(request: VoidTransactionRequest): string | null {
  if (!request.reason) {
    return 'Void reason is required';
  }
  
  if (request.reason === VoidReason.OTHER && !request.reason_notes) {
    return 'Reason notes are required when reason is "other"';
  }
  
  return null;
}

/**
 * Validate refund transaction request
 */
export function validateRefundRequest(request: RefundTransactionRequest): string | null {
  if (!request.reason) {
    return 'Refund reason is required';
  }
  
  if (request.reason === RefundReason.OTHER && !request.reason_notes) {
    return 'Reason notes are required when reason is "other"';
  }
  
  if (!request.refund_methods || request.refund_methods.length === 0) {
    return 'At least one refund method is required';
  }
  
  // Validate refund methods
  for (const method of request.refund_methods) {
    if (!method.type) {
      return 'Refund method type is required';
    }
    if (!method.amount || method.amount <= 0) {
      return 'Refund method amount must be greater than 0';
    }
  }
  
  // Validate partial refund specific fields
  if (isPartialRefundRequest(request)) {
    if (!request.line_items || request.line_items.length === 0) {
      return 'At least one line item is required for partial refund';
    }
    
    for (const lineItem of request.line_items) {
      if (!lineItem.line_item_id) {
        return 'Line item ID is required';
      }
      if (lineItem.refund_amount !== undefined && lineItem.refund_amount < 0) {
        return 'Line item refund amount cannot be negative';
      }
    }
  }
  
  return null;
}

/**
 * Calculate total refund amount from refund methods
 */
export function calculateTotalRefundAmount(refundMethods: RefundMethod[]): number {
  return refundMethods.reduce((total, method) => total + method.amount, 0);
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