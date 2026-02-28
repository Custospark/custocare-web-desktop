// components/statusbar/QuickActions.tsx
import React, { useMemo, useCallback } from 'react';
import { Settings, Sun, Moon, PanelRight, Bell } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import { SidebarPosition, ThemeMode } from './StatusBarTypes';

interface QuickActionsProps {
  theme: ThemeMode;
  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;
  onToggleSidebarPosition: () => void;
  onToggleTheme: () => void;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  theme,
  sidebarPosition,
  isTransitioning,
  onToggleSidebarPosition,
  onToggleTheme,
  unreadCount = 0,
  onNotificationClick,
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    }
  }, [onNotificationClick, navigate]);

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

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title="Toggle theme"
        className={cn(
          'p-2 sm:p-1.5 rounded-lg',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 active:scale-95 hover:rotate-12',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'cursor-pointer',
          theme === 'dark'
            ? 'text-amber-400 hover:bg-amber-500/10 focus:ring-amber-500/50'
            : 'text-indigo-600 hover:bg-indigo-500/10 focus:ring-indigo-500/50'
        )}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
      </button>

      {/* Notifications */}
      <button
        onClick={handleNotificationClick}
        aria-label="Notifications"
        title="View messages and notifications"
        className={cn(
          'relative p-2 sm:p-1.5 rounded-lg',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'cursor-pointer',
          theme === 'dark'
            ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
        )}
      >
        <Bell className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1',
              'text-[10px] font-bold text-white rounded-full',
              'bg-gradient-to-r from-red-500 to-pink-500',
              'animate-pulse',
              'shadow-lg shadow-red-500/50'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Sidebar Position Toggle */}
      <button
        onClick={onToggleSidebarPosition}
        aria-label={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
        title={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
        disabled={isTransitioning}
        className={cn(
          'hidden lg:flex items-center justify-center px-2 py-1.5 rounded-lg',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'cursor-pointer',
          theme === 'dark'
            ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
        )}
      >
        {positionToggleIcon}
      </button>

      {/* Settings */}
      <button
        aria-label="Open settings"
        title="Settings"
        className={cn(
          'p-2 sm:p-1.5 rounded-lg',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 active:scale-95 hover:rotate-90',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'cursor-pointer',
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 focus:ring-gray-500/50'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 focus:ring-gray-400/50'
        )}
      >
        <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
};