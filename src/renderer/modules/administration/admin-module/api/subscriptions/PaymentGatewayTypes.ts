/**
 * ============================================================================
 * PAYMENT GATEWAY — TYPE DEFINITIONS (Facility-based)
 * ============================================================================
 *
 * This module is an ADD-ON to the existing manual billing system.
 * It reuses core billing types from SubscriptionTypes.ts and introduces:
 *   - Gateway discovery (which gateways are enabled)
 *   - Gateway initiation (redirect vs push/USSD)
 *   - Gateway payment status polling
 *
 * NOTE:
 * - Subscriptions are FACILITY-based (no user/app subscription linkage).
 * - Manual payments still exist; this file only adds gateway-specific shapes.
 */

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AxiosApiError,
  MutationCallbacks,
  Payment,
  PaymentType,
} from './SubscriptionTypes';

/* -------------------------------------------------------------------------- */
/*                               Gateway Names                                */
/* -------------------------------------------------------------------------- */

/**
 * Canonical gateway identifiers (backend driver names).
 * Keep string extension to allow new gateways without frontend refactors.
 */
export type GatewayName =
  | 'mtn_momo'
  | 'airtel_money'
  | 'flutterwave'
  | 'pesapal'
  | (string & {});

/** Redirect-based vs push/USSD-based initiation flow. */
export type GatewayFlowType = 'redirect' | 'push';

/* -------------------------------------------------------------------------- */
/*                          Gateway discovery response                          */
/* -------------------------------------------------------------------------- */

export interface AvailableGateway {
  name: GatewayName;
  /** 'redirect' (hosted checkout) or 'push' (USSD prompt). */
  type: GatewayFlowType;
  label: string;
  instructions?: string | null;
  supported_currencies?: string[] | null;
}

export type GetAvailableGatewaysResponse = ApiSuccessResponse<AvailableGateway[]>;

/* -------------------------------------------------------------------------- */
/*                           Gateway initiation payload                         */
/* -------------------------------------------------------------------------- */

/**
 * Initiate a gateway payment.
 * The facility context is enforced by the endpoint path (facility-scoped).
 *
 * NOTE: backend typically requires at least one of phone_number or email depending on gateway.
 */
export interface InitiateGatewayPaymentRequest {
  /** Subscription being paid for (must belong to the facility). */
  subscription_id: number;

  /** onboarding | subscription | renewal */
  payment_type: PaymentType | string;

  amount: number;
  currency: string; // ISO-4217 (e.g. 'UGX', 'USD')

  /** Required for push gateways (MTN/Airtel). Use international digits, e.g. 25677... */
  phone_number?: string | null;

  /** Required for redirect gateways (Flutterwave/PesaPal). */
  email?: string | null;

  customer_name?: string | null;
}

export interface InitiateGatewayPaymentData {
  payment_id: number;
  gateway: GatewayName;
  /** redirect | push */
  type: GatewayFlowType;
  /** present when type = redirect */
  redirect_url: string | null;
  /** gateway reference or internal reference returned by backend */
  reference: string;
}

/**
 * POST initiate response envelope.
 * Backend typically returns 202 Accepted because payment is still pending.
 */
export type InitiateGatewayPaymentResponse = ApiSuccessResponse<InitiateGatewayPaymentData>;

/* -------------------------------------------------------------------------- */
/*                         Gateway payment status polling                       */
/* -------------------------------------------------------------------------- */

export interface GatewayPaymentStatusData {
  payment_id: number;
  status: Payment['status'] | string;
  status_label?: string;
  gateway?: GatewayName | string | null;
  amount?: number;
  currency?: string;
  approved_at?: string | null;
}

export type GetGatewayPaymentStatusResponse = ApiSuccessResponse<GatewayPaymentStatusData>;

/* -------------------------------------------------------------------------- */
/*                             Mutation Param Types                             */
/* -------------------------------------------------------------------------- */

export interface InitiateGatewayPaymentParams {
  gateway: GatewayName;
  data: InitiateGatewayPaymentRequest;
}

export interface GatewayPaymentStatusParams {
  /** Reference can be payment_id, gateway_transaction_id, or transaction_reference (backend-dependent). */
  reference: number | string;
}

/* -------------------------------------------------------------------------- */
/*                         Re-exports for convenience                           */
/* -------------------------------------------------------------------------- */

export type { ApiSuccessResponse, ApiErrorResponse, AxiosApiError, MutationCallbacks };
