// search/SearchResults.tsx
import React from 'react';
import {
  ArrowRight,
  Clock,
  Flame,
  Filter,
  X,
  Trash2,
  Search,
  CornerDownLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../utils/classNameUtils';
import type { ThemeMode, SearchableModule } from '../StatusBarTypes';
import type { CachedSearch } from './hooks/useSearchCache';

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchResultsProps {
  query: string;
  results: SearchableModule[];
  recentSearches: CachedSearch[];
  frequentModules: SearchableModule[];
  activeIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onNavigate: (module: SearchableModule) => void;
  onSelectRecentSearch: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearAllHistory: () => void;
  theme: ThemeMode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Bold the matching substring inside `text`. */
const HighlightMatch: React.FC<{
  text: string;
  query: string;
  className?: string;
}> = ({ text, query, className }) => {
  if (!query) return <span className={className}>{text}</span>;

  const lower  = text.toLowerCase();
  const lQuery = query.toLowerCase();
  const idx    = lower.indexOf(lQuery);
  if (idx === -1) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {text.slice(0, idx)}
      <span className="font-bold text-blue-500 dark:text-cyan-400">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
};

/** Category colour map — extensible. */
function getCategoryStyle(category: string, isDark: boolean): string {
  const map: Record<string, string> = {
    Clinical:               isDark ? 'bg-green-900/30 text-green-300 border-green-700/30' : 'bg-green-50 text-green-700 border-green-200/50',
    Finance:                isDark ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30' : 'bg-yellow-50 text-yellow-700 border-yellow-200/50',
    Administration:         isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700/30' : 'bg-blue-50 text-blue-700 border-blue-200/50',
    'Platform Administration': isDark ? 'bg-purple-900/30 text-purple-300 border-purple-700/30' : 'bg-purple-50 text-purple-700 border-purple-200/50',
    Account:                isDark ? 'bg-cyan-900/30 text-cyan-300 border-cyan-700/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200/50',
    'Patient Portal':       isDark ? 'bg-rose-900/30 text-rose-300 border-rose-700/30' : 'bg-rose-50 text-rose-700 border-rose-200/50',
  };
  return map[category] ?? (isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200');
}

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * SearchResults — Component 4
 *
 * Renders three mutually exclusive states:
 *  A) No query  → recent searches + frequently visited modules
 *  B) Has query → filtered results list (with keyboard-nav highlight)
 *  C) Has query but no matches → elegant empty state
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  results,
  recentSearches,
  frequentModules,
  activeIndex,
  itemRefs,
  onNavigate,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  onClearAllHistory,
  theme,
}) => {
  const isDark  = theme === 'dark';
  const hasQuery = query.trim().length > 0;
  const hasHistory = recentSearches.length > 0 || frequentModules.length > 0;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const sectionTitle = cn(
    'text-[10px] font-bold uppercase tracking-widest mb-2 px-4',
    isDark ? 'text-gray-600' : 'text-gray-400'
  );

  const baseItem = cn(
    'w-full text-left flex items-start gap-3 px-4 py-3',
    'transition-all duration-100 cursor-pointer focus:outline-none',
    'group'
  );

  const activeItem = isDark
    ? 'bg-gray-800/80 border-l-2 border-blue-500'
    : 'bg-blue-50/80 border-l-2 border-blue-500';

  const hoverItem = isDark
    ? 'hover:bg-gray-800/50 border-l-2 border-transparent'
    : 'hover:bg-gray-50 border-l-2 border-transparent';

  // ── A: No query — show history / tips ───────────────────────────────────────
  if (!hasQuery) {
    if (!hasHistory) {
      return (
        <div className="px-4 py-10 text-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
            className={cn(
              'inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 mx-auto',
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            )}
          >
            <Search className={cn('w-7 h-7', isDark ? 'text-gray-500' : 'text-gray-400')} />
          </motion.div>
          <p className={cn('text-sm font-semibold mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
            Start typing to search
          </p>
          <p className={cn('text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>
            Navigate modules, pages, and actions instantly
          </p>
        </div>
      );
    }

    return (
      <div className="py-3">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className={sectionTitle} style={{ padding: 0 }}>
                Recent Searches
              </span>
              <button
                type="button"
                onClick={onClearAllHistory}
                className={cn(
                  'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer',
                  isDark
                    ? 'text-gray-600 hover:text-red-400 hover:bg-red-900/20'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                )}
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>

            <div className="space-y-0.5">
              {recentSearches.slice(0, 6).map((s, i) => (
                <div
                  key={s.query}
                  className={cn(
                    'flex items-center justify-between pr-2 mx-2 rounded-lg transition-colors',
                    isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                  )}
                >
                  <button
                    ref={(el) => { itemRefs.current[i] = el; }}
                    type="button"
                    onClick={() => onSelectRecentSearch(s.query)}
                    className={cn(
                      'flex items-center gap-3 flex-1 px-2 py-2.5 text-left cursor-pointer',
                      activeIndex === i ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''
                    )}
                  >
                    <Clock
                      className={cn(
                        'w-3.5 h-3.5 flex-shrink-0',
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm truncate',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}
                    >
                      {s.query}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemoveRecentSearch(s.query); }}
                    aria-label={`Remove "${s.query}" from history`}
                    className={cn(
                      'p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100',
                      'hover:opacity-100',
                      isDark ? 'text-gray-600 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequently Visited */}
        {frequentModules.length > 0 && (
          <div>
            <div className={sectionTitle}>Frequently Visited</div>
            <div className="space-y-0.5 px-2">
              {frequentModules.map((m, i) => {
                const refIdx = recentSearches.slice(0, 6).length + i;
                const isActive = activeIndex === refIdx;
                return (
                  <motion.button
                    key={m.id}
                    ref={(el) => { itemRefs.current[refIdx] = el; }}
                    type="button"
                    onClick={() => onNavigate(m)}
                    whileHover={{ x: 2 }}
                    className={cn(
                      baseItem, 'rounded-lg',
                      isActive ? activeItem : hoverItem
                    )}
                  >
                    <Flame
                      className={cn(
                        'w-4 h-4 mt-0.5 flex-shrink-0',
                        isDark ? 'text-orange-500' : 'text-orange-400'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium truncate', isDark ? 'text-gray-200' : 'text-gray-800')}>
                          {m.label}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', getCategoryStyle(m.category, isDark))}>
                          {m.category}
                        </span>
                      </div>
                      <p className={cn('text-xs truncate mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>
                        {m.description}
                      </p>
                    </div>
                    <ArrowRight className={cn('w-4 h-4 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── B: Has query but no results ──────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-10 text-center"
      >
        <div
          className={cn(
            'inline-flex p-3 rounded-full mb-3 mx-auto',
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          )}
        >
          <Filter className={cn('w-6 h-6', isDark ? 'text-gray-500' : 'text-gray-400')} />
        </div>
        <p className={cn('font-semibold text-sm mb-1', isDark ? 'text-gray-200' : 'text-gray-800')}>
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
          Try different keywords or check the spelling
        </p>
      </motion.div>
    );
  }

  // ── C: Results list ──────────────────────────────────────────────────────────
  return (
    <div className="py-2">
      <div className={sectionTitle}>Results — {results.length} found</div>
      <AnimatePresence>
        {results.map((m, i) => {
          const isActive = activeIndex === i;
          return (
            <motion.button
              key={m.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              type="button"
              onClick={() => onNavigate(m)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ x: 2 }}
              className={cn(
                baseItem,
                'mx-2 rounded-lg',
                isActive ? activeItem : hoverItem
              )}
            >
              {/* Arrow / active indicator */}
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 self-center transition-colors',
                  isActive
                    ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                    : isDark ? 'bg-gray-800 text-gray-500 group-hover:bg-gray-700' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                )}
              >
                {isActive ? (
                  <CornerDownLeft className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <HighlightMatch
                    text={m.label}
                    query={query}
                    className={cn(
                      'text-sm font-semibold truncate',
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0',
                      getCategoryStyle(m.category, isDark)
                    )}
                  >
                    {m.category}
                  </span>
                </div>
                <HighlightMatch
                  text={m.description}
                  query={query}
                  className={cn('text-xs line-clamp-1', isDark ? 'text-gray-500' : 'text-gray-500')}
                />
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
