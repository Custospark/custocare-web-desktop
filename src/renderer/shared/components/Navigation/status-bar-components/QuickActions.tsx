// components/statusbar/QuickActions.tsx
import React, { useMemo, useCallback } from 'react';
import { Settings, Sun, Moon, PanelRight, Mail } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';

// Import Redux hooks and actions
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { mapUIThemeToBackend } from '../../../../modules/account/api/settings/preferences/PreferencesTypes';
import { useUpdateSinglePreference } from '../../../../modules/account/api/settings/preferences/PreferencesQueries';

export type SidebarPosition = 'left' | 'right';

interface QuickActionsProps {
  sidebarPosition: SidebarPosition;
  onToggleSidebarPosition: () => void; // External handler
  isTransitioning: boolean;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  sidebarPosition,
  onToggleSidebarPosition,
  isTransitioning,
  unreadCount = 0,
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const { updateTheme } = useUpdateSinglePreference();

  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    }
  }, [onNotificationClick, navigate]);

  const handleThemeToggle = useCallback(() => {
    // Toggle theme in Redux (immediate UI feedback)
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(toggleTheme());
    
    // Sync to backend (async)
    updateTheme(mapUIThemeToBackend(newTheme));
  }, [theme, dispatch, updateTheme]);

  const handleSettingsClick = useCallback(() => {
    // Navigate to settings section
    navigate(ACCOUNT_ROUTES.SETTINGS_PROFILE);
  }, [navigate]);

  const positionToggleIcon = useMemo(() => {
    const isLeft = sidebarPosition === 'left';
    
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'w-7 h-7 rounded-lg transition-all duration-300',
          // Subtle background for active state
          theme === 'dark'
            ? 'bg-cyan-500/10'  // Very subtle cyan for dark mode
            : 'bg-blue-50'       // Subtle blue for light mode
        )}
      >
        <PanelRight
          className={cn(
            'w-4 h-4 transition-all duration-300',
            // Icon rotation indicates position
            isLeft && 'rotate-180',
            // Subtle color for active state
            theme === 'dark'
              ? 'text-cyan-400'  // Cyan for dark mode
              : 'text-blue-600'   // Blue for light mode
          )}
        />
      </div>
    );
  }, [sidebarPosition, theme]);

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {/* 1. NOTIFICATIONS - High priority, time-sensitive */}
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
        <Mail className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1',
              'text-[10px] font-bold text-white rounded-full',
              'bg-gradient-to-r from-red-500 to-pink-500',
              'shadow-lg shadow-red-500/50'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. THEME TOGGLE - Frequently used, personal preference */}
      <button
        onClick={handleThemeToggle}
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

      {/* 3. SETTINGS - Configuration hub, moderate frequency */}
      <button
        onClick={handleSettingsClick}
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

      {/* 4. SIDEBAR POSITION - Power user feature, least frequent */}
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
          // Subtle active state - no border, just a very light background
          theme === 'dark'
            ? 'hover:bg-gray-800/60 focus:ring-cyan-500/50 bg-cyan-500/5'  // Very subtle cyan (5% opacity)
            : 'hover:bg-gray-100/80 focus:ring-blue-500/50 bg-blue-50/70'   // Subtle blue with opacity
        )}
      >
        {positionToggleIcon}
      </button>
    </div>
  );
};