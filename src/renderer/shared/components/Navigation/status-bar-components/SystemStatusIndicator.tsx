// components/statusbar/SystemStatusIndicator.tsx
import React, { useMemo } from 'react';
import { Activity, AlertTriangle, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { SystemStatus, ThemeMode } from './StatusBarTypes';
import { cn } from '../../../utils/classNameUtils';

interface SystemStatusIndicatorProps {
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;
  theme: ThemeMode;
  appVersion: string;
}

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

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  systemStatus,
  isOnline,
  latency,
  lastChecked,
  onRetryConnection,
  theme,
  appVersion,
}) => {
  const status = useMemo(() => STATUS_STYLES[systemStatus], [systemStatus]);

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
    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
      <div
        className={cn(
          'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border',
          'transition-all duration-300 ease-in-out',
          status.bgClass,
          status.textClass,
          theme === 'dark' ? status.borderClassDark : status.borderClassLight
        )}
      >
        <div className={cn('w-2.5 h-2.5 flex items-center justify-center', status.pulse && 'animate-pulse')}>
          {status.icon}
        </div>
        <span className="text-xs font-medium truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
          {status.label}
        </span>
        
        {/* Latency indicator */}
        {isOnline && latency !== null && (
          <div className="hidden md:flex items-center gap-1 ml-1">
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
            'cursor-pointer',
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
  );
};