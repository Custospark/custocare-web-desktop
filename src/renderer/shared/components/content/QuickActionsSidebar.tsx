import React, { useMemo, type ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/store';
import {
  ChevronLeft,
  ChevronRight,
  LayoutPanelLeft,
  PanelRight,
  Sparkles,
  Maximize2,
  X,
  Pin,
  PinOff,
  Menu,
  Minimize2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

export type DockSide = 'left' | 'right';

export interface Operation {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: number | string;
}

export interface QuickActionsSidebarProps {
  operations: Operation[];
  activeOperation: string;
  onSelectOperation: (id: string) => void;

  dockSide: DockSide;
  onDockChange: (side: DockSide) => void;

  collapsedSide: boolean;
  collapsedUp: boolean;
  onToggleCollapsedSide: () => void;
  onToggleCollapsedUp: () => void;

  contextTitle?: string;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;

  onClose?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  onFloat?: () => void;
  isFloating?: boolean;
  onAutoHide?: () => void;
  isAutoHidden?: boolean;
}

export const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({
  operations,
  activeOperation,
  onSelectOperation,
  dockSide,
  onDockChange,
  collapsedSide,
  collapsedUp,
  onToggleCollapsedSide,
  onToggleCollapsedUp,
  contextTitle,
  sidebarHeader,
  sidebarFooter,
  onClose,
  onTogglePin,
  isPinned = true,
  onFloat,
  isFloating = false,
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const isDockLeft = dockSide === 'left';
  const borderClass = theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50';
  const bgClass = theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95';
  const menuBgClass = theme === 'dark' ? 'bg-gray-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';

  // Master toggle - handles opening sidebar when fully collapsed
  const handleMenuToggle = useCallback(() => {
    // If fully collapsed, open the sidebar
    if (collapsedSide && collapsedUp) {
      onToggleCollapsedSide();
      onToggleCollapsedUp();
      setShowMenu(false);
    } else {
      // Otherwise, show menu
      setShowMenu(!showMenu);
    }
  }, [collapsedSide, collapsedUp, onToggleCollapsedSide, onToggleCollapsedUp, showMenu]);

  // Header component
  const headerNode = useMemo(() => {
    if (sidebarHeader) return sidebarHeader;

    return (
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
            theme === 'dark'
              ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30'
              : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
          )}
        >
          <Sparkles className={cn('w-4 h-4', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')} />
        </div>

        {!collapsedSide && (
          <div className="min-w-0">
            <h3 className={cn('text-sm font-semibold truncate', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
              Quick Actions
            </h3>
            {contextTitle && (
              <p
                className={cn('text-xs mt-0.5 truncate', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}
                title={contextTitle}
              >
                {contextTitle}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }, [collapsedSide, contextTitle, sidebarHeader, theme]);

  // Compact header (when collapsed sideways)
  const compactHeaderNode = useMemo(() => (
    <div className="flex flex-col items-center py-3">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          theme === 'dark'
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30'
            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
        )}
      >
        <Sparkles className={cn('w-5 h-5', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')} />
      </div>
    </div>
  ), [theme]);

  // Menu options
  const menuOptions = useMemo(() => [
    {
      id: 'toggle-sidebar',
      label: collapsedSide ? 'Expand Sidebar Width' : 'Collapse Sidebar Width',
      icon: collapsedSide ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />,
      action: () => {
        onToggleCollapsedSide();
        setShowMenu(false);
      }
    },
    {
      id: 'toggle-list',
      label: collapsedUp ? 'Expand Operations List' : 'Collapse Operations List',
      icon: collapsedUp ? <Minimize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />,
      action: () => {
        onToggleCollapsedUp();
        setShowMenu(false);
      }
    },
    {
      id: 'divider-1',
      isDivider: true
    },
    ...(onFloat ? [{
      id: 'float',
      label: isFloating ? 'Dock Sidebar' : 'Float Sidebar',
      icon: <Maximize2 className="w-4 h-4" />,
      action: () => {
        onFloat();
        setShowMenu(false);
      }
    }] : []),
    ...(onTogglePin ? [{
      id: 'pin',
      label: isPinned ? 'Unpin Sidebar' : 'Pin Sidebar',
      icon: isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
      action: () => {
        onTogglePin();
        setShowMenu(false);
      }
    }] : []),
    ...(onClose ? [{
      id: 'divider-2',
      isDivider: true
    }, {
      id: 'close',
      label: 'Close Sidebar',
      icon: <X className="w-4 h-4" />,
      action: () => {
        onClose();
        setShowMenu(false);
      },
      className: theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-100'
    }] : []),
  ], [collapsedSide, collapsedUp, onToggleCollapsedSide, onToggleCollapsedUp, onFloat, isFloating, onTogglePin, isPinned, onClose, theme]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (menuRef.current && !menuRef.current.contains(target) && showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Compact operations (icon-only mode)
  const compactOperations = useMemo(() => (
    <div className="flex-1 flex flex-col items-center py-2 gap-2 overflow-auto">
      {operations.map((operation) => {
        const isActive = operation.id === activeOperation;
        const isDisabled = !!operation.disabled;

        return (
          <button
            key={operation.id}
            type="button"
            onClick={() => !isDisabled && onSelectOperation(operation.id)}
            disabled={isDisabled}
            title={operation.label}
            aria-label={operation.label}
            className={cn(
              'relative w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',
              isActive && (theme === 'dark' 
                ? 'bg-cyan-500/20 ring-2 ring-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/30' 
                : 'bg-blue-500/20 ring-2 ring-blue-500/40 text-blue-600 shadow-lg shadow-blue-500/30'),
              !isActive && !isDisabled && (theme === 'dark' 
                ? 'hover:bg-gray-800/60 text-gray-400 hover:text-cyan-300 hover:ring-1 hover:ring-gray-700' 
                : 'hover:bg-gray-100/70 text-gray-600 hover:text-blue-700 hover:ring-1 hover:ring-gray-300'),
              isDisabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {operation.icon}
            {operation.badge && (
              <span className={cn(
                'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center',
                'bg-red-500 text-white ring-2',
                theme === 'dark' ? 'ring-gray-900' : 'ring-white'
              )}>
                {operation.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  ), [operations, activeOperation, onSelectOperation, theme]);

  // Ultra-compact mode (both collapsed)
  const ultraCompactMode = useMemo(() => (
    <div className="h-full flex flex-col items-center justify-between py-4">
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          theme === 'dark'
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-2 ring-cyan-500/30'
            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30'
        )}
      >
        <Sparkles className={cn('w-5 h-5', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')} />
      </div>

      <button
        type="button"
        onClick={handleMenuToggle}
        aria-label="Open sidebar"
        title="Open sidebar"
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
          'hover:scale-110 active:scale-95',
          theme === 'dark'
            ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-2 ring-cyan-500/40'
            : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 ring-2 ring-blue-500/40'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="w-10 h-10" /> {/* Spacer for balance */}
    </div>
  ), [theme, handleMenuToggle]);

  return (
    <aside
      className={cn(
        'h-full min-h-0 flex flex-col relative',
        'rounded-2xl overflow-hidden',
        'border shadow-xl backdrop-blur-xl',
        borderClass,
        bgClass,
        'sticky top-0',
        collapsedSide ? 'w-[64px]' : 'w-[320px]',
        'transition-[width] duration-300 ease-out',
        isFloating && 'fixed z-50 shadow-2xl'
      )}
      role="complementary"
      aria-label="Quick actions sidebar"
    >
      {/* Ultra-compact mode */}
      {collapsedSide && collapsedUp ? (
        ultraCompactMode
      ) : (
        <>
          {/* Header */}
          <div className={cn('flex items-center justify-between gap-2 px-3 py-3 border-b', borderClass)}>
            {collapsedSide ? compactHeaderNode : headerNode}

            {!collapsedSide && (
              <div className="flex items-center gap-1.5">
                {/* Dock left */}
                <button
                  type="button"
                  onClick={() => onDockChange('left')}
                  aria-label="Dock left"
                  title="Dock left"
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'hover:bg-gray-800/60 text-gray-400 hover:text-cyan-300 focus:ring-cyan-500/40'
                      : 'hover:bg-gray-100/70 text-gray-600 hover:text-blue-700 focus:ring-blue-500/40',
                    dockSide === 'left' && (theme === 'dark' ? 'bg-gray-800/70 text-cyan-300' : 'bg-gray-100 text-blue-700')
                  )}
                >
                  <LayoutPanelLeft className="w-4 h-4" />
                </button>

                {/* Dock right */}
                <button
                  type="button"
                  onClick={() => onDockChange('right')}
                  aria-label="Dock right"
                  title="Dock right"
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'hover:bg-gray-800/60 text-gray-400 hover:text-cyan-300 focus:ring-cyan-500/40'
                      : 'hover:bg-gray-100/70 text-gray-600 hover:text-blue-700 focus:ring-blue-500/40',
                    dockSide === 'right' && (theme === 'dark' ? 'bg-gray-800/70 text-cyan-300' : 'bg-gray-100 text-blue-700')
                  )}
                >
                  <PanelRight className="w-4 h-4" />
                </button>

                {/* Master menu toggle */}
                <div className="relative">
                  {showMenu && (
                    <div
                      ref={menuRef}
                      className={cn(
                        'absolute z-[100] mt-1 py-1 rounded-lg shadow-2xl border min-w-[200px]',
                        menuBgClass,
                        borderClass,
                        isDockLeft ? 'right-0' : 'left-0'
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {menuOptions.map((option) => {
                        if ('isDivider' in option && option.isDivider) {
                          return (
                            <div
                              key={option.id}
                              className={cn('my-1 h-px', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}
                            />
                          );
                        }

                        return (
                          <button
                            key={option.id}
                            onClick={option.action}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 text-sm',
                              'transition-colors duration-150 hover:bg-gray-500/10',
                              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900',
                              option.className
                            )}
                          >
                            <span className="w-4 h-4 flex items-center justify-center shrink-0">
                              {option.icon}
                            </span>
                            <span className="flex-1 text-left">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapse/Expand Control Row - NEW SECTION */}
          {!collapsedUp && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 border-b',
              borderClass,
              theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50/50'
            )}>
              <button
                type="button"
                onClick={onToggleCollapsedSide}
                aria-label={collapsedSide ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsedSide ? 'Expand sidebar' : 'Collapse sidebar'}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200',
                  'text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 focus:ring-cyan-500/40 ring-1 ring-cyan-500/30'
                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 focus:ring-blue-500/40 ring-1 ring-blue-500/30'
                )}
              >
                {collapsedSide ? (
                  <>
                    <ChevronsRight className="w-3.5 h-3.5" />
                    {!collapsedSide && <span>Expand</span>}
                  </>
                ) : (
                  <>
                    <ChevronsLeft className="w-3.5 h-3.5" />
                    <span>Collapse</span>
                  </>
                )}
              </button>

              {!collapsedSide && (
                <span className={cn(
                  'text-xs',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                )}>
Frequently used tools               
 </span>
              )}
            </div>
          )}

          {/* Operations list */}
          <div className={cn('flex-1 min-h-0', collapsedUp ? 'hidden' : 'block')}>
            {collapsedSide ? (
              <>
                {/* Collapse button for compact mode */}
                <div className="flex justify-center py-2 px-2">
                  <button
                    type="button"
                    onClick={onToggleCollapsedSide}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    className={cn(
                      'w-11 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      theme === 'dark'
                        ? 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 focus:ring-cyan-500/40 ring-1 ring-cyan-500/30'
                        : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 focus:ring-blue-500/40 ring-1 ring-blue-500/30'
                    )}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
                {compactOperations}
              </>
            ) : (
              <div className="h-full overflow-auto px-2 py-2">
                <ul className="space-y-1.5">
                  {operations.map((operation, index) => {
                    const isActive = operation.id === activeOperation;
                    const isDisabled = !!operation.disabled;

                    return (
                      <li key={operation.id} className="relative">
                        {isActive && (
                          <div
                            className={cn(
                              'absolute -left-2 top-1/2 -translate-y-1/2 z-20',
                              'w-3 h-3 rotate-45 animate-pulse',
                              theme === 'dark'
                                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/60'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/60'
                            )}
                          />
                        )}

                        <div
                          className={cn(
                            'relative transition-all duration-200',
                            isActive && (theme === 'dark'
                              ? 'ring-2 ring-cyan-500/80 rounded-xl shadow-lg shadow-cyan-500/30'
                              : 'ring-2 ring-blue-500/80 rounded-xl shadow-lg shadow-blue-500/30')
                          )}
                          style={{
                            animation: `slideInRight 0.2s ease-out ${index * 0.02}s both`
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => !isDisabled && onSelectOperation(operation.id)}
                            disabled={isDisabled}
                            aria-label={operation.description || operation.label}
                            aria-current={isActive ? 'page' : undefined}
                            title={operation.description || operation.label}
                            className={cn(
                              'w-full flex items-center gap-3 px-3.5 py-2.5 relative z-10',
                              'text-sm font-medium transition-all duration-200',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0 group',
                              theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',

                              isActive && (theme === 'dark'
                                ? 'bg-gray-900 text-cyan-300 rounded-xl border-r-4 border-cyan-500/90 shadow-inner shadow-cyan-500/10'
                                : 'bg-white text-blue-700 rounded-xl border-r-4 border-blue-500/90 shadow-inner shadow-blue-500/10'),

                              !isActive && !isDisabled && (theme === 'dark'
                                ? 'text-gray-400 bg-gray-900/30 hover:text-gray-200 hover:bg-gray-800/40 rounded-lg hover:ring-1 hover:ring-gray-700/40'
                                : 'text-gray-600 bg-gray-100/30 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg hover:ring-1 hover:ring-gray-300/40'),

                              isDisabled && (theme === 'dark' ? 'opacity-40 cursor-not-allowed text-gray-600' : 'opacity-40 cursor-not-allowed text-gray-400')
                            )}
                          >
                            {operation.icon && (
                              <span
                                className={cn(
                                  'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200',
                                  isActive && (theme === 'dark'
                                    ? 'text-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-500/40 shadow-sm shadow-cyan-500/30'
                                    : 'text-blue-600 bg-blue-500/15 ring-1 ring-blue-500/40 shadow-sm shadow-blue-500/30'),
                                  !isActive && (theme === 'dark'
                                    ? 'text-gray-500 bg-gray-800/30 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:ring-1 group-hover:ring-cyan-500/20 group-hover:scale-110'
                                    : 'text-gray-500 bg-gray-200/50 group-hover:text-blue-600 group-hover:bg-blue-500/10 group-hover:ring-1 group-hover:ring-blue-500/20 group-hover:scale-110')
                                )}
                              >
                                {operation.icon}
                              </span>
                            )}

                            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                              <span className="truncate text-left">{operation.label}</span>

                              {operation.badge && (
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0',
                                    isActive && (theme === 'dark'
                                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 ring-1 ring-cyan-500/40'
                                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 ring-1 ring-blue-500/40'),
                                    !isActive && (theme === 'dark'
                                      ? 'bg-gray-800 text-gray-400 ring-1 ring-gray-700/30 group-hover:bg-gray-700 group-hover:text-gray-300'
                                      : 'bg-gray-200 text-gray-600 ring-1 ring-gray-300/30 group-hover:bg-gray-300 group-hover:text-gray-700')
                                  )}
                                >
                                  {operation.badge}
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <div className="flex-shrink-0 ml-2">
                                <div
                                  className={cn(
                                    'w-2 h-2 rotate-45 animate-pulse',
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
            )}
          </div>

          {/* Footer */}
          {sidebarFooter && !collapsedSide && (
            <div className={cn('border-t px-4 py-3', borderClass)}>{sidebarFooter}</div>
          )}
        </>
      )}

      {/* Floating indicator */}
      {isFloating && (
        <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/30 rounded-2xl" />
      )}
    </aside>
  );
};

QuickActionsSidebar.displayName = 'QuickActionsSidebar';
