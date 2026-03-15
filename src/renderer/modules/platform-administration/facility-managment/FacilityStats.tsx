import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Building2,
  CheckCircle,
  PlusCircle,
  Ambulance,
  Bed,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  FileText,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Hospital,
  Stethoscope,
  Shield,
  Award,
  CreditCard,
  Phone,
  Mail,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';
import {
  useFacilityDashboardStats,
  useFacilityTypeDistribution,
  useFacilityTierDistribution,
  useOperationalStatusDistribution,
  useFacilityGeographicDistribution,
  useCapacityMetrics,
  useServiceAvailability,
  useSpecialtyServices,
  useEmergencyCapabilities,
  useAccreditationStats,
  useLicenseExpiryMetrics,
  usePerformanceMetrics,
  useDataResidencyDistribution,
  useFacilityGrowthTrends,
} from '../statistics/api/facility/FacilityStatsQueries';

import { RootState } from '../../../app/store/rootReducer';

// ==================== ICON MAP ====================

const IconMap = {
  Building2,
  CheckCircle,
  PlusCircle,
  Ambulance,
  Bed,
  Clock,
  Activity,
  Globe,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  FileText,
  MapPin,
  BarChart3,
  PieChart: PieChartIcon,
  LineChart: LineChartIcon,
  Hospital,
  Stethoscope,
  Shield,
  Award,
  CreditCard,
  Phone,
  Mail,
  Users,
};

type TabKey = 'overview' | 'capacity' | 'services' | 'compliance';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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
          const Icon = IconMap[metric.icon as keyof typeof IconMap] || Building2;
          const isPositive = metric.change && metric.change > 0;

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

// ==================== MAIN COMPONENT ====================

