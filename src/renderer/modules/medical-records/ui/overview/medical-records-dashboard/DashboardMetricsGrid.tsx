//DashboardMetricsGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from './dashboard.utils';

export interface DashboardMetricItem {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: AccentTone;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
}

type AccentTone = 'blue' | 'violet' | 'amber' | 'green' | 'rose';

interface DashboardMetricsGridProps {
  isDark: boolean;
  metrics: DashboardMetricItem[];
}

const getAccentStyles = (accent: AccentTone, isDark: boolean) => {
  const styles = {
    blue: {
      gradient: isDark ? 'from-blue-900/40 to-gray-900' : 'from-blue-50 to-white',
      // Sharp solid borders - no transparency
      border: isDark ? 'border-blue-500' : 'border-blue-400',
      hoverBorder: isDark ? 'hover:border-blue-400' : 'hover:border-blue-500',
      shadow: isDark ? 'shadow-lg shadow-blue-500/10' : 'shadow-lg shadow-blue-500/10',
      hoverShadow: isDark ? 'hover:shadow-xl hover:shadow-blue-500/20' : 'hover:shadow-xl hover:shadow-blue-500/20',
      bgBlur: isDark ? 'bg-blue-500/15' : 'bg-blue-500/10',
      iconBg: isDark ? 'bg-blue-500/25' : 'bg-blue-100',
      iconBgHover: isDark ? 'group-hover:bg-blue-500/40' : 'group-hover:bg-blue-200',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      trendUp: isDark ? 'text-emerald-400' : 'text-emerald-600',
      trendDown: isDark ? 'text-rose-400' : 'text-rose-600',
      ringGlow: isDark ? 'ring-1 ring-blue-500/30' : 'ring-1 ring-blue-500/20',
    },
    violet: {
      gradient: isDark ? 'from-violet-900/40 to-gray-900' : 'from-violet-50 to-white',
      border: isDark ? 'border-violet-500' : 'border-violet-400',
      hoverBorder: isDark ? 'hover:border-violet-400' : 'hover:border-violet-500',
      shadow: isDark ? 'shadow-lg shadow-violet-500/10' : 'shadow-lg shadow-violet-500/10',
      hoverShadow: isDark ? 'hover:shadow-xl hover:shadow-violet-500/20' : 'hover:shadow-xl hover:shadow-violet-500/20',
      bgBlur: isDark ? 'bg-violet-500/15' : 'bg-violet-500/10',
      iconBg: isDark ? 'bg-violet-500/25' : 'bg-violet-100',
      iconBgHover: isDark ? 'group-hover:bg-violet-500/40' : 'group-hover:bg-violet-200',
      iconColor: isDark ? 'text-violet-400' : 'text-violet-600',
      trendUp: isDark ? 'text-emerald-400' : 'text-emerald-600',
      trendDown: isDark ? 'text-rose-400' : 'text-rose-600',
      ringGlow: isDark ? 'ring-1 ring-violet-500/30' : 'ring-1 ring-violet-500/20',
    },
    amber: {
      gradient: isDark ? 'from-amber-900/40 to-gray-900' : 'from-amber-50 to-white',
      border: isDark ? 'border-amber-500' : 'border-amber-400',
      hoverBorder: isDark ? 'hover:border-amber-400' : 'hover:border-amber-500',
      shadow: isDark ? 'shadow-lg shadow-amber-500/10' : 'shadow-lg shadow-amber-500/10',
      hoverShadow: isDark ? 'hover:shadow-xl hover:shadow-amber-500/20' : 'hover:shadow-xl hover:shadow-amber-500/20',
      bgBlur: isDark ? 'bg-amber-500/15' : 'bg-amber-500/10',
      iconBg: isDark ? 'bg-amber-500/25' : 'bg-amber-100',
      iconBgHover: isDark ? 'group-hover:bg-amber-500/40' : 'group-hover:bg-amber-200',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-600',
      trendUp: isDark ? 'text-emerald-400' : 'text-emerald-600',
      trendDown: isDark ? 'text-rose-400' : 'text-rose-600',
      ringGlow: isDark ? 'ring-1 ring-amber-500/30' : 'ring-1 ring-amber-500/20',
    },
    green: {
      gradient: isDark ? 'from-green-900/40 to-gray-900' : 'from-green-50 to-white',
      border: isDark ? 'border-green-500' : 'border-green-400',
      hoverBorder: isDark ? 'hover:border-green-400' : 'hover:border-green-500',
      shadow: isDark ? 'shadow-lg shadow-green-500/10' : 'shadow-lg shadow-green-500/10',
      hoverShadow: isDark ? 'hover:shadow-xl hover:shadow-green-500/20' : 'hover:shadow-xl hover:shadow-green-500/20',
      bgBlur: isDark ? 'bg-green-500/15' : 'bg-green-500/10',
      iconBg: isDark ? 'bg-green-500/25' : 'bg-green-100',
      iconBgHover: isDark ? 'group-hover:bg-green-500/40' : 'group-hover:bg-green-200',
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      trendUp: isDark ? 'text-emerald-400' : 'text-emerald-600',
      trendDown: isDark ? 'text-rose-400' : 'text-rose-600',
      ringGlow: isDark ? 'ring-1 ring-green-500/30' : 'ring-1 ring-green-500/20',
    },
    rose: {
      gradient: isDark ? 'from-rose-900/40 to-gray-900' : 'from-rose-50 to-white',
      border: isDark ? 'border-rose-500' : 'border-rose-400',
      hoverBorder: isDark ? 'hover:border-rose-400' : 'hover:border-rose-500',
      shadow: isDark ? 'shadow-lg shadow-rose-500/10' : 'shadow-lg shadow-rose-500/10',
      hoverShadow: isDark ? 'hover:shadow-xl hover:shadow-rose-500/20' : 'hover:shadow-xl hover:shadow-rose-500/20',
      bgBlur: isDark ? 'bg-rose-500/15' : 'bg-rose-500/10',
      iconBg: isDark ? 'bg-rose-500/25' : 'bg-rose-100',
      iconBgHover: isDark ? 'group-hover:bg-rose-500/40' : 'group-hover:bg-rose-200',
      iconColor: isDark ? 'text-rose-400' : 'text-rose-600',
      trendUp: isDark ? 'text-emerald-400' : 'text-emerald-600',
      trendDown: isDark ? 'text-rose-400' : 'text-rose-600',
      ringGlow: isDark ? 'ring-1 ring-rose-500/30' : 'ring-1 ring-rose-500/20',
    },
  };

  return styles[accent];
};

