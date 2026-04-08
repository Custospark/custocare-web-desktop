import React, {useMemo, useState, useEffect } from 'react';import {
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
import { Activity, Database, CreditCard, FileText, ReceiptText, TrendingUp, Wallet } from 'lucide-react';

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
  formatText,
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
    const revenueBreakdownByService = useMemo(
    () => dashboard?.revenue_breakdown?.by_service ?? [],
    [dashboard?.revenue_breakdown?.by_service]
    );
  const paymentMethods = dashboard?.payment_mix?.methods ?? [];
  const paymentMixSummary = dashboard?.payment_mix?.summary;

    // Add these state variables with your other useState declarations
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Add these memoized values for pagination
    const totalServices = revenueBreakdownByService?.length || 0;
    const totalPages = Math.ceil(totalServices / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedServices = revenueBreakdownByService?.slice(startIndex, endIndex) || [];

    // Generate page numbers to display (shows max 5 pages)
    const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
        }
    } else {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
        pages.push(i);
        }
    }
    
    return pages;
    }, [currentPage, totalPages]);

    // Reset to first page when data changes
    useEffect(() => {
    setCurrentPage(1);
    }, [revenueBreakdownByService]);

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
        subtext: 'Growth Rate',
        icon: TrendingUp,
        iconClassName: 'text-green-500',
        accentClassName: 'border-l-4 border-green-500',
      },
      {
        label: 'Total Leakage Amount',
        value: formatCurrency(snapshot.total_leakage_amount),
        icon: Database,
        iconClassName: 'text-rose-500',
        accentClassName: 'border-l-4 border-rose-500',
      },
      {
        label: 'Leakage Percentage',
        value: formatPercent(snapshot.leakage_percentage),
        subtext: 'As from current snapshot',
        icon: Database,
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
        title="Snapshot"
        subtitle="Facility Financial Health"
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
              'Revenue trend points will appear here when available.'
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
                        tickFormatter={(value) => formatText(value)}
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
                    'rounded-xl border p-3 sm:p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={cx('text-sm sm:text-base font-medium break-words', ui.text)}>
                        {formatText(item.category)}
                      </p>
                      <p className={cx('text-xs mt-1 break-words', ui.textMuted)}>
                        Quantity sold {formatNumber(item.quantity_sold)}
                      </p>
                    </div>

                    <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end gap-2 sm:gap-1">
                      <div className="text-left sm:text-right">
                        <p className={cx('text-sm sm:text-base font-semibold whitespace-nowrap sm:whitespace-normal', ui.text)}>
                          {formatCurrency(item.revenue)}
                        </p>
                        <p className={cx('text-xs text-left sm:text-right', ui.textMuted)}>
                          {formatPercent(item.share_percentage)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                </div>
            ) : (
                renderEmptyState(
                'No category breakdown data',
                'Revenue breakdown by category will appear here when available.'
                )
            )}
            </BillingRevenueDashboardSectionCard>
      </div>

      <BillingRevenueDashboardSectionCard
        title="Revenue Breakdown by Service & inventory items"
        subtitle="Service-level revenue, quantity, refund count, refund amount, and share percentage"
        icon={<ReceiptText className={isDark ? 'text-cyan-300' : 'text-cyan-700'} />}
        cardClassName={cardClassName}
        isDark={isDark}
        text={ui.text}
        textSecondary={ui.textSecondary}
        >
        {hasData(revenueBreakdownByService) ? (
            <>
            <div className="space-y-3">
                {paginatedServices.map((item) => (
                <div
                    key={item.service_code}
                    className={cx(
                    'rounded-xl border p-4',
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                    )}
                >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                    <div className="min-w-0">
                        <p className={cx('text-sm font-semibold ', ui.text)}>
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

            {/* Pagination Controls */}
            <div className={cx(
                'flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t',
                ui.border
            )}>
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                <span className={cx('text-sm', ui.textSecondary)}>Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    }}
                    className={cx(
                    'px-3 py-1.5 rounded-lg border text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isDark
                        ? 'bg-gray-900 border-gray-700 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    )}
                >
                    {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                        {size}
                    </option>
                    ))}
                </select>
                <span className={cx('text-sm', ui.textSecondary)}>per page</span>
                </div>

                {/* Pagination info and controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className={cx('text-sm', ui.textSecondary)}>
                    Showing {startIndex + 1} - {Math.min(endIndex, totalServices)} of {totalServices} items
                </span>
                
                <div className="flex items-center gap-2">
                    <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={cx(
                        'px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-not-allowed',
                        isDark
                        ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white'
                    )}
                    >
                    Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                    {pageNumbers.map((pageNum) => (
                        <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cx(
                            'px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer min-w-[2.5rem]',
                            currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isDark
                                ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        )}
                        >
                        {pageNum}
                        </button>
                    ))}
                    </div>
                    
                    <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={cx(
                        'px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer disabled:cursor-not-allowed',
                        isDark
                        ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-gray-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white'
                    )}
                    >
                    Next
                    </button>
                </div>
                </div>
            </div>
            </>
        ) : (
            renderEmptyState(
            'No service breakdown data',
            'Service-level revenue breakdown will appear here when available.'
            )
        )}
        </BillingRevenueDashboardSectionCard>

       <BillingRevenueDashboardSectionCard
            title="Payment Mix"
            subtitle="Payment methods and payment summary."
            icon={<CreditCard className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />}
            cardClassName={cardClassName}
            isDark={isDark}
            text={ui.text}
            textSecondary={ui.textSecondary}
            >
            {hasData(paymentMethods) || paymentMixSummary ? (
                <div className="space-y-6">
                {/* Payment Methods Section */}
                {hasData(paymentMethods) && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Pie Chart */}
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
                            <Legend 
                            wrapperStyle={{ color: isDark ? '#E2E8F0' : '#334155' }}
                            formatter={(value) => formatText(value)}
                            />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Payment Methods List */}
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
                                <p className={cx('text-sm font-medium ', ui.text)}>
                                {formatText(item.payment_method)}
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
                )}

                {/* Payment Summary Section */}
                {paymentMixSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient Contribution */}
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

                    {/* Insurance Contribution */}
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
                )}
                </div>
            ) : (
                renderEmptyState(
                'No payment mix data',
                'Payment methods and payment summary will appear here when available.'
                )
            )}
    </BillingRevenueDashboardSectionCard>
    </div>
  );
};

export default BillingRevenueDashboardOverviewTab;
