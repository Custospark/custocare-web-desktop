// search/SearchModal.tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../utils/classNameUtils';
import type { ThemeMode, SearchableModule } from '../StatusBarTypes';
import { SearchInput }   from './SearchInput';
import { SearchResults } from './SearchResults';
import { useSearchFilter } from './hooks/useSearchFilter';
import { useSearchCache }   from './hooks/useSearchCache';

// ─── Props ────────────────────────────────────────────────────────────────────
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

// ─── Keyboard shortcuts footer ────────────────────────────────────────────────
const KbdHint: React.FC<{ label: string; theme: ThemeMode }> = ({ label, theme }) => (
  <span
    className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border',
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700 text-gray-500'
        : 'bg-gray-100 border-gray-200 text-gray-500'
    )}
  >
    {label}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────
const SearchModalInner: React.FC<SearchModalProps> = ({ isOpen, onClose, theme }) => {
  const isDark = theme === 'dark';

  // ── State ──────────────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState('');
  const [isFocused,   setIsFocused]   = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const inputRef  = useRef<HTMLInputElement>(null);
  const itemRefs  = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  const { filteredResults, accessibleModules } = useSearchFilter(query);

  const {
    cache,
    addRecentSearch,
    removeRecentSearch,
    clearAllHistory,
    recordModuleVisit,
    getTopModuleIds,
  } = useSearchCache();

  // ── Frequent modules (top 5 accessible, ranked by visit count) ────────────
  const frequentModules = useMemo<SearchableModule[]>(() => {
    const topIds = getTopModuleIds(5);
    return topIds
      .map((id) => accessibleModules.find((m) => m.id === id))
      .filter((m): m is SearchableModule => !!m);
  }, [accessibleModules, getTopModuleIds]);

  // ── Total navigable count for arrow-key cycling ───────────────────────────
  const navigableCount = useMemo(() => {
    if (query.trim()) return filteredResults.length;
    return Math.min(cache.recentSearches.length, 6) + frequentModules.length;
  }, [query, filteredResults.length, cache.recentSearches.length, frequentModules.length]);

  // ── Reset index whenever the list changes ─────────────────────────────────
  useEffect(() => { setActiveIndex(-1); }, [query, filteredResults]);

  // ── Scroll active item into view ──────────────────────────────────────────
  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIndex]);

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ FIX: Gate body-scroll lock on isOpen.
  //
  // Previously this had an empty dependency array [], which caused
  // document.body.style.overflow = 'hidden' to fire unconditionally on mount
  // and never be cleaned up (because SearchModalInner is always mounted via
  // the portal wrapper, AnimatePresence only hides the inner motion divs).
  // Result: the entire app body was permanently non-scrollable.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Reset query when modal closes ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(-1);
    }
  }, [isOpen]);

  // ── Modal-scoped keyboard handling (Esc, arrows, Enter) ───────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (navigableCount === 0 ? -1 : (i + 1) % navigableCount));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) =>
            navigableCount === 0 ? -1 : (i <= 0 ? navigableCount - 1 : i - 1)
          );
          break;

        case 'Enter':
          if (activeIndex < 0) break;
          e.preventDefault();
          handleEnterPress();
          break;

        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, navigableCount, query, filteredResults, cache.recentSearches, frequentModules]);

  // ── Handle Enter on active item ───────────────────────────────────────────
  const handleEnterPress = useCallback(() => {
    if (query.trim()) {
      const m = filteredResults[activeIndex];
      if (m) handleNavigate(m);
      return;
    }
    const recentCount = Math.min(cache.recentSearches.length, 6);
    if (activeIndex < recentCount) {
      const recent = cache.recentSearches[activeIndex];
      if (recent) handleSelectRecentSearch(recent.query);
    } else {
      const m = frequentModules[activeIndex - recentCount];
      if (m) handleNavigate(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, filteredResults, cache.recentSearches, frequentModules, query]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (module: SearchableModule) => {
      addRecentSearch(query.trim() || module.label);
      recordModuleVisit(module.id);
      navigate(module.route);
      onClose();
    },
    [query, addRecentSearch, recordModuleVisit, navigate, onClose]
  );

  const handleSelectRecentSearch = useCallback(
    (q: string) => {
      setQuery(q);
      setActiveIndex(-1);
      inputRef.current?.focus();
    },
    []
  );

  // ── Query change — reset index ────────────────────────────────────────────
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    setActiveIndex(-1);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Modal card ── */}
          <motion.div
            key="modal"
            role="dialog"
            aria-label="Global search"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed z-[9999] top-[10%] left-1/2 -translate-x-1/2',
              'w-full max-w-2xl mx-auto px-4',
              'max-h-[80vh]'
            )}
          >
            <div
              className={cn(
                'rounded-2xl overflow-hidden flex flex-col',
                'shadow-2xl ring-1',
                isDark
                  ? 'bg-gray-900 ring-gray-700/60 shadow-black/60'
                  : 'bg-white ring-gray-200 shadow-gray-400/30'
              )}
              style={{ maxHeight: '75vh' }}
            >
              {/* ── Input area ── */}
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                isFocused={isFocused}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                inputRef={inputRef}
                resultCount={filteredResults.length}
                theme={theme}
              />

              {/* ── Divider ── */}
              <div className={cn('h-px', isDark ? 'bg-gray-800' : 'bg-gray-100')} />

              {/* ── Results panel (scrollable) ── */}
              <div className="overflow-y-auto flex-1 overscroll-contain">
                <SearchResults
                  query={query}
                  results={filteredResults}
                  recentSearches={cache.recentSearches}
                  frequentModules={frequentModules}
                  activeIndex={activeIndex}
                  itemRefs={itemRefs}
                  onNavigate={handleNavigate}
                  onSelectRecentSearch={handleSelectRecentSearch}
                  onRemoveRecentSearch={removeRecentSearch}
                  onClearAllHistory={clearAllHistory}
                  theme={theme}
                />
              </div>

              {/* ── Keyboard hints footer ── */}
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 border-t',
                  isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50/80'
                )}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { keys: ['↑', '↓'], hint: 'navigate' },
                    { keys: ['↵'],      hint: 'open'     },
                    { keys: ['Esc'],    hint: 'close'    },
                  ].map(({ keys, hint }) => (
                    <span
                      key={hint}
                      className={cn(
                        'flex items-center gap-1 text-[11px]',
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      )}
                    >
                      {keys.map((k) => <KbdHint key={k} label={k} theme={theme} />)}
                      <span>{hint}</span>
                    </span>
                  ))}
                </div>

                <span className={cn(
                  'text-[10px] font-medium bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent',
                  isDark ? 'opacity-90' : 'opacity-100'
                )}>
                  Custocare AI Search
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Thin portal wrapper — ensures the modal renders at document root
 * regardless of where SearchBar sits in the DOM tree.
 */
export const SearchModal: React.FC<SearchModalProps> = (props) =>
  createPortal(<SearchModalInner {...props} />, document.body);
