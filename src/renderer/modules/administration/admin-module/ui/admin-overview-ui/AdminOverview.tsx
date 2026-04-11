import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CircleAlert,
  DollarSign,
  ShieldAlert,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';

import { useFacilityAdminAnalyticsQuery } from '../../api/admin-overview/FacilityAdminAnalyticsQueries';
import type {
  AnalyticsGroupBy,
  FacilityAdminAnalyticsFilters,
} from '../../api/admin-overview/FacilityAdminAnalyticsTypes';

import DashboardMetricsGrid from '../../../../medical-records/ui/overview/medical-records-dashboard/DashboardMetricsGrid';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import FacilityAdminDashboardHeader from './facility-admin-analytics-dashboard/FacilityAdminDashboardHeader';
import FacilityAdminTrendsSection from './facility-admin-analytics-dashboard/FacilityAdminTrendsSection';
import FacilityAdminWorkforceSection from './facility-admin-analytics-dashboard/FacilityAdminWorkforceSection';
import FacilityAdminCapacitySection from './facility-admin-analytics-dashboard/FacilityAdminCapacitySection';
import FacilityAdminInventorySection from './facility-admin-analytics-dashboard/FacilityAdminInventorySection';
import FacilityAdminServicesSection from './facility-admin-analytics-dashboard/FacilityAdminServicesSection';

import {
  cn,
  formatCompactCurrency,
  formatDateLabel,
  formatNumber,
  formatPercent,
  toTrendDirection,
} from './facility-admin-analytics-dashboard/facilityAdminDashboard.utils';

interface AdminOverviewProps {
  theme: 'light' | 'dark';
}

interface DashboardUi {
  pageBg: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
}

