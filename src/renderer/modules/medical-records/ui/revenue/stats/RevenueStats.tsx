import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  Calendar,
  CreditCard,
  PackageX,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import type { RootState } from '../../../../../app/store/store';
import type { BillingRevenueDashboardFilters } from '../../../api/billing-revenue-stats/BillingRevenueDashboardTypes';
import { useBillingRevenueDashboardQuery } from '../../../api/billing-revenue-stats/BillingRevenueDashboardQueries';
import BillingRevenueDashboardChartTooltip from './billing-revenue-stats-component/BillingRevenueDashboardChartTooltip';
import BillingRevenueDashboardMetricGrid from './billing-revenue-stats-component/BillingRevenueDashboardMetricGrid';
import BillingRevenueDashboardSectionCard from './billing-revenue-stats-component/BillingRevenueDashboardSectionCard';
import {
  buildSnapshotCards,
  cx,
  extractArray,
  formatCompactCurrency,
  formatCompactNumber,
  formatNumber,
  formatPercent,
  hasData,
  pickNumber,
  pickString,
  toRecord,
} from  './billing-revenue-stats-component/revenueDashboardUtils';
import { formatCurrency   } from '../../../api/billing-review/BillingReviewTypes';

type TabKey = 'overview' | 'collections' | 'operations' | 'leakages';

const defaultFilters: BillingRevenueDashboardFilters = {
  group_by: 'day',
  top: 10,
};

const PAYMENT_MIX_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
];

const LEAKAGE_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981'];
const BREAKDOWN_COLORS = ['#3B82F6', '#14B8A6', '#A855F7', '#F59E0B', '#EC4899'];

