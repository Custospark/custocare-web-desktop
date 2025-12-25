import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../types/cn';
import { Sun, Moon, Settings, Bell, Activity, Menu, X, Search, Command } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store'
import { toggleSidebar, setSidebarOpen, toggleTheme } from '../../store/slices/uiSlice';

/**
 * ============================================================================
 * CONSTANTS & CONFIGURATION
 * ============================================================================
 */

/**
 * System status configuration mapping
 * Defines visual styling and metadata for each system status type
 */
const STATUS_CONFIG = {
  online: {
    color: 'emerald',
    label: 'System Online',
    icon: <Activity className="w-3 h-3" />
  },
  warning: {
    color: 'amber',
    label: 'System Warning',
    icon: <Bell className="w-3 h-3" />
  },
  error: {
    color: 'red',
    label: 'System Error',
    icon: <Bell className="w-3 h-3" />
  }
} as const;

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Local component state interface
 * Manages UI state that doesn't need global persistence
 */
interface LocalLayoutState {
  mobileSidebarOpen: boolean;
  scrollTop: number;
  searchQuery: string;
  isSearchFocused: boolean;
  systemStatus: 'online' | 'warning' | 'error';
}

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
  
  const [localState, setLocalState] = useState<LocalLayoutState>({
    mobileSidebarOpen: false,
    scrollTop: 0,
    searchQuery: '',
    isSearchFocused: false,
    systemStatus: 'online'
  });

  const themeClasses = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      background: isDark
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
      
      sidebarBorder: isDark
        ? 'border-r border-gray-800/50'
        : 'border-r border-gray-200/60',
      
      contentArea: isDark
        ? 'bg-gradient-to-b from-transparent to-gray-950/50'
        : 'bg-gradient-to-b from-transparent to-gray-50/50',
      
      backdrop: isDark
        ? 'bg-gray-900/80 backdrop-blur-xl'
        : 'bg-white/80 backdrop-blur-xl',
      
      glass: isDark
        ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
        : 'bg-white/95 backdrop-blur-xl border-gray-200/60'
    };
  }, [theme]);

  const currentStatus = useMemo(
    () => STATUS_CONFIG[localState.systemStatus],
    [localState.systemStatus]
  );

  const sidebarWidthClass = sidebarOpen ? 'lg:w-80' : 'lg:w-20';
  const contentMarginClass = sidebarOpen ? 'lg:ml-80' : 'lg:ml-20';

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
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
    localStorage.setItem('app-theme', theme);
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
    const savedSidebarState = localStorage.getItem('sidebar-open');
    if (savedSidebarState !== null) {
      dispatch(setSidebarOpen(savedSidebarState === 'true'));
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem('sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className={cn(
      'min-h-screen',
      'transition-colors duration-500',
      themeClasses.background
    )}>
      {/* Status Bar - Optimized Design */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2.5',
        'border-b backdrop-blur-xl',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center justify-between gap-4">
          {/* System Status - Compact Design */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
              `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400`,
              theme === 'dark' 
                ? `border-${currentStatus.color}-500/20` 
                : `border-${currentStatus.color}-200`
            )}>
              <div className="w-2.5 h-2.5 flex items-center justify-center">
                {currentStatus.icon}
              </div>
              <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-none">
                {currentStatus.label}
              </span>
            </div>
            
            <span className={cn(
              'hidden lg:inline px-2 py-0.5 rounded text-xs border',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}>
          v{import.meta.env.VITE_APP_VERSION || '0.0.0'}
            </span>
          </div>

          {/* Search - Improved Spacing */}
          <div className="flex-1 max-w-lg mx-3">
            <div className="relative">
              <Search className={cn(
                "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5",
                localState.isSearchFocused 
                  ? (theme === 'dark' ? "text-cyan-400" : "text-blue-500") 
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
                  "border transition-all duration-200",
                  "focus:outline-none",
                  theme === 'dark'
                    ? "bg-gray-800/50 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/40"
                    : "bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/40"
                )}
              />
              
              {localState.searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className={cn(
                    "absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded",
                    theme === 'dark' ? "hover:bg-gray-700/50 text-gray-400" : "hover:bg-gray-200/50 text-gray-600"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <div className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
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

          {/* Quick Actions - Compact Icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                theme === 'dark'
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-indigo-600 hover:bg-indigo-500/10'
              )}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            
            <button 
              aria-label="Open settings"
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
              )}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="pt-14">
        {localState.mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar - Reduced Spacing */}
        <aside className={cn(
          'fixed top-14 left-0 bottom-0 z-40',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          sidebarWidthClass,
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          localState.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}>
          <Sidebar 
            isOpen={localState.mobileSidebarOpen}
            onClose={handleCloseMobileSidebar}
            collapsed={!sidebarOpen}
            onToggleCollapse={handleToggleSidebar}
            theme={theme}
          />
        </aside>

        {/* Navbar - Reduced Height */}
        <div className={cn(
          'fixed top-14 right-0 z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300',
          themeClasses.glass,
          sidebarOpen ? 'left-0 lg:left-80' : 'left-0 lg:left-20'
        )}>
          <div className="flex items-center px-4 py-2.5">
            <button
              onClick={handleToggleMobileSidebar}
              aria-label={localState.mobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={localState.mobileSidebarOpen}
              className={cn(
                'lg:hidden mr-3 p-1.5 rounded-lg transition-colors duration-200',
                theme === 'dark'
                  ? 'hover:bg-gray-800/40 text-gray-400'
                  : 'hover:bg-gray-100/60 text-gray-600'
              )}
            >
              {localState.mobileSidebarOpen ? (
                <X className="w-4.5 h-4.5" />
              ) : (
                <Menu className="w-4.5 h-4.5" />
              )}
            </button>
<button
  onClick={handleToggleSidebar}
  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
  aria-expanded={sidebarOpen}
  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
  className={cn(
    'hidden lg:flex items-center justify-center relative',
    'h-9 w-9 p-2 rounded-xl mr-4',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'backdrop-blur-md',
    'group hover:scale-110 active:scale-95',
    'shadow-lg hover:shadow-xl',
    theme === 'dark'
      ? [
          'bg-gray-900/70 text-gray-400',
          'hover:text-cyan-400 hover:bg-gray-800/75',
          'focus:ring-cyan-500/50 focus:ring-offset-gray-950',
          'ring-1 ring-gray-700/40 hover:ring-cyan-500/50',
          'bg-gradient-to-br from-gray-900/60 via-gray-900/70 to-gray-900/60 hover:via-cyan-800/50',
        ].join(' ')
      : [
          'bg-white/80 text-gray-600',
          'hover:text-blue-600 hover:bg-gray-100/85',
          'focus:ring-blue-500/50 focus:ring-offset-white',
          'ring-1 ring-gray-300/40 hover:ring-blue-500/50',
          'bg-gradient-to-br from-white/70 via-white/80 to-white/70 hover:via-blue-100/50',
        ].join(' ')
  )}
>
  {/* Intelligent Chevron */}
  <span
    className={cn(
      'flex items-center justify-center transition-transform duration-300 ease-out',
      sidebarOpen ? 'rotate-180' : 'rotate-0'
    )}
  >
    <span
      className={cn(
        'w-2.5 h-2.5 border-t-2 border-r-2 transform rotate-45',
        theme === 'dark' ? 'border-current' : 'border-current'
      )}
    />
  </span>
</button>


            <div className="flex-1">
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
          'transition-all duration-300',
          'pt-20', // Reduced from 4.5rem (18px) to 5rem (20px)
          contentMarginClass
        )}>
          <main className="flex-1">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-1',
              'min-h-[calc(100vh-11rem)]', // Adjusted for reduced spacing
              themeClasses.contentArea
            )}>
              <Outlet />
            </div>
          </main>

          <footer className={cn(
            'border-t backdrop-blur-xl',
            themeClasses.glass
          )}>
            <Footer 
              theme={theme}
              showContact={true}
              showSocial={true}
              showCopyright={true}
              compact={true} // Changed to compact
            />
          </footer>
        </div>
      </div>

      {/* Decorative Elements - Subtler */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className={cn(
          'absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-15',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20'
            : 'bg-gradient-to-r from-blue-200/20 to-cyan-200/20'
        )} 
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        <div className={cn(
          'absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10',
          theme === 'dark'
            ? 'bg-gradient-to-l from-purple-500/20 to-pink-500/20'
            : 'bg-gradient-to-l from-purple-200/20 to-pink-200/20'
        )}
        style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>

      {/* Quick Actions FAB - Smaller */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          aria-label="Quick actions"
          className={cn(
            'group p-3 rounded-xl backdrop-blur-xl border shadow-lg',
            'transition-all duration-200 hover:scale-105 active:scale-95',
            theme === 'dark'
              ? 'bg-gray-900/70 border-gray-700/40 hover:border-cyan-500/40'
              : 'bg-white/70 border-gray-300/40 hover:border-blue-500/40'
          )}
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400">
            <span className="text-white text-sm font-bold">+</span>
          </div>
        </button>
      </div>
    </div>
  );
};

Layout.displayName = 'Layout';

export default Layout;