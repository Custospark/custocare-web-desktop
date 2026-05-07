import React, { useMemo } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  Syringe,
  ClipboardSignature,
  Activity,
} from 'lucide-react';
import type { NursingDashboardSummary } from '../../api/intelligence/nursingDashboardTypes';

interface NursingOverviewStatsProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  summary: NursingDashboardSummary | undefined;
  isLoading: boolean;
}

interface StatData {
  label: string;
  value: string;
  change?: number | null;
  changeIsAbsolute?: boolean;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function formatInt(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function formatNum(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export const NursingOverviewStats: React.FC<NursingOverviewStatsProps> = ({
  theme,
  refreshKey,
  summary,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  const stats: StatData[] = useMemo(() => {
    if (!summary) {
      return [];
    }

    const overdueNote =
      summary.overdue_tasks > 0 ? `${summary.overdue_tasks} tasks past due` : undefined;

    return [
      {
        label: 'Open tasks',
        value: formatInt(summary.open_tasks.value),
        change: summary.open_tasks.change_pct ?? null,
        changeLabel: [summary.open_tasks.change_label, overdueNote].filter(Boolean).join(' · '),
        icon: ClipboardList,
        iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
        iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      },
      {
        label: 'Missed medication alerts',
        value: formatInt(summary.missed_medication_alerts.value),
        change: summary.missed_medication_alerts.change ?? null,
        changeIsAbsolute: true,
        changeLabel: summary.missed_medication_alerts.change_label || 'overdue pending doses',
        icon: AlertTriangle,
        iconColor: isDark ? 'text-red-400' : 'text-red-600',
        iconBg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      },
      {
        label: 'Administrations today',
        value: formatInt(summary.administrations_today.value),
        change: summary.administrations_today.change_pct ?? null,
        changeLabel: [
          summary.administrations_today.change_label,
          summary.administrations_today.secondary_label,
        ]
          .filter(Boolean)
          .join(' · '),
        icon: Syringe,
        iconColor: isDark ? 'text-green-400' : 'text-green-600',
        iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      },
      {
        label: 'Handovers pending ack.',
        value: formatInt(summary.pending_review.value),
        changeLabel: summary.pending_review.change_label || 'shift handovers',
        icon: ClipboardSignature,
        iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
        iconBg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
      },
      {
        label: 'Treatment logs today',
        value: formatNum(summary.treatment_logs_today.value),
        change: summary.treatment_logs_today.change_pct_vs_avg_daily ?? null,
        changeLabel: summary.treatment_logs_today.change_label || 'vs 30-day avg daily',
        icon: Activity,
        iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
        iconBg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
      },
    ];
  }, [summary, isDark]);

  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`sk-${i}`}
            className={`rounded-xl p-4 border animate-pulse ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <div className={`h-3 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`mt-3 h-8 w-16 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change != null && stat.change > 0;
        const isNegative = stat.change != null && stat.change < 0;

        return (
          <div
            key={`${stat.label}-${refreshKey}-${index}`}
            className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-lg ${
              isDark
                ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold mt-2">{stat.value}</p>
                {stat.changeLabel && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {stat.change !== undefined && stat.change !== null && (
                      <span
                        className={`text-xs font-medium ${
                          isPositive
                            ? isDark
                              ? 'text-green-400'
                              : 'text-green-600'
                            : isNegative
                              ? isDark
                                ? 'text-red-400'
                                : 'text-red-600'
                              : isDark
                                ? 'text-gray-400'
                                : 'text-gray-600'
                        }`}
                      >
                        {stat.changeIsAbsolute ? (
                          <>
                            {isPositive ? '+' : ''}
                            {stat.change}
                          </>
                        ) : (
                          <>
                            {isPositive ? '+' : ''}
                            {stat.change}%
                          </>
                        )}
                      </span>
                    )}
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {stat.changeLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
