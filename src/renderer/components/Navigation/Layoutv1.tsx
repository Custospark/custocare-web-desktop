import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../types/cn';
import { Sun, Moon, Settings, Bell, Activity, Menu, X, Search, Command } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store'
import { toggleSidebar, setSidebarOpen, toggleTheme } from '../../store/slices/uiSlice';

/**
 * ============================================================================
 * CONSTANTS & CONFIGURATION
 * ============================================================================
 */

/**
 * System status configuration mapping
 * Defines visual styling and metadata for each system status type
 */
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

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Local component state interface
 * Manages UI state that doesn't need global persistence
 */
interface LocalLayoutState {
  mobileSidebarOpen: boolean;    // Mobile sidebar visibility toggle
  scrollTop: number;              // Current scroll position for scroll effects
  searchQuery: string;            // Global search input value
  isSearchFocused: boolean;       // Search input focus state for styling
  systemStatus: 'online' | 'warning' | 'error';  // Current system health status
}

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */

/**
 * Layout Component - Enterprise-Grade Application Shell
 * 
 * Architecture Overview:
 * =====================
 * This component serves as the primary application layout shell, implementing
 * a responsive sidebar-content-navbar pattern with advanced UX features.
 * 
 * Key Responsibilities:
 * - Global UI state management via Redux
 * - Responsive layout orchestration (desktop/tablet/mobile)
 * - Theme management and persistence
 * - Global search interface with keyboard shortcuts
 * - System status monitoring and display
 * - Accessibility compliance (ARIA, keyboard navigation)
 * 
 * State Management Strategy:
 * - Global UI state (theme, sidebar) → Redux store
 * - Local transient state (search, mobile menu) → Component state
 * - Derived/computed state → useMemo hooks
 * 
 * Performance Optimizations:
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Computed theme classes via useMemo
 * - Event listener cleanup in useEffect hooks
 * - Conditional rendering for mobile overlays
 * 
 * Responsive Breakpoints:
 * - Mobile: < 1024px (lg breakpoint)
 * - Desktop: ≥ 1024px
 * 
 * @returns {JSX.Element} The complete application layout structure
 */
