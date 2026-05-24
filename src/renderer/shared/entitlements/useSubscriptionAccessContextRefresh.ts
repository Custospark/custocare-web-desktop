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

/** Re-fetch `/user/context/resolve` when subscription access is granted but Redux modules are still restricted. */
export function useSubscriptionAccessContextRefresh(): void {
  const dispatch = useAppDispatch();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const activeFacility = useAppSelector(selectActiveFacility);

  const { data: subscriptionResponse } = useGetFacilitySubscription({
    enabled: Boolean(activeFacilityId),
  });

  const refreshInFlight = useRef(false);
  const lastLiveAccess = useRef<boolean | null>(null);

  useEffect(() => {
    if (!activeFacilityId) {
      return;
    }

    const liveHasAccess = subscriptionResponse?.data?.has_access === true;
    const cachedHasAccess = activeFacility?.has_subscription_access === true;

    const activeModuleCodes = (activeFacility?.modules ?? [])
      .filter((module) => module.is_active)
      .map((module) => module.code);

    const modulesStillOwnerRestricted =
      activeModuleCodes.length > 0 &&
      activeModuleCodes.every((code) =>
        (OWNER_RESTRICTED_MODULES as readonly string[]).includes(code),
      );

    const shouldRefresh =
      liveHasAccess &&
      (!cachedHasAccess ||
        lastLiveAccess.current === false ||
        modulesStillOwnerRestricted);

    if (!shouldRefresh || refreshInFlight.current) {
      lastLiveAccess.current = liveHasAccess;
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
        lastLiveAccess.current = liveHasAccess;
      });
  }, [
    activeFacilityId,
    activeFacility?.has_subscription_access,
    activeFacility?.modules,
    subscriptionResponse?.data?.has_access,
    dispatch,
  ]);
}
