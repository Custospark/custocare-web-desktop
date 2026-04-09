import {
  AlertTriangle,
  CircleAlert,
  Clock3,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  DashboardAlert,
  DashboardPeriod,
} from '../../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const PERIOD_OPTIONS: Array<{ label: string; value: DashboardPeriod }> = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

export const PIE_COLORS = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

export const AGE_COLORS = [
  '#2563EB',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
];

export type AccentTone = 'blue' | 'green' | 'amber' | 'violet' | 'rose';

export const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('en-US').format(Number(value ?? 0));

export const formatPercent = (value?: number | null, digits = 1) =>
  `${Number(value ?? 0).toFixed(digits)}%`;

export const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const formatCompactCurrency = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

export const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatFullDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getTrendMeta = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return {
        icon: TrendingUp,
        textClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10',
        label: 'Up',
      };
    case 'down':
      return {
        icon: TrendingDown,
        textClass: 'text-rose-500',
        bgClass: 'bg-rose-500/10',
        label: 'Down',
      };
    default:
      return {
        icon: Minus,
        textClass: 'text-slate-500',
        bgClass: 'bg-slate-500/10',
        label: 'Stable',
      };
  }
};

export const getSeverityStyles = (
  severity: DashboardAlert['severity'],
  isDark: boolean
) => {
  switch (severity) {
    case 'danger':
      return isDark
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : 'border-rose-200 bg-rose-50 text-rose-700';
    case 'warning':
      return isDark
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return isDark
        ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
        : 'border-sky-200 bg-sky-50 text-sky-700';
  }
};

export const getAlertTypeLabel = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'high_waiting_time':
      return 'High Waiting Time';
    case 'high_missed_rate':
      return 'High Missed Rate';
    case 'patient_drop':
      return 'Patient Volume Drop';
    case 'overcrowding':
      return 'Overcrowding';
    default:
      return type;
  }
};

export const getAlertIcon = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'high_waiting_time':
      return Clock3;
    case 'high_missed_rate':
      return AlertTriangle;
    case 'patient_drop':
      return TrendingDown;
    case 'overcrowding':
      return Users;
    default:
      return CircleAlert;
  }
};

export const getPageShellClass = (isDark: boolean) =>
  cn(
    'min-h-screen w-full p-4 md:p-6 xl:p-8',
    isDark
      ? 'bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_28%),linear-gradient(180deg,#020617_0%,#0B1120_100%)] text-white'
      : 'bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_24%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] text-slate-900'
  );

export const getPanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border backdrop-blur-xl shadow-[0_12px_40px_-24px_rgba(15,23,42,0.55)]',
    isDark ? 'border-white/10 bg-slate-900/60' : 'border-white/70 bg-white/85'
  );

export const getSubtlePanelClass = (isDark: boolean) =>
  cn(
    'rounded-3xl border backdrop-blur-xl',
    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200/80 bg-white/80'
  );
