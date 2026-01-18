import React, { useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../types/cn';
import { Navbar } from './Navbar';
import StatusBar, { SidebarPosition, SystemStatus, ThemeMode } from './StatusBar';

export interface LayoutTopBarsThemeClasses {
  backdrop: string;
  glass: string;
  accent: string;
}



export interface LayoutTopBarsProps {
  theme: ThemeMode;
  themeClasses: LayoutTopBarsThemeClasses;

  topBarsVisible: boolean;
  onToggleTopBarsVisible: () => void;

  systemStatus: SystemStatus;

  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  sidebarPosition: SidebarPosition;
  sidebarOpen: boolean;
  isTransitioning: boolean;

  onToggleSidebarPosition: () => void;
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
  topBarsVisible,
  onToggleTopBarsVisible,
  systemStatus,
  searchQuery,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  searchInputRef,
  sidebarPosition,
  sidebarOpen,
  isTransitioning,
  onToggleSidebarPosition,
  onToggleTheme,
  onToggleMobileSidebar,
  collapseIcon,
  onToggleSidebar,
  navbarPositionClass,
  navbarFullClass,
  appVersion,
}) => {
  const navbarTopPx = useMemo(() => (topBarsVisible ? STATUS_BAR_H : 0), [topBarsVisible]);

  return (
    <>
      {topBarsVisible && (
        <StatusBar
          theme={theme}
          themeClasses={{ backdrop: themeClasses.backdrop }}
          systemStatus={systemStatus}
          searchQuery={searchQuery}
          isSearchFocused={isSearchFocused}
          onSearchChange={onSearchChange}
          onSearchFocus={onSearchFocus}
          onSearchBlur={onSearchBlur}
          onClearSearch={onClearSearch}
          searchInputRef={searchInputRef}
          sidebarPosition={sidebarPosition}
          isTransitioning={isTransitioning}
          onToggleSidebarPosition={onToggleSidebarPosition}
          onToggleTheme={onToggleTheme}
          appVersion={appVersion}
        />
      )}

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
        <div className={cn('flex items-center px-4 py-2.5', sidebarPosition === 'right' && 'flex-row-reverse')}>
          {/* Desktop Sidebar Toggle (collapse/expand) */}
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
              'group hover:scale-110 active:scale-95',
              'shadow-lg hover:shadow-xl',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              sidebarPosition === 'left' ? 'mr-4' : 'ml-4',
              theme === 'dark'
                ? [
                    'bg-gradient-to-br from-gray-900/60 via-gray-900/70 to-gray-900/60',
                    'hover:from-gray-900/70 hover:via-cyan-800/50 hover:to-gray-900/70',
                    'text-gray-400 hover:text-blue-400',
                    'focus:ring-cyan-500/50 focus:ring-offset-gray-950',
                    'ring-1 ring-gray-700/40 hover:ring-blue-500/50',
                  ].join(' ')
                : [
                    'bg-gradient-to-br from-white/70 via-white/80 to-white/70',
                    'hover:from-white/80 hover:via-blue-100/50 hover:to-white/80',
                    'text-gray-600 hover:text-blue-600',
                    'focus:ring-blue-500/50 focus:ring-offset-white',
                    'ring-1 ring-gray-300/40 hover:ring-blue-500/50',
                  ].join(' ')
            )}
          >
            <div className={cn('transition-all duration-300 ease-out', 'group-hover:scale-110')}>{collapseIcon}</div>
            <div
              className={cn(
                'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100',
                'transition-opacity duration-300',
                'bg-gradient-to-r',
                themeClasses.accent,
                'mix-blend-overlay'
              )}
            />
          </button>

          {/* Navbar content */}
          <div className={cn('flex-1', sidebarPosition === 'right' && 'text-right')}>
            <Navbar theme={theme} onThemeToggle={onToggleTheme} onMenuClick={onToggleMobileSidebar} />
          </div>

          {/* Desktop-only TopBars Toggle */}
          <div className={cn('hidden lg:flex items-center', sidebarPosition === 'left' ? 'ml-3' : 'mr-3')}>
            <button
              onClick={onToggleTopBarsVisible}
              aria-label={topBarsVisible ? 'Hide top bars' : 'Show top bars'}
              title={topBarsVisible ? 'Hide top bars (desktop only)' : 'Show top bars (desktop only)'}
              className={cn(
                'p-2 rounded-xl border backdrop-blur-xl',
                'transition-all duration-200',
                'hover:scale-105 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                theme === 'dark'
                  ? 'bg-gray-900/60 border-gray-700/40 text-gray-300 hover:text-white hover:border-cyan-500/50 focus:ring-cyan-500/50 focus:ring-offset-gray-950'
                  : 'bg-white/70 border-gray-300/40 text-gray-700 hover:text-gray-900 hover:border-blue-500/50 focus:ring-blue-500/50 focus:ring-offset-white'
              )}
            >
              {topBarsVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

LayoutTopBars.displayName = 'LayoutTopBars';
export default LayoutTopBars;