const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ isDark, metrics }) => {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => {
        const accentStyles = getAccentStyles(metric.accent, isDark);
        const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
        const isPositiveTrend = metric.trend === 'up';
        const isNegativeTrend = metric.trend === 'down';
        
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04 }}
            whileHover={{ y: -6 }}
            className="h-full"
          >
            <div
              className={cn(
                'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
                'border-2',
                `bg-gradient-to-br ${accentStyles.gradient}`,
                accentStyles.border,
                accentStyles.hoverBorder,
                accentStyles.shadow,
                accentStyles.hoverShadow,
                accentStyles.ringGlow,
                'group cursor-pointer h-full',
                // Added depth with backdrop blur and inner shadow
                isDark ? 'backdrop-blur-sm' : 'backdrop-blur-[0.5px]'
              )}
            >
              {/* Inner glow for depth */}
              <div className={cn(
                'absolute inset-0 rounded-xl pointer-events-none',
                'bg-gradient-to-t from-black/5 to-transparent dark:from-white/5'
              )} />

              {/* Background decoration - enhanced glow */}
              <div
                className={cn(
                  'absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-all duration-500',
                  accentStyles.bgBlur,
                  'opacity-30 group-hover:opacity-100 group-hover:scale-150'
                )}
              />

              {/* Bottom glow for depth */}
              <div
                className={cn(
                  'absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl transition-all duration-500',
                  accentStyles.bgBlur,
                  'opacity-0 group-hover:opacity-50 group-hover:scale-150'
                )}
              />

              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div
                  className={cn(
                    'p-2.5 rounded-xl transition-all duration-300',
                    accentStyles.iconBg,
                    accentStyles.iconBgHover,
                    'group-hover:scale-110 group-hover:shadow-lg'
                  )}
                >
                  <metric.icon className={cn('w-5 h-5', accentStyles.iconColor)} />
                </div>

                {/* Trend Indicator with background pill */}
                {metric.trend && metric.delta !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full',
                    isDark ? 'bg-black/20' : 'bg-white/50',
                    'backdrop-blur-sm'
                  )}>
                    <TrendIcon className={cn(
                      'w-3 h-3',
                      isPositiveTrend && accentStyles.trendUp,
                      isNegativeTrend && accentStyles.trendDown,
                      metric.trend === 'stable' && (isDark ? 'text-gray-400' : 'text-gray-500')
                    )} />
                    <span className={cn(
                      'text-xs font-semibold',
                      isPositiveTrend && accentStyles.trendUp,
                      isNegativeTrend && accentStyles.trendDown,
                      metric.trend === 'stable' && (isDark ? 'text-gray-400' : 'text-gray-500')
                    )}>
                      {isPositiveTrend && '+'}
                      {metric.delta.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="mt-3 relative z-10">
                <p className={cn(
                  'text-3xl sm:text-4xl font-bold truncate tracking-tight',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  {metric.value}
                </p>
                <p className={cn(
                  'text-sm font-semibold mt-2',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {metric.title}
                </p>
                <p className={cn(
                  'text-xs mt-1.5',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  {metric.subtitle}
                </p>
              </div>

              {/* Decorative accent bar at bottom */}
              <div className={cn(
                'absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300',
                `bg-gradient-to-r ${accentStyles.gradient.replace('to-gray-900', '').replace('to-white', '')}`,
                'opacity-0 group-hover:opacity-100'
              )} />

              {/* Mini decorative element */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  accentStyles.iconColor
                )} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
};

export default DashboardMetricsGrid;