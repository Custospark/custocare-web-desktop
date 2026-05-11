// ContentLayout.tsx
import React, {
  useCallback,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../app/store/store';
import { MoreVertical, X, Sparkles } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import { LayoutMainContent } from './LayoutMainContent';
import { QuickActionsSidebar, type DockSide } from './QuickActionsSidebar';
import { type BadgeSpec } from '../../utils/Badge';
import { STORAGE_KEYS } from '../Navigation/layout-components/LayoutTypes';

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

export interface Operation {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: string | number | BadgeSpec | BadgeSpec[];
}

const MOBILE_BREAKPOINT = 1024;
const LS_KEY_DOCK = 'custocare.quickActionsDockSide';
/** Same key as `Layout` / `STORAGE_KEYS.SIDEBAR_NESTED` — collapsible nav and Quick Actions are mutually exclusive on desktop. */
const LS_KEY_NESTED_NAV = STORAGE_KEYS.SIDEBAR_NESTED;
const CONTENT_SCROLL_ATTR = 'data-app-scroll-container';

function safeGetDockSide(): DockSide {
  if (typeof window === 'undefined') return 'right';
  const raw = window.localStorage.getItem(LS_KEY_DOCK);
  return raw === 'left' || raw === 'right' ? raw : 'right';
}

function safeSetDockSide(side: DockSide) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY_DOCK, side);
}

function safeGetNestedNavEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LS_KEY_NESTED_NAV) === 'true';
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
  const location = useLocation();
  const isMobile = useIsMobile(MOBILE_BREAKPOINT);

  const navigationState = useSelector((state: RootState) => state.moduleNavigation.current);

  const [dockSide, setDockSide] = useState<DockSide>(() => safeGetDockSide());
  const [nestedNavigationEnabled, setNestedNavigationEnabled] = useState<boolean>(() => safeGetNestedNavEnabled());
  const [collapsedSide, setCollapsedSide] = useState<boolean>(initialCollapsedSide);
  const [collapsedUp, setCollapsedUp] = useState<boolean>(initialCollapsedUp);

  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [mobileTopOffset, setMobileTopOffset] = useState(0);

  /**
   * IMPORTANT:
   * `scrollRef` must point to the REAL scrollable content element inside LayoutMainContent.
   * The sidebar uses this attribute to find and reset the page scroll on route changes.
   */
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  const prevIsMobileRef = useRef(isMobile);
  const prevPathnameRef = useRef(location.pathname);

  const setScrollableContainerMarker = useCallback(() => {
    const el = mainScrollRef.current;
    if (!el) return;

    el.setAttribute(CONTENT_SCROLL_ATTR, 'true');
  }, []);

  const scrollMainToTop = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = mainScrollRef.current;
    if (!el) return;

    el.scrollTo({
      top: 0,
      left: 0,
      behavior,
    });
  }, []);

  /**
   * Ensure the actual content scroll container is discoverable by the sidebar.
   */
  useLayoutEffect(() => {
    setScrollableContainerMarker();
  }, [setScrollableContainerMarker, location.pathname, isLoading]);

  /**
   * Reset page content scroll on route changes.
   * This is the critical part that solves the "new page opens at old scroll position" issue.
   */
  useLayoutEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    if (!pathnameChanged) return;

    const rafId = window.requestAnimationFrame(() => {
      scrollMainToTop('auto');
      setScrollableContainerMarker();

      if (isMobile) {
        setMobileOpen(false);
      }
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, scrollMainToTop, setScrollableContainerMarker, isMobile]);

  /**
   * Keep mobile drawer aligned directly below the mobile header.
   * ResizeObserver is more accurate than window resize alone.
   */
  useEffect(() => {
    if (!isMobile) return;

    const compute = () => {
      const rect = headerRef.current?.getBoundingClientRect();
      setMobileTopOffset(rect ? rect.bottom : 0);
    };

    compute();

    const observer =
      typeof ResizeObserver !== 'undefined' && headerRef.current
        ? new ResizeObserver(compute)
        : null;

    if (observer && headerRef.current) {
      observer.observe(headerRef.current);
    }

    window.addEventListener('resize', compute, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [isMobile]);

  /**
   * Lock body scroll when the mobile quick actions drawer is open.
   */
  useEffect(() => {
    const syncNestedMode = () => setNestedNavigationEnabled(safeGetNestedNavEnabled());

    window.addEventListener('storage', syncNestedMode);
    window.addEventListener('custocare:nested-navigation-toggle', syncNestedMode as EventListener);

    return () => {
      window.removeEventListener('storage', syncNestedMode);
      window.removeEventListener('custocare:nested-navigation-toggle', syncNestedMode as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isMobile || !mobileOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, mobileOpen]);

  /**
   * Close mobile drawer when transitioning to desktop.
   */
  useEffect(() => {
    if (prevIsMobileRef.current && !isMobile) {
      const frameId = requestAnimationFrame(() => {
        setMobileOpen(false);
      });

      return () => cancelAnimationFrame(frameId);
    }

    prevIsMobileRef.current = isMobile;
  }, [isMobile]);

  const onSelectOperation = useCallback(
    (id: string) => {
      if (id === activeOperation) return;

      onOperationChange(id);
      scrollMainToTop('smooth');

      if (navigationState.operation !== id) {
        dispatch({
          type: 'moduleNavigation/navigate',
          payload: {
            operation: id,
            action: undefined,
            timestamp: Date.now(),
          },
        });
      }

      if (isMobile) {
        setMobileOpen(false);
      }
    },
    [
      activeOperation,
      dispatch,
      isMobile,
      navigationState.operation,
      onOperationChange,
      scrollMainToTop,
    ],
  );

  const onDockChange = useCallback((side: DockSide) => {
    setDockSide(side);
    safeSetDockSide(side);
  }, []);

  const onToggleCollapsedSide = useCallback(() => {
    setCollapsedSide((prev) => !prev);
  }, []);

  const onToggleCollapsedUp = useCallback(() => {
    setCollapsedUp((prev) => !prev);
  }, []);

  const headerBaseClass = useMemo(() => {
    return cn(
      'flex items-center justify-between gap-3 px-4 py-3.5 border-b flex-shrink-0 w-full',
      theme === 'dark'
        ? 'bg-gray-900/80 border-gray-800/40 backdrop-blur-xl'
        : 'bg-white/80 border-gray-200/50 backdrop-blur-xl',
    );
  }, [theme]);

  const renderMainContent = () => (
    <LayoutMainContent scrollRef={mainScrollRef}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
          {renderExtraContent?.()}
        </>
      )}
    </LayoutMainContent>
  );

  /** Nested (collapsible) primary nav replaces module Quick Actions — never show both. */
  const shouldHideOperationsSidebar = hideSidebar || nestedNavigationEnabled;

  if (shouldHideOperationsSidebar) {
    return (
      <div className={cn('w-full h-full min-h-0 flex flex-col overflow-hidden', className)}>
        {renderMainContent()}
      </div>
    );
  }

  const desktopDockSide: DockSide = isMobile ? 'right' : dockSide;

  return (
    <div className={cn('w-full h-full min-h-0 flex flex-col overflow-hidden', className)}>
      {isMobile && (
        <div ref={headerRef} className={headerBaseClass}>
          <div className="flex-1 min-w-0">
            {headerTitle && (
              <h1
                className={cn(
                  'text-base font-semibold tracking-tight truncate',
                  theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
                )}
              >
                {headerTitle}
                {isLoading && (
                  <span className="ml-2 text-sm text-gray-500 animate-pulse">(Loading...)</span>
                )}
              </h1>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className={cn(
              'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl mt-3',
              'sm:mt-3 md:mt-2',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              theme === 'dark'
                ? 'text-gray-300 hover:text-cyan-300 bg-gray-800/50 hover:bg-gray-800/70 focus:ring-cyan-500/40'
                : 'text-gray-700 hover:text-blue-700 bg-gray-100/50 hover:bg-gray-100/70 focus:ring-blue-500/40',
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

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          className={cn(
            'h-full min-h-0 px-2 py-2',
            'sm:px-3 sm:py-3',
            'lg:px-4 lg:py-1',
          )}
        >
          <div className="h-full min-h-0 flex gap-3 overflow-hidden">
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

            <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
              {renderMainContent()}
            </div>

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

      {isMobile && (
        <>
          <div
            className={cn(
              'fixed inset-0 z-30 transition-opacity duration-200',
              mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            style={{
              backgroundColor:
                theme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)',
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
              mobileOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            style={{
              top: `${mobileTopOffset}px`,
              height: `calc(100vh - ${mobileTopOffset}px)`,
            }}
            aria-hidden={!mobileOpen}
            role="complementary"
            aria-label="Quick actions drawer"
          >
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3.5 border-b gap-3',
                theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50',
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
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30',
                      )}
                    >
                      <Sparkles
                        className={cn(
                          'w-4 h-4',
                          theme === 'dark' ? 'text-cyan-400' : 'text-blue-600',
                        )}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'text-sm font-semibold truncate',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
                        )}
                      >
                        Quick Actions
                      </h3>

                      {contextTitle && (
                        <p
                          className={cn(
                            'text-xs mt-0.5 truncate',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500',
                          )}
                        >
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
                    : 'text-gray-600 hover:text-blue-700 hover:bg-gray-100/60 focus:ring-blue-500/40',
                )}
                aria-label="Close quick actions"
                title="Close"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      disabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {op.icon && (
                      <span className="w-5 h-5 flex items-center justify-center">{op.icon}</span>
                    )}
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
