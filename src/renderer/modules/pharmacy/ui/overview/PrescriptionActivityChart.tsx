// PrescriptionActivityChart.tsx
import React from 'react';
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

interface PrescriptionActivityChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface ActivityDataPoint {
  day: string;
  prescriptions: number;
  dispensed: number;
  pending: number;
}

export const PrescriptionActivityChart: React.FC<PrescriptionActivityChartProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';

  // Mock data - weekly prescription activity
  const data: ActivityDataPoint[] = [
    { day: 'Mon', prescriptions: 142, dispensed: 128, pending: 14 },
    { day: 'Tue', prescriptions: 156, dispensed: 145, pending: 11 },
    { day: 'Wed', prescriptions: 138, dispensed: 132, pending: 6 },
    { day: 'Thu', prescriptions: 165, dispensed: 152, pending: 13 },
    { day: 'Fri', prescriptions: 178, dispensed: 168, pending: 10 },
    { day: 'Sat', prescriptions: 95, dispensed: 89, pending: 6 },
    { day: 'Sun', prescriptions: 87, dispensed: 82, pending: 5 },
  ];

  const chartColors = {
    prescriptions: isDark ? '#a78bfa' : '#8b5cf6',
    dispensed: isDark ? '#34d399' : '#10b981',
    pending: isDark ? '#fb923c' : '#f97316',
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
          <Activity className={isDark ? 'text-purple-400' : 'text-purple-600'} />
          <h2 className="text-lg font-semibold">Prescription Activity</h2>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
          }`}
        >
          This week
        </span>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="day"
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
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              dataKey="prescriptions"
              fill={chartColors.prescriptions}
              name="Prescriptions"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="dispensed"
              fill={chartColors.dispensed}
              name="Dispensed"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pending"
              fill={chartColors.pending}
              name="Pending"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Total This Week
          </p>
          <p className="text-lg font-semibold mt-1">961</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Completion Rate
          </p>
          <p className="text-lg font-semibold mt-1 text-green-500">93.3%</p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Avg Per Day
          </p>
          <p className="text-lg font-semibold mt-1">137</p>
        </div>
      </div>
    </div>
  );
};
