// components/billing-review/components/TransactionList.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaymentStatus,
  type BillingReviewItem,
} from '../../../../api/billing-review/BillingReviewTypes';
import { TransactionListItem } from './transaction-list/TransactionListItem';
import { TransactionListHeader } from './transaction-list/TransactionListHeader';
import { TransactionListFilters } from './transaction-list/TransactionListFilters';
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
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
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

  const handleToggleFilters = () => {
    onUpdateFilter('showAdvancedFilters', !filters.showAdvancedFilters);
  };

  const handleSearchChange = (value: string) => {
    onUpdateFilter('searchTerm', value);
  };

  return (
    <div
      className={cx(
        'flex flex-col h-full w-full relative overflow-hidden rounded-xl border',
        colors.border.primary,
        colors.bg.elevated
      )}
    >
      {/* Header Component */}
      <div ref={headerRef}>
        <TransactionListHeader
          searchTerm={searchTerm}
          showAdvancedFilters={filters.showAdvancedFilters}
          filteredCount={filteredTransactions.length}
          isHeaderSticky={isHeaderSticky}
          isRefreshing={isRefreshing}
          theme={theme}
          colors={colors}
          pillBg={pillBg}
          onSearchChange={handleSearchChange}
          onToggleFilters={handleToggleFilters}
          onRefresh={onRefresh}
        />

        {/* Filters Component */}
        <div className="px-5">
          <TransactionListFilters
            filters={filters}
            theme={theme}
            colors={colors}
            onUpdateFilter={onUpdateFilter}
            onClearFilters={onClearFilters}
          />
        </div>
      </div>

      {/* Scrollable Transaction List */}
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
                  <TransactionListItem
                    key={uniqueKey}
                    transaction={t}
                    index={index}
                    isSelected={isSelected}
                    isFirst={isFirst}
                    uniqueKey={uniqueKey}
                    theme={theme}
                    colors={colors}
                    onSelect={onSelectTransaction}
                    selectedItemRef={isSelected ? selectedItemRef : undefined}
                  />
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
        className={cx('flex-shrink-0 px-5 py-4 border-t', colors.border.primary, colors.bg.secondary)}
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className={cx('w-4 h-4 shrink-0 mt-0.5', colors.text.tertiary)} />
          <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
            Selected payment record from the left will appear on the right for expanded view
          </p>
        </div>
      </motion.div>
    </div>
  );
};
