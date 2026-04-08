import React from 'react';
import { RefreshCw } from 'lucide-react';

import type { BillingRevenueDashboardFilters } from '../../../../api/billing-revenue-stats/BillingRevenueDashboardTypes';
import type { BillingRevenueDashboardUi } from './billingRevenueDashboardShared';
import { cx } from './revenueDashboardUtils';

type BillingRevenueDashboardFiltersBarProps = {
  isDark: boolean;
  isFetching: boolean;
  ui: BillingRevenueDashboardUi;
  cardClassName: string;
  lastRefreshed: Date;
  draftFilters: BillingRevenueDashboardFilters;
  onDraftFiltersChange: React.Dispatch<React.SetStateAction<BillingRevenueDashboardFilters>>;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onRefresh: () => void;
};

const BillingRevenueDashboardFiltersBar: React.FC<BillingRevenueDashboardFiltersBarProps> = ({
  isDark,
  isFetching,
  ui,
  cardClassName,
  lastRefreshed,
  draftFilters,
  onDraftFiltersChange,
  onApplyFilters,
  onResetFilters,
  onRefresh,
}) => {
  return (
    <div className={cx(cardClassName, 'space-y-2')}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className={cx('text-sm font-semibold', ui.text)}>Filters</h2>
          <p className={cx('text-xs', ui.textSecondary)}>Date range and grouping</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={cx('text-xs', ui.textSecondary)}>
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>

          <button
            onClick={onRefresh}
            className={cx(
              'p-1 rounded-md transition',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}
            aria-label="Refresh"
            type="button"
          >
            <RefreshCw className={cx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[130px]">
          <div className={cx('text-xs mb-0.5', ui.textSecondary)}>From</div>
          <input
            type="date"
            value={draftFilters.date_from ?? ''}
            onChange={(e) =>
              onDraftFiltersChange((prev) => ({
                ...prev,
                date_from: e.target.value || undefined,
              }))
            }
            className={cx(
              'w-full rounded-md border px-2 py-1 text-sm outline-none',
              isDark
                ? 'bg-gray-950 border-gray-700 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            )}
          />
        </div>

        <div className="min-w-[130px]">
          <div className={cx('text-xs mb-0.5', ui.textSecondary)}>To</div>
          <input
            type="date"
            value={draftFilters.date_to ?? ''}
            onChange={(e) =>
              onDraftFiltersChange((prev) => ({
                ...prev,
                date_to: e.target.value || undefined,
              }))
            }
            className={cx(
              'w-full rounded-md border px-2 py-1 text-sm outline-none',
              isDark
                ? 'bg-gray-950 border-gray-700 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            )}
          />
        </div>

        <div className="w-[100px]">
          <div className={cx('text-xs mb-0.5', ui.textSecondary)}>Group</div>
          <select
            value={draftFilters.group_by ?? 'day'}
            onChange={(e) =>
              onDraftFiltersChange((prev) => ({
                ...prev,
                group_by: e.target.value as BillingRevenueDashboardFilters['group_by'],
              }))
            }
            className={cx(
              'w-full rounded-md border px-2 py-1 text-sm outline-none',
              isDark
                ? 'bg-gray-950 border-gray-700 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            )}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div className="w-[80px]">
          <div className={cx('text-xs mb-0.5', ui.textSecondary)}>Top</div>
          <select
            value={draftFilters.top ?? 10}
            onChange={(e) =>
              onDraftFiltersChange((prev) => ({
                ...prev,
                top: Number(e.target.value),
              }))
            }
            className={cx(
              'w-full rounded-md border px-2 py-1 text-sm outline-none',
              isDark
                ? 'bg-gray-950 border-gray-700 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            )}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onApplyFilters}
            type="button"
            className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Apply
          </button>

          <button
            onClick={onResetFilters}
            type="button"
            className={cx(
              'cursor-pointer rounded-md border px-3 py-1 text-sm font-medium transition',
              isDark
                ? 'border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingRevenueDashboardFiltersBar;
