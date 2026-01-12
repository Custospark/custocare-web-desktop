// OverviewStats.tsx
import React from 'react';
import {
  Package,
  AlertTriangle,
  FileText,
  CheckCircle,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

interface OverviewStatsProps {
  theme: 'light' | 'dark';
  refreshKey: number;
}

interface StatData {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export const OverviewStats: React.FC<OverviewStatsProps> = ({ theme, refreshKey }) => {
  const isDark = theme === 'dark';

  // Mock data - in production, this would come from API
  const stats: StatData[] = [
    {
      label: 'Total Stock Items',
      value: '2,847',
      change: 12,
      changeLabel: 'vs last month',
      icon: Package,
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    },
    {
      label: 'Low Stock Alerts',
      value: 18,
      change: -3,
      changeLabel: 'vs yesterday',
      icon: AlertTriangle,
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      iconBg: isDark ? 'bg-red-900/30' : 'bg-red-50',
    },
    {
      label: 'Prescriptions Today',
      value: 143,
      change: 8,
      changeLabel: 'vs avg daily',
      icon: FileText,
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
    },
    {
      label: 'Dispensed Today',
      value: 127,
      change: 5,
      changeLabel: 'completion rate 89%',
      icon: CheckCircle,
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
    },
    {
      label: 'Pending Checkouts',
      value: 12,
      changeLabel: 'awaiting payment',
      icon: ShoppingCart,
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      iconBg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
    },
    {
      label: 'Revenue Today',
      value: '$8,432',
      change: 15,
      changeLabel: 'vs avg daily',
      icon: TrendingUp,
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      iconBg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change && stat.change > 0;
        const isNegative = stat.change && stat.change < 0;

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
                  <div className="mt-2 flex items-center gap-1">
                    {stat.change !== undefined && (
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
                        {isPositive ? '+' : ''}
                        {stat.change}%
                      </span>
                    )}
                    <span
                      className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
                    >
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
