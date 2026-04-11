import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  ChevronRight,
  Eye,
  Users,
  Activity,
  Gauge,
} from 'lucide-react';

import {
  EmptyChartState,
  EnterpriseTooltip,
} from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';
import { ADMIN_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

export interface PresenceWorkloadChartPoint {
  label: string;
  rawDate: string;
  onDuty: number;
  busy: number;
  offDuty: number;
  totalActivePatients: number;
  uniqueStaffAssigned: number;
  avgPatientsPerStaff: number;
}

export interface FinancialTrendChartPoint {
  label: string;
  periodKey: string;
  netRevenue: number;
  collections: number;
  outstanding: number;
  invoices: number;
}

interface FacilityAdminTrendsSectionProps {
  isDark: boolean;
  presenceWorkloadSeries: PresenceWorkloadChartPoint[];
  financialTrend: FinancialTrendChartPoint[];
  revenueGrowthPercentage?: number | null;
}

const FacilityAdminTrendsSection: React.FC<FacilityAdminTrendsSectionProps> = ({
  isDark,
  presenceWorkloadSeries,
  financialTrend,
  revenueGrowthPercentage,
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const summary = useMemo(() => {
    if (!presenceWorkloadSeries.length) {
      return {
        avgOnDuty: 0,
        avgOffDuty: 0,
        peakBusy: 0,
        avgPatientsPerStaff: 0,
      };
    }

    const avgOnDuty =
      presenceWorkloadSeries.reduce((sum, item) => sum + item.onDuty, 0) /
      presenceWorkloadSeries.length;

    const avgOffDuty =
      presenceWorkloadSeries.reduce((sum, item) => sum + item.offDuty, 0) /
      presenceWorkloadSeries.length;

    const peakBusy = Math.max(...presenceWorkloadSeries.map((item) => item.busy));

    const avgPatientsPerStaff =
      presenceWorkloadSeries.reduce(
        (sum, item) => sum + Number(item.avgPatientsPerStaff ?? 0),
        0
      ) / presenceWorkloadSeries.length;

    return {
      avgOnDuty,
      avgOffDuty,
      peakBusy,
      avgPatientsPerStaff,
    };
  }, [presenceWorkloadSeries]);

  const latestFinancialPoint = financialTrend[financialTrend.length - 1];

  // Navigation handler with loading state
  const handleNavigate = (url: string, sectionName: string) => {
    setIsNavigating(sectionName);
    navigate(url);
  };

  // Show loading skeleton if navigating
  if (isNavigating) {
    return (
      <LoadingSkeleton 
        variant="dashboard" 
        theme={isDark ? 'dark' : 'light'}
        message={`Loading ${isNavigating}...`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Signal Section - FULL WIDTH */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        className={cn(panelClass, 'p-6')}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Revenue Signal
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Financial performance and collection trends.
            </p>
          </div>

          {typeof revenueGrowthPercentage === 'number' && (
            <div
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold cursor-default',
                revenueGrowthPercentage >= 0
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-emerald-50 text-emerald-700'
                  : isDark
                  ? 'bg-rose-500/10 text-rose-300'
                  : 'bg-rose-50 text-rose-700'
              )}
            >
              {revenueGrowthPercentage > 0 ? (
                <TrendingUp className="inline h-3 w-3 mr-1" />
              ) : revenueGrowthPercentage < 0 ? (
                <TrendingDown className="inline h-3 w-3 mr-1" />
              ) : null}
              {revenueGrowthPercentage > 0 ? '+' : ''}
              {revenueGrowthPercentage.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Latest Net Revenue
            </p>
            <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {latestFinancialPoint
                ? formatCompactCurrency(latestFinancialPoint.netRevenue)
                : '—'}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Latest Collections
            </p>
            <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {latestFinancialPoint
                ? formatCompactCurrency(latestFinancialPoint.collections)
                : '—'}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Outstanding
            </p>
            <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {latestFinancialPoint
                ? formatCompactCurrency(latestFinancialPoint.outstanding)
                : '—'}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
              Invoices
            </p>
            <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {latestFinancialPoint
                ? latestFinancialPoint.invoices.toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="h-[400px]">
          {financialTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={financialTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="facilityRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="facilityCollectionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.03} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                />
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
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <Tooltip
                  content={
                    <EnterpriseTooltip
                      isDark={isDark}
                      valueFormatter={(value, name) =>
                        name === 'Invoices'
                          ? `${Number(value ?? 0)}`
                          : formatCurrency(value)
                      }
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  name="Net Revenue"
                  stroke="#10B981"
                  fill="url(#facilityRevenueGradient)"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  name="Collections"
                  stroke="#2563EB"
                  fill="url(#facilityCollectionsGradient)"
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="outstanding"
                  name="Outstanding"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="No financial trend data"
              subtitle="Net revenue trend will appear here when financial analytics are available."
              isDark={isDark}
            />
          )}
        </div>

        {/* Action Buttons for Revenue */}
        <div className={cn('mt-6 pt-4 border-t grid grid-cols-2 gap-3', isDark ? 'border-white/10' : 'border-slate-200')}>
          <button
            onClick={() => handleNavigate(ADMIN_ROUTES.BILLING_CYCLE_REVENUE_STATS, 'Revenue Details')}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
              isDark
                ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
            )}
          >
            <Receipt className="h-4 w-4" />
            <span>Revenue Details</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleNavigate(ADMIN_ROUTES.BILLING_CYCLE_BILLING_REVIEW, 'Revenue Review')}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
              isDark
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            )}
          >
            <Eye className="h-4 w-4" />
            <span>Revenue Review</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Staff Presence & Workload Trajectory Section - FULL WIDTH */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className={cn(panelClass, 'p-6')}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Staff Presence & Workload Trajectory
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Operational staffing movement and workload pressure across the selected reporting window.
            </p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cn(subtlePanelClass, 'px-4 py-3', 'cursor-default')}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Avg On Duty
              </p>
            </div>
            <p className={cn('mt-1 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {Math.round(summary.avgOnDuty)}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'px-4 py-3', 'cursor-default')}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Avg Off Duty
              </p>
            </div>
            <p className={cn('mt-1 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {Math.round(summary.avgOffDuty)}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'px-4 py-3', 'cursor-default')}>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Peak Busy Staff
              </p>
            </div>
            <p className={cn('mt-1 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {summary.peakBusy}
            </p>
          </div>

          <div className={cn(subtlePanelClass, 'px-4 py-3', 'cursor-default')}>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-500" />
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Avg Patients / Staff
              </p>
            </div>
            <p className={cn('mt-1 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              {summary.avgPatientsPerStaff.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Stacked Charts */}
        <div className="space-y-8">
          {/* Chart 1: Staff Availability */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className={cn('text-base font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                Staff Availability
              </h3>
            </div>
            <div className="h-[320px]">
              {presenceWorkloadSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={presenceWorkloadSeries}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                    />
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
                          valueFormatter={(value) => `${Number(value ?? 0)}`}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="onDuty"
                      name="On Duty"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="offDuty"
                      name="Off Duty"
                      stroke="#94A3B8"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No staff availability data"
                  subtitle="Staff presence data will appear here when available."
                  isDark={isDark}
                />
              )}
            </div>
          </div>

          {/* Chart 2: Active Workload */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              <h3 className={cn('text-base font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                Active Workload
              </h3>
            </div>
            <div className="h-[320px]">
              {presenceWorkloadSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={presenceWorkloadSeries}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                    />
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
                          valueFormatter={(value) => `${Number(value ?? 0)}`}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="busy"
                      name="Busy Staff"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No workload data"
                  subtitle="Staff workload trends will appear here when available."
                  isDark={isDark}
                />
              )}
            </div>
          </div>

          {/* Chart 3: Staff Efficiency */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-emerald-500" />
              <h3 className={cn('text-base font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                Patients Per Staff Member
              </h3>
            </div>
            <div className="h-[320px]">
              {presenceWorkloadSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={presenceWorkloadSeries}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                    />
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
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      content={
                        <EnterpriseTooltip
                          isDark={isDark}
                          valueFormatter={(value) => Number(value).toFixed(1)}
                        />
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="avgPatientsPerStaff"
                      name="Avg Patients Per Staff"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No efficiency data"
                  subtitle="Staff efficiency metrics will appear here when available."
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FacilityAdminTrendsSection;