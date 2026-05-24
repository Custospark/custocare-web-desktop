import { useEffect, useRef } from 'react';

import { axiosInstance } from '../../app/api/axiosConfig';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks/useApp';
import {
  selectActiveFacility,
  setUserContext,
} from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { OWNER_RESTRICTED_MODULES } from '../../shared/entitlements/entitlements';
import { resolveFacilitySubscriptionAccess } from './resolveFacilitySubscriptionAccess';

function modulesAreOwnerRestrictedOnly(moduleCodes: string[]): boolean {
  return (
    moduleCodes.length > 0 &&
    moduleCodes.every((code) =>
      (OWNER_RESTRICTED_MODULES as readonly string[]).includes(code),
    )
  );
}

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

    const activeModuleCodes = (activeFacility?.modules ?? [])
      .filter((module) => module.is_active)
      .map((module) => module.code);

    const modulesStillOwnerRestricted = modulesAreOwnerRestrictedOnly(activeModuleCodes);
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

    const shouldRefresh =
      (accessMismatch || accessRevokedMismatch || modulesMismatch) &&
      lastSyncedLiveAccess.current !== liveHasAccess;

    if (!shouldRefresh || refreshInFlight.current) {
      if (liveHasAccess !== undefined) {
        lastSyncedLiveAccess.current = liveHasAccess;
      }
      return;
    }

    refreshInFlight.current = true;

    axiosInstance
      .get('/user/context/resolve')
      .then((response) => {
        const userContext = response.data?.data;
        if (userContext) {
          dispatch(setUserContext(userContext));
        }
      })
      .finally(() => {
        refreshInFlight.current = false;
        if (liveHasAccess !== undefined) {
          lastSyncedLiveAccess.current = liveHasAccess;
        }
      });
  }, [
    activeFacilityId,
    subscriptionFetched,
    activeFacility?.has_subscription_access,
    activeFacility?.modules,
    subscriptionResponse?.data?.has_access,
    dispatch,
  ]);
}
