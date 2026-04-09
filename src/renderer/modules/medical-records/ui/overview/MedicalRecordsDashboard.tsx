import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';

import { useDashboardOverview } from '../../api/facility-patient-analytics/FacilityPatientAnalyticsQueries';
import type {
  DashboardPeriod,
  DashboardQueryParams,
} from '../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';

import DashboardHeader from './medical-records-dashboard/DashboardHeader';
import DashboardMetricsGrid from './medical-records-dashboard/DashboardMetricsGrid';
import DashboardTrendsSection from './medical-records-dashboard/DashboardTrendsSection';
import DashboardDemographicsSection from './medical-records-dashboard/DashboardDemographicsSection';
import DashboardOperationsSection from './medical-records-dashboard//DashboardOperationsSection';
import DashboardInsightsSection from './medical-records-dashboard/DashboardInsightsSection';

// Import the enterprise-grade loading skeleton
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

import {
  AGE_COLORS,
  PIE_COLORS,
  cn,
  formatDateLabel,
  formatNumber,
  formatPercent,
  getPageShellClass,
  getPanelClass,
} from './medical-records-dashboard/dashboard.utils';

interface ThemeRootState {
  ui?: {
    theme?: 'light' | 'dark';
  };
}

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

  const pageShell = getPageShellClass(isDark);
  const panelClass = getPanelClass(isDark);

  // Use the new LoadingSkeleton for loading state
  if (isLoading) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        message="Loading patient analytics dashboard..."
        theme={isDark ? 'dark' : 'light'}
        className="min-h-screen"
      />
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
                <CircleAlert className="h-4 w-4" />
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

  const metrics = [
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
      subtitle: `${formatNumber(kpi.new_vs_returning.new)} new • ${formatNumber(
        kpi.new_vs_returning.returning
      )} returning`,
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
        <DashboardHeader
          isDark={isDark}
          dashboard={dashboard}
          selectedPeriod={selectedPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onSelectPeriod={handleSelectPeriod}
          onApplyCustomRange={handleApplyCustomRange}
          onRefresh={refetch}
          isFetching={isFetching}
        />

        <DashboardMetricsGrid isDark={isDark} metrics={metrics} />

        <DashboardTrendsSection
          isDark={isDark}
          trendSeries={trendSeries}
          weeklySeries={weeklySeries}
          averageDailyPatients={averageDailyPatients}
          peakDay={peakDay}
          totalNewPatients={totalNewPatients}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardDemographicsSection
            isDark={isDark}
            ageGroups={ageGroups}
            genderDistribution={genderDistribution}
            insuranceVsCash={insuranceVsCash}
            largestAgeGroup={largestAgeGroup}
          />

          <DashboardOperationsSection
            isDark={isDark}
            flow={dashboard.patient_flow}
            retention={dashboard.retention}
            peakDays={dashboard.patient_trends.peak_days ?? []}
          />
        </div>

        <DashboardInsightsSection
          isDark={isDark}
          visitTypes={visitTypes}
          topConditions={topConditions}
          revenue={dashboard.revenue}
          topServices={topServices}
          alerts={dashboard.alerts ?? []}
          kpi={dashboard.kpi}
          largestAgeGroup={largestAgeGroup}
        />
      </div>
    </div>
  );
}

export default MedicalRecordsDashboard;