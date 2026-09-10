/**
 * ============================================================================
 * SUBSCRIPTION + PAYMENT STATUS MATRIX (central source of truth)
 * ============================================================================
 *
 * Ported from Custosell's planActionMatrix standard: every payment and
 * subscription surface (navbar dropdown, Payments, FacilitySubscriptions,
 * AvailablePlans, history lists) reads statuses, labels, tones and allowed
 * actions from here. Nothing hardcodes a status string, label or action
 * anywhere else. Change the matrix once, every screen follows.
 *
 * Custocare design ownership is preserved: this module carries DATA (labels,
 * tones, actions) in Custocare's own visual language. Components keep their
 * markup and map tones to their local class strings.
 */

import {
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
  type Subscription,
  type Plan,
} from '../api/subscriptions/SubscriptionTypes';

/* -------------------------------------------------------------------------- */
/* Subscription statuses                                                       */
/* -------------------------------------------------------------------------- */

export type SubscriptionTone =
  | 'trial'
  | 'active'
  | 'ending'
  | 'past_due'
  | 'scheduled'
  | 'suspended'
  | 'cancelled';

export interface SubscriptionStatusMeta {
  label: string;
  tone: SubscriptionTone;
  description: string;
  grantsAccess: boolean;
  needsPayment: boolean;
}

export const SUBSCRIPTION_STATUS_MATRIX: Record<SubscriptionStatus, SubscriptionStatusMeta> = {
  [SubscriptionStatus.TRIAL]: {
    label: 'Trial',
    tone: 'trial',
    description: 'Free evaluation period with full access.',
    grantsAccess: true,
    needsPayment: false,
  },
  [SubscriptionStatus.ACTIVE]: {
    label: 'Active',
    tone: 'active',
    description: 'Paid subscription in good standing.',
    grantsAccess: true,
    needsPayment: false,
  },
  [SubscriptionStatus.PAST_DUE]: {
    label: 'Past Due',
    tone: 'past_due',
    description: 'Payment missed. Pay now to stay active.',
    grantsAccess: true,
    needsPayment: true,
  },
  [SubscriptionStatus.SUSPENDED]: {
    label: 'Suspended',
    tone: 'suspended',
    description: 'Access paused. Pay to reactivate.',
    grantsAccess: false,
    needsPayment: true,
  },
  [SubscriptionStatus.CANCELLED]: {
    label: 'Cancelled',
    tone: 'cancelled',
    description: 'Subscription ended. Subscribe again to return.',
    grantsAccess: false,
    needsPayment: true,
  },
};

