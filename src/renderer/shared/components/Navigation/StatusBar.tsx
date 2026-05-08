// components/statusbar/StatusBar.tsx
import React from 'react';
import { cn } from '../../types/cn';
import { SystemStatusIndicator } from './status-bar-components/SystemStatusIndicator';
import { type StatusBarProps } from './status-bar-components/StatusBarTypes';
import { QuickActions } from './status-bar-components/QuickActions';
import { SearchBar } from './status-bar-components/SearchBar';

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
  sidebarPosition,
  isTransitioning,
  onToggleSidebarPosition,
  enableNestedNavigation,
  onToggleNestedNavigation,
  appVersion,
  onNotificationClick,
}) => {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 py-2.5',
        'border-b backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: System Status */}
        <SystemStatusIndicator
          systemStatus={systemStatus}
          isOnline={isOnline}
          latency={latency}
          lastChecked={lastChecked}
          onRetryConnection={onRetryConnection}
          theme={theme}
          appVersion={appVersion}
        />

        {/* CENTER: Search Bar with Dropdown */}
        <SearchBar
          searchQuery={searchQuery}
          isSearchFocused={isSearchFocused}
          onSearchChange={onSearchChange}
          onSearchFocus={onSearchFocus}
          theme={theme}
        />

        {/* RIGHT: Quick Actions */}
        <QuickActions
          sidebarPosition={sidebarPosition}
          isTransitioning={isTransitioning}
          onToggleSidebarPosition={onToggleSidebarPosition}
          enableNestedNavigation={enableNestedNavigation}
          onToggleNestedNavigation={onToggleNestedNavigation}
          onNotificationClick={onNotificationClick}
        />
      </div>
    </div>
  );
};

StatusBar.displayName = 'StatusBar';
export default StatusBar;