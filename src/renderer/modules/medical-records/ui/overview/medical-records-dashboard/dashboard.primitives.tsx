import React from 'react';
import { motion } from 'framer-motion';
import { Workflow } from 'lucide-react';
import { cn, formatNumber, getTrendMeta, type AccentTone } from './dashboard.utils';
import { formatText } from '../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

export const EmptyChartState: React.FC<{
  title: string;
  subtitle: string;
  isDark: boolean;
}> = ({ title, subtitle, isDark }) => (
  <div
    className={cn(
      'flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed',
      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
    )}
  >
    <div className="px-6 text-center">
      <div
        className={cn(
          'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl',
          isDark ? 'bg-white/5' : 'bg-white'
        )}
      >
        <Workflow className={cn('h-6 w-6', isDark ? 'text-slate-400' : 'text-slate-500')} />
      </div>
      <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
        {title}
      </h4>
      <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
        {subtitle}
      </p>
    </div>
  </div>
);

export const EnterpriseTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  isDark: boolean;
  labelFormatter?: (value: string) => string;
  valueFormatter?: (value: number, name: string) => string;
}> = ({ active, payload, label, isDark, labelFormatter, valueFormatter }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
        isDark
          ? 'border-white/10 bg-slate-900/95 text-slate-100'
          : 'border-slate-200 bg-white/95 text-slate-900'
      )}
    >
      {label && (
        <div className={cn('mb-2 text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {labelFormatter ? formatText(labelFormatter(label)) : label}
        </div>
      )}

      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill || '#2563EB' }}
              />
              <span className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-600')}>
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-semibold">
              {valueFormatter
                ? valueFormatter(Number(entry.value ?? 0), entry.name)
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProgressRow: React.FC<{
  label: string;
  value: number;
  isDark: boolean;
  tone?: 'blue' | 'green' | 'amber' | 'rose' | 'violet';
  suffix?: string;
}> = ({ label, value, isDark, tone = 'blue', suffix = '%' }) => {
  const toneMap = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    rose: 'from-rose-500 to-pink-400',
    violet: 'from-violet-500 to-fuchsia-400',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>{label}</span>
        <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          {Number(value ?? 0).toFixed(1)}
          {suffix}
        </span>
      </div>

      <div className={cn('h-2 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-slate-100')}>
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', toneMap[tone])}
          style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
        />
      </div>
    </div>
  );
};

export const MetricCard: React.FC<{
  isDark: boolean;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: AccentTone;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
}> = ({ isDark, title, value, subtitle, icon: Icon, accent, trend, delta }) => {
  const accentMap = {
    blue: {
      soft: isDark ? 'from-blue-500/10 to-cyan-500/5' : 'from-blue-50 to-cyan-50',
      ring: isDark ? 'border-blue-500/20' : 'border-blue-200/70',
      icon: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700',
      glow: 'bg-blue-500/20',
    },
    green: {
      soft: isDark ? 'from-emerald-500/10 to-teal-500/5' : 'from-emerald-50 to-teal-50',
      ring: isDark ? 'border-emerald-500/20' : 'border-emerald-200/70',
      icon: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
      glow: 'bg-emerald-500/20',
    },
    amber: {
      soft: isDark ? 'from-amber-500/10 to-orange-500/5' : 'from-amber-50 to-orange-50',
      ring: isDark ? 'border-amber-500/20' : 'border-amber-200/70',
      icon: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700',
      glow: 'bg-amber-500/20',
    },
    violet: {
      soft: isDark ? 'from-violet-500/10 to-fuchsia-500/5' : 'from-violet-50 to-fuchsia-50',
      ring: isDark ? 'border-violet-500/20' : 'border-violet-200/70',
      icon: isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700',
      glow: 'bg-violet-500/20',
    },
    rose: {
      soft: isDark ? 'from-rose-500/10 to-pink-500/5' : 'from-rose-50 to-pink-50',
      ring: isDark ? 'border-rose-500/20' : 'border-rose-200/70',
      icon: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-700',
      glow: 'bg-rose-500/20',
    },
  };

  const trendMeta = getTrendMeta(trend);
  const TrendIcon = trendMeta.icon;
  const palette = accentMap[accent];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl border p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.45)] backdrop-blur-xl',
        'bg-gradient-to-br',
        palette.soft,
        palette.ring
      )}
    >
      <div className={cn('absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl', palette.glow)} />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{title}</p>
          <div className={cn('mt-3 text-3xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-950')}>
            {value}
          </div>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>{subtitle}</p>

          {typeof delta === 'number' && trend && (
            <div className="mt-4 flex items-center gap-2">
              <div className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', trendMeta.bgClass)}>
                <TrendIcon className={cn('h-3.5 w-3.5', trendMeta.textClass)} />
                <span className={trendMeta.textClass}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)}%
                </span>
              </div>
              <span className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                vs previous period
              </span>
            </div>
          )}
        </div>

        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', palette.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
};
