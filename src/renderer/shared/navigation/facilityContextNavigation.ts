import { ROUTES } from '../../app/routes/routeConstants';
import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../app/routes/constants/administration.paths';
import type {
  FacilityRole,
  StaffFacilityAssignment,
} from '../../app/store/slices/activeContextSlice';

export type StaffFacilitySubscriptionFlags = {
  hasAccess: boolean;
  isOwner: boolean;
  isRestricted: boolean;
};

export type FacilitySwitchToast = {
  type: 'success' | 'info' | 'warning';
  message: string;
};

export function getStaffFacilitySubscriptionFlags(
  facility: StaffFacilityAssignment | null | undefined,
): StaffFacilitySubscriptionFlags {
  return {
    hasAccess: facility?.has_subscription_access === true,
    isOwner: facility?.is_facility_owner === true,
    isRestricted: facility?.is_restricted === true,
  };
}

/** Merge Redux facility assignment with portal/workspace role flags (role wins when set). */
export function mergeStaffFacilityContext(
  facility: StaffFacilityAssignment | null | undefined,
  role?: FacilityRole | null,
): StaffFacilityAssignment | null {
  if (!facility && !role) {
    return null;
  }

  const facilityId = role?.facility_id ?? facility?.facility_id ?? 0;

  return {
    facility_id: facilityId,
    facility_name: role?.facility_name ?? facility?.facility_name ?? '',
    facility_code: facility?.facility_code ?? '',
    role_code: role?.role_code ?? facility?.role_code ?? '',
    modules: facility?.modules ?? [],
    is_facility_owner: role?.is_facility_owner ?? facility?.is_facility_owner,
    has_subscription_access:
      role?.has_subscription_access ?? facility?.has_subscription_access,
    is_restricted: role?.is_restricted ?? facility?.is_restricted,
    subscription_status: role?.subscription_status ?? facility?.subscription_status,
    facility_logo_path: facility?.facility_logo_path,
  };
}

/** Where staff should land after selecting or switching to a facility workspace. */
export function resolveStaffFacilityLandingPath(
  facility: StaffFacilityAssignment | null | undefined,
): string {
  const { hasAccess, isOwner, isRestricted } = getStaffFacilitySubscriptionFlags(facility);

  if (isRestricted) {
    return ROUTES.DASHBOARD;
  }

  if (!hasAccess && isOwner) {
    return ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS;
  }

  if (!hasAccess) {
    return ROUTES.DASHBOARD;
  }

  return ROUTES.DASHBOARD;
}

export function getStaffFacilitySwitchToast(
  facility: StaffFacilityAssignment | null | undefined,
  facilityName: string,
  roleLabel: string,
): FacilitySwitchToast | null {
  const { hasAccess, isOwner, isRestricted } = getStaffFacilitySubscriptionFlags(facility);

  if (isRestricted) {
    return {
      type: 'warning',
      message: `${facilityName} is suspended or banned.`,
    };
  }

  if (!hasAccess && isOwner) {
    return {
      type: 'info',
      message: 'Your facility subscription is inactive. Manage your plan to restore full access.',
    };
  }

  if (!hasAccess) {
    return {
      type: 'info',
      message:
        'This facility does not have an active subscription. Limited access is available until your administrator renews the plan.',
    };
  }

  return {
    type: 'success',
    message: `Switched to ${roleLabel} at ${facilityName}`,
  };
}
