// PrescriptionActivityChart.tsx
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from 'lucide-react';
import type { PrescriptionActivityBlock } from '../../api/overview/pharmacyDashboardTypes';

interface PrescriptionActivityChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  activity: PrescriptionActivityBlock | undefined;
  isLoading: boolean;
}

export const PrescriptionActivityChart: React.FC<PrescriptionActivityChartProps> = ({
  theme,
  refreshKey,
  activity,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    if (!activity?.series?.length) return [];
    return activity.series.map((row) => ({
      day: row.day,
      prescriptions: row.prescriptions,
      dispensed: row.dispensed,
      pending: row.pending,
    }));
  }, [activity]);

  const chartColors = {
    prescriptions: isDark ? '#a78bfa' : '#8b5cf6',
    dispensed: isDark ? '#34d399' : '#10b981',
    pending: isDark ? '#fb923c' : '#f97316',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  const totals = activity?.totals;

  if (isLoading && !activity) {
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
          <Activity className={isDark ? 'text-purple-400' : 'text-purple-600'} />
          <h2 className="text-lg font-semibold">Prescription activity</h2>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          This week (Mon–Sun)
        </span>
      </div>

      <div className="h-[300px]" key={refreshKey}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="day" stroke={chartColors.text} style={{ fontSize: '12px' }} />
            <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="prescriptions" fill={chartColors.prescriptions} name="New Rx (created)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="dispensed" fill={chartColors.dispensed} name="Dispensed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill={chartColors.pending} name="Same-day backlog est." radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className={`grid grid-cols-3 gap-4 mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
      >
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>New prescriptions (week)</p>
          <p className="text-lg font-semibold mt-1">{totals?.prescriptions_week ?? '—'}</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Completion rate (est.)</p>
          <p className="text-lg font-semibold mt-1 text-green-500">
            {totals?.completion_rate_pct != null ? `${totals.completion_rate_pct}%` : '—'}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avg / day (Rx + disp)</p>
          <p className="text-lg font-semibold mt-1">{totals?.avg_per_day ?? '—'}</p>
        </div>
      </div>
    </div>
  );
};
