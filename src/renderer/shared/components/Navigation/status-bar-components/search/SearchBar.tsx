// search/SearchBar.tsx
import React, { useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../utils/classNameUtils';
import type { ThemeMode } from '../StatusBarTypes';
import { useSearchKeyboard } from './hooks/useSearchKeyboard';

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchBarProps {
  theme: ThemeMode;
  // Legacy props — accepted but ignored (StatusBar still passes them)
  searchQuery?: string;
  isSearchFocused?: boolean;
  onSearchChange?: ((query: string) => void) | ((e: React.ChangeEvent<HTMLInputElement>) => void);
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  onClearSearch?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * SearchBar — status-bar trigger button with sharp animated border.
 *
 * This component is intentionally a thin trigger. It reads `isOpen` from the
 * shared singleton in useSearchKeyboard so the active-state ring stays in sync
 * even when the modal was opened via ⌘K rather than a button click.
 *
 * The <SearchModal> itself is rendered from Layout.tsx (always mounted) so it
 * continues to function even when the StatusBar / this button are hidden.
 */
export const SearchBar: React.FC<SearchBarProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  // Reads from the module-level singleton — in sync with Layout's modal.
  const { isOpen, openSearch } = useSearchKeyboard();

  const handleTriggerClick = useCallback(() => {
    openSearch();
  }, [openSearch]);

  // Detect if user is on Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="flex-1 min-w-0 max-w-full sm:max-w-lg mx-1 sm:mx-3">
      <div className="relative">
        {/* Sharp animated gradient border - always visible */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #2563eb, #059669, #7c3aed, #2563eb)',
            backgroundSize: '300% 100%',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Main button with cursor pointer */}
        <motion.button
          type="button"
          onClick={handleTriggerClick}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          aria-label="Open global search (⌘K)"
          className={cn(
            'relative w-full flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5',
            'rounded-lg text-xs sm:text-sm transition-all duration-200',
            'focus:outline-none focus-visible:ring-2',
            'cursor-pointer', // Explicit cursor pointer
            
            // Clean background - slightly transparent
            isDark
              ? 'bg-gray-800/70 hover:bg-gray-800/90'
              : 'bg-white/70 hover:bg-white/90',
            
            // Focus ring with sharper colors
            isDark
              ? 'focus-visible:ring-cyan-500/40'
              : 'focus-visible:ring-blue-500/40',
            
            // Subtle inner shadow for depth
            'shadow-inner',
            
            // Z-index to stay above the gradient border
            'z-10'
          )}
        >
          {/* Search icon - sharper colors when open */}
          <Search
            className={cn(
              'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors duration-200',
              isOpen
                ? isDark ? 'text-cyan-400' : 'text-blue-600'
                : isDark ? 'text-gray-500' : 'text-gray-400'
            )}
          />

          {/* Original placeholder text with keyboard shortcut hint */}
          <span className={cn('flex-1 text-left truncate', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Search for anything you need... {isMac ? '⌘K' : 'Ctrl+K'}
          </span>

          {/* ⌘K badge - hidden now since we show the shortcut in text */}
          <div
            className={cn(
              'flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs shrink-0',
              isDark
                ? 'text-gray-500'
                : 'text-gray-500',
              'sm:flex' // Keep it in the DOM but maybe make it less prominent
            )}
          >
            <Command className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">K</span>
          </div>
        </motion.button>
      </div>

      {/*
       * ⚠️  SearchModal has been intentionally removed from here.
       *
       * It is now rendered once in Layout.tsx (always mounted, never gated on
       * topBarsVisible). This guarantees ⌘K works even when the StatusBar —
       * and therefore this component — is not in the DOM.
       */}
    </div>
  );
};