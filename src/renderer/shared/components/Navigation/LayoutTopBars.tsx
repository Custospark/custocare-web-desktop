// LayoutTopBars.tsx
import React, { useMemo } from 'react';
import { PanelsLeftRight } from 'lucide-react';
import { cn } from '../../types/cn';
import Navbar from './Navbar/Navbar';
import {
  type SidebarPosition,
  type SystemStatus,
  type ThemeMode,
} from './status-bar-components/StatusBarTypes';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../app/routes/routeConstants';
import StatusBar from './StatusBar';

export interface LayoutTopBarsThemeClasses {
  backdrop: string;
  glass: string;
  accent: string;
}

export interface LayoutTopBarsProps {
  theme: ThemeMode;
  themeClasses: LayoutTopBarsThemeClasses;

  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;

  sidebarPosition: SidebarPosition;
  sidebarOpen: boolean;
  isTransitioning: boolean;

  onToggleSidebarPosition: () => void;
  enableNestedNavigation: boolean;
  onToggleNestedNavigation: () => void;
  onToggleTheme: () => void;
  onToggleMobileSidebar: () => void;

  collapseIcon: React.ReactNode;
  onToggleSidebar: () => void;

  navbarPositionClass: string;
  navbarFullClass: string;

  appVersion: string;
}

const STATUS_BAR_H = 56;

export const LayoutTopBars: React.FC<LayoutTopBarsProps> = ({
  theme,
  themeClasses,
  systemStatus,
  isOnline,
  latency,
  lastChecked,
  onRetryConnection,
  sidebarPosition,
  sidebarOpen,
  isTransitioning,
  onToggleSidebarPosition,
  enableNestedNavigation,
  onToggleNestedNavigation,
  onToggleTheme,
  onToggleMobileSidebar,
  collapseIcon,
  onToggleSidebar,
  navbarPositionClass,
  navbarFullClass,
  appVersion,
}) => {
  const navbarTopPx = useMemo(() => STATUS_BAR_H, []);
  const navigate = useNavigate();

  return (
    <>
      <StatusBar
        theme={theme}
        themeClasses={{ backdrop: themeClasses.backdrop }}
        systemStatus={systemStatus}
        isOnline={isOnline}
        latency={latency}
        lastChecked={lastChecked}
        onRetryConnection={onRetryConnection}
        sidebarPosition={sidebarPosition}
        isTransitioning={isTransitioning}
        onToggleSidebarPosition={onToggleSidebarPosition}
        enableNestedNavigation={enableNestedNavigation}
        onToggleNestedNavigation={onToggleNestedNavigation}
        onToggleTheme={onToggleTheme}
        appVersion={appVersion}
        unreadCount={3}
        onNotificationClick={() => navigate(ACCOUNT_ROUTES.MESSAGES_INBOX)}
      />

      <div
        className={cn(
          'fixed z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300 ease-in-out',
          themeClasses.glass,
          navbarPositionClass,
          navbarFullClass
        )}
        style={{ top: navbarTopPx }}
      >
        <div
          className={cn(
            'flex items-center px-4 py-2.5',
            sidebarPosition === 'right' && 'flex-row-reverse'
          )}
        >
          {/* Desktop Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            disabled={isTransitioning}
            className={cn(
              'hidden lg:flex items-center justify-center relative cursor-pointer',
              'h-9 w-9 p-2 rounded-xl',
              'transition-all duration-300 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'backdrop-blur-md overflow-hidden',
              'group hover:scale-105 active:scale-95',
              'shadow-md hover:shadow-lg',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              sidebarPosition === 'left' ? 'mr-4' : 'ml-4',
              theme === 'dark'
                ? [
                    'bg-gradient-to-br from-gray-900/50 via-gray-900/60 to-gray-900/50',
                    'hover:from-gray-900/60 hover:via-gray-900/65 hover:to-gray-900/60',
                    'text-gray-400 hover:text-gray-300',
                    'focus:ring-cyan-500/50 focus:ring-offset-gray-950',
                    'ring-1 ring-gray-700/35 hover:ring-cyan-500/35',
                  ].join(' ')
                : [
                    'bg-gradient-to-br from-white/70 via-white/75 to-white/70',
                    'hover:from-white/80 hover:via-white/85 hover:to-white/80',
                    'text-gray-600 hover:text-gray-700',
                    'focus:ring-blue-500/50 focus:ring-offset-white',
                    'ring-1 ring-gray-300/35 hover:ring-blue-400/35',
                  ].join(' ')
            )}
          >
            <div className={cn('transition-all duration-300 ease-out', 'group-hover:scale-110')}>
              {collapseIcon}
            </div>
            <div
              className={cn(
                'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30',
                'transition-opacity duration-300',
                'bg-gradient-to-r',
                themeClasses.accent,
                'mix-blend-overlay'
              )}
            />
          </button>

          <button
            onClick={onToggleSidebarPosition}
            aria-label="Move sidebar to opposite side"
            title="Move sidebar left/right"
            disabled={isTransitioning}
            className={cn(
              'hidden lg:flex items-center justify-center relative cursor-pointer',
              'h-9 w-9 p-2 rounded-xl',
              'transition-all duration-300 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'backdrop-blur-md overflow-hidden',
              'group hover:scale-105 active:scale-95',
              'shadow-md hover:shadow-lg',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              sidebarPosition === 'left' ? 'mr-4' : 'ml-4',
              theme === 'dark'
                ? [
                    'bg-gradient-to-br from-gray-900/50 via-gray-900/60 to-gray-900/50',
                    'hover:from-gray-900/60 hover:via-gray-900/65 hover:to-gray-900/60',
                    'text-gray-400 hover:text-gray-300',
                    'focus:ring-cyan-500/50 focus:ring-offset-gray-950',
                    'ring-1 ring-gray-700/35 hover:ring-cyan-500/35',
                  ].join(' ')
                : [
                    'bg-gradient-to-br from-white/70 via-white/75 to-white/70',
                    'hover:from-white/80 hover:via-white/85 hover:to-white/80',
                    'text-gray-600 hover:text-gray-700',
                    'focus:ring-blue-500/50 focus:ring-offset-white',
                    'ring-1 ring-gray-300/35 hover:ring-blue-400/35',
                  ].join(' ')
            )}
          >
            <div className={cn('transition-all duration-300 ease-out', 'group-hover:scale-110')}>
              <PanelsLeftRight className="w-4 h-4" />
            </div>
            <div
              className={cn(
                'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30',
                'transition-opacity duration-300',
                'bg-gradient-to-r',
                themeClasses.accent,
                'mix-blend-overlay'
              )}
            />
          </button>

          {/* Navbar content */}
          <div className={cn('flex-1', sidebarPosition === 'right' && 'text-right')}>
            <Navbar
              theme={theme}
              onThemeToggle={onToggleTheme}
              onMenuClick={onToggleMobileSidebar}
            />
          </div>

        </div>
      </div>
    </>
  );
};

LayoutTopBars.displayName = 'LayoutTopBars';
export default LayoutTopBars;
