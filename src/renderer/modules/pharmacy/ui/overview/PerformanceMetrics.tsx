// PerformanceMetrics.tsx
import React from 'react';
import { TrendingUp, Clock, Users, Target } from 'lucide-react';

interface PerformanceMetricsProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface Metric {
  label: string;
  value: string;
  target: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  theme,
  refreshKey,
}) => {
  const isDark = theme === 'dark';

  const metrics: Metric[] = [
    {
      label: 'Fill Rate',
      value: '93.3%',
      target: '95%',
      percentage: 98.2,
      trend: 'up',
      icon: Target,
    },
    {
      label: 'Avg Wait Time',
      value: '12 min',
      target: '15 min',
      percentage: 80,
      trend: 'up',
      icon: Clock,
    },
    {
      label: 'Daily Patients',
      value: '287',
      target: '300',
      percentage: 95.7,
      trend: 'stable',
      icon: Users,
    },
    {
      label: 'Revenue Target',
      value: '89%',
      target: '100%',
      percentage: 89,
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
        <h2 className="text-lg font-semibold">Performance</h2>
      </div>

      <div className="space-y-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={`${metric.label}-${refreshKey}-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metric.value}</p>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}
                  >
                    Target: {metric.target}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div
                  className={`w-full rounded-full h-2 ${
                    isDark ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.percentage >= 95
                        ? 'bg-green-500'
                        : metric.percentage >= 80
                        ? 'bg-blue-500'
                        : metric.percentage >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}
                  >
                    {metric.percentage.toFixed(1)}%
                  </span>
                  {metric.trend === 'up' && (
                    <span className="text-xs text-green-500">↑ Improving</span>
                  )}
                  {metric.trend === 'down' && (
                    <span className="text-xs text-red-500">↓ Declining</span>
                  )}
                  {metric.trend === 'stable' && (
                    <span className="text-xs text-gray-500">→ Stable</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-5 pt-5 border-t ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        <div className="text-center">
          <p
            className={`text-xs uppercase tracking-wide font-medium mb-1 ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            Overall Score
          </p>
          <p className="text-3xl font-bold text-green-500">A-</p>
          <p
            className={`text-xs mt-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Excellent performance
          </p>
        </div>
      </div>
    </div>
  );
};
