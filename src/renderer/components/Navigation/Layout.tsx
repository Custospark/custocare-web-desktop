import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { LayoutProps } from '../../types/index';
import { cn } from '../../types/cn';
import { Sun, Moon, Settings, Bell, Activity, Menu, X } from 'lucide-react';
import { useAppContext } from '../../store/state/AppContext';

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
}

/**
 * Masterpiece Layout - Fixed Sidebar Architecture
 * 
 * Key Principles Applied:
 * 1. Fixed sidebar positioning (truly fixed to viewport)
 * 2. Main content and footer scroll together
 * 3. Independent scrolling regions
 * 4. Mobile-first navigation
 * 5. World-class UX refinements
 */
export const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  const { state, toggleTheme, setSystemStatus } = useAppContext();
  const { theme, systemStatus } = state;
  
  // Local state for layout behavior
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    scrollTop: 0
  });

  // Handle scroll for potential effects
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setLayoutState(prev => ({ ...prev, scrollTop: e.currentTarget.scrollTop }));
  }, []);

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
      {/* System Status Bar - Fixed at top */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2',
        'border-b backdrop-blur-xl',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
              `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400`,
              theme === 'dark' 
                ? `border-${currentStatus.color}-500/20` 
                : `border-${currentStatus.color}-200`
            )}>
              {currentStatus.icon}
              <span className="font-medium">{currentStatus.label}</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Last updated: Just now
              </span>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs border',
                theme === 'dark'
                  ? 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              )}>
                v4.2.1
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-300 hover:scale-110',
                theme === 'dark'
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-indigo-600 hover:bg-indigo-500/10'
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className={cn(
              'p-2 rounded-lg transition-all duration-300 hover:scale-110',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container - Account for status bar */}
      <div className="pt-14">
        {/* Mobile Sidebar Overlay */}
        {layoutState.mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileSidebar}
          />
        )}

        {/* Fixed Sidebar - Truly fixed to viewport */}
        <aside className={cn(
          'fixed top-14 left-0 bottom-0 z-40',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          sidebarWidthClass,
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          // Mobile: slide in/out
          layoutState.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
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

        {/* Navbar - Fixed to top right, occupies available left space */}
        <div className={cn(
          'fixed top-14 right-0 z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300',
          themeClasses.glass,
          // Left position adjusts based on sidebar width
          layoutState.sidebarCollapsed ? 'left-0 lg:left-20' : 'left-0 lg:left-80'
        )}>
          <div className="flex items-center px-6 py-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileSidebar}
              className={cn(
                'lg:hidden mr-4 p-2 rounded-lg transition-all duration-300',
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
                'hidden lg:flex mr-4 p-2 rounded-lg transition-all duration-300',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              title={layoutState.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {layoutState.sidebarCollapsed ? (
                <div className="w-5 h-5 flex items-center justify-center cursor-pointer hover:text-blue-400 ">
                  <div className="w-3 h-3 border-r-2 border-t-2 border-current transform rotate-45" />
                </div>
              ) : (
                <div className="w-5 h-5 flex items-center justify-center cursor-pointer hover:text-blue-400 ">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-current transform -rotate-45" />
                </div>
              )}
            </button>

            {/* Navbar Component - Takes remaining space */}
            <div className="flex-1">
              <Navbar 
                theme={theme}
                onThemeToggle={toggleTheme}
                onMenuClick={toggleMobileSidebar}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable with Footer */}
        <div className={cn(
          'min-h-screen flex flex-col',
          'transition-all duration-300',
          // Add top padding for fixed navbar and left margin for sidebar
          'pt-[4.5rem]', // Account for navbar height
          contentMarginClass
        )}>
          {/* Main Content - Scrolls naturally */}
          <main className="flex-1">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
              'min-h-[calc(100vh-12rem)]',
              themeClasses.contentArea
            )}>
              {children}
            </div>
          </main>

          {/* Footer - Scrolls with content */}
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
          'animate-float-slow',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30'
            : 'bg-gradient-to-r from-blue-200/30 to-cyan-200/30'
        )} />
        
        <div className={cn(
          'absolute inset-0',
          'bg-[linear-gradient(to_right,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem]',
          'mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)',
          theme === 'dark' ? 'opacity-5' : 'opacity-3'
        )} />
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className={cn(
          'group p-4 rounded-2xl backdrop-blur-xl border shadow-2xl',
          'transition-all duration-300 hover:scale-110 hover:shadow-3xl',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50'
            : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-300'
        )}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500">
            <div className="w-4 h-4 text-white">+</div>
          </div>
        </button>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';
export default Layout;
