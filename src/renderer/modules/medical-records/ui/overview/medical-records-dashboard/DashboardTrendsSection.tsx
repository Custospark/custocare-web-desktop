//DashboardTrendsSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { EmptyChartState, EnterpriseTooltip } from './dashboard.primitives';
import { cn, formatNumber, getPanelClass, getSubtlePanelClass } from './dashboard.utils';

interface TrendSeriesPoint {
  label: string;
  patients: number;
  newPatients: number;
  rawDate: string;
}

interface WeeklySeriesPoint {
  week: string;
  patients: number;
}

interface DashboardTrendsSectionProps {
  isDark: boolean;
  trendSeries: TrendSeriesPoint[];
  weeklySeries: WeeklySeriesPoint[];
  averageDailyPatients: number;
  peakDay: { day: string; count: number } | null;
  totalNewPatients: number;
}

const DashboardTrendsSection: React.FC<DashboardTrendsSectionProps> = ({
  isDark,
  trendSeries,
  weeklySeries,
  averageDailyPatients,
  peakDay,
  totalNewPatients,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className={cn(panelClass, 'xl:col-span-8 p-6')}
      >
        {/* Header Section - Title and Description */}
        <div className="mb-4">
          <div className="flex-1 min-w-0">
            <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
              Patient Volume Trajectory
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Daily patients and new patient acquisition over the selected reporting window.
            </p>
          </div>
        </div>

        {/* Stats Cards - Now Below the Title */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className={cn(subtlePanelClass, 'px-3 sm:px-4 py-2 sm:py-3 min-w-0')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Avg / Day</p>
            <p className={cn('mt-1 text-base sm:text-lg font-bold truncate', isDark ? 'text-white' : 'text-slate-950')}>
              {formatNumber(Math.round(averageDailyPatients))}
            </p>
          </div>
          
          <div className={cn(subtlePanelClass, 'px-3 sm:px-4 py-2 sm:py-3 min-w-0')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>Peak Day</p>
            <p className={cn('mt-1 text-base sm:text-lg font-bold truncate', isDark ? 'text-white' : 'text-slate-950')}>
              {peakDay ? peakDay.day : '—'}
            </p>
          </div>
          
          <div className={cn(subtlePanelClass, 'px-3 sm:px-4 py-2 sm:py-3 min-w-0')}>
            <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>New Patients</p>
            <p className={cn('mt-1 text-base sm:text-lg font-bold truncate', isDark ? 'text-white' : 'text-slate-950')}>
              {formatNumber(totalNewPatients)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[340px]">
          {trendSeries.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="patientsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="newPatientsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="label"
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
                      labelFormatter={(value) => value}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="patients"
                  name="Patients"
                  stroke="#2563EB"
                  fill="url(#patientsGradient)"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="newPatients"
                  name="New Patients"
                  stroke="#10B981"
                  fill="url(#newPatientsGradient)"
                  strokeWidth={2.5}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="No daily trend data"
              subtitle="Patient volume will appear here when the API returns daily trend records."
              isDark={isDark}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className={cn(panelClass, 'xl:col-span-4 p-6')}
      >
        <div className="mb-5">
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            Weekly Throughput
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Periodized patient totals by week.
          </p>
        </div>

        <div className="h-[340px]">
          {weeklySeries.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                />
                <XAxis
                  dataKey="week"
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
                <Bar dataKey="patients" name="Patients" fill="#8B5CF6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              title="No weekly trend data"
              subtitle="Weekly patient totals will render here when present in the response."
              isDark={isDark}
            />
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default DashboardTrendsSection;