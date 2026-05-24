import { useMemo } from 'react';

import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { useAppSelector } from '../../app/store/hooks/useApp';
import { selectActiveFacility } from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import { OWNER_RESTRICTED_MODULES } from './entitlements';

export const PLANS_SUBSCRIPTIONS_OPERATION_ID = 'plans-subscriptions';

/** True when the facility owner must only manage plans/billing (no active subscription). */
export function useAdministrationSubscriptionRestriction() {
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const activeFacility = useAppSelector(selectActiveFacility);

  const { data: subscriptionResponse } = useGetFacilitySubscription({
    enabled: Boolean(activeFacilityId),
  });

  const hasSubscriptionAccess = useMemo(() => {
    if (subscriptionResponse?.data?.has_access === true) {
      return true;
    }

    if (activeFacility?.has_subscription_access === true) {
      return true;
    }

    return false;
  }, [subscriptionResponse?.data?.has_access, activeFacility?.has_subscription_access]);

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

  const restrictToPlansOnly = useMemo(() => {
    if (hasSubscriptionAccess) {
      return false;
    }

    if (activeFacility?.is_facility_owner) {
      return true;
    }

    return isOwnerRestrictedModuleSet;
  }, [
    hasSubscriptionAccess,
    activeFacility?.is_facility_owner,
    isOwnerRestrictedModuleSet,
  ]);

  return {
    restrictToPlansOnly,
    hasSubscriptionAccess,
    activeFacility,
  };
}

export function filterAdministrationModuleOperations<T extends { id: string }>(
  operations: T[],
  restrictToPlansOnly: boolean,
): T[] {
  if (!restrictToPlansOnly) {
    return operations;
  }

  return operations.filter((operation) => operation.id === PLANS_SUBSCRIPTIONS_OPERATION_ID);
}

export function filterAdministrationSidebarOperations<T extends { id: string }>(
  operations: T[],
  restrictToPlansOnly: boolean,
): T[] {
  if (!restrictToPlansOnly) {
    return operations;
  }

  return operations.filter(
    (operation) =>
      operation.id === `adm-${PLANS_SUBSCRIPTIONS_OPERATION_ID}` ||
      operation.id.endsWith(PLANS_SUBSCRIPTIONS_OPERATION_ID),
  );
}
