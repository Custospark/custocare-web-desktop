import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import {
  BadgeDollarSign,
  ChevronRight,
  Eye,
  Layers3,
  PlusCircle,
  Settings,
  TrendingUp,
} from 'lucide-react';

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
  getPanelClass,
  getRiskPillStyles,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';
import { formatText } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';
import { ADMIN_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

interface FacilityAdminServicesSectionProps {
  isDark: boolean;
  summary?: ServicePricingSummary | null;
  topServicesByPrice?: TopServiceByPrice[] | null;
  categoryBreakdown?: CategoryBreakdownItem[] | null;
}

const EMPTY_SUMMARY: ServicePricingSummary = {
  total_active_services: 0,
  total_revenue_potential: 0,
  average_service_price: 0,
  highest_price_service: 0,
};

function FacilityAdminServicesSection({
  isDark,
  summary,
  topServicesByPrice,
  categoryBreakdown,
}: FacilityAdminServicesSectionProps) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const safeSummary = summary ?? EMPTY_SUMMARY;
  const safeTopServicesByPrice = Array.isArray(topServicesByPrice) ? topServicesByPrice : [];
  const safeCategoryBreakdown = Array.isArray(categoryBreakdown) ? categoryBreakdown : [];

  const services = useMemo(
    () => [...safeTopServicesByPrice].slice(0, 6),
    [safeTopServicesByPrice]
  );

  const categories = useMemo(
    () =>
      [...safeCategoryBreakdown]
        .sort(
          (a, b) => Number(b.share_percentage ?? 0) - Number(a.share_percentage ?? 0)
        )
        .slice(0, 6),
    [safeCategoryBreakdown]
  );

  const handleNavigate = (url: string, sectionName: string) => {
    setIsNavigating(sectionName);
    navigate(url);
  };

  if (isNavigating) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        theme={isDark ? 'dark' : 'light'}
        message={`Loading ${isNavigating}...`}
      />
    );
  }

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
        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <p className="text-xs text-slate-500">Active Services</p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatNumber(safeSummary.total_active_services)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <p className="text-xs text-slate-500">Revenue Potential</p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatCompactCurrency(safeSummary.total_revenue_potential)}
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <p className="text-xs text-slate-500">Avg Service Price</p>
          <p className={cn('mt-2 text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {formatCurrency(safeSummary.average_service_price)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col items-start gap-3">
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
          </div>

          <div className="h-[320px] w-full">
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
                    tickFormatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <YAxis
                    type="category"
                    dataKey="service_name"
                    width={130}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatText(String(value ?? '—'))}
                  />
                  <Tooltip
                    content={
                      <EnterpriseTooltip
                        isDark={isDark}
                        labelFormatter={(label) => formatText(String(label ?? '—'))}
                        valueFormatter={(value) => formatCurrency(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar dataKey="price" name="Price" radius={[0, 10, 10, 0]}>
                    {services.map((item, index) => (
                      <Cell
                        key={`${item.service_name}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyChartState
                  title="No service pricing data"
                  subtitle="Top priced services will appear here when available."
                  isDark={isDark}
                />
              </div>
            )}
          </div>

          {services.length > 0 && (
            <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-2">
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

          <div
            className={cn(
              'mt-4 grid grid-cols-2 gap-3 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.SERVICE_CATALOG, 'Service Catalog')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              <Eye className="h-4 w-4" />
              <span>Browse Catalog</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.SERVICE_CATALOG, 'Add New Service')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Service</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col items-start gap-3">
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
          </div>

          {categories.length ? (
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
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
                      {Number(category.share_percentage ?? 0).toFixed(1)}%
                    </span>
                  </div>

                  <ProgressRow
                    label={`Avg ${formatCurrency(category.avg_price)}`}
                    value={Number(category.share_percentage ?? 0)}
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

          <div
            className={cn(
              'mt-4 grid grid-cols-2 gap-3 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() =>
                handleNavigate(ADMIN_ROUTES.BILLING_CYCLE_REVENUE_STATS, 'Revenue Analysis')
              }
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-violet-500/30 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                  : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
              )}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Revenue Insights</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.SERVICE_CATALOG, 'Pricing Configuration')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-amber-500/30 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Configure Pricing</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default FacilityAdminServicesSection;
