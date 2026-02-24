// src/administration/admin-module/inventory-items/components/InventoryItemFiltersBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  ItemCategory,
  ControlledSubstanceSchedule,
  ItemStatus,
} from '../../../api/admin-inventory/inventoryItemTypes';

// ─── helpers ─────────────────────────────────────────────────────────────────
const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type ViewMode = 'list' | 'grid';

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  theme: 'light' | 'dark';

  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearchSubmit: () => void;

  categoryFilter: ItemCategory | 'all';
  onCategoryFilterChange: (value: ItemCategory | 'all') => void;

  statusFilter: ItemStatus | 'all';
  onStatusFilterChange: (value: ItemStatus | 'all') => void;

  controlledSubstanceFilter: ControlledSubstanceSchedule | 'all' | 'non_controlled';
  onControlledSubstanceFilterChange: (
    value: ControlledSubstanceSchedule | 'all' | 'non_controlled'
  ) => void;

  effectiveDate: string;
  onEffectiveDateChange: (value: string) => void;

  showDeleted: boolean;
  onToggleShowDeleted: () => void;

  viewMode: ViewMode;
  onToggleViewMode: () => void;

  perPage: number;
  onPerPageChange: (value: number) => void;

  requiresRefrigerationFilter: boolean | 'all';
  onRequiresRefrigerationChange: (value: boolean | 'all') => void;

  requiresPrescriptionFilter: boolean | 'all';
  onRequiresPrescriptionChange: (value: boolean | 'all') => void;

  isHazardousFilter: boolean | 'all';
  onIsHazardousChange: (value: boolean | 'all') => void;

  // select options
  itemCategoryOptions: { value: ItemCategory; label: string }[];
  statusOptions: { value: ItemStatus; label: string }[];
  controlledSubstanceOptions: {
    value: ControlledSubstanceSchedule | 'non_controlled';
    label: string;
  }[];
}

// ─── tiny reusable select ────────────────────────────────────────────────────
interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  isDark: boolean;
}
const FilterSelect: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  isDark,
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'transition-colors',
        isDark
          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
          : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
      )}
    >
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown
      className={cn(
        'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
        isDark ? 'text-gray-400' : 'text-gray-500'
      )}
    />
  </div>
);

