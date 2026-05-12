// search/hooks/useSearchKeyboard.ts
import { useState, useCallback, useEffect } from 'react';

// ─── Module-level singleton ───────────────────────────────────────────────────
//
// Mirrors the pattern used by useSearchCache: a module-level boolean + a Set
// of subscriber setters. This means:
//  • The ⌘K listener is registered ONCE, at module load time.
//  • It survives component unmounts (e.g. when the StatusBar is hidden).
//  • Every hook instance shares the same open/close state — so clicking the
//    SearchBar trigger and pressing ⌘K always talk to the same modal.
//
// ─────────────────────────────────────────────────────────────────────────────
let globalIsOpen = false;
const subscribers = new Set<(open: boolean) => void>();

/** Central mutator — updates the singleton and notifies every subscriber. */
function setGlobal(open: boolean): void {
  globalIsOpen = open;
  subscribers.forEach((fn) => fn(open));
}

/** For other shortcuts (e.g. workspace Alt+digits) to defer while search is open. */
export function isSearchModalOpen(): boolean {
  return globalIsOpen;
}

// Register the ⌘K / Ctrl+K listener exactly once when the module is first
// imported (SSR-safe guard via typeof window check).
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault(); // stop Firefox's address-bar shortcut etc.
      setGlobal(!globalIsOpen);
    }
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSearchKeyboard() {
  // Each hook consumer gets its own local state that stays in sync with the
  // singleton via the subscribers Set.
  const [isOpen, setIsOpen] = useState(globalIsOpen);

  useEffect(() => {
    // Sync immediately in case the global state changed between renders.
    setIsOpen(globalIsOpen);

    // Subscribe this instance to future changes.
    subscribers.add(setIsOpen);
    return () => {
      subscribers.delete(setIsOpen);
    };
  }, []); // empty — setIsOpen from useState is guaranteed stable

  const openSearch   = useCallback(() => setGlobal(true),          []);
  const closeSearch  = useCallback(() => setGlobal(false),         []);
  const toggleSearch = useCallback(() => setGlobal(!globalIsOpen), []);

  return { isOpen, openSearch, closeSearch, toggleSearch };
}
