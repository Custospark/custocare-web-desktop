// InventoryTrendsChart.tsx
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
import { TrendingUp } from 'lucide-react';
import type { InventoryTrendsBlock } from '../../api/overview/pharmacyDashboardTypes';
import { formatDashboardFootnote } from './formatDashboardCopy';

interface InventoryTrendsChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  trends: InventoryTrendsBlock | undefined;
  isLoading: boolean;
}

export const InventoryTrendsChart: React.FC<InventoryTrendsChartProps> = ({
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
      dispensed_units: row.dispensed_units,
      restock_units: row.restock_units,
      consumption_units: row.consumption_units,
    }));
  }, [trends]);

  const chartColors = {
    dispensed: isDark ? '#34d399' : '#10b981',
    restock: isDark ? '#60a5fa' : '#3b82f6',
    consumption: isDark ? '#f87171' : '#ef4444',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  const footer = trends?.footer;
  const footnote = formatDashboardFootnote(footer?.note);

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
          <TrendingUp className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          <h2 className="text-lg font-semibold">Inventory movement</h2>
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
              dataKey="dispensed_units"
              stroke={chartColors.dispensed}
              strokeWidth={2}
              name="Dispensed (units)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="restock_units"
              stroke={chartColors.restock}
              strokeWidth={2}
              name="Restock / receiving"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="consumption_units"
              stroke={chartColors.consumption}
              strokeWidth={2}
              name="Ledger consumption"
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
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Total units on hand (est.)</p>
          <p className="text-lg font-semibold mt-1">
            {footer?.avg_stock_units != null
              ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(footer.avg_stock_units)
              : '—'}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Low / out-of-stock SKUs</p>
          <p className="text-lg font-semibold mt-1">
            {footer?.avg_low_stock != null && footer?.avg_out_of_stock != null
              ? `${footer.avg_low_stock} low · ${footer.avg_out_of_stock} out`
              : '—'}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Movement trend (2 halves)</p>
          <p
            className={`text-lg font-semibold mt-1 ${
              (footer?.stock_growth_pct ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {footer?.stock_growth_pct != null
              ? `${footer.stock_growth_pct >= 0 ? '+' : ''}${footer.stock_growth_pct.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>
      {footnote && (
        <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{footnote}</p>
      )}
    </div>
  );
};
