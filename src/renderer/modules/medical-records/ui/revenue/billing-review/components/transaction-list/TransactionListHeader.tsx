// components/billing-review/components/TransactionListHeader.tsx
import React, { useRef, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

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

interface TransactionListHeaderProps {
  searchTerm: string;
  showAdvancedFilters: boolean;
  filteredCount: number;
  isHeaderSticky: boolean;
  isRefreshing: boolean;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  pillBg: string;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const TransactionListHeader: React.FC<TransactionListHeaderProps> = ({
  searchTerm,
  showAdvancedFilters,
  filteredCount,
  isHeaderSticky,
  isRefreshing,
  theme,
  colors,
  pillBg,
  onSearchChange,
  onToggleFilters,
  onRefresh,
}) => {
  const isDark = theme === 'dark';
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cx(
        'shrink-0 px-5 py-4 border-b transition-all duration-200 z-30',
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
            <span className="bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
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
            onClick={onToggleFilters}
            className={cx(
              'p-2.5 rounded-lg transition-all duration-200 relative cursor-pointer',
              showAdvancedFilters
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
            animate={{ scale: filteredCount > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={cx('text-xs font-bold px-3 py-1.5 rounded-full', colors.text.secondary, pillBg)}
          >
            {filteredCount}
          </motion.span>
        </div>
      </div>

      {/* Beautiful Search Bar with Gradient Border */}
      <div className="relative mb-3">
        <div className="relative rounded-lg p-[2px] bg-linear-to-r from-blue-600 via-emerald-600 to-blue-600 animate-linear">
          {/* Animated linear background */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-linear(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
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
              onChange={(e) => onSearchChange(e.target.value)}
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
                  onSearchChange('');
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

      {/* Gradient Animation Styles */}
      <style>{`
        @keyframes linear {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-linear {
          animation: linear 3s ease infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
};
