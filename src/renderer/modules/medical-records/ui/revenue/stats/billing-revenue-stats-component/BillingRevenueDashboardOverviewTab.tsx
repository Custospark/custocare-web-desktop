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
import { Activity, AlertCircle, CreditCard, FileText, ReceiptText, TrendingUp, Wallet } from 'lucide-react';

import BillingRevenueDashboardChartTooltip from './BillingRevenueDashboardChartTooltip';
import BillingRevenueDashboardMetricGrid from './BillingRevenueDashboardMetricGrid';
import BillingRevenueDashboardSectionCard from './BillingRevenueDashboardSectionCard';
import {
  BREAKDOWN_COLORS,
  PAYMENT_MIX_COLORS,
  type BillingRevenueDashboardTabProps,
} from './billingRevenueDashboardShared';
import {
  cx,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  hasData,
  type DashboardMetricCard,
} from './revenueDashboardUtils';

const BillingRevenueDashboardOverviewTab: React.FC<BillingRevenueDashboardTabProps> = ({
  dashboard,
  isDark,
  ui,
  cardClassName,
}) => {
  const snapshot = dashboard?.snapshot;
  const revenueTrend = dashboard?.revenue_trend ?? [];
  const revenueBreakdownByCategory = dashboard?.revenue_breakdown?.by_category ?? [];
  const revenueBreakdownByService = dashboard?.revenue_breakdown?.by_service ?? [];
  const paymentMethods = dashboard?.payment_mix?.methods ?? [];
  const paymentMixSummary = dashboard?.payment_mix?.summary;

  const snapshotCards = useMemo<DashboardMetricCard[]>(() => {
    if (!snapshot) return [];

    return [
      {
        label: 'Gross Billed Amount',
        value: formatCurrency(snapshot.gross_billed_amount),
        icon: TrendingUp,
        iconClassName: 'text-emerald-500',
        accentClassName: 'border-l-4 border-emerald-500',
      },
      {
        label: 'Net Revenue',
        value: formatCurrency(snapshot.net_revenue),
        icon: Wallet,
        iconClassName: 'text-blue-500',
        accentClassName: 'border-l-4 border-blue-500',
      },
      {
        label: 'Total Collections',
        value: formatCurrency(snapshot.total_collections),
        icon: CreditCard,
        iconClassName: 'text-violet-500',
        accentClassName: 'border-l-4 border-violet-500',
      },
      {
        label: 'Outstanding Balance',
        value: formatCurrency(snapshot.outstanding_balance),
        icon: ReceiptText,
        iconClassName: 'text-sky-500',
        accentClassName: 'border-l-4 border-sky-500',
      },
      {
        label: 'Total Invoices',
        value: formatNumber(snapshot.total_invoices),
        icon: FileText,
        iconClassName: 'text-amber-500',
        accentClassName: 'border-l-4 border-amber-500',
      },
      {
        label: 'Average Bill Value',
        value: formatCurrency(snapshot.average_bill_value),
        icon: TrendingUp,
        iconClassName: 'text-cyan-500',
        accentClassName: 'border-l-4 border-cyan-500',
      },
      {
        label: 'Median Bill Value',
        value: formatCurrency(snapshot.median_bill_value),
        icon: TrendingUp,
        iconClassName: 'text-indigo-500',
        accentClassName: 'border-l-4 border-indigo-500',
      },
      {
        label: 'Min Bill Value',
        value: formatCurrency(snapshot.min_bill_value),
        icon: TrendingUp,
        iconClassName: 'text-teal-500',
        accentClassName: 'border-l-4 border-teal-500',
      },
      {
        label: 'Max Bill Value',
        value: formatCurrency(snapshot.max_bill_value),
        icon: TrendingUp,
        iconClassName: 'text-fuchsia-500',
        accentClassName: 'border-l-4 border-fuchsia-500',
      },
      {
        label: 'Previous Period Net Revenue',
        value: formatCurrency(snapshot.previous_period_net_revenue),
        icon: Wallet,
        iconClassName: 'text-slate-500',
        accentClassName: 'border-l-4 border-slate-500',
      },
      {
        label: 'Revenue Growth Percentage',
        value: formatPercent(snapshot.revenue_growth_percentage),
        subtext: 'As returned by the backend snapshot',
        icon: TrendingUp,
        iconClassName: 'text-green-500',
        accentClassName: 'border-l-4 border-green-500',
      },
      {
        label: 'Total Leakage Amount',
        value: formatCurrency(snapshot.total_leakage_amount),
        icon: AlertCircle,
        iconClassName: 'text-rose-500',
        accentClassName: 'border-l-4 border-rose-500',
      },
      {
        label: 'Leakage Percentage',
        value: formatPercent(snapshot.leakage_percentage),
        subtext: 'As returned by the backend snapshot',
        icon: AlertCircle,
        iconClassName: 'text-orange-500',
        accentClassName: 'border-l-4 border-orange-500',
      },
    ];
  }, [snapshot]);

  const renderEmptyState = (title: string, description: string) => (
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

  return (
    <div className="space-y-6">
      <BillingRevenueDashboardMetricGrid
        title="Snapshot"
        subtitle="All values below come directly from the backend snapshot object"
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
          subtitle="Gross billed amount, net revenue, collections, and outstanding balance over time"
          icon={<TrendingUp className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
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
                    dataKey="gross_billed_amount"
                    fill="#3B82F6"
                    name="Gross Billed Amount"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="net_revenue"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    name="Net Revenue"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_collections"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    name="Total Collections"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="outstanding_balance"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Outstanding Balance"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            renderEmptyState(
              'No revenue trend data',
              'Revenue trend points will appear here when provided by the backend.'
            )
          )}
        </BillingRevenueDashboardSectionCard>

        <BillingRevenueDashboardSectionCard
          title="Revenue Breakdown by Category"
          subtitle="Category revenue, quantity sold, and share percentage"
          icon={<Activity className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(revenueBreakdownByCategory) ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueBreakdownByCategory}
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
                      dataKey="category"
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
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {revenueBreakdownByCategory.map((entry, index) => (
                        <Cell
                          key={`breakdown-category-${entry.category}-${index}`}
                          fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {revenueBreakdownByCategory.map((item) => (
                  <div
                    key={item.category}
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cx('text-sm font-medium truncate', ui.text)}>{item.category}</p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                          Quantity sold {formatNumber(item.quantity_sold)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                          {formatCurrency(item.revenue)}
                        </p>
                        <p className={cx('text-xs', ui.textMuted)}>
                          {formatPercent(item.share_percentage)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderEmptyState(
              'No category breakdown data',
              'Revenue breakdown by category will appear here when returned by the backend.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
      </div>

      <BillingRevenueDashboardSectionCard
        title="Revenue Breakdown by Service"
        subtitle="Service-level revenue, quantity, refund count, refund amount, and share percentage"
        icon={<ReceiptText className={isDark ? 'text-cyan-300' : 'text-cyan-700'} />}
        cardClassName={cardClassName}
        isDark={isDark}
        text={ui.text}
        textSecondary={ui.textSecondary}
      >
        {hasData(revenueBreakdownByService) ? (
          <div className="space-y-3">
            {revenueBreakdownByService.map((item) => (
              <div
                key={item.service_code}
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx('text-sm font-semibold truncate', ui.text)}>
                      {item.service_name}
                    </p>
                    <p className={cx('text-xs mt-1', ui.textMuted)}>
                      Code {item.service_code} • Category {item.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 xl:gap-4 text-sm">
                    <div>
                      <p className={cx('text-xs', ui.textMuted)}>Revenue</p>
                      <p className={cx('font-semibold', ui.text)}>{formatCurrency(item.revenue)}</p>
                    </div>
                    <div>
                      <p className={cx('text-xs', ui.textMuted)}>Quantity Sold</p>
                      <p className={cx('font-semibold', ui.text)}>{formatNumber(item.quantity_sold)}</p>
                    </div>
                    <div>
                      <p className={cx('text-xs', ui.textMuted)}>Avg Unit Price</p>
                      <p className={cx('font-semibold', ui.text)}>
                        {formatCurrency(item.average_unit_price)}
                      </p>
                    </div>
                    <div>
                      <p className={cx('text-xs', ui.textMuted)}>Refund Count</p>
                      <p className={cx('font-semibold', ui.text)}>{formatNumber(item.refund_count)}</p>
                    </div>
                    <div>
                      <p className={cx('text-xs', ui.textMuted)}>Refund Amount</p>
                      <p className={cx('font-semibold', ui.text)}>
                        {formatCurrency(item.refund_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className={cx('text-xs', ui.textMuted)}>
                    Share percentage {formatPercent(item.share_percentage)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderEmptyState(
            'No service breakdown data',
            'Service-level revenue breakdown will appear here when returned by the backend.'
          )
        )}
      </BillingRevenueDashboardSectionCard>

      <BillingRevenueDashboardSectionCard
        title="Payment Mix"
        subtitle="Payment methods and payment summary as returned by the backend"
        icon={<CreditCard className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
        cardClassName={cardClassName}
        isDark={isDark}
        text={ui.text}
        textSecondary={ui.textSecondary}
      >
        {hasData(paymentMethods) || paymentMixSummary ? (
          <div className="space-y-6">
            {hasData(paymentMethods) ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="amount"
                        nameKey="payment_method"
                        paddingAngle={2}
                        label={false}
                      >
                        {paymentMethods.map((item, index) => (
                          <Cell
                            key={`payment-method-${item.payment_method}-${index}`}
                            fill={PAYMENT_MIX_COLORS[index % PAYMENT_MIX_COLORS.length]}
                          />
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
                  {paymentMethods.map((item, index) => (
                    <div
                      key={item.payment_method}
                      className={cx(
                        'rounded-lg border p-3 flex items-center justify-between gap-4',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: PAYMENT_MIX_COLORS[index % PAYMENT_MIX_COLORS.length],
                          }}
                        />
                        <div className="min-w-0">
                          <p className={cx('text-sm font-medium truncate', ui.text)}>
                            {item.payment_method}
                          </p>
                          <p className={cx('text-xs', ui.textMuted)}>
                            {formatNumber(item.count)} payments • {formatPercent(item.share_percentage)}
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
            ) : null}

            {paymentMixSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Overpayment Occurrences</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatNumber(paymentMixSummary.overpayment_occurrences)}
                  </p>
                </div>

                <div
                  className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <p className={cx('text-sm', ui.textSecondary)}>Overpayment Amount</p>
                  <p className={cx('text-xl font-bold mt-1', ui.text)}>
                    {formatCurrency(paymentMixSummary.overpayment_amount)}
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
  );
};

export default BillingRevenueDashboardOverviewTab;
