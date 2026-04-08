import React, { useMemo } from 'react';
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
import {Calendar, CreditCard, Database, FileText, Wallet } from 'lucide-react';

import BillingRevenueDashboardChartTooltip from './BillingRevenueDashboardChartTooltip';
import BillingRevenueDashboardMetricGrid from './BillingRevenueDashboardMetricGrid';
import BillingRevenueDashboardSectionCard from './BillingRevenueDashboardSectionCard';
import {
  PAYMENT_MIX_COLORS,
  STATUS_COLORS,
  type BillingRevenueDashboardTabProps,
} from './billingRevenueDashboardShared';
import {
  cx,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatText,
  hasData,
  type DashboardMetricCard,
} from './revenueDashboardUtils';

const BillingRevenueDashboardCollectionsTab: React.FC<BillingRevenueDashboardTabProps> = ({
  dashboard,
  isDark,
  ui,
  cardClassName,
}) => {
  const collectionsSummary = dashboard?.collections?.summary;
  const collectionsAging = dashboard?.collections?.aging ?? [];
  const collectionsStatusDistribution = dashboard?.collections?.status_distribution ?? [];
  const revenueTrend = dashboard?.revenue_trend ?? [];
  const paymentMethods = dashboard?.payment_mix?.methods ?? [];
  const paymentMixSummary = dashboard?.payment_mix?.summary;

  const collectionCards = useMemo<DashboardMetricCard[]>(() => {
    if (!collectionsSummary) return [];

    return [
      {
        label: 'Total Outstanding Balance',
        value: formatCurrency(collectionsSummary.total_outstanding_balance),
        icon: Wallet,
        iconClassName: 'text-sky-500',
        accentClassName: 'border-l-4 border-sky-500',
      },
      {
        label: 'Pending Invoices Count',
        value: formatNumber(collectionsSummary.pending_invoices_count),
        icon: FileText,
        iconClassName: 'text-amber-500',
        accentClassName: 'border-l-4 border-amber-500',
      },
      {
        label: 'Average Days Outstanding',
        value: `${collectionsSummary.average_days_outstanding.toFixed(1)} days`,
        icon: Calendar,
        iconClassName: 'text-violet-500',
        accentClassName: 'border-l-4 border-violet-500',
      },
      {
        label: 'Collection Rate Percentage',
        value: formatPercent(collectionsSummary.collection_rate_percentage),
        icon: CreditCard,
        iconClassName: 'text-emerald-500',
        accentClassName: 'border-l-4 border-emerald-500',
      },
    ];
  }, [collectionsSummary]);

  const renderEmptyState = (title: string, description: string) => (
    <div
      className={cx(
        'rounded-xl border p-8 text-center',
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      )}
    >
      <Database className="w-12 h-12 mx-auto mb-3 text-amber-500" />
      <h3 className={cx('text-lg font-semibold', isDark ? 'text-gray-100' : 'text-gray-900')}>
        {title}
      </h3>
      <p className={cx('text-sm mt-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
        {description}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <BillingRevenueDashboardMetricGrid
        title="Collections Summary"
        subtitle="Only fields from collections.summary are displayed here"
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
          title="Collections Trend"
          subtitle="Total collections, outstanding balance, and net revenue over time"
          icon={<Wallet className={isDark ? 'text-green-300' : 'text-green-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(revenueTrend) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrend} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                  <XAxis
                    dataKey="period_label"
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
                    dataKey="total_collections"
                    fill="#10B981"
                    name="Total Collections"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="outstanding_balance"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    name="Outstanding Balance"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_revenue"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    name="Net Revenue"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            renderEmptyState(
              'No collections trend data',
              'Collection-related trend points will appear here when provided by the backend.'
            )
          )}
        </BillingRevenueDashboardSectionCard>

        <BillingRevenueDashboardSectionCard
          title="Aging Buckets"
          subtitle="Bucket ranges, count, and amount from collections.aging"
          icon={<Calendar className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(collectionsAging) ? (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={collectionsAging} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
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
                      dataKey="amount"
                      fill="#3B82F6"
                      name="Amount"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="count"
                      fill="#10B981"
                      name="Count"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {collectionsAging.map((item) => (
                  <div
                    key={item.label}
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cx('text-sm font-medium', ui.text)}>{item.label}</p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                          Min {item.min} • Max {item.max === null ? 'No upper bound' : item.max}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                          {formatCurrency(item.amount)}
                        </p>
                        <p className={cx('text-xs', ui.textMuted)}>
                          {formatNumber(item.count)} invoices
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderEmptyState(
              'No aging data',
              'Collections aging buckets will appear here when available.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BillingRevenueDashboardSectionCard
            title="Status Distribution"
            subtitle="Status count and amount from collections.status_distribution"
            icon={<CreditCard className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            >
            {hasData(collectionsStatusDistribution) ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={collectionsStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="amount"
                        nameKey="billing_status"
                        paddingAngle={2}
                        label={false}
                        >
                        {collectionsStatusDistribution.map((item, index) => (
                            <Cell
                            key={`status-distribution-${item.billing_status}-${index}`}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                            />
                        ))}
                        </Pie>
                        <BillingRevenueDashboardChartTooltip
                        isDark={isDark}
                        bg={ui.tooltipBg}
                        border={ui.tooltipBorder}
                        text={ui.tooltipText}
                        />
                        <Legend 
                        wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }}
                        formatter={(value) => formatText(value)}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    {collectionsStatusDistribution.map((item, index) => (
                    <div
                        key={item.billing_status}
                        className={cx(
                        'rounded-xl border p-4',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                            />
                            <div className="min-w-0">
                            <p className={cx('text-sm font-medium', ui.text)}>
                                {formatText(item.billing_status)}
                            </p>
                            <p className={cx('text-xs mt-1', ui.textMuted)}>
                                {formatNumber(item.count)} invoices
                            </p>
                            </div>
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
                renderEmptyState(
                'No status distribution data',
                'Billing status distribution will appear here when available.'
                )
            )}
            </BillingRevenueDashboardSectionCard>

        <BillingRevenueDashboardSectionCard
          title="Payment Mix Summary"
          subtitle="Method totals plus payment summary fields"
          icon={<CreditCard className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(paymentMethods) || paymentMixSummary ? (
            <div className="space-y-4">
              {hasData(paymentMethods) ? (
                <div className="space-y-3">
                  {paymentMethods.map((item, index) => (
                    <div
                      key={item.payment_method}
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
                              style={{
                                backgroundColor: PAYMENT_MIX_COLORS[index % PAYMENT_MIX_COLORS.length],
                              }}
                            />
                            <p className={cx('text-sm font-medium truncate', ui.text)}>
                              {item.payment_method}
                            </p>
                          </div>
                          <p className={cx('text-xs mt-1', ui.textMuted)}>
                            {formatNumber(item.count)} payments • {formatPercent(item.share_percentage)}
                          </p>
                        </div>

                        <p className={cx('text-sm font-semibold shrink-0', ui.text)}>
                          {formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {paymentMixSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <p className={cx('text-sm', ui.textSecondary)}>Patient Contribution</p>
                    <p className={cx('text-xl font-bold mt-1', ui.text)}>
                      {formatCurrency(paymentMixSummary.patient_contribution)}
                    </p>
                  </div>

                  <div
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <p className={cx('text-sm', ui.textSecondary)}>Insurance Contribution</p>
                    <p className={cx('text-xl font-bold mt-1', ui.text)}>
                      {formatCurrency(paymentMixSummary.insurance_contribution)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            renderEmptyState(
              'No payment mix data',
              'Payment methods and payment summary will appear here when supplied by the backend.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
      </div>
    </div>
  );
};

export default BillingRevenueDashboardCollectionsTab;
