// MedicalRecordsDashboard.tsx
import React, { useState } from 'react';
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
} from 'recharts';
import {
  Users,
  UserPlus,
  UserCheck,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Stethoscope,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useDashboardOverview } from '../../api/facility-patient-analytics/FacilityPatientAnalyticsQueries';
import type {
  DashboardQueryParams,
  DashboardPeriod,
  DailyTrend,
  WeeklyTrend,
  NewPatientGrowth,
  PeakDay,
  AgeGroup,
  GenderDistribution,
  VisitTypeCount,
  TopCondition,
  TopPayingService,
  DashboardAlert,
} from '../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

interface RootState {
  ui: { theme: 'light' | 'dark' };
}

// Color palette for charts (consistent across light/dark)
const CHART_COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  pink: '#EC4899',
  teal: '#14B8A6',
  red: '#EF4444',
  indigo: '#6366F1',
  cyan: '#06B6D4',
  yellow: '#EAB308',
};

const GENDER_COLORS = {
  male: '#3B82F6',
  female: '#EC4899',
  other: '#8B5CF6',
  unknown: '#9CA3AF',
};

const AGE_GROUP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const MedicalRecordsDashboard: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  // Period state
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build query params
  const queryParams: DashboardQueryParams = { period };
  if (period === 'custom' && customDateRange.from && customDateRange.to) {
    queryParams.date_from = customDateRange.from;
    queryParams.date_to = customDateRange.to;
  }

  const { data, isLoading, error, refetch } = useDashboardOverview(queryParams);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handlePeriodChange = (newPeriod: DashboardPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomDateRange({ from: '', to: '' });
    }
  };

  // Theme-aware styling
  const colors = {
    background: isDark ? 'bg-gray-950' : 'bg-gray-50',
    cardBg: isDark ? 'bg-gray-900/80' : 'bg-white',
    cardBorder: isDark ? 'border-gray-800' : 'border-gray-200',
    textPrimary: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-400',
    grid: isDark ? '#374151' : '#E5E7EB',
    tooltipBg: isDark ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDark ? '#374151' : '#E5E7EB',
    tooltipText: isDark ? '#F9FAFB' : '#111827',
  };

  const cardClasses = cn(
    colors.cardBg,
    colors.cardBorder,
    'border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300'
  );

  const metricCardClasses = cn(
    colors.cardBg,
    colors.cardBorder,
    'border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 overflow-hidden relative group'
  );

  // Helper to format change percentage with arrow
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-sm font-medium',
          isPositive ? 'text-green-500' : 'text-red-500'
        )}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{change}%
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('min-h-screen p-6', colors.background)}>
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton theme={theme} variant="dashboard" message="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.success) {
    return (
      <div className={cn('min-h-screen p-6 flex items-center justify-center', colors.background)}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className={cn('text-xl font-bold mb-2', colors.textPrimary)}>
            Unable to load dashboard
          </h2>
          <p className={colors.textSecondary}>
            {error?.message || data?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dashboard = data.data;

  // Prepare chart data
  const dailyData: DailyTrend[] = dashboard.patient_trends.daily;
  const weeklyData: WeeklyTrend[] = dashboard.patient_trends.weekly;
  const newPatientGrowthData: NewPatientGrowth[] = dashboard.patient_trends.new_patient_growth;
  const peakDaysData: PeakDay[] = dashboard.patient_trends.peak_days;

  const ageGroupsData: AgeGroup[] = dashboard.demographics.age_groups;
  const genderData: GenderDistribution[] = dashboard.demographics.gender_distribution;
  const insuranceCashData = [
    { name: 'Insurance', value: dashboard.demographics.insurance_vs_cash.insurance, color: CHART_COLORS.blue },
    { name: 'Cash / Self-Pay', value: dashboard.demographics.insurance_vs_cash.cash, color: CHART_COLORS.green },
  ];

  const visitTypesData: VisitTypeCount[] = dashboard.visit_types.visit_types;
  const topConditions: TopCondition[] = dashboard.visit_types.most_treated_conditions;

  const topServices: TopPayingService[] = dashboard.revenue.top_paying_services;

  const alerts: DashboardAlert[] = dashboard.alerts;

  // KPI metrics
  const kpi = dashboard.kpi;
  const totalPatientsMetric = kpi.total_patients;
  const newVsReturning = kpi.new_vs_returning;
  const activeVisits = kpi.active_visits;
  const completedVisits = kpi.completed_visits;
  const cancelledMissed = kpi.cancelled_missed;

  return (
    <div className={cn('min-h-screen p-6', colors.background)}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with period selector and refresh */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className={cn('text-2xl font-bold', colors.textPrimary)}>
              Patient Analytics Dashboard
            </h1>
            <p className={colors.textSecondary}>
              {dashboard.period.label} · Real-time clinic performance insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4" />
                <span>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-10',
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="p-2 space-y-1">
                      {(['today', 'week', 'month', 'custom'] as DashboardPeriod[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePeriodChange(p)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                            period === p
                              ? 'bg-blue-600 text-white'
                              : isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-100 text-gray-700'
                          )}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                    {period === 'custom' && (
                      <div className="p-3 border-t border-gray-700 space-y-2">
                        <input
                          type="date"
                          value={customDateRange.from}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({ ...prev, from: e.target.value }))
                          }
                          className={cn(
                            'w-full px-3 py-1.5 rounded-lg text-sm border',
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          )}
                        />
                        <input
                          type="date"
                          value={customDateRange.to}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({ ...prev, to: e.target.value }))
                          }
                          className={cn(
                            'w-full px-3 py-1.5 rounded-lg text-sm border',
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                          )}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                'p-2 rounded-xl border transition-all',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
                isRefreshing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
            </button>
          </div>
        </motion.div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Total Patients */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className={metricCardClasses}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={cn('text-sm font-medium', colors.textSecondary)}>Total Patients</p>
                <p className={cn('text-3xl font-bold mt-1', colors.textPrimary)}>
                  {totalPatientsMetric.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {formatChange(totalPatientsMetric.change_percentage)}
                  <span className={cn('text-xs', colors.textMuted)}>vs prev period</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </motion.div>

          {/* New vs Returning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={metricCardClasses}
          >
            <div>
              <p className={cn('text-sm font-medium', colors.textSecondary)}>New Patients</p>
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>{newVsReturning.new}</p>
              <p className={cn('text-xs mt-1', colors.textMuted)}>
                Returning: {newVsReturning.returning}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${newVsReturning.new_rate}%` }}
                />
              </div>
              <p className={cn('text-xs mt-1', colors.textMuted)}>
                {newVsReturning.new_rate}% new patient rate
              </p>
            </div>
          </motion.div>

          {/* Active Visits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className={metricCardClasses}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={cn('text-sm font-medium', colors.textSecondary)}>Active Visits</p>
                <p className={cn('text-3xl font-bold text-yellow-500', colors.textPrimary)}>
                  {activeVisits}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </motion.div>

          {/* Completed Visits */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={metricCardClasses}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={cn('text-sm font-medium', colors.textSecondary)}>Completed</p>
                <p className={cn('text-3xl font-bold text-green-500', colors.textPrimary)}>
                  {completedVisits}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>

          {/* Cancelled/Missed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className={metricCardClasses}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={cn('text-sm font-medium', colors.textSecondary)}>
                  Cancelled / Missed
                </p>
                <p className={cn('text-3xl font-bold text-red-500', colors.textPrimary)}>
                  {cancelledMissed}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Patient Trends - Line/Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Patient Volume */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cardClasses}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h3 className={cn('font-semibold', colors.textPrimary)}>Daily Patient Volume</h3>
              </div>
              <span className={cn('text-xs px-2 py-1 rounded-full', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
                Last {dailyData.length} days
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="date" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="patients" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Weekly Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <LineChartIcon className="w-5 h-5 text-green-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Weekly Patient Trends</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="week" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patients"
                    stroke={CHART_COLORS.green}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS.green }}
                    name="Patients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* New Patient Growth & Peak Days */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-purple-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>New Patient Growth</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={newPatientGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="date" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_patients"
                    stroke={CHART_COLORS.purple}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="New Patients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Peak Days</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakDaysData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis type="number" tick={{ fill: colors.textSecondary }} />
                  <YAxis type="category" dataKey="day" tick={{ fill: colors.textSecondary }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Patient Flow Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cardClasses}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cyan-500" />
            <h3 className={cn('font-semibold', colors.textPrimary)}>Patient Flow & Waiting Experience</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.patient_flow.average_waiting_minutes} min
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Avg Waiting Time</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.patient_flow.average_consultation_minutes} min
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Avg Consultation</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.patient_flow.average_arrival_to_consultation_minutes} min
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Arrival → Consultation</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.patient_flow.queue_length}
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Current Queue Length</p>
            </div>
          </div>
        </motion.div>

        {/* Demographics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Age Groups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Age Distribution</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageGroupsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ group, percent }) => `${group} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {ageGroupsData.map((entry, index) => (
                      <Cell key={entry.group} fill={AGE_GROUP_COLORS[index % AGE_GROUP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Gender Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-pink-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Gender Distribution</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ gender, percent }) => `${gender} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {genderData.map((entry) => (
                      <Cell
                        key={entry.gender}
                        fill={GENDER_COLORS[entry.gender as keyof typeof GENDER_COLORS] || CHART_COLORS.gray}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Insurance vs Cash */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Payment Method</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insuranceCashData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {insuranceCashData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Visit Types & Top Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-teal-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Visit Types</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitTypesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis type="number" tick={{ fill: colors.textSecondary }} />
                  <YAxis type="category" dataKey="type" tick={{ fill: colors.textSecondary, fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      borderColor: colors.tooltipBorder,
                      color: colors.tooltipText,
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-red-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Most Treated Conditions</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topConditions.slice(0, 8).map((condition, idx) => (
                <div
                  key={condition.condition}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm truncate flex-1">{condition.condition}</span>
                  <span className="text-sm font-semibold">{condition.count}</span>
                </div>
              ))}
              {topConditions.length === 0 && (
                <p className={cn('text-sm text-center py-8', colors.textMuted)}>No data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Retention Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={cardClasses}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-blue-500" />
            <h3 className={cn('font-semibold', colors.textPrimary)}>Patient Retention & Behavior</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.retention.repeat_visit_rate}%
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Repeat Visit Rate</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.retention.missed_appointment_rate}%
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Missed Appointment Rate</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.retention.follow_up_compliance}%
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Follow-up Compliance</p>
            </div>
            <div className="text-center">
              <p className={cn('text-2xl font-bold', colors.textPrimary)}>
                {dashboard.retention.returning_patients_percentage}%
              </p>
              <p className={cn('text-xs', colors.textMuted)}>Returning Patients</p>
            </div>
          </div>
        </motion.div>

        {/* Revenue & Top Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Revenue Overview</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm">Revenue per Patient</span>
                <span className="text-xl font-bold">${dashboard.revenue.revenue_per_patient}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-sm">Average Revenue per Visit</span>
                <span className="text-xl font-bold">${dashboard.revenue.average_revenue_per_visit}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={cardClasses}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <h3 className={cn('font-semibold', colors.textPrimary)}>Top Paying Services</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {topServices.map((service) => (
                <div
                  key={service.service}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm truncate flex-1">{service.service}</span>
                  <span className="text-sm font-semibold">${service.revenue}</span>
                </div>
              ))}
              {topServices.length === 0 && (
                <p className={cn('text-sm text-center py-8', colors.textMuted)}>No revenue data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Alerts Panel */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cardClasses}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className={cn('font-semibold', colors.textPrimary)}>Intelligent Alerts</h3>
              </div>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-3 rounded-xl border-l-4',
                      alert.severity === 'danger' && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                      alert.severity === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                      alert.severity === 'info' && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {alert.severity === 'danger' && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                      {alert.severity === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                      {alert.severity === 'info' && <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className={cn('text-xs mt-1', colors.textMuted)}>Value: {alert.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className={cn('text-center py-4 text-xs', colors.textMuted)}
        >
          <div className="flex flex-wrap justify-center gap-4">
            <span>📊 Data reflects {dashboard.period.label}</span>
            <span>🔄 Auto-refreshes every 2 minutes</span>
            <span>🔒 HIPAA compliant analytics</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MedicalRecordsDashboard;