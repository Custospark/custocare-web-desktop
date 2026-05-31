import { useMemo } from 'react';

import { useAppSelector } from '../../app/store/hooks/useApp';
import { selectAccessibleModuleCodes } from '../../app/store/slices/activeContextSlice';
import { useGetFacilitySubscription } from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { getPlanEnabledModuleCodesFromPlan } from '../entitlements/entitlements';

import {
  ENCOUNTER_WORKFLOW_STAGE_ORDER,
  type CareDeliveryWorkflow,
  WORKFLOW_TO_MODULE_CODE,
} from '../../modules/pharmacy/api/dispensing/visit-queue/visitTypes';

/**
 * Returns the care delivery workflow stages that are enabled by the
 * active facility **subscription plan** (not the current user's module
 * permissions). This ensures a user assigned to e.g. Laboratory can
 * still forward patients to Pharmacy or filter the Pharmacy queue if
 * the facility subscription supports it.
 */
export function useAccessibleWorkflows(): CareDeliveryWorkflow[] {
  const userModuleCodes = useAppSelector(selectAccessibleModuleCodes);

  const { data: subscriptionResponse } = useGetFacilitySubscription();

  const subscription = subscriptionResponse?.data;

  return useMemo(() => {
    const plan = subscription?.effective_plan ?? subscription?.plan ?? null;

    // 1. Subscription plan loaded — use the plan's enabled module codes
    //    (this is the facility-level entitlement, not user-level).
    if (plan) {
      const planModuleCodes = getPlanEnabledModuleCodesFromPlan(plan);
      return ENCOUNTER_WORKFLOW_STAGE_ORDER.filter((wf) => {
        const moduleCode = WORKFLOW_TO_MODULE_CODE[wf];
        if (!moduleCode) return true;
        return planModuleCodes.includes(moduleCode);
      });
    }

    // 2. Subscription known but no access (suspended / cancelled) — nothing.
    if (subscription && !subscription.has_access) {
      return [];
    }

    // 3. Subscription still loading — fall back to user's assigned modules
    //    (the current-user scope, which is a safe subset).
    return ENCOUNTER_WORKFLOW_STAGE_ORDER.filter((wf) => {
      const moduleCode = WORKFLOW_TO_MODULE_CODE[wf];
      if (!moduleCode) return true;
      return userModuleCodes.includes(moduleCode);
    });
  }, [subscription, userModuleCodes]);
}
