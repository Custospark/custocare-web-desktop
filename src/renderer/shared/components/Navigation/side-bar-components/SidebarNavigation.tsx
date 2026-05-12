import React, { useEffect, useMemo, useState } from 'react';
import { Circle } from 'lucide-react';
import { cn } from '../../../types/cn';
import ExpandableItem from './ExpandableItem';
import { moduleSwitcherLabelForSlot, workspaceShortcutLabelForDigit } from '../../../keyboard/workspaceShortcutLabels';

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
    icon?: React.ReactNode;
    description?: string;
    subtext?: string;
  }>;
  stats?: string;
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
    const moduleSlot = currentMenuItems.findIndex((x) => x.id === item.id);
    const moduleShortcutDisplay =
      moduleSlot >= 0 && moduleSlot < 9 ? moduleSwitcherLabelForSlot(moduleSlot + 1) : null;

    const collapsedTitle = [item.label, item.description, moduleShortcutDisplay]
      .filter(Boolean)
      .join(' · ');

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
        title={collapsed ? collapsedTitle : undefined}
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

              {moduleShortcutDisplay && (
                <kbd
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded border font-mono',
                    isDark
                      ? 'bg-gray-800 text-gray-400 border-gray-700'
                      : 'bg-gray-100 text-gray-600 border-gray-300',
                  )}
                  title="Jump to this module from anywhere (order matches sidebar)"
                >
                  {moduleShortcutDisplay}
                </kbd>
              )}
            </div>
          </div>
        )}
      </a>
    );
  };

  const operationTooltip = (operation: NonNullable<MenuItem['operations']>[number]) =>
    operation.description || operation.subtext || operation.label;

  const renderOperationItem = (
    operation: NonNullable<MenuItem['operations']>[number],
    opIndex: number,
    _parentItem: MenuItem,
  ) => {
    const isOperationActive = isRouteActive(operation.route);
    const wsHint = opIndex < 9 ? workspaceShortcutLabelForDigit(opIndex + 1) : null;
    const tipBase = operationTooltip(operation);
    const tip = wsHint ? `${tipBase} · ${wsHint}` : tipBase;
    const glyph = operation.icon ?? <Circle className="w-3.5 h-3.5 opacity-50" aria-hidden />;

    return (
      <a
        key={operation.id}
        href={operation.route}
        title={tip}
        aria-label={operation.label}
        onClick={(e) => handleNavigation(e, operation.route)}
        className={cn(
          'flex gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-200',
          enableNestedNavigation ? 'items-start' : 'items-center',
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
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
            enableNestedNavigation && 'mt-0.5',
            isDark ? 'border-gray-700/60 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600',
            isOperationActive &&
              (isDark
                ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
                : 'border-blue-300 bg-white text-blue-700'),
          )}
          aria-hidden
        >
          {glyph}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 flex gap-2 items-start justify-between',
            enableNestedNavigation ? '' : 'items-center',
          )}
        >
          <span
            className={cn(
              'min-w-0 leading-snug',
              enableNestedNavigation ? 'break-words whitespace-normal' : 'truncate',
            )}
          >
            {operation.label}
          </span>
          {wsHint && (
            <kbd
              className={cn(
                'shrink-0 px-1.5 py-0.5 text-[10px] rounded border font-mono',
                isDark
                  ? 'bg-gray-800/90 text-gray-300 border-gray-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200',
              )}
            >
              {wsHint}
            </kbd>
          )}
        </span>
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
                      {items.map((item) => {
                        const moduleSlot = currentMenuItems.findIndex((x) => x.id === item.id);
                        const moduleShortcutDisplay =
                          moduleSlot >= 0 && moduleSlot < 9 ? moduleSwitcherLabelForSlot(moduleSlot + 1) : null;
                        const headerAside = moduleShortcutDisplay ? (
                          <kbd
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] rounded border font-mono shrink-0',
                              isDark
                                ? 'bg-gray-800 text-gray-400 border-gray-700'
                                : 'bg-gray-100 text-gray-600 border-gray-300',
                            )}
                            title={`${moduleShortcutDisplay}: jump to this module (sidebar order)`}
                          >
                            {moduleShortcutDisplay}
                          </kbd>
                        ) : undefined;

                        return (
                        <ExpandableItem
                          key={item.id}
                          label={item.label}
                          icon={item.icon}
                          allowMultilineLabel
                          active={isParentOrChildActive(item)}
                          badge={item.operations?.length}
                          isOpen={openParentId === item.id}
                          headerAside={headerAside}
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
                          {(item.operations ?? []).map((operation, opIndex) =>
                            renderOperationItem(operation, opIndex, item),
                          )}
                        </ExpandableItem>
                        );
                      })}
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
                        <div key={item.id}>{renderMenuItem(item)}</div>
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
