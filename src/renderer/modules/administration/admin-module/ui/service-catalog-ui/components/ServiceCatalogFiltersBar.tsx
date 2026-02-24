// AdminServiceCatalog/components/ServiceCatalogFiltersBar.tsx
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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  CodeSystem,
  ServiceCategory,
  ServiceStatus,
} from '../../../api/service-catalog/serviceCatalogTypes';

// ─── helpers ─────────────────────────────────────────────────────────────────
const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type ViewMode = 'list' | 'grid';

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  theme: 'light' | 'dark';

  // Filter state (managed by parent)
  searchTerm: string;
  onSearchTermChange: (value: string) => void;

  categoryFilter: ServiceCategory | 'all';
  onCategoryFilterChange: (value: ServiceCategory | 'all') => void;

  codeSystemFilter: CodeSystem | 'all';
  onCodeSystemFilterChange: (value: CodeSystem | 'all') => void;

  statusFilter: ServiceStatus | 'all';
  onStatusFilterChange: (value: ServiceStatus | 'all') => void;

  effectiveDate: string;
  onEffectiveDateChange: (value: string) => void;

  showDeleted: boolean;
  onToggleShowDeleted: () => void;

  viewMode: ViewMode;
  onToggleViewMode: () => void;

  perPage: number;
  onPerPageChange: (value: number) => void;

  // select options
  serviceCategoryOptions: { value: ServiceCategory; label: string }[];
  codeSystemOptions: { value: CodeSystem; label: string }[];
  statusOptions: { value: ServiceStatus; label: string }[];
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

// ─── Main Component ───────────────────────────────────────────────────────────
export const ServiceCatalogFiltersBar: React.FC<Props> = ({
  theme,
  searchTerm,
  onSearchTermChange,
  categoryFilter,
  onCategoryFilterChange,
  codeSystemFilter,
  onCodeSystemFilterChange,
  statusFilter,
  onStatusFilterChange,
  effectiveDate,
  onEffectiveDateChange,
  showDeleted,
  onToggleShowDeleted,
  viewMode,
  onToggleViewMode,
  perPage,
  onPerPageChange,
  serviceCategoryOptions,
  codeSystemOptions,
  statusOptions,
}) => {
  const isDark = theme === 'dark';

  // local search – immediate feedback, but only update parent on submit or debounce
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>(null);

  // keep local in sync if parent resets externally
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Handle search with debounce (updates filter as user types)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for debounced update
    debounceTimerRef.current = setTimeout(() => {
      onSearchTermChange(value);
    }, 300); // 300ms debounce
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear any pending debounce and update immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearchTermChange(localSearch);
    }
    if (e.key === 'Escape') {
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearchTermChange('');
  };

  // ── count active advanced filters (so we can badge the toggle) ──
  const advancedActiveCount = [
    effectiveDate !== '',
    showDeleted,
  ].filter(Boolean).length;

  // ── count ALL active filters ──
  const totalActiveFilters = [
    searchTerm !== '',
    categoryFilter !== 'all',
    codeSystemFilter !== 'all',
    statusFilter !== 'all',
    advancedActiveCount > 0,
  ].filter(Boolean).length;

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
              placeholder="Search by name, code, description..."
              value={localSearch}
              onChange={handleSearchChange}
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
          onChange={(v) => onCategoryFilterChange(v as ServiceCategory | 'all')}
          options={serviceCategoryOptions}
          placeholder="All Categories"
          isDark={isDark}
        />

        {/* Code System */}
        <FilterSelect
          value={codeSystemFilter}
          onChange={(v) => onCodeSystemFilterChange(v as CodeSystem | 'all')}
          options={codeSystemOptions}
          placeholder="All Code Systems"
          isDark={isDark}
        />

        {/* Status */}
        <FilterSelect
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v as ServiceStatus | 'all')}
          options={statusOptions}
          placeholder="All Statuses"
          isDark={isDark}
        />

        {/* Items per page - now starting from 5 */}
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
            {[5, 10, 25, 50, 100].map((n) => ( // Changed to start from 5
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
              onCodeSystemFilterChange('all');
              onStatusFilterChange('all');
              onEffectiveDateChange('');
              if (showDeleted) onToggleShowDeleted();
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ServiceCatalogFiltersBar.displayName = 'ServiceCatalogFiltersBar';