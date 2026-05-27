// shared/entitlements/entitlements.ts
// Keep aligned with Backend `App\Constants\Billing\PlanFeatures` and
// Frontend `Custocare_Pricing_Strategy.ipynb` §4 Technical Module Mapping.

export type PlanTier = 'essential' | 'professional' | 'enterprise';

export const TIER_RANK: Record<PlanTier, number> = {
  essential: 1,
  professional: 2,
  enterprise: 3,
};

export const tierLabel = (tier: PlanTier) => tier[0].toUpperCase() + tier.slice(1);

export const hasTier = (current: PlanTier, required: PlanTier) => TIER_RANK[current] >= TIER_RANK[required];

export type FeatureStatus = 'beta' | 'new' | 'deprecated';

/** Module codes aligned with Sidebar `moduleCode` and Backend `modules.code`. */
export type SubscriptionModuleCode =
  | 'medical_records'
  | 'administration'
  | 'billing'
  | 'account'
  | 'patient_dashboard'
  | 'custocare_hub'
  | 'nursing'
  | 'clinical'
  | 'laboratory'
  | 'pharmacy'
  | 'referrals'
  | 'ambulance';

/** Modules available on every tier (no subscription gate), including patient portal. */
export const ALWAYS_AVAILABLE_MODULES: readonly SubscriptionModuleCode[] = [
  'account',
  'custocare_hub',
  'patient_dashboard',
] as const;

/** Modules for facility owners when subscription is inactive (manage billing & team). */
export const OWNER_RESTRICTED_MODULES: readonly SubscriptionModuleCode[] = [
  'account',
  'custocare_hub',
  'administration',
] as const;

/** Minimum tier required to access a gated module workspace. */
export const MODULE_REQUIRED_TIER: Record<SubscriptionModuleCode, PlanTier | null> = {
  medical_records: 'essential',
  administration: 'essential',
  billing: 'essential',
  account: null,
  patient_dashboard: 'essential',
  custocare_hub: null,
  nursing: 'professional',
  clinical: 'professional',
  laboratory: 'professional',
  pharmacy: 'professional',
  referrals: 'enterprise',
  ambulance: 'enterprise',
};

/** Default enabled modules per plan slug (mirrors PlanFeatures::defaultFeatureFlagsForPlan). */
export const PLAN_ENABLED_MODULES: Record<PlanTier, readonly SubscriptionModuleCode[]> = {
  essential: [
    'medical_records',
    'administration',
    'billing',
    'account',
    'patient_dashboard',
    'custocare_hub',
  ],
  professional: [
    'medical_records',
    'administration',
    'billing',
    'account',
    'patient_dashboard',
    'custocare_hub',
    'nursing',
    'clinical',
    'laboratory',
    'pharmacy',
  ],
  enterprise: [
    'medical_records',
    'administration',
    'billing',
    'account',
    'patient_dashboard',
    'custocare_hub',
    'nursing',
    'clinical',
    'laboratory',
    'pharmacy',
    'referrals',
    'ambulance',
  ],
};

export const intersectRoleModulesWithPlan = (
  roleModuleCodes: readonly string[],
  planModuleCodes: readonly string[],
): string[] => {
  const intersected = roleModuleCodes.filter((code) => planModuleCodes.includes(code));
  for (const code of ALWAYS_AVAILABLE_MODULES) {
    if (!intersected.includes(code)) {
      intersected.push(code);
    }
  }
  return intersected;
};

const MODULE_FEATURE_CODES: readonly SubscriptionModuleCode[] = [
  'medical_records',
  'administration',
  'billing',
  'patient_dashboard',
  'custocare_hub',
  'nursing',
  'clinical',
  'laboratory',
  'pharmacy',
  'referrals',
  'ambulance',
];

/** Resolve enabled module codes from a plan resource (features JSON preferred, slug fallback). */
export const getPlanEnabledModuleCodesFromPlan = (
  plan?: { slug?: string; features?: Record<string, boolean | unknown> } | null,
): readonly string[] => {
  if (!plan) {
    return ALWAYS_AVAILABLE_MODULES;
  }

  if (plan.features && typeof plan.features === 'object') {
    const enabled = MODULE_FEATURE_CODES.filter((code) => plan.features?.[code] === true);
    return intersectRoleModulesWithPlan(enabled, ALWAYS_AVAILABLE_MODULES);
  }

  const slug = plan.slug as PlanTier | undefined;
  if (slug && PLAN_ENABLED_MODULES[slug]) {
    return PLAN_ENABLED_MODULES[slug];
  }

  return ALWAYS_AVAILABLE_MODULES;
};

export const isStaffLimitReached = (
  usage?: { staff?: number } | null,
  limits?: { max_staff?: number | null } | null,
): boolean => {
  const maxStaff = limits?.max_staff;
  if (maxStaff == null) {
    return false;
  }
  return (usage?.staff ?? 0) >= maxStaff;
};

export const isDepartmentLimitReached = (
  usage?: { departments?: number } | null,
  limits?: { max_departments?: number | null } | null,
): boolean => {
  const max = limits?.max_departments;
  if (max == null) return false;
  return (usage?.departments ?? 0) >= max;
};

export const isVisitLimitReached = (
  usage?: { visits?: number } | null,
  limits?: { max_visits_per_month?: number | null } | null,
): boolean => {
  const max = limits?.max_visits_per_month;
  if (max == null) return false;
  return (usage?.visits ?? 0) >= max;
};
