import React from 'react';
import { CalendarRange, RotateCcw, Search } from 'lucide-react';
import type { UserFilters } from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  getPanelClass,
  PERIOD_OPTIONS,
  USER_STATUS_OPTIONS,
} from './userPermissions.utils';

interface UserPermissionsFiltersPanelProps {
  isDark: boolean;
  userFilters: UserFilters;
  onUserFilterChange: (
    key: keyof UserFilters,
    value: string | number | undefined
  ) => void;
  onResetUserFilters: () => void;
}

const inputClass = (isDark: boolean) =>
  cn(
    'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
    isDark
      ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
  );

const selectClass = inputClass;

const UserPermissionsFiltersPanel: React.FC<UserPermissionsFiltersPanelProps> = ({
  isDark,
  userFilters,
  onUserFilterChange,
  onResetUserFilters,
}) => {
  const panelClass = getPanelClass(isDark);

  return (
    <section className={cn(panelClass, 'p-6')}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            Permission Filters
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Narrow platform users by name, contact metadata, lifecycle status, and join period.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetUserFilters}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
            isDark
              ? 'bg-white/5 text-slate-200 hover:bg-white/10'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label
            className={cn(
              'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Search
          </label>

          <div className="relative">
            <Search
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-slate-500' : 'text-slate-400'
              )}
            />
            <input
              value={userFilters.search ?? ''}
              onChange={(e) => onUserFilterChange('search', e.target.value)}
              placeholder="Search by name, email, phone, or UUID"
              className={cn(inputClass(isDark), 'pl-11')}
            />
          </div>
        </div>

        <div>
          <label
            className={cn(
              'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Status
          </label>

          <select
            value={userFilters.status ?? ''}
            onChange={(e) => onUserFilterChange('status', e.target.value || undefined)}
            className={selectClass(isDark)}
          >
            <option value="">All statuses</option>
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={cn(
              'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Registration Period
          </label>

          <select
            value={userFilters.period ?? ''}
            onChange={(e) => onUserFilterChange('period', e.target.value || undefined)}
            className={selectClass(isDark)}
          >
            <option value="">Custom / none</option>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className={cn(
              'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Date From
          </label>

          <div className="relative">
            <CalendarRange
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-slate-500' : 'text-slate-400'
              )}
            />
            <input
              type="date"
              value={userFilters.date_from ?? ''}
              onChange={(e) => onUserFilterChange('date_from', e.target.value || undefined)}
              className={cn(inputClass(isDark), 'pl-11')}
            />
          </div>
        </div>

        <div>
          <label
            className={cn(
              'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            Date To
          </label>

          <div className="relative">
            <CalendarRange
              className={cn(
                'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-slate-500' : 'text-slate-400'
              )}
            />
            <input
              type="date"
              value={userFilters.date_to ?? ''}
              onChange={(e) => onUserFilterChange('date_to', e.target.value || undefined)}
              className={cn(inputClass(isDark), 'pl-11')}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserPermissionsFiltersPanel;
