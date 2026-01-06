import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/store';
import { ChevronRight, ChevronLeft, MoreVertical, X, Sparkles } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import { type ReactNode } from 'react';

/**
 * ============================================================================
 * CONTENT LAYOUT COMPONENT - ENHANCED WITH SMOOTH ANIMATIONS
 * ============================================================================
 * 
 * Enterprise-Grade Right Sidebar with Smooth Scrolling & Premium Animations
 * 
 * Enhanced Features:
 * - Smooth sidebar toggle animations with transform properties
 * - CSS transitions for all interactive elements
 * - Overlay fade-in/out effects
 * - Smooth scrolling behavior for content
 * - Enhanced mobile experience with backdrop blur
 * - All existing premium design features preserved
 */

/* ============================================================================
   TYPE DEFINITIONS
============================================================================ */

export interface Operation {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: number | string;
}

export interface ContentLayoutProps {
  operations: Operation[];
  activeOperation: string;
  onOperationChange: (operationId: string) => void;
  defaultOperation?: string;
  children: React.ReactNode;
  initialCollapsed?: boolean;
  className?: string;
  hideSidebar?: boolean;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  headerTitle?: string;
}

/* ============================================================================
   CONSTANTS
============================================================================ */

const MOBILE_BREAKPOINT = 1024;

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
  headerTitle,
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentStartRef = useRef<HTMLDivElement>(null);
  const [contentTopOffset, setContentTopOffset] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

      if (contentStartRef.current) {
        const rect = contentStartRef.current.getBoundingClientRect();
        setContentTopOffset(rect.top);
      }
    };

    window.addEventListener('resize', handleResize);

    if (contentStartRef.current) {
      const rect = contentStartRef.current.getBoundingClientRect();
      setContentTopOffset(rect.top);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  /**
   * EFFECTS - SMOOTH SCROLLING BEHAVIOR
   */
  useEffect(() => {
    // Smooth scroll to top when sidebar opens/closes
    if (!isMobile && !isTransitioning) {
      const mainContent = document.querySelector('.main-content-area');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isCollapsed, isMobile, isTransitioning]);

  /**
   * EFFECTS - PREVENT BODY SCROLL ON MOBILE
   */
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // Prevent layout shift
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isMobile, isMobileOpen]);

  /**
   * EVENT HANDLERS WITH SMOOTH TRANSITIONS
   */

  const handleToggleCollapse = useCallback(() => {
    setIsTransitioning(true);
    setIsCollapsed((prev) => !prev);
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleToggleMobile = useCallback(() => {
    setIsTransitioning(true);
    setIsMobileOpen((prev) => !prev);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsTransitioning(true);
    setIsMobileOpen(false);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  }, []);

  const handleOperationClick = useCallback(
    (operationId: string) => {
      if (operationId === activeOperation) return;
      
      // Smooth scroll to top when changing operations
      const mainContent = document.querySelector('.main-content-area');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      onOperationChange(operationId);

      if (isMobile) {
        setIsTransitioning(true);
        setIsMobileOpen(false);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 250);
      }
    },
    [activeOperation, onOperationChange, isMobile]
  );

  /**
   * RENDER SIDEBAR OPERATIONS LIST - ENHANCED WITH SMOOTH ANIMATIONS
   */
  const renderOperationsList = useCallback(
    (showHeader = true) => (
      <nav className="flex flex-col h-full">
        {/* Header Section - Enhanced with fade-in animation */}
        {showHeader && !isMobile && (
          <div
            className={cn(
              'px-4 py-3.5 border-b flex-shrink-0',
              'transition-all duration-300 ease-out',
              theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50'
            )}
            style={{
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {sidebarHeader ? (
              sidebarHeader
            ) : (
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center relative',
                  'transition-all duration-300 ease-out',
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30' 
                    : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
                )}>
                  <Sparkles className={cn(
                    'w-3.5 h-3.5',
                    'transition-transform duration-300 hover:rotate-12',
                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h3
                    className={cn(
                      'text-sm font-semibold',
                      'transition-colors duration-300',
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    )}
                  >
                    Quick Actions
                  </h3>
                  <p className={cn(
                    'text-xs mt-1',
                    'transition-colors duration-300',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    Frequently used tools
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operations List - Enhanced with staggered animations */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2"
          style={{
            scrollBehavior: 'smooth'
          }}
        >
          <ul className="space-y-2">
            {operations.map((operation, index) => {
              const isActive = operation.id === activeOperation;
              const isDisabled = operation.disabled;

              return (
                <li 
                  key={operation.id} 
                  className="relative"
                  style={{
                    animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`
                  }}
                >
                  {/* DIAMOND INDICATOR - Animated entrance */}
                  {isActive && (
                    <div className={cn(
                      'absolute -left-2 top-1/2 -translate-y-1/2 z-20',
                      'w-3 h-3 transform rotate-45',
                      'transition-all duration-300 ease-out',
                      'animate-pulse-subtle',
                      theme === 'dark' 
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/60'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/60'
                    )} />
                  )}

                  {/* OPERATION ITEM - Enhanced with smooth transitions */}
                  <div
                    className={cn(
                      'relative',
                      'transition-all duration-300 ease-out',
                      isActive &&
                        (theme === 'dark'
                          ? 'ring-2 ring-cyan-500/80 rounded-xl shadow-lg shadow-cyan-500/30 mr-[2px]'
                          : 'ring-2 ring-blue-500/80 rounded-xl shadow-lg shadow-blue-500/30 mr-[2px]')
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => !isDisabled && handleOperationClick(operation.id)}
                      disabled={isDisabled}
                      aria-label={operation.description || operation.label}
                      aria-current={isActive ? 'page' : undefined}
                      title={operation.description}
                      className={cn(
                        // Base styles
                        'w-full flex items-center gap-3 px-3.5 py-2.5 relative z-10',
                        'text-sm font-medium transition-all duration-300 ease-out',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'group transform hover:-translate-y-0.5 active:translate-y-0',

                        // Active state
                        isActive &&
                          (theme === 'dark'
                            ? 'bg-gray-900 text-cyan-300 rounded-xl border-r-4 border-cyan-500/90 shadow-inner shadow-cyan-500/10'
                            : 'bg-white text-blue-700 rounded-xl border-r-4 border-blue-500/90 shadow-inner shadow-blue-500/10'),

                        // Inactive state
                        !isActive &&
                          !isDisabled &&
                          (theme === 'dark'
                            ? 'text-gray-400 bg-gray-900/30 hover:text-gray-200 hover:bg-gray-800/40 rounded-lg hover:ring-1 hover:ring-gray-700/40 hover:border-r-2 hover:border-gray-700/50 hover:shadow-md hover:shadow-gray-900/20'
                            : 'text-gray-600 bg-gray-100/30 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg hover:ring-1 hover:ring-gray-300/40 hover:border-r-2 hover:border-gray-300/50 hover:shadow-md hover:shadow-gray-200/20'),

                        // Disabled state
                        isDisabled &&
                          (theme === 'dark'
                            ? 'opacity-40 cursor-not-allowed text-gray-600'
                            : 'opacity-40 cursor-not-allowed text-gray-400'),

                        // Focus ring
                        theme === 'dark'
                          ? 'focus:ring-cyan-500/50'
                          : 'focus:ring-blue-500/50'
                      )}
                    >
                      {/* Icon with smooth transitions */}
                      {operation.icon && (
                        <span
                          className={cn(
                            'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md',
                            'transition-all duration-300 ease-out',
                            isActive &&
                              (theme === 'dark'
                                ? 'text-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-500/40 shadow-sm shadow-cyan-500/30'
                                : 'text-blue-600 bg-blue-500/15 ring-1 ring-blue-500/40 shadow-sm shadow-blue-500/30'),
                            !isActive &&
                              (theme === 'dark'
                                ? 'text-gray-500 bg-gray-800/30 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:ring-1 group-hover:ring-cyan-500/20 group-hover:scale-110'
                                : 'text-gray-500 bg-gray-200/50 group-hover:text-blue-600 group-hover:bg-blue-500/10 group-hover:ring-1 group-hover:ring-blue-500/20 group-hover:scale-110')
                          )}
                        >
                          {operation.icon}
                        </span>
                      )}

                      {/* Label and badge */}
                      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                        <span className="truncate text-left transition-colors duration-300">
                          {operation.label}
                        </span>

                        {operation.badge && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-bold',
                              'transition-all duration-300 ease-out',
                              isActive &&
                                (theme === 'dark'
                                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 ring-1 ring-cyan-500/40 shadow-md shadow-cyan-500/20'
                                  : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 ring-1 ring-blue-500/40 shadow-md shadow-blue-500/20'),
                              !isActive &&
                                (theme === 'dark'
                                  ? 'bg-gray-800 text-gray-400 ring-1 ring-gray-700/30 group-hover:bg-gray-700 group-hover:text-gray-300 group-hover:scale-105'
                                  : 'bg-gray-200 text-gray-600 ring-1 ring-gray-300/30 group-hover:bg-gray-300 group-hover:text-gray-700 group-hover:scale-105')
                            )}
                          >
                            {operation.badge}
                          </span>
                        )}
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="flex-shrink-0 ml-2">
                          <div
                            className={cn(
                              'w-2 h-2 rotate-45 transition-all duration-300',
                              'animate-pulse',
                              theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'
                            )}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer Section - Smooth fade in */}
        {sidebarFooter && (
          <div
            className={cn(
              'px-4 py-3.5 border-t flex-shrink-0',
              'transition-all duration-300 ease-out',
              theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50'
            )}
            style={{
              animation: 'fadeInUp 0.3s ease-out'
            }}
          >
            {sidebarFooter}
          </div>
        )}
      </nav>
    ),
    [operations, activeOperation, theme, handleOperationClick, sidebarHeader, sidebarFooter, isMobile]
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
   * CSS ANIMATIONS
   */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .animate-pulse-subtle {
      animation: pulse-subtle 2s ease-in-out infinite;
    }
    
    .backdrop-blur-transition {
      backdrop-filter: blur(0px);
      transition: backdrop-filter 0.3s ease-out;
    }
    
    .backdrop-blur-transition.active {
      backdrop-filter: blur(8px);
    }
    
    .smooth-scroll {
      scroll-behavior: smooth;
    }
    
    .transition-width {
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .transition-transform {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sidebar-enter {
      transform: translateX(100%);
    }
    
    .sidebar-enter-active {
      transform: translateX(0);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .sidebar-exit {
      transform: translateX(0);
    }
    
    .sidebar-exit-active {
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(style);

  /**
   * MAIN RENDER - ENHANCED WITH SMOOTH ANIMATIONS
   */

  return (
    <div className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Mobile Header - Enhanced with smooth transitions */}
      {isMobile && (
        <div
          ref={contentStartRef}
          className={cn(
            'flex items-center justify-between gap-3 px-4 py-3.5 border-b flex-shrink-0 w-full',
            'transition-all duration-300 ease-out',
            theme === 'dark'
              ? 'bg-gray-900/80 border-gray-800/40 backdrop-blur-xl'
              : 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
          )}
        >
          <div className="flex-1 min-w-0">
            {headerTitle && (
              <h1
                className={cn(
                  'text-base font-semibold tracking-tight truncate',
                  'transition-colors duration-300',
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                )}
              >
                {headerTitle}
              </h1>
            )}
          </div>

          {/* Quick Actions Button - Enhanced with smooth hover effects */}
          <button
            onClick={handleToggleMobile}
            className={cn(
              'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl',
              'transition-all duration-300 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'group/btn transform hover:-translate-y-0.5 active:translate-y-0',
              theme === 'dark'
                ? 'text-gray-300 hover:text-cyan-400 bg-gray-800/50 hover:bg-gray-800/70 focus:ring-cyan-500/50'
                : 'text-gray-700 hover:text-blue-600 bg-gray-100/50 hover:bg-gray-100/70 focus:ring-blue-500/50',
              'backdrop-blur-xl',
              'shadow-lg hover:shadow-xl'
            )}
            aria-label="Open quick actions"
            aria-expanded={isMobileOpen}
            title="Quick actions"
          >
            <MoreVertical className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" />
            <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-300">
              Actions
            </span>
          </button>
        </div>
      )}

      {/* Main Container - Enhanced with smooth transitions */}
      <div className="flex-1 flex overflow-hidden relative lg:mt-7">
        {/* Main Content Area - Enhanced with smooth scrolling */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out">
          <div
            ref={!isMobile ? contentStartRef : undefined}
            className="flex-1 w-full relative group flex flex-col min-h-0 smooth-scroll"
          >
            {/* Scrollable content container */}
            <div className="flex-1 overflow-auto w-full main-content-area smooth-scroll">
              {children}
            </div>

            {/* Desktop Toggle Button - Enhanced with smooth animations */}
            {!isMobile && (
              <button
                onClick={handleToggleCollapse}
                className={cn(
                  'absolute top-6 right-6 p-2.5 rounded-xl',
                  'transition-all duration-300 ease-out',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'z-20 backdrop-blur-xl',
                  'group/toggle transform hover:-translate-y-0.5 active:translate-y-0',
                  theme === 'dark'
                    ? 'bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 focus:ring-cyan-500/50 focus:ring-offset-gray-950'
                    : 'bg-white/80 border border-gray-300/50 text-gray-600 hover:text-blue-600 hover:border-blue-500/50 focus:ring-blue-500/50 focus:ring-offset-white',
                  'shadow-xl hover:shadow-2xl'
                )}
                aria-label={isCollapsed ? 'Show actions' : 'Hide actions'}
                aria-expanded={!isCollapsed}
                title={isCollapsed ? 'Show quick actions' : 'Hide quick actions'}
              >
                {isCollapsed ? (
                  <ChevronLeft className="w-4 h-4 group-hover/toggle:scale-125 transition-transform duration-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 group-hover/toggle:scale-125 transition-transform duration-300" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Desktop Right Sidebar - Enhanced with smooth width transitions */}
        {!isMobile && (
          <aside
            ref={sidebarRef}
            className={cn(
              'border-l transition-all duration-300 ease-out',
              'flex flex-col overflow-hidden',
              'flex-shrink-0 ml-4 md:ml-8',
              'transition-width',
              isCollapsed ? 'w-0 opacity-0' : 'w-[320px] opacity-100',
              theme === 'dark'
                ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/40'
                : 'bg-white/95 backdrop-blur-xl border-gray-200/50',
              'shadow-xl'
            )}
            role="complementary"
            aria-label="Quick actions sidebar"
            style={{
              transform: isCollapsed ? 'translateX(20px)' : 'translateX(0)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div className="h-full flex flex-col min-h-0 min-w-0">
              {renderOperationsList(true)}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Overlay - Enhanced with smooth backdrop blur */}
      {isMobile && (
        <>
          <div
            className={cn(
              'fixed inset-0 z-30 pointer-events-none',
              'transition-all duration-300 ease-out backdrop-blur-transition',
              isMobileOpen ? 'opacity-100 pointer-events-auto active' : 'opacity-0'
            )}
            onClick={handleCloseMobile}
            aria-hidden="true"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
              transition: 'opacity 0.3s ease-out, backdrop-filter 0.3s ease-out'
            }}
          />

          {/* Mobile Sidebar Panel - Enhanced with smooth slide-in animation */}
          <aside
            className={cn(
              'fixed right-0 w-[300px]',
              'z-40 flex flex-col overflow-hidden border-l',
              'transition-transform duration-300 ease-out',
              theme === 'dark'
                ? 'bg-gray-900/95 border-gray-800/40'
                : 'bg-white/95 border-gray-200/50',
              isMobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-xl',
              'backdrop-blur-xl'
            )}
            style={{
              top: `${contentTopOffset}px`,
              height: `calc(100vh - ${contentTopOffset}px)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease-out'
            }}
            aria-hidden={!isMobileOpen}
            role="complementary"
            aria-label="Quick actions sidebar"
          >
            {/* Mobile Header - Enhanced with smooth transitions */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0 gap-3',
                'transition-all duration-300 ease-out',
                theme === 'dark' 
                  ? 'border-gray-800/40 bg-gray-900/80' 
                  : 'border-gray-200/50 bg-white/80'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center',
                  'transition-all duration-300 ease-out',
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30' 
                    : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
                )}>
                  <Sparkles className={cn(
                    'w-3.5 h-3.5 transition-transform duration-300',
                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                  )} />
                </div>
                <div className="min-w-0">
                  <h3
                    className={cn(
                      'text-sm font-semibold truncate',
                      'transition-colors duration-300',
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    )}
                  >
                    Quick Actions
                  </h3>
                  <p className={cn(
                    'text-xs mt-1 truncate',
                    'transition-colors duration-300',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    Tap to navigate
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseMobile}
                className={cn(
                  'p-2 rounded-lg',
                  'transition-all duration-300 ease-out',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'group/close transform hover:-translate-y-0.5 active:translate-y-0',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/60 focus:ring-blue-500/50',
                  'hover:scale-110'
                )}
                aria-label="Close quick actions"
                title="Close"
              >
                <X className="w-4 h-4 group-hover/close:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 min-w-0 smooth-scroll">
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