export const Layout: React.FC = () => {
  /**
   * =========================================================================
   * REDUX STATE & DISPATCH
   * =========================================================================
   */
  
  const dispatch = useDispatch<AppDispatch>();
  
  // Select global UI state from Redux store
  const { theme, sidebarOpen } = useSelector((state: RootState) => ({
    theme: state.ui.theme,
    sidebarOpen: state.ui.sidebarOpen,
  }));

  /**
   * =========================================================================
   * LOCAL COMPONENT STATE
   * =========================================================================
   */
  
  // Reference to search input for programmatic focus control
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * Local transient UI state
   * This state is intentionally kept local as it doesn't need:
   * - Cross-component access
   * - Persistence across sessions
   * - Time-travel debugging
   */
  const [localState, setLocalState] = useState<LocalLayoutState>({
    mobileSidebarOpen: false,
    scrollTop: 0,
    searchQuery: '',
    isSearchFocused: false,
    systemStatus: 'online'
  });

  /**
   * =========================================================================
   * COMPUTED VALUES (MEMOIZED)
   * =========================================================================
   */

  /**
   * Theme-based CSS class configuration
   * Memoized to prevent recalculation on every render
   * Provides consistent theming across all layout sections
   */
  const themeClasses = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      // Main background with subtle gradient
      background: isDark
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
      
      // Sidebar border styling
      sidebarBorder: isDark
        ? 'border-r border-gray-800/50'
        : 'border-r border-gray-200/60',
      
      // Content area background overlay
      contentArea: isDark
        ? 'bg-gradient-to-b from-transparent to-gray-950/50'
        : 'bg-gradient-to-b from-transparent to-gray-50/50',
      
      // Glassmorphism backdrop for overlays
      backdrop: isDark
        ? 'bg-gray-900/80 backdrop-blur-xl'
        : 'bg-white/80 backdrop-blur-xl',
      
      // Glass effect for fixed elements (navbar, footer)
      glass: isDark
        ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
        : 'bg-white/95 backdrop-blur-xl border-gray-200/60'
    };
  }, [theme]);

  /**
   * Current system status configuration
   * Memoized to prevent object recreation on every render
   */
  const currentStatus = useMemo(
    () => STATUS_CONFIG[localState.systemStatus],
    [localState.systemStatus]
  );

  /**
   * Responsive sidebar width classes
   * Desktop only - mobile uses full overlay
   */
  const sidebarWidthClass = sidebarOpen ? 'lg:w-80' : 'lg:w-20';
  const contentMarginClass = sidebarOpen ? 'lg:ml-80' : 'lg:ml-20';

  /**
   * =========================================================================
   * EVENT HANDLERS (MEMOIZED CALLBACKS)
   * =========================================================================
   */

  /**
   * Toggle desktop sidebar collapsed state
   * Dispatches Redux action to persist state globally
   */
  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  /**
   * Toggle mobile sidebar visibility
   * Local state - not persisted globally
   */
  const handleToggleMobileSidebar = useCallback(() => {
    setLocalState(prev => ({ 
      ...prev, 
      mobileSidebarOpen: !prev.mobileSidebarOpen 
    }));
  }, []);

  /**
   * Close mobile sidebar
   * Used by overlay click and responsive resize
   */
  const handleCloseMobileSidebar = useCallback(() => {
    setLocalState(prev => ({ ...prev, mobileSidebarOpen: false }));
  }, []);

  /**
   * Handle global search input changes
   * Debouncing should be implemented here for production use
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalState(prev => ({ ...prev, searchQuery: e.target.value }));
    // TODO: Implement debounced search API call
  }, []);

  /**
   * Clear search query and blur input
   */
  const handleClearSearch = useCallback(() => {
    setLocalState(prev => ({ ...prev, searchQuery: '' }));
    searchInputRef.current?.blur();
  }, []);

  /**
   * Toggle theme between dark and light modes
   * Dispatches Redux action for global theme state
   */
  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  /**
   * =========================================================================
   * SIDE EFFECTS (useEffect hooks)
   * =========================================================================
   */

  /**
   * Keyboard shortcuts handler
   * Implements:
   * - Cmd/Ctrl + K: Focus global search
   * - Escape: Clear search and blur input
   * 
   * Dependencies: searchQuery (for escape to only trigger when there's content)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global search shortcut (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      // Clear search with Escape key
      if (e.key === 'Escape' && localState.searchQuery) {
        handleClearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup: Remove event listener on unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localState.searchQuery, handleClearSearch]);

  /**
   * Responsive behavior: Auto-close mobile sidebar on desktop resize
   * Prevents sidebar being stuck open when switching from mobile to desktop
   * 
   * Threshold: 1024px (Tailwind 'lg' breakpoint)
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && localState.mobileSidebarOpen) {
        handleCloseMobileSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup: Remove event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [localState.mobileSidebarOpen, handleCloseMobileSidebar]);

  /**
   * Theme persistence to localStorage
   * Syncs Redux theme state with browser storage
   */
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    // Update document class for global CSS theme targeting
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  /**
   * System status monitoring simulation
   * TODO: Replace with actual health check API integration
   * 
   * Production implementation should:
   * - Poll health endpoint
   * - Handle WebSocket status updates
   * - Implement exponential backoff on failures
   */
  useEffect(() => {
    const statusInterval = setInterval(() => {
      // Simulate status changes (replace with real API call)
      const statuses: Array<'online' | 'warning' | 'error'> = ['online', 'warning', 'error'];
      const weights = [0.8, 0.15, 0.05]; // Weighted random: mostly online
      
      const random = Math.random();
      let cumulativeWeight = 0;
      let selectedStatus: 'online' | 'warning' | 'error' = 'online';
      
      for (let i = 0; i < statuses.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
          selectedStatus = statuses[i];
          break;
        }
      }
      
      setLocalState(prev => ({ ...prev, systemStatus: selectedStatus }));
    }, 30000); // Check every 30 seconds

    // Cleanup: Clear interval on unmount
    return () => clearInterval(statusInterval);
  }, []);

  /**
   * Initialize sidebar state from localStorage on mount
   * Ensures consistent state across page refreshes
   */
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebar-open');
    if (savedSidebarState !== null) {
      dispatch(setSidebarOpen(savedSidebarState === 'true'));
    }
  }, [dispatch]);

  /**
   * Persist sidebar state to localStorage
   * Enables state restoration on page reload
   */
  useEffect(() => {
    localStorage.setItem('sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  /**
   * =========================================================================
   * RENDER
   * =========================================================================
   */

  return (
    <div className={cn(
      'min-h-screen',
      'transition-colors duration-500',
      themeClasses.background
    )}>
      {/* 
        =====================================================================
        STATUS BAR - Global System Status & Search
        =====================================================================
        Fixed positioning at top of viewport
        Contains: System status indicator, global search, quick actions
      */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2',
        'border-b backdrop-blur-xl',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center justify-between gap-4">
          {/* System Status Indicator */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
              `bg-${currentStatus.color}-500/10 text-${currentStatus.color}-400`,
              theme === 'dark' 
                ? `border-${currentStatus.color}-500/20` 
                : `border-${currentStatus.color}-200`
            )}>
              {currentStatus.icon}
              <span className="font-medium hidden sm:inline">{currentStatus.label}</span>
            </div>
            
            {/* Version Badge */}
            <span className={cn(
              'hidden lg:inline px-2.5 py-1 rounded-full text-xs border',
              theme === 'dark'
                ? 'bg-gray-800/50 text-gray-400 border-gray-700/50'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            )}>
Version {__APP_VERSION__}            </span>
          </div>

          {/* 
            Global Search Input
            Features:
            - Keyboard shortcut hint (⌘K)
            - Focus state styling
            - Clear button when populated
            - Accessible via keyboard shortcuts
          */}
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative group">
              {/* Search Icon */}
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-300",
                localState.isSearchFocused 
                  ? (theme === 'dark' ? "text-cyan-400 scale-110" : "text-blue-500 scale-110") 
                  : (theme === 'dark' ? "text-gray-500" : "text-gray-400")
              )} />
              
              {/* Search Input Field */}
              <input
                ref={searchInputRef}
                type="text"
                value={localState.searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setLocalState(prev => ({ ...prev, isSearchFocused: true }))}
                onBlur={() => setLocalState(prev => ({ ...prev, isSearchFocused: false }))}
                placeholder="Quick search... (⌘K)"
                aria-label="Global search"
                className={cn(
                  "w-full pl-10 pr-20 py-1.5 rounded-lg text-sm",
                  "border transition-all duration-300",
                  "focus:ring-2 focus:ring-offset-0 focus:outline-none",
                  theme === 'dark'
                    ? "bg-gray-800/60 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:bg-gray-800"
                    : "bg-white/60 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20 focus:bg-white"
                )}
              />
              
              {/* Clear Button (visible when input has value) */}
              {localState.searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200",
                    theme === 'dark' ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-600"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                // Keyboard Shortcut Hint
                <div className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                  theme === 'dark' 
                    ? "bg-gray-800 border-gray-700 text-gray-500" 
                    : "bg-gray-100 border-gray-300 text-gray-600"
                )}>
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={cn(
                'p-2 rounded-lg transition-all duration-300 hover:scale-110',
                theme === 'dark'
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-indigo-600 hover:bg-indigo-500/10'
              )}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {/* Settings Button */}
            <button 
              aria-label="Open settings"
              className={cn(
                'p-2 rounded-lg transition-all duration-300 hover:scale-110',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 
        =====================================================================
        MAIN LAYOUT CONTAINER
        =====================================================================
        Contains: Sidebar, Navbar, Content Area, Footer
        Positioned below fixed status bar (pt-14)
      */}
      <div className="pt-14">
        {/* 
          Mobile Sidebar Overlay
          Semi-transparent backdrop that closes sidebar on click
          Only rendered when mobile sidebar is open
        */}
        {localState.mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* 
          ===================================================================
          SIDEBAR - Navigation Panel
          ===================================================================
          Behavior:
          - Desktop (≥1024px): Fixed position, toggle between collapsed/expanded
          - Mobile (<1024px): Overlay panel, slides in from left
          
          States:
          - Desktop collapsed: 20px width (icon only)
          - Desktop expanded: 80px width (full navigation)
          - Mobile: Full overlay with backdrop
        */}
        <aside className={cn(
          'fixed top-14 left-0 bottom-0 z-40',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          sidebarWidthClass,
          themeClasses.sidebarBorder,
          themeClasses.backdrop,
          // Mobile slide animation
          localState.mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop always visible
          'lg:translate-x-0'
        )}>
          <Sidebar 
            isOpen={localState.mobileSidebarOpen}
            onClose={handleCloseMobileSidebar}
            collapsed={!sidebarOpen}
            onToggleCollapse={handleToggleSidebar}
            theme={theme}
          />
        </aside>

        {/* 
          ===================================================================
          NAVBAR - Top Navigation Bar
          ===================================================================
          Fixed below status bar, adjusts position based on sidebar state
          Contains: Mobile menu toggle, sidebar collapse toggle, main navbar
        */}
        <div className={cn(
          'fixed top-14 right-0 z-30',
          'border-b backdrop-blur-xl',
          'transition-all duration-300',
          themeClasses.glass,
          // Adjust left margin based on sidebar state
          sidebarOpen ? 'left-0 lg:left-80' : 'left-0 lg:left-20'
        )}>
          <div className="flex items-center px-4 sm:px-6 py-3">
            {/* Mobile Menu Toggle (< 1024px only) */}
            <button
              onClick={handleToggleMobileSidebar}
              aria-label={localState.mobileSidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={localState.mobileSidebarOpen}
              className={cn(
                'lg:hidden mr-3 p-2 rounded-lg transition-all duration-300 hover:scale-105',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              {localState.mobileSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Desktop Sidebar Collapse Toggle (≥ 1024px only) */}
            <button
              onClick={handleToggleSidebar}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarOpen}
              className={cn(
                'hidden lg:flex mr-3 p-2 rounded-lg transition-all duration-300 hover:scale-105',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-cyan-400'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-blue-500'
              )}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                // Collapse icon (chevron left)
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-current transform -rotate-45" />
                </div>
              ) : (
                // Expand icon (chevron right)
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 border-r-2 border-t-2 border-current transform rotate-45" />
                </div>
              )}
            </button>

            {/* Navbar Component (breadcrumbs, actions, user menu) */}
            <div className="flex-1">
              <Navbar 
                theme={theme}
                onThemeToggle={handleToggleTheme}
                onMenuClick={handleToggleMobileSidebar}
              />
            </div>
          </div>
        </div>

        {/* 
          ===================================================================
          MAIN CONTENT AREA
          ===================================================================
          Contains: Page content (via Outlet) and Footer
          Adjusts margin based on sidebar state for proper spacing
        */}
        <div className={cn(
          'min-h-screen flex flex-col',
          'transition-all duration-300',
          'pt-[4.5rem]', // Account for navbar height
          contentMarginClass
        )}>
          {/* 
            Main Content Section
            Uses React Router's Outlet for nested route rendering
          */}
          <main className="flex-1">
            <div className={cn(
              'px-4 sm:px-6 lg:px-8 py-1 lg:py-1',
              'min-h-[calc(100vh-12rem)]', // Ensure minimum height
              themeClasses.contentArea
            )}>
              {/* Render nested routes */}
              <Outlet />
            </div>
          </main>

          {/* 
            Footer Section
            Sticky footer with glassmorphism effect
          */}
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

      {/* 
        =====================================================================
        DECORATIVE ELEMENTS
        =====================================================================
      */}

      {/* 
        Ambient Background Effects
        Non-interactive gradient orbs for visual depth
        Positioned behind all content (z-index: -10)
      */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Blue-Cyan gradient orb (top-left quadrant) */}
        <div className={cn(
          'absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30'
            : 'bg-gradient-to-r from-blue-200/30 to-cyan-200/30'
        )} 
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        {/* Purple-Pink gradient orb (bottom-right quadrant) */}
        <div className={cn(
          'absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10',
          theme === 'dark'
            ? 'bg-gradient-to-l from-purple-500/30 to-pink-500/30'
            : 'bg-gradient-to-l from-purple-200/30 to-pink-200/30'
        )}
        style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>

      {/* 
        Quick Actions Floating Action Button (FAB)
        Fixed position button for common actions
        Bottom-right corner of viewport
      */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          aria-label="Quick actions"
          className={cn(
            'group p-4 rounded-2xl backdrop-blur-xl border shadow-2xl',
            'transition-all duration-300 hover:scale-110 hover:shadow-3xl active:scale-95',
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50 hover:border-cyan-500/50'
              : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-300 hover:border-blue-500/50'
          )}
          title="Quick actions"
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-500 group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-300">
            <span className="text-white text-lg font-bold">+</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Display name for React DevTools
Layout.displayName = 'Layout';

export default Layout;