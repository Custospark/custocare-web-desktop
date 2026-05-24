import { useMemo } from 'react';

import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { useAppSelector } from '../../app/store/hooks/useApp';
import { selectActiveFacility } from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import { OWNER_RESTRICTED_MODULES } from './entitlements';
import { resolveFacilitySubscriptionAccess } from './resolveFacilitySubscriptionAccess';

export const PLANS_SUBSCRIPTIONS_OPERATION_ID = 'plans-subscriptions';

/** True when the facility owner must only manage plans/billing (no active subscription). */
export function useAdministrationSubscriptionRestriction() {
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const activeFacility = useAppSelector(selectActiveFacility);

  const { data: subscriptionResponse } = useGetFacilitySubscription({
    enabled: Boolean(activeFacilityId),
  });

  const hasSubscriptionAccess = useMemo(
    () =>
      resolveFacilitySubscriptionAccess(
        subscriptionResponse?.data?.has_access,
        activeFacility?.has_subscription_access,
      ),
    [subscriptionResponse?.data?.has_access, activeFacility?.has_subscription_access],
  );

  const isOwnerRestrictedModuleSet = useMemo(() => {
    const activeCodes = (activeFacility?.modules ?? [])
      .filter((module) => module.is_active)
      .map((module) => module.code);

    if (activeCodes.length === 0) {
      return false;
    }

    return activeCodes.every((code) =>
      (OWNER_RESTRICTED_MODULES as readonly string[]).includes(code),
    );
  }, [activeFacility?.modules]);

  const isFacilityOwner = activeFacility?.is_facility_owner === true;

  const restrictToPlansOnly = useMemo(() => {
    if (hasSubscriptionAccess) {
      return false;
    }

    // Only facility owners manage plans/billing when subscription is inactive.
    return isFacilityOwner;
  }, [hasSubscriptionAccess, isFacilityOwner]);

  return {
    restrictToPlansOnly,
    hasSubscriptionAccess,
    activeFacility,
    isFacilityOwner,
    isOwnerRestrictedModuleSet,
  };
}

export function filterAdministrationModuleOperations<T extends { id: string }>(
  operations: T[],
  restrictToPlansOnly: boolean,
  isFacilityOwner: boolean,
): T[] {
  let filtered = operations.filter(
    (operation) =>
      isFacilityOwner || operation.id !== PLANS_SUBSCRIPTIONS_OPERATION_ID,
  );

  if (restrictToPlansOnly && isFacilityOwner) {
    filtered = filtered.filter(
      (operation) => operation.id === PLANS_SUBSCRIPTIONS_OPERATION_ID,
    );
  }

  return filtered;
}

export function filterAdministrationSidebarOperations<T extends { id: string }>(
  operations: T[],
  restrictToPlansOnly: boolean,
  isFacilityOwner: boolean,
): T[] {
  let filtered = operations.filter(
    (operation) =>
      isFacilityOwner ||
      (operation.id !== `adm-${PLANS_SUBSCRIPTIONS_OPERATION_ID}` &&
        !operation.id.endsWith(PLANS_SUBSCRIPTIONS_OPERATION_ID)),
  );

  if (restrictToPlansOnly && isFacilityOwner) {
    filtered = filtered.filter(
      (operation) =>
        operation.id === `adm-${PLANS_SUBSCRIPTIONS_OPERATION_ID}` ||
        operation.id.endsWith(PLANS_SUBSCRIPTIONS_OPERATION_ID),
    );
  }

  return filtered;
}
