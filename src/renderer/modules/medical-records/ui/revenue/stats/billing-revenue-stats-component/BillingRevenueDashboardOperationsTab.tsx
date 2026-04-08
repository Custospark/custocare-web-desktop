import React, { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Database, Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';

import BillingRevenueDashboardChartTooltip from './BillingRevenueDashboardChartTooltip';
import BillingRevenueDashboardSectionCard from './BillingRevenueDashboardSectionCard';
import type { BillingRevenueDashboardTabProps } from './billingRevenueDashboardShared';
import {
  cx,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
  hasData,
} from './revenueDashboardUtils';

const BillingRevenueDashboardOperationsTab: React.FC<BillingRevenueDashboardTabProps> = ({
  dashboard,
  isDark,
  ui,
  cardClassName,
}) => {
  const billingActivity = dashboard?.billing_activity ?? [];
  const performanceByDay = dashboard?.performance_by_day ?? [];
  const staffContribution = dashboard?.staff_contribution ?? [];
  const [showAllDaysDetails, setShowAllDaysDetails] = useState(false);

  const maxStaffNetRevenue = useMemo(
    () => Math.max(...staffContribution.map((item) => item.net_revenue), 0),
    [staffContribution]
  );

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
      {/* Performance by Day - Full Width */}
      <BillingRevenueDashboardSectionCard
        title="Performance by Day"
        subtitle="Day-of-week invoice count, revenue, and average bill value"
        icon={<Calendar className={isDark ? 'text-violet-300' : 'text-violet-700'} />}
        cardClassName={cardClassName}
        isDark={isDark}
        text={ui.text}
        textSecondary={ui.textSecondary}
      >
        {hasData(performanceByDay) ? (
          <div className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={performanceByDay}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                  <XAxis
                    dataKey="day_of_week"
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
                    dataKey="gross_billed_amount"
                    fill="#3B82F6"
                    name="Gross Billed Amount"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="net_revenue"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    name="Net Revenue"
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="average_bill_value"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Average Bill Value"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="invoice_count"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Invoice Count"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Cards - Always Visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={cx(
                'rounded-lg border p-4',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              )}>
                <p className={cx('text-xs', ui.textMuted)}>Total Weekly Revenue</p>
                <p className={cx('text-xl font-bold mt-1', ui.text)}>
                  {formatCurrency(performanceByDay.reduce((sum, day) => sum + day.net_revenue, 0))}
                </p>
              </div>
              <div className={cx(
                'rounded-lg border p-4',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              )}>
                <p className={cx('text-xs', ui.textMuted)}>Total Invoices</p>
                <p className={cx('text-xl font-bold mt-1', ui.text)}>
                  {formatNumber(performanceByDay.reduce((sum, day) => sum + day.invoice_count, 0))}
                </p>
              </div>
              <div className={cx(
                'rounded-lg border p-4',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              )}>
                <p className={cx('text-xs', ui.textMuted)}>Best Day</p>
                <p className={cx('text-xl font-bold mt-1', ui.text)}>
                  {performanceByDay.reduce((best, current) => 
                    current.net_revenue > best.net_revenue ? current : best
                  ).day_of_week}
                </p>
              </div>
              <div className={cx(
                'rounded-lg border p-4',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              )}>
                <p className={cx('text-xs', ui.textMuted)}>Avg Daily Revenue</p>
                <p className={cx('text-xl font-bold mt-1', ui.text)}>
                  {formatCurrency(performanceByDay.reduce((sum, day) => sum + day.net_revenue, 0) / performanceByDay.length)}
                </p>
              </div>
            </div>

            {/* Toggle Button for Details */}
            <button
              onClick={() => setShowAllDaysDetails(!showAllDaysDetails)}
              className={cx(
                'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors',
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              )}
            >
              {showAllDaysDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show More Details
                </>
              )}
            </button>

            {/* Detailed Metrics - Shows/Hides for ALL days */}
            {showAllDaysDetails && (
              <div className="space-y-3 mt-4">
                <p className={cx('text-sm font-semibold', ui.text)}>
                  Detailed Metrics by Day
                </p>
                {performanceByDay.map((item) => (
                  <div
                    key={`${item.day_of_week_number}-${item.day_of_week}`}
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cx('text-sm font-medium', ui.text)}>
                          {item.day_of_week}
                        </p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                          Day #{formatNumber(item.day_of_week_number)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Collection Efficiency</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {item.gross_billed_amount > 0
                              ? formatPercent((item.net_revenue / item.gross_billed_amount) * 100)
                              : '0%'}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Revenue per Invoice</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatCurrency(item.average_bill_value)}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Gross to Net Ratio</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {item.gross_billed_amount > 0
                              ? formatPercent((item.net_revenue / item.gross_billed_amount) * 100)
                              : '0%'}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Total Adjustments</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatCurrency(item.gross_billed_amount - item.net_revenue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dashed" className={cx(
                      'mt-3 pt-3 border-t border-dashed',
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    )}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className={cx('text-xs', ui.textMuted)}>vs Best Day:</span>
                          <span className={cx('font-semibold', ui.text)}>
                            {formatPercent((item.net_revenue / Math.max(...performanceByDay.map(d => d.net_revenue))) * 100)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={cx('text-xs', ui.textMuted)}>vs Average:</span>
                          <span className={cx('font-semibold', ui.text)}>
                            {formatPercent((item.net_revenue / (performanceByDay.reduce((sum, d) => sum + d.net_revenue, 0) / performanceByDay.length)) * 100)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={cx('text-xs', ui.textMuted)}>Contribution:</span>
                          <span className={cx('font-semibold', ui.text)}>
                            {formatPercent((item.net_revenue / performanceByDay.reduce((sum, d) => sum + d.net_revenue, 0)) * 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          renderEmptyState(
            'No day performance data',
            'Performance-by-day items will appear here when available.'
          )
        )}
      </BillingRevenueDashboardSectionCard>

      {/* Billing Activity Trends and Staff Contribution - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Billing Activity Trends */}
        <BillingRevenueDashboardSectionCard
          title="Billing Activity Trends"
          subtitle="Invoice count and bill value metrics over time"
          icon={<Activity className={isDark ? 'text-blue-300' : 'text-blue-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(billingActivity) ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={billingActivity}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} />
                  <XAxis
                    dataKey="period_label"
                    stroke={ui.grid}
                    tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={ui.grid}
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                    tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
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
                    yAxisId="left"
                    dataKey="invoice_count"
                    fill="#3B82F6"
                    name="Invoice Count"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="average_bill_value"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    name="Average Bill Value"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="median_bill_value"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    name="Median Bill Value"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="min_bill_value"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="Min Bill Value"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="max_bill_value"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Max Bill Value"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            renderEmptyState(
              'No billing activity data',
              'Billing activity points will appear here when available'
            )
          )}
        </BillingRevenueDashboardSectionCard>

        {/* Staff Contribution */}
        <BillingRevenueDashboardSectionCard
          title="Staff Contribution"
          subtitle="Staff-level invoice count, net revenue, and average bill value"
          icon={<Users className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(staffContribution) ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {staffContribution.map((item) => {
                const width =
                  maxStaffNetRevenue > 0
                    ? `${Math.max((item.net_revenue / maxStaffNetRevenue) * 100, 4)}%`
                    : '0%';

                return (
                  <div
                    key={item.staff_id}
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className={cx('text-sm font-medium truncate', ui.text)}>
                          {item.staff_name}
                        </p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                          Staff Number {item.staff_uuid ? ` • ${item.staff_uuid}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                          {formatCurrency(item.net_revenue)}
                        </p>
                        <p className={cx('text-xs', ui.textMuted)}>
                          Avg bill {formatCurrency(item.average_bill_value)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className={cx('text-xs', ui.textMuted)}>Invoice Count</p>
                        <p className={cx('font-semibold', ui.text)}>
                          {formatNumber(item.invoice_count)}
                        </p>
                      </div>
                      <div>
                        <p className={cx('text-xs', ui.textMuted)}>Average Bill Value</p>
                        <p className={cx('font-semibold', ui.text)}>
                          {formatCurrency(item.average_bill_value)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={cx(
                        'w-full h-2 rounded-full overflow-hidden',
                        isDark ? 'bg-gray-800' : 'bg-gray-200'
                      )}
                    >
                      <div className="h-full rounded-full bg-blue-500" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            renderEmptyState(
              'No staff contribution data',
              'Staff contribution items will appear here when available.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
      </div>
    </div>
  );
};

export default BillingRevenueDashboardOperationsTab;