// ─── tri-state toggle (all | true | false) ───────────────────────────────────
interface TriToggleProps {
  value: boolean | 'all';
  onChange: (v: boolean | 'all') => void;
  label: string;
  icon: React.ElementType;
  isDark: boolean;
  activeColor?: string; // e.g. 'blue' | 'red' | 'purple'
}
const TriToggle: React.FC<TriToggleProps> = ({
  value,
  onChange,
  label,
  icon: Icon,
  isDark,
  activeColor = 'blue',
}) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white',
    red: isDark
      ? 'bg-red-900/50 text-red-300 border border-red-700'
      : 'bg-red-100 text-red-700 border border-red-300',
    purple: isDark
      ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
      : 'bg-purple-100 text-purple-700 border border-purple-300',
    green: isDark
      ? 'bg-green-900/50 text-green-300 border border-green-700'
      : 'bg-green-100 text-green-700 border border-green-300',
  };

  const base = cn(
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
    'border transition-all cursor-pointer select-none'
  );
  const inactive = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';

  const cycle = () => {
    if (value === 'all') onChange(true);
    else if (value === true) onChange(false);
    else onChange('all');
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(base, value === 'all' ? inactive : colorMap[activeColor] ?? colorMap.blue)}
    >
      <Icon className="w-3 h-3" />
      {label}
      {value === true && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
      {value === false && <XCircle className="w-3 h-3 ml-0.5" />}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const InventoryItemFiltersBar: React.FC<Props> = ({
  theme,
  searchTerm,
  onSearchTermChange,
  onSearchSubmit,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  controlledSubstanceFilter,
  onControlledSubstanceFilterChange,
  effectiveDate,
  onEffectiveDateChange,
  showDeleted,
  onToggleShowDeleted,
  viewMode,
  onToggleViewMode,
  perPage,
  onPerPageChange,
  requiresRefrigerationFilter,
  onRequiresRefrigerationChange,
  requiresPrescriptionFilter,
  onRequiresPrescriptionChange,
  isHazardousFilter,
  onIsHazardousChange,
  itemCategoryOptions,
  statusOptions,
  controlledSubstanceOptions,
}) => {
  const isDark = theme === 'dark';

  // local search – submit on Enter or button click, not on every keystroke
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep local in sync if parent resets externally
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const submitSearch = (value: string = localSearch) => {
    onSearchTermChange(value);
    onSearchSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch();
    if (e.key === 'Escape') {
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    submitSearch('');
    onSearchTermChange('');
  };

  // ── count active advanced filters (so we can badge the toggle) ──
  const advancedActiveCount = [
    controlledSubstanceFilter !== 'all',
    requiresRefrigerationFilter !== 'all',
    requiresPrescriptionFilter !== 'all',
    isHazardousFilter !== 'all',
    showDeleted,
    !!effectiveDate,
  ].filter(Boolean).length;

  // ── count ALL active filters ──
  const totalActiveFilters = [
    searchTerm !== '',
    categoryFilter !== 'all',
    statusFilter !== 'all',
    advancedActiveCount > 0,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        'rounded-xl border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}
    >
      {/* ── Primary bar ───────────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">

        {/* ── Animated-border search ──────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0">
          {/* gradient border track */}
          <motion.div
            className="absolute inset-0 rounded-lg z-0"
            style={{
              background:
                'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{
              duration: isFocused ? 2 : 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* inner surface with 2-px gap to reveal gradient */}
          <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                isFocused ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-gray-400'
              )}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by item name, code, generic name, NDC..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                'w-full pl-9 pr-10 py-2.5 text-sm border-transparent',
                'focus:outline-none focus:ring-0',
                'transition-colors placeholder:text-sm',
                isDark
                  ? 'bg-gray-900 text-white placeholder-gray-500'
                  : 'bg-white text-gray-900 placeholder-gray-400'
              )}
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className={cn(
                  'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full',
                  'transition-colors cursor-pointer',
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Right controls ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search submit button */}
          <button
            type="button"
            onClick={() => submitSearch()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            Search
          </button>

          {/* Advanced filters toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium',
              'border transition-colors cursor-pointer',
              showAdvanced
                ? isDark
                  ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                  : 'bg-blue-50 border-blue-300 text-blue-700'
                : isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            )}
            aria-label="Toggle advanced filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Filters</span>
            {advancedActiveCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
                {advancedActiveCount}
              </span>
            )}
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* View mode toggle */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium',
              'border transition-colors cursor-pointer',
              isDark
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            )}
            aria-label={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
            title={viewMode === 'list' ? 'Grid view' : 'List view'}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Quick inline filters ─────────────────────────────────────────────── */}
      <div className={cn('px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2',
        isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'
      )}>
        <span className={cn('text-xs font-medium mr-1', isDark ? 'text-gray-500' : 'text-gray-400')}>
          Quick:
        </span>

        {/* Category */}
        <FilterSelect
          value={categoryFilter}
          onChange={(v) => onCategoryFilterChange(v as ItemCategory | 'all')}
          options={itemCategoryOptions}
          placeholder="All Categories"
          isDark={isDark}
        />

        {/* Status */}
        <FilterSelect
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v as ItemStatus | 'all')}
          options={statusOptions}
          placeholder="All Statuses"
          isDark={isDark}
        />

        {/* Items per page */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Per page:
          </span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className={cn(
              'appearance-none pl-2 pr-6 py-1.5 rounded-lg border text-xs cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Active filter chips */}
        {totalActiveFilters > 0 && (
          <button
            type="button"
            onClick={() => {
              clearSearch();
              onCategoryFilterChange('all');
              onStatusFilterChange('all');
              onControlledSubstanceFilterChange('all');
              onRequiresRefrigerationChange('all');
              onRequiresPrescriptionChange('all');
              onIsHazardousChange('all');
              if (showDeleted) onToggleShowDeleted();
              onEffectiveDateChange('');
            }}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
              isDark
                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            )}
          >
            Clear all ({totalActiveFilters})
          </button>
        )}
      </div>

      {/* ── Advanced filters panel ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showAdvanced && (
          <motion.div
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'px-3 sm:px-4 pb-4 pt-3',
                isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'
              )}
            >
              <div className="flex flex-wrap gap-3">
                {/* Controlled substance */}
                <FilterSelect
                  value={controlledSubstanceFilter}
                  onChange={(v) =>
                    onControlledSubstanceFilterChange(
                      v as ControlledSubstanceSchedule | 'all' | 'non_controlled'
                    )
                  }
                  options={controlledSubstanceOptions}
                  placeholder="All Schedules"
                  isDark={isDark}
                />

                {/* Effective date */}
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    Effective:
                  </span>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => onEffectiveDateChange(e.target.value)}
                    className={cn(
                      'pl-2 pr-2 py-1.5 rounded-lg border text-xs cursor-pointer',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    )}
                  />
                  {effectiveDate && (
                    <button
                      type="button"
                      onClick={() => onEffectiveDateChange('')}
                      className={cn(
                        'p-1 rounded cursor-pointer',
                        isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                      )}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tri-state boolean toggles */}
                <div className="flex flex-wrap gap-2 items-center">
                  <TriToggle
                    value={requiresRefrigerationFilter}
                    onChange={onRequiresRefrigerationChange}
                    label="Refrigeration"
                    icon={Thermometer}
                    isDark={isDark}
                    activeColor="blue"
                  />
                  <TriToggle
                    value={requiresPrescriptionFilter}
                    onChange={onRequiresPrescriptionChange}
                    label="Prescription"
                    icon={Shield}
                    isDark={isDark}
                    activeColor="purple"
                  />
                  <TriToggle
                    value={isHazardousFilter}
                    onChange={onIsHazardousChange}
                    label="Hazardous"
                    icon={AlertTriangle}
                    isDark={isDark}
                    activeColor="red"
                  />
                </div>

                {/* Show deleted toggle */}
                <button
                  type="button"
                  onClick={onToggleShowDeleted}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                    'border transition-all cursor-pointer select-none',
                    showDeleted
                      ? isDark
                        ? 'bg-amber-900/40 border-amber-700 text-amber-300'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {showDeleted ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  Show Deleted
                </button>
              </div>

              {/* Tri-state legend */}
              <p className={cn('mt-2.5 text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>
                Tap a flag once → show only items WITH it. Tap again → show only items WITHOUT it. Tap again → clear.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

InventoryItemFiltersBar.displayName = 'InventoryItemFiltersBar';
