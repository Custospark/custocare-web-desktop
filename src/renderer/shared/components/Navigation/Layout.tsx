import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store/store/store';
import { toggleSidebar, setSidebarOpen, toggleTheme } from '../../../app/store/slices/uiSlice';

import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../types/cn';

import LayoutTopBars from './LayoutTopBars';
import DecorativeBackground from './DecorativeBackground';
import type { SidebarPosition, SystemStatus, ThemeMode } from './StatusBar';

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */
const STORAGE_KEYS = {
  SIDEBAR_POSITION: 'sidebar-position',
  SIDEBAR_OPEN: 'sidebar-open',
  THEME: 'app-theme',
  TOP_BARS_VISIBLE: 'layout-topbars-visible',
} as const;

const ANIMATION_CONFIG = {
  duration: { slow: 350 },
} as const;

const STATUS_BAR_H = 56; // matches pt-14
const NAVBAR_H = 56; // navbar row
const TOP_BARS_TOTAL_H = STATUS_BAR_H + NAVBAR_H;

interface LocalLayoutState {
  mobileSidebarOpen: boolean;
  searchQuery: string;
  isSearchFocused: boolean;
  systemStatus: SystemStatus;
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
  topBarsVisible: boolean; // statusbar + navbar together
}

/**
 * ============================================================================
 * STORAGE HELPERS
 * ============================================================================
 */
const loadSidebarPosition = (): SidebarPosition => {
  const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_POSITION);
  return saved === 'left' || saved === 'right' ? saved : 'left';
};

const saveSidebarPosition = (position: SidebarPosition): void => {
  localStorage.setItem(STORAGE_KEYS.SIDEBAR_POSITION, position);
};

const loadTopBarsVisible = (): boolean => {
  const saved = localStorage.getItem(STORAGE_KEYS.TOP_BARS_VISIBLE);
  // visible by default
  if (saved === null) return true;
  return saved === 'true';
};

const saveTopBarsVisible = (value: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.TOP_BARS_VISIBLE, String(value));
};

const isDesktopNow = (): boolean => window.matchMedia('(min-width: 1024px)').matches;

