import type {
  Facility,
  FacilityLocation,
  PatientStatus,
  PeriodFilter,
} from '../../statistics/api/platform-control/PlatformControlTypes';

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const PERIOD_OPTIONS: Array<{ label: string; value: PeriodFilter }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
];

export const FACILITY_STATUS_OPTIONS: Array<{
  label: string;
  value: Facility['status'];
}> = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned', value: 'banned' },
];

export const FACILITY_OPERATIONAL_STATUS_OPTIONS: Array<{
  label: string;
  value: Facility['operational_status'];
}> = [
  { label: 'Fully Operational', value: 'fully_operational' },
  { label: 'Limited Services', value: 'limited_services' },
  { label: 'Emergency Only', value: 'emergency_only' },
  { label: 'Temporarily Closed', value: 'temporarily_closed' },
  { label: 'Permanently Closed', value: 'permanently_closed' },
  { label: 'Under Construction', value: 'under_construction' },
];

export const PATIENT_STATUS_OPTIONS: Array<{
  label: string;
  value: PatientStatus;
}> = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Deceased', value: 'deceased' },
  { label: 'Merged', value: 'merged' },
  { label: 'Test Patient', value: 'test_patient' },
  { label: 'System Patient', value: 'system_patient' },
];

export const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('en-US').format(Number(value ?? 0));

export const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export const formatDate = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatStatusLabel = (value?: string | null) => {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const safeText = (value?: string | null, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : fallback;
};

export const getInitials = (value?: string | null) => {
  const text = safeText(value, '');
  if (!text) return '—';

  const parts = text.split(' ').filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join('') || '—';
};

export const formatAddress = (location?: FacilityLocation | null) => {
  if (!location) return '—';

  return [
    location.address_line1,
    location.address_line2,
    location.city,
    location.state_province,
    location.postal_code,
    location.country_code,
  ]
    .filter(Boolean)
    .join(', ');
};

export const getPageShellClass = (isDark: boolean) =>
  cn(
    'min-h-screen w-full p-4 md:p-6 xl:p-8',
    isDark
      ? 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,#020617_0%,#0F172A_100%)] text-white'
      : 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_22%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] text-slate-900'
  );

export const getPanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border backdrop-blur-xl shadow-[0_14px_45px_-24px_rgba(15,23,42,0.45)]',
    isDark ? 'border-white/10 bg-slate-900/60' : 'border-white/70 bg-white/85'
  );

export const getSubtlePanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border backdrop-blur-xl',
    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200/80 bg-white/80'
  );

export const getFacilityStatusStyles = (
  status: Facility['status'],
  isDark: boolean
) => {
  switch (status) {
    case 'active':
      return isDark
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'suspended':
      return isDark
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : 'border-amber-200 bg-amber-50 text-amber-700';
    case 'banned':
      return isDark
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
        : 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return isDark
        ? 'border-slate-500/20 bg-slate-500/10 text-slate-300'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export const getOperationalStatusStyles = (
  status: Facility['operational_status'],
  isDark: boolean
) => {
  switch (status) {
    case 'fully_operational':
      return isDark
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'limited_services':
      return isDark
        ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
        : 'border-sky-200 bg-sky-50 text-sky-700';
    case 'emergency_only':
      return isDark
        ? 'border-violet-500/20 bg-violet-500/10 text-violet-300'
        : 'border-violet-200 bg-violet-50 text-violet-700';
    case 'temporarily_closed':
      return isDark
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : 'border-amber-200 bg-amber-50 text-amber-700';
    case 'permanently_closed':
      return isDark
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
        : 'border-rose-200 bg-rose-50 text-rose-700';
    case 'under_construction':
      return isDark
        ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
        : 'border-cyan-200 bg-cyan-50 text-cyan-700';
    default:
      return isDark
        ? 'border-slate-500/20 bg-slate-500/10 text-slate-300'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export const getPatientStatusStyles = (status: PatientStatus, isDark: boolean) => {
  switch (status) {
    case 'active':
      return isDark
        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'inactive':
      return isDark
        ? 'border-slate-500/20 bg-slate-500/10 text-slate-300'
        : 'border-slate-200 bg-slate-50 text-slate-700';
    case 'deceased':
      return isDark
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
        : 'border-rose-200 bg-rose-50 text-rose-700';
    case 'merged':
      return isDark
        ? 'border-violet-500/20 bg-violet-500/10 text-violet-300'
        : 'border-violet-200 bg-violet-50 text-violet-700';
    case 'test_patient':
      return isDark
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : 'border-amber-200 bg-amber-50 text-amber-700';
    case 'system_patient':
      return isDark
        ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
        : 'border-sky-200 bg-sky-50 text-sky-700';
    default:
      return isDark
        ? 'border-slate-500/20 bg-slate-500/10 text-slate-300'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  }
};
