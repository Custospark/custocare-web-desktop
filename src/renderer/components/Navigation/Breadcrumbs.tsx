import React, { useMemo, useState } from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { BreadcrumbProps, BreadcrumbItem } from '../../types';
import { cn } from '../../types/cn';

type InternalItem =
  | (BreadcrumbItem & { type?: 'item' })
  | { type: 'ellipsis'; id: 'ellipsis' };

export const Breadcrumb: React.FC<BreadcrumbProps> = React.memo(({
  items = [],
  className,
  theme = 'dark',
  showHome = true,
  maxItems = 4,
  onItemClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!items.length) return null;

  const isDark = theme === 'dark';

  const visibleItems: InternalItem[] = useMemo(() => {
    if (expanded || items.length <= maxItems) {
      return items.map(i => ({ ...i, type: 'item' }));
    }

    return [
      { ...items[0], type: 'item' },
      { type: 'ellipsis', id: 'ellipsis' },
      ...items.slice(-2).map(i => ({ ...i, type: 'item' })),
    ];
  }, [expanded, items, maxItems]);

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    onItemClick?.(item, index);
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'relative rounded-xl px-4 py-3 backdrop-blur-sm transition-all',
        isDark
          ? 'bg-gray-900/60 border border-gray-800/60'
          : 'bg-white/80 border border-gray-200/60',
        className
      )}
    >
      <ol className="relative z-10 flex flex-wrap items-center gap-1">
        {visibleItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === visibleItems.length - 1;
          const isActive = item.type !== 'ellipsis' && isLast;

          return (
            <li key={item.id ?? index} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    'mx-2 h-4 w-4',
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  )}
                />
              )}

              {/* Ellipsis */}
              {item.type === 'ellipsis' ? (
                <button
                  onClick={() => setExpanded(true)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium',
                    isDark
                      ? 'text-gray-400 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                  aria-label="Expand breadcrumb"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {items.length - maxItems + 1} more
                </button>
              ) : (
                <a
                  href={item.href}
                  onClick={e => {
                    if (onItemClick) {
                      e.preventDefault();
                      handleItemClick(item, index);
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all',
                    isActive
                      ? isDark
                        ? 'bg-primary-500/15 text-white'
                        : 'bg-primary-100 text-primary-700'
                      : isDark
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {isFirst && showHome && (
                    <Home className="h-4 w-4" />
                  )}

                  <span className="whitespace-nowrap font-medium">
                    {item.label}
                  </span>

                  {item.badge && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-xs font-bold',
                        isDark
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumb.displayName = 'Breadcrumb';
export default Breadcrumb;