export const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { theme, sidebarOpen } = useSelector((state: RootState) => ({
    theme: state.ui.theme as ThemeMode,
    sidebarOpen: state.ui.sidebarOpen as boolean,
  }));

  const searchInputRef = useRef<HTMLInputElement>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localState, setLocalState] = useState<LocalLayoutState>({
    mobileSidebarOpen: false,
    searchQuery: '',
    isSearchFocused: false,
    systemStatus: 'online',
    sidebarPosition: loadSidebarPosition(),
    isTransitioning: false,
    topBarsVisible: loadTopBarsVisible(),
  });

  /**
   * ============================================================================
   * COMPUTED VALUES
   * ============================================================================
   */
  const themeClasses = useMemo(() => {
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
    if (isLeft) return sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />;
    return sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />;
  }, [localState.sidebarPosition, sidebarOpen]);

  const positionClasses = useMemo(() => {
    const isLeft = localState.sidebarPosition === 'left';

    return {
      sidebarPosition: isLeft ? 'left-0' : 'right-0',
      sidebarBorder: isLeft ? 'border-r' : 'border-l',
      sidebarWidth: sidebarOpen ? 'lg:w-80' : 'lg:w-20',
      sidebarTransformMobile: localState.mobileSidebarOpen
        ? 'translate-x-0'
        : isLeft
          ? '-translate-x-full'
          : 'translate-x-full',
      contentMargin: isLeft ? (sidebarOpen ? 'lg:ml-80' : 'lg:ml-20') : (sidebarOpen ? 'lg:mr-80' : 'lg:mr-20'),
      navbarPosition: isLeft
        ? (sidebarOpen ? 'left-0 lg:left-80' : 'left-0 lg:left-20')
        : (sidebarOpen ? 'right-0 lg:right-80' : 'right-0 lg:right-20'),
      navbarFull: isLeft ? 'right-0' : 'left-0',
    };
  }, [localState.sidebarPosition, sidebarOpen, localState.mobileSidebarOpen]);

  const topPaddingPx = useMemo(() => {
    // On desktop, can hide/show the full top bars (status+navbar)
    // On mobile, forced visible by effect below.
    return localState.topBarsVisible ? TOP_BARS_TOTAL_H : NAVBAR_H;
  }, [localState.topBarsVisible]);

  /**
   * ============================================================================
   * HANDLERS
   * ============================================================================
   */
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalState(prev => ({ ...prev, searchQuery: e.target.value }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalState(prev => ({ ...prev, searchQuery: '' }));
    searchInputRef.current?.blur();
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

  const handleToggleTopBarsVisible = useCallback(() => {
    // Hard guarantee: only toggleable on desktop
    if (!isDesktopNow()) return;

    setLocalState(prev => {
      const next = !prev.topBarsVisible;
      saveTopBarsVisible(next);
      return { ...prev, topBarsVisible: next };
    });
  }, []);

  /**
   * ============================================================================
   * EFFECTS
   * ============================================================================
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && localState.searchQuery) {
        handleClearSearch();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [localState.searchQuery, handleClearSearch]);

  useEffect(() => {
    const handleResize = () => {
      // close mobile sidebar when moving to desktop
      if (window.innerWidth >= 1024 && localState.mobileSidebarOpen) {
        handleCloseMobileSidebar();
      }

      // enterprise UX: on mobile, keep top bars visible always
      if (window.innerWidth < 1024 && localState.topBarsVisible === false) {
        setLocalState(prev => ({ ...prev, topBarsVisible: true }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [localState.mobileSidebarOpen, localState.topBarsVisible, handleCloseMobileSidebar]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: SystemStatus[] = ['online', 'warning', 'error'];
      const weights = [0.8, 0.15, 0.05];

      const r = Math.random();
      let acc = 0;
      let next: SystemStatus = 'online';

      for (let i = 0; i < statuses.length; i++) {
        acc += weights[i];
        if (r < acc) {
          next = statuses[i];
          break;
        }
      }

      setLocalState(prev => ({ ...prev, systemStatus: next }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  /**
   * ============================================================================
   * RENDER
   * ============================================================================
   */
  return (
    <div className={cn('min-h-screen', 'transition-colors duration-500 ease-in-out', themeClasses.background)}>
      {/* TOP BARS (Status + Navbar) */}
      <LayoutTopBars
        theme={theme}
        themeClasses={{ backdrop: themeClasses.backdrop, glass: themeClasses.glass, accent: themeClasses.accent }}
        topBarsVisible={localState.topBarsVisible}
        onToggleTopBarsVisible={handleToggleTopBarsVisible}
        systemStatus={localState.systemStatus}
        searchQuery={localState.searchQuery}
        isSearchFocused={localState.isSearchFocused}
        onSearchChange={handleSearchChange}
        onSearchFocus={() => setLocalState(prev => ({ ...prev, isSearchFocused: true }))}
        onSearchBlur={() => setLocalState(prev => ({ ...prev, isSearchFocused: false }))}
        onClearSearch={handleClearSearch}
        searchInputRef={searchInputRef}
        sidebarPosition={localState.sidebarPosition}
        sidebarOpen={sidebarOpen}
        isTransitioning={localState.isTransitioning}
        onToggleSidebarPosition={handleToggleSidebarPosition}
        onToggleTheme={handleToggleTheme}
        onToggleMobileSidebar={handleToggleMobileSidebar}
        collapseIcon={collapseIcon}
        onToggleSidebar={handleToggleSidebar}
        navbarPositionClass={positionClasses.navbarPosition}
        navbarFullClass={positionClasses.navbarFull}
        appVersion={String(__APP_VERSION__)}
      />

      {/* MAIN LAYOUT */}
      <div style={{ paddingTop: topPaddingPx }}>
        {/* Mobile overlay */}
        {localState.mobileSidebarOpen && (
          <div
            className={cn('fixed inset-0 z-40 lg:hidden', 'bg-black/50 backdrop-blur-sm', 'animate-in fade-in duration-200')}
            onClick={handleCloseMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed z-40 bottom-0',
            'transition-all duration-300 ease-in-out',
            'flex flex-col',
            positionClasses.sidebarPosition,
            positionClasses.sidebarWidth,
            positionClasses.sidebarBorder,
            'border',
            themeClasses.sidebarBorder,
            themeClasses.backdrop,
            positionClasses.sidebarTransformMobile,
            'lg:translate-x-0',
            localState.isTransitioning && 'pointer-events-none'
          )}
          style={{ top: topPaddingPx - NAVBAR_H }}
        >
          <Sidebar
            isOpen={localState.mobileSidebarOpen}
            onClose={handleCloseMobileSidebar}
            collapsed={!sidebarOpen}
            onToggleCollapse={handleToggleSidebar}
            theme={theme}
          />
        </aside>

        {/* Navbar mobile menu button (kept exactly like your original UX) */}
        <div
          className={cn('fixed z-40 lg:hidden')}
          style={{
            top: localState.topBarsVisible ? STATUS_BAR_H : 0,
            left: 0,
            right: 0,
            pointerEvents: 'none',
          }}
        >
          <div className={cn('px-4 py-2.5')}>
            <div className={cn('flex', localState.sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row')}>
              <button
                onClick={handleToggleMobileSidebar}
                aria-label={localState.mobileSidebarOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={localState.mobileSidebarOpen}
                className={cn(
                  'pointer-events-auto p-1.5 rounded-lg',
                  'transition-all duration-200 ease-in-out',
                  'hover:scale-105 active:scale-95',
                  localState.sidebarPosition === 'left' ? 'mr-3' : 'ml-3',
                  theme === 'dark' ? 'hover:bg-gray-800/60 text-gray-400' : 'hover:bg-gray-100/80 text-gray-600'
                )}
              >
                {localState.mobileSidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={cn('min-h-screen flex flex-col', 'transition-all duration-300 ease-in-out', positionClasses.contentMargin)}>
          <main className="flex-1">
            <div className={cn('px-4 sm:px-2 lg:px-1 py-1', 'min-h-[calc(100vh-11rem)]', themeClasses.contentArea)}>
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className={cn('border-t backdrop-blur-xl', 'transition-colors duration-300', themeClasses.glass)}>
            <Footer theme={theme} showContact={true} showSocial={true} showCopyright={true} compact={true} />
          </footer>
        </div>
      </div>

      {/* Decorative */}
      <DecorativeBackground theme={theme} sidebarPosition={localState.sidebarPosition} />

      {/* FAB */}
      <div
        className={cn(
          'fixed bottom-6 z-40',
          'transition-all duration-300 ease-in-out',
          localState.sidebarPosition === 'left' ? 'right-6' : 'left-6'
        )}
      >
        <button
          aria-label="Quick actions"
          className={cn(
            'group relative p-3 rounded-xl backdrop-blur-xl border shadow-lg',
            'transition-all duration-300 ease-out',
            'hover:scale-110 hover:rotate-90 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'overflow-hidden',
            theme === 'dark'
              ? 'bg-gray-900/70 border-gray-700/40 hover:border-cyan-500/60 focus:ring-cyan-500/50'
              : 'bg-white/70 border-gray-300/40 hover:border-blue-500/60 focus:ring-blue-500/50'
          )}
        >
          <div
            className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-300',
              'bg-gradient-to-br',
              themeClasses.accent
            )}
          />
          <div className="relative w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300">
            <Plus className="text-white text-sm transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  );
};

Layout.displayName = 'Layout';
export default Layout;
