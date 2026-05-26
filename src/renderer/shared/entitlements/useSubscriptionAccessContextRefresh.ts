import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '../../app/store/hooks/useApp';
import { selectActiveFacility } from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { OWNER_RESTRICTED_MODULES } from '../../shared/entitlements/entitlements';
import {
  facilityContextNeedsRestore,
  getActiveModuleCodes,
  modulesAreOwnerRestrictedOnly,
  restoreFacilityFunctionalityFromBackend,
} from './facilityContextRestore';
import { resolveFacilitySubscriptionAccess } from './resolveFacilitySubscriptionAccess';

/** Re-fetch `/user/context/resolve` when live subscription access and Redux context are out of sync. */
export function useSubscriptionAccessContextRefresh(): void {
  const dispatch = useAppDispatch();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const activeFacility = useAppSelector(selectActiveFacility);

  const { data: subscriptionResponse, isFetched: subscriptionFetched } =
    useGetFacilitySubscription({
      enabled: Boolean(activeFacilityId),
    });

  const refreshInFlight = useRef(false);
  const lastSyncedLiveAccess = useRef<boolean | null>(null);
  const lastExplicitRestoreKey = useRef<string | null>(null);

  useEffect(() => {
    if (!activeFacilityId || !subscriptionFetched) {
      return;
    }

    const liveHasAccess = subscriptionResponse?.data?.has_access;
    const cachedHasAccess = activeFacility?.has_subscription_access;
    const resolvedAccess = resolveFacilitySubscriptionAccess(
      liveHasAccess,
      cachedHasAccess,
    );

    const activeModuleCodes = getActiveModuleCodes(activeFacility);
    const modulesStillOwnerRestricted = modulesAreOwnerRestrictedOnly(activeModuleCodes);
    const needsExplicitRestore = facilityContextNeedsRestore(
      subscriptionResponse?.data,
      activeFacility,
    );
    const modulesStillFullWhileInactive =
      !resolvedAccess &&
      activeModuleCodes.some(
        (code) => !(OWNER_RESTRICTED_MODULES as readonly string[]).includes(code),
      );

    const accessMismatch =
      liveHasAccess === true && cachedHasAccess !== true;
    const accessRevokedMismatch =
      liveHasAccess === false && cachedHasAccess === true;
    const modulesMismatch =
      (resolvedAccess && modulesStillOwnerRestricted) ||
      (!resolvedAccess && modulesStillFullWhileInactive);

    const explicitRestoreKey = needsExplicitRestore
      ? `${activeFacilityId}:${subscriptionResponse?.data?.id ?? 'none'}`
      : null;

    const accessTransitionMismatch =
      (accessMismatch || accessRevokedMismatch || modulesMismatch) &&
      lastSyncedLiveAccess.current !== liveHasAccess;

    const shouldRefresh =
      Boolean(explicitRestoreKey && lastExplicitRestoreKey.current !== explicitRestoreKey) ||
      accessTransitionMismatch;

    if (!shouldRefresh || refreshInFlight.current || !activeFacilityId) {
      if (liveHasAccess !== undefined) {
        lastSyncedLiveAccess.current = liveHasAccess;
      }
      return;
    }

    refreshInFlight.current = true;

    restoreFacilityFunctionalityFromBackend(dispatch, activeFacilityId)
      .catch(() => undefined)
      .finally(() => {
        refreshInFlight.current = false;
        if (explicitRestoreKey) {
          lastExplicitRestoreKey.current = explicitRestoreKey;
        }
        if (liveHasAccess !== undefined) {
          lastSyncedLiveAccess.current = liveHasAccess;
        }
      });
  }, [
    activeFacilityId,
    subscriptionFetched,
    activeFacility,
    subscriptionResponse?.data,
    dispatch,
  ]);
}
