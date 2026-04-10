import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange, RefreshCw, X } from 'lucide-react';

import type { AnalyticsGroupBy } from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import {
  ANALYTICS_GROUP_OPTIONS,
  cn,
  formatFullDate,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';

interface FacilityAdminDashboardHeaderProps {
  isDark: boolean;
  selectedGroupBy: AnalyticsGroupBy;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onSelectGroupBy: (value: AnalyticsGroupBy) => void;
  onApplyDateRange: () => void;
  onClearDateRange: () => void;
  onRefresh: () => void;
  isFetching: boolean;
}

const FacilityAdminDashboardHeader: React.FC<FacilityAdminDashboardHeaderProps> = ({
  isDark,
  selectedGroupBy,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onSelectGroupBy,
  onApplyDateRange,
  onClearDateRange,
  onRefresh,
  isFetching,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);
  const hasCustomRange = Boolean(customFrom && customTo);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(panelClass, 'relative overflow-hidden p-6 md:p-8')}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-70',
          isDark
            ? 'bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_28%)]'
            : 'bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.10),_transparent_28%)]'
        )}
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isFetching ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
              )}
            />
            Facility administrative intelligence
          </div>

          <h1
            className={cn(
              'text-3xl font-bold tracking-tight md:text-4xl',
              isDark ? 'text-white' : 'text-slate-950'
            )}
          >
            Facility Admin Analytics Dashboard
          </h1>

          <p
            className={cn(
              'mt-3 max-w-2xl text-sm md:text-base',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            Executive visibility into staffing, capacity, inventory risk, and service pricing —
            with only the essential financial trend signal surfaced here.
          </p>

          <AnimatePresence>
            {hasCustomRange && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    subtlePanelClass,
                    'mt-5 inline-flex flex-wrap items-center gap-3 px-4 py-3'
                  )}
                >
                  <div className="inline-flex items-center gap-2">
                    <CalendarRange className="h-4 w-4" />
                    <span
                      className={cn(
                        'text-sm',
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      )}
                    >
                      {formatFullDate(customFrom)} — {formatFullDate(customTo)}
                    </span>
                  </div>

                  <button
                    onClick={onClearDateRange}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                      isDark
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear range
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[420px]">
          <div className={cn(subtlePanelClass, 'p-4')}>
            <div className="mb-3 flex items-center justify-between">
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.14em]',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                Grouping
              </span>

              <button
                onClick={onRefresh}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                  isDark
                    ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ANALYTICS_GROUP_OPTIONS.map((option) => {
                const active = selectedGroupBy === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => onSelectGroupBy(option.value)}
                    className={cn(
                      'rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all',
                      active
                        ? isDark
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                        : isDark
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => onCustomFromChange(e.target.value)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />

              <input
                type="date"
                value={customTo}
                onChange={(e) => onCustomToChange(e.target.value)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />

              <button
                onClick={onApplyDateRange}
                disabled={!customFrom || !customTo}
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  !customFrom || !customTo
                    ? isDark
                      ? 'cursor-not-allowed bg-white/5 text-slate-500'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : isDark
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                )}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FacilityAdminDashboardHeader;
