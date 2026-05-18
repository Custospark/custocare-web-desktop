/**
 * Single source of truth for post-login / dashboard redirect priority and routes.
 * Keep aligned with Backend `modules` seeder and Sidebar `moduleCode` values.
 */
import {
  ROUTES,
  MEDICAL_RECORDS_ROUTES,
  CLINICAL_ROUTES,
  NURSING_ROUTES,
  LABORATORY_ROUTES,
  PHARMACY_ROUTES,
  BILLING_ROUTES,
  ACCOUNT_ROUTES,
  PATIENT_PORTAL_ROUTES,
  CUSTOCARE_HUB_ROUTES,
} from './routeConstants';
import { ADMIN_ROUTES } from './constants/administration.paths';
import { PLATFORM_ADMIN_ROUTES } from './constants/platform-administration.paths';
import { AMBULANCE_ROUTES } from './constants/ambulance.paths';
import { REFERRAL_ROUTES } from './constants/referral.paths';

export type DashboardModuleCode =
  | 'medical_records'
  | 'clinical'
  | 'nursing'
  | 'laboratory'
  | 'pharmacy'
  | 'ambulance'
  | 'referrals'
  | 'billing'
  | 'administration'
  | 'platform_administration'
  | 'custocare_hub'
  | 'patient_dashboard'
  | 'account';

export interface DashboardModuleEntry {
  code: DashboardModuleCode;
  route: string;
  loadingMessage: string;
}

/** Clinical / operational modules first; account is always last fallback. */
export const DASHBOARD_MODULE_PRIORITY: readonly DashboardModuleCode[] = [
  'medical_records',
  'clinical',
  'nursing',
  'laboratory',
  'pharmacy',
  'ambulance',
  'referrals',
  'billing',
  'administration',
  'platform_administration',
  'custocare_hub',
  'patient_dashboard',
  'account',
] as const;

const MODULE_ENTRIES: Record<DashboardModuleCode, Omit<DashboardModuleEntry, 'code'>> = {
  medical_records: {
    route: MEDICAL_RECORDS_ROUTES.OVERVIEW,
    loadingMessage: 'Loading front desk...',
  },
  clinical: {
    route: CLINICAL_ROUTES.OVERVIEW,
    loadingMessage: 'Loading clinical workspace...',
  },
  nursing: {
    route: NURSING_ROUTES.OVERVIEW,
    loadingMessage: 'Loading nursing care...',
  },
  laboratory: {
    route: LABORATORY_ROUTES.OVERVIEW,
    loadingMessage: 'Loading laboratory...',
  },
  pharmacy: {
    route: PHARMACY_ROUTES.OVERVIEW,
    loadingMessage: 'Loading pharmacy...',
  },
  ambulance: {
    route: AMBULANCE_ROUTES.OVERVIEW,
    loadingMessage: 'Loading ambulance services...',
  },
  referrals: {
    route: REFERRAL_ROUTES.OVERVIEW,
    loadingMessage: 'Loading referrals...',
  },
  billing: {
    route: BILLING_ROUTES.OVERVIEW,
    loadingMessage: 'Loading billing & finance...',
  },
  administration: {
    route: ADMIN_ROUTES.OVERVIEW,
    loadingMessage: 'Loading administration...',
  },
  platform_administration: {
    route: PLATFORM_ADMIN_ROUTES.PLATFORM_FACILITY_GOVERNANCE,
    loadingMessage: 'Loading platform administration...',
  },
  custocare_hub: {
    route: CUSTOCARE_HUB_ROUTES.LEARNING_CENTER,
    loadingMessage: 'Loading Custocare Hub...',
  },
  patient_dashboard: {
    route: PATIENT_PORTAL_ROUTES.OVERVIEW,
    loadingMessage: 'Loading health dashboard...',
  },
  account: {
    route: ACCOUNT_ROUTES.SETTINGS_PROFILE,
    loadingMessage: 'Loading account settings...',
  },
};

export const getDashboardModuleEntry = (code: DashboardModuleCode): DashboardModuleEntry => ({
  code,
  ...MODULE_ENTRIES[code],
});

export interface ResolveDashboardModuleOptions {
  accessibleModuleCodes: readonly string[];
  isPatientMode?: boolean;
  activeCapability?: string | null;
}

/**
 * Pick the first module the user can access, respecting priority order.
 */
export const resolveDashboardModule = (
  options: ResolveDashboardModuleOptions
): DashboardModuleCode => {
  const { accessibleModuleCodes, isPatientMode = false, activeCapability = null } = options;

  if (isPatientMode) {
    return 'patient_dashboard';
  }

  if (
    activeCapability === 'super_admin' &&
    accessibleModuleCodes.includes('platform_administration')
  ) {
    return 'platform_administration';
  }

  for (const moduleCode of DASHBOARD_MODULE_PRIORITY) {
    if (accessibleModuleCodes.includes(moduleCode)) {
      return moduleCode;
    }
  }

  return 'account';
};

export const getDefaultDashboardRoute = (
  accessibleModuleCodes: readonly string[],
  options: Omit<ResolveDashboardModuleOptions, 'accessibleModuleCodes'> = {}
): string => {
  if (!accessibleModuleCodes.length) {
    return options.isPatientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD;
  }

  const moduleCode = resolveDashboardModule({ accessibleModuleCodes, ...options });
  return getDashboardModuleEntry(moduleCode).route;
};

export const getDashboardLoadingMessage = (
  moduleCode: DashboardModuleCode,
  activeCapability?: string | null
): string => {
  if (activeCapability && activeCapability !== 'patient' && activeCapability !== 'staff') {
    return `Loading ${activeCapability.replace(/_/g, ' ')} workspace...`;
  }
  return MODULE_ENTRIES[moduleCode].loadingMessage;
};
