// search/hooks/useSearchKeyboard.ts
import { useState, useCallback, useEffect } from 'react';

/**
 * Registers a global ⌘K / Ctrl+K listener and exposes
 * open/close helpers so any component can control the search modal.
 */
export function useSearchKeyboard() {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch  = useCallback(() => setIsOpen(true),  []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // prevent browser chrome (e.g. Firefox URL bar)
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSearch]);

  return { isOpen, openSearch, closeSearch, toggleSearch };
}
