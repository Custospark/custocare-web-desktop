import React from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BadgeDollarSign, Layers3 } from 'lucide-react';

import type {
  CategoryBreakdownItem,
  ServicePricingSummary,
  TopServiceByPrice,
} from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import {
  EmptyChartState,
  EnterpriseTooltip,
  ProgressRow,
} from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  PIE_COLORS,
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  getRiskPillStyles,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';
import { formatText } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface FacilityAdminServicesSectionProps {
  isDark: boolean;
  summary: ServicePricingSummary;
  topServicesByPrice: TopServiceByPrice[];
  categoryBreakdown: CategoryBreakdownItem[];
}

const FacilityAdminServicesSection: React.FC<FacilityAdminServicesSectionProps> = ({
  isDark,
  summary,
  topServicesByPrice,
  categoryBreakdown,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const services = [...topServicesByPrice].slice(0, 6);
  const categories = [...categoryBreakdown]
    .sort((a, b) => b.share_percentage - a.share_percentage)
    .slice(0, 6);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
          Service Pricing & Revenue Potential
        </h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          Pricing visibility across top services and the categories driving revenue potential.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Active Services
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(summary.total_active_services)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Revenue Potential
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatCompactCurrency(summary.total_revenue_potential)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
            Avg Service Price
          </p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatCurrency(summary.average_service_price)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex flex-col items-start gap-3">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Highest Priced Services
            </h3>

            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
              )}
            >
              <BadgeDollarSign className="h-3.5 w-3.5" />
              Top value
            </div>
          </div>

          <div className="h-[320px]">
            {services.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={services}
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
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="service_name"
                    width={130}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatText(value)}
                  />
                  <Tooltip
                    content={
                      <EnterpriseTooltip
                        isDark={isDark}
                        labelFormatter={(label) => formatText(label)}
                        valueFormatter={(value) => formatCurrency(value)}
                      />
                    }
                  />
                  <Bar dataKey="price" name="Price" radius={[0, 10, 10, 0]}>
                    {services.map((item, index) => (
                      <Cell key={formatText(item.service_name)} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                title="No service pricing data"
                subtitle="Top priced services will appear here when available."
                isDark={isDark}
              />
            )}
          </div>

          {services.length > 0 && (
            <div className="mt-4 space-y-3">
              {services.slice(0, 3).map((service) => (
                <div
                  key={formatText(service.service_name)}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatText(service.service_name)}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {formatText(service.category)}
                        {service.duration_minutes ? ` • ${service.duration_minutes} min` : ''}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'w-fit rounded-full px-3 py-1 text-xs font-semibold',
                        getRiskPillStyles(service.risk_level, isDark)
                      )}
                    >
                      {service.risk_level}
                    </span>
                  </div>

                  <p className={cn('mt-3 text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                    {formatCurrency(service.price)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex flex-col items-start gap-3">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Category Mix
            </h3>

            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'
              )}
            >
              <Layers3 className="h-3.5 w-3.5" />
              Breakdown
            </div>
          </div>

          {categories.length ? (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatText(category.category)}
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {formatNumber(category.count)} services •{' '}
                        {formatCompactCurrency(category.total_price_sum)}
                      </p>
                    </div>

                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {category.share_percentage.toFixed(1)}%
                    </span>
                  </div>

                  <ProgressRow
                    label={`Avg ${formatCurrency(category.avg_price)}`}
                    value={category.share_percentage}
                    isDark={isDark}
                    tone={
                      index % 5 === 0
                        ? 'blue'
                        : index % 5 === 1
                        ? 'green'
                        : index % 5 === 2
                        ? 'amber'
                        : index % 5 === 3
                        ? 'violet'
                        : 'rose'
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No category pricing mix"
              subtitle="Category pricing contribution will render here when present."
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default FacilityAdminServicesSection;