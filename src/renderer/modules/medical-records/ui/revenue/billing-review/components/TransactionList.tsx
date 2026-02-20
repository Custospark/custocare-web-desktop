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
  Check,
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

// Helper function to generate a truly unique key for each transaction
const getTransactionKey = (transaction: BillingReviewItem, index: number): string => {
  const parts = [
    transaction.visit_uuid,
    transaction.receipt_number || 'no-receipt',
    transaction.patient_id || 'no-patient',
    transaction.created_at,
    index.toString()
  ];
  return parts.join('_');
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Reorder transactions to put selected item at the top
  const orderedTransactions = useMemo(() => {
    if (!selectedId) return filteredTransactions;
    
    const selected = filteredTransactions.find(t => t.visit_uuid === selectedId);
    const others = filteredTransactions.filter(t => t.visit_uuid !== selectedId);
    
    return selected ? [selected, ...others] : filteredTransactions;
  }, [filteredTransactions, selectedId]);

  // Sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && headerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setIsHeaderSticky(scrollTop > 5);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll to top when selected item changes
  useEffect(() => {
    if (selectedId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [selectedId]);

  return (
    <div
      className={cx(
        'flex flex-col h-full w-full relative overflow-hidden rounded-xl border',
        colors.border.primary,
        colors.bg.elevated
      )}
    >
      {/* Sticky Header - Original Design */}
      <div
        ref={headerRef}
        className={cx(
          'flex-shrink-0 px-5 py-4 border-b transition-all duration-200 z-30',
          colors.border.primary,
          colors.bg.secondary,
          isHeaderSticky && 'shadow-md'
        )}
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
        }}
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

        {/* Beautiful Search Bar with Gradient Border - Original Design */}
        <div className="relative mb-3">
          <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 animate-gradient">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 rounded-lg"
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

            {/* Inner surface */}
            <div className="relative z-10 rounded-[6px] overflow-hidden bg-white dark:bg-gray-900">
              <Search
                className={cx(
                  'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-20',
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
                  'w-full pl-10 pr-10 py-2.5 text-sm transition-all duration-200',
                  'focus:outline-none',
                  colors.bg.primary,
                  colors.text.primary
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
                    'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 z-20',
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

        {/* Advanced Filters - Condensed */}
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
                    onChange={(e) => onUpdateFilter('statusFilter', e.target.value as PaymentStatus | 'all')}
                    className={cx(
                      'w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer',
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
      </div>

      {/* Scrollable Transaction List - Condensed Items */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scroll-smooth"
        style={{ scrollbarGutter: 'stable' }}
      >
        {orderedTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-48 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
              className={cx('p-3 rounded-xl mb-3', isDark ? 'bg-gray-800' : 'bg-gray-100')}
            >
              <FileText className={cx('w-8 h-8', colors.text.tertiary)} />
            </motion.div>
            <p className={cx('text-sm font-semibold text-center', colors.text.primary)}>
              No Transactions Found
            </p>
            <p className={cx('text-xs text-center mt-1', colors.text.secondary)}>
              Try adjusting your filters
            </p>
          </motion.div>
        ) : (
          <div className="p-2 space-y-1.5">
            <AnimatePresence>
              {orderedTransactions.map((t, index) => {
                const isSelected = selectedId === t.visit_uuid;
                const isFirst = index === 0 && isSelected;
                const uniqueKey = getTransactionKey(t, index);

                return (
                  <motion.div
                    key={uniqueKey}
                    layoutId={uniqueKey}
                    ref={isSelected ? selectedItemRef : null}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                    onClick={() => onSelectTransaction(t.visit_uuid)}
                    className={cx(
                      'p-3 border rounded-lg transition-all duration-200 cursor-pointer group relative',
                      colors.border.primary,
                      index % 2 === 0 ? colors.bg.stripe : colors.bg.stripeAlt,
                      isSelected
                        ? cx(
                            colors.bg.selected,
                            isDark ? 'border-blue-700' : 'border-blue-300',
                            'ring-2 ring-blue-500 ring-opacity-30',
                            'scale-[1.01] z-10'
                          )
                        : cx(colors.bg.hover, 'hover:border-blue-300 hover:shadow-sm')
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
                    {/* Selected indicator */}
             {isSelected && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"
                />
                
                {isFirst && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3.5 h-3.5 stroke-3" />
                  </motion.div>
                )}
              </>
            )}

                    {/* Top row: Receipt and Status */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Hash className={cx('w-3 h-3 shrink-0', colors.text.tertiary)} />
                        <span className={cx('text-xs font-mono font-medium truncate', colors.text.primary)}>
                          {t.receipt_number || 'DRAFT'}
                        </span>
                      </div>
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap',
                          getStatusPillClass(isDark, t.payment_status)
                        )}
                      >
                        {PAYMENT_STATUS_LABELS[t.payment_status]}
                      </span>
                    </div>

                    {/* Middle row: Patient and Date */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className={cx('w-3 h-3 shrink-0', colors.text.tertiary)} />
                        <span className={cx('text-xs font-medium truncate', colors.text.primary)}>
                          {t.patient_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Calendar className={cx('w-3 h-3', colors.text.tertiary)} />
                        <span className={cx('text-[10px]', colors.text.secondary)}>
                          {formatDisplayDate(t.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: Amount and Payment Methods */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        {formatCurrency(t.billing_data.grandTotal)}
                      </span>

                      <div className="flex items-center gap-1">
                        {t.payment_methods.slice(0, 2).map((pm: any, idx: number) => (
                          <motion.div
                            key={`${uniqueKey}-pm-${idx}`}
                            whileHover={{ scale: 1.1 }}
                            className={cx(
                              'p-1 rounded-md',
                              isDark ? 'bg-gray-700' : 'bg-gray-100'
                            )}
                            title={`${pm.type}: ${formatCurrency(pm.amount)}`}
                          >
                            <PaymentIcon type={pm.type} className="w-3 h-3" />
                          </motion.div>
                        ))}
                        {t.payment_methods.length > 2 && (
                          <span className={cx('text-[10px] font-medium px-1', colors.text.tertiary)}>
                            +{t.payment_methods.length - 2}
                          </span>
                        )}
                        <ChevronRight 
                          className={cx(
                            'w-3.5 h-3.5 ml-1',
                            colors.text.tertiary,
                            isSelected && 'text-blue-500'
                          )} 
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer - Original Font */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cx('flex-shrink-0 px-5 py-4 border-t', colors.border.primary, colors.bg.secondary)}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className={cx('w-4 h-4 shrink-0 mt-0.5', colors.text.tertiary)} />
          <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
            Selected payment record from the left will appear on the right for expanded view
          </p>
        </div>
      </motion.div>

      {/* Gradient Animation Styles */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
};