export const subscriptionStatusMeta = (status: SubscriptionStatus | string): SubscriptionStatusMeta => {
  const meta = (SUBSCRIPTION_STATUS_MATRIX as Record<string, SubscriptionStatusMeta>)[status];
  return (
    meta ?? {
      label: String(status),
      tone: 'active' as SubscriptionTone,
      description: '',
      grantsAccess: true,
      needsPayment: false,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Payment statuses                                                            */
/* -------------------------------------------------------------------------- */

export type PaymentTone = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentStatusMeta {
  label: string;
  tone: PaymentTone;
  description: string;
  isTerminal: boolean;
  allowsNewPayment: boolean;
}

export const PAYMENT_STATUS_MATRIX: Record<PaymentStatus, PaymentStatusMeta> = {
  [PaymentStatus.PENDING]: {
    label: 'Pending Payment',
    tone: 'pending',
    description: 'Payment started. Completes automatically on gateway confirmation.',
    isTerminal: false,
    allowsNewPayment: false,
  },
  [PaymentStatus.COMPLETED]: {
    label: 'Completed',
    tone: 'completed',
    description: 'Money confirmed. Subscription updated.',
    isTerminal: true,
    allowsNewPayment: true,
  },
  [PaymentStatus.FAILED]: {
    label: 'Failed',
    tone: 'failed',
    description: 'Payment did not go through. Start a new payment to retry.',
    isTerminal: true,
    allowsNewPayment: true,
  },
  [PaymentStatus.REFUNDED]: {
    label: 'Refunded',
    tone: 'refunded',
    description: 'Money returned after completion.',
    isTerminal: true,
    allowsNewPayment: true,
  },
};

export const paymentStatusMeta = (status: PaymentStatus | string): PaymentStatusMeta => {
  const meta = (PAYMENT_STATUS_MATRIX as Record<string, PaymentStatusMeta>)[status];
  return (
    meta ?? {
      label: String(status),
      tone: 'pending' as PaymentTone,
      description: '',
      isTerminal: false,
      allowsNewPayment: true,
    }
  );
};

/* -------------------------------------------------------------------------- */
/* Plan actions: subscription status x plan relation -> allowed action         */
/* -------------------------------------------------------------------------- */

export type PlanActionType =
  | 'start_trial'
  | 'subscribe'
  | 'resubscribe'
  | 'reactivate'
  | 'upgrade_now'
  | 'schedule_upgrade'
  | 'schedule_downgrade'
  | 'switch_trial'
  | 'current';

export interface PlanAction {
  type: PlanActionType;
  label: string;
  requiresPayment: boolean;
  paymentType: PaymentType | null;
}

export type SubscriptionStateKey =
  | 'none'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled';

export type PlanRelation = 'current' | 'higher' | 'lower';

type ActionMatrix = Record<SubscriptionStateKey, Record<PlanRelation, PlanAction>>;

const PLAN_ACTION_MATRIX: ActionMatrix = {
  none: {
    current: { type: 'start_trial', label: 'Start Free Trial', requiresPayment: false, paymentType: null },
    higher: { type: 'start_trial', label: 'Start Free Trial', requiresPayment: false, paymentType: null },
    lower: { type: 'start_trial', label: 'Start Free Trial', requiresPayment: false, paymentType: null },
  },
  trial: {
    current: { type: 'current', label: 'Current Plan', requiresPayment: false, paymentType: null },
    higher: { type: 'switch_trial', label: 'Switch to this plan', requiresPayment: false, paymentType: null },
    lower: { type: 'switch_trial', label: 'Switch to this plan', requiresPayment: false, paymentType: null },
  },
  active: {
    current: { type: 'current', label: 'Current Plan', requiresPayment: false, paymentType: null },
    higher: { type: 'upgrade_now', label: 'Upgrade now', requiresPayment: true, paymentType: PaymentType.UPGRADE_PRORATION },
    lower: { type: 'schedule_downgrade', label: 'Schedule downgrade', requiresPayment: false, paymentType: null },
  },
  past_due: {
    current: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
    higher: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
    lower: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
  },
  suspended: {
    current: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
    higher: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
    lower: { type: 'reactivate', label: 'Reactivate', requiresPayment: true, paymentType: PaymentType.RENEWAL },
  },
  cancelled: {
    current: { type: 'resubscribe', label: 'Resubscribe', requiresPayment: true, paymentType: PaymentType.SUBSCRIPTION },
    higher: { type: 'subscribe', label: 'Subscribe', requiresPayment: true, paymentType: PaymentType.SUBSCRIPTION },
    lower: { type: 'subscribe', label: 'Subscribe', requiresPayment: true, paymentType: PaymentType.SUBSCRIPTION },
  },
};

/**
 * Quote payment_type string -> PaymentType enum for initiation payloads.
 * Single mapping; Payments.tsx and any future checkout read this.
 */
export const resolvePaymentTypeFromQuote = (quotePaymentType: string | null | undefined): PaymentType => {
  switch (quotePaymentType) {
    case 'upgrade_proration': return PaymentType.UPGRADE_PRORATION;
    case 'renewal': return PaymentType.RENEWAL;
    case 'onboarding': return PaymentType.ONBOARDING;
    default: return PaymentType.SUBSCRIPTION;
  }
};

export const resolveSubscriptionState = (
  subscription: Subscription | null | undefined,
): SubscriptionStateKey => {
  if (!subscription) return 'none';
  switch (subscription.status) {
    case SubscriptionStatus.TRIAL: return 'trial';
    case SubscriptionStatus.ACTIVE: return 'active';
    case SubscriptionStatus.PAST_DUE: return 'past_due';
    case SubscriptionStatus.SUSPENDED: return 'suspended';
    case SubscriptionStatus.CANCELLED: return 'cancelled';
    default: return 'none';
  }
};

export const resolvePlanRelation = (
  plan: Pick<Plan, 'id'> & { pricing: { usd: number } },
  currentPlanId: number | null,
  currentPlanPriceUsd: number,
): PlanRelation => {
  if (currentPlanId == null || plan.id === currentPlanId) return 'current';
  return plan.pricing.usd > currentPlanPriceUsd ? 'higher' : 'lower';
};

export const getPlanAction = (
  subscription: Subscription | null | undefined,
  plan: Pick<Plan, 'id'> & { pricing: { usd: number } },
  currentPlanId: number | null,
  currentPlanPriceUsd: number,
): PlanAction => {
  const state = resolveSubscriptionState(subscription);
  const relation = resolvePlanRelation(plan, currentPlanId, currentPlanPriceUsd);
  return PLAN_ACTION_MATRIX[state][relation];
};
