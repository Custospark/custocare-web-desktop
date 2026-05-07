import React, { useMemo } from 'react';
import { TrendingUp, Clock, Target, Users } from 'lucide-react';
import type { NursingPerformanceBlock } from '../../api/intelligence/nursingDashboardTypes';

interface NursingPerformanceMetricsProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  performance: NursingPerformanceBlock | undefined;
  isLoading: boolean;
}

interface Metric {
  label: string;
  value: string;
  target: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
}

export const NursingPerformanceMetrics: React.FC<NursingPerformanceMetricsProps> = ({
  theme,
  refreshKey,
  performance,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  const metrics: Metric[] = useMemo(() => {
    if (!performance) return [];

    const workloadPct = Math.min(100, Math.max(0, performance.workload_vs_avg_pct));

    return [
      {
        label: 'On-time administration (7d)',
        value: `${performance.medication_on_time_pct.toFixed(1)}%`,
        target: '100%',
        percentage: Math.min(100, performance.medication_on_time_pct),
        trend: performance.medication_on_time_pct >= 90 ? 'up' : 'stable',
        icon: Target,
      },
      {
        label: 'Task completion (week est.)',
        value: `${performance.task_completion_pct.toFixed(1)}%`,
        target: '100%',
        percentage: Math.min(100, performance.task_completion_pct),
        trend: performance.task_completion_pct >= 75 ? 'up' : 'stable',
        icon: TrendingUp,
      },
      {
        label: 'Documentation rate (7d)',
        value: `${performance.documentation_rate_pct.toFixed(1)}%`,
        target: '100%',
        percentage: Math.min(100, performance.documentation_rate_pct),
        trend: performance.documentation_rate_pct >= 40 ? 'up' : 'stable',
        icon: Clock,
      },
      {
        label: 'Workload vs 30d avg admins',
        value: `${workloadPct.toFixed(0)}%`,
        target: '100%',
        percentage: workloadPct,
        trend: workloadPct >= 85 ? 'up' : workloadPct >= 55 ? 'stable' : 'down',
        icon: Users,
      },
    ];
  }, [performance]);

  if (isLoading && !performance) {
    return (
      <div
        className={`rounded-xl p-6 border animate-pulse ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`h-6 w-32 rounded mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-14 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  const grade = performance?.overall_grade ?? '—';
  const label = performance?.overall_label ?? '';

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
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Target: {metric.target}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
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
                    style={{ width: `${Math.min(100, metric.percentage)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {metric.percentage.toFixed(1)}%
                  </span>
                  {metric.trend === 'up' && <span className="text-xs text-green-500">↑ Improving</span>}
                  {metric.trend === 'down' && <span className="text-xs text-red-500">↓ Declining</span>}
                  {metric.trend === 'stable' && <span className="text-xs text-gray-500">→ Stable</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-5 pt-5 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="text-center">
          <p
            className={`text-xs uppercase tracking-wide font-medium mb-1 ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            Overall score
          </p>
          <p className="text-3xl font-bold text-green-500">{grade}</p>
          {label && (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          )}
          <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Patient touchpoints today:{' '}
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              {performance?.daily_touchpoints ?? '—'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
