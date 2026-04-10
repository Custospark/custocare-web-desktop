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
} from  '../../api/admin-overview/FacilityAdminAnalyticsTypes';

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
  textMuted: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const ui = useMemo<DashboardUi>(() => {
    return {
      pageBg: isDark ? 'bg-gray-950' : 'bg-gray-50',
      surface: isDark ? 'bg-gray-900' : 'bg-white',
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

  const [selectedGroupBy, setSelectedGroupBy] = useState<AnalyticsGroupBy>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [appliedFilters, setAppliedFilters] = useState<FacilityAdminAnalyticsFilters>({
    group_by: 'week',
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

  const presenceWorkloadSeries = useMemo(() => {
    const presence = dashboard?.staff_availability.presence_trend ?? [];
    const workload = dashboard?.staff_availability.workload_trend ?? [];

    const workloadMap = new Map(
      workload.map((item) => [
        item.date,
        {
          totalActivePatients: item.total_active_patients,
          uniqueStaffAssigned: item.unique_staff_assigned,
          avgPatientsPerStaff: item.avg_patients_per_staff,
        },
      ])
    );

    return presence.map((item) => {
      const matchingWorkload = workloadMap.get(item.date);

      return {
        label: formatDateLabel(item.date),
        rawDate: item.date,
        onDuty: item.on_duty,
        busy: item.busy,
        offDuty: item.off_duty,
        totalActivePatients: matchingWorkload?.totalActivePatients ?? 0,
        uniqueStaffAssigned: matchingWorkload?.uniqueStaffAssigned ?? 0,
        avgPatientsPerStaff: matchingWorkload?.avgPatientsPerStaff ?? 0,
      };
    });
  }, [
    dashboard?.staff_availability.presence_trend,
    dashboard?.staff_availability.workload_trend,
  ]);

  const financialTrend = useMemo(() => {
    const trend = dashboard?.financial?.revenue_trend ?? [];

    return trend.map((item) => ({
      label: item.period_label,
      periodKey: item.period_key,
      netRevenue: item.net_revenue,
      collections: item.total_collections,
      outstanding: item.outstanding_balance,
      invoices: item.invoice_count,
    }));
  }, [dashboard?.financial?.revenue_trend]);

  const metrics = useMemo(() => {
    const currentSnapshot = dashboard?.staff_availability.current_snapshot;
    const capacitySummary = dashboard?.capacity_utilization.summary;
    const inventorySummary = dashboard?.inventory_risk.summary;
    const serviceSummary = dashboard?.service_pricing.summary;
    const financialSnapshot = dashboard?.financial?.snapshot;

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
        value: financialSnapshot
          ? formatCompactCurrency(financialSnapshot.net_revenue)
          : '—',
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
  }, [dashboard]);

  const handleSelectGroupBy = (value: AnalyticsGroupBy) => {
    setSelectedGroupBy(value);
    setAppliedFilters((prev) => ({
      ...prev,
      group_by: value,
      top: prev.top ?? 6,
    }));
  };

  const handleApplyDateRange = () => {
    if (!customFrom || !customTo) return;

    setAppliedFilters((prev) => ({
      ...prev,
      date_from: customFrom,
      date_to: customTo,
      group_by: selectedGroupBy,
      top: prev.top ?? 6,
    }));
  };

  const handleClearDateRange = () => {
    setCustomFrom('');
    setCustomTo('');

    setAppliedFilters((prev) => ({
      group_by: prev.group_by ?? selectedGroupBy,
      top: prev.top ?? 6,
    }));
  };

  if (isLoading) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        message="Loading facility  analytics dashboard data..."
        theme={isDark ? 'dark' : 'light'}
        className="min-h-screen"
      />
    );
  }

  if (isError) {
    return (
      <div className={cn('p-4 sm:p-6 min-h-screen', ui.pageBg)}>
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
                  'mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                  'bg-blue-600 text-white hover:bg-blue-500'
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
      <div className={cn('p-4 sm:p-6 min-h-screen', ui.pageBg)}>
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
    <div className={cn('p-4 sm:p-6 space-y-6 min-h-screen', ui.pageBg)}>
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
          revenueGrowthPercentage={dashboard.financial?.snapshot?.revenue_growth_percentage}
        />

        <FacilityAdminWorkforceSection
          isDark={isDark}
          currentSnapshot={dashboard.staff_availability.current_snapshot}
          roleDistribution={dashboard.staff_availability.role_distribution}
          highWorkloadStaff={dashboard.staff_availability.high_workload_staff}
        />

        <FacilityAdminCapacitySection
          isDark={isDark}
          summary={dashboard.capacity_utilization.summary}
          departments={dashboard.capacity_utilization.departments}
          wards={dashboard.capacity_utilization.wards}
          spaceTypes={dashboard.capacity_utilization.space_types}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <FacilityAdminInventorySection
            isDark={isDark}
            summary={dashboard.inventory_risk.summary}
            itemsNeedingReorder={dashboard.inventory_risk.items_needing_reorder}
            controlledItems={dashboard.inventory_risk.controlled_items}
            controlledSubstancesCount={dashboard.inventory_risk.controlled_substances_count}
          />

          <FacilityAdminServicesSection
            isDark={isDark}
            summary={dashboard.service_pricing.summary}
            topServicesByPrice={dashboard.service_pricing.top_services_by_price}
            categoryBreakdown={dashboard.service_pricing.category_breakdown}
          />
        </div>

        {!dashboard.financial && (
          <div
            className={cn(
              'rounded-2xl border p-5',
              isDark
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-amber-200 bg-amber-50'
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
};

export default AdminOverview;
