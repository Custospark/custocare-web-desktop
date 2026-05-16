import React, { useMemo, type ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/store';
import {
  ChevronLeft,
  ChevronRight,
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
  PanelLeft,
  Crown,
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import { workspaceShortcutLabelForDigit, workspaceShortcutRangeLegend, slotToKey } from '../../keyboard/workspaceShortcutLabels';
import { useLocation, useNavigate } from 'react-router-dom';

import { hasTier, tierLabel, type FeatureStatus, type PlanTier } from '../../entitlements/entitlements';
import { Badge, type BadgeSpec } from '../../utils/Badge';

export type DockSide = 'left' | 'right';

export interface Operation {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;

  /**
   * Hard-disable (non-entitlement reasons).
   * If true, item becomes inert (no upgrade click).
   */
  disabled?: boolean;

  /**
   * Updated badge API to handle complex badges
   */
  badge?: number | string | BadgeSpec | BadgeSpec[];

  /**
   * NEW: entitlement gating (optional)
   */
  requiredTier?: PlanTier;

  /**
   * NEW: feature status (optional)
   */
  status?: FeatureStatus;

  /**
   * NEW: tooltip reason for disabled state (optional)
   */
  disabledReason?: string;
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
  /** Second line under contextTitle (e.g. patient portal resolved facility / visit). */
  contextSubtitle?: string;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;

  onClose?: () => void;
  onTogglePin?: () => void;
  isPinned?: boolean;
  onFloat?: () => void;
  isFloating?: boolean;
  onAutoHide?: () => void;
  isAutoHidden?: boolean;

  currentTier?: PlanTier;
  moduleRequiredTier?: PlanTier;

  onRequestUpgrade?: (requiredTier: PlanTier) => void;

  /**
   * NEW: plans page URL for upgrade redirect
   */
  plansPageUrl?: string;
}

const tierShort = (tier: PlanTier) => {
  switch (tier) {
    case 'essential':
      return 'ESS';
    case 'professional':
      return 'PRO';
    case 'enterprise':
      return 'ENT';
  }
};

const isTierLikeText = (value: string) => {
  const v = value.trim().toLowerCase();
  return (
    v === 'essential' ||
    v === 'professional' ||
    v === 'enterprise' ||
    v === 'ess' ||
    v === 'pro' ||
    v === 'ent' ||
    v === 'essentials' ||
    v === 'professionals' ||
    v === 'enterprises'
  );
};

// Updated statusBadgeText with background colors (kept)
const statusBadgeConfig = (status?: FeatureStatus) => {
  if (!status) return null;

  switch (status) {
    case 'beta':
      return { text: 'BETA', bgColor: 'bg-purple-500', textColor: 'text-white', darkBgColor: 'bg-purple-600' };
    case 'new':
      return { text: 'NEW', bgColor: 'bg-green-500', textColor: 'text-white', darkBgColor: 'bg-green-600' };
    case 'deprecated':
      return { text: 'DEPRECATED', bgColor: 'bg-amber-500', textColor: 'text-white', darkBgColor: 'bg-amber-600' };
    default:
      return null;
  }
};

const tierBadgeConfig = (tier: PlanTier) => {
  switch (tier) {
    case 'professional':
      return { bgColor: 'bg-blue-500', textColor: 'text-white', darkBgColor: 'bg-blue-600' };
    case 'enterprise':
      return { bgColor: 'bg-amber-500', textColor: 'text-white', darkBgColor: 'bg-amber-600' };
    default:
      return { bgColor: 'bg-gray-500', textColor: 'text-white', darkBgColor: 'bg-gray-600' };
  }
};

// Helper to check if a badge is a BadgeSpec
const isBadgeSpec = (badge: any): badge is BadgeSpec => {
  return badge && typeof badge === 'object' && 'text' in badge;
};

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
  contextSubtitle,
  sidebarHeader,
  sidebarFooter,
  onClose,
  onTogglePin,
  isPinned = true,
  onFloat,
  isFloating = false,

  currentTier = 'essential',
  moduleRequiredTier,
  onRequestUpgrade,
  plansPageUrl = '/plans',
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isDockLeft = dockSide === 'left';
  const borderClass = theme === 'dark' ? 'border-gray-800/40' : 'border-gray-200/50';
  const bgClass = theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95';
  const menuBgClass = theme === 'dark' ? 'bg-gray-800/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';

  const moduleTierBlocked = !!moduleRequiredTier && !hasTier(currentTier, moduleRequiredTier);

  const returnUrl = `${location.pathname}${location.search ?? ''}`;

  const handleMenuToggle = useCallback(() => {
    if (collapsedSide && collapsedUp) {
      onToggleCollapsedSide();
      onToggleCollapsedUp();
      setShowMenu(false);
    } else {
      setShowMenu(!showMenu);
    }
  }, [collapsedSide, collapsedUp, onToggleCollapsedSide, onToggleCollapsedUp, showMenu]);

  /**
   * Upgrade action: call hook (optional) + navigate to plans page.
   */
  const requestUpgrade = useCallback(
    (tier: PlanTier) => {
      onRequestUpgrade?.(tier);
      navigate(plansPageUrl, {
        state: { requiredTier: tier, returnUrl },
      });
    },
    [onRequestUpgrade, navigate, plansPageUrl, returnUrl]
  );

  const getUpgradeTier = useCallback(
    (op: Operation): PlanTier | undefined => {
      if (moduleTierBlocked) return moduleRequiredTier;
      const opTierBlocked = !!op.requiredTier && !hasTier(currentTier, op.requiredTier);
      return opTierBlocked ? op.requiredTier : undefined;
    },
    [currentTier, moduleTierBlocked, moduleRequiredTier]
  );
  
  // Helper functions for badge colors
  const getToneBgColor = (tone: string): string => {
    switch (tone) {
      case 'info': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      case 'premium': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getDarkToneBgColor = (tone: string): string => {
    switch (tone) {
      case 'info': return 'bg-blue-600';
      case 'success': return 'bg-green-600';
      case 'warning': return 'bg-amber-600';
      case 'danger': return 'bg-red-600';
      case 'premium': return 'bg-amber-600';
      default: return 'bg-gray-600';
    }
  };

  /**
   * Badge cleanliness rules (kept), but now handles BadgeSpec and arrays
   */
  const getEffectiveBadge = useCallback(
    (op: Operation): { text: string | number; config: any } | undefined => {
      // First priority: Show status badges (beta, new, deprecated) for ALL operations
      const statusConfig = statusBadgeConfig(op.status);
      if (statusConfig) {
        return {
          text: statusConfig.text,
          config: {
            bgColor: statusConfig.bgColor,
            textColor: statusConfig.textColor,
            darkBgColor: statusConfig.darkBgColor,
          },
        };
      }

      const opTierBlocked = !!op.requiredTier && !hasTier(currentTier, op.requiredTier);

      // Second priority: Show tier badge only when blocked
      if (opTierBlocked && op.requiredTier) {
        return { text: tierShort(op.requiredTier), config: tierBadgeConfig(op.requiredTier) };
      }

      // Handle number badges
      if (typeof op.badge === 'number') {
        return {
          text: op.badge,
          config: { bgColor: 'bg-red-500', textColor: 'text-white', darkBgColor: 'bg-red-600' },
        };
      }

      // Handle BadgeSpec objects (custom badges)
      if (isBadgeSpec(op.badge)) {
        return {
          text: op.badge.text,
          config: {
            bgColor: op.badge.tone ? getToneBgColor(op.badge.tone) : 'bg-gray-500',
            textColor: 'text-white',
            darkBgColor: op.badge.tone ? getDarkToneBgColor(op.badge.tone) : 'bg-gray-600',
          },
        };
      }

      // Handle arrays - use the first badge for display
      if (Array.isArray(op.badge) && op.badge.length > 0) {
        const firstBadge = op.badge[0];
        if (typeof firstBadge === 'string' || typeof firstBadge === 'number') {
          return {
            text: firstBadge,
            config: { bgColor: 'bg-gray-500', textColor: 'text-white', darkBgColor: 'bg-gray-600' },
          };
        }
        if (isBadgeSpec(firstBadge)) {
          return {
            text: firstBadge.text,
            config: {
              bgColor: firstBadge.tone ? getToneBgColor(firstBadge.tone) : 'bg-gray-500',
              textColor: 'text-white',
              darkBgColor: firstBadge.tone ? getDarkToneBgColor(firstBadge.tone) : 'bg-gray-600',
            },
          };
        }
      }

      // Handle string badges
      if (typeof op.badge === 'string') {
        if (isTierLikeText(op.badge)) {
          // Only show tier-like text if operation is blocked
          if (!moduleTierBlocked && !opTierBlocked) return undefined;

          const tier =
            op.requiredTier ||
            (op.badge.toLowerCase().includes('pro')
              ? 'professional'
              : op.badge.toLowerCase().includes('ent')
                ? 'enterprise'
                : 'essential');

          return { text: op.badge.toUpperCase(), config: tierBadgeConfig(tier as PlanTier) };
        }

        return {
          text: op.badge,
          config: { bgColor: 'bg-gray-500', textColor: 'text-white', darkBgColor: 'bg-gray-600' },
        };
      }

      return undefined;
    },
    [currentTier, moduleTierBlocked]
  );

  const getEffectiveTitle = useCallback(
    (op: Operation) => {
      const upgradeTier = getUpgradeTier(op);

      if (op.disabled && op.disabledReason) return op.disabledReason;

      if (upgradeTier) {
        return `Requires ${tierLabel(upgradeTier)} Plan`;
      }

      return op.description || op.label;
    },
    [getUpgradeTier]
  );

  /**
   * Helper to render multiple badges.
   */
  const renderMultipleBadges = useCallback((badge?: number | string | BadgeSpec | BadgeSpec[]) => {
    if (!badge) return null;
    
    const badges = Array.isArray(badge) ? badge : [badge];
    
    return (
      <div className="flex flex-wrap gap-1 ml-2">
        {badges.map((b, index) => {
          if (typeof b === 'string' || typeof b === 'number') {
            return (
              <span
                key={index}
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 ring-1 ring-gray-700'
                    : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                )}
              >
                {b}
              </span>
            );
          }
          
          if (isBadgeSpec(b)) {
            return (
              <Badge
                key={index}
                badge={b}
                theme={theme}
                size="xs"
              />
            );
          }
          
          return null;
        })}
      </div>
    );
  }, [theme]);

  /**
   * Clicking the operation should NOT navigate/select when gated.
   * Instead, the Upgrade button will handle it.
   */
  const handleOperationClick = useCallback(
    (op: Operation) => {
      if (op.disabled) return;

      const upgradeTier = getUpgradeTier(op);
      if (upgradeTier) return;

      onSelectOperation(op.id);
    },
    [getUpgradeTier, onSelectOperation]
  );

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
              Workspace Actions
            </h3>
            {contextTitle && (
              <p
                className={cn('text-xs mt-0.5 truncate', theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}
                title={contextTitle}
              >
                {contextTitle}
              </p>
            )}
            {contextSubtitle ? (
              <p
                className={cn(
                  'text-[11px] mt-0.5 truncate font-medium',
                  theme === 'dark' ? 'text-cyan-400/90' : 'text-blue-700',
                )}
                title={contextSubtitle}
              >
                {contextSubtitle}
              </p>
            ) : null}
            <p
              className={cn('text-[10px] mt-1 font-mono', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}
            >
              {workspaceShortcutRangeLegend()} workspace
            </p>
          </div>
        )}
      </div>
    );
  }, [collapsedSide, contextSubtitle, contextTitle, sidebarHeader, theme]);

  const compactHeaderNode = useMemo(
    () => (
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
    ),
    [theme]
  );

  const menuOptions = useMemo(
    () => [
      {
        id: 'toggle-sidebar',
        label: collapsedSide ? 'Expand Sidebar Width' : 'Collapse Sidebar Width',
        icon: collapsedSide ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />,
        action: () => {
          onToggleCollapsedSide();
          setShowMenu(false);
        },
      },
      {
        id: 'toggle-list',
        label: collapsedUp ? 'Expand Operations List' : 'Collapse Operations List',
        icon: collapsedUp ? <Minimize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />,
        action: () => {
          onToggleCollapsedUp();
          setShowMenu(false);
        },
      },
      { id: 'divider-1', isDivider: true },
      ...(onFloat
        ? [
            {
              id: 'float',
              label: isFloating ? 'Dock Sidebar' : 'Float Sidebar',
              icon: <Maximize2 className="w-4 h-4" />,
              action: () => {
                onFloat();
                setShowMenu(false);
              },
            },
          ]
        : []),
      ...(onTogglePin
        ? [
            {
              id: 'pin',
              label: isPinned ? 'Unpin Sidebar' : 'Pin Sidebar',
              icon: isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />,
              action: () => {
                onTogglePin();
                setShowMenu(false);
              },
            },
          ]
        : []),
      ...(onClose
        ? [
            { id: 'divider-2', isDivider: true },
            {
              id: 'close',
              label: 'Close Sidebar',
              icon: <X className="w-4 h-4" />,
              action: () => {
                onClose();
                setShowMenu(false);
              },
              className: theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-100',
            },
          ]
        : []),
    ],
    [
      collapsedSide,
      collapsedUp,
      onToggleCollapsedSide,
      onToggleCollapsedUp,
      onFloat,
      isFloating,
      onTogglePin,
      isPinned,
      onClose,
      theme,
    ]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && showMenu) setShowMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  /**
   * Compact operations (icon-only mode)
   * - If gated: operation button is disabled
   * - Show a small "Upgrade" overlay button that navigates to Plans
   */
  const compactOperations = useMemo(
    () => (
      <div className="flex-1 flex flex-col items-center py-2 gap-2 overflow-auto">
        {operations.map((operation, opIndex) => {
          const isActive = operation.id === activeOperation;

          const upgradeTier = getUpgradeTier(operation);
          const isGated = !!upgradeTier;
          const isHardDisabled = !!operation.disabled;

          const isDisabledUI = isHardDisabled || isGated;

          const badgeData = getEffectiveBadge(operation);
          const digitHint = slotToKey(opIndex + 1) ? workspaceShortcutLabelForDigit(opIndex + 1) : null;

          return (
            <div key={operation.id} className="relative">
              <button
                type="button"
                onClick={() => handleOperationClick(operation)}
                disabled={isHardDisabled || isGated}
                title={
                  digitHint
                    ? `${digitHint} — ${getEffectiveTitle(operation)}`
                    : getEffectiveTitle(operation)
                }
                aria-label={operation.label}
                aria-disabled={isDisabledUI}
                className={cn(
                  'relative w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',
                  isActive &&
                    (theme === 'dark'
                      ? 'bg-cyan-500/20 ring-2 ring-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/30'
                      : 'bg-blue-500/20 ring-2 ring-blue-500/40 text-blue-600 shadow-lg shadow-blue-500/30'),
                  !isActive &&
                    !isDisabledUI &&
                    (theme === 'dark'
                      ? 'hover:bg-gray-800/60 text-gray-400 hover:text-cyan-300 hover:ring-1 hover:ring-gray-700'
                      : 'hover:bg-gray-100/70 text-gray-600 hover:text-blue-700 hover:ring-1 hover:ring-gray-300'),
                  isDisabledUI && 'opacity-40 cursor-not-allowed'
                )}
              >
                {operation.icon}
                {badgeData !== undefined && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center',
                      badgeData.config.bgColor,
                      badgeData.config.textColor,
                      'ring-2',
                      theme === 'dark' ? 'ring-gray-900' : 'ring-white'
                    )}
                  >
                    {badgeData.text}
                  </span>
                )}
              </button>

              {/* Upgrade overlay (only for gated, not hard-disabled) */}
              {isGated && !isHardDisabled && upgradeTier && (
                <button
                  type="button"
                  onClick={() => requestUpgrade(upgradeTier)}
                  aria-label={`Upgrade to ${tierLabel(upgradeTier)} to unlock ${operation.label}`}
                  title={`Upgrade to ${tierLabel(upgradeTier)} to unlock`}
                  className={cn(
                    'absolute -bottom-1 -right-1',
                    'h-[18px] px-1.5 rounded-full text-[10px] font-bold',
                    'flex items-center gap-1',
                    'ring-2',
                    theme === 'dark'
                      ? 'bg-amber-500/90 text-white ring-gray-900'
                      : 'bg-amber-500 text-white ring-white'
                  )}
                >
                  <Crown className="w-3 h-3" />
                  Upg
                </button>
              )}
            </div>
          );
        })}
      </div>
    ),
    [
      operations,
      activeOperation,
      getUpgradeTier,
      getEffectiveBadge,
      getEffectiveTitle,
      handleOperationClick,
      requestUpgrade,
      theme,
    ]
  );

  const ultraCompactMode = useMemo(
    () => (
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

        <div className="w-10 h-10" />
      </div>
    ),
    [theme, handleMenuToggle]
  );

  return (
    <aside
      className={cn(
        'h-full min-h-0 flex flex-col relative mt-3',
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
                    'p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer',
                    theme === 'dark'
                      ? 'hover:bg-gray-800/60 focus:ring-cyan-500/40'
                      : 'hover:bg-gray-100/70 focus:ring-blue-500/40',
                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600',
                    dockSide === 'left' &&
                      (theme === 'dark'
                        ? 'bg-cyan-500/20 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/30'
                        : 'bg-blue-500/20 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/30')
                  )}
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                {/* Dock right */}
                <button
                  type="button"
                  onClick={() => onDockChange('right')}
                  aria-label="Dock right"
                  title="Dock right"
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer',
                    theme === 'dark'
                      ? 'hover:bg-gray-800/60 focus:ring-cyan-500/40'
                      : 'hover:bg-gray-100/70 focus:ring-blue-500/40',
                    theme === 'dark' ? 'text-cyan-400' : 'text-blue-600',
                    dockSide === 'right' &&
                      (theme === 'dark'
                        ? 'bg-cyan-500/20 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/30'
                        : 'bg-blue-500/20 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/30')
                  )}
                >
                  <PanelRight className="w-4 h-4" />
                </button>

                {/* Master menu toggle (existing rendering kept) */}
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
                          return <div key={option.id} className={cn('my-1 h-px', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')} />;
                        }

                        return (
                          <button
                            key={option.id}
                            onClick={option.action}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 text-sm',
                              'transition-colors duration-150 hover:bg-gray-500/10',
                              theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900',
                              (option as any).className
                            )}
                          >
                            <span className="w-4 h-4 flex items-center justify-center shrink-0">{(option as any).icon}</span>
                            <span className="flex-1 text-left">{(option as any).label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapse/Expand Control Row (kept) */}
          {!collapsedUp && (
            <div className={cn('flex items-center gap-2 px-3 py-2 border-b', borderClass, theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50/50')}>
              <button
                type="button"
                onClick={onToggleCollapsedSide}
                aria-label={collapsedSide ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsedSide ? 'Expand sidebar' : 'Collapse sidebar'}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer',
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
                <div className="flex flex-col gap-0.5">
                  <span className={cn('text-xs font-mono', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                    {workspaceShortcutRangeLegend()} sections · ⌘K / Ctrl+K search
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Operations list */}
          <div className={cn('flex-1 min-h-0', collapsedUp ? 'hidden' : 'block')}>
            {collapsedSide ? (
              <>
                <div className="flex justify-center py-2 px-2">
                  <button
                    type="button"
                    onClick={onToggleCollapsedSide}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    className={cn(
                      'w-11 h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer',
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

                    const upgradeTier = getUpgradeTier(operation);
                    const isGated = !!upgradeTier;
                    const isHardDisabled = !!operation.disabled;

                    const isDisabledUI = isHardDisabled || isGated;

                    const badgeData = getEffectiveBadge(operation);
                    const digitHint = slotToKey(index + 1) ? workspaceShortcutLabelForDigit(index + 1) : null;

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
                            isActive &&
                              (theme === 'dark'
                                ? 'ring-2 ring-cyan-500/80 rounded-xl shadow-lg shadow-cyan-500/30'
                                : 'ring-2 ring-blue-500/80 rounded-xl shadow-lg shadow-blue-500/30')
                          )}
                          style={{ animation: `slideInRight 0.2s ease-out ${index * 0.02}s both` }}
                        >
                          {/* Wrapper keeps existing layout intact, but allows an Upgrade button beside */}
                          <div className="flex items-stretch gap-2">
                            <button
                              type="button"
                              onClick={() => handleOperationClick(operation)}
                              disabled={isHardDisabled || isGated}
                              aria-label={operation.description || operation.label}
                              aria-current={isActive ? 'page' : undefined}
                              aria-disabled={isDisabledUI}
                              title={
                                digitHint
                                  ? `${digitHint} — ${getEffectiveTitle(operation)}`
                                  : getEffectiveTitle(operation)
                              }
                              className={cn(
                                'w-full flex items-center gap-3 px-3.5 py-2.5 relative z-10 cursor-pointer text-left',
                                'text-sm font-medium transition-all duration-200',
                                'focus:outline-none focus:ring-2 focus:ring-offset-0 group',
                                theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',

                                isActive &&
                                  (theme === 'dark'
                                    ? 'bg-gray-900 text-cyan-300 rounded-xl border-r-4 border-cyan-500/90 shadow-inner shadow-cyan-500/10'
                                    : 'bg-white text-blue-700 rounded-xl border-r-4 border-blue-500/90 shadow-inner shadow-blue-500/10'),

                                !isActive &&
                                  !isDisabledUI &&
                                  (theme === 'dark'
                                    ? 'text-gray-400 bg-gray-900/30 hover:text-gray-200 hover:bg-gray-800/40 rounded-lg hover:ring-1 hover:ring-gray-700/40'
                                    : 'text-gray-600 bg-gray-100/30 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg hover:ring-1 hover:ring-gray-300/40'),

                                isDisabledUI &&
                                  (theme === 'dark'
                                    ? 'opacity-40 cursor-not-allowed text-gray-600'
                                    : 'opacity-40 cursor-not-allowed text-gray-400')
                              )}
                            >
                              {operation.icon && (
                                <span
                                  className={cn(
                                    'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all duration-200',
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

                              <div className="flex-1 flex items-center justify-between gap-1.5 min-w-0">
                                <span className="text-sm leading-snug break-words whitespace-normal min-w-0">{operation.label}</span>

                                {/* Always show status badges via badgeData */}
                                {badgeData !== undefined && !Array.isArray(operation.badge) && (
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0',
                                      badgeData.config.bgColor,
                                      badgeData.config.textColor,
                                      theme === 'dark' ? badgeData.config.darkBgColor : '',
                                      isActive && 'ring-2 ring-offset-1',
                                      theme === 'dark' ? 'ring-offset-gray-900' : 'ring-offset-white'
                                    )}
                                  >
                                    {badgeData.text}
                                  </span>
                                )}

                                {/* Render multiple badges if present (for custom badges array) */}
                                {Array.isArray(operation.badge) && renderMultipleBadges(operation.badge)}

                                {digitHint && (
                                  <kbd
                                    className={cn(
                                      'shrink-0 px-1 py-0.5 rounded text-[9px] leading-none font-mono font-semibold border',
                                      theme === 'dark'
                                        ? 'border-gray-600 bg-gray-800/80 text-gray-300'
                                        : 'border-gray-200 bg-gray-50 text-gray-600',
                                    )}
                                  >
                                    {digitHint}
                                  </kbd>
                                )}
                              </div>

                              {isActive && (
                                <div className="flex-shrink-0 ml-2">
                                  <div className={cn('w-2 h-2 rotate-45 animate-pulse', theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600')} />
                                </div>
                              )}
                            </button>

                            {/* UPGRADE BUTTON — only when gated, not hard-disabled */}
                            {isGated && !isHardDisabled && upgradeTier && (
                              <button
                                type="button"
                                onClick={() => requestUpgrade(upgradeTier)}
                                title={`Upgrade to ${tierLabel(upgradeTier)} to unlock`}
                                aria-label={`Upgrade to ${tierLabel(upgradeTier)} to unlock ${operation.label}`}
                                className={cn(
                                  'shrink-0 px-3 rounded-xl',
                                  'text-xs font-bold flex items-center gap-2',
                                  'transition-all duration-200',
                                  theme === 'dark'
                                    ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 ring-1 ring-amber-500/30'
                                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 ring-1 ring-amber-300'
                                )}
                              >
                                <Crown className="w-4 h-4" />
                                Upgrade
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {sidebarFooter && !collapsedSide && <div className={cn('border-t px-4 py-3', borderClass)}>{sidebarFooter}</div>}
        </>
      )}

      {isFloating && <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/30 rounded-2xl" />}
    </aside>
  );
};

QuickActionsSidebar.displayName = 'QuickActionsSidebar';