export const TIER_FEATURES: Record<string, { features: string[]; gradient: string; cta: string }> = {
  essential: {
    features: [
      'Patient records & visits',
      'Clinical documentation (notes, diagnosis, vitals)',
      'Order lab tests, prescribe, admit to ward',
      'Billing, invoices & revenue',
      'Facility & team management',
      'Inventory & supplies',
      'Patient portal (self-service)',
      'Messaging center',
      'Custocare Hub (learning, community, support)',
      'Patient analytics',
    ],
    gradient: 'from-blue-600 to-blue-700',
    cta: 'Start Free Trial',
  },
  professional: {
    features: [
      'Everything in Essential',
      'Dedicated laboratory workspace — catalog, panels, results management',
      'Dedicated pharmacy workspace — dispensing, inventory, Rx workbench',
      'Dedicated nursing workspace — ward board, beds, med admin, tasks',
      'Dedicated clinical workspace — appointments, clinical documentation, scheduling',
    ],
    gradient: 'from-blue-600 to-emerald-600',
    cta: 'Start Free Trial',
  },
  enterprise: {
    features: [
      'Everything in Professional',
      'Referral management & network',
      'Ambulance fleet, dispatch & crew',
      'Priority support & dedicated account manager',
    ],
    gradient: 'from-purple-600 to-indigo-700',
    cta: 'Contact Sales',
  },
};

export const TIER_GRADIENT_BG: Record<string, string> = {
  essential: 'from-blue-600 to-blue-700',
  professional: 'from-blue-600 to-emerald-600',
  enterprise: 'from-purple-600 to-indigo-700',
};

export interface PlanLimitLabels {
  staff: string;
  depts: string;
  patients: string;
}

export const TIER_LIMIT_LABELS: Record<string, PlanLimitLabels> = {
  essential: { staff: '10 staff', depts: '3 departments', patients: '500 patients/month' },
  professional: { staff: '50 staff', depts: '10 departments', patients: '3,000 patients/month' },
  enterprise: { staff: 'Unlimited staff', depts: 'Unlimited departments', patients: 'Unlimited patients' },
};

export interface PlanLimitsShape {
  max_staff: number | null;
  max_departments: number | null;
  max_patients_per_month: number | null;
}

/** Display labels for plan cards/modals (tier catalog first, then API limits). */
export const getPlanLimitLabels = (
  slug: string,
  limits?: PlanLimitsShape | null,
): PlanLimitLabels => {
  const tier = TIER_LIMIT_LABELS[slug];
  if (tier) return tier;

  const fmt = (val: number | null | undefined, noun: string): string =>
    val === null || val === undefined ? `Unlimited ${noun}` : `${val} ${noun}`;

  return {
    staff: fmt(limits?.max_staff, 'staff'),
    depts: fmt(limits?.max_departments, 'departments'),
    patients: fmt(limits?.max_patients_per_month, 'patients'),
  };
};

/** Compact headline for plan cards (e.g. "10", "3,000", or "Unlimited"). */
export const planLimitHeadline = (label: string): string => {
  const trimmed = label.trim();
  if (!trimmed) return '—';
  if (/^unlimited/i.test(trimmed)) return 'Unlimited';
  return trimmed.split(/\s+/)[0] ?? '—';
};

export type CompareCheck = (features: string[]) => boolean;

const inherits = (f: string[]) => f.some(x => /^Everything in /i.test(x));

export interface CompareRow {
  label: string;
  check: CompareCheck;
}

export const COMPARISON_ROWS: CompareRow[] = [
  { label: 'Patient Records & Visits', check: () => true },
  { label: 'Clinical Documentation', check: () => true },
  { label: 'Lab Tests, Prescriptions, Admissions', check: () => true },
  { label: 'Billing & Revenue', check: () => true },
  { label: 'Facility & Team Management', check: () => true },
  { label: 'Inventory & Supplies', check: () => true },
  { label: 'Patient Portal', check: () => true },
  { label: 'Messaging', check: () => true },
  { label: 'Custocare Hub', check: () => true },
  { label: 'Lab Workspace', check: (f) => inherits(f) || f.some(x => /Dedicated laboratory/i.test(x)) },
  { label: 'Pharmacy Workspace', check: (f) => inherits(f) || f.some(x => /Dedicated pharmacy/i.test(x)) },
  { label: 'Nursing Workspace', check: (f) => inherits(f) || f.some(x => /Dedicated nursing/i.test(x)) },
  { label: 'Clinical Workspace', check: (f) => inherits(f) || f.some(x => /Dedicated clinical/i.test(x)) },
  { label: 'Referral Workspace', check: (f) => f.some(x => /Referral/i.test(x)) },
  { label: 'Ambulance Workspace', check: (f) => f.some(x => /Ambulance/i.test(x)) },
];

export const calcAnnualPrice = (monthly: number) => Math.round(monthly * 10 / 12);
