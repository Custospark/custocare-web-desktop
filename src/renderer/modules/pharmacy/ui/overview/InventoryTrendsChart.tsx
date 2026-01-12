// InventoryTrendsChart.tsx
import React from 'react';
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

interface InventoryTrendsChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface InventoryDataPoint {
  date: string;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
}

export const InventoryTrendsChart: React.FC<InventoryTrendsChartProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';

  // Mock data - simulating 30 days of inventory trends
  const data: InventoryDataPoint[] = [
    { date: 'Jan 1', totalStock: 2650, lowStock: 25, outOfStock: 3 },
    { date: 'Jan 3', totalStock: 2720, lowStock: 22, outOfStock: 2 },
    { date: 'Jan 5', totalStock: 2680, lowStock: 28, outOfStock: 4 },
    { date: 'Jan 7', totalStock: 2750, lowStock: 20, outOfStock: 1 },
    { date: 'Jan 9', totalStock: 2800, lowStock: 18, outOfStock: 2 },
    { date: 'Jan 11', totalStock: 2780, lowStock: 24, outOfStock: 3 },
    { date: 'Jan 13', totalStock: 2820, lowStock: 19, outOfStock: 1 },
    { date: 'Jan 15', totalStock: 2790, lowStock: 26, outOfStock: 5 },
    { date: 'Jan 17', totalStock: 2850, lowStock: 17, outOfStock: 2 },
    { date: 'Jan 19', totalStock: 2830, lowStock: 21, outOfStock: 3 },
    { date: 'Jan 21', totalStock: 2870, lowStock: 16, outOfStock: 1 },
    { date: 'Jan 23', totalStock: 2810, lowStock: 23, outOfStock: 4 },
    { date: 'Jan 25', totalStock: 2890, lowStock: 15, outOfStock: 2 },
    { date: 'Jan 27', totalStock: 2840, lowStock: 19, outOfStock: 3 },
    { date: 'Jan 29', totalStock: 2920, lowStock: 14, outOfStock: 1 },
  ];

  const chartColors = {
    totalStock: isDark ? '#60a5fa' : '#3b82f6',
    lowStock: isDark ? '#fbbf24' : '#f59e0b',
    outOfStock: isDark ? '#f87171' : '#ef4444',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          <h2 className="text-lg font-semibold">Inventory Trends</h2>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Last 30 days
        </span>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              stroke={chartColors.text}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                color: isDark ? '#f9fafb' : '#111827',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="totalStock"
              stroke={chartColors.totalStock}
              strokeWidth={2}
              name="Total Stock"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="lowStock"
              stroke={chartColors.lowStock}
              strokeWidth={2}
              name="Low Stock"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="outOfStock"
              stroke={chartColors.outOfStock}
              strokeWidth={2}
              name="Out of Stock"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Avg Stock
          </p>
          <p className="text-lg font-semibold mt-1">2,814</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Avg Low Stock
          </p>
          <p className="text-lg font-semibold mt-1">20</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Stock Growth
          </p>
          <p className="text-lg font-semibold mt-1 text-green-500">+10.2%</p>
        </div>
      </div>
    </div>
  );
};
