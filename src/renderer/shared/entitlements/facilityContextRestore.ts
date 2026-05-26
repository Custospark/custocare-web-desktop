import { axiosInstance } from '../../app/api/axiosConfig';
import type { AppDispatch } from '../../app/store/store';
import {
  setUserContext,
  switchCapability,
  switchFacility,
  type StaffFacilityAssignment,
} from '../../app/store/slices/activeContextSlice';
import {
  PaymentStatus,
  SubscriptionStatus,
  type Payment,
  type Subscription,
} from '../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';
import { OWNER_RESTRICTED_MODULES } from './entitlements';
import { resolveFacilitySubscriptionAccess } from './resolveFacilitySubscriptionAccess';

export function getActiveModuleCodes(
  facility?: StaffFacilityAssignment | null,
): string[] {
  return (facility?.modules ?? [])
    .filter((module) => module.is_active)
    .map((module) => module.code);
}

export function modulesAreOwnerRestrictedOnly(moduleCodes: string[]): boolean {
  return (
    moduleCodes.length > 0 &&
    moduleCodes.every((code) =>
      (OWNER_RESTRICTED_MODULES as readonly string[]).includes(code),
    )
  );
}

/**
 * True when the live subscription grants access but Redux still has owner-only modules.
 */
export function facilityContextNeedsRestore(
  subscription: Subscription | null | undefined,
  activeFacility: StaffFacilityAssignment | null | undefined,
): boolean {
  if (!subscription || !activeFacility) {
    return false;
  }

  const resolvedAccess = resolveFacilitySubscriptionAccess(
    subscription.has_access,
    activeFacility.has_subscription_access,
  );

  if (!resolvedAccess) {
    return false;
  }

  const activeCodes = getActiveModuleCodes(activeFacility);
  return modulesAreOwnerRestrictedOnly(activeCodes);
}

/**
 * Payment was approved but subscription API has not yet reported access (race / stale cache).
 */
export function shouldOfferRestoreAfterApprovedPayment(
  subscription: Subscription | null | undefined,
  options: {
    hasPendingProof: boolean;
    needsPayment: boolean;
    quoteRequiresPayment?: boolean;
    payments: Payment[];
  },
): boolean {
  if (!subscription) {
    return false;
  }

  if (
    options.hasPendingProof ||
    options.needsPayment ||
    options.quoteRequiresPayment
  ) {
    return false;
  }

  if (
    subscription.status === SubscriptionStatus.TRIAL ||
    subscription.status === SubscriptionStatus.CANCELLED
  ) {
    return false;
  }

  if (subscription.has_access) {
    return false;
  }

  return options.payments.some((payment) => payment.status === PaymentStatus.APPROVED);
}

export function shouldOfferRestoreFunctionality(
  subscription: Subscription | null | undefined,
  activeFacility: StaffFacilityAssignment | null | undefined,
  paymentOptions?: {
    hasPendingProof: boolean;
    needsPayment: boolean;
    quoteRequiresPayment?: boolean;
    payments: Payment[];
  },
): boolean {
  if (facilityContextNeedsRestore(subscription, activeFacility)) {
    return true;
  }

  if (paymentOptions) {
    return shouldOfferRestoreAfterApprovedPayment(subscription, paymentOptions);
  }

  return false;
}

/**
 * Re-fetch authoritative module access from the backend and apply it to Redux.
 */
export async function restoreFacilityFunctionalityFromBackend(
  dispatch: AppDispatch,
  facilityId: number,
): Promise<void> {
  const response = await axiosInstance.get('/user/context/resolve');
  const userContext = response.data?.data;

  if (!userContext) {
    throw new Error('Failed to resolve user context from server.');
  }

  dispatch(setUserContext(userContext));
  dispatch(switchCapability('staff'));
  dispatch(switchFacility(facilityId));
}
