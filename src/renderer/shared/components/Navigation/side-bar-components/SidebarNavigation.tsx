import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../../types/cn';
import ExpandableItem from './ExpandableItem';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  route: string;
  description: string;
  operations?: Array<{
    id: string;
    label: string;
    route: string;
  }>;
  stats?: string;
  shortcut?: string;
}

interface SidebarNavigationProps {
  collapsed: boolean;
  isDark: boolean;
  groupedMenuItems: Record<string, MenuItem[]>;
  currentMenuItems: MenuItem[];
  categoryNames: Record<string, string>;
  enableNestedNavigation?: boolean;
  activeHover: string | null;
  setActiveHover: React.Dispatch<React.SetStateAction<string | null>>;
  isRouteActive: (route: string) => boolean;
  handleNavigation: (e: React.MouseEvent, route: string) => void;
  navContainerRef: React.RefObject<HTMLElement | null>;
  activeItemRef: React.RefObject<HTMLAnchorElement | null>;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  collapsed,
  isDark,
  groupedMenuItems,
  currentMenuItems,
  categoryNames,
  enableNestedNavigation = false,
  activeHover,
  setActiveHover,
  isRouteActive,
  handleNavigation,
  navContainerRef,
  activeItemRef,
}) => {
  const OPEN_PARENT_STORAGE_KEY = 'sidebar-collapsible-open-parent';
  const nestedItems = useMemo(() => Object.values(groupedMenuItems).flat(), [groupedMenuItems]);

  const isParentOrChildActive = (item: MenuItem) =>
    isRouteActive(item.route) || (item.operations?.some((operation) => isRouteActive(operation.route)) ?? false);

  const activeParentId = useMemo(
    () => nestedItems.find((item) => isParentOrChildActive(item))?.id ?? null,
    [nestedItems, isRouteActive],
  );

  const [openParentId, setOpenParentId] = useState<string | null>(activeParentId);

  useEffect(() => {
    if (!enableNestedNavigation) return;
    const savedParentId = localStorage.getItem(OPEN_PARENT_STORAGE_KEY);
    if (activeParentId) {
      setOpenParentId(activeParentId);
      return;
    }
    if (savedParentId && nestedItems.some((item) => item.id === savedParentId)) {
      setOpenParentId(savedParentId);
    }
  }, [activeParentId, enableNestedNavigation, nestedItems]);

  useEffect(() => {
    if (!enableNestedNavigation) return;
    if (!openParentId) {
      localStorage.removeItem(OPEN_PARENT_STORAGE_KEY);
      return;
    }
    localStorage.setItem(OPEN_PARENT_STORAGE_KEY, openParentId);
  }, [enableNestedNavigation, openParentId]);

  const renderMenuItem = (item: MenuItem) => {
    const isActive = isRouteActive(item.route);
    const isHovered = activeHover === item.id;

    return (
      <a
        key={item.id}
        ref={isActive ? activeItemRef : null}
        href={item.href}
        onClick={(e) => handleNavigation(e, item.route)}
        className={cn(
          'group relative flex items-center',
          'rounded-xl transition-all duration-300 ease-out',
          'border',
          isActive
            ? cn(
                'bg-linear-to-r shadow-xl',
                isDark
                  ? 'from-blue-500/20 to-cyan-500/20 border-blue-500/50'
                  : 'from-blue-100 to-cyan-100 border-blue-300',
              )
            : cn(
                'border-transparent',
                isDark
                  ? 'hover:bg-gray-800/50 hover:border-gray-700/50'
                  : 'hover:bg-gray-100/50 hover:border-gray-200/50',
              ),
          collapsed ? 'p-2 justify-center' : 'p-2 gap-2',
        )}
        onMouseEnter={() => setActiveHover(item.id)}
        onMouseLeave={() => setActiveHover(null)}
        title={collapsed ? `${item.label} • ${item.description}` : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-full bg-linear-to-b from-blue-500 via-cyan-400 to-blue-500 shadow-xl shadow-blue-500/70" />
        )}

        <div className={cn('relative shrink-0', collapsed ? 'mx-auto' : '')}>
          <div
            className={cn(
              'p-2.5 rounded-xl transition-all duration-300',
              'border',
              isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200',
              isActive &&
                (isDark
                  ? 'border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                  : 'border-blue-400 bg-blue-100 shadow-md shadow-blue-300/50'),
              isHovered && 'scale-110 shadow-xl',
            )}
          >
            <div
              className={cn(
                'transition-all duration-300',
                isActive
                  ? isDark
                    ? 'text-cyan-300 scale-110'
                    : 'text-blue-700 scale-110'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600',
              )}
            >
              {item.icon}
            </div>
          </div>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'font-semibold text-sm truncate',
                  isActive
                    ? isDark
                      ? 'text-white font-bold'
                      : 'text-gray-900 font-bold'
                    : isDark
                    ? 'text-gray-300'
                    : 'text-gray-700',
                )}
              >
                {item.label}
              </span>
            </div>

            <p
              className={cn(
                'text-xs truncate leading-relaxed',
                isActive
                  ? isDark
                    ? 'text-gray-300'
                    : 'text-gray-700'
                  : isDark
                  ? 'text-gray-500'
                  : 'text-gray-600',
              )}
            >
              {item.description}
            </p>

            <div className="flex items-center justify-between pt-0.5">
              {item.stats && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    isActive
                      ? isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600',
                  )}
                >
                  {item.stats}
                </span>
              )}

              {item.shortcut && (
                <kbd
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded border font-mono',
                    isDark
                      ? 'bg-gray-800 text-gray-400 border-gray-700'
                      : 'bg-gray-100 text-gray-600 border-gray-300',
                  )}
                >
                  {item.shortcut}
                </kbd>
              )}
            </div>
          </div>
        )}
      </a>
    );
  };

  const renderOperationItem = (operation: NonNullable<MenuItem['operations']>[number]) => {
    const isOperationActive = isRouteActive(operation.route);

    return (
      <a
        key={operation.id}
        href={operation.route}
        onClick={(e) => handleNavigation(e, operation.route)}
        className={cn(
          'flex items-center rounded-lg px-2.5 py-2 text-sm transition-all duration-200',
          'border border-transparent',
          isOperationActive
            ? isDark
              ? 'bg-linear-to-r from-blue-600/35 to-cyan-600/30 text-white border-cyan-400/70 font-semibold'
              : 'bg-linear-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300'
            : isDark
            ? 'text-gray-100 hover:bg-gray-700/60 hover:border-gray-600/60'
            : 'text-gray-700 hover:bg-gray-100/50 hover:border-gray-200/50',
        )}
        aria-current={isOperationActive ? 'page' : undefined}
      >
        {operation.label}
      </a>
    );
  };

  return (
    <nav
      ref={navContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain scroll-smooth"
    >
      {!collapsed ? (
        Object.entries(groupedMenuItems).map(
          ([category, items]) =>
            items.length > 0 && (
              <div key={category} className="space-y-2">
                {enableNestedNavigation ? (
                  <>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider px-2',
                        isDark ? 'text-gray-400' : 'text-gray-500',
                      )}
                    >
                      {categoryNames[category]}
                    </p>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <ExpandableItem
                          key={item.id}
                          label={item.label}
                          icon={item.icon}
                          active={isParentOrChildActive(item)}
                          badge={item.operations?.length}
                          isOpen={openParentId === item.id}
                          onToggle={(nextOpen) => {
                            if (nextOpen) {
                              setOpenParentId(item.id);
                              return;
                            }

                            if (isParentOrChildActive(item)) {
                              setOpenParentId(item.id);
                              return;
                            }

                            setOpenParentId(null);
                          }}
                          className="px-1"
                        >
                          {(item.operations ?? []).map((operation) => renderOperationItem(operation))}
                        </ExpandableItem>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider px-2',
                        isDark ? 'text-gray-400' : 'text-gray-500',
                      )}
                    >
                      {categoryNames[category]}
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="space-y-1">
                          {renderMenuItem(item)}
                          {(item.operations ?? []).length > 0 ? (
                            <div
                              className={cn(
                                'ml-2 space-y-0.5 border-l py-0.5 pl-3',
                                isDark ? 'border-gray-700/70' : 'border-gray-200',
                              )}
                            >
                              {(item.operations ?? []).map((operation) => renderOperationItem(operation))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ),
        )
      ) : (
        <div className="space-y-1.5">{currentMenuItems.map((item) => renderMenuItem(item))}</div>
      )}
    </nav>
  );
};

export default SidebarNavigation;
