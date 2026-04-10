//DashboardHeader.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import type {
  DashboardPeriod,
  DashboardResponse,
} from '../../../api/facility-patient-analytics/FacilityPatientAnalyticsTypes';
import {
  PERIOD_OPTIONS,
  cn,
  getPanelClass,
  getSubtlePanelClass,
} from './dashboard.utils';

interface DashboardHeaderProps {
  isDark: boolean;
  dashboard: DashboardResponse['data'];
  selectedPeriod: DashboardPeriod;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onSelectPeriod: (value: DashboardPeriod) => void;
  onApplyCustomRange: () => void;
  onRefresh: () => void;
  isFetching: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isDark,
  selectedPeriod,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onSelectPeriod,
  onApplyCustomRange,
  onRefresh,
  isFetching,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

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
            ? 'bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%)]'
            : 'bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_28%)]'
        )}
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
          <span className={cn('h-2 w-2 rounded-full', isFetching ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
            Patient Analytics
          </div>

          <h1 className={cn('text-3xl font-bold tracking-tight md:text-4xl', isDark ? 'text-white' : 'text-slate-950')}>
            Clinical Intelligence
          </h1>

          <p className={cn('mt-3 max-w-2xl text-sm md:text-base', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Executive-grade visibility into patient volume, care flow, retention, demographics,
            visit composition, and revenue performance.
          </p>

          {/* <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
              <CalendarRange className="h-4 w-4" />
              <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                {dashboard.period.label} • {formatFullDate(dashboard.period.start_date)} —{' '}
                {formatFullDate(dashboard.period.end_date)}
              </span>
            </div>

            <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
              <HeartPulse className="h-4 w-4" />
              <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                Avg wait {formatNumber(dashboard.patient_flow.average_waiting_minutes)} min
              </span>
            </div>

            <div className={cn('inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm', subtlePanelClass)}>
              <DollarSign className="h-4 w-4" />
              <span className={cn(isDark ? 'text-slate-300' : 'text-slate-700')}>
                {formatCurrency(dashboard.revenue.average_revenue_per_visit)} avg / visit
              </span>
            </div>
          </div> */}
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[380px]">
          <div className={cn(subtlePanelClass, 'p-4')}>
            <div className="mb-3 flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Period
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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4">
              {PERIOD_OPTIONS.map((option) => {
                const active = selectedPeriod === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => onSelectPeriod(option.value)}
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

            <AnimatePresence>
              {selectedPeriod === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  className="overflow-hidden"
                >
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
                      onClick={onApplyCustomRange}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardHeader;