export const FacilityStats: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';
  
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Fetch all dashboard data
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useFacilityDashboardStats();

  // Individual hooks for targeted data
  const { refetch: refetchType } = useFacilityTypeDistribution();
  const { refetch: refetchTier } = useFacilityTierDistribution();
  const { refetch: refetchStatus } = useOperationalStatusDistribution();
  const { refetch: refetchGeographic } = useFacilityGeographicDistribution();
  const { refetch: refetchCapacity } = useCapacityMetrics();
  const { refetch: refetchServices } = useServiceAvailability();
  const { refetch: refetchSpecialties } = useSpecialtyServices();
  const { refetch: refetchEmergency } = useEmergencyCapabilities();
  const { refetch: refetchAccreditations } = useAccreditationStats();
  const { refetch: refetchLicenses } = useLicenseExpiryMetrics();
  const { refetch: refetchPerformance } = usePerformanceMetrics();
  const { refetch: refetchResidency } = useDataResidencyDistribution();
  const { refetch: refetchGrowth } = useFacilityGrowthTrends();

  // Theme-based colors
  const ui = useMemo(() => {
    return {
      pageBg: isDark ? 'bg-gray-950' : 'bg-gray-50',
      surface: isDark ? 'bg-gray-900' : 'bg-white',
      surfaceSubtle: isDark ? 'bg-gray-900/60' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
      textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
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
    refetchType();
    refetchTier();
    refetchStatus();
    refetchGeographic();
    refetchCapacity();
    refetchServices();
    refetchSpecialties();
    refetchEmergency();
    refetchAccreditations();
    refetchLicenses();
    refetchPerformance();
    refetchResidency();
    refetchGrowth();
    setLastRefreshed(new Date());
  }, [
    refetchDashboard, refetchType, refetchTier, refetchStatus,
    refetchGeographic, refetchCapacity, refetchServices, refetchSpecialties,
    refetchEmergency, refetchAccreditations, refetchLicenses, refetchPerformance,
    refetchResidency, refetchGrowth
  ]);

  const handleExport = useCallback(() => {
    window.open('/api/admin/statistics/facilities/export', '_blank');
  }, []);

  // Loading state
  if (dashboardLoading && !dashboardData) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading facility statistics..." />;
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
    { key: 'capacity', label: 'Capacity & Resources' },
    { key: 'services', label: 'Services & Specialties' },
    { key: 'compliance', label: 'Compliance & Licenses' },
  ];

  return (
    <div className={cx('p-4 sm:p-6 space-y-6 min-h-screen', ui.pageBg)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h1 className={cx('text-2xl sm:text-3xl font-bold', ui.text)}>Facility Analytics</h1>
          <p className={cx('text-sm sm:text-base mt-1', ui.textSecondary)}>
            Comprehensive overview of healthcare facilities on the platform
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      <div className="flex justify-end">
        <span className={cx('text-sm', ui.textSecondary)}>
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </span>
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

      {/* OVERVIEW TAB */}
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

          {/* Two Column Layout for Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facility Type Distribution */}
            {data?.facility_type_distribution?.length ? (
              <SectionCard
                title="Facilities by Type"
                subtitle="Distribution across facility types"
                icon={<Building2 className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
                cardClassName={cardClassName}
                isDark={isDark}
                text={ui.text}
                textSecondary={ui.textSecondary}
                border={ui.border}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.facility_type_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="type_label"
                        label={false}
                      >
                        {data.facility_type_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t" style={{ borderColor: ui.border }}>
                  {data.facility_type_distribution.slice(0, 6).map((type, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span className={cx('text-xs', ui.textSecondary)}>
                        {type.type_label}: {type.count}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {/* Facility Tier Distribution */}
            {data?.facility_tier_distribution?.length ? (
              <SectionCard
                title="Facilities by Tier"
                subtitle="Tier distribution across all facilities"
                icon={<Award className={isDark ? 'text-purple-300' : 'text-purple-700'} />}
                cardClassName={cardClassName}
                isDark={isDark}
                text={ui.text}
                textSecondary={ui.textSecondary}
                border={ui.border}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.facility_tier_distribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        dataKey="tier_label"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                      <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {data.facility_tier_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            ) : null}
          </div>

          {/* Status Distribution */}
          {data?.operational_status_distribution?.length ? (
            <SectionCard
              title="Operational Status"
              subtitle="Current operational status of facilities"
              icon={<Activity className={isDark ? 'text-green-300' : 'text-green-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.operational_status_distribution.map((status, idx) => {
                  const totalFacilities = data.key_metrics?.[0]?.value as number || 1;
                  const percentage = ((status.count / totalFacilities) * 100).toFixed(1);
                  
                  return (
                    <div key={idx} className="text-center">
                      <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: status.color }} />
                      <p className={cx('text-sm font-medium', ui.text)}>{status.status_label}</p>
                      <p className={cx('text-lg font-bold', ui.text)}>{status.count}</p>
                      <p className={cx('text-xs', ui.textSecondary)}>{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          {/* Growth Trends */}
          {data?.facility_growth_trends?.length ? (
            <SectionCard
              title="Facility Growth Trends"
              subtitle="New facilities and cumulative growth over time"
              icon={<TrendingUp className={isDark ? 'text-amber-300' : 'text-amber-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.facility_growth_trends} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                    <XAxis
                      dataKey="month"
                      stroke={ui.grid}
                      tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    <Bar yAxisId="left" dataKey="new_facilities" fill="#3B82F6" name="New Facilities" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative_total" stroke="#10B981" name="Cumulative Total" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {/* CAPACITY TAB */}
      {activeTab === 'capacity' && data?.capacity_metrics && (
        <div className="space-y-6">
          {/* Bed Capacity Overview - Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
                  <Bed className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Total Bed Capacity</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.capacity_metrics.bed_distribution.reduce((sum, item) => {
                      const count = item.count;
                      const range = item.range;
                      let avg = 0;
                      if (range === '0-50') avg = 25;
                      else if (range === '51-100') avg = 75;
                      else if (range === '101-200') avg = 150;
                      else if (range === '201-500') avg = 350;
                      else if (range === '500+') avg = 750;
                      return sum + (count * avg);
                    }, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-green-900/20' : 'bg-green-50')}>
                  <Hospital className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Facilities with Beds</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.capacity_metrics.facilities_with_beds.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-purple-900/20' : 'bg-purple-50')}>
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Avg Bed Capacity</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.capacity_metrics.avg_bed_capacity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bed Distribution Chart */}
          {data.capacity_metrics.bed_distribution?.length ? (
            <SectionCard
              title="Bed Capacity Distribution"
              subtitle="Number of facilities by bed capacity range"
              icon={<Bed className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.capacity_metrics.bed_distribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                    <XAxis
                      dataKey="range"
                      stroke={ui.grid}
                      tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    />
                    <YAxis stroke={ui.grid} tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }} />
                    <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.capacity_metrics.bed_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          ) : null}

          {/* Emergency Capabilities */}
          {data?.emergency_capabilities && (
            <SectionCard
              title="Emergency Capabilities"
              subtitle="Facilities with specialized emergency services"
              icon={<Ambulance className={isDark ? 'text-red-300' : 'text-red-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className={cx('p-3 rounded-lg inline-block mb-2', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                    <Ambulance className="w-6 h-6 text-red-500" />
                  </div>
                  <p className={cx('text-sm font-medium', ui.text)}>Emergency Dept</p>
                  <p className={cx('text-xl font-bold', ui.text)}>
                    {data.emergency_capabilities.emergency_dept.count}
                  </p>
                  <p className={cx('text-xs', ui.textSecondary)}>
                    {data.emergency_capabilities.emergency_dept.percentage}%
                  </p>
                </div>

                <div className="text-center">
                  <div className={cx('p-3 rounded-lg inline-block mb-2', isDark ? 'bg-orange-900/20' : 'bg-orange-50')}>
                    <Shield className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className={cx('text-sm font-medium', ui.text)}>Trauma Center</p>
                  <p className={cx('text-xl font-bold', ui.text)}>
                    {data.emergency_capabilities.trauma_center.count}
                  </p>
                  <p className={cx('text-xs', ui.textSecondary)}>
                    {data.emergency_capabilities.trauma_center.percentage}%
                  </p>
                </div>

                <div className="text-center">
                  <div className={cx('p-3 rounded-lg inline-block mb-2', isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
                    <Activity className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className={cx('text-sm font-medium', ui.text)}>Intensive Care</p>
                  <p className={cx('text-xl font-bold', ui.text)}>
                    {data.emergency_capabilities.intensive_care.count}
                  </p>
                  <p className={cx('text-xs', ui.textSecondary)}>
                    {data.emergency_capabilities.intensive_care.percentage}%
                  </p>
                </div>

                <div className="text-center">
                  <div className={cx('p-3 rounded-lg inline-block mb-2', isDark ? 'bg-purple-900/20' : 'bg-purple-50')}>
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className={cx('text-sm font-medium', ui.text)}>Neonatal ICU</p>
                  <p className={cx('text-xl font-bold', ui.text)}>
                    {data.emergency_capabilities.neonatal_icu.count}
                  </p>
                  <p className={cx('text-xs', ui.textSecondary)}>
                    {data.emergency_capabilities.neonatal_icu.percentage}%
                  </p>
                </div>

                <div className="text-center">
                  <div className={cx('p-3 rounded-lg inline-block mb-2', isDark ? 'bg-pink-900/20' : 'bg-pink-50')}>
                    <Activity className="w-6 h-6 text-pink-500" />
                  </div>
                  <p className={cx('text-sm font-medium', ui.text)}>Cardiac Cath Lab</p>
                  <p className={cx('text-xl font-bold', ui.text)}>
                    {data.emergency_capabilities.cardiac_cath_lab.count}
                  </p>
                  <p className={cx('text-xs', ui.textSecondary)}>
                    {data.emergency_capabilities.cardiac_cath_lab.percentage}%
                  </p>
                </div>
              </div>

              {/* Trauma Center Levels */}
              {data.emergency_capabilities.trauma_center.by_level?.length > 0 && (
                <div className={cx('mt-4 pt-4 border-t', ui.border)}>
                  <p className={cx('text-sm font-medium mb-2', ui.text)}>Trauma Center Levels</p>
                  <div className="flex flex-wrap gap-4">
                    {data.emergency_capabilities.trauma_center.by_level.map((level, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className={cx('text-sm', ui.textSecondary)}>{level.level}:</span>
                        <span className={cx('text-sm font-medium', ui.text)}>{level.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && data?.service_availability && (
        <div className="space-y-6">
          {/* Service Stats - Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Unique Services</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.service_availability.total_unique_services}
                  </p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-green-900/20' : 'bg-green-50')}>
                  <Building2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Avg Services/Facility</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.service_availability.avg_services_per_facility}
                  </p>
                </div>
              </div>
            </div>

            <div className={cardClassName}>
              <div className="flex items-center gap-3">
                <div className={cx('p-3 rounded-lg', isDark ? 'bg-purple-900/20' : 'bg-purple-50')}>
                  <Stethoscope className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className={cx('text-sm font-medium', ui.textSecondary)}>Facilities w/ Specialties</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.specialty_services?.facilities_with_specialties || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Services */}
          {data.service_availability.top_services?.length ? (
            <SectionCard
              title="Top 10 Services Offered"
              subtitle="Most common services across facilities"
              icon={<FileText className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="space-y-4">
                {data.service_availability.top_services.map((service, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={cx('text-sm', ui.text)}>{service.service}</span>
                      <span className={cx('text-sm font-medium', ui.text)}>
                        {service.count} ({service.percentage}%)
                      </span>
                    </div>
                    <div className={cx('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-gray-800' : 'bg-gray-200')}>
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Top Specialties */}
          {data?.specialty_services?.top_specialties?.length ? (
            <SectionCard
              title="Top 10 Specialties"
              subtitle="Most common medical specialties"
              icon={<Stethoscope className={isDark ? 'text-purple-300' : 'text-purple-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.specialty_services.top_specialties.map((specialty, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'flex justify-between items-center p-3 rounded-lg',
                      isDark ? 'bg-gray-800' : 'bg-gray-50'
                    )}
                  >
                    <span className={cx('text-sm', ui.text)}>{specialty.specialty}</span>
                    <span className={cx('text-sm font-medium', ui.text)}>
                      {specialty.count} ({specialty.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {activeTab === 'compliance' && data?.license_expiry_metrics && (
        <div className="space-y-6">
          {/* License Status Overview - Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className={cx(cardClassName, 'border-l-4 border-green-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Valid Licenses</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {data.license_expiry_metrics.total_with_license - data.license_expiry_metrics.expired}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-yellow-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Expiring Soon (≤30d)</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {data.license_expiry_metrics.expiring_soon}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-orange-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Expiring (31-90d)</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {data.license_expiry_metrics.expiring_medium}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-red-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Expired</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {data.license_expiry_metrics.expired}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-gray-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>No License Data</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {data.license_expiry_metrics.no_license_date}
              </p>
            </div>
          </div>

          {/* License Expiry Chart */}
          <SectionCard
            title="License Expiry Distribution"
            subtitle="Breakdown of license expiration timelines"
            icon={<Award className={isDark ? 'text-amber-300' : 'text-amber-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            border={ui.border}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Expiring Soon (≤30d)', value: data.license_expiry_metrics.expiring_soon, color: '#F59E0B' },
                      { name: 'Expiring (31-90d)', value: data.license_expiry_metrics.expiring_medium, color: '#F97316' },
                      { name: 'Expiring Later (>90d)', value: data.license_expiry_metrics.expiring_later, color: '#10B981' },
                      { name: 'Expired', value: data.license_expiry_metrics.expired, color: '#EF4444' },
                      { name: 'No License Date', value: data.license_expiry_metrics.no_license_date, color: '#6B7280' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {[
                      { color: '#F59E0B' },
                      { color: '#F97316' },
                      { color: '#10B981' },
                      { color: '#EF4444' },
                      { color: '#6B7280' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip isDark={isDark} bg={ui.tooltipBg} border={ui.tooltipBorder} text={ui.tooltipText} />
                  <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Accreditation Stats */}
          {data?.accreditation_stats && (
            <SectionCard
              title="Accreditations"
              subtitle="Facility accreditations overview"
              icon={<Award className={isDark ? 'text-yellow-300' : 'text-yellow-700'} />}
              right={
                <span className={cx(
                  'text-sm px-2 py-1 rounded-md border',
                  ui.border,
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
                )}>
                  {data.accreditation_stats.percentage_accredited}% accredited
                </span>
              }
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className={cx('text-sm font-medium mb-3', ui.text)}>Top Accreditations</p>
                  <div className="space-y-3">
                    {data.accreditation_stats.top_accreditations.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className={cx('text-sm', ui.textSecondary)}>{item.accreditation}</span>
                        <span className={cx('text-sm font-medium', ui.text)}>
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={cx('text-sm font-medium mb-3', ui.text)}>Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={cx('text-sm', ui.textSecondary)}>Accredited Facilities</span>
                      <span className={cx('text-sm font-medium', ui.text)}>
                        {data.accreditation_stats.accredited_facilities}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={cx('text-sm', ui.textSecondary)}>Total Facilities</span>
                      <span className={cx('text-sm font-medium', ui.text)}>
                        {data.key_metrics?.[0]?.value || 0}
                      </span>
                    </div>
                    <div className={cx('flex justify-between items-center pt-2 border-t', ui.border)}>
                      <span className={cx('text-sm font-medium', ui.text)}>Accreditation Rate</span>
                      <span className={cx('text-lg font-bold', ui.text)}>
                        {data.accreditation_stats.percentage_accredited}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Performance Metrics */}
          {data?.performance_metrics && (
            <SectionCard
              title="Performance Metrics"
              subtitle="Facility performance indicators"
              icon={<Activity className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
              border={ui.border}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className={cx('text-sm', ui.textSecondary)}>Avg Wait Time</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.performance_metrics.avg_wait_time_overall} min
                  </p>
                </div>

                <div className="text-center">
                  <p className={cx('text-sm', ui.textSecondary)}>Patient Satisfaction</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.performance_metrics.avg_satisfaction_overall}/5
                  </p>
                </div>

                <div className="text-center">
                  <p className={cx('text-sm', ui.textSecondary)}>Monthly Volume</p>
                  <p className={cx('text-3xl font-bold mt-1', ui.text)}>
                    {data.performance_metrics.total_monthly_volume.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={cx('mt-4 pt-4 border-t text-center', ui.border)}>
                <p className={cx('text-sm', ui.textSecondary)}>
                  {data.performance_metrics.facilities_with_performance_data} facilities reporting performance data
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilityStats;