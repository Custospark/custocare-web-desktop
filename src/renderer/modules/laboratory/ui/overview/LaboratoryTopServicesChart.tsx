import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FlaskConical } from 'lucide-react';
import type { LaboratoryTopBilledService } from '../../api/overview/laboratoryDashboardTypes';

interface LaboratoryTopServicesChartProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  services: LaboratoryTopBilledService[] | undefined;
  isLoading: boolean;
}

export const LaboratoryTopServicesChart: React.FC<LaboratoryTopServicesChartProps> = ({
  theme,
  refreshKey,
  services,
  isLoading,
}) => {
  const isDark = theme === 'dark';
  const data = useMemo(() => (services ?? []).slice(0, 6).map((s) => ({ name: s.service_name, revenue: s.revenue })), [services]);

  if (isLoading && !services?.length) {
    return (
      <div className={`rounded-xl border p-6 animate-pulse ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`mb-4 h-6 w-44 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-[280px] rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="mb-4 flex items-center gap-2">
        <FlaskConical className={isDark ? 'text-blue-400' : 'text-blue-600'} />
        <h2 className="text-lg font-semibold">Top billed lab services</h2>
      </div>
      <div className="h-[280px]" key={refreshKey}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis type="number" stroke={isDark ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              stroke={isDark ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '11px' }}
              tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 18)}...` : value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
              }}
              formatter={(value: unknown) => {
                const raw = Array.isArray(value) ? value[0] : value;
                const numeric = typeof raw === 'number' ? raw : Number(raw ?? 0);
                return [new Intl.NumberFormat().format(Number.isFinite(numeric) ? numeric : 0), 'Revenue'];
              }}
            />
            <Bar dataKey="revenue" fill={isDark ? '#60a5fa' : '#2563eb'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {(services ?? []).slice(0, 3).map((service) => (
          <div key={service.service_name} className="flex items-center justify-between text-xs">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{service.service_name}</span>
            <span className="font-medium">{new Intl.NumberFormat().format(service.revenue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

