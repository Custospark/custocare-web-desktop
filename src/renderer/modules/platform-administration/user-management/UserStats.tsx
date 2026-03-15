import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  Globe,
  LineChart as LineChartIcon,
  Monitor,
  Phone,
  PieChart as PieChartIcon,
  RefreshCw,
  Shield,
  Smartphone,
  Tablet,
  TrendingUp,
  UserPlus,
  Users,
  MapPin,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import {
  useDashboardStats,
  useDailyActivity,
  useDemographicDistribution,
  useGeographicDistribution,
  useKeyMetrics,
  useMfaAdoption,
  usePlatformBreakdown,
  useSecurityMetrics,
  useStaffPerformance,
  useUserRetention,
  useVerificationFunnel,
  useWeeklyTrends,
  type DateRange,
} from '../statistics/api/user/UserStatsQueries';
import { RootState } from '../../../app/store/rootReducer';

const IconMap = {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  Activity,
  Shield,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Smartphone,
  Monitor,
  Tablet,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  PieChart: PieChartIcon,
  LineChart: LineChartIcon,
};

type TabKey = 'overview' | 'demographics' | 'security' | 'platform';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

function formatRangeLabel(range: DateRange) {
  return range.replace(/_/g, ' ');
}

/** A consistent tooltip for all charts (improves dark theme readability) */
function ChartTooltip({
  isDark,
  bg,
  border,
  text,
}: {
  isDark: boolean;
  bg: string;
  border: string;
  text: string;
}) {
  return (
    <Tooltip
      contentStyle={{
        backgroundColor: bg,
        borderColor: border,
        color: text,
        borderRadius: 10,
        boxShadow: isDark
          ? '0 12px 28px rgba(0,0,0,0.5)'
          : '0 12px 28px rgba(0,0,0,0.12)',
      }}
      itemStyle={{ color: text }}
      labelStyle={{ color: text, fontWeight: 600 }}
      cursor={{ fill: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
    />
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  right,
  children,
  cardClassName,
  headerClassName,
  isDark,
  text,
  textSecondary,
  border,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  cardClassName: string;
  headerClassName?: string;
  isDark: boolean;
  text: string;
  textSecondary: string;
  border: string;
}) {
  return (
    <section className={cardClassName}>
      <header className={cx('flex items-start gap-3 mb-4', headerClassName)}>
        {icon ? (
          <div
            className={cx(
              'mt-0.5 p-2 rounded-lg border',
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            )}
          >
            {icon}
          </div>
        ) : null}

        <div className="min-w-0">
          <h2 className={cx('text-base sm:text-lg font-semibold leading-tight', text)}>
            {title}
          </h2>
          {subtitle ? (
            <p className={cx('text-sm mt-1', textSecondary)}>{subtitle}</p>
          ) : null}
        </div>

        {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
      </header>

      {children}
    </section>
  );
}

/** Shows 3 metrics at a time, but keeps total count accessible */
function MetricCarousel({
  metrics,
  isDark,
  cardClassName,
  text,
  textSecondary,
  textMuted,
  grid,
}: {
  metrics: Array<any>;
  isDark: boolean;
  cardClassName: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  grid: string;
}) {
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil((metrics?.length || 0) / pageSize));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [metrics?.length]);

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  const visible = useMemo(() => {
    const start = page * pageSize;
    return metrics.slice(start, start + pageSize);
  }, [metrics, page]);

  const next = () => setPage((p) => Math.min(p + 1, pageCount - 1));
  const prev = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <div className={cardClassName}>
      <div className="flex items-center gap-3 mb-4">
        <div className="min-w-0">
          <h2 className={cx('text-base sm:text-lg font-semibold', text)}>
            Summary metrics
          </h2>
          <p className={cx('text-sm mt-1', textSecondary)}>
            {metrics.length} total • Showing {Math.min(pageSize, metrics.length)} at a time
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={!canPrev}
            className={cx(
              'cursor-pointer inline-flex items-center justify-center w-9 h-9 rounded-lg border transition',
              isDark
                ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-40'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-label="Previous metrics"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className={cx(
              'cursor-pointer inline-flex items-center justify-center w-9 h-9 rounded-lg border transition',
              isDark
                ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-40'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-label="Next metrics"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={cx(
          'grid grid-cols-1 md:grid-cols-3 gap-3',
          isDark ? 'bg-transparent' : 'bg-transparent'
        )}
      >
        {visible.map((metric: any, index: number) => {
          const Icon = IconMap[metric.icon as keyof typeof IconMap] || Activity;
          const isPositive = metric.change && metric.change > 0;

          // Keep their supplied bgColor behavior but make it readable in dark mode
          const iconWrap = isDark
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200';

          return (
            <div
              key={`${page}-${index}-${metric.label}`}
              className={cx(
                'rounded-xl border p-4 transition-shadow',
                isDark
                  ? 'bg-gray-900 border-gray-700 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]'
                  : 'bg-white border-gray-200 hover:shadow-lg'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cx('text-xs font-medium tracking-wide', textSecondary)}>
                    {metric.label}
                  </p>

                  <p className={cx('text-2xl font-bold mt-1', text)}>{metric.value}</p>

                  {metric.change !== undefined && metric.change !== null ? (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp
                        className={cx('w-3.5 h-3.5', isPositive ? 'text-green-500' : 'text-red-500')}
                      />
                      <span
                        className={cx('text-xs font-medium', isPositive ? 'text-green-500' : 'text-red-500')}
                      >
                        {isPositive ? '+' : ''}
                        {metric.change}%
                      </span>
                      <span className={cx('text-xs', textMuted)}>vs prior</span>
                    </div>
                  ) : null}

                  {metric.subtext ? (
                    <p className={cx('text-xs mt-2', textMuted)}>{metric.subtext}</p>
                  ) : null}
                </div>

                <div className={cx('p-2 rounded-lg shrink-0', iconWrap)}>
                  <Icon className={cx('w-5 h-5', metric.color)} />
                </div>
              </div>

              <div className="mt-4">
                <div className="h-px" style={{ backgroundColor: grid }} />
              </div>

              <p className={cx('text-xs mt-3', textMuted)}>
                Page {page + 1} of {pageCount}
              </p>
            </div>
          );
        })}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={cx(
                'cursor-pointer w-2.5 h-2.5 rounded-full transition',
                i === page
                  ? 'bg-blue-500'
                  : isDark
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-300 hover:bg-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label={`Go to metrics page ${i + 1}`}
              title={`Page ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const UserStats: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  const [dateRange, setDateRange] = useState<DateRange>('30_days');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Fetch all dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardStats({ date_range: dateRange });

  // Individual hooks kept (for refresh + parity with existing behavior)
  const { refetch: refetchMetrics } = useKeyMetrics({ date_range: dateRange });
  const { refetch: refetchFunnel } = useVerificationFunnel();
  const { refetch: refetchDaily } = useDailyActivity({ date_range: dateRange });
  const { refetch: refetchWeekly } = useWeeklyTrends({ date_range: dateRange });
  const { refetch: refetchDemographics } = useDemographicDistribution();
  const { refetch: refetchMfa } = useMfaAdoption();
  const { refetch: refetchGeographic } = useGeographicDistribution();
  const { refetch: refetchPlatform } = usePlatformBreakdown();
  const { refetch: refetchRetention } = useUserRetention();
  const { refetch: refetchSecurity } = useSecurityMetrics();
  const { refetch: refetchStaff } = useStaffPerformance();

  const ui = useMemo(() => {
    // More contrast than before (dark theme labels become readable)
    return {
      pageBg: isDark ? 'bg-gray-950' : 'bg-gray-50',
      surface: isDark ? 'bg-gray-900' : 'bg-white',
      surfaceSubtle: isDark ? 'bg-gray-900/60' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      // IMPORTANT: bump dark secondary text for legibility
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
      textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
      // Chart colors
      grid: isDark ? '#334155' : '#E5E7EB',
      tooltipBg: isDark ? '#0B1220' : '#FFFFFF',
      tooltipBorder: isDark ? '#334155' : '#E5E7EB',
      tooltipText: isDark ? '#E5E7EB' : '#0F172A',
    };
  }, [isDark]);

  const cardClassName = useMemo(
    () =>
      cx(
        ui.surface,
        ui.border,
        'border rounded-2xl p-5 sm:p-6',
        isDark
          ? 'shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'shadow-[0_1px_0_rgba(15,23,42,0.04)]'
      ),
    [ui.surface, ui.border, isDark]
  );

  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchMetrics();
    refetchFunnel();
    refetchDaily();
    refetchWeekly();
    refetchDemographics();
    refetchMfa();
    refetchGeographic();
    refetchPlatform();
    refetchRetention();
    refetchSecurity();
    refetchStaff();
    setLastRefreshed(new Date());
  }, [
    refetchDashboard,
    refetchMetrics,
    refetchFunnel,
    refetchDaily,
    refetchWeekly,
    refetchDemographics,
    refetchMfa,
    refetchGeographic,
    refetchPlatform,
    refetchRetention,
    refetchSecurity,
    refetchStaff,
  ]);

  const handleExport = useCallback(() => {
    window.open(`/api/admin/statistics/export?date_range=${dateRange}`, '_blank');
  }, [dateRange]);

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading platform statistics..." />;
  }

  // Error state
  if (dashboardError) {
    return (
      <div className={cx('p-8 text-center rounded-2xl border', ui.surface, ui.border)}>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h3 className={cx('text-xl font-semibold mb-2', ui.text)}>Failed to Load Statistics</h3>
        <p className={ui.textSecondary}>Please try again.</p>
        <button
          onClick={handleRefresh}
          className="mt-5 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = dashboardData?.data;

  const Tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'demographics', label: 'Demographics' },
    { key: 'security', label: 'Security & MFA' },
    { key: 'platform', label: 'Platform' },
  ];

  return (
    <div className={cx('p-4 sm:p-6 space-y-6 min-h-screen', ui.pageBg)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h1 className={cx('text-2xl sm:text-3xl font-bold', ui.text)}>Platform User Analytics</h1>
          <p className={cx('text-sm sm:text-base mt-1', ui.textSecondary)}>
            A clearer, calmer view of user activity and platform health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <label className="sr-only" htmlFor="dateRange">
            Date range
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className={cx(
              'cursor-pointer px-3 py-2 rounded-lg border text-sm',
              ui.surface,
              ui.border,
              ui.text,
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <option value="7_days">Last 7 Days</option>
            <option value="14_days">Last 14 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
            <option value="12_weeks">Last 12 Weeks</option>
            <option value="24_weeks">Last 24 Weeks</option>
          </select>

          <button
            onClick={handleRefresh}
            className={cx(
              'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors',
              isDark
                ? 'bg-gray-900 hover:bg-gray-800 text-gray-200 border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className={cx(
              'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Subheader row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className={cx('text-sm', ui.textSecondary)}>
          <span className="font-medium">Range:</span> {formatRangeLabel(dateRange)}
        </div>
        <div className={cx('text-sm', ui.textSecondary)}>
          <span className="font-medium">Last updated:</span> {lastRefreshed.toLocaleTimeString()}
        </div>
      </div>

      {/* Tabs */}
      <nav
        className={cx(
          'inline-flex flex-wrap gap-1 p-1 rounded-xl border',
          ui.border,
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
        aria-label="Analytics tabs"
      >
        {Tabs.map((t) => {
          const active = t.key === activeTab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cx(
                'cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                active
                  ? isDark
                    ? 'bg-blue-500 text-white border border-blue-700'
                    : 'bg-blue-500 text-white'
                  : cx(ui.textSecondary, isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
              )}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics (3 at a time) */}
          {data?.key_metrics?.length ? (
            <MetricCarousel
              metrics={data.key_metrics}
              isDark={isDark}
              cardClassName={cardClassName}
              text={ui.text}
              textSecondary={ui.textSecondary}
              textMuted={ui.textMuted}
              grid={ui.grid}
            />
          ) : null}

          {/* Primary: Daily Activity (kept front-and-center) */}
          {data?.daily_activity?.length ? (
            <SectionCard
              title="Daily user activity"
              subtitle="New users, verified users, and active users"
              icon={<Activity className={isDark ? 'text-green-300' : 'text-green-600'} />}
              right={
                <span
                  className={cx(
                    'text-xs px-2 py-1 rounded-md border',
                    ui.border,
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
                  )}
                >
                  {formatRangeLabel(dateRange)}
                </span>
              }
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-[340px] sm:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.daily_activity} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                    <XAxis
                      dataKey="day"
                      stroke={ui.grid}
                      tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    />
                    <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    <Bar dataKey="newUsers" fill="#3B82F6" name="New users" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="verified" fill="#10B981" name="Verified" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="active" stroke="#F59E0B" name="Active" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <p className={cx('text-xs mt-4', ui.textMuted)}>
                Tip: Hover for exact values. This chart intentionally prioritizes readability over density.
              </p>
            </SectionCard>
          ) : null}

          {/* Secondary: Trends + MFA side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data?.weekly_trends?.length ? (
              <SectionCard
                title="Weekly trends"
                subtitle="Direction of growth over time"
                icon={<TrendingUp className={isDark ? 'text-purple-300' : 'text-purple-700'} />}
                cardClassName={cardClassName}
                isDark={isDark}
                text={ui.text}
                textSecondary={ui.textSecondary}
                border={ui.border}
              >
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.weekly_trends} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        dataKey="week"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                      <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      <Line type="monotone" dataKey="newUsers" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="New users" />
                      <Line type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2.5} dot={false} name="Verified" />
                      <Line type="monotone" dataKey="activeUsers" stroke="#F59E0B" strokeWidth={2.5} dot={false} name="Active" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            ) : null}

            {data?.mfa_adoption?.overall ? (
              <SectionCard
                title="MFA adoption"
                subtitle="Security posture overview"
                icon={<Shield className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
                right={
                  <div className={cx('text-right')}>
                    <div className={cx('text-2xl font-bold', ui.text)}>
                      {data.mfa_adoption.overall.adoption_rate}%
                    </div>
                    <div className={cx('text-xs', ui.textMuted)}>adoption</div>
                  </div>
                }
                cardClassName={cardClassName}
                isDark={isDark}
                text={ui.text}
                textSecondary={ui.textSecondary}
                border={ui.border}
              >
                {/* IMPORTANT: remove slice labels to avoid clutter; rely on legend + tooltip */}
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Enabled', value: data.mfa_adoption.overall.enabled },
                          { name: 'Disabled', value: data.mfa_adoption.overall.disabled },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                      </Pie>
                      <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {data.mfa_adoption.by_region?.length ? (
                  <div className={cx('mt-4 pt-4 border-t', ui.border)}>
                    <div className="flex items-center justify-between">
                      <h3 className={cx('text-sm font-semibold', ui.text)}>Top regions</h3>
                      <span className={cx('text-xs', ui.textMuted)}>Top 3</span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {data.mfa_adoption.by_region.slice(0, 3).map((region: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className={cx('text-sm truncate', ui.textSecondary)}>{region.region}</span>
                          <span className={cx('text-sm font-medium', ui.text)}>
                            {region.adoption_rate}%{' '}
                            <span className={cx('text-xs', ui.textMuted)}>
                              ({region.mfa_count}/{region.total})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SectionCard>
            ) : null}
          </div>

          {/* Collapsible: Verification (kept but not shoved in user’s face immediately) */}
          {data?.verification_funnel ? (
            <details className={cx(cardClassName, 'group')} open={false}>
              <summary
                className={cx(
                  'cursor-pointer list-none flex items-center gap-3',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl'
                )}
              >
                <div
                  className={cx(
                    'p-2 rounded-lg border',
                    isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  )}
                >
                  <FileText className={isDark ? 'text-blue-300' : 'text-blue-700'} />
                </div>
                <div className="min-w-0">
                  <div className={cx('text-base sm:text-lg font-semibold', ui.text)}>
                    Identity verification funnel
                  </div>
                  <div className={cx('text-sm', ui.textSecondary)}>
                    Expand to view funnel + methods
                  </div>
                </div>
                <span
                  className={cx(
                    'ml-auto text-xs px-2 py-1 rounded-md border',
                    ui.border,
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
                  )}
                >
                  Avg time: {data.verification_funnel.avg_verification_time_hours}h
                </span>
              </summary>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel chart */}
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.verification_funnel.funnel}
                      margin={{ top: 12, right: 20, left: 10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis type="number" stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                        width={120}
                      />
                      <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                        {data.verification_funnel.funnel.map((_: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 2 ? '#10B981' : index === 3 ? '#EF4444' : '#3B82F6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Methods pie */}
                <div>
                  <h3 className={cx('text-sm font-semibold mb-3', ui.text)}>Verification methods</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.verification_funnel.methods}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={false}
                        >
                          {data.verification_funnel.methods.map((entry: any, index: number) => (
                            <Cell key={`method-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                        <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <p className={cx('text-xs mt-2', ui.textMuted)}>
                    Slice labels are hidden to avoid clutter—use legend/hover for exact numbers.
                  </p>
                </div>
              </div>
            </details>
          ) : null}
        </div>
      )}

      {activeTab === 'demographics' && data?.demographic_distribution && (
        <div className="space-y-6">
          {/* Primary: Age + Gender in a calm layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Age distribution"
              subtitle="User counts by age group"
              icon={<BarChart3 className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.demographic_distribution.age} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                    <XAxis dataKey="group" stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.demographic_distribution.age.map((entry: any, index: number) => (
                        <Cell key={`age-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Gender distribution"
              subtitle="Shown via legend + tooltip for clarity"
              icon={<PieChartIcon className={isDark ? 'text-purple-300' : 'text-purple-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.demographic_distribution.gender}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={2}
                      dataKey="value"
                      label={false}
                    >
                      {data.demographic_distribution.gender.map((entry: any, index: number) => (
                        <Cell key={`gender-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Geographic distribution */}
          {data?.geographic_distribution ? (
            <SectionCard
              title="Geographic distribution"
              subtitle="Top countries, states, and data residency"
              icon={<Globe className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className={cx('text-sm font-semibold mb-3', ui.text)}>Top countries</h3>
                  <div className="space-y-2">
                    {data.geographic_distribution.by_country.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center gap-3">
                        <span className={cx('text-sm truncate', ui.textSecondary)}>
                          {item.country_name || item.country}
                        </span>
                        <span className={cx('text-sm font-medium', ui.text)}>
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {data.geographic_distribution.by_state?.length > 0 ? (
                  <div>
                    <h3 className={cx('text-sm font-semibold mb-3', ui.text)}>Top US states</h3>
                    <div className="space-y-2">
                      {data.geographic_distribution.by_state.slice(0, 7).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-3">
                          <span className={cx('text-sm truncate', ui.textSecondary)}>
                            {item.state_name || item.state}
                          </span>
                          <span className={cx('text-sm font-medium', ui.text)}>
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={cx('text-sm', ui.textMuted)}>No state data available.</div>
                )}

                <div>
                  <h3 className={cx('text-sm font-semibold mb-3', ui.text)}>Data residency</h3>
                  <div className="space-y-2">
                    {data.geographic_distribution.by_residency.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center gap-3">
                        <span className={cx('text-sm truncate', ui.textSecondary)}>{item.region}</span>
                        <span className={cx('text-sm font-medium', ui.text)}>
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {/* Retention - kept as is but sits lower in the page */}
          {data?.user_retention?.length ? (
            <SectionCard
              title="User retention cohorts"
              subtitle="Cohort table (first 6 cohorts)"
              icon={<LineChartIcon className={isDark ? 'text-amber-300' : 'text-amber-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cx('border-b', ui.border)}>
                      <th className={cx('text-left py-2 px-3 text-sm font-semibold', ui.textSecondary)}>Cohort</th>
                      <th className={cx('text-left py-2 px-3 text-sm font-semibold', ui.textSecondary)}>Size</th>
                      {[1, 2, 3, 4, 5].map((month) => (
                        <th
                          key={month}
                          className={cx('text-center py-2 px-3 text-sm font-semibold whitespace-nowrap', ui.textSecondary)}
                        >
                          Month {month}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.user_retention.slice(0, 6).map((cohort: any, idx: number) => (
                      <tr key={idx} className={cx('border-b', isDark ? 'border-gray-800' : 'border-gray-100')}>
                        <td className={cx('py-2 px-3 text-sm', ui.text)}>{cohort.cohort_label}</td>
                        <td className={cx('py-2 px-3 text-sm font-semibold', ui.text)}>{cohort.size}</td>
                        {cohort.retention.slice(0, 5).map((period: any, pIdx: number) => (
                          <td
                            key={pIdx}
                            className={cx(
                              'text-center py-2 px-3 text-sm font-semibold',
                              period.retention_rate > 50
                                ? 'text-green-500'
                                : period.retention_rate > 20
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                            )}
                          >
                            {period.retention_rate}%
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {activeTab === 'security' && data?.security_metrics && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Locked accounts</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>{data.security_metrics.locked_accounts}</p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-yellow-900/20' : 'bg-yellow-50')}>
                  <RefreshCw className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Password changes (30d)</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>{data.security_metrics.password_changes_30d}</p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-orange-900/20' : 'bg-orange-50')}>
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Require password change</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>{data.security_metrics.require_password_change}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution */}
          <SectionCard
            title="Failed login attempts distribution"
            subtitle={`Average failed attempts per user: ${data.security_metrics.avg_failed_attempts}`}
            icon={<BarChart3 className={isDark ? 'text-red-300' : 'text-red-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            border={ui.border}
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.security_metrics.failed_attempts_distribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                  <XAxis dataKey="attempt_range" stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                  <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                  <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                  <Bar dataKey="count" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Staff performance */}
          {data?.staff_performance ? (
            <SectionCard
              title="Top performing staff"
              subtitle="Verification throughput and recency"
              icon={<Users className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="space-y-4">
                {data.staff_performance.top_performers.map((staff: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <p className={cx('font-semibold truncate', ui.text)}>{staff.staff_name}</p>
                      <p className={cx('text-xs mt-1', ui.textMuted)}>
                        Last: {new Date(staff.last_verification).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={cx('text-lg font-bold', ui.text)}>{staff.verification_count}</p>
                      <p className={cx('text-xs', ui.textMuted)}>verifications</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={cx('mt-5 pt-4 border-t', ui.border)}>
                <p className={cx('text-sm', ui.textSecondary)}>
                  Total verifications: <span className={cx('font-semibold', ui.text)}>{data.staff_performance.total_verifications}</span>
                </p>
                <p className={cx('text-sm mt-1', ui.textSecondary)}>
                  Avg time: <span className={cx('font-semibold', ui.text)}>{data.staff_performance.avg_verification_time_overall}h</span>
                </p>
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {activeTab === 'platform' && data?.platform_breakdown && (
        <div className="space-y-6">
          {/* Primary row: Device + Browser */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Device types"
              subtitle="Legend + tooltip for clean labeling"
              icon={<Smartphone className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: data.platform_breakdown.device_types.desktop },
                        { name: 'Mobile', value: data.platform_breakdown.device_types.mobile },
                        { name: 'Tablet', value: data.platform_breakdown.device_types.tablet },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={2}
                      dataKey="value"
                      label={false}
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#10B981" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Browser distribution"
              subtitle="Counts with relative bars"
              icon={<Monitor className={isDark ? 'text-purple-300' : 'text-purple-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="space-y-4">
                {(() => {
                  const entries = Object.entries(data.platform_breakdown.browsers);
                  const total = entries.reduce((sum, [, count]) => sum + Number(count), 0) || 1;

                  return entries.map(([browser, count]) => (
                    <div key={browser}>
                      <div className="flex justify-between items-center mb-1 gap-3">
                        <span className={cx('text-sm font-medium', ui.text)}>{browser}</span>
                        <span className={cx('text-sm', ui.textSecondary)}>{Number(count).toLocaleString()}</span>
                      </div>
                      <div className={cx('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-gray-800' : 'bg-gray-200')}>
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(Number(count) / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </SectionCard>
          </div>

          {/* Theme preference */}
          <SectionCard
            title="Theme preference"
            subtitle="User-chosen UI themes"
            icon={<Filter className={isDark ? 'text-amber-300' : 'text-amber-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            border={ui.border}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.platform_breakdown.theme_preference.map((t: any, idx: number) => (
                <div
                  key={idx}
                  className={cx(
                    'p-4 rounded-xl border',
                    ui.border,
                    isDark ? 'bg-gray-900' : 'bg-white'
                  )}
                >
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>{t.theme} mode</p>
                  <p className={cx('text-2xl font-bold mt-1', ui.text)}>{t.count.toLocaleString()}</p>
                  <p className={cx('text-sm mt-1', ui.textMuted)}>{t.percentage}% of users</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default UserStats;