function AdminOverview({ theme }: AdminOverviewProps) {
  const isDark = theme === 'dark';

  const ui = useMemo<DashboardUi>(() => {
    return {
      pageBg: isDark ? 'bg-gray-950' : 'bg-gray-50',
      surface: isDark ? 'bg-gray-900' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      text: isDark ? 'text-gray-100' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    };
  }, [isDark]);

  const [selectedGroupBy, setSelectedGroupBy] = useState<AnalyticsGroupBy>('day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<FacilityAdminAnalyticsFilters>({
    group_by: 'day',
    top: 6,
  });

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFacilityAdminAnalyticsQuery(appliedFilters);

  const dashboard = response?.data;

  const presenceTrend = useMemo(() => {
    const value = dashboard?.staff_availability?.presence_trend;
    return Array.isArray(value) ? value : [];
  }, [dashboard?.staff_availability?.presence_trend]);

  const workloadTrend = useMemo(() => {
    const value = dashboard?.staff_availability?.workload_trend;
    return Array.isArray(value) ? value : [];
  }, [dashboard?.staff_availability?.workload_trend]);

  const presenceWorkloadSeries = useMemo(() => {
    const workloadMap = new Map(
      workloadTrend.map((item) => [
        item.date,
        {
          totalActivePatients: Number(item.total_active_patients ?? 0),
          uniqueStaffAssigned: Number(item.unique_staff_assigned ?? 0),
          avgPatientsPerStaff: Number(item.avg_patients_per_staff ?? 0),
        },
      ])
    );

    return presenceTrend.map((item) => {
      const matchingWorkload = workloadMap.get(item.date);

      return {
        label: formatDateLabel(item.date),
        rawDate: item.date,
        onDuty: Number(item.on_duty ?? 0),
        busy: Number(item.busy ?? 0),
        offDuty: Number(item.off_duty ?? 0),
        totalActivePatients: matchingWorkload?.totalActivePatients ?? 0,
        uniqueStaffAssigned: matchingWorkload?.uniqueStaffAssigned ?? 0,
        avgPatientsPerStaff: matchingWorkload?.avgPatientsPerStaff ?? 0,
      };
    });
  }, [presenceTrend, workloadTrend]);

  const revenueTrend = useMemo(() => {
    const value = dashboard?.financial?.revenue_trend;
    return Array.isArray(value) ? value : [];
  }, [dashboard?.financial?.revenue_trend]);

  const financialTrend = useMemo(() => {
    return revenueTrend.map((item) => ({
      label: item.period_label,
      periodKey: item.period_key,
      netRevenue: Number(item.net_revenue ?? 0),
      collections: Number(item.total_collections ?? 0),
      outstanding: Number(item.outstanding_balance ?? 0),
      invoices: Number(item.invoice_count ?? 0),
    }));
  }, [revenueTrend]);

  const currentSnapshot = dashboard?.staff_availability?.current_snapshot;
  const capacitySummary = dashboard?.capacity_utilization?.summary;
  const inventorySummary = dashboard?.inventory_risk?.summary;
  const serviceSummary = dashboard?.service_pricing?.summary;
  const financialSnapshot = dashboard?.financial?.snapshot;

  const metrics = useMemo(() => {
    return [
      {
        title: 'Active Staff',
        value: formatNumber(currentSnapshot?.total_active),
        subtitle: `${formatNumber(currentSnapshot?.staff_on_duty)} on duty • ${formatNumber(
          currentSnapshot?.staff_busy
        )} busy`,
        icon: Users,
        accent: 'blue' as const,
      },
      {
        title: 'Space Utilization',
        value: formatPercent(capacitySummary?.space_utilization_rate),
        subtitle: `${formatNumber(capacitySummary?.occupied_spaces)} / ${formatNumber(
          capacitySummary?.total_active_spaces
        )} active spaces`,
        icon: Building2,
        accent: 'violet' as const,
      },
      {
        title: 'Inventory Risk',
        value: formatNumber(inventorySummary?.items_below_reorder_point),
        subtitle: `${formatNumber(inventorySummary?.high_risk_inventory_count)} high-risk items`,
        icon: ShieldAlert,
        accent: 'rose' as const,
      },
      {
        title: 'Revenue Potential',
        value: formatCompactCurrency(serviceSummary?.total_revenue_potential),
        subtitle: `${formatNumber(serviceSummary?.total_active_services)} active services`,
        icon: TrendingUp,
        accent: 'green' as const,
      },
      {
        title: 'Net Revenue',
        value: financialSnapshot ? formatCompactCurrency(financialSnapshot.net_revenue) : '—',
        subtitle: financialSnapshot
          ? `Previous: ${formatCompactCurrency(
              financialSnapshot.previous_period_net_revenue
            )}`
          : 'Financial trend unavailable',
        icon: DollarSign,
        accent: 'amber' as const,
        trend: financialSnapshot
          ? toTrendDirection(
              financialSnapshot.net_revenue,
              financialSnapshot.previous_period_net_revenue
            )
          : undefined,
        delta: financialSnapshot?.revenue_growth_percentage,
      },
    ];
  }, [
    capacitySummary?.occupied_spaces,
    capacitySummary?.space_utilization_rate,
    capacitySummary?.total_active_spaces,
    currentSnapshot?.staff_busy,
    currentSnapshot?.staff_on_duty,
    currentSnapshot?.total_active,
    financialSnapshot,
    inventorySummary?.high_risk_inventory_count,
    inventorySummary?.items_below_reorder_point,
    serviceSummary?.total_active_services,
    serviceSummary?.total_revenue_potential,
  ]);

  const handleSelectGroupBy = (value: AnalyticsGroupBy) => {
    setSelectedGroupBy(value);

    setAppliedFilters((prev) => ({
      ...prev,
      group_by: value,
      top: prev.top ?? 6,
    }));
  };

  const handleApplyDateRange = (from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);

    setAppliedFilters((prev) => ({
      ...prev,
      date_from: from,
      date_to: to,
      group_by: selectedGroupBy,
      top: prev.top ?? 6,
    }));
  };

  const handleClearDateRange = () => {
    setCustomFrom('');
    setCustomTo('');

    setAppliedFilters((prev) => ({
      ...prev,
      date_from: undefined,
      date_to: undefined,
      group_by: selectedGroupBy,
      top: prev.top ?? 6,
    }));
  };

  if (isLoading) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        message="Loading facility analytics dashboard data..."
        theme={isDark ? 'dark' : 'light'}
        className="min-h-screen"
      />
    );
  }

  if (isError) {
    return (
      <div className={cn('min-h-screen p-4 sm:p-6', ui.pageBg)}>
        <div className="mx-auto max-w-[1600px]">
          <div className={cn('rounded-2xl border p-10', ui.surface, ui.border)}>
            <div className="mx-auto max-w-lg text-center">
              <div
                className={cn(
                  'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl',
                  isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-600'
                )}
              >
                <CircleAlert className="h-8 w-8" />
              </div>

              <h2 className={cn('text-2xl font-bold', ui.text)}>
                Unable to load facility dashboard analytics
              </h2>

              <p className={cn('mt-2 text-sm', ui.textSecondary)}>
                {error?.message ||
                  'Something went wrong while fetching facility admin analytics.'}
              </p>

              <button
                onClick={() => refetch()}
                className={cn(
                  'mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500'
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
      <div className={cn('min-h-screen p-4 sm:p-6', ui.pageBg)}>
        <div className="mx-auto max-w-[1600px]">
          <div className={cn('rounded-2xl border p-10', ui.surface, ui.border)}>
            <div className="mx-auto max-w-lg text-center">
              <div
                className={cn(
                  'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl',
                  isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                )}
              >
                <Workflow className="h-8 w-8" />
              </div>

              <h2 className={cn('text-2xl font-bold', ui.text)}>
                No admin analytics data available
              </h2>

              <p className={cn('mt-2 text-sm', ui.textSecondary)}>
                {response?.message ||
                  'No facility admin analytics payload was returned for the selected filters.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen space-y-6 p-4 sm:p-6', ui.pageBg)}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <FacilityAdminDashboardHeader
          isDark={isDark}
          selectedGroupBy={selectedGroupBy}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onSelectGroupBy={handleSelectGroupBy}
          onApplyDateRange={handleApplyDateRange}
          onClearDateRange={handleClearDateRange}
          onRefresh={refetch}
          isFetching={isFetching}
        />

        <DashboardMetricsGrid isDark={isDark} metrics={metrics} />

        <FacilityAdminTrendsSection
          isDark={isDark}
          presenceWorkloadSeries={presenceWorkloadSeries}
          financialTrend={financialTrend}
          revenueGrowthPercentage={dashboard?.financial?.snapshot?.revenue_growth_percentage}
        />

        <FacilityAdminWorkforceSection
          isDark={isDark}
          currentSnapshot={dashboard?.staff_availability?.current_snapshot}
          roleDistribution={dashboard?.staff_availability?.role_distribution}
          highWorkloadStaff={dashboard?.staff_availability?.high_workload_staff}
        />

        <FacilityAdminCapacitySection
          isDark={isDark}
          summary={dashboard?.capacity_utilization?.summary}
          departments={dashboard?.capacity_utilization?.departments}
          wards={dashboard?.capacity_utilization?.wards}
          spaceTypes={dashboard?.capacity_utilization?.space_types}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FacilityAdminInventorySection
            isDark={isDark}
            summary={dashboard?.inventory_risk?.summary}
            itemsNeedingReorder={dashboard?.inventory_risk?.items_needing_reorder}
            controlledItems={dashboard?.inventory_risk?.controlled_items}
            controlledSubstancesCount={dashboard?.inventory_risk?.controlled_substances_count}
          />

          <FacilityAdminServicesSection
            isDark={isDark}
            summary={dashboard?.service_pricing?.summary}
            topServicesByPrice={dashboard?.service_pricing?.top_services_by_price}
            categoryBreakdown={dashboard?.service_pricing?.category_breakdown}
          />
        </div>

        {!dashboard?.financial && (
          <div
            className={cn(
              'rounded-2xl border p-5',
              isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl',
                  isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h3 className={cn('text-sm font-semibold', ui.text)}>
                  Financial detail is intentionally minimal here
                </h3>
                <p className={cn('mt-1 text-sm', ui.textSecondary)}>
                  This overview only surfaces the essential revenue signal. Use the dedicated
                  financial dashboard for full billing and revenue analytics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOverview;
