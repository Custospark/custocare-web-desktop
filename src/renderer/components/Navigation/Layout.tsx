import React, {useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
// import {type LayoutProps } from '../../types/index';
import { cn } from '../../types/cn';
import { Sun, Moon, Settings, Bell, Activity, Menu, X, Search, Command } from 'lucide-react';
import { useAppContext } from '../../store/state/AppContext';
import { Outlet } from 'react-router-dom';

// Constants
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

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  scrollTop: number;
  searchQuery: string;
  isSearchFocused: boolean;
}

/**
 * Masterpiece Layout - World-Class UX Architecture
 * 
 * Enhanced Features:
 * 1. Global search in status bar with keyboard shortcuts
 * 2. Rich navbar with multiple action panels
 * 3. Responsive mobile-first design
 * 4. Smooth animations and transitions
 * 5. Contextual tooltips and micro-interactions
 */
export const Layout: React.FC = () => {
  const { state, toggleTheme, setSystemStatus } = useAppContext();
  const { theme, systemStatus } = state;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for layout behavior
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    scrollTop: 0,
    searchQuery: '',
    isSearchFocused: false
  });

  // Handle scroll for potential effects
//   const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
//     setLayoutState(prev => ({ ...prev, scrollTop: e.currentTarget.scrollTop }));
//   }, []);

  // Toggle sidebar collapse
  const toggleSidebarCollapse = useCallback(() => {
    setLayoutState(prev => ({ 
      ...prev, 
      sidebarCollapsed: !prev.sidebarCollapsed 
    }));
  }, []);

  // Toggle mobile sidebar
  const toggleMobileSidebar = useCallback(() => {
    setLayoutState(prev => ({ 
      ...prev, 
      mobileSidebarOpen: !prev.mobileSidebarOpen 
    }));
  }, []);

  // Search handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLayoutState(prev => ({ ...prev, searchQuery: e.target.value }));
  }, []);

  const clearSearch = useCallback(() => {
    setLayoutState(prev => ({ ...prev, searchQuery: '' }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && layoutState.searchQuery) {
        clearSearch();
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [layoutState.searchQuery, clearSearch]);

  // Close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && layoutState.mobileSidebarOpen) {
        setLayoutState(prev => ({ ...prev, mobileSidebarOpen: false }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutState.mobileSidebarOpen]);

  // Theme classes
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

  // Current status
  const currentStatus = useMemo(() => STATUS_CONFIG[systemStatus], [systemStatus]);

  // Mock system status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: Array<'online' | 'warning' | 'error'> = ['online', 'warning', 'error'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setSystemStatus(randomStatus);
    }, 30000);
    return () => clearInterval(interval);
  }, [setSystemStatus]);

  // Calculate sidebar width
  const sidebarWidthClass = layoutState.sidebarCollapsed ? 'w-20' : 'w-80';
  const contentMarginClass = layoutState.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

  return (
    <div className={cn(
      'min-h-screen',
      'transition-colors duration-500',
      themeClasses.background
    )}>
      {/* Enhanced Status Bar with Global Search */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2',
        'border-b backdrop-blur-xl',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: System Status */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
              `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400`,
              theme === 'dark' 
                ? `border-${currentStatus.color}-500/20` 
                : `border-${currentStatus.color}-200`
            )}>
              {currentStatus.icon}
              <span className="font-medium hidden sm:inline">{currentStatus.label}</span>
            </div>
            <span className={cn(
              'hidden lg:inline px-2.5 py-1 rounded-full text-xs border',
              theme === 'dark'
                ? 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            )}>
              v4.2.1
            </span>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative group">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-300",
                layoutState.isSearchFocused 
                  ? (theme === 'dark' ? "text-cyan-400 scale-110" : "text-blue-500 scale-110") 
                  : (theme === 'dark' ? "text-gray-500" : "text-gray-400")
              )} />
              
              <input
                ref={searchInputRef}
                type="text"
                value={layoutState.searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setLayoutState(prev => ({ ...prev, isSearchFocused: true }))}
                onBlur={() => setLayoutState(prev => ({ ...prev, isSearchFocused: false }))}
                placeholder="Quick search... (⌘K)"
                className={cn(
                  "w-full pl-10 pr-20 py-1.5 rounded-lg text-sm",
                  "border transition-all duration-300",
                  "focus:ring-2 focus:ring-offset-0",
                  theme === 'dark'
                    ? "bg-gray-800/60 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-gray-800"
                    : "bg-white/60 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 focus:bg-white"
                )}
              />
              
              {layoutState.searchQuery ? (
                <button
                  onClick={clearSearch}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200",
                    theme === 'dark' ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <div className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                  theme === 'dark' 
                    ? "bg-gray-800 border-gray-700 text-gray-500" 
                    : "bg-gray-100 border-gray-300 text-gray-600"
                )}>
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-300 hover:scale-110',
                theme === 'dark'
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-indigo-600 hover:bg-indigo-500/10'
              )}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-110',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
            title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="pt-14">
        {/* Mobile Sidebar Overlay */}
        {layoutState.mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* Fixed Sidebar */}
        <aside className={cn(
          'fixed top-14 left-0 bottom-0 z-40',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          sidebarWidthClass,
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          layoutState.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}>
          <Sidebar 
            isOpen={layoutState.mobileSidebarOpen}
            onClose={toggleMobileSidebar}
            collapsed={layoutState.sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            theme={theme}
          />
        </aside>

        {/* Enhanced Navbar */}
        <div className={cn(
          'fixed top-14 right-0 z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300',
          themeClasses.glass,
          layoutState.sidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-80'
        )}>
          <div className="flex items-center px-4 sm:px-6 py-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileSidebar}
              className={cn(
                'lg:hidden mr-3 p-2 rounded-lg transition-all duration-300 hover:scale-105',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              {layoutState.mobileSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className={cn(
                'hidden lg:flex mr-3 p-2 rounded-lg transition-all duration-300 hover:scale-105',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-cyan-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-blue-500'
              )}
              title={layoutState.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {layoutState.sidebarCollapsed ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 border-r-2 border-t-2 border-current transform rotate-45" />
                </div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-current transform -rotate-45" />
                </div>
              )}
            </button>

            {/* Enhanced Navbar Component */}
            <div className="flex-1">
              <Navbar 
                theme={theme}
                onThemeToggle={toggleTheme}
                onMenuClick={toggleMobileSidebar}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          'min-h-screen flex flex-col',
          'transition-all duration-300',
          'pt-[4.5rem]',
          contentMarginClass
        )}>
          <main className="flex-1">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
              'min-h-[calc(100vh-12rem)]',
              themeClasses.contentArea
            )}>

        <Outlet></Outlet>        
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
              compact={false}
            />
          </footer>
        </div>
      </div>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className={cn(
          'absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20',
          'animate-pulse',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30'
            : 'bg-gradient-to-r from-blue-200/30 to-cyan-200/30'
        )} 
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        <div className={cn(
          'absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10',
          'animate-pulse',
          theme === 'dark'
            ? 'bg-gradient-to-l from-purple-500/30 to-pink-500/30'
            : 'bg-gradient-to-l from-purple-200/30 to-pink-200/30'
        )}
        style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className={cn(
          'group p-4 rounded-2xl backdrop-blur-xl border shadow-2xl',
          'transition-all duration-300 hover:scale-110 hover:shadow-3xl active:scale-95',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 hover:border-cyan-500/50'
            : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-300 hover:border-blue-500/50'
        )}
        title="Quick actions"
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300">
            <span className="text-white text-lg font-bold">+</span>
          </div>
        </button>
      </div>
    </div>
  );
};

Layout.displayName = 'Layout';
export default Layout;
