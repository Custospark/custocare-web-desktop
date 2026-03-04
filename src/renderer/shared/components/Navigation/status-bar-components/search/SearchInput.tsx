// search/SearchInput.tsx
import React from 'react';
import { Search, X, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../utils/classNameUtils';
import type { ThemeMode } from '../StatusBarTypes';

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  resultCount: number;
  theme: ThemeMode;
}

// ─── Gradient colours used for the animated border ───────────────────────────
const GRADIENT_FAST = 'linear-gradient(90deg,#3b82f6,#10b981,#6366f1,#8b5cf6,#3b82f6)';

/**
 * SearchInput — Component 3
 *
 * An animated-gradient-border input field that is the centrepiece
 * of the command-palette modal.  Deliberately has no knowledge of
 * routing or Redux — pure, controlled UI.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, isFocused, onFocus, onBlur, inputRef, resultCount, theme }) => {
    const isDark = theme === 'dark';

    return (
      <div className="relative p-4">
        {/* ── Animated gradient border wrapper ── */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background: GRADIENT_FAST,
              backgroundSize: '300% 100%',
            }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{
              duration: isFocused ? 2 : 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* ── Inner (1 px inset to reveal the gradient rim) ── */}
          <div
            className={cn(
              'relative m-[2px] rounded-[10px] flex items-center overflow-hidden',
              isDark ? 'bg-gray-900' : 'bg-white'
            )}
          >
            {/* Search icon */}
            <Search
              className={cn(
                'absolute left-4 w-5 h-5 flex-shrink-0 transition-colors duration-200 pointer-events-none',
                isFocused
                  ? isDark ? 'text-blue-400' : 'text-blue-500'
                  : isDark ? 'text-gray-500' : 'text-gray-400'
              )}
            />

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              autoFocus
              placeholder="Search modules, pages, actions…"
              aria-label="Global module search"
              aria-autocomplete="list"
              className={cn(
                'w-full pl-12 pr-32 py-4 text-[15px] bg-transparent',
                'focus:outline-none placeholder:text-sm',
                isDark
                  ? 'text-gray-100 placeholder-gray-600'
                  : 'text-gray-900 placeholder-gray-400'
              )}
            />

            {/* Right controls */}
            <div className="absolute right-3 flex items-center gap-2">
              {/* Result count badge */}
              {value && resultCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums',
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  )}
                >
                  {resultCount}
                </motion.span>
              )}

              {/* Clear button */}
              {value ? (
                <motion.button
                  key="clear"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => onChange('')}
                  aria-label="Clear search"
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              ) : (
                /* ⌘K hint when empty */
                <div
                  className={cn(
                    'hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs border select-none',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-500'
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  )}
                >
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