const DashboardLoadingState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={cx('min-h-[420px] rounded-2xl border p-6', isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')}>
    <div className="animate-pulse space-y-4">
      <div className={cx('h-8 w-72 rounded', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
      <div className={cx('h-4 w-96 rounded', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cx(
              'h-32 rounded-xl',
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            )}
          />
        ))}
      </div>
      <div className={cx('h-80 rounded-xl mt-6', isDark ? 'bg-gray-800' : 'bg-gray-100')} />
    </div>
  </div>
);

const EmptyState: React.FC<{
  isDark: boolean;
  title: string;
  description: string;
}> = ({ isDark, title, description }) => (
  <div
    className={cx(
      'rounded-xl border p-8 text-center',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    )}
  >
    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
    <h3 className={cx('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
      {title}
    </h3>
    <p className={cx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
      {description}
    </p>
  </div>
);

export const BillingRevenueDashboard: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [draftFilters, setDraftFilters] =
    useState<BillingRevenueDashboardFilters>(defaultFilters);
  const [filters, setFilters] =
    useState<BillingRevenueDashboardFilters>(defaultFilters);

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBillingRevenueDashboardQuery(filters);

  const ui = useMemo(() => {
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

  const dashboard = useMemo(
    () => toRecord((response as { data?: unknown } | undefined)?.data),
    [response]
  );

  const snapshot = useMemo(
    () => toRecord(dashboard.snapshot),
    [dashboard]
  );

  const collections = useMemo(
    () => toRecord(dashboard.collections),
    [dashboard]
  );

  const snapshotCards = useMemo(
    () => buildSnapshotCards(snapshot),
    [snapshot]
  );

  const collectionCards = useMemo(() => {
    return [
      {
        label: 'Collected Amount',
        value: formatCurrency(
          pickNumber(collections, ['collected_amount', 'amount_collected'])
        ),
        subtext: `Collection rate ${formatPercent(
          pickNumber(collections, ['collection_rate'], 0)
        )}`,
        icon: CreditCard,
        iconClassName: 'text-emerald-500',
        accentClassName: 'border-l-4 border-emerald-500',
      },
      {
        label: 'Outstanding',
        value: formatCurrency(
          pickNumber(collections, ['outstanding_amount', 'receivable_amount'])
        ),
        subtext: `${formatNumber(
          pickNumber(collections, ['open_cycle_count', 'open_cycles_count'], 0)
        )} open cycles`,
        icon: Wallet,
        iconClassName: 'text-sky-500',
        accentClassName: 'border-l-4 border-sky-500',
      },
      {
        label: 'Overdue',
        value: formatCurrency(
          pickNumber(collections, ['overdue_amount', 'past_due_amount'])
        ),
        subtext: `${formatPercent(
          pickNumber(collections, ['overdue_rate'], 0)
        )} past due`,
        icon: AlertCircle,
        iconClassName: 'text-amber-500',
        accentClassName: 'border-l-4 border-amber-500',
      },
      {
        label: 'Avg Days to Collect',
        value: `${pickNumber(
          collections,
          ['average_days_to_collect', 'avg_days_to_collect', 'days_sales_outstanding'],
          0
        ).toFixed(1)} days`,
        subtext: 'Average collection turnaround',
        icon: Calendar,
        iconClassName: 'text-violet-500',
        accentClassName: 'border-l-4 border-violet-500',
      },
    ];
  }, [collections]);

  const revenueTrendData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.revenue_trend).map((item, idx) => ({
      label: pickString(item, ['period_label', 'label', 'period', 'date', 'day', 'name'], `P${idx + 1}`),
      gross: pickNumber(item, ['gross_amount', 'gross_revenue', 'subtotal_amount', 'total_amount_charged']),
      net: pickNumber(item, ['net_amount', 'net_revenue']),
      collected: pickNumber(item, ['collected_amount', 'payments_collected', 'paid_amount']),
      refunds: pickNumber(item, ['refund_amount', 'refunded_amount']),
    }));
  }, [dashboard]);

  const billingActivityData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.billing_activity).map((item, idx) => ({
      label: pickString(item, ['period_label', 'label', 'period', 'date', 'day', 'name'], `P${idx + 1}`),
      created: pickNumber(item, ['created', 'created_count', 'new_cycles', 'cycles_created']),
      paid: pickNumber(item, ['paid_in_full', 'paid', 'paid_count']),
      partialRefunds: pickNumber(item, ['partially_refunded', 'partial_refunds', 'partial_refunded']),
      fullRefunds: pickNumber(item, ['fully_refunded', 'full_refunds', 'full_refunded']),
      writtenOff: pickNumber(item, ['written_off', 'written_off_count']),
    }));
  }, [dashboard]);

  const revenueBreakdownData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.revenue_breakdown).map((item, idx) => ({
      label: pickString(item, ['label', 'name', 'category', 'payment_method', 'bucket'], `Item ${idx + 1}`),
      amount: pickNumber(item, ['amount', 'value', 'net_amount', 'gross_amount']),
      percentage: pickNumber(item, ['percentage', 'percent'], 0),
      fill: pickString(item, ['color', 'fill'], BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]),
    }));
  }, [dashboard]);

  const paymentMixData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.payment_mix).map((item, idx) => ({
      label: pickString(item, ['label', 'name', 'payment_method', 'method', 'channel'], `Method ${idx + 1}`),
      amount: pickNumber(item, ['amount', 'value', 'collected_amount', 'paid_amount']),
      percentage: pickNumber(item, ['percentage', 'percent'], 0),
      count: pickNumber(item, ['count', 'transactions', 'transaction_count'], 0),
      fill: pickString(item, ['color', 'fill'], PAYMENT_MIX_COLORS[idx % PAYMENT_MIX_COLORS.length]),
    }));
  }, [dashboard]);

  const financialLeakageData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.financial_leakages).map((item, idx) => ({
      label: pickString(item, ['label', 'name', 'category', 'source'], `Leakage ${idx + 1}`),
      amount: pickNumber(item, ['amount', 'value', 'loss_amount', 'estimated_loss']),
      percentage: pickNumber(item, ['percentage', 'percent'], 0),
      fill: pickString(item, ['color', 'fill'], LEAKAGE_COLORS[idx % LEAKAGE_COLORS.length]),
    }));
  }, [dashboard]);

  const performanceByDayData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.performance_by_day).map((item, idx) => ({
      label: pickString(item, ['day_name', 'day', 'label', 'name'], `Day ${idx + 1}`),
      billed: pickNumber(item, ['billed_amount', 'gross_amount', 'amount']),
      collected: pickNumber(item, ['collected_amount', 'paid_amount']),
      cycles: pickNumber(item, ['cycles_count', 'count', 'volume']),
      avgCycle: pickNumber(item, ['avg_cycle_value', 'average_cycle_value', 'avg_value']),
    }));
  }, [dashboard]);

  const staffContributionData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.staff_contribution).map((item, idx) => ({
      label: pickString(item, ['staff_name', 'name', 'provider_name', 'user_name'], `Staff ${idx + 1}`),
      billed: pickNumber(item, ['billed_amount', 'gross_amount', 'amount']),
      collected: pickNumber(item, ['collected_amount', 'paid_amount']),
      visits: pickNumber(item, ['visit_count', 'encounters_count', 'count']),
    }));
  }, [dashboard]);

  const inventoryLeakageData = useMemo(() => {
    return extractArray<Record<string, unknown>>(dashboard.inventory_leakage).map((item, idx) => ({
      label: pickString(item, ['item_name', 'name', 'label'], `Inventory ${idx + 1}`),
      category: pickString(item, ['category', 'group'], '—'),
      variance: pickNumber(item, ['quantity_variance', 'variance', 'count_variance']),
      estimatedLoss: pickNumber(item, ['estimated_loss', 'loss_amount', 'amount']),
      fill: pickString(item, ['color', 'fill'], '#F97316'),
    }));
  }, [dashboard]);

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

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'collections', label: 'Collections' },
    { key: 'operations', label: 'Operations' },
    { key: 'leakages', label: 'Leakages' },
  ];

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
          className="mt-5 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cx('p-4 sm:p-6 space-y-6 min-h-screen', ui.pageBg)}>
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="min-w-0">
          <h1 className={cx('text-2xl sm:text-3xl font-bold', ui.text)}>
            Billing Revenue Dashboard
          </h1>
          <p className={cx('text-sm sm:text-base mt-1', ui.textSecondary)}>
            Revenue, collections, refunds, billing activity, and leakage insights
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
            <RefreshCw className={cx('w-4 h-4', isFetching && 'animate-spin')} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={cx(cardClassName, 'space-y-4')}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className={cx('text-base font-semibold', ui.text)}>Filters</h2>
            <p className={cx('text-sm mt-1', ui.textSecondary)}>
              Choose a date range and grouping to update dashboard views
            </p>
          </div>

          <span className={cx('text-sm', ui.textSecondary)}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div>
            <label className={cx('block text-sm font-medium mb-1', ui.textSecondary)}>
              Date from
            </label>
            <input
              type="date"
              value={draftFilters.date_from ?? ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  date_from: e.target.value || undefined,
                }))
              }
              className={cx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none',
                isDark
                  ? 'bg-gray-950 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            />
          </div>

          <div>
            <label className={cx('block text-sm font-medium mb-1', ui.textSecondary)}>
              Date to
            </label>
            <input
              type="date"
              value={draftFilters.date_to ?? ''}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  date_to: e.target.value || undefined,
                }))
              }
              className={cx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none',
                isDark
                  ? 'bg-gray-950 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            />
          </div>

          <div>
            <label className={cx('block text-sm font-medium mb-1', ui.textSecondary)}>
              Group by
            </label>
            <select
              value={draftFilters.group_by ?? 'day'}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  group_by: e.target.value as BillingRevenueDashboardFilters['group_by'],
                }))
              }
              className={cx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none',
                isDark
                  ? 'bg-gray-950 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>

          <div>
            <label className={cx('block text-sm font-medium mb-1', ui.textSecondary)}>
              Top results
            </label>
            <select
              value={draftFilters.top ?? 10}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  top: Number(e.target.value),
                }))
              }
              className={cx(
                'w-full rounded-lg border px-3 py-2 text-sm outline-none',
                isDark
                  ? 'bg-gray-950 border-gray-700 text-gray-100'
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
              <option value={20}>Top 20</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="cursor-pointer w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Apply
            </button>
            <button
              onClick={handleResetFilters}
              className={cx(
                'cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition',
                isDark
                  ? 'border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav
        className={cx(
          'inline-flex flex-wrap gap-1 p-1 rounded-xl border',
          ui.border,
          isDark ? 'bg-gray-900' : 'bg-white'
        )}
        aria-label="Billing dashboard tabs"
      >
        {tabs.map((tab) => {
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

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <BillingRevenueDashboardMetricGrid
            metrics={snapshotCards}
            isDark={isDark}
            cardClassName={cardClassName}
            text={ui.text}
            textSecondary={ui.textSecondary}
            textMuted={ui.textMuted}
            grid={ui.grid}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BillingRevenueDashboardSectionCard
              title="Revenue Trend"
              subtitle="Gross, net, collections, and refunds over time"
              icon={<TrendingUp className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(revenueTrendData) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueTrendData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        dataKey="label"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactCurrency(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      <Bar dataKey="gross" fill="#3B82F6" name="Gross" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="net" stroke="#10B981" strokeWidth={2.5} name="Net" dot={false} />
                      <Line type="monotone" dataKey="collected" stroke="#8B5CF6" strokeWidth={2.5} name="Collected" dot={false} />
                      <Line type="monotone" dataKey="refunds" stroke="#F59E0B" strokeWidth={2} name="Refunds" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No trend data"
                  description="Revenue trend results will appear here once data is available."
                />
              )}
            </BillingRevenueDashboardSectionCard>

            <BillingRevenueDashboardSectionCard
              title="Revenue Breakdown"
              subtitle="Breakdown of revenue sources/categories"
              icon={<Activity className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(revenueBreakdownData) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueBreakdownData}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        type="number"
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactCurrency(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={120}
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {revenueBreakdownData.map((entry, index) => (
                          <Cell key={`breakdown-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No breakdown data"
                  description="Revenue categories will appear here once the API returns them."
                />
              )}
            </BillingRevenueDashboardSectionCard>
          </div>

          <BillingRevenueDashboardSectionCard
            title="Payment Mix"
            subtitle="Collected revenue by payment method/channel"
            icon={<CreditCard className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
          >
            {hasData(paymentMixData) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="amount"
                        nameKey="label"
                        paddingAngle={2}
                        label={false}
                      >
                        {paymentMixData.map((entry, index) => (
                          <Cell key={`payment-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {paymentMixData.map((item) => (
                    <div
                      key={item.label}
                      className={cx(
                        'rounded-lg border p-3 flex items-center justify-between gap-4',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <div className="min-w-0">
                          <p className={cx('text-sm font-medium truncate', ui.text)}>
                            {item.label}
                          </p>
                          <p className={cx('text-xs', ui.textMuted)}>                            {formatNumber(item.count)} transactions • {formatPercent(item.percentage)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                          {formatCurrency(item.amount)}
                        </p>
                        <p className={cx('text-xs', ui.textMuted)}>
                          {formatCompactCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                isDark={isDark}
                title="No payment mix data"
                description="Payment method distribution will appear here once collection data is available."
              />
            )}
          </BillingRevenueDashboardSectionCard>
        </div>
      )}

      {/* COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <BillingRevenueDashboardMetricGrid
            metrics={collectionCards}
            isDark={isDark}
            cardClassName={cardClassName}
            text={ui.text}
            textSecondary={ui.textSecondary}
            textMuted={ui.textMuted}
            grid={ui.grid}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BillingRevenueDashboardSectionCard
              title="Collections vs Refunds"
              subtitle="Collected cash compared with refunds and net revenue over time"
              icon={<Wallet className={isDark ? 'text-green-300' : 'text-green-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(revenueTrendData) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={revenueTrendData}
                      margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        dataKey="label"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactCurrency(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      <Bar
                        dataKey="collected"
                        fill="#10B981"
                        name="Collected"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        type="monotone"
                        dataKey="refunds"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        name="Refunds"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        name="Net Revenue"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No collections trend data"
                  description="Collections, refunds, and net revenue trends will appear here."
                />
              )}
            </BillingRevenueDashboardSectionCard>

            <BillingRevenueDashboardSectionCard
              title="Collections Summary"
              subtitle="Key operational collection metrics"
              icon={<CreditCard className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
              right={
                <span
                  className={cx(
                    'text-sm px-2 py-1 rounded-md border',
                    ui.border,
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
                  )}
                >
                  {formatPercent(pickNumber(collections, ['collection_rate'], 0))}
                </span>
              }
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Total Billed</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatCurrency(
                      pickNumber(snapshot, [
                        'gross_revenue',
                        'gross_amount',
                        'subtotal_amount',
                        'total_amount_charged',
                      ])
                    )}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Collected</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatCurrency(
                      pickNumber(collections, ['collected_amount', 'amount_collected'])
                    )}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Outstanding</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatCurrency(
                      pickNumber(collections, ['outstanding_amount', 'receivable_amount'])
                    )}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Overdue</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatCurrency(
                      pickNumber(collections, ['overdue_amount', 'past_due_amount'])
                    )}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Open Cycles</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatNumber(
                      pickNumber(collections, ['open_cycle_count', 'open_cycles_count'], 0)
                    )}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Avg Days to Collect</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {pickNumber(
                      collections,
                      [
                        'average_days_to_collect',
                        'avg_days_to_collect',
                        'days_sales_outstanding',
                      ],
                      0
                    ).toFixed(1)}{' '}
                    days
                  </p>
                </div>
              </div>
            </BillingRevenueDashboardSectionCard>
          </div>

          <BillingRevenueDashboardSectionCard
            title="Payment Channel Performance"
            subtitle="Detailed collected revenue by payment method"
            icon={<CreditCard className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
          >
            {hasData(paymentMixData) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={paymentMixData}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        type="number"
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactCurrency(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={120}
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {paymentMixData.map((entry, index) => (
                          <Cell key={`payment-bar-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {paymentMixData.map((item) => (
                    <div
                      key={item.label}
                      className={cx(
                        'rounded-xl border p-4',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.fill }}
                            />
                            <p className={cx('text-sm font-medium truncate', ui.text)}>
                              {item.label}
                            </p>
                          </div>
                          <p className={cx('text-xs mt-1', ui.textMuted)}>
                            {formatNumber(item.count)} transactions • {formatPercent(item.percentage)}
                          </p>
                        </div>

                        <p className={cx('text-sm font-semibold shrink-0', ui.text)}>
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                isDark={isDark}
                title="No payment channel data"
                description="Collected revenue by payment method will be listed here."
              />
            )}
          </BillingRevenueDashboardSectionCard>
        </div>
      )}

      {/* OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <BillingRevenueDashboardSectionCard
            title="Billing Activity Trends"
            subtitle="Cycle creation, paid cycles, refunds, and write-offs over time"
            icon={<Activity className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
          >
            {hasData(billingActivityData) ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={billingActivityData}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                    <XAxis
                      dataKey="label"
                      stroke={ui.grid}
                      tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    />
                    <YAxis
                      stroke={ui.grid}
                      tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                    />
                    <BillingRevenueDashboardChartTooltip
                      isDark={isDark}
                      bg={ui.tooltipBg}
                      border={ui.tooltipBorder}
                      text={ui.tooltipText}
                    />
                    <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                    <Bar
                      dataKey="created"
                      fill="#3B82F6"
                      name="Created"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      name="Paid in Full"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="partialRefunds"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Partially Refunded"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="fullRefunds"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Fully Refunded"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="writtenOff"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Written Off"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                isDark={isDark}
                title="No billing activity data"
                description="Operational billing activity will appear here once records are available."
              />
            )}
          </BillingRevenueDashboardSectionCard>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BillingRevenueDashboardSectionCard
              title="Performance by Day"
              subtitle="Daily billing, collections, and throughput"
              icon={<Calendar className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(performanceByDayData) ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={performanceByDayData}
                      margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                      <XAxis
                        dataKey="label"
                        stroke={ui.grid}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactCurrency(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={ui.grid}
                        tickFormatter={(value) => formatCompactNumber(Number(value))}
                        tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                      />
                      <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                      />
                      <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      <Bar
                        yAxisId="left"
                        dataKey="billed"
                        fill="#3B82F6"
                        name="Billed"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="collected"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        name="Collected"
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cycles"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        name="Cycle Count"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No day performance data"
                  description="Performance by weekday will appear here when available."
                />
              )}
            </BillingRevenueDashboardSectionCard>

            <BillingRevenueDashboardSectionCard
              title="Staff Contribution"
              subtitle="Top contributors by billed and collected amounts"
              icon={<Users className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(staffContributionData) ? (
                <div className="space-y-4">
                  {staffContributionData.map((item) => {
                    const maxBilled = Math.max(
                      ...staffContributionData.map((row) => row.billed),
                      1
                    );
                    const width = `${Math.max((item.billed / maxBilled) * 100, 4)}%`;

                    return (
                      <div
                        key={item.label}
                        className={cx(
                          'rounded-xl border p-4',
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className={cx('text-sm font-medium truncate', ui.text)}>
                              {item.label}
                            </p>
                            <p className={cx('text-xs mt-1', ui.textMuted)}>
                              {formatCompactNumber(item.visits)} visits
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className={cx('text-sm font-semibold', ui.text)}>
                              {formatCurrency(item.billed)}
                            </p>
                            <p className={cx('text-xs', ui.textMuted)}>
                              Collected {formatCurrency(item.collected)}
                            </p>
                          </div>
                        </div>

                        <div
                          className={cx(
                            'w-full h-2 rounded-full overflow-hidden',
                            isDark ? 'bg-gray-800' : 'bg-gray-200'
                          )}
                        >
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No staff contribution data"
                  description="Top staff contribution insights will appear here."
                />
              )}
            </BillingRevenueDashboardSectionCard>
          </div>
        </div>
      )}

      {/* LEAKAGES */}
      {activeTab === 'leakages' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cx(cardClassName, 'border-l-4 border-red-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Financial Leakage</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {formatCurrency(
                  financialLeakageData.reduce((sum, item) => sum + item.amount, 0)
                )}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-orange-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Inventory Leakage</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {formatCurrency(
                  inventoryLeakageData.reduce((sum, item) => sum + item.estimatedLoss, 0)
                )}
              </p>
            </div>

            <div className={cx(cardClassName, 'border-l-4 border-amber-500')}>
              <p className={cx('text-sm', ui.textSecondary)}>Leakage Rate</p>
              <p className={cx('text-2xl font-bold mt-1', ui.text)}>
                {formatPercent(
                  pickNumber(snapshot, ['financial_leakage_rate', 'leakage_rate'], 0)
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BillingRevenueDashboardSectionCard
              title="Financial Leakage Breakdown"
              subtitle="Loss drivers such as refunds, discounts, write-offs, and adjustments"
              icon={<AlertCircle className={isDark ? 'text-red-300' : 'text-red-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(financialLeakageData) ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialLeakageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="amount"
                          nameKey="label"
                          paddingAngle={2}
                          label={false}
                        >
                          {financialLeakageData.map((entry, index) => (
                            <Cell key={`leakage-pie-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <BillingRevenueDashboardChartTooltip
                          isDark={isDark}
                          bg={ui.tooltipBg}
                          border={ui.tooltipBorder}
                          text={ui.tooltipText}
                        />
                        <Legend wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {financialLeakageData.map((item) => (
                      <div
                        key={item.label}
                        className={cx(
                          'rounded-xl border p-4',
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.fill }}
                              />
                              <p className={cx('text-sm font-medium truncate', ui.text)}>
                                {item.label}
                              </p>
                            </div>
                            <p className={cx('text-xs mt-1', ui.textMuted)}>
                              {formatPercent(item.percentage)}
                            </p>
                          </div>

                          <p className={cx('text-sm font-semibold shrink-0', ui.text)}>
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No leakage breakdown data"
                  description="Financial leakage sources will appear here once returned by the API."
                />
              )}
            </BillingRevenueDashboardSectionCard>

            <BillingRevenueDashboardSectionCard
              title="Inventory Leakage"
              subtitle="Stock or inventory-related losses affecting revenue"
              icon={<PackageX className={isDark ? 'text-orange-300' : 'text-orange-700'} />}
              cardClassName={cardClassName}
              isDark={isDark}
              text={ui.text}
              textSecondary={ui.textSecondary}
            >
              {hasData(inventoryLeakageData) ? (
                <div className="space-y-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={inventoryLeakageData}
                        layout="vertical"
                        margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                        <XAxis
                          type="number"
                          stroke={ui.grid}
                          tickFormatter={(value) => formatCompactCurrency(Number(value))}
                          tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={120}
                          stroke={ui.grid}
                          tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                        />
                        <BillingRevenueDashboardChartTooltip
                          isDark={isDark}
                          bg={ui.tooltipBg}
                          border={ui.tooltipBorder}
                          text={ui.tooltipText}
                        />
                        <Bar dataKey="estimatedLoss" radius={[0, 4, 4, 0]}>
                          {inventoryLeakageData.map((entry, index) => (
                            <Cell key={`inventory-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {inventoryLeakageData.map((item) => (
                      <div
                        key={`${item.label}-${item.category}`}
                        className={cx(
                          'rounded-xl border p-4',
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={cx('text-sm font-medium truncate', ui.text)}>
                              {item.label}
                            </p>
                            <p className={cx('text-xs mt-1', ui.textMuted)}>
                              {item.category} • Variance {formatNumber(item.variance)}
                            </p>
                          </div>

                          <p className={cx('text-sm font-semibold shrink-0', ui.text)}>
                            {formatCurrency(item.estimatedLoss)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  isDark={isDark}
                  title="No inventory leakage data"
                  description="Inventory-related losses will be shown here when supplied by the backend."
                />
              )}
            </BillingRevenueDashboardSectionCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingRevenueDashboard;
