import React, { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { LaboratoryRevenueTrendBlock } from '../../api/overview/laboratoryDashboardTypes';

interface LaboratoryRevenueTrendChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  trend: LaboratoryRevenueTrendBlock | undefined;
  isLoading: boolean;
}

export const LaboratoryRevenueTrendChart: React.FC<LaboratoryRevenueTrendChartProps> = ({
  theme,
  refreshKey,
  trend,
  isLoading,
}) => {
  const isDark = theme === 'dark';
  const data = useMemo(
    () => (trend?.series ?? []).map((row) => ({ date: row.label, revenue: row.revenue })),
    [trend]
  );

  if (isLoading && !trend) {
    return (
      <div className={`rounded-xl border p-6 animate-pulse ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`mb-4 h-6 w-52 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-[280px] rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
      </div>
    );
  }

  const formatTooltipValue = (value: unknown): [string, string] => {
    const raw = Array.isArray(value) ? value[0] : value;
    const numeric = typeof raw === 'number' ? raw : Number(raw ?? 0);
    return [new Intl.NumberFormat().format(Number.isFinite(numeric) ? numeric : 0), 'Revenue'];
  };

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Laboratory revenue trend
          </h2>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
          Last {trend?.days ?? 14} days
        </span>
      </div>
      <div className="h-[280px]" key={refreshKey}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="date" 
              stroke={isDark ? '#9ca3af' : '#6b7280'} 
              style={{ fontSize: '12px' }}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
            />
            <YAxis 
              stroke={isDark ? '#9ca3af' : '#6b7280'} 
              style={{ fontSize: '12px' }}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
              tickFormatter={(value) => new Intl.NumberFormat().format(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
              labelStyle={{
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
              formatter={formatTooltipValue}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={isDark ? '#34d399' : '#059669'} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 6, fill: isDark ? '#34d399' : '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={`mt-4 grid grid-cols-2 gap-4 border-t pt-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total revenue</p>
          <p className={`mt-1 text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {new Intl.NumberFormat().format(trend?.total_revenue ?? 0)}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avg daily revenue</p>
          <p className={`mt-1 text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {new Intl.NumberFormat().format(trend?.avg_daily_revenue ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
};