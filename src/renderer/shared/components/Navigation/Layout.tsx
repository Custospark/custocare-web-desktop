import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { PanelRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../types/cn';
import { 
  Sun, 
  Moon, 
  Settings, 
  Bell, 
  Activity, 
  Menu, 
  X, 
  Search, 
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
} from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../app/store/store'
import { toggleSidebar, setSidebarOpen, toggleTheme } from '../../../app/store/slices/uiSlice';

/**
 * ============================================================================
 * CONSTANTS & CONFIGURATION
 * ============================================================================
 */

/**
 * Sidebar position type
 */
type SidebarPosition = 'left' | 'right';

/**
 * Local storage keys
 */
const STORAGE_KEYS = {
  SIDEBAR_POSITION: 'sidebar-position',
  SIDEBAR_OPEN: 'sidebar-open',
  THEME: 'app-theme',
} as const;

/**
 * Animation configuration for premium feel
 */
const ANIMATION_CONFIG = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  spring: {
    stiffness: 300,
    damping: 30,
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
} as const;

/**
 * System status configuration mapping
 */
const STATUS_CONFIG = {
  online: {
    color: 'emerald',
    label: 'System Online',
    icon: <Activity className="w-3 h-3" />,
    pulse: true,
  },
  warning: {
    color: 'amber',
    label: 'System Warning',
    icon: <Bell className="w-3 h-3" />,
    pulse: true,
  },
  error: {
    color: 'red',
    label: 'System Error',
    icon: <Bell className="w-3 h-3" />,
    pulse: true,
  }
} as const;

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

interface LocalLayoutState {
  mobileSidebarOpen: boolean;
  scrollTop: number;
  searchQuery: string;
  isSearchFocused: boolean;
  systemStatus: 'online' | 'warning' | 'error';
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

const loadSidebarPosition = (): SidebarPosition => {
  const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_POSITION);
  return (saved === 'left' || saved === 'right') ? saved : 'left';
};

const saveSidebarPosition = (position: SidebarPosition): void => {
  localStorage.setItem(STORAGE_KEYS.SIDEBAR_POSITION, position);
};

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */

export const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { theme, sidebarOpen } = useSelector((state: RootState) => ({
    theme: state.ui.theme,
    sidebarOpen: state.ui.sidebarOpen,
  }));

  const searchInputRef = useRef<HTMLInputElement>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [localState, setLocalState] = useState<LocalLayoutState>({
    mobileSidebarOpen: false,
    scrollTop: 0,
    searchQuery: '',
    isSearchFocused: false,
    systemStatus: 'online',
    sidebarPosition: loadSidebarPosition(),
    isTransitioning: false,
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
      
      sidebarBorder: isDark
        ? 'border-gray-800/50'
        : 'border-gray-200/60',
      
      contentArea: isDark
        ? 'bg-gradient-to-b from-transparent to-gray-950/50'
        : 'bg-gradient-to-b from-transparent to-gray-50/50',
      
      backdrop: isDark
        ? 'bg-gray-900/80 backdrop-blur-xl'
        : 'bg-white/80 backdrop-blur-xl',
      
      glass: isDark
        ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
        : 'bg-white/95 backdrop-blur-xl border-gray-200/60',

      accent: isDark
        ? 'from-cyan-500 to-blue-600'
        : 'from-blue-500 to-indigo-600',
    };
  }, [theme]);

  const currentStatus = useMemo(
    () => STATUS_CONFIG[localState.systemStatus],
    [localState.systemStatus]
  );

  /**
   * Get the correct collapse/expand icon based on position and state
   */
  const getCollapseIcon = useMemo(() => {
    const isLeft = localState.sidebarPosition === 'left';
    const isOpen = sidebarOpen;

    if (isLeft) {
      return isOpen ? (
        <PanelLeftClose className="w-4 h-4" />
      ) : (
        <PanelLeftOpen className="w-4 h-4" />
      );
    } else {
      return isOpen ? (
        <PanelRightClose className="w-4 h-4" />
      ) : (
        <PanelRightOpen className="w-4 h-4" />
      );
    }
  }, [localState.sidebarPosition, sidebarOpen]);

  /**
   * Get position toggle icon
   */

    const getPositionToggleIcon = useMemo(() => {
      const isLeft = localState.sidebarPosition === 'left';

      return (
        <div
          className={cn(
            'flex items-center justify-center',
            'w-7 h-7 rounded-lg transition-all duration-300',
            theme === 'dark'
              ? 'bg-gray-800/60'
              : 'bg-gray-100/70'
          )}
        >
          <PanelRight
            className={cn(
              'w-4 h-4 transition-all duration-300',
              // Flip icon to represent docking side
              isLeft && 'rotate-180',
              // State color
              theme === 'dark'
                ? isLeft
                  ? 'text-cyan-400'
                  : 'text-gray-400'
                : isLeft
                  ? 'text-blue-600'
                  : 'text-gray-600'
            )}
          />
        </div>
      );
    }, [localState.sidebarPosition, theme]);



  /**
   * Dynamic positioning classes with smooth transitions
   */
  const positionClasses = useMemo(() => {
    const isLeft = localState.sidebarPosition === 'left';
    
    return {
      // Sidebar classes
      sidebarPosition: isLeft ? 'left-0' : 'right-0',
      sidebarBorder: isLeft ? 'border-r' : 'border-l',
      sidebarWidth: sidebarOpen ? 'lg:w-80' : 'lg:w-20',
      sidebarTransform: {
        mobile: localState.mobileSidebarOpen 
          ? 'translate-x-0' 
          : (isLeft ? '-translate-x-full' : 'translate-x-full'),
        desktop: 'lg:translate-x-0'
      },
      
      // Content margin classes with smooth transition
      contentMargin: isLeft 
        ? (sidebarOpen ? 'lg:ml-80' : 'lg:ml-20')
        : (sidebarOpen ? 'lg:mr-80' : 'lg:mr-20'),
      
      // Navbar classes
      navbarPosition: isLeft
        ? (sidebarOpen ? 'left-0 lg:left-80' : 'left-0 lg:left-20')
        : (sidebarOpen ? 'right-0 lg:right-80' : 'right-0 lg:right-20'),
      navbarFull: isLeft ? 'right-0' : 'left-0',

      // Toggle button position
      toggleButtonOrder: isLeft ? 'order-first' : 'order-last',
    };
  }, [localState.sidebarPosition, sidebarOpen, localState.mobileSidebarOpen]);

  /**
   * ============================================================================
   * EVENT HANDLERS
   * ============================================================================
   */

  const handleToggleSidebar = useCallback(() => {
    setLocalState(prev => ({ ...prev, isTransitioning: true }));
    dispatch(toggleSidebar());
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setLocalState(prev => ({ ...prev, isTransitioning: false }));
    }, ANIMATION_CONFIG.duration.slow);
  }, [dispatch]);

  const handleToggleMobileSidebar = useCallback(() => {
    setLocalState(prev => ({ 
      ...prev, 
      mobileSidebarOpen: !prev.mobileSidebarOpen 
    }));
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
      const newPosition: SidebarPosition = prev.sidebarPosition === 'left' ? 'right' : 'left';
      saveSidebarPosition(newPosition);
      return { 
        ...prev, 
        sidebarPosition: newPosition,
        isTransitioning: true 
      };
    });

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setLocalState(prev => ({ ...prev, isTransitioning: false }));
    }, ANIMATION_CONFIG.duration.slow);
  }, []);

  /**
   * ============================================================================
   * EFFECTS
   * ============================================================================
   */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      if (e.key === 'Escape' && localState.searchQuery) {
        handleClearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localState.searchQuery, handleClearSearch]);

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
    const statusInterval = setInterval(() => {
      const statuses: Array<'online' | 'warning' | 'error'> = ['online', 'warning', 'error'];
      const weights = [0.8, 0.15, 0.05];
      
      const random = Math.random();
      let cumulativeWeight = 0;
      let selectedStatus: 'online' | 'warning' | 'error' = 'online';
      
      for (let i = 0; i < statuses.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
          selectedStatus = statuses[i];
          break;
        }
      }
      
      setLocalState(prev => ({ ...prev, systemStatus: selectedStatus }));
    }, 30000);

    return () => clearInterval(statusInterval);
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
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  /**
   * ============================================================================
   * RENDER
   * ============================================================================
   */

  return (
    <div className={cn(
      'min-h-screen',
      'transition-colors duration-500 ease-in-out',
      themeClasses.background
    )}>
      {/* ========== STATUS BAR ========== */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2.5',
        'border-b backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center justify-between gap-4">
          {/* System Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
              'transition-all duration-300 ease-in-out',
              `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400`,
              theme === 'dark' 
                ? `border-${currentStatus.color}-500/20` 
                : `border-${currentStatus.color}-200`
            )}>
              <div className={cn(
                "w-2.5 h-2.5 flex items-center justify-center",
                currentStatus.pulse && "animate-pulse"
              )}>
                {currentStatus.icon}
              </div>
              <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                {currentStatus.label}
              </span>
            </div>
            
            <span className={cn(
              'hidden lg:inline px-2 py-0.5 rounded text-xs border',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}>
              Version {__APP_VERSION__}
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-3">
            <div className="relative group">
              <Search className={cn(
                "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5",
                "transition-all duration-300 ease-in-out",
                localState.isSearchFocused 
                  ? (theme === 'dark' ? "text-cyan-400 scale-110" : "text-blue-500 scale-110") 
                  : (theme === 'dark' ? "text-gray-500" : "text-gray-400")
              )} />
              
              <input
                ref={searchInputRef}
                type="text"
                value={localState.searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setLocalState(prev => ({ ...prev, isSearchFocused: true }))}
                onBlur={() => setLocalState(prev => ({ ...prev, isSearchFocused: false }))}
                placeholder="Search..."
                aria-label="Global search"
                className={cn(
                  "w-full pl-9 pr-20 py-1.5 rounded-lg text-sm",
                  "border transition-all duration-300 ease-in-out",
                  "focus:outline-none focus:ring-2",
                  theme === 'dark'
                    ? "bg-gray-800/50 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/40 focus:ring-cyan-500/20"
                    : "bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/40 focus:ring-blue-500/20"
                )}
              />
              
              {localState.searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded",
                    "transition-all duration-200 hover:scale-110 active:scale-95",
                    theme === 'dark' ? "hover:bg-gray-700/50 text-gray-400" : "hover:bg-gray-200/50 text-gray-600"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <div className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                  "transition-all duration-200",
                  theme === 'dark' 
                    ? "bg-gray-800/40 border border-gray-700/50 text-gray-500" 
                    : "bg-gray-100/40 border border-gray-300/50 text-gray-600"
                )}>
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Sidebar Position Toggle */}
            <button
              onClick={handleToggleSidebarPosition}
              aria-label={`Move sidebar to ${localState.sidebarPosition === 'left' ? 'right' : 'left'}`}
              title={`Move sidebar to ${localState.sidebarPosition === 'left' ? 'right' : 'left'}`}
              disabled={localState.isTransitioning}
              className={cn(
                'hidden lg:flex items-center justify-center px-2 py-1.5 rounded-lg',
                'transition-all duration-300 ease-in-out',
                'hover:scale-105 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
              )}
            >
              {getPositionToggleIcon}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                'p-1.5 rounded-lg',
                'transition-all duration-300 ease-in-out',
                'hover:scale-105 active:scale-95 hover:rotate-12',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                theme === 'dark'
                  ? 'text-amber-400 hover:bg-amber-500/10 focus:ring-amber-500/50'
                  : 'text-indigo-600 hover:bg-indigo-500/10 focus:ring-indigo-500/50'
              )}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 transition-transform duration-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 transition-transform duration-300" />
              )}
            </button>
            
            {/* Settings */}
            <button 
              aria-label="Open settings"
              className={cn(
                'p-1.5 rounded-lg',
                'transition-all duration-300 ease-in-out',
                'hover:scale-105 active:scale-95 hover:rotate-90',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 focus:ring-gray-500/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 focus:ring-gray-400/50'
              )}
            >
              <Settings className="w-3.5 h-3.5 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ========== MAIN LAYOUT ========== */}
      <div className="pt-14">
        {/* Mobile Overlay */}
        {localState.mobileSidebarOpen && (
          <div
            className={cn(
              "fixed inset-0 z-40 lg:hidden",
              "bg-black/50 backdrop-blur-sm",
              "animate-in fade-in duration-200"
            )}
            onClick={handleCloseMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          'fixed top-14 bottom-0 z-40',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          positionClasses.sidebarPosition,
          positionClasses.sidebarWidth,
          positionClasses.sidebarBorder,
          'border',
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          positionClasses.sidebarTransform.mobile,
          positionClasses.sidebarTransform.desktop,
          localState.isTransitioning && 'pointer-events-none'
        )}>
          <Sidebar 
            isOpen={localState.mobileSidebarOpen}
            onClose={handleCloseMobileSidebar}
            collapsed={!sidebarOpen}
            onToggleCollapse={handleToggleSidebar}
            theme={theme}
          />
        </aside>

        {/* Navbar */}
        <div className={cn(
          'fixed top-14 z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300 ease-in-out',
          themeClasses.glass,
          positionClasses.navbarPosition,
          positionClasses.navbarFull
        )}>
          <div className={cn(
            "flex items-center px-4 py-2.5",
            localState.sidebarPosition === 'right' && "flex-row-reverse"
          )}>
            {/* Mobile Menu Button */}
            <button
              onClick={handleToggleMobileSidebar}
              aria-label={localState.mobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={localState.mobileSidebarOpen}
              className={cn(
                'lg:hidden p-1.5 rounded-lg',
                'transition-all duration-200 ease-in-out',
                'hover:scale-105 active:scale-95',
                localState.sidebarPosition === 'left' ? 'mr-3' : 'ml-3',
                theme === 'dark'
                  ? 'hover:bg-gray-800/60 text-gray-400'
                  : 'hover:bg-gray-100/80 text-gray-600'
              )}
            >
              {localState.mobileSidebarOpen ? (
                <X className="w-4.5 h-4.5 transition-transform duration-200" />
              ) : (
                <Menu className="w-4.5 h-4.5 transition-transform duration-200" />
              )}
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={handleToggleSidebar}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              disabled={localState.isTransitioning}
              className={cn(
                'hidden lg:flex items-center justify-center relative',
                'h-9 w-9 p-2 rounded-xl',
                'transition-all duration-300 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'backdrop-blur-md overflow-hidden',
                'group hover:scale-110 active:scale-95',
                'shadow-lg hover:shadow-xl',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                localState.sidebarPosition === 'left' ? 'mr-4' : 'ml-4',
                theme === 'dark'
                  ? [
                      'bg-gradient-to-br from-gray-900/60 via-gray-900/70 to-gray-900/60',
                      'hover:from-gray-900/70 hover:via-cyan-800/50 hover:to-gray-900/70',
                      'text-gray-400 hover:text-cyan-400',
                      'focus:ring-cyan-500/50 focus:ring-offset-gray-950',
                      'ring-1 ring-gray-700/40 hover:ring-cyan-500/50',
                    ].join(' ')
                  : [
                      'bg-gradient-to-br from-white/70 via-white/80 to-white/70',
                      'hover:from-white/80 hover:via-blue-100/50 hover:to-white/80',
                      'text-gray-600 hover:text-blue-600',
                      'focus:ring-blue-500/50 focus:ring-offset-white',
                      'ring-1 ring-gray-300/40 hover:ring-blue-500/50',
                    ].join(' ')
              )}
            >
              {/* Icon with smooth transition */}
              <div className={cn(
                "transition-all duration-300 ease-out",
                "group-hover:scale-110"
              )}>
                {getCollapseIcon}
              </div>

              {/* Ripple effect on hover */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
                "transition-opacity duration-300",
                "bg-gradient-to-r",
                theme === 'dark' ? themeClasses.accent : themeClasses.accent,
                "mix-blend-overlay"
              )} />
            </button>

            {/* Navbar Content */}
            <div className={cn(
              "flex-1",
              localState.sidebarPosition === 'right' && "text-right"
            )}>
              <Navbar 
                theme={theme}
                onThemeToggle={handleToggleTheme}
                onMenuClick={handleToggleMobileSidebar}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          'min-h-screen flex flex-col',
          'transition-all duration-300 ease-in-out',
          'pt-20',
          positionClasses.contentMargin
        )}>
          <main className="flex-1">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-1',
              'min-h-[calc(100vh-11rem)]',
              themeClasses.contentArea
            )}>
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className={cn(
            'border-t backdrop-blur-xl',
            'transition-colors duration-300',
            themeClasses.glass
          )}>
            <Footer 
              theme={theme}
              showContact={true}
              showSocial={true}
              showCopyright={true}
              compact={true}
            />
          </footer>
        </div>
      </div>

      {/* ========== DECORATIVE ELEMENTS ========== */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className={cn(
          'absolute top-0 w-64 h-64 rounded-full blur-3xl',
          'transition-all duration-700 ease-in-out',
          localState.sidebarPosition === 'left' ? 'left-1/4' : 'right-1/4',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-15'
            : 'bg-gradient-to-r from-blue-200/20 to-cyan-200/20 opacity-15'
        )} 
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        <div className={cn(
          'absolute bottom-0 w-64 h-64 rounded-full blur-3xl',
          'transition-all duration-700 ease-in-out',
          localState.sidebarPosition === 'left' ? 'right-1/4' : 'left-1/4',
          theme === 'dark'
            ? 'bg-gradient-to-l from-purple-500/20 to-pink-500/20 opacity-10'
            : 'bg-gradient-to-l from-purple-200/20 to-pink-200/20 opacity-10'
        )}
        style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>

      {/* Quick Actions FAB */}
      <div className={cn(
        'fixed bottom-6 z-40',
        'transition-all duration-300 ease-in-out',
        localState.sidebarPosition === 'left' ? 'right-6' : 'left-6'
      )}>
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
          {/* Animated gradient background */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100",
            "transition-opacity duration-300",
            "bg-gradient-to-br",
            themeClasses.accent
          )} />
          
          {/* Icon */}
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
