// Layout.tsx
import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store/store';
import { toggleSidebar, setSidebarOpen, toggleTheme } from '../../../app/store/slices/uiSlice';

import { cn } from '../../types/cn';
import LayoutTopBars from './LayoutTopBars';
import DecorativeBackground from './DecorativeBackground';
import { LayoutSidebarSection } from './layout-components/LayoutSidebarSection';
import { LayoutContentSection } from './layout-components/LayoutContentSection';
import {
  type ThemeMode,
  type SidebarPosition,
  type LayoutThemeClasses,
  STORAGE_KEYS,
  ANIMATION_CONFIG,
  TOP_BARS_TOTAL_H,
  NAVBAR_H,
} from './layout-components/LayoutTypes';
import { useNetworkStatus } from '../../../app/store/hooks/seNetworkStatus';

// ── Search: always-mounted modal + shared keyboard hook ──────────────────────
// SearchModal is rendered here (not inside SearchBar) so ⌘K works globally.
// useSearchKeyboard is a module-level singleton — this instance shares state
// with every other call site (e.g. the trigger button in SearchBar).
import { SearchModal } from './status-bar-components/search/SearchModal';
import { useSearchKeyboard } from './status-bar-components/search/hooks/useSearchKeyboard';

// ─────────────────────────────────────────────────────────────────────────────

interface LocalLayoutState {
  mobileSidebarOpen: boolean;
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
}

const loadSidebarPosition = (): SidebarPosition => {
  const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_POSITION);
  return saved === 'left' || saved === 'right' ? saved : 'left';
};

const saveSidebarPosition = (position: SidebarPosition): void => {
  localStorage.setItem(STORAGE_KEYS.SIDEBAR_POSITION, position);
};

