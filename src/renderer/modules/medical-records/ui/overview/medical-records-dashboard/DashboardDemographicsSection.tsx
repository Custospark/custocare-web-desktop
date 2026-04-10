//DashboardDemographicsSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { EmptyChartState, EnterpriseTooltip } from './dashboard.primitives';
import { cn, getPanelClass, getSubtlePanelClass, formatNumber, AGE_COLORS } from './dashboard.utils';
import { formatText } from '../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface AgeGroupChartItem {
  group: string;
  count: number;
  fill: string;
}

interface GenderChartItem {
  gender: string;
  count: number;
  fill: string;
}

interface PayerMixItem {
  name: string;
  value: number;
  fill: string;
}

interface DashboardDemographicsSectionProps {
  isDark: boolean;
  ageGroups: AgeGroupChartItem[];
  genderDistribution: GenderChartItem[];
  insuranceVsCash: PayerMixItem[];
  largestAgeGroup: { group: string; count: number } | null;
}

const DashboardDemographicsSection: React.FC<DashboardDemographicsSectionProps> = ({
  isDark,
  ageGroups,
  genderDistribution,
  insuranceVsCash,
  largestAgeGroup,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            Demographics Snapshot
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Age, gender, and payer mix across the selected cohort.
          </p>
        </div>

        <div className={cn(subtlePanelClass, 'px-4 py-3')}>
          <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Largest Age Group</p>
          <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            {largestAgeGroup ? `${largestAgeGroup.group} (${formatNumber(largestAgeGroup.count)})` : '—'}
          </p>
        </div>
      </div>

      {/* Stacked layout: gender and insurance/cash charts appear one below the other */}
      <div className="space-y-6">
        {/* Gender Distribution */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Gender Distribution
            </h3>
          </div>

          <div className="h-[240px]">
            {genderDistribution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {genderDistribution.map((entry) => (
                      <Cell key={formatText(entry.gender)} fill={formatText(entry.fill)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <EnterpriseTooltip
                        isDark={isDark}
                        valueFormatter={(value) => formatNumber(value)}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                title="No gender data"
                subtitle="Gender distribution is unavailable for this period."
                isDark={isDark}
              />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {genderDistribution.map((item) => (
              <div
                key={item.gender}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-3 py-2',
                  isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    {formatText(item.gender)}
                  </span>
                </div>
                <span className="text-sm font-semibold">{formatNumber(item.count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance vs Cash */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Insurance vs Cash
            </h3>
          </div>

          <div className="h-[240px]">
            {insuranceVsCash.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insuranceVsCash}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {insuranceVsCash.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <EnterpriseTooltip
                        isDark={isDark}
                        valueFormatter={(value) => formatNumber(value)}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                title="No payer mix data"
                subtitle="Insurance vs cash distribution is unavailable."
                isDark={isDark}
              />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {insuranceVsCash.map((item) => (
              <div
                key={item.name}
                className={cn(
                  'flex items-center justify-between rounded-2xl border px-3 py-2',
                  isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold">{formatNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Age Group Bar Chart (remains at bottom) */}
      <div className={cn(subtlePanelClass, 'mt-6 p-4')}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
            Age Group Distribution
          </h3>
        </div>

        <div className="h-[260px]">
          {ageGroups.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroups} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="group"
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
                <Bar dataKey="count" name="Patients" radius={[10, 10, 0, 0]}>
                  {ageGroups.map((item, index) => (
                    <Cell key={item.group} fill={item.fill || AGE_COLORS[index % AGE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="No age distribution data"
              subtitle="Age segmentation will appear here when available."
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardDemographicsSection;