// StatusBar.tsx
import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  WifiOff,
  Command,
  Search,
  Settings,
  Sun,
  Moon,
  X,
  PanelRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '../../types/cn';

export type SidebarPosition = 'left' | 'right';
export type SystemStatus = 'online' | 'slow' | 'offline';
export type ThemeMode = 'light' | 'dark';

export interface StatusBarThemeClasses {
  backdrop: string;
}

export interface StatusBarProps {
  theme: ThemeMode;
  themeClasses: StatusBarThemeClasses;

  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;

  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;

  onToggleSidebarPosition: () => void;
  onToggleTheme: () => void;

  appVersion: string;
}

/**
 * Real status configurations based on actual connectivity
 */
const STATUS_STYLES: Record<
  SystemStatus,
  {
    label: string;
    icon: React.ReactNode;
    pulse: boolean;
    textClass: string;
    bgClass: string;
    borderClassDark: string;
    borderClassLight: string;
  }
> = {
  online: {
    label: 'Connected',
    icon: <Activity className="w-3 h-3" />,
    pulse: true,
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClassDark: 'border-emerald-500/20',
    borderClassLight: 'border-emerald-200',
  },
  slow: {
    label: 'Slow Connection',
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: true,
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClassDark: 'border-amber-500/20',
    borderClassLight: 'border-amber-200',
  },
  offline: {
    label: 'Offline',
    icon: <WifiOff className="w-3 h-3" />,
    pulse: false,
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClassDark: 'border-red-500/20',
    borderClassLight: 'border-red-200',
  },
};

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  themeClasses,
  systemStatus,
  isOnline,
  latency,
  lastChecked,
  onRetryConnection,
  searchQuery,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  searchInputRef,
  sidebarPosition,
  isTransitioning,
  onToggleSidebarPosition,
  onToggleTheme,
  appVersion,
}) => {
  const status = useMemo(() => STATUS_STYLES[systemStatus], [systemStatus]);

  const positionToggleIcon = useMemo(() => {
    const isLeft = sidebarPosition === 'left';
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'w-7 h-7 rounded-lg transition-all duration-300',
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100/70'
        )}
      >
        <PanelRight
          className={cn(
            'w-4 h-4 transition-all duration-300',
            isLeft && 'rotate-180',
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
  }, [sidebarPosition, theme]);

  const formatLatency = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2.5',
        'border-b backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* System Status - Real connectivity info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
              'transition-all duration-300 ease-in-out',
              status.bgClass,
              status.textClass,
              theme === 'dark' ? status.borderClassDark : status.borderClassLight
            )}
          >
            <div className={cn('w-2.5 h-2.5 flex items-center justify-center', status.pulse && 'animate-pulse')}>
              {status.icon}
            </div>
            <span className="text-xs font-medium truncate max-w-[120px] sm:max-w-none">
              {status.label}
            </span>
            
            {/* Latency indicator */}
            {isOnline && latency !== null && (
              <div className="flex items-center gap-1 ml-1">
                <Zap className="w-2.5 h-2.5" />
                <span className="text-xs font-mono">{formatLatency(latency)}</span>
              </div>
            )}
          </div>

          {/* Retry button when offline/slow */}
          {(systemStatus === 'offline' || systemStatus === 'slow') && (
            <button
              onClick={onRetryConnection}
              aria-label="Retry connection"
              title="Check connection now"
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                'hover:scale-110 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                theme === 'dark'
                  ? 'bg-gray-800/40 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                  : 'bg-gray-100/60 text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
              )}
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          {/* Last checked timestamp */}
          <span
            className={cn(
              'hidden md:inline px-2 py-0.5 rounded text-xs border',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}
            title={lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Never checked'}
          >
            {formatLastChecked(lastChecked)}
          </span>

          <span
            className={cn(
              'hidden lg:inline px-2 py-0.5 rounded text-xs border',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}
          >
            Version {appVersion}
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-3">
          <div className="relative group">
            <Search
              className={cn(
                'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
                'transition-all duration-300 ease-in-out',
                isSearchFocused
                  ? theme === 'dark'
                    ? 'text-cyan-400 scale-110'
                    : 'text-blue-500 scale-110'
                  : theme === 'dark'
                    ? 'text-gray-500'
                    : 'text-gray-400'
              )}
            />

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              placeholder="Search..."
              aria-label="Global search"
              className={cn(
                'w-full pl-9 pr-20 py-1.5 rounded-lg text-sm',
                'border transition-all duration-300 ease-in-out',
                'focus:outline-none focus:ring-2',
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/40 focus:ring-cyan-500/20'
                  : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/40 focus:ring-blue-500/20'
              )}
            />

            {searchQuery ? (
              <button
                onClick={onClearSearch}
                aria-label="Clear search"
                className={cn(
                  'absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded',
                  'transition-all duration-200 hover:scale-110 active:scale-95',
                  theme === 'dark' ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-200/50 text-gray-600'
                )}
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <div
                className={cn(
                  'absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                  'transition-all duration-200',
                  theme === 'dark'
                    ? 'bg-gray-800/40 border border-gray-700/50 text-gray-500'
                    : 'bg-gray-100/40 border border-gray-300/50 text-gray-600'
                )}
              >
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
            onClick={onToggleSidebarPosition}
            aria-label={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
            title={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
            disabled={isTransitioning}
            className={cn(
              'hidden lg:flex items-center justify-center px-2 py-1.5 rounded-lg cursor-pointer',
              'transition-all duration-300 ease-in-out',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              theme === 'dark'
                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
            )}
          >
            {positionToggleIcon}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
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
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

StatusBar.displayName = 'StatusBar';
export default StatusBar;
