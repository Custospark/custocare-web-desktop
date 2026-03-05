// search/SearchBar.tsx
import React, { useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../utils/classNameUtils';
import type { ThemeMode } from '../StatusBarTypes';
import { SearchModal } from './SearchModal';
import { useSearchKeyboard } from './hooks/useSearchKeyboard';

interface SearchBarProps {
  theme: ThemeMode;
  // Legacy props — accepted but ignored
  searchQuery?: string;
  isSearchFocused?: boolean;
  onSearchChange?: ((query: string) => void) | ((e: React.ChangeEvent<HTMLInputElement>) => void);
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  onClearSearch?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchBar: React.FC<SearchBarProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { isOpen, openSearch, closeSearch } = useSearchKeyboard();

  const handleTriggerClick = useCallback(() => {
    openSearch();
  }, [openSearch]);

  return (
    <>
      {/* Statusbar trigger - FULLY RESPONSIVE with original wording */}
      <div className="flex-1 min-w-0 max-w-full sm:max-w-lg mx-1 sm:mx-3">
        <motion.button
          type="button"
          onClick={handleTriggerClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          aria-label="Open global search (⌘K)"
          className={cn(
            'relative w-full flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5',
            'rounded-lg border text-xs sm:text-sm transition-all duration-200',
            'focus:outline-none focus-visible:ring-2',
            isOpen
              ? isDark
                ? 'border-cyan-500/40 ring-2 ring-cyan-500/20 bg-gray-800/70'
                : 'border-blue-500/40 ring-2 ring-blue-500/20 bg-white/70'
              : isDark
                ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/60 hover:bg-gray-800/70'
                : 'bg-white/50 border-gray-300/50 hover:border-gray-400/50 hover:bg-white/70',
            isDark
              ? 'focus-visible:ring-cyan-500/30'
              : 'focus-visible:ring-blue-500/30'
          )}
        >
          {/* Search icon - always visible */}
          <Search
            className={cn(
              'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors duration-200',
              isOpen
                ? isDark ? 'text-cyan-400' : 'text-blue-500'
                : isDark ? 'text-gray-500' : 'text-gray-400'
            )}
          />

          {/* Original wording for all screens - responsive truncation */}
          <span
            className={cn(
              'flex-1 text-left truncate',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}
          >
            Search for anything you need...
          </span>

          {/* ⌘K badge - adjust for mobile */}
          <div
            className={cn(
              'flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs shrink-0 border',
              isDark
                ? 'bg-gray-800/40 border-gray-700/50 text-gray-500'
                : 'bg-gray-100/40 border-gray-300/50 text-gray-500'
            )}
          >
            <Command className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">K</span>
          </div>
        </motion.button>
      </div>

      {/* Command-palette modal */}
      <SearchModal
        isOpen={isOpen}
        onClose={closeSearch}
        theme={theme}
      />
    </>
  );
};