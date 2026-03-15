// In ContentLayout.tsx
import React, { useCallback, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../app/store/store';
import { MoreVertical, X, Sparkles } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import { LayoutMainContent } from './LayoutMainContent';
import { QuickActionsSidebar, type DockSide} from './QuickActionsSidebar';
import { type AppDispatch } from '../../../app/store/store';
import { type BadgeSpec } from '../../utils/Badge';

export interface ContentLayoutProps {
  operations: Operation[];
  activeOperation: string;
  onOperationChange: (operationId: string) => void;
  children: React.ReactNode;
  className?: string;
  hideSidebar?: boolean;
  initialCollapsedSide?: boolean;
  initialCollapsedUp?: boolean;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  headerTitle?: string;
  defaultOperation?: string;
  contextTitle?: string;
  isLoading?: boolean;
  renderExtraContent?: () => React.ReactNode;
}

// Update Operation to match ModuleOperation's badge type
export interface Operation {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: string | number | BadgeSpec | BadgeSpec[]; // Match ModuleOperation
}

const MOBILE_BREAKPOINT = 1024;
const LS_KEY_DOCK = 'custocare.quickActionsDockSide';

function safeGetDockSide(): DockSide {
  if (typeof window === 'undefined') return 'right';
  const raw = window.localStorage.getItem(LS_KEY_DOCK);
  return raw === 'left' || raw === 'right' ? raw : 'right';
}

function safeSetDockSide(side: DockSide) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY_DOCK, side);
}

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  operations,
  activeOperation,
  onOperationChange,
  children,
  className,
  hideSidebar = false,
  initialCollapsedSide = false,
  initialCollapsedUp = false,
  sidebarHeader,
  sidebarFooter,
  headerTitle,
  contextTitle,
  isLoading = false,
  renderExtraContent,
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  // Get current navigation state from Redux
  const navigationState = useSelector((state: RootState) => 
    state.moduleNavigation.current
  );

  // Docking only on desktop
  const [dockSide, setDockSide] = useState<DockSide>(() => safeGetDockSide());

  const [collapsedSide, setCollapsedSide] = useState<boolean>(initialCollapsedSide);
  const [collapsedUp, setCollapsedUp] = useState<boolean>(initialCollapsedUp);

  // Mobile drawer (not dockable)
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [mobileTopOffset, setMobileTopOffset] = useState(0);

  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Track previous isMobile state to detect transitions
  const prevIsMobileRef = useRef(isMobile);

  // Align mobile drawer below header
  useEffect(() => {
    if (!isMobile) return;

    const compute = () => {
      const rect = headerRef.current?.getBoundingClientRect();
      setMobileTopOffset(rect ? rect.bottom : 0);
    };

    compute();
    window.addEventListener('resize', compute, { passive: true });
    return () => window.removeEventListener('resize', compute);
  }, [isMobile]);

  // Lock scroll when drawer open
  useEffect(() => {
    if (!isMobile) return;
    if (!mobileOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileOpen]);

  // Handle mobile to desktop transition - close mobile drawer
  useEffect(() => {
    // Only run when transitioning from mobile to desktop
    if (prevIsMobileRef.current && !isMobile) {
      // Use requestAnimationFrame to defer state update
      const frameId = requestAnimationFrame(() => {
        setMobileOpen(false);
      });
      
      return () => cancelAnimationFrame(frameId);
    }
    
    // Update ref for next comparison
    prevIsMobileRef.current = isMobile;
  }, [isMobile]);

  const scrollMainToTop = useCallback(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onSelectOperation = useCallback(
    (id: string) => {
      if (id === activeOperation) return;
      onOperationChange(id);
      scrollMainToTop();
      
      // Dispatch navigation action when operation changes
      if (navigationState.operation !== id) {
        dispatch({
          type: 'moduleNavigation/navigate',
          payload: {
            operation: id,
            action: undefined, // Clear sub-actions when changing main operation
            timestamp: Date.now(),
          }
        });
      }
      
      if (isMobile) setMobileOpen(false);
    },
    [activeOperation, isMobile, onOperationChange, scrollMainToTop, navigationState.operation, dispatch]
  );

  const onDockChange = useCallback((side: DockSide) => {
    setDockSide(side);
    safeSetDockSide(side);
  }, []);

  const onToggleCollapsedSide = useCallback(() => {
    setCollapsedSide((p) => !p);
  }, []);

  const onToggleCollapsedUp = useCallback(() => {
    setCollapsedUp((p) => !p);
  }, []);

  const headerBaseClass = useMemo(() => {
    return cn(
      'flex items-center justify-between gap-3 px-4 py-3.5 border-b flex-shrink-0 w-full',
      theme === 'dark'
        ? 'bg-gray-900/80 border-gray-800/40 backdrop-blur-xl'
        : 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
    );
  }, [theme]);

  if (hideSidebar) {
    return (
      <div className={cn('w-full h-full flex flex-col', className)}>
        <LayoutMainContent scrollRef={mainScrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading content...</p>
              </div>
            </div>
          ) : (
            <>
              {children}
              {renderExtraContent && renderExtraContent()}
            </>
          )}
        </LayoutMainContent>
      </div>
    );
  }

  // Docking behavior only on desktop
  const desktopDockSide: DockSide = isMobile ? 'right' : dockSide;

  return (
    <div className={cn('w-full h-full flex flex-col mt-1', className)}>
      {/* Mobile header */}
      {isMobile && (
        <div ref={headerRef} className={headerBaseClass}>
          <div className="flex-1 min-w-0">
            {headerTitle && (
              <h1
                className={cn(
                  'text-base font-semibold tracking-tight truncate',
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                )}
              >
                {headerTitle}
                {isLoading && (
                  <span className="ml-2 text-sm text-gray-500 animate-pulse">
                    (Loading...)
                  </span>
                )}
              </h1>
            )}
          </div>
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className={cn(
              // 👇 mobile-first top spacing
              'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl mt-3',
              // optional: slightly less margin on larger screens
              'sm:mt-3 md:mt-2',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              theme === 'dark'
                ? 'text-gray-300 hover:text-cyan-300 bg-gray-800/50 hover:bg-gray-800/70 focus:ring-cyan-500/40'
                : 'text-gray-700 hover:text-blue-700 bg-gray-100/50 hover:bg-gray-100/70 focus:ring-blue-500/40'
            )}
            aria-label="Open quick actions"
            aria-expanded={mobileOpen}
            title="Quick actions"
            disabled={isLoading}
          >
            <MoreVertical className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              Actions
            </span>
          </button>

        </div>
      )}

      {/* Desktop layout: sidebar + content in separate containers */}
      <div className="flex-1 min-h-0">
          <div
            className={cn(
              // Mobile
              'h-full min-h-0 px-2 py-2',
              // Small / tablet
              'sm:px-3 sm:py-3',
              // Desktop (tighter than before)
              'lg:px-4 lg:py-1'
            )}
          >
          {/* Reduced spacing between content and sidebar (requirement #4) */}
          <div className="h-full min-h-0 flex gap-3">
            {/* Desktop: dock left */}
            {!isMobile && desktopDockSide === 'left' && (
              <QuickActionsSidebar
                operations={operations}
                activeOperation={activeOperation}
                onSelectOperation={onSelectOperation}
                dockSide={desktopDockSide}
                onDockChange={onDockChange}
                collapsedSide={collapsedSide}
                collapsedUp={collapsedUp}
                onToggleCollapsedSide={onToggleCollapsedSide}
                onToggleCollapsedUp={onToggleCollapsedUp}
                sidebarHeader={sidebarHeader}
                sidebarFooter={sidebarFooter}
                contextTitle={contextTitle}
              />
            )}

            <LayoutMainContent scrollRef={mainScrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading content...</p>
                    {navigationState.operation && (
                      <p className="text-sm text-gray-400 mt-3">
                        Current operation: {navigationState.operation}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {children}
                  {renderExtraContent && renderExtraContent()}
                </>
              )}
            </LayoutMainContent>

            {/* Desktop: dock right */}
            {!isMobile && desktopDockSide === 'right' && (
              <QuickActionsSidebar
                operations={operations}
                activeOperation={activeOperation}
                onSelectOperation={onSelectOperation}
                dockSide={desktopDockSide}
                onDockChange={onDockChange}
                collapsedSide={collapsedSide}
                collapsedUp={collapsedUp}
                onToggleCollapsedSide={onToggleCollapsedSide}
                onToggleCollapsedUp={onToggleCollapsedUp}
                sidebarHeader={sidebarHeader}
                sidebarFooter={sidebarFooter}
                contextTitle={contextTitle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer (not dockable) */}
      {isMobile && (
        <>
          <div
            className={cn(
              'fixed inset-0 z-30 transition-opacity duration-200',
              mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'
            }}
          />

          <aside
            className={cn(
              'fixed z-40 right-0 w-[340px] max-w-[90vw]',
              'flex flex-col overflow-hidden',
              'border-l shadow-2xl backdrop-blur-xl',
              theme === 'dark'
                ? 'bg-gray-900/92 border-gray-800/40'
                : 'bg-white/92 border-gray-200/50',
              'transition-transform duration-200 ease-out',
              mobileOpen ? 'translate-x-0' : 'translate-x-full'
            )}
            style={{
              top: `${mobileTopOffset}px`,
              height: `calc(100vh - ${mobileTopOffset}px)`
            }}
            aria-hidden={!mobileOpen}
            role="complementary"
            aria-label="Quick actions drawer"
          >
            {/* Simple mobile header */}
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3.5 border-b gap-3',
                theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {sidebarHeader ?? (
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center',
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30'
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
                      )}
                    >
                      <Sparkles className={cn('w-4 h-4', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')} />
                    </div>
                    <div className="min-w-0">
                      <h3 className={cn('text-sm font-semibold truncate', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
                        Quick Actions
                      </h3>
                      {contextTitle && (
                        <p className={cn('text-xs mt-0.5 truncate', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}>
                          {contextTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800/60 focus:ring-cyan-500/40'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-gray-100/60 focus:ring-blue-500/40'
                )}
                aria-label="Close quick actions"
                title="Close"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile list (reuse the same operation styling is possible, but keep simple here) */}
            <div className="flex-1 overflow-auto px-2 py-2">
              {operations.map((op) => {
                const isActive = op.id === activeOperation;
                const disabled = !!op.disabled || isLoading;

                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => (!disabled ? onSelectOperation(op.id) : undefined)}
                    disabled={disabled}
                    aria-current={isActive ? 'page' : undefined}
                    title={op.description || op.label}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-2',
                      'text-sm font-medium transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',
                      isActive &&
                        (theme === 'dark'
                          ? 'bg-gray-900 text-cyan-300 border-r-4 border-cyan-500/90'
                          : 'bg-white text-blue-700 border-r-4 border-blue-500/90'),
                      !isActive &&
                        !disabled &&
                        (theme === 'dark'
                          ? 'text-gray-400 bg-gray-900/30 hover:text-gray-200 hover:bg-gray-800/40'
                          : 'text-gray-600 bg-gray-100/30 hover:text-gray-900 hover:bg-gray-100/50'),
                      disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {op.icon && <span className="w-5 h-5 flex items-center justify-center">{op.icon}</span>}
                    <span className="flex-1 truncate text-left">{op.label}</span>
                    {isLoading && isActive && (
                      <span className="animate-pulse text-xs text-gray-500">(loading...)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

ContentLayout.displayName = 'ContentLayout';
export default ContentLayout;