/**
 * Canonical plan feature keys — keep aligned with Backend `App\Constants\Billing\PlanFeatures`.
 * Used by platform-admin plan CRUD and entitlements resolution.
 */

export type PlanFeatureGroup = 'module' | 'addon';

export interface PlanFeatureDefinition {
  key: string;
  label: string;
  description: string;
  group: PlanFeatureGroup;
}

/** Gated workspace modules (maps to `modules.code`). */
export const PLAN_MODULE_FEATURE_CODES = [
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
] as const;

/** Plan capability flags stored in `plans.features` JSON. */
export const PLAN_ADDON_FEATURE_CODES = [
  'messaging_center',
  'api_access',
  'analytics_dashboards',
  'audit_logs',
] as const;

export const ALL_PLAN_FEATURE_KEYS: readonly string[] = [
  ...PLAN_MODULE_FEATURE_CODES,
  ...PLAN_ADDON_FEATURE_CODES,
];

export const PLAN_FEATURE_CATALOG: readonly PlanFeatureDefinition[] = [
  { key: 'medical_records', label: 'Medical Records', description: 'Patient registry, queue, and encounters', group: 'module' },
  { key: 'administration', label: 'Administration', description: 'Facility governance, team, and setup', group: 'module' },
  { key: 'billing', label: 'Billing', description: 'Facility billing and revenue workflows', group: 'module' },
  { key: 'account', label: 'Account', description: 'User profile and account settings', group: 'module' },
  { key: 'patient_dashboard', label: 'Patient Portal', description: 'Patient-facing health dashboard', group: 'module' },
  { key: 'custocare_hub', label: 'Custocare Hub', description: 'Learning, support, and product updates', group: 'module' },
  { key: 'nursing', label: 'Nursing', description: 'Ward care, medications, and nursing tasks', group: 'module' },
  { key: 'clinical', label: 'Clinical', description: 'Consultations and clinical workflows', group: 'module' },
  { key: 'laboratory', label: 'Laboratory', description: 'Lab requests, results, and diagnostics', group: 'module' },
  { key: 'pharmacy', label: 'Pharmacy', description: 'Dispensing and pharmacy inventory', group: 'module' },
  { key: 'referrals', label: 'Referrals', description: 'Referral network and transfers', group: 'module' },
  { key: 'ambulance', label: 'Ambulance', description: 'Fleet and emergency transport', group: 'module' },
  { key: 'messaging_center', label: 'Messaging Center', description: 'Internal messaging and notifications', group: 'addon' },
  { key: 'api_access', label: 'API Access', description: 'External integrations via API', group: 'addon' },
  { key: 'analytics_dashboards', label: 'Analytics Dashboards', description: 'Advanced analytics and reporting', group: 'addon' },
  { key: 'audit_logs', label: 'Audit Logs', description: 'Full activity audit trail', group: 'addon' },
];

const catalogByKey = new Map(PLAN_FEATURE_CATALOG.map((f) => [f.key, f]));

export function getPlanFeatureDefinition(key: string): PlanFeatureDefinition | undefined {
  return catalogByKey.get(key);
}

export function createEmptyPlanFeaturesFormState(): Record<string, boolean> {
  return Object.fromEntries(ALL_PLAN_FEATURE_KEYS.map((key) => [key, false]));
}

/** Hydrate form toggles from API plan; ignores unknown legacy keys. */
export function planFeaturesToFormState(
  features: Record<string, boolean | unknown> | null | undefined,
): Record<string, boolean> {
  const state = createEmptyPlanFeaturesFormState();
  if (!features) {
    return state;
  }
  for (const key of ALL_PLAN_FEATURE_KEYS) {
    if (key in features) {
      state[key] = Boolean(features[key]);
    }
  }
  return state;
}

/** Payload accepted by StorePlanRequest / UpdatePlanRequest. */
export function buildPlanFeaturesPayload(
  formFeatures: Record<string, boolean>,
): Record<string, boolean> {
  const payload: Record<string, boolean> = {};
  for (const key of ALL_PLAN_FEATURE_KEYS) {
    payload[key] = Boolean(formFeatures[key]);
  }
  return payload;
}

export function countEnabledPlanFeatures(
  features: Record<string, boolean | unknown> | null | undefined,
): number {
  if (!features) {
    return 0;
  }
  return ALL_PLAN_FEATURE_KEYS.filter((key) => Boolean(features[key])).length;
}
