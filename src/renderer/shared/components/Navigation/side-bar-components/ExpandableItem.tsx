import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../types/cn';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/store/rootReducer';

export interface ExpandableItemProps {
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  persistState?: boolean;
  storageKey?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const TRANSITION_MS = 240;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const getPersistedOpenState = (persistState: boolean, storageKey: string | undefined, fallback: boolean) => {
  if (!persistState || !storageKey) return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    // ignore storage errors
  }
  return fallback;
};

export const ExpandableItem: React.FC<ExpandableItemProps> = ({
  label,
  icon,
  badge,
  active = false,
  defaultOpen = false,
  isOpen,
  onToggle,
  persistState = false,
  storageKey,
  children,
  className,
  disabled = false,
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const generatedId = useId();
  const regionId = `${generatedId}-region`;
  const buttonId = `${generatedId}-button`;

  const isControlled = typeof isOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState<boolean>(() =>
    getPersistedOpenState(persistState, storageKey, defaultOpen),
  );
  const open = isControlled ? Boolean(isOpen) : internalOpen;

  const [isRendered, setIsRendered] = useState(open);
  const [maxHeight, setMaxHeight] = useState<number>(open ? 1000 : 0);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (persistState && storageKey && !isControlled) {
      try {
        localStorage.setItem(storageKey, String(internalOpen));
      } catch {
        // ignore storage errors
      }
    }
  }, [persistState, storageKey, internalOpen, isControlled]);

  useEffect(() => {
    if (open) {
      const rafId = requestAnimationFrame(() => {
        setIsRendered(true);
        if (contentRef.current) setMaxHeight(contentRef.current.scrollHeight);
      });
      return () => cancelAnimationFrame(rafId);
    }

    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setMaxHeight(0));
    } else {
      setMaxHeight(0);
    }

    const timeout = window.setTimeout(() => setIsRendered(false), TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!isRendered || !contentRef.current) return;
    if (!open) return;

    const observer = new ResizeObserver(() => {
      if (contentRef.current) {
        setMaxHeight(contentRef.current.scrollHeight);
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [open, isRendered]);

  useEffect(() => {
    if (!contentRef.current) return;

    const focusableElements = Array.from(contentRef.current.querySelectorAll<HTMLElement>(focusableSelector));
    if (open) {
      focusableElements.forEach((element) => {
        if (element.dataset.prevTabindex !== undefined) {
          const prev = element.dataset.prevTabindex;
          if (prev === '') element.removeAttribute('tabindex');
          else element.setAttribute('tabindex', prev);
          delete element.dataset.prevTabindex;
        }
      });
      return;
    }

    focusableElements.forEach((element) => {
      element.dataset.prevTabindex = element.getAttribute('tabindex') ?? '';
      element.setAttribute('tabindex', '-1');
    });
  }, [open, isRendered]);

  const setOpenState = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;
      if (!isControlled) setInternalOpen(nextOpen);
      onToggle?.(nextOpen);
      toggleButtonRef.current?.focus();
    },
    [disabled, isControlled, onToggle],
  );

  const handleToggle = useCallback(() => {
    setOpenState(!open);
  }, [open, setOpenState]);

  const ariaLiveMessage = useMemo(() => `${label} ${open ? 'expanded' : 'collapsed'}`, [label, open]);

  // Theme-aware color classes matching QuickActionsSidebar
  const borderClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const iconClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const activeIconClass = theme === 'dark' ? 'text-cyan-400' : 'text-blue-600';
  
  // Active state colors (matching QuickActionsSidebar)
  const activeBgClass = theme === 'dark'
    ? 'bg-cyan-500/20 ring-2 ring-cyan-500/40'
    : 'bg-blue-500/20 ring-2 ring-blue-500/40';
  const activeTextClass = theme === 'dark' ? 'text-cyan-300' : 'text-blue-700';
  const activeShadowClass = theme === 'dark'
    ? 'shadow-lg shadow-cyan-500/30'
    : 'shadow-lg shadow-blue-500/30';

  // Focus ring colors
  const focusRingClass = theme === 'dark'
    ? 'focus:ring-cyan-500/50'
    : 'focus:ring-blue-500/50';

  // Badge colors with blue background
  const getBadgeClasses = () => {
    if (active && !disabled) {
      return theme === 'dark'
        ? 'bg-cyan-500/40 text-cyan-200 ring-1 ring-cyan-400/50'
        : 'bg-blue-500/40 text-blue-800 ring-1 ring-blue-400/50';
    }
    
    // Default badge with blue background
    return theme === 'dark'
      ? 'bg-blue-600/30 text-blue-200 ring-1 ring-blue-500/40'
      : 'bg-blue-100 text-blue-800 ring-1 ring-blue-300';
  };

  return (
    <div className={cn('rounded-xl', className)}>
      <button
        id={buttonId}
        ref={toggleButtonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={regionId}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          
          // Active state (when this expandable item is "active"/selected)
          active && !disabled
            ? [
                activeBgClass,
                activeTextClass,
                activeShadowClass,
                borderClass,
              ]
            : [
                // Inactive state - clean and minimal like QuickActionsSidebar
                'bg-transparent',
                borderClass,
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
                hoverBgClass,
              ],
          focusRingClass,
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className={cn(
              'shrink-0 transition-colors',
              active && !disabled
                ? activeIconClass
                : iconClass
            )}>
              {icon}
            </span>
          )}
          <span className={cn(
            'text-sm font-semibold truncate',
            active && !disabled ? activeTextClass : textClass
          )}>
            {label}
          </span>
          {badge !== undefined && badge !== null && (
            <span className={cn(
              'text-xs font-bold rounded-full px-1.5 py-0.5 transition-all duration-200',
              getBadgeClasses()
            )}>
              {badge}
            </span>
          )}
        </span>

        <ChevronRight
          className={cn(
            'w-4 h-4 shrink-0 transition-transform duration-200 ease-out',
            open && 'rotate-90',
            active && !disabled ? activeIconClass : iconClass
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={regionId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        className={cn('overflow-hidden transition-[max-height] duration-200 ease-out')}
        style={{ maxHeight: isRendered ? `${maxHeight}px` : '0px' }}
      >
        <div 
          ref={contentRef} 
          className={cn(
            'mt-1.5 pl-4 pr-1 space-y-1 border-l transition-colors',
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          )}
        >
          {isRendered ? children : null}
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        {ariaLiveMessage}
      </span>
    </div>
  );
};

export default ExpandableItem;