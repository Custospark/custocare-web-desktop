import { useCallback, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../app/store/hooks/useApp';
import {
  selectActiveFacility,
} from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import type { Payment, Subscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionTypes';
import {
  facilityContextNeedsRestore,
  restoreFacilityFunctionalityFromBackend,
  shouldOfferRestoreAfterApprovedPayment,
  shouldOfferRestoreFunctionality,
} from './facilityContextRestore';

export interface RestoreFacilityPaymentContext {
  hasPendingProof: boolean;
  needsPayment: boolean;
  quoteRequiresPayment?: boolean;
  payments: Payment[];
}

export function useRestoreFacilityFunctionality(
  subscription?: Subscription | null,
  paymentContext?: RestoreFacilityPaymentContext,
) {
  const dispatch = useAppDispatch();
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const activeFacility = useAppSelector(selectActiveFacility);
  const { refetch: refetchSubscription } = useGetFacilitySubscription();
  const [isRestoring, setIsRestoring] = useState(false);

  const needsRestore = useMemo(
    () => facilityContextNeedsRestore(subscription, activeFacility),
    [subscription, activeFacility],
  );

  const showRestoreOption = useMemo(
    () =>
      shouldOfferRestoreFunctionality(subscription, activeFacility, paymentContext),
    [subscription, activeFacility, paymentContext],
  );

  const restoreAfterApprovedPayment = useMemo(
    () =>
      paymentContext
        ? shouldOfferRestoreAfterApprovedPayment(subscription, paymentContext)
        : false,
    [subscription, paymentContext],
  );

  const restore = useCallback(async (): Promise<boolean> => {
    if (!activeFacilityId || isRestoring) {
      return false;
    }

    setIsRestoring(true);
    try {
      await refetchSubscription();
      await restoreFacilityFunctionalityFromBackend(dispatch, activeFacilityId);
      return true;
    } catch {
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [activeFacilityId, dispatch, isRestoring, refetchSubscription]);

  return {
    restore,
    isRestoring,
    needsRestore,
    showRestoreOption,
    restoreAfterApprovedPayment,
  };
}
