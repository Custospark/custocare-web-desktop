import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { cn, getPanelClass, getSubtlePanelClass, formatNumber } from './facilityGovernance.utils';

type Tone = 'blue' | 'green' | 'amber' | 'violet' | 'rose';

export const InfoPill: React.FC<{
  isDark: boolean;
  label: string;
  value: string;
}> = ({ isDark, label, value }) => (
  <div
    className={cn(
      'rounded-2xl border px-3 py-2 text-sm',
      isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
    )}
  >
    <span className={cn('mr-2 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
      {label}
    </span>
    <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
      {value}
    </span>
  </div>
);

export const EmptyState: React.FC<{
  isDark: boolean;
  title: string;
  subtitle: string;
  icon?: React.ElementType;
}> = ({ isDark, title, subtitle, icon: Icon = Database }) => (
  <div
    className={cn(
      getPanelClass(isDark),
      'flex min-h-[300px] items-center justify-center p-10 text-center'
    )}
  >
    <div className="max-w-md">
      <div
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl',
          isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <h3 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-slate-950')}>
        {title}
      </h3>
      <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
        {subtitle}
      </p>
    </div>
  </div>
);

export const GovernanceStatCard: React.FC<{
  isDark: boolean;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  tone?: Tone;
}> = ({ isDark, title, value, subtitle, icon: Icon, tone = 'blue' }) => {
  const toneMap = {
    blue: {
      soft: isDark ? 'from-blue-500/10 to-cyan-500/5' : 'from-blue-50 to-cyan-50',
      ring: isDark ? 'border-blue-500/20' : 'border-blue-200/70',
      icon: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700',
    },
    green: {
      soft: isDark ? 'from-emerald-500/10 to-teal-500/5' : 'from-emerald-50 to-teal-50',
      ring: isDark ? 'border-emerald-500/20' : 'border-emerald-200/70',
      icon: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    },
    amber: {
      soft: isDark ? 'from-amber-500/10 to-orange-500/5' : 'from-amber-50 to-orange-50',
      ring: isDark ? 'border-amber-500/20' : 'border-amber-200/70',
      icon: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700',
    },
    violet: {
      soft: isDark ? 'from-violet-500/10 to-fuchsia-500/5' : 'from-violet-50 to-fuchsia-50',
      ring: isDark ? 'border-violet-500/20' : 'border-violet-200/70',
      icon: isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700',
    },
    rose: {
      soft: isDark ? 'from-rose-500/10 to-pink-500/5' : 'from-rose-50 to-pink-50',
      ring: isDark ? 'border-rose-500/20' : 'border-rose-200/70',
      icon: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-100 text-rose-700',
    },
  };

  const palette = toneMap[tone];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'rounded-3xl border bg-gradient-to-br p-5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]',
        palette.soft,
        palette.ring
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
            {title}
          </p>
          <p className={cn('mt-3 text-3xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            {value}
          </p>
          <p className={cn('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            {subtitle}
          </p>
        </div>

        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', palette.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
};

export const PaginationControls: React.FC<{
  isDark: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ isDark, currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
        Showing <span className="font-semibold">{formatNumber(start)}</span> -{' '}
        <span className="font-semibold">{formatNumber(end)}</span> of{' '}
        <span className="font-semibold">{formatNumber(totalItems)}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
            currentPage <= 1
              ? isDark
                ? 'cursor-not-allowed bg-white/5 text-slate-500'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
              : isDark
              ? 'bg-white/5 text-slate-200 hover:bg-white/10'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm font-semibold',
            isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'
          )}
        >
          {currentPage} / {Math.max(totalPages, 1)}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
            currentPage >= totalPages
              ? isDark
                ? 'cursor-not-allowed bg-white/5 text-slate-500'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
              : isDark
              ? 'bg-white/5 text-slate-200 hover:bg-white/10'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const GovernanceTableSkeleton: React.FC<{
  isDark: boolean;
}> = ({ isDark }) => (
  <div className={cn(getPanelClass(isDark), 'p-6')}>
    <div className="mb-6 flex flex-wrap gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-10 w-32 animate-pulse rounded-2xl',
            isDark ? 'bg-white/5' : 'bg-slate-100'
          )}
        />
      ))}
    </div>

    <div className={cn(getSubtlePanelClass(isDark), 'overflow-hidden p-4')}>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-16 animate-pulse rounded-2xl',
              isDark ? 'bg-white/5' : 'bg-slate-100'
            )}
          />
        ))}
      </div>
    </div>
  </div>
);
