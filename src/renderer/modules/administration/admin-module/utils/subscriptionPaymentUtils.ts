import type {
  PaymentQuoteIntent,
  Subscription,
  SubscriptionPaymentAction,
} from '../api/subscriptions/SubscriptionTypes';

export type { SubscriptionPaymentAction };

export const getSubscriptionPaymentAction = (
  subscription: Subscription | null | undefined,
): SubscriptionPaymentAction | null => subscription?.payment_action ?? null;

/** Plan card that must receive payment per backend subscription state. */
export const planRequiresCompletePayment = (
  subscription: Subscription | null | undefined,
  planId: number,
): boolean => {
  if (!subscription) return false;

  // Suspended/cancelled subs always need payment on their current plan
  if (subscription.status === 'suspended' || subscription.status === 'cancelled') {
    const subscribedPlanId = subscription.plan?.id ?? subscription.effective_plan?.id;
    return subscribedPlanId === planId;
  }

  const action = getSubscriptionPaymentAction(subscription);
  return Boolean(
    action?.required
    && action.plan_id === planId
    && subscription?.status !== 'trial',
  );
};

export const subscriptionNeedsPayment = (
  subscription: Subscription | null | undefined,
): boolean => {
  if (!subscription) return false;
  // Suspended/cancelled subscriptions always need payment to reactivate
  if (subscription.status === 'suspended' || subscription.status === 'cancelled') return true;
  return Boolean(getSubscriptionPaymentAction(subscription)?.required);
};

export const subscriptionHasPendingPaymentApproval = (
  subscription: Subscription | null | undefined,
): boolean => Boolean(getSubscriptionPaymentAction(subscription)?.pending_approval);

export const resolvePaymentQuoteParams = (
  subscription: Subscription | null | undefined,
): { intent: PaymentQuoteIntent; planId?: number } | null => {
  if (!subscription) return null;
  const action = getSubscriptionPaymentAction(subscription);
  if (action?.required && action.intent) {
    return {
      intent: action.intent as PaymentQuoteIntent,
      planId: action.plan_id ?? undefined,
    };
  }
  // Fall back to subscription intent for the current plan
  const planId = subscription.plan?.id ?? subscription.effective_plan?.id;
  if (!planId) return null;
  return { intent: 'subscription' as PaymentQuoteIntent, planId };
};

/** Days since subscription started (for trial consumption). */
export const getDaysOnTrial = (subscription: Subscription | null | undefined): number => {
  if (!subscription?.starts_at) return 0;
  const startMs = new Date(subscription.starts_at).getTime();
  if (Number.isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)));
};

/** Facility is already on this plan (even if access lapsed). */
export const isSubscribedToPlan = (
  subscription: Subscription | null | undefined,
  planId: number,
): boolean => {
  if (!subscription) return false;
  if (!subscription.has_access) return false;
  if (subscription.status === 'past_due') return false;
  return subscription.plan?.id === planId || subscription.effective_plan?.id === planId;
};

/**
 * Allow changing to another plan during trial once the current plan's trial
 * allowance is fully used (trial_days <= days already on trial).
 */
export const canSwitchPlansDuringTrial = (
  subscription: Subscription | null | undefined,
  currentPlanTrialDays: number,
): boolean => {
  if (!subscription || subscription.status !== 'trial') return false;
  return currentPlanTrialDays <= getDaysOnTrial(subscription);
};

export const getTrialDaysUntilPlanSwitch = (
  subscription: Subscription | null | undefined,
  currentPlanTrialDays: number,
): number => {
  if (!subscription || subscription.status !== 'trial') return 0;
  return Math.max(0, currentPlanTrialDays - getDaysOnTrial(subscription));
};
