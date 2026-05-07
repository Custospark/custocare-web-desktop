import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HeartPulse } from 'lucide-react';
import type { CareVolumeTrendsBlock } from '../../api/intelligence/nursingDashboardTypes';

interface NursingCareVolumeTrendsChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  trends: CareVolumeTrendsBlock | undefined;
  isLoading: boolean;
}

export const NursingCareVolumeTrendsChart: React.FC<NursingCareVolumeTrendsChartProps> = ({
  theme,
  refreshKey,
  trends,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    if (!trends?.series?.length) return [];
    return trends.series.map((row) => ({
      date: row.label,
      administered_units: row.administered_units,
      scheduled_doses: row.scheduled_doses,
      exceptions: row.exceptions,
    }));
  }, [trends]);

  const chartColors = {
    administered: isDark ? '#34d399' : '#10b981',
    scheduled: isDark ? '#60a5fa' : '#3b82f6',
    exceptions: isDark ? '#f87171' : '#ef4444',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  const footer = trends?.footer;

  if (isLoading && !trends) {
    return (
      <div
        className={`rounded-xl p-6 border animate-pulse ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`h-6 w-48 rounded mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-[300px] rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HeartPulse className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          <h2 className="text-lg font-semibold">Care volume trends</h2>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Last {trends?.days ?? 30} days
        </span>
      </div>

      <div className="h-[300px]" key={refreshKey}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="date" stroke={chartColors.text} style={{ fontSize: '12px' }} />
            <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
            <Line
              type="monotone"
              dataKey="administered_units"
              stroke={chartColors.administered}
              strokeWidth={2}
              name="Administered units"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="scheduled_doses"
              stroke={chartColors.scheduled}
              strokeWidth={2}
              name="Scheduled doses"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="exceptions"
              stroke={chartColors.exceptions}
              strokeWidth={2}
              name="Missed / skipped (sched. date)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Upcoming pending doses</p>
          <p className="text-lg font-semibold mt-1">{footer?.pending_upcoming_doses ?? '—'}</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Overdue pending doses</p>
          <p className="text-lg font-semibold mt-1">{footer?.overdue_pending_doses ?? '—'}</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Volume trend (2 halves)</p>
          <p
            className={`text-lg font-semibold mt-1 ${
              (footer?.activity_growth_pct ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {footer?.activity_growth_pct != null
              ? `${footer.activity_growth_pct >= 0 ? '+' : ''}${footer.activity_growth_pct.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>
      {footer?.note && (
        <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{footer.note}</p>
      )}
    </div>
  );
};
