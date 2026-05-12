// components/statusbar/QuickActions.tsx
import React, { useMemo, useCallback, useRef } from 'react';
import { Settings, Sun, Moon, PanelRight, Mail, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import { dockSidebarLeftShortcut, dockSidebarRightShortcut } from '../../../keyboard/layoutShortcutLabels';

// Import Redux hooks and actions
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { mapUIThemeToBackend } from '../../../../modules/account/api/settings/preferences/PreferencesTypes';
import { useUpdateSinglePreference } from '../../../../modules/account/api/settings/preferences/PreferencesQueries';

// Import message hooks for real-time unread count
import { useGetMessageStats } from '../../../../modules/account/api/messages/MessageQueries';

export type SidebarPosition = 'left' | 'right';

interface QuickActionsProps {
  sidebarPosition: SidebarPosition;
  onToggleSidebarPosition: () => void; // External handler
  enableNestedNavigation: boolean;
  onToggleNestedNavigation: () => void;
  isTransitioning: boolean;
  onNotificationClick?: () => void;
}

// Debounce utility function - Fixed version without type casting
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);

  const debouncedFunction = useCallback((...args: any[]) => {
    const now = Date.now();
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If we're within the delay window, schedule a new call
    const timeSinceLastCall = now - lastCallTimeRef.current;
    
    if (timeSinceLastCall >= delay) {
      // Call immediately if enough time has passed
      lastCallTimeRef.current = now;
      callback(...args);
    } else {
      // Otherwise debounce
      timeoutRef.current = setTimeout(() => {
        lastCallTimeRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);

  return debouncedFunction as T;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  sidebarPosition,
  onToggleSidebarPosition,
  enableNestedNavigation,
  onToggleNestedNavigation,
  isTransitioning,
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const { updateTheme } = useUpdateSinglePreference();

  // Refs to track navigation state
  const isNavigatingRef = useRef(false);
  const lastClickTimeRef = useRef(0);

  // Get real-time unread count from message stats
  const { data: statsData } = useGetMessageStats();
  const unreadCount = statsData?.inbox?.unread ?? 0;

  // Debounced navigation function
  const debouncedNavigate = useDebouncedCallback((path: string) => {
    // Prevent navigation if already navigating
    if (isNavigatingRef.current) {
      console.debug('Navigation already in progress, skipping...');
      return;
    }

    try {
      isNavigatingRef.current = true;
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset navigation flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 500);
    }
  }, 300);

  const handleNotificationClick = useCallback(() => {
    // Rate limiting: prevent clicks within 500ms of each other
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      console.debug('Rate limited: notification click too frequent');
      return;
    }
    lastClickTimeRef.current = now;

    if (onNotificationClick) {
      // Call directly since onNotificationClick might already be stable
      onNotificationClick();
    } else {
      debouncedNavigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    }
  }, [onNotificationClick, debouncedNavigate]);

  const handleThemeToggle = useCallback(() => {
    // Rate limit theme toggles
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      console.debug('Rate limited: theme toggle too frequent');
      return;
    }
    lastClickTimeRef.current = now;

    // Toggle theme in Redux (immediate UI feedback)
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    dispatch(toggleTheme());
    
    // Sync to backend (async)
    updateTheme(mapUIThemeToBackend(newTheme));
  }, [theme, dispatch, updateTheme]);

  const handleSettingsClick = useCallback(() => {
    // Rate limit settings navigation
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      console.debug('Rate limited: settings click too frequent');
      return;
    }
    lastClickTimeRef.current = now;

    // Navigate to settings section
    debouncedNavigate(ACCOUNT_ROUTES.SETTINGS_PROFILE);
  }, [debouncedNavigate]);

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
      {/* 1. NOTIFICATIONS - High priority, time-sensitive with real-time unread count */}
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
          // Disable button styling while navigating
          isNavigatingRef.current && 'opacity-50 cursor-not-allowed',
          theme === 'dark'
            ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
        )}
        disabled={isNavigatingRef.current}
      >
        <Mail className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1',
              'text-[10px] font-bold text-white rounded-full',
              'bg-gradient-to-r from-red-500 to-pink-500',
              'shadow-lg shadow-red-500/50',
              // Add subtle animation for new messages
              'animate-in zoom-in duration-300'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 1b. Nested sidebar mode toggle (near inbox as requested) */}
      <button
        onClick={onToggleNestedNavigation}
        aria-label={enableNestedNavigation ? 'Disable nested sidebar' : 'Enable nested sidebar'}
        title={enableNestedNavigation ? 'Use classic sidebar' : 'Use nested collapsible sidebar'}
        className={cn(
          'p-2 sm:p-1.5 rounded-lg',
          'transition-all duration-300 ease-in-out',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'cursor-pointer',
          enableNestedNavigation
            ? theme === 'dark'
              ? 'text-cyan-300 bg-cyan-500/10 focus:ring-cyan-500/50'
              : 'text-blue-700 bg-blue-100/70 focus:ring-blue-500/50'
            : theme === 'dark'
            ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
        )}
      >
        <ChevronsUpDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
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
        title={`Move sidebar (${dockSidebarLeftShortcut()} left · ${dockSidebarRightShortcut()} right, or click to flip)`}
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