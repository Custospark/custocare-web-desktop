// components/TransactionList.tsx
// Left panel - displays filtered transaction records with search and filters

import React from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { DerivedStatus, FilterState, MockTransaction, ThemeColors } from '../types';
import { cx, deriveStatus, formatCurrency, formatDisplayDate, paymentIcon, statusLabel, statusPillClass } from '../utils';

interface TransactionListProps {
  transactions: MockTransaction[];
  filteredTransactions: MockTransaction[];
  selectedId: number | null;
  filters: FilterState;
  searchTerm: string;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  pillBg: string;
  onSelectTransaction: (id: number) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  filteredTransactions,
  selectedId,
  filters,
  searchTerm,
  theme,
  colors,
  pillBg,
  onSelectTransaction,
  onUpdateFilter,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={cx(
        'flex flex-col h-full min-h-0 border rounded-lg shadow-sm overflow-hidden',
        colors.border.primary,
        colors.bg.elevated
      )}
    >
      {/* Header */}
      <div className={cx('flex-shrink-0 px-4 py-3 border-b', colors.border.primary, colors.bg.secondary)}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className={cx('text-sm sm:text-base font-extrabold', colors.text.primary)}>
              Visit Records
            </h3>
            <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
              Search receipts, patients, services, references.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onUpdateFilter('showAdvancedFilters', !filters.showAdvancedFilters)}
              className={cx(
                'cursor-pointer p-2 rounded-lg transition',
                isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'
              )}
              title="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <span className={cx('text-xs px-2 py-1 rounded-full', colors.text.secondary, pillBg)}>
              {filteredTransactions.length} txns
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', colors.text.tertiary)} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
            placeholder="Search by receipt, patient, service, ref..."
            className={cx(
              'w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none',
              colors.border.primary,
              isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
              colors.ring
            )}
          />
        </div>

        {/* Advanced Filters */}
        {filters.showAdvancedFilters && (
          <div className={cx('pt-3 border-t', colors.border.primary)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <Filter className={cx('w-4 h-4', colors.text.tertiary)} />
                  <select
                    value={filters.statusFilter}
                    onChange={(e) => onUpdateFilter('statusFilter', e.target.value as DerivedStatus | 'all')}
                    className={cx(
                      'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                      colors.border.primary,
                      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                      colors.ring
                    )}
                  >
                    <option value="all">All</option>
                    <option value="settled">Settled</option>
                    <option value="ready">Ready</option>
                    <option value="draft">Draft</option>
                    <option value="partially_refunded">Partially Refunded</option>
                    <option value="refunded">Refunded</option>
                    <option value="voided">Voided</option>
                  </select>
                </div>
              </label>

              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Sort</span>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => onUpdateFilter('sortBy', e.target.value as 'date' | 'amount' | 'patient')}
                    className={cx(
                      'flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none',
                      colors.border.primary,
                      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                      colors.ring
                    )}
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="patient">Patient</option>
                  </select>
                  <button
                    onClick={() => onUpdateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className={cx(
                      'cursor-pointer p-2 rounded-lg border transition',
                      colors.border.primary,
                      isDark ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-50 text-gray-900'
                    )}
                    title="Toggle sort order"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </label>

              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>From</span>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className={cx(
                    'mt-1 w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                />
              </label>

              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>To</span>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className={cx(
                    'mt-1 w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                />
              </label>

              <div className="sm:col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={onClearFilters}
                  className={cx(
                    'cursor-pointer text-xs font-extrabold px-3 py-2 rounded-lg border transition',
                    colors.border.primary,
                    isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarGutter: 'stable' }}>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-4">
            <FileText className={cx('w-12 h-12 mb-3', colors.text.tertiary)} />
            <p className={cx('text-sm text-center', colors.text.secondary)}>No transactions found</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredTransactions.map((t) => {
              const derived = deriveStatus(t);
              const isSelected = selectedId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTransaction(t.id)}
                  className={cx(
                    'cursor-pointer p-3 border rounded-lg transition-all duration-200',
                    colors.border.primary,
                    isSelected
                      ? cx(colors.bg.selected, 'border-blue-300', isDark && 'border-blue-700', 'shadow-md')
                      : cx(colors.bg.hover, 'hover:shadow-sm')
                  )}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cx('text-xs font-mono font-extrabold', colors.text.primary)}>
                          {t.receipt_number}
                        </span>
                        <span
                          className={cx(
                            'px-2 py-0.5 rounded-full text-xs font-extrabold',
                            statusPillClass(isDark, derived)
                          )}
                        >
                          {statusLabel(derived)}
                        </span>
                      </div>
                      <h4 className={cx('text-sm font-extrabold truncate', colors.text.primary)}>
                        {t.patient.name}
                      </h4>
                      <p className={cx('text-xs', colors.text.secondary)}>{t.patient.patient_number}</p>
                    </div>
                    <ChevronRight className={cx('w-5 h-5 flex-shrink-0', colors.text.tertiary)} />
                  </div>

                  <div className="flex items-center gap-3 text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                      <span className={colors.text.secondary}>{formatDisplayDate(t.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                      <span className={colors.text.secondary}>{t.time}</span>
                    </div>
                  </div>

                  <div className={cx('flex items-center justify-between mt-2 pt-2 border-t', colors.border.primary)}>
                    <span className={cx('text-sm font-extrabold', colors.text.primary)}>
                      {formatCurrency(t.billing_data.grandTotal)}
                    </span>

                    <div className="flex items-center gap-1">
                      {t.payment_methods.map((pm) => (
                        <div
                          key={pm.id}
                          className="flex items-center"
                          title={`${pm.type}: ${formatCurrency(pm.amount)}${
                            pm.reference ? ` • ${pm.reference}` : ''
                          }`}
                        >
                          {paymentIcon(pm.type)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cx('flex-shrink-0 px-4 py-3 border-t', colors.border.primary, colors.bg.secondary)}>
        <div className="flex items-start gap-2">
          <AlertCircle className={cx('w-4 h-4 flex-shrink-0 mt-0.5', colors.text.tertiary)} />
          <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
            Refunds are item-based and quantity-based — you can partially refund by reducing quantities.
          </p>
        </div>
      </div>
    </div>
  );
};