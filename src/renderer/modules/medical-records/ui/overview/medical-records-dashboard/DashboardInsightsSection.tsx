import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import type {
  DashboardAlert,
  KpiData,
  RevenueData,
  TopCondition,
  TopPayingService,
  VisitTypeCount,
} from '../../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';
import { EmptyChartState, EnterpriseTooltip } from './dashboard.primitives';
import {
  PIE_COLORS,
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  getAlertIcon,
  getAlertTypeLabel,
  getPanelClass,
  getSeverityStyles,
  getSubtlePanelClass,
  getTrendMeta,
} from './dashboard.utils';

interface DashboardInsightsSectionProps {
  isDark: boolean;
  visitTypes: VisitTypeCount[];
  topConditions: TopCondition[];
  revenue: RevenueData;
  topServices: TopPayingService[];
  alerts: DashboardAlert[];
  kpi: KpiData;
  largestAgeGroup: { group: string; count: number } | null;
}

const DashboardInsightsSection: React.FC<DashboardInsightsSectionProps> = ({
  isDark,
  visitTypes,
  topConditions,
  revenue,
  topServices,
  alerts,
  kpi,
  largestAgeGroup,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  return (
    <>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24 }}
          className={cn(panelClass, 'xl:col-span-7 p-6')}
        >
          <div className="mb-6">
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Visit Composition & Condition Load
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Breakdown of visit categories and the most treated conditions driving clinical demand.
            </p>
          </div>

          {/* Stacked vertical layout for Visit Types and Most Treated Conditions */}
          <div className="space-y-6">
            {/* Visit Types - Stacked First */}
            <div className={cn(subtlePanelClass, 'p-4')}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  Visit Types
                </h3>
              </div>

              <div className="h-[300px]">
                {visitTypes.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visitTypes} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                      />
                      <XAxis
                        dataKey="type"
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={
                          <EnterpriseTooltip
                            isDark={isDark}
                            valueFormatter={(value) => formatNumber(value)}
                          />
                        }
                      />
                      <Bar dataKey="count" name="Visits" radius={[10, 10, 0, 0]}>
                        {visitTypes.map((item, index) => (
                          <Cell key={item.type} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartState
                    title="No visit type data"
                    subtitle="Visit composition will render when the API returns visit type counts."
                    isDark={isDark}
                  />
                )}
              </div>
            </div>

            {/* Most Treated Conditions - Stacked Second */}
            <div className={cn(subtlePanelClass, 'p-4')}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  Most Treated Conditions
                </h3>
              </div>

              {topConditions.length ? (
                <div className="space-y-4">
                  {topConditions.map((condition, index) => {
                    const max = topConditions[0]?.count || 1;
                    const width = (condition.count / max) * 100;

                    return (
                      <div key={condition.condition} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {index + 1}
                            </div>
                            <span
                              className={cn(
                                'truncate text-sm font-medium',
                                isDark ? 'text-slate-200' : 'text-slate-800'
                              )}
                            >
                              {condition.condition}
                            </span>
                          </div>

                          <span
                            className={cn(
                              'shrink-0 text-sm font-semibold',
                              isDark ? 'text-white' : 'text-slate-950'
                            )}
                          >
                            {formatNumber(condition.count)}
                          </span>
                        </div>

                        <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyChartState
                  title="No condition data"
                  subtitle="Treated condition rankings are unavailable for this period."
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          className={cn(panelClass, 'xl:col-span-5 p-6')}
        >
          <div className="mb-6">
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Revenue Performance
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Commercial efficiency signals from visit monetization and top-performing services.
            </p>
          </div>

          {/* Stacked vertical layout for Revenue Metrics */}
          <div className="space-y-3">
            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Revenue / Patient
              </p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatCurrency(revenue.revenue_per_patient)}
              </p>
            </div>

            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Avg Revenue / Visit
              </p>
              <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatCurrency(revenue.average_revenue_per_visit)}
              </p>
            </div>
          </div>

          <div className={cn(subtlePanelClass, 'mt-4 p-4')}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Top Paying Services
              </h3>

              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                {topServices.length} tracked
              </span>
            </div>

            <div className="h-[300px]">
              {topServices.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topServices}
                    layout="vertical"
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="service"
                      width={120}
                      tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <EnterpriseTooltip
                          isDark={isDark}
                          valueFormatter={(value) => formatCurrency(value)}
                        />
                      }
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState
                  title="No revenue service data"
                  subtitle="Top paying services will appear once available."
                  isDark={isDark}
                />
              )}
            </div>

            {topServices.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {topServices.slice(0, 4).map((service) => (
                  <div
                    key={service.service}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium',
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-slate-300'
                        : 'border-slate-200 bg-white text-slate-700'
                    )}
                  >
                    {service.service} • {formatCompactCurrency(service.revenue)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.32 }}
          className={cn(panelClass, 'xl:col-span-8 p-6')}
        >
          <div className="mb-6">
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Alerts & Operational Signals
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Risk markers surfaced by the analytics service for immediate visibility and intervention.
            </p>
          </div>

          {alerts.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {alerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);

                return (
                  <motion.div
                    key={`${alert.type}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'rounded-3xl border p-5',
                      getSeverityStyles(alert.severity, isDark)
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                          isDark ? 'bg-white/10' : 'bg-white/70'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold">{getAlertTypeLabel(alert.type)}</p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                              isDark ? 'bg-white/10 text-white/80' : 'bg-white/80 text-slate-700'
                            )}
                          >
                            {alert.severity}
                          </span>
                        </div>

                        <p className="mt-2 text-sm leading-6 opacity-90">{alert.message}</p>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-xs font-semibold dark:bg-white/10">
                          <span>Signal Value</span>
                          <span>{formatNumber(alert.value)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div
              className={cn(
                'rounded-3xl border border-dashed p-10 text-center',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
              )}
            >
              <div
                className={cn(
                  'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
                  isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                No critical alerts detected
              </h3>
              <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                There is currently no active operational alerts for the selected period.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.36 }}
          className={cn(panelClass, 'xl:col-span-4 p-6')}
        >
          <div className="mb-6">
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Executive Summary
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              High-signal summary of the current reporting window.
            </p>
          </div>

          <div className="space-y-4">
            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Patient Growth</p>
              <div className="mt-2 flex items-center gap-2">
                {(() => {
                  const trendMeta = getTrendMeta(kpi.total_patients.trend);
                  const TrendIcon = trendMeta.icon;

                  return (
                    <>
                      <TrendIcon className={cn('h-5 w-5', trendMeta.textClass)} />
                      <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                        {kpi.total_patients.change_percentage > 0 ? '+' : ''}
                        {kpi.total_patients.change_percentage.toFixed(1)}%
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Dominant Age Segment</p>
              <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {largestAgeGroup?.group || '—'}
              </p>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {largestAgeGroup ? `${formatNumber(largestAgeGroup.count)} patients` : 'No data'}
              </p>
            </div>

            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Top Revenue Service</p>
              <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {topServices[0]?.service || '—'}
              </p>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {topServices[0] ? formatCurrency(topServices[0].revenue) : 'No data'}
              </p>
            </div>

            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Top Condition</p>
              <p className={cn('mt-2 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {topConditions[0]?.condition || '—'}
              </p>
              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {topConditions[0] ? `${formatNumber(topConditions[0].count)} cases` : 'No data'}
              </p>
            </div>

            <div className={cn(subtlePanelClass, 'p-4')}>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>New vs Returning Mix</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div
                    className={cn(
                      'mb-2 flex items-center justify-between text-xs',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    <span>New</span>
                    <span>{formatNumber(kpi.new_vs_returning.new)}</span>
                  </div>
                  <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{
                        width: `${Math.max(0, Math.min(100, kpi.new_vs_returning.new_rate))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div
                    className={cn(
                      'mb-2 flex items-center justify-between text-xs',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    <span>Returning</span>
                    <span>{formatNumber(kpi.new_vs_returning.returning)}</span>
                  </div>
                  <div className={cn('h-2 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{
                        width: `${Math.max(0, Math.min(100, 100 - kpi.new_vs_returning.new_rate))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default DashboardInsightsSection;