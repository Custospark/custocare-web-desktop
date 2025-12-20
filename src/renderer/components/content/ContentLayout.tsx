import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/index';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

/**
 * ============================================================================
 * CONTENT LAYOUT COMPONENT - PREMIUM FULL-SPACE EDITION
 * ============================================================================
 * 
 * Enterprise-Grade Right Sidebar Architecture
 * 
 * Premium Features:
 * - Content occupies 100% available height
 * - No gaps between content and sidebar
 * - Right sidebar dynamically scales to content
 * - Smooth intelligent toggle with premium animations
 * - Fantastic user experience with proper spacing
 * - Mobile overlay with smooth transitions
 * - Theme-aware with perfect contrast
 * - Accessibility first approach
 */

/* ============================================================================
   TYPE DEFINITIONS
============================================================================ */

export interface Operation {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: number | string;
}

export interface ContentLayoutProps {
  operations: Operation[];
  activeOperation: string;
  onOperationChange: (operationId: string) => void;
  defaultOperation: string;
  children: React.ReactNode;
  initialCollapsed?: boolean;
  className?: string;
  hideSidebar?: boolean;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
}

/* ============================================================================
   CONSTANTS
============================================================================ */

const MOBILE_BREAKPOINT = 1024;
// const SIDEBAR_WIDTH = 340;

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  operations,
  activeOperation,
  onOperationChange,
  children,
  initialCollapsed = false,
  className,
  hideSidebar = false,
  sidebarHeader,
  sidebarFooter,
}) => {
  /**
   * REDUX STATE
   */
  const theme = useSelector((state: RootState) => state.ui.theme);

  /**
   * LOCAL STATE
   */
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  /**
   * EFFECTS - WINDOW RESIZE LISTENER
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      if (!mobile && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  /**
   * EFFECTS - PREVENT BODY SCROLL ON MOBILE
   */
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  /**
   * EVENT HANDLERS
   */

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleToggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const handleOperationClick = useCallback(
    (operationId: string) => {
      if (operationId === activeOperation) return;
      onOperationChange(operationId);

      if (isMobile) {
        setIsMobileOpen(false);
      }
    },
    [activeOperation, onOperationChange, isMobile]
  );

  /**
   * RENDER SIDEBAR OPERATIONS LIST
   */
  const renderOperationsList = useCallback(
    (showHeader = true) => (
      <nav className="flex flex-col h-full">
        {/* Header Section */}
        {showHeader && (
          <div
            className={cn(
              'px-4 py-3 border-b flex-shrink-0',
              theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
            )}
          >
            {sidebarHeader ? (
              sidebarHeader
            ) : (
              <h3
                className={cn(
                  'text-xs font-bold uppercase tracking-widest',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                Quick Actions
              </h3>
            )}
          </div>
        )}

        {/* Operations List - Scales with content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          <ul className="space-y-2">
            {operations.map((operation) => {
              const isActive = operation.id === activeOperation;
              const isDisabled = operation.disabled;

              return (
                <li key={operation.id}>
                  <button
                    onClick={() => !isDisabled && handleOperationClick(operation.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'text-sm font-medium transition-all duration-200 ease-out',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'group relative',

                      // Active state - Premium gradient
                      isActive && theme === 'dark' && 'bg-linear-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10',
                      isActive && theme === 'light' && 'bg-linear-to-r from-blue-500/15 to-cyan-500/15 text-blue-700 border border-blue-300/50 shadow-md shadow-blue-500/10',

                      // Inactive state - Smooth hover
                      !isActive && !isDisabled && theme === 'dark' && 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent',
                      !isActive && !isDisabled && theme === 'light' && 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent',

                      // Disabled state
                      isDisabled && 'opacity-50 cursor-not-allowed',

                      // Focus ring
                      theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50'
                    )}
                    aria-label={operation.description || operation.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={operation.description}
                  >
                    {/* Icon Container */}
                    {operation.icon && (
                      <span
                        className={cn(
                          'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                          'transition-all duration-200',
                          isActive && theme === 'dark' && 'text-cyan-400 drop-shadow-lg',
                          isActive && theme === 'light' && 'text-blue-600 drop-shadow-lg',
                          !isActive && theme === 'dark' && 'text-gray-500 group-hover:text-gray-400',
                          !isActive && theme === 'light' && 'text-gray-400 group-hover:text-gray-500'
                        )}
                      >
                        {operation.icon}
                      </span>
                    )}

                    {/* Label & Badge */}
                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                      <span className="flex-1 text-left truncate text-sm">
                        {operation.label}
                      </span>

                      {/* Badge */}
                      {operation.badge && (
                        <span
                          className={cn(
                            'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold',
                            'transition-all duration-200',
                            isActive && theme === 'dark' && 'bg-cyan-500/30 text-cyan-300',
                            isActive && theme === 'light' && 'bg-blue-500/20 text-blue-700',
                            !isActive && theme === 'dark' && 'bg-gray-800 text-gray-400',
                            !isActive && theme === 'light' && 'bg-gray-200 text-gray-600'
                          )}
                        >
                          {operation.badge}
                        </span>
                      )}
                    </div>

                    {/* Active Indicator Dot */}
                    {isActive && (
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          'animate-pulse',
                          theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'
                        )}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer Section */}
        {sidebarFooter && (
          <div
            className={cn(
              'px-4 py-3 border-t flex-shrink-0',
              theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
            )}
          >
            {sidebarFooter}
          </div>
        )}
      </nav>
    ),
    [operations, activeOperation, theme, handleOperationClick, sidebarHeader, sidebarFooter]
  );

  /**
   * EARLY RETURN - NO SIDEBAR
   */
  if (hideSidebar) {
    return (
      <div className={cn('w-full h-full flex flex-col', className)}>
        {children}
      </div>
    );
  }

  /**
   * MAIN RENDER - PERFECT SPACING STRUCTURE
   */

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Main Container - Full Height Flex */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Primary Workspace - Fills available space perfectly */}
        <div className="flex-1 overflow-auto relative flex flex-col">
          {/* Content fills entire workspace */}
          <div className="flex-1 w-full">
            {children}
          </div>

          {/* Desktop Toggle Button - Positioned absolutely */}
          {!isMobile && (
            <button
              onClick={handleToggleCollapse}
              className={cn(
                'absolute top-6 right-6 p-2.5 rounded-lg',
                'transition-all duration-300 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'z-20 backdrop-blur-xl',
                'group',
                theme === 'dark'
                  ? 'bg-gray-900/90 border border-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800/90 focus:ring-cyan-500/50 focus:ring-offset-gray-950'
                  : 'bg-white/90 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-white/95 focus:ring-blue-500/50 focus:ring-offset-white',
                'shadow-lg hover:shadow-xl hover:scale-110 active:scale-95'
              )}
              aria-label={isCollapsed ? 'Show actions' : 'Hide actions'}
              aria-expanded={!isCollapsed}
              title={isCollapsed ? 'Show quick actions (→)' : 'Hide quick actions (←)'}
            >
              {isCollapsed ? (
                <ChevronLeft className="w-5 h-5 group-hover:scale-125 transition-transform" />
              ) : (
                <ChevronRight className="w-5 h-5 group-hover:scale-125 transition-transform" />
              )}
            </button>
          )}

          {/* Mobile Toggle Button */}
          {isMobile && (
            <button
              onClick={handleToggleMobile}
              className={cn(
                'fixed bottom-6 right-6 p-3 rounded-xl shadow-2xl',
                'z-40 transition-all duration-300 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                theme === 'dark'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-950'
                  : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500/50 focus:ring-offset-white',
                'hover:scale-110 active:scale-95',
                isMobileOpen && 'opacity-0 pointer-events-none'
              )}
              aria-label="Toggle quick actions"
              aria-expanded={isMobileOpen}
              title="Show quick actions"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Desktop Right Sidebar - Adjacent to content, no gap */}
        {!isMobile && !isCollapsed && (
          <aside
            className={cn(
              'w-[340px] border-l transition-all duration-300 ease-out',
              'flex flex-col overflow-hidden',
              'flex-shrink-0',
              theme === 'dark'
                ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
                : 'bg-white/95 backdrop-blur-xl border-gray-200/60'
            )}
            role="complementary"
            aria-label="Quick actions sidebar"
          >
            {/* Sidebar Content - Full Height, Dynamic Scaling */}
            <div className="h-full flex flex-col min-w-0 overflow-hidden">
              {renderOperationsList(true)}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Overlay & Sidebar */}
      {isMobile && (
        <>
          {/* Premium Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-30',
              'transition-all duration-300 ease-out',
              isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={handleCloseMobile}
            aria-hidden="true"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Mobile Sidebar Panel - Full Height, Dynamic Content */}
          <aside
            className={cn(
              'fixed top-0 right-0 h-full w-[340px]',
              'border-l transition-all duration-300 ease-out',
              'z-40 flex flex-col overflow-hidden',
              theme === 'dark'
                ? 'bg-gray-900/98 border-gray-800/50'
                : 'bg-white/98 border-gray-200/60',
              isMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-lg'
            )}
            aria-hidden={!isMobileOpen}
            role="complementary"
            aria-label="Quick actions sidebar"
          >
            {/* Mobile Header with Close Button */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
                theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
              )}
            >
              <h3
                className={cn(
                  'text-xs font-bold uppercase tracking-widest',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                Quick Actions
              </h3>
              <button
                onClick={handleCloseMobile}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'group',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800 focus:ring-cyan-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-blue-500'
                )}
                aria-label="Close quick actions"
              >
                <ChevronLeft className="w-5 h-5 group-hover:scale-125 transition-transform" />
              </button>
            </div>

            {/* Mobile Sidebar Content - Full Height, Dynamic */}
            <div className="flex-1 overflow-hidden flex flex-col min-w-0">
              {renderOperationsList(false)}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

ContentLayout.displayName = 'ContentLayout';

export default ContentLayout;