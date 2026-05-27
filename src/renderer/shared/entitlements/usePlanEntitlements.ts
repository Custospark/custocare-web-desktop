import { useMemo } from 'react';
import type { Module } from '../../modules/administration/admin-module/api/team-management/types/moduleTypes';
import {
  useGetFacilitySubscription,
  useGetFacilityUsage,
} from '../../modules/administration/admin-module/api/subscriptions/SubscriptionQueries';
import { useAppSelector } from '../../app/store/hooks/useApp';
import { selectStaffFacilities } from '../../app/store/slices/activeContextSlice';
import { getActiveFacilityId } from '../../app/store/utils/contextSelectors';
import {
  getPlanEnabledModuleCodesFromPlan,
  isStaffLimitReached,
  isDepartmentLimitReached,
  isVisitLimitReached,
  OWNER_RESTRICTED_MODULES,
} from './entitlements';

/** Plan-filtered modules for invitation / assignment UIs. */
export const usePlanEntitlements = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  const activeFacilityId = useAppSelector(getActiveFacilityId);
  const staffFacilities = useAppSelector(selectStaffFacilities);

  const { data: subscriptionResponse, isLoading: subscriptionLoading } =
    useGetFacilitySubscription({ enabled });
  const { data: usageResponse, isLoading: usageLoading } = useGetFacilityUsage();

  const plan = subscriptionResponse?.data?.plan ?? null;
  const usage = usageResponse?.data;
  const limits = usage?.limits ?? null;

  const activeFacility = useMemo(
    () => staffFacilities.find((f) => f.facility_id === activeFacilityId) ?? null,
    [staffFacilities, activeFacilityId],
  );

  const isActiveFacilityOwner = activeFacility?.is_facility_owner ?? false;
  const hasSubscriptionAccess = activeFacility?.has_subscription_access ?? false;

  const allowedModuleCodes = useMemo(() => {
    if (!hasSubscriptionAccess && isActiveFacilityOwner) {
      return [...OWNER_RESTRICTED_MODULES];
    }

    const codes = [...getPlanEnabledModuleCodesFromPlan(plan)];

    if (isActiveFacilityOwner && !codes.includes('administration')) {
      codes.push('administration');
    }

    return codes;
  }, [plan, hasSubscriptionAccess, isActiveFacilityOwner]);

  const staffLimitReached = useMemo(
    () => isStaffLimitReached(usage, limits),
    [usage, limits],
  );

  const departmentLimitReached = useMemo(
    () => isDepartmentLimitReached(usage, limits),
    [usage, limits],
  );

  const visitLimitReached = useMemo(
    () => isVisitLimitReached(usage, limits),
    [usage, limits],
  );

  const filterModulesForPlan = useMemo(
    () =>
      (modules: Module[]): Module[] =>
        modules.filter(
          (module) =>
            module.code !== 'account' && allowedModuleCodes.includes(module.code),
        ),
    [allowedModuleCodes],
  );

  return {
    plan,
    usage,
    limits,
    allowedModuleCodes,
    staffLimitReached,
    departmentLimitReached,
    visitLimitReached,
    hasSubscriptionAccess,
    isActiveFacilityOwner,
    filterModulesForPlan,
    isLoading: subscriptionLoading || usageLoading,
  };
};
