import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, RefreshCw } from 'lucide-react';

import type { RootState } from '../../../../../app/store/store';
import type { BillingRevenueDashboardFilters } from '../../../api/billing-revenue-stats/BillingRevenueDashboardTypes';
import { useBillingRevenueDashboardQuery } from '../../../api/billing-revenue-stats/BillingRevenueDashboardQueries';
import BillingRevenueDashboardCollectionsTab from './billing-revenue-stats-component/BillingRevenueDashboardCollectionsTab';
import BillingRevenueDashboardFiltersBar from './billing-revenue-stats-component/BillingRevenueDashboardFiltersBar';
import BillingRevenueDashboardLeakagesTab from './billing-revenue-stats-component/BillingRevenueDashboardLeakagesTab';
import BillingRevenueDashboardOperationsTab from './billing-revenue-stats-component/BillingRevenueDashboardOperationsTab';
import BillingRevenueDashboardOverviewTab from './billing-revenue-stats-component/BillingRevenueDashboardOverviewTab';
import {
  dashboardTabs,
  defaultFilters,
  type BillingRevenueDashboardUi,
  type TabKey,
} from './billing-revenue-stats-component/billingRevenueDashboardShared';
import { cx } from './billing-revenue-stats-component/revenueDashboardUtils';

const DashboardLoadingState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div
    className={cx(
      'min-h-[420px] rounded-2xl border p-6',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    )}
  >
    <div className="animate-pulse space-y-4">
      <div className={cx('h-8 w-72 rounded', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
      <div className={cx('h-4 w-96 rounded', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cx('h-32 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-100')}
          />
        ))}
      </div>
      <div className={cx('h-80 rounded-xl mt-6', isDark ? 'bg-gray-800' : 'bg-gray-100')} />
    </div>
  </div>
);

export const RevenueStats: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [draftFilters, setDraftFilters] =
    useState<BillingRevenueDashboardFilters>(defaultFilters);
  const [filters, setFilters] = useState<BillingRevenueDashboardFilters>(defaultFilters);

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBillingRevenueDashboardQuery(filters);

  const ui = useMemo<BillingRevenueDashboardUi>(() => {
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

  const dashboard = response?.data;

  const handleRefresh = useCallback(() => {
    refetch();
    setLastRefreshed(new Date());
  }, [refetch]);

  const handleApplyFilters = useCallback(() => {
    setFilters(draftFilters);
  }, [draftFilters]);

  const handleResetFilters = useCallback(() => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  }, []);

  if (isLoading && !response) {
    return <DashboardLoadingState isDark={isDark} />;
  }

  if (error) {
    return (
      <div className={cx('p-8 text-center rounded-2xl border', ui.surface, ui.border)}>
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h3 className={cx('text-xl font-semibold mb-2', ui.text)}>
          Failed to Load Billing Revenue Dashboard
        </h3>
        <p className={ui.textSecondary}>
          Please review the selected filters or try refreshing again.
        </p>
        <button
          onClick={handleRefresh}
          type="button"
          className="mt-5 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cx('p-4 sm:p-6 space-y-6 min-h-screen', ui.pageBg)}>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="min-w-0">
          <h1 className={cx('text-2xl sm:text-3xl font-bold', ui.text)}>
            Billing Revenue Dashboard
          </h1>
          <p className={cx('text-sm sm:text-base mt-1', ui.textSecondary)}>
            Revenue, collections, billing activity, payment mix, and leakage data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            type="button"
            className={cx(
              'cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors',
              isDark
                ? 'bg-gray-900 hover:bg-gray-800 text-gray-200 border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <RefreshCw className={cx('w-4 h-4', isFetching && 'animate-spin')} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <BillingRevenueDashboardFiltersBar
        isDark={isDark}
        isFetching={isFetching}
        ui={ui}
        cardClassName={cardClassName}
        lastRefreshed={lastRefreshed}
        draftFilters={draftFilters}
        onDraftFiltersChange={setDraftFilters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
      />

      <nav
        className={cx(
          'inline-flex flex-wrap gap-1 p-1 rounded-xl border',
          ui.border,
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
        aria-label="Billing dashboard tabs"
      >
        {dashboardTabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
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
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'overview' && (
        <BillingRevenueDashboardOverviewTab
          dashboard={dashboard}
          isDark={isDark}
          ui={ui}
          cardClassName={cardClassName}
        />
      )}

      {activeTab === 'collections' && (
        <BillingRevenueDashboardCollectionsTab
          dashboard={dashboard}
          isDark={isDark}
          ui={ui}
          cardClassName={cardClassName}
        />
      )}

      {activeTab === 'operations' && (
        <BillingRevenueDashboardOperationsTab
          dashboard={dashboard}
          isDark={isDark}
          ui={ui}
          cardClassName={cardClassName}
        />
      )}

      {activeTab === 'leakages' && (
        <BillingRevenueDashboardLeakagesTab
          dashboard={dashboard}
          isDark={isDark}
          ui={ui}
          cardClassName={cardClassName}
        />
      )}
    </div>
  );
};

export default RevenueStats;