export const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { theme, sidebarOpen } = useSelector((state: RootState) => ({
    theme: state.ui.theme as ThemeMode,
    sidebarOpen: state.ui.sidebarOpen as boolean,
  }));

  const { systemStatus, isOnline, latency, lastChecked, retryConnection } = useNetworkStatus();

  // ── Always-mounted search modal ───────────────────────────────────────────
  // Reads from the same singleton as SearchBar's trigger button.
  const { isOpen: searchOpen, closeSearch } = useSearchKeyboard();

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localState, setLocalState] = useState<LocalLayoutState>({
    mobileSidebarOpen: false,
    sidebarPosition: loadSidebarPosition(),
    isTransitioning: false,
  });

  // ── Computed values ───────────────────────────────────────────────────────
  const themeClasses = useMemo((): LayoutThemeClasses => {
    const isDark = theme === 'dark';
    return {
      background: isDark
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
      sidebarBorder: isDark ? 'border-gray-800/50' : 'border-gray-200/60',
      contentArea: isDark
        ? 'bg-gradient-to-b from-transparent to-gray-950/50'
        : 'bg-gradient-to-b from-transparent to-gray-50/50',
      backdrop: isDark ? 'bg-gray-900/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl',
      glass: isDark
        ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
        : 'bg-white/95 backdrop-blur-xl border-gray-200/60',
      accent: isDark ? 'from-cyan-500 to-blue-600' : 'from-blue-500 to-indigo-600',
    };
  }, [theme]);

  const collapseIcon = useMemo(() => {
    const isLeft = localState.sidebarPosition === 'left';
    if (isLeft) {
      return sidebarOpen
        ? <PanelLeftClose  className="w-4 h-4" />
        : <PanelLeftOpen   className="w-4 h-4" />;
    }
    return sidebarOpen
      ? <PanelRightClose className="w-4 h-4" />
      : <PanelRightOpen  className="w-4 h-4" />;
  }, [localState.sidebarPosition, sidebarOpen]);

  const navbarPositionClasses = useMemo(() => {
    const isLeft = localState.sidebarPosition === 'left';
    return {
      navbarPosition: isLeft
        ? (sidebarOpen ? 'left-0 lg:left-70' : 'left-0 lg:left-20')
        : (sidebarOpen ? 'right-0 lg:right-70' : 'right-0 lg:right-20'),
      navbarFull: isLeft ? 'right-0' : 'left-0',
    };
  }, [localState.sidebarPosition, sidebarOpen]);

  const topPaddingPx = useMemo(() => TOP_BARS_TOTAL_H, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleSidebar = useCallback(() => {
    setLocalState(prev => ({ ...prev, isTransitioning: true }));
    dispatch(toggleSidebar());
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setLocalState(prev => ({ ...prev, isTransitioning: false }));
    }, ANIMATION_CONFIG.duration.slow);
  }, [dispatch]);

  const handleToggleMobileSidebar = useCallback(() => {
    setLocalState(prev => ({ ...prev, mobileSidebarOpen: !prev.mobileSidebarOpen }));
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setLocalState(prev => ({ ...prev, mobileSidebarOpen: false }));
  }, []);

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const handleToggleSidebarPosition = useCallback(() => {
    setLocalState(prev => {
      const next: SidebarPosition = prev.sidebarPosition === 'left' ? 'right' : 'left';
      saveSidebarPosition(next);
      return { ...prev, sidebarPosition: next, isTransitioning: true };
    });
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      setLocalState(prev => ({ ...prev, isTransitioning: false }));
    }, ANIMATION_CONFIG.duration.slow);
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && localState.mobileSidebarOpen) {
        handleCloseMobileSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [localState.mobileSidebarOpen, handleCloseMobileSidebar]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const savedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
    if (savedSidebarState !== null) {
      dispatch(setSidebarOpen(savedSidebarState === 'true'));
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'min-h-screen',
        'transition-colors duration-500 ease-in-out',
        themeClasses.background
      )}
    >
      {/* TOP BARS — always visible */}
      <LayoutTopBars
        theme={theme}
        themeClasses={{
          backdrop: themeClasses.backdrop,
          glass: themeClasses.glass,
          accent: themeClasses.accent,
        }}
        systemStatus={systemStatus}
        isOnline={isOnline}
        latency={latency}
        lastChecked={lastChecked}
        onRetryConnection={retryConnection}
        sidebarPosition={localState.sidebarPosition}
        sidebarOpen={sidebarOpen}
        isTransitioning={localState.isTransitioning}
        onToggleSidebarPosition={handleToggleSidebarPosition}
        onToggleTheme={handleToggleTheme}
        onToggleMobileSidebar={handleToggleMobileSidebar}
        collapseIcon={collapseIcon}
        onToggleSidebar={handleToggleSidebar}
        navbarPositionClass={navbarPositionClasses.navbarPosition}
        navbarFullClass={navbarPositionClasses.navbarFull}
        appVersion={String(__APP_VERSION__)}
      />

      {/* MAIN LAYOUT */}
      <div style={{ paddingTop: topPaddingPx }}>
        <LayoutSidebarSection
          mobileSidebarOpen={localState.mobileSidebarOpen}
          sidebarOpen={sidebarOpen}
          sidebarPosition={localState.sidebarPosition}
          isTransitioning={localState.isTransitioning}
          topPaddingPx={topPaddingPx}
          NAVBAR_H={NAVBAR_H}
          themeClasses={themeClasses}
          theme={theme}
          onCloseMobileSidebar={handleCloseMobileSidebar}
          onToggleSidebar={handleToggleSidebar}
        />

        <LayoutContentSection
          sidebarOpen={sidebarOpen}
          sidebarPosition={localState.sidebarPosition}
          themeClasses={themeClasses}
        />
      </div>

      {/* Decorative */}
      <DecorativeBackground
        theme={theme}
        sidebarPosition={localState.sidebarPosition}
      />

      {/*
       * ── Global Search Modal ──────────────────────────────────────────────
       * Rendered unconditionally here so it is ALWAYS mounted.
       *
       * Uses the same module-level singleton as SearchBar's trigger button
       * (useSearchKeyboard) so the two are always in sync:
       *  • ⌘K toggles the modal even when StatusBar is hidden.
       *  • Clicking the SearchBar trigger opens this same modal.
       *  • SearchBar's active-ring state also syncs because it reads from the
       *    same singleton.
       *
       * SearchModal renders via createPortal → document.body, so its position
       * in this JSX tree has no visual impact.
       */}
      <SearchModal
        isOpen={searchOpen}
        onClose={closeSearch}
        theme={theme}
      />
    </div>
  );
};

Layout.displayName = 'Layout';
export default Layout;
