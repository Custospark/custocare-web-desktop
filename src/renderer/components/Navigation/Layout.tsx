import React, { memo, useMemo, useEffect, useCallback } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { LayoutProps } from '../../types/index';
import { cn } from '../../types/cn';
import { Sun, Moon, Settings, Bell, Activity } from 'lucide-react';
import { useAppContext } from '../../store/state/AppContext';

// Constants outside component to prevent recreation
const STATUS_CONFIG = {
  online: {
    color: 'emerald',
    label: 'System Online'
  },
  warning: {
    color: 'amber',
    label: 'System Warning'
  },
  error: {
    color: 'red',
    label: 'System Error'
  }
} as const;

// Memoized icon components
const StatusIcons = {
  online: <Activity className="w-3 h-3" />,
  warning: <Bell className="w-3 h-3" />,
  error: <Bell className="w-3 h-3" />
} as const;

// Plus Icon Component
const PlusIcon = memo(({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
));
PlusIcon.displayName = 'PlusIcon';

/**
 * Masterpiece Layout Component - Optimized Version
 */
export const Layout: React.FC<LayoutProps> = memo(({
  children
}) => {
  const { state, toggleTheme, setSystemStatus } = useAppContext();
  const { theme, sidebarOpen, systemStatus } = state;

  // Memoized theme-based classes
  const themeClasses = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      background: isDark
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
      statusBar: isDark
        ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 border-gray-800/50'
        : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-200/60',
      statusBarText: isDark ? 'text-gray-400' : 'text-gray-600',
      statusBadge: isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600',
      themeButton: isDark
        ? 'text-amber-400 hover:bg-amber-500/10'
        : 'text-indigo-600 hover:bg-indigo-500/10',
      settingsButton: isDark
        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      navBackground: isDark
        ? 'bg-gradient-to-b from-gray-900/95 to-gray-800/95'
        : 'bg-gradient-to-b from-white/95 to-gray-50/95',
      mainContent: isDark
        ? 'bg-gradient-to-b from-transparent to-gray-950/50'
        : 'bg-gradient-to-b from-transparent to-gray-50/50',
      footer: isDark
        ? 'bg-gradient-to-t from-gray-900/95 to-gray-950 border-gray-800/50'
        : 'bg-gradient-to-t from-white/95 to-gray-50 border-gray-200/60',
      gradientOrbs: isDark
        ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30'
        : 'bg-gradient-to-r from-blue-200/30 to-cyan-200/30',
      gradientOrbsSecondary: isDark
        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30'
        : 'bg-gradient-to-r from-purple-200/30 to-pink-200/30',
      gridOpacity: isDark ? 'opacity-5' : 'opacity-3',
      quickActions: isDark
        ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50'
        : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-300',
      pulseEffect: isDark
        ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
        : 'bg-gradient-to-r from-blue-200/20 to-cyan-200/20',
      tooltip: isDark
        ? 'bg-gray-900/95 border-gray-800 text-gray-300'
        : 'bg-white/95 border-gray-200 text-gray-700',
      tooltipArrow: isDark
        ? 'bg-gray-900/95 border-r border-b border-gray-800'
        : 'bg-white/95 border-r border-b border-gray-200'
    };
  }, [theme]);

  // Memoized current status
  const currentStatus = useMemo(() => ({
    ...STATUS_CONFIG[systemStatus],
    icon: StatusIcons[systemStatus]
  }), [systemStatus]);

  // Memoized status class
  const statusClass = useMemo(() => 
    `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400 ${
      theme === 'dark'
        ? `border-${currentStatus.color}-500/20`
        : `border-${currentStatus.color}-200`
    }`,
  [currentStatus.color, theme]);

  // Memoized event handlers
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    document.documentElement.classList.toggle('dark', theme === 'light');
  }, [theme, toggleTheme]);

//   const handleSearch = useCallback((query: string) => {
//     console.log('Search query:', query);
//   }, []);

  // Memoized theme icon
  const themeIcon = useMemo(() => 
    theme === 'dark' ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    ),
  [theme]);

  // Mock system status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses: Array<'online' | 'warning' | 'error'> = ['online', 'warning', 'error'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setSystemStatus(randomStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, [setSystemStatus]);

  return (
    <div className={cn(
      'min-h-screen flex flex-col overflow-hidden',
      'transition-colors duration-500',
      themeClasses.background
    )}>
      {/* System Status Bar */}
      <div className={cn(
        'sticky top-0 z-50 px-4 py-1.5',
        'backdrop-blur-xl border-b',
        'transition-all duration-300',
        themeClasses.statusBar
      )}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'border',
              statusClass
            )}>
              {currentStatus.icon}
              <span className="font-medium">{currentStatus.label}</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className={themeClasses.statusBarText}>
                Last updated: Just now
              </span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                themeClasses.statusBadge
              )}>
                v4.2.1
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-300 hover:scale-110',
                themeClasses.themeButton
              )}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {themeIcon}
            </button>
            <button className={cn(
              'p-1.5 rounded-lg transition-all duration-300 hover:scale-110',
              themeClasses.settingsButton
            )}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden',
          'transition-all duration-500',
          sidebarOpen && 'lg:ml-80'
        )}>
          {/* Navbar with scroll effect */}
          <div className="sticky top-0 z-40">
            <div className={cn(
              'backdrop-blur-xl transition-all duration-300',
              themeClasses.navBackground
            )}>
              <Navbar />
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-6 lg:py-8',
              'min-h-[calc(100vh-12rem)]',
              themeClasses.mainContent
            )}>
              {children}
            </div>
          </main>

          {/* Footer */}
          <div className={cn(
            'border-t backdrop-blur-xl',
            'transition-colors duration-300',
            themeClasses.footer
          )}>
            <Footer />
          </div>
        </div>
      </div>

      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Gradient Orbs */}
        <div className={cn(
          'absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20',
          'animate-float-slow',
          themeClasses.gradientOrbs
        )} />
        <div className={cn(
          'absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15',
          'animate-float-slow animation-delay-2000',
          themeClasses.gradientOrbsSecondary
        )} />
        
        {/* Grid Pattern */}
        <div className={cn(
          'absolute inset-0',
          'bg-[linear-gradient(to_right,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem]',
          'mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)',
          themeClasses.gridOpacity
        )} />
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className={cn(
          'group relative',
          'p-4 rounded-2xl',
          'backdrop-blur-xl border',
          'shadow-2xl',
          'transition-all duration-300 hover:scale-110 hover:shadow-3xl',
          themeClasses.quickActions
        )}>
          {/* Pulse effect */}
          <div className={cn(
            'absolute -inset-1 rounded-2xl',
            'animate-pulse-slow',
            themeClasses.pulseEffect
          )} />
          
          <div className="relative">
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              'bg-gradient-to-br from-blue-600 to-cyan-500',
              'group-hover:scale-110 transition-transform duration-300'
            )}>
              <PlusIcon className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Tooltip */}
          <div className={cn(
            'absolute right-full mr-3 top-1/2 -translate-y-1/2',
            'px-3 py-2 rounded-lg',
            'backdrop-blur-xl border',
            'opacity-0 group-hover:opacity-100 transition-all duration-300',
            'whitespace-nowrap text-sm font-medium',
            themeClasses.tooltip
          )}>
            Quick Actions
            <div className={cn(
              'absolute left-full top-1/2 -translate-y-1/2',
              'w-2 h-2 rotate-45',
              themeClasses.tooltipArrow
            )} />
          </div>
        </button>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';
export default Layout;