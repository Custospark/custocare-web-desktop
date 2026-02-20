// components/billing-review/components/TransactionList.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  User,
  X,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaymentStatus, 
  PAYMENT_STATUS_LABELS, 
  PAYMENT_STATUS_BADGE_VARIANTS, 
  formatCurrency,
  type BillingReviewItem,
} from '../../../../api/billing-review/BillingReviewTypes';

interface FilterState {
  searchTerm: string;
  statusFilter: PaymentStatus | 'all';
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

interface TransactionListProps {
  transactions: BillingReviewItem[];
  filteredTransactions: BillingReviewItem[];
  selectedId: string | null;
  filters: FilterState;
  searchTerm: string;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  pillBg: string;
  onSelectTransaction: (id: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getStatusPillClass = (isDark: boolean, status: PaymentStatus) => {
  const variant = PAYMENT_STATUS_BADGE_VARIANTS[status] || 'default';
  const variants = {
    success: isDark 
      ? 'bg-green-900/30 text-green-300 border-green-700' 
      : 'bg-green-100 text-green-800 border-green-200',
    warning: isDark 
      ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700' 
      : 'bg-red-100 text-red-800 border-red-200',
    info: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700' 
      : 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
    default: isDark 
      ? 'bg-gray-700 text-gray-300 border-gray-600' 
      : 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return `${variants[variant] || variants.default} border`;
};

const PaymentIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  const icons: Record<string, React.FC<any>> = {
    cash: Banknote,
    card: CreditCard,
    insurance: Building2,
    mobile: Smartphone,
    bank_transfer: Building2,
    cheque: FileText,
  };
  const IconComponent = icons[type] || Banknote;
  return <IconComponent className={className} />;
};

const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
  onRefresh,
  isRefreshing = false,
}) => {
  const isDark = theme === 'dark';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Reorder transactions to put selected item at the top
  const orderedTransactions = useMemo(() => {
    if (!selectedId) return filteredTransactions;
    
    const selected = filteredTransactions.find(t => t.visit_uuid === selectedId);
    const others = filteredTransactions.filter(t => t.visit_uuid !== selectedId);
    
    // Put selected at the top if found
    return selected ? [selected, ...others] : filteredTransactions;
  }, [filteredTransactions, selectedId]);

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setIsHeaderSticky(scrollTop > 20);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll to top when selected item changes
  useEffect(() => {
    if (selectedId && containerRef.current && !hasScrolled) {
      // Scroll to the top of the container
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Mark that we've scrolled
      setHasScrolled(true);
      
      // Reset after animation completes
      const timer = setTimeout(() => {
        setHasScrolled(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedId, orderedTransactions]);

  // Highlight the selected item with a subtle animation when it becomes selected
  useEffect(() => {
    if (selectedId && selectedItemRef.current) {
      // Add a highlight animation class
      selectedItemRef.current.classList.add('ring-4', 'ring-blue-300', 'ring-opacity-50');
      
      // Remove after animation
      const timer = setTimeout(() => {
        if (selectedItemRef.current) {
          selectedItemRef.current.classList.remove('ring-4', 'ring-blue-300', 'ring-opacity-50');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  return (
    <div
      className={cx(
        'flex flex-col h-full min-h-0 border rounded-xl shadow-sm overflow-hidden w-full relative',
        colors.border.primary,
        colors.bg.elevated
      )}
    >
      {/* Sticky Header with backdrop blur */}
      <div
        className={cx(
          'shrink-0 px-5 py-4 border-b transition-all duration-200 z-20',
          colors.border.primary,
          colors.bg.secondary,
          isHeaderSticky && 'sticky top-0 bg-opacity-95 backdrop-blur-sm'
        )}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className={cx('text-base font-bold', colors.text.primary)}>
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Payment Records
              </span>
            </h3>
            <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
              Search receipts, patients, services, and references
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cx(
                'p-2.5 rounded-lg transition-all duration-200 relative cursor-pointer',
                isDark
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700',
                isRefreshing && 'cursor-not-allowed opacity-50'
              )}
              title="Refresh data"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            </motion.button>

            {/* Filters Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateFilter('showAdvancedFilters', !filters.showAdvancedFilters)}
              className={cx(
                'p-2.5 rounded-lg transition-all duration-200 relative cursor-pointer',
                filters.showAdvancedFilters
                  ? isDark
                    ? 'bg-blue-900/30 text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                  : isDark
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
              title="Toggle filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </motion.button>

            {/* Count Badge */}
            <motion.span 
              initial={{ scale: 1 }}
              animate={{ scale: filteredTransactions.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={cx('text-xs font-bold px-3 py-1.5 rounded-full', colors.text.secondary, pillBg)}
            >
              {filteredTransactions.length}
            </motion.span>
          </div>
        </div>

        {/* Animated Search with gradient border */}
        <div className="relative mb-3">
          <div className={`relative rounded-lg ${!isHeaderSticky ? 'p-[2px]' : ''}`}>
            {/* Gradient border track */}
            {!isHeaderSticky && (
              <motion.div
                className="absolute inset-0 rounded-lg z-0"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                  backgroundSize: '300% 100%',
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{
                  duration: isSearchFocused ? 2 : 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}

            {/* Inner surface */}
            <div className="relative z-10">
              <div className={`relative ${!isHeaderSticky ? 'rounded-[6px] overflow-hidden' : ''}`}>
                <Search
                  className={cx(
                    'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                    isSearchFocused ? 'text-blue-500' : colors.text.tertiary
                  )}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search by receipt, patient, service, ref..."
                  className={cx(
                    'w-full pl-10 pr-10 py-2.5 text-sm transition-all duration-200 cursor-text',
                    'focus:outline-none',
                    !isHeaderSticky
                      ? `border-transparent ${colors.bg.primary} ${colors.text.primary} rounded-[6px]`
                      : `border rounded-lg ${colors.border.primary} ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`
                  )}
                />
                
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateFilter('searchTerm', '');
                      searchInputRef.current?.focus();
                    }}
                    className={cx(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-1.5',
                      isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
                      'cursor-pointer rounded-full transition-colors'
                    )}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters with animation */}
        <AnimatePresence>
          {filters.showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={cx('pt-4 border-t overflow-hidden', colors.border.primary)}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className={cx('text-xs font-bold mb-2 flex items-center gap-2', colors.text.secondary)}>
                      <Filter className="w-3.5 h-3.5" />
                      Payment Status
                    </span>
                    <select
                      value={filters.statusFilter}
                      onChange={(e) => onUpdateFilter('statusFilter', e.target.value as PaymentStatus | 'all')}
                      className={cx(
                        'w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    >
                      <option value="all">All Statuses</option>
                      {Object.values(PaymentStatus).map((status) => (
                        <option key={status} value={status}>
                          {PAYMENT_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-bold mb-2 block', colors.text.secondary)}>
                      Sort By
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={filters.sortBy}
                        onChange={(e) => onUpdateFilter('sortBy', e.target.value as 'date' | 'amount' | 'patient')}
                        className={cx(
                          'flex-1 text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
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
                          'p-2.5 rounded-lg border transition-all duration-200 cursor-pointer',
                          colors.border.primary,
                          isDark ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-50 text-gray-900'
                        )}
                        title={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-bold mb-2 flex items-center gap-2', colors.text.secondary)}>
                      <Calendar className="w-3.5 h-3.5" />
                      Date From
                    </span>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                      className={cx(
                        'w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-bold mb-2 flex items-center gap-2', colors.text.secondary)}>
                      <Calendar className="w-3.5 h-3.5" />
                      Date To
                    </span>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => onUpdateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                      className={cx(
                        'w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    />
                  </label>

                  <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClearFilters}
                      className={cx(
                        'text-xs font-bold px-4 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer',
                        colors.border.primary,
                        isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      Clear All Filters
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {orderedTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-64 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
              className={cx('p-4 rounded-xl mb-4', isDark ? 'bg-gray-800' : 'bg-gray-100')}
            >
              <FileText className={cx('w-12 h-12', colors.text.tertiary)} />
            </motion.div>
            <p className={cx('text-sm font-semibold text-center', colors.text.primary)}>
              No Transactions Found
            </p>
            <p className={cx('text-xs text-center mt-1', colors.text.secondary)}>
              Try adjusting your filters or search terms
            </p>
          </motion.div>
        ) : (
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {orderedTransactions.map((t, index) => {
                const isSelected = selectedId === t.visit_uuid;
                const isFirst = index === 0;

                return (
                  <motion.div
                    key={t.visit_uuid}
                    layout
                    ref={isSelected ? selectedItemRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => onSelectTransaction(t.visit_uuid)}
                    className={cx(
                      'p-4 border rounded-xl transition-all duration-200 cursor-pointer group relative',
                      colors.border.primary,
                      index % 2 === 0 ? colors.bg.stripe : colors.bg.stripeAlt,
                      isSelected
                        ? cx(
                            colors.bg.selected,
                            isDark ? 'border-blue-700 shadow-lg' : 'border-blue-300 shadow-md',
                            'ring-2 ring-blue-500 ring-opacity-20',
                            'scale-[1.02] relative z-10'
                          )
                        : cx(colors.bg.hover, 'hover:shadow-sm hover:scale-[1.02]')
                    )}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTransaction(t.visit_uuid);
                      }
                    }}
                  >
                    {/* Selected item visual indicator - blue bar */}
                    {isSelected && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50"
                        />
                        
                        {/* Top indicator for first item (selected) */}
                        {isFirst && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-lg"
                          >
                            Selected
                          </motion.div>
                        )}
                      </>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={cx('text-xs font-mono font-bold flex items-center gap-1', colors.text.primary)}>
                            <Hash className="w-3 h-3" />
                            {t.receipt_number || 'DRAFT'}
                          </span>
                          <span
                            className={cx(
                              'px-2.5 py-1 rounded-full text-xs font-bold',
                              getStatusPillClass(isDark, t.payment_status)
                            )}
                          >
                            {PAYMENT_STATUS_LABELS[t.payment_status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className={cx('w-4 h-4', colors.text.tertiary)} />
                          <h4 className={cx('text-sm font-bold truncate', colors.text.primary)}>
                            {t.patient_name}
                          </h4>
                        </div>
                        <p className={cx('text-xs', colors.text.secondary)}>{t.patient_number}</p>
                      </div>
                      <motion.div
                        animate={{ x: isSelected ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight 
                          className={cx(
                            'w-5 h-5 shrink-0 transition-transform duration-200',
                            colors.text.tertiary,
                            isSelected && 'transform translate-x-1'
                          )} 
                        />
                      </motion.div>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                        <span className={colors.text.secondary}>{formatDisplayDate(t.created_at)}</span>
                      </div>
                    </div>

                    <div className={cx('flex items-center justify-between pt-3 border-t', colors.border.subtle)}>
                      <span className="text-base font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(t.billing_data.grandTotal)}
                      </span>

                      <div className="flex items-center gap-2">
                        {t.payment_methods.slice(0, 3).map((pm: any, index: number) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.1 }}
                            className={cx(
                              'p-1.5 rounded-lg',
                              isDark ? 'bg-gray-700' : 'bg-gray-100'
                            )}
                            title={`${pm.type}: ${formatCurrency(pm.amount)}`}
                          >
                            <PaymentIcon type={pm.type} className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                          </motion.div>
                        ))}
                        {t.payment_methods.length > 3 && (
                          <span className={cx('text-xs font-semibold', colors.text.tertiary)}>
                            +{t.payment_methods.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cx('shrink-0 px-5 py-4 border-t', colors.border.primary, colors.bg.secondary)}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className={cx('w-4 h-4 shrink-0 mt-0.5', colors.text.tertiary)} />
          <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
            Refunds are item-based and quantity-based. You can partially refund by reducing quantities
            of individual items.
          </p>
        </div>
      </motion.div>
    </div>
  );
};