import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  Clock3,
  DollarSign,
  HeartPulse,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';

import { useDashboardOverview } from '../../api/facility-patient-analytics/FacilityPatientAnalyticsQueries';

import type {
  DashboardAlert,
  DashboardPeriod,
  DashboardQueryParams,
} from '../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ThemeRootState {
  ui?: {
    theme?: 'light' | 'dark';
  };
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const PERIOD_OPTIONS: Array<{ label: string; value: DashboardPeriod }> = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const AGE_COLORS = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('en-US').format(Number(value ?? 0));

const formatPercent = (value?: number | null, digits = 1) =>
  `${Number(value ?? 0).toFixed(digits)}%`;

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const formatCompactCurrency = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatFullDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTrendMeta = (trend?: 'up' | 'down' | 'stable') => {
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

const getSeverityStyles = (severity: DashboardAlert['severity'], isDark: boolean) => {
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

const getAlertTypeLabel = (type: DashboardAlert['type']) => {
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

const getAlertIcon = (type: DashboardAlert['type']) => {
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

/* -------------------------------------------------------------------------- */
/*                           REUSABLE UI PIECES                               */
/* -------------------------------------------------------------------------- */

const EmptyChartState: React.FC<{ title: string; subtitle: string; isDark: boolean }> = ({
  title,
  subtitle,
  isDark,
}) => (
  <div
    className={cn(
      'flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed',
      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
    )}
  >
    <div className="px-6 text-center">
      <div
        className={cn(
          'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl',
          isDark ? 'bg-white/5' : 'bg-white'
        )}
      >
        <Workflow className={cn('h-6 w-6', isDark ? 'text-slate-400' : 'text-slate-500')} />
      </div>
      <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
        {title}
      </h4>
      <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
        {subtitle}
      </p>
    </div>
  </div>
);

const EnterpriseTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark: boolean;
  labelFormatter?: (value: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}> = ({ active, payload, label, isDark, labelFormatter, valueFormatter }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
        isDark
          ? 'border-white/10 bg-slate-900/95 text-slate-100'
          : 'border-slate-200 bg-white/95 text-slate-900'
      )}
    >
      {label && (
        <div className={cn('mb-2 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}

      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill || '#2563EB' }}
              />
              <span className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-semibold">
              {valueFormatter ? valueFormatter(Number(entry.value ?? 0), entry.name) : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressRow: React.FC<{
  label: string;
  value: number;
  isDark: boolean;
  tone?: 'blue' | 'green' | 'amber' | 'rose' | 'violet';
  suffix?: string;
}> = ({ label, value, isDark, tone = 'blue', suffix = '%' }) => {
  const toneMap = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    rose: 'from-rose-500 to-pink-400',
    violet: 'from-violet-500 to-fuchsia-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
        <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          {Number(value ?? 0).toFixed(1)}
          {suffix}
        </span>
      </div>

      <div className={cn('h-2 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', toneMap[tone])}
          style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
        />
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  isDark: boolean;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: 'blue' | 'green' | 'amber' | 'violet' | 'rose';
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
}> = ({ isDark, title, value, subtitle, icon: Icon, accent, trend, delta }) => {
  const accentMap = {
    blue: {
      soft: isDark ? 'from-blue-500/10 to-cyan-500/5' : 'from-blue-50 to-cyan-50',
      ring: isDark ? 'border-blue-500/20' : 'border-blue-200/70',
      icon: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700',
      glow: 'bg-blue-500/20',
    },
    green: {
      soft: isDark ? 'from-emerald-500/10 to-teal-500/5' : 'from-emerald-50 to-teal-50',
      ring: isDark ? 'border-emerald-500/20' : 'border-emerald-200/70',
      icon: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
      glow: 'bg-emerald-500/20',
    },
    amber: {
      soft: isDark ? 'from-amber-500/10 to-orange-500/5' : 'from-amber-50 to-orange-50',
      ring: isDark ? 'border-amber-500/20' : 'border-amber-200/70',
      icon: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700',
      glow: 'bg-amber-500/20',
    },
    violet: {
      soft: isDark ? 'from-violet-500/10 to-fuchsia-500/5' : 'from-violet-50 to-fuchsia-50',
      ring: isDark ? 'border-violet-500/20' : 'border-violet-200/70',
      icon: isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700',
      glow: 'bg-violet-500/20',
    },
    rose: {
      soft: isDark ? 'from-rose-500/10 to-pink-500/5' : 'from-rose-50 to-pink-50',
      ring: isDark ? 'border-rose-500/20' : 'border-rose-200/70',
      icon: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-700',
      glow: 'bg-rose-500/20',
    },
  };

  const trendMeta = getTrendMeta(trend);
  const TrendIcon = trendMeta.icon;
  const palette = accentMap[accent];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl',
        'bg-gradient-to-br',
        palette.soft,
        palette.ring
      )}
    >
      <div className={cn('absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl', palette.glow)} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{title}</p>
          <div className={cn('mt-3 text-3xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-950')}>
            {value}
          </div>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>{subtitle}</p>

          {typeof delta === 'number' && trend && (
            <div className="mt-4 flex items-center gap-2">
              <div className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', trendMeta.bgClass)}>
                <TrendIcon className={cn('h-3.5 w-3.5', trendMeta.textClass)} />
                <span className={trendMeta.textClass}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)}%
                </span>
              </div>
              <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                vs previous period
              </span>
            </div>
          )}
        </div>

        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', palette.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

function MedicalRecordsDashboard() {
  const theme = useSelector((state: ThemeRootState) => state.ui?.theme ?? 'light');
  const isDark = theme === 'dark';

  const [appliedParams, setAppliedParams] = useState<DashboardQueryParams>({ period: 'week' });
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardOverview(appliedParams);

  const dashboard = response?.data;

  const trendSeries = useMemo(() => {
    const daily = dashboard?.patient_trends.daily ?? [];
    const newGrowth = dashboard?.patient_trends.new_patient_growth ?? [];

    const growthMap = new Map(newGrowth.map((item) => [item.date, item.new_patients]));

    return daily.map((item) => ({
      label: formatDateLabel(item.date),
      patients: item.patients,
      newPatients: growthMap.get(item.date) ?? 0,
      rawDate: item.date,
    }));
  }, [dashboard?.patient_trends.daily, dashboard?.patient_trends.new_patient_growth]);

  const weeklySeries = useMemo(
    () =>
      (dashboard?.patient_trends.weekly ?? []).map((item) => ({
        week: item.week,
        patients: item.patients,
      })),
    [dashboard?.patient_trends.weekly]
  );

  const ageGroups = useMemo(
    () =>
      (dashboard?.demographics.age_groups ?? []).map((item, index) => ({
        ...item,
        fill: AGE_COLORS[index % AGE_COLORS.length],
      })),
    [dashboard?.demographics.age_groups]
  );

  const genderDistribution = useMemo(
    () =>
      (dashboard?.demographics.gender_distribution ?? []).map((item, index) => ({
        ...item,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [dashboard?.demographics.gender_distribution]
  );

  const insuranceVsCash = useMemo(() => {
    const data = dashboard?.demographics.insurance_vs_cash;
    if (!data) return [];

    return [
      { name: 'Insurance', value: data.insurance, fill: '#2563EB' },
      { name: 'Cash', value: data.cash, fill: '#10B981' },
    ];
  }, [dashboard?.demographics.insurance_vs_cash]);

  const visitTypes = useMemo(
    () =>
      [...(dashboard?.visit_types.visit_types ?? [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [dashboard?.visit_types.visit_types]
  );

  const topConditions = useMemo(
    () =>
      [...(dashboard?.visit_types.most_treated_conditions ?? [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    [dashboard?.visit_types.most_treated_conditions]
  );

  const topServices = useMemo(
    () =>
      [...(dashboard?.revenue.top_paying_services ?? [])]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
    [dashboard?.revenue.top_paying_services]
  );

  const peakDay = useMemo(() => {
    const all = dashboard?.patient_trends.peak_days ?? [];
    if (!all.length) return null;
    return [...all].sort((a, b) => b.count - a.count)[0];
  }, [dashboard?.patient_trends.peak_days]);

  const averageDailyPatients = useMemo(() => {
    if (!trendSeries.length) return 0;
    const total = trendSeries.reduce((sum, item) => sum + item.patients, 0);
    return total / trendSeries.length;
  }, [trendSeries]);

  const totalNewPatients = useMemo(
    () => trendSeries.reduce((sum, item) => sum + item.newPatients, 0),
    [trendSeries]
  );

  const largestAgeGroup = useMemo(() => {
    if (!ageGroups.length) return null;
    return [...ageGroups].sort((a, b) => b.count - a.count)[0];
  }, [ageGroups]);

  const handleSelectPeriod = (value: DashboardPeriod) => {
    setSelectedPeriod(value);

    if (value !== 'custom') {
      setAppliedParams({ period: value });
    }
  };

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    setAppliedParams({
      period: 'custom',
      date_from: customFrom,
      date_to: customTo,
    });
  };

  const pageShell = cn(
    'min-h-screen w-full p-4 md:p-6 xl:p-8',
    isDark
      ? 'bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_28%),linear-gradient(180deg,#020617_0%,#0B1120_100%)] text-white'
      : 'bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),_transparent_24%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)] text-slate-900'
  );

  const panelClass = cn(
    'rounded-3xl border backdrop-blur-xl shadow-[0_12px_40px_-24px_rgba(15,23,42,0.55)]',
    isDark ? 'border-white/10 bg-slate-900/60' : 'border-white/70 bg-white/85'
  );

  const subtlePanelClass = cn(
    'rounded-3xl border backdrop-blur-xl',
    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200/80 bg-white/80'
  );

  if (isLoading) {
    return (
      <div className={pageShell}>
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className={cn(panelClass, 'p-6 md:p-8')}>
            <div className="animate-pulse space-y-4">
              <div className={cn('h-8 w-72 rounded-xl', isDark ? 'bg-white/10' : 'bg-slate-200')} />
              <div className={cn('h-4 w-96 rounded-xl', isDark ? 'bg-white/5' : 'bg-slate-100')} />
              <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-40 rounded-3xl border animate-pulse',
                      isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className={cn(panelClass, 'xl:col-span-8 h-[420px] animate-pulse')} />
            <div className={cn(panelClass, 'xl:col-span-4 h-[420px] animate-pulse')} />
            <div className={cn(panelClass, 'xl:col-span-6 h-[420px] animate-pulse')} />
            <div className={cn(panelClass, 'xl:col-span-6 h-[420px] animate-pulse')} />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={pageShell}>
        <div className="mx-auto max-w-[1600px]">
          <div className={cn(panelClass, 'p-10')}>
            <div className="mx-auto max-w-lg text-center">
              <div
                className={cn(
                  'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl',
                  isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'
                )}
              >
                <CircleAlert className="h-8 w-8" />
              </div>
              <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Unable to load dashboard
              </h2>
              <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {error?.message || 'Something went wrong while fetching dashboard analytics.'}
              </p>

              <button
                onClick={() => refetch()}
                className={cn(
                  'mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard || response?.success === false) {
    return (
      <div className={pageShell}>
        <div className="mx-auto max-w-[1600px]">
          <div className={cn(panelClass, 'p-10')}>
            <div className="mx-auto max-w-lg text-center">
              <div
                className={cn(
                  'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl',
                  isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Workflow className="h-8 w-8" />
              </div>
              <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                No dashboard data available
              </h2>
              <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {response?.message || 'No analytics payload was returned for the selected period.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const kpi = dashboard.kpi;
  const flow = dashboard.patient_flow;
  const retention = dashboard.retention;
  const revenue = dashboard.revenue;
  const alerts = dashboard.alerts ?? [];

  const headlineMetrics = [
    {
      title: 'Total Patients',
      value: formatNumber(kpi.total_patients.value),
      subtitle: `Previous: ${formatNumber(kpi.total_patients.previous_value)}`,
      icon: Users,
      accent: 'blue' as const,
      trend: kpi.total_patients.trend,
      delta: kpi.total_patients.change_percentage,
    },
    {
      title: 'New Patient Rate',
      value: formatPercent(kpi.new_vs_returning.new_rate),
      subtitle: `${formatNumber(kpi.new_vs_returning.new)} new • ${formatNumber(kpi.new_vs_returning.returning)} returning`,
      icon: UserPlus,
      accent: 'violet' as const,
    },
    {
      title: 'Active Visits',
      value: formatNumber(kpi.active_visits),
      subtitle: 'Current open patient activity',
      icon: Activity,
      accent: 'amber' as const,
    },
    {
      title: 'Completed Visits',
      value: formatNumber(kpi.completed_visits),
      subtitle: 'Visits closed in selected period',
      icon: CheckCircle2,
      accent: 'green' as const,
    },
    {
      title: 'Cancelled / Missed',
      value: formatNumber(kpi.cancelled_missed),
      subtitle: 'Retention opportunity queue',
      icon: AlertTriangle,
      accent: 'rose' as const,
    },
  ];

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={cn(panelClass, 'relative overflow-hidden p-6 md:p-8')}
        >
          <div className={cn('absolute inset-0 opacity-70', isDark ? 'bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%)]' : 'bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_28%)]')} />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
                <span className={cn('h-2 w-2 rounded-full', isFetching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
                Facility patient intelligence
              </div>

              <h1 className={cn('text-3xl font-bold tracking-tight md:text-4xl', isDark ? 'text-white' : 'text-slate-950')}>
                Medical Records & Patient Analytics Dashboard
              </h1>

              <p className={cn('mt-3 max-w-2xl text-sm md:text-base', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Executive-grade visibility into patient volume, care flow, retention, demographics, visit composition, and revenue performance — powered directly by the facility analytics API.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
                  <CalendarRange className="h-4 w-4" />
                  <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                    {dashboard.period.label} • {formatFullDate(dashboard.period.start_date)} — {formatFullDate(dashboard.period.end_date)}
                  </span>
                </div>

                <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
                  <HeartPulse className="h-4 w-4" />
                  <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                    Avg wait {formatNumber(flow.average_waiting_minutes)} min
                  </span>
                </div>

                <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
                  <DollarSign className="h-4 w-4" />
                  <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                    {formatCurrency(revenue.average_revenue_per_visit)} avg / visit
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[380px]">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-3 flex items-center justify-between">
                  <span className={cn('text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Period
                  </span>
                  <button
                    onClick={() => refetch()}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                      isDark
                        ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4">
                  {PERIOD_OPTIONS.map((option) => {
                    const active = selectedPeriod === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelectPeriod(option.value)}
                        className={cn(
                          'rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all',
                          active
                            ? isDark
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                              : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                            : isDark
                            ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedPeriod === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className={cn(
                            'rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
                            isDark
                              ? 'border-white/10 bg-white/5 text-white'
                              : 'border-slate-200 bg-white text-slate-900'
                          )}
                        />
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className={cn(
                            'rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
                            isDark
                              ? 'border-white/10 bg-white/5 text-white'
                              : 'border-slate-200 bg-white text-slate-900'
                          )}
                        />
                        <button
                          onClick={handleApplyCustomRange}
                          disabled={!customFrom || !customTo}
                          className={cn(
                            'rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                            !customFrom || !customTo
                              ? isDark
                                ? 'cursor-not-allowed bg-white/5 text-slate-500'
                                : 'cursor-not-allowed bg-slate-100 text-slate-400'
                              : isDark
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          )}
                        >
                          Apply Range
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.section>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {headlineMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
            >
              <MetricCard isDark={isDark} {...metric} />
            </motion.div>
          ))}
        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Trend Overview */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className={cn(panelClass, 'xl:col-span-8 p-6')}
          >
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  Patient Volume Trajectory
                </h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  Daily patients and new patient acquisition over the selected reporting window.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={cn(subtlePanelClass, 'px-4 py-3')}>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Avg / Day</p>
                  <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                    {formatNumber(Math.round(averageDailyPatients))}
                  </p>
                </div>
                <div className={cn(subtlePanelClass, 'px-4 py-3')}>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Peak Day</p>
                  <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                    {peakDay ? peakDay.day : '—'}
                  </p>
                </div>
                <div className={cn(subtlePanelClass, 'px-4 py-3')}>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>New Patients</p>
                  <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                    {formatNumber(totalNewPatients)}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[340px]">
              {trendSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendSeries} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="patientsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="newPatientsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <EnterpriseTooltip
                          isDark={isDark}
                          labelFormatter={(value) => value}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      name="Patients"
                      stroke="#2563EB"
                      fill="url(#patientsGradient)"
                      strokeWidth={3}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="newPatients"
                      name="New Patients"
                      stroke="#10B981"
                      fill="url(#newPatientsGradient)"
                      strokeWidth={2.5}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No daily trend data"
                  subtitle="Patient volume will appear here when the API returns daily trend records."
                  isDark={isDark}
                />
              )}
            </div>
          </motion.div>

          {/* Weekly bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className={cn(panelClass, 'xl:col-span-4 p-6')}
          >
            <div className="mb-5">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Weekly Throughput
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Periodized patient totals by week.
              </p>
            </div>

            <div className="h-[340px]">
              {weeklySeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <EnterpriseTooltip
                          isDark={isDark}
                          valueFormatter={(value) => formatNumber(value)}
                        />
                      }
                    />
                    <Bar dataKey="patients" name="Patients" fill="#8B5CF6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No weekly trend data"
                  subtitle="Weekly patient totals will render here when present in the response."
                  isDark={isDark}
                />
              )}
            </div>
          </motion.div>

          {/* Demographics */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className={cn(panelClass, 'xl:col-span-6 p-6')}
          >
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  Demographics Snapshot
                </h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  Age, gender, and payer mix across the selected cohort.
                </p>
              </div>

              <div className={cn(subtlePanelClass, 'px-4 py-3')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Largest Age Group</p>
                <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  {largestAgeGroup ? `${largestAgeGroup.group} (${formatNumber(largestAgeGroup.count)})` : '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    Gender Distribution
                  </h3>
                </div>

                <div className="h-[240px]">
                  {genderDistribution.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderDistribution}
                          dataKey="count"
                          nameKey="gender"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {genderDistribution.map((entry, index) => (
                            <Cell key={entry.gender} fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <EnterpriseTooltip
                              isDark={isDark}
                              valueFormatter={(value) => formatNumber(value)}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState
                      title="No gender data"
                      subtitle="Gender distribution is unavailable for this period."
                      isDark={isDark}
                    />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {genderDistribution.map((item) => (
                    <div
                      key={item.gender}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-3 py-2',
                        isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {item.gender}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    Insurance vs Cash
                  </h3>
                </div>

                <div className="h-[240px]">
                  {insuranceVsCash.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insuranceVsCash}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                        >
                          {insuranceVsCash.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <EnterpriseTooltip
                              isDark={isDark}
                              valueFormatter={(value) => formatNumber(value)}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState
                      title="No payer mix data"
                      subtitle="Insurance vs cash distribution is unavailable."
                      isDark={isDark}
                    />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {insuranceVsCash.map((item) => (
                    <div
                      key={item.name}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border px-3 py-2',
                        isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">{formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn(subtlePanelClass, 'mt-6 p-4')}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  Age Group Distribution
                </h3>
              </div>

              <div className="h-[260px]">
                {ageGroups.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroups} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'} />
                      <XAxis
                        dataKey="group"
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={
                          <EnterpriseTooltip
                            isDark={isDark}
                            valueFormatter={(value) => formatNumber(value)}
                          />
                        }
                      />
                      <Bar dataKey="count" name="Patients" radius={[10, 10, 0, 0]}>
                        {ageGroups.map((item, index) => (
                          <Cell key={item.group} fill={item.fill || AGE_COLORS[index % AGE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState
                    title="No age distribution data"
                    subtitle="Age segmentation will appear here when returned by the backend."
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Operations + retention */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className={cn(panelClass, 'xl:col-span-6 p-6')}
          >
            <div className="mb-6">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Operational Performance
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Care flow efficiency, queue pressure, and patient retention performance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-100 text-blue-700')}>
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                      Patient Flow
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                      Avg operational timings
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Waiting</p>
                    <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                      {formatNumber(flow.average_waiting_minutes)}
                      <span className="ml-1 text-sm font-medium">min</span>
                    </p>
                  </div>

                  <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Consultation</p>
                    <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                      {formatNumber(flow.average_consultation_minutes)}
                      <span className="ml-1 text-sm font-medium">min</span>
                    </p>
                  </div>

                                  <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Arrival → Consult</p>
                    <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                      {formatNumber(flow.average_arrival_to_consultation_minutes)}
                      <span className="ml-1 text-sm font-medium">min</span>
                    </p>
                  </div>

                  <div className={cn('rounded-2xl border p-4', isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white')}>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Queue Length</p>
                    <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                      {formatNumber(flow.queue_length)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                      Retention & Continuity
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                      Outcome-oriented patient loyalty indicators
                    </p>
                  </div>

                  <div className={cn(
                    'rounded-2xl border px-3 py-2 text-right',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}>
                    <p className={cn('text-[10px] uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
                      Continuity Index
                    </p>
                    <p className={cn('mt-1 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                      {(
                        (retention.repeat_visit_rate +
                          retention.follow_up_compliance +
                          retention.returning_patients_percentage) /
                        3
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <ProgressRow
                    label="Repeat Visit Rate"
                    value={retention.repeat_visit_rate}
                    isDark={isDark}
                    tone="green"
                  />
                  <ProgressRow
                    label="Follow-up Compliance"
                    value={retention.follow_up_compliance}
                    isDark={isDark}
                    tone="blue"
                  />
                  <ProgressRow
                    label="Returning Patients"
                    value={retention.returning_patients_percentage}
                    isDark={isDark}
                    tone="violet"
                  />
                  <ProgressRow
                    label="Missed Appointment Rate"
                    value={retention.missed_appointment_rate}
                    isDark={isDark}
                    tone="rose"
                  />
                </div>
              </div>
            </div>

            <div className={cn(subtlePanelClass, 'mt-4 p-4')}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    Peak Day Intelligence
                  </p>
                  <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                    Highest patient-volume weekdays across the selected period
                  </p>
                </div>
              </div>

              {(dashboard.patient_trends.peak_days ?? []).length ? (
                <div className="space-y-3">
                  {[...(dashboard.patient_trends.peak_days ?? [])]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((item, index, arr) => {
                      const max = arr[0]?.count || 1;
                      const width = (item.count / max) * 100;

                      return (
                        <div key={item.day} className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold',
                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                              )}>
                                {index + 1}
                              </div>
                              <span className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-slate-800')}>
                                {item.day}
                              </span>
                            </div>

                            <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-950')}>
                              {formatNumber(item.count)}
                            </span>
                          </div>

                          <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyChartState
                  title="No peak day data"
                  subtitle="Peak weekday intelligence is not available for this range."
                  isDark={isDark}
                />
              )}
            </div>
          </motion.div>
        </section>

        {/* SECOND ANALYTICS GRID */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Visit Types + Conditions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.24 }}
            className={cn(panelClass, 'xl:col-span-7 p-6')}
          >
            <div className="mb-6">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Visit Composition & Condition Load
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Breakdown of visit categories and the most treated conditions driving clinical demand.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    Visit Types
                  </h3>
                </div>

                <div className="h-[300px]">
                  {visitTypes.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visitTypes} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'} />
                        <XAxis
                          dataKey="type"
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={
                            <EnterpriseTooltip
                              isDark={isDark}
                              valueFormatter={(value) => formatNumber(value)}
                            />
                          }
                        />
                        <Bar dataKey="count" name="Visits" radius={[10, 10, 0, 0]}>
                          {visitTypes.map((item, index) => (
                            <Cell key={item.type} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState
                      title="No visit type data"
                      subtitle="Visit composition will render when the API returns visit type counts."
                      isDark={isDark}
                    />
                  )}
                </div>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    Most Treated Conditions
                  </h3>
                </div>

                {topConditions.length ? (
                  <div className="space-y-4">
                    {topConditions.map((condition, index) => {
                      const max = topConditions[0]?.count || 1;
                      const width = (condition.count / max) * 100;

                      return (
                        <div key={condition.condition} className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                              )}>
                                {index + 1}
                              </div>
                              <span className={cn('truncate text-sm font-medium', isDark ? 'text-slate-200' : 'text-slate-800')}>
                                {condition.condition}
                              </span>
                            </div>

                            <span className={cn('shrink-0 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-950')}>
                              {formatNumber(condition.count)}
                            </span>
                          </div>

                          <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyChartState
                    title="No condition data"
                    subtitle="Treated condition rankings are unavailable for this period."
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className={cn(panelClass, 'xl:col-span-5 p-6')}
          >
            <div className="mb-6">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Revenue Performance
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Commercial efficiency signals from visit monetization and top-performing services.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                  Revenue / Patient
                </p>
                <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  {formatCurrency(revenue.revenue_per_patient)}
                </p>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                  Avg Revenue / Visit
                </p>
                <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  {formatCurrency(revenue.average_revenue_per_visit)}
                </p>
              </div>
            </div>

            <div className={cn(subtlePanelClass, 'mt-4 p-4')}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  Top Paying Services
                </h3>

                <span className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                )}>
                  {topServices.length} tracked
                </span>
              </div>

              <div className="h-[300px]">
                {topServices.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topServices}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'} />
                      <XAxis
                        type="number"
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="service"
                        width={120}
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={
                          <EnterpriseTooltip
                            isDark={isDark}
                            valueFormatter={(value) => formatCurrency(value)}
                          />
                        }
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState
                    title="No revenue service data"
                    subtitle="Top paying services will appear once available from the backend."
                    isDark={isDark}
                  />
                )}
              </div>

              {topServices.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topServices.slice(0, 4).map((service) => (
                    <div
                      key={service.service}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium',
                        isDark ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      {service.service} • {formatCompactCurrency(service.revenue)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ALERTS + EXECUTIVE SUMMARY */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.32 }}
            className={cn(panelClass, 'xl:col-span-8 p-6')}
          >
            <div className="mb-6">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Alerts & Operational Signals
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Risk markers surfaced by the analytics service for immediate visibility and intervention.
              </p>
            </div>

            {alerts.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {alerts.map((alert, index) => {
                  const Icon = getAlertIcon(alert.type);

                  return (
                    <motion.div
                      key={`${alert.type}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'rounded-3xl border p-5',
                        getSeverityStyles(alert.severity, isDark)
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                          isDark ? 'bg-white/10' : 'bg-white/70'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">{getAlertTypeLabel(alert.type)}</p>
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                              isDark ? 'bg-white/10 text-white/80' : 'bg-white/80 text-slate-700'
                            )}>
                              {alert.severity}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 opacity-90">{alert.message}</p>

                          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-xs font-semibold dark:bg-white/10">
                            <span>Signal Value</span>
                            <span>{formatNumber(alert.value)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-3xl border border-dashed p-10 text-center',
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
                )}
              >
                <div
                  className={cn(
                    'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
                    isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  )}
                >
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  No critical alerts detected
                </h3>
                <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  The dashboard did not return any active operational alerts for the selected period.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.36 }}
            className={cn(panelClass, 'xl:col-span-4 p-6')}
          >
            <div className="mb-6">
              <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                Executive Summary
              </h2>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                High-signal summary of the current reporting window.
              </p>
            </div>

            <div className="space-y-4">
              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Patient Growth</p>
                <div className="mt-2 flex items-center gap-2">
                  {(() => {
                    const trendMeta = getTrendMeta(kpi.total_patients.trend);
                    const TrendIcon = trendMeta.icon;

                    return (
                      <>
                        <TrendIcon className={cn('h-5 w-5', trendMeta.textClass)} />
                        <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                          {kpi.total_patients.change_percentage > 0 ? '+' : ''}
                          {kpi.total_patients.change_percentage.toFixed(1)}%
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Dominant Age Segment</p>
                <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  {largestAgeGroup?.group || '—'}
                </p>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  {largestAgeGroup ? `${formatNumber(largestAgeGroup.count)} patients` : 'No data'}
                </p>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Top Revenue Service</p>
                <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  {topServices[0]?.service || '—'}
                </p>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  {topServices[0] ? formatCurrency(topServices[0].revenue) : 'No data'}
                </p>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Top Condition</p>
                <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                  {topConditions[0]?.condition || '—'}
                </p>
                <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                  {topConditions[0] ? `${formatNumber(topConditions[0].count)} cases` : 'No data'}
                </p>
              </div>

              <div className={cn(subtlePanelClass, 'p-4')}>
                <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>New vs Returning Mix</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className={cn('mb-2 flex items-center justify-between text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      <span>New</span>
                      <span>{formatNumber(kpi.new_vs_returning.new)}</span>
                    </div>
                    <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${Math.max(0, Math.min(100, kpi.new_vs_returning.new_rate))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className={cn('mb-2 flex items-center justify-between text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      <span>Returning</span>
                      <span>{formatNumber(kpi.new_vs_returning.returning)}</span>
                    </div>
                    <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.max(0, Math.min(100, 100 - kpi.new_vs_returning.new_rate))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

export default MedicalRecordsDashboard;
