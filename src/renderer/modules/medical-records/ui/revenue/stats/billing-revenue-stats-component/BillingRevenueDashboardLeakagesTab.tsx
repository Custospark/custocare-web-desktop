import React from 'react';
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
import { Database, AlertTriangle, PackageX } from 'lucide-react';

import BillingRevenueDashboardChartTooltip from './BillingRevenueDashboardChartTooltip';
import BillingRevenueDashboardSectionCard from './BillingRevenueDashboardSectionCard';
import {
  INVENTORY_COLORS,
  LEAKAGE_REASON_COLORS,
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
} from './revenueDashboardUtils';

const BillingRevenueDashboardLeakagesTab: React.FC<BillingRevenueDashboardTabProps> = ({
  dashboard,
  isDark,
  ui,
  cardClassName,
}) => {
  const snapshot = dashboard?.snapshot;
  const financialLeakages = dashboard?.financial_leakages;
  const financialLeakageSummary = financialLeakages?.summary;
  const financialLeakageReasons = financialLeakages?.by_reason ?? [];
  const financialLeakageTrend = financialLeakages?.trend ?? [];
  const financialLeakageTopCases = financialLeakages?.top_cases ?? [];
  const inventoryLeakage = dashboard?.inventory_leakage ?? [];

  const totalInventoryLeakageAmount = inventoryLeakage.reduce(
    (sum, item) => sum + item.leakage_amount,
    0
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cx(cardClassName, 'border-l-4 border-red-500')}>
          <p className={cx('text-sm', ui.textSecondary)}>Total Leakage Amount</p>
          <p className={cx('text-2xl font-bold mt-1', ui.text)}>
            {formatCurrency(snapshot?.total_leakage_amount ?? 0)}
          </p>
        </div>

        <div className={cx(cardClassName, 'border-l-4 border-orange-500')}>
          <p className={cx('text-sm', ui.textSecondary)}>Inventory Leakage Amount</p>
          <p className={cx('text-2xl font-bold mt-1', ui.text)}>
            {formatCurrency(totalInventoryLeakageAmount)}
          </p>
        </div>

        <div className={cx(cardClassName, 'border-l-4 border-amber-500')}>
          <p className={cx('text-sm', ui.textSecondary)}>Leakage Percentage</p>
          <p className={cx('text-2xl font-bold mt-1', ui.text)}>
            {formatPercent(snapshot?.leakage_percentage ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BillingRevenueDashboardSectionCard
      title="Financial Leakage by Reason"
      subtitle="Reason counts and amounts from financial_leakages.by_reason"
      icon={<Database className={isDark ? 'text-red-300' : 'text-red-700'} />}
      cardClassName={cardClassName}
      isDark={isDark}
      text={ui.text}
      textSecondary={ui.textSecondary}
    >
      {financialLeakageSummary || hasData(financialLeakageReasons) ? (
        <div className="flex flex-col space-y-6">
          {/* Summary Cards - Responsive Grid */}
          {financialLeakageSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Total Refund Amount</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatCurrency(financialLeakageSummary.total_refund_amount)}
                </p>
              </div>

              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Total Voided Amount</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatCurrency(financialLeakageSummary.total_voided_amount)}
                </p>
              </div>

              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Total Leakage Amount</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatCurrency(financialLeakageSummary.total_leakage_amount)}
                </p>
              </div>

              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Refund Transaction Count</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatNumber(financialLeakageSummary.refund_transaction_count)}
                </p>
              </div>

              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Void Transaction Count</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatNumber(financialLeakageSummary.void_transaction_count)}
                </p>
              </div>

              <div
                className={cx(
                  'rounded-xl border p-4',
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <p className={cx('text-sm', ui.textSecondary)}>Average Refund Size</p>
                <p className={cx('text-lg font-bold mt-1', ui.text)}>
                  {formatCurrency(financialLeakageSummary.average_refund_size)}
                </p>
                <p className={cx('text-xs mt-1', ui.textMuted)}>
                  Leakage rate {formatPercent(financialLeakageSummary.leakage_rate_percentage)}
                </p>
              </div>
            </div>
          )}

          {/* Reasons Breakdown - Responsive Layout */}
          {hasData(financialLeakageReasons) && (
            <div className="flex flex-col space-y-6">
              {/* Chart Section */}
              <div className="w-full">
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={financialLeakageReasons}
                        cx="50%"
                        cy="50%"
                        innerRadius="30%"
                        outerRadius="60%"
                        dataKey="amount"
                        nameKey="reason"
                        paddingAngle={2}
                        label={false}
                      >
                        {financialLeakageReasons.map((item, index) => (
                          <Cell
                            key={`leakage-reason-${item.reason}-${index}`}
                            fill={LEAKAGE_REASON_COLORS[index % LEAKAGE_REASON_COLORS.length]}
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
                        wrapperStyle={{ 
                          color: isDark ? '#E2E8F0' : '#334155',
                          fontSize: '12px',
                          width: '100%',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '8px',
                          marginTop: '20px'
                        }}
                        formatter={(value) => formatText(value)}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={10}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reasons List - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {financialLeakageReasons.map((item, index) => {
                  const totalAmount = financialLeakageReasons.reduce((sum, i) => sum + i.amount, 0);
                  const percentage = (item.amount / totalAmount) * 100;
                  
                  return (
                    <div
                      key={item.reason}
                      className={cx(
                        'rounded-xl border p-4 transition-all hover:shadow-md',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: LEAKAGE_REASON_COLORS[index % LEAKAGE_REASON_COLORS.length],
                            }}
                          />
                          <div className="min-w-0">
                            <p className={cx('text-sm font-medium truncate', ui.text)}>
                              {formatText(item.reason)}
                            </p>
                            <p className={cx('text-xs mt-0.5', ui.textMuted)}>
                              {formatNumber(item.count)} transactions
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <p className={cx('text-sm font-semibold', ui.text)}>
                            {formatCurrency(item.amount)}
                          </p>
                          <p className={cx('text-xs', ui.textMuted)}>
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress bar for visual representation */}
                      <div className="mt-3">
                        <div
                          className={cx(
                            'w-full h-1.5 rounded-full overflow-hidden',
                            isDark ? 'bg-gray-800' : 'bg-gray-100'
                          )}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: LEAKAGE_REASON_COLORS[index % LEAKAGE_REASON_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        renderEmptyState(
          'No financial leakage data',
          'Financial leakage summary and reason breakdown will appear here when available.'
        )
      )}
    </BillingRevenueDashboardSectionCard>

        <BillingRevenueDashboardSectionCard
          title="Inventory Leakage"
          subtitle="Inventory leakage amounts and item-level leakage records"
          icon={<PackageX className={isDark ? 'text-orange-300' : 'text-orange-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(inventoryLeakage) ? (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryLeakage}
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
                      dataKey="item_name"
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
                    <Bar dataKey="leakage_amount" radius={[0, 4, 4, 0]}>
                      {inventoryLeakage.map((item, index) => (
                        <Cell
                          key={`inventory-${item.item_code}-${index}`}
                          fill={INVENTORY_COLORS[index % INVENTORY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {inventoryLeakage.map((item) => (
                  <div
                    key={`${item.item_code}-${item.inventory_item_id ?? 'null'}`}
                    className={cx(
                      'rounded-xl border p-4',
                      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cx('text-sm font-medium', ui.text)}>
                          {item.item_name}
                        </p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                          Code {item.item_code}
                          {item.inventory_item_id !== null
                            ? ` • Inventory Item ID ${formatNumber(item.inventory_item_id)}`
                            : ''}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Billed Qty</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatNumber(item.billed_quantity)}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Billed Amount</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatCurrency(item.billed_amount)}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Refunded Qty</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatNumber(item.refunded_quantity)}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Restored Qty</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatNumber(item.restored_quantity)}
                          </p>
                        </div>
                        <div>
                          <p className={cx('text-xs', ui.textMuted)}>Adjustments</p>
                          <p className={cx('font-semibold', ui.text)}>
                            {formatNumber(item.adjustment_count)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className={cx('text-sm font-semibold', ui.text)}>
                        Leakage Amount {formatCurrency(item.leakage_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderEmptyState(
              'No inventory leakage data',
              'Inventory leakage items will be shown here when available.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BillingRevenueDashboardSectionCard
          title="Financial Leakage Trend"
          subtitle="Refund, void, total leakage, and count over time"
          icon={<AlertTriangle className={isDark ? 'text-rose-300' : 'text-rose-700'} />}
          cardClassName={cardClassName}
          isDark={isDark}
          text={ui.text}
          textSecondary={ui.textSecondary}
        >
          {hasData(financialLeakageTrend) ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={financialLeakageTrend}
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
                    dataKey="refund_amount"
                    fill="#F59E0B"
                    name="Refund Amount"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="void_amount"
                    fill="#EF4444"
                    name="Void Amount"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_leakage_amount"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    name="Total Leakage Amount"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    name="Count"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            renderEmptyState(
              'No financial leakage trend data',
              'Leakage trend points will appear here when available.'
            )
          )}
        </BillingRevenueDashboardSectionCard>
        <BillingRevenueDashboardSectionCard
            title="Financial Leakage Top Cases"
            subtitle="Top adjustment cases exactly as available"
            icon={<Database className={isDark ? 'text-amber-300' : 'text-amber-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            >
            {hasData(financialLeakageTopCases) ? (
                <div className="space-y-3">
                {financialLeakageTopCases.map((item) => (
                    <div
                    key={item.adjustment_id}
                    className={cx(
                        'rounded-xl border p-4',
                        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                    >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                        <div className="min-w-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                            {item.reference_number}
                        </p>
                        <p className={cx('text-xs mt-1', ui.textMuted)}>
                            {formatText(item.adjustment_type)} • {formatText(item.adjustment_reason)}
                        </p>
                        </div>

                        <div className="text-right shrink-0">
                        <p className={cx('text-sm font-semibold', ui.text)}>
                            {formatCurrency(item.amount)}
                        </p>
                        <p className={cx('text-xs', ui.textMuted)}>
                            {item.completed_at ?? 'No completion date'}
                        </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                        <p className={cx('text-xs', ui.textMuted)}>Patient Number</p>
                        <p className={cx('font-semibold', ui.text)}>
                            {item.patient_id === null ? '—' : formatNumber(item.patient_id)}
                        </p>
                        </div>
                        <div>
                        </div>
                        <div>
                        </div>
                        <div>
                        <p className={cx('text-xs', ui.textMuted)}>Billing Cycle Number</p>
                        <p className={cx('font-semibold break-all', ui.text)}>
                            {item.billing_cycle_uuid ?? '—'}
                        </p>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                renderEmptyState(
                'No top leakage cases',
                'Top financial leakage cases will appear here when available.'
                )
            )}
        </BillingRevenueDashboardSectionCard>
      </div>
    </div>
  );
};

export default BillingRevenueDashboardLeakagesTab;
