// components/billing-review/components/TransactionListFilters.tsx
import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BILLING_CYCLE_STATUS_LABELS,
  BillingCycleStatus,
}  from '../../../../../api/billing-review/BillingReviewTypes';

interface FilterState {
  searchTerm: string;
  statusFilter: BillingCycleStatus | 'all';
  dateRange: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'patient';
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
}

interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
    stripe: string;
    stripeAlt: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  border: {
    primary: string;
    subtle: string;
  };
  ring: string;
  accent: {
    primary: string;
    hover: string;
    text: string;
  };
}

interface TransactionListFiltersProps {
  filters: FilterState;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const TransactionListFilters: React.FC<TransactionListFiltersProps> = ({
  filters,
  theme,
  colors,
  onUpdateFilter,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {filters.showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cx('pt-3 border-t overflow-hidden', colors.border.primary)}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.statusFilter}
                onChange={(e) => onUpdateFilter('statusFilter', e.target.value as BillingCycleStatus | 'all')}
                className={cx(
                  'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                )}
              >
                <option value="all">All Statuses</option>
                {Object.values(BillingCycleStatus).map((status) => (
                  <option key={status} value={status}>
                    {BILLING_CYCLE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <select
                  value={filters.sortBy}
                  onChange={(e) => onUpdateFilter('sortBy', e.target.value as 'date' | 'amount' | 'patient')}
                  className={cx(
                    'flex-1 text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                  )}
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="patient">Patient</option>
                </select>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onUpdateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={cx(
                    'p-1.5 rounded-lg border transition-all duration-200 cursor-pointer',
                    colors.border.primary,
                    isDark ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-50 text-gray-900'
                  )}
                  title={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                className={cx(
                  'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                )}
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                className={cx(
                  'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                )}
                placeholder="To"
              />
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClearFilters}
                className={cx(
                  'text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer',
                  colors.border.primary,
                  isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                )}
              >
                Clear Filters
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
