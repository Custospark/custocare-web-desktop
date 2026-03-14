/**
 * ============================================================================
 * BASE MODULE WORKSPACE (ROUTER-DRIVEN) — with tier gating + badges
 * ============================================================================
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Crown, AlertTriangle, FlaskConical, Sparkles } from 'lucide-react';

import { ContentLayout, type Operation as ContentOperation } from '../content/ContentLayout';
import type { RootState } from '../../../app/store/rootReducer';

import type { BadgeSpec } from '../../utils/Badge';
import { hasTier, tierLabel, type FeatureStatus, type PlanTier } from '../../entitlements/entitlements';

export type ModuleOperation = ContentOperation & {
  // NEW: gating + badges
  requiredTier?: PlanTier;
  status?: FeatureStatus;
  badges?: (BadgeSpec | string)[];
  disabledReason?: string;

  // legacy-compatible for sidebars/content layouts that support it
  badge?: any;
};

export interface ModuleWorkspaceProps {
  contextTitle: string;
  operations: ModuleOperation[];
  basePath: string;

  // existing (kept for compatibility; parent routing may already redirect)
  defaultOperationPath: string;

  // NEW: UI-first gating
  currentTier?: PlanTier;
  onRequestUpgrade?: (requiredTier: PlanTier) => void;

  // NEW: module-level gating (disables *everything* in module)
  moduleRequiredTier?: PlanTier;
  moduleDisabledReason?: string;
}

function buildStatusBadges(status: FeatureStatus | undefined): BadgeSpec[] {
  if (!status) return [];

  if (status === 'beta') {
    return [
      { text: 'BETA', tone: 'info', icon: <FlaskConical className="w-3 h-3" />, title: 'This feature is in beta' },
    ];
  }
  if (status === 'new') {
    return [
      { text: 'NEW', tone: 'success', icon: <Sparkles className="w-3 h-3" />, title: 'Recently added feature' },
    ];
  }
  if (status === 'deprecated') {
    return [
      {
        text: 'DEPRECATED',
        tone: 'warning',
        icon: <AlertTriangle className="w-3 h-3" />,
        title: 'This feature will be removed in a future release',
      },
    ];
  }
  return [];
}

function normalizeCustomBadges(badges: ModuleOperation['badges']): BadgeSpec[] {
  if (!badges) return [];
  return badges.map((b) => (typeof b === 'string' ? ({ text: b, tone: 'neutral' } as BadgeSpec) : b));
}

export function BaseModuleWorkspace({
  contextTitle,
  operations,
  basePath,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultOperationPath,

  currentTier = 'essential',
  onRequestUpgrade,

  moduleRequiredTier,
  moduleDisabledReason,
}: ModuleWorkspaceProps) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const location = useLocation();
  const navigate = useNavigate();

  const moduleTierBlocked = moduleRequiredTier ? !hasTier(currentTier, moduleRequiredTier) : false;

  const activeOperationId = useMemo(() => {
    const path = location.pathname;
    if (!path.startsWith(basePath)) return undefined;

    const remainder = path.slice(basePath.length);
    const segments = remainder.split('/').filter(Boolean);
    return segments[0];
  }, [location.pathname, basePath]);

  const uiOperations: ModuleOperation[] = useMemo(() => {
    return operations.map((op) => {
      const opTierBlocked = op.requiredTier ? !hasTier(currentTier, op.requiredTier) : false;

      const effectiveDisabled = moduleTierBlocked || !!op.disabled || opTierBlocked;

      const effectiveReason =
        moduleDisabledReason ??
        op.disabledReason ??
        (moduleTierBlocked && moduleRequiredTier ? `Requires ${tierLabel(moduleRequiredTier)} tier` : undefined) ??
        (opTierBlocked && op.requiredTier ? `Requires ${tierLabel(op.requiredTier)} tier` : undefined);

      const statusBadges = buildStatusBadges(op.status);

      const tierBadge: BadgeSpec[] = op.requiredTier
        ? [
            {
              text: tierLabel(op.requiredTier),
              tone: 'premium',
              icon: <Crown className="w-3 h-3" />,
              title: `Available on ${tierLabel(op.requiredTier)} tier and above`,
              onClick: opTierBlocked ? () => onRequestUpgrade?.(op.requiredTier!) : undefined,
            },
          ]
        : [];

      const moduleBadge: BadgeSpec[] = moduleRequiredTier
        ? [
            {
              text: `${tierLabel(moduleRequiredTier)} Module`,
              tone: 'premium',
              icon: <Crown className="w-3 h-3" />,
              title: `This module requires ${tierLabel(moduleRequiredTier)} tier`,
              onClick: moduleTierBlocked ? () => onRequestUpgrade?.(moduleRequiredTier!) : undefined,
            },
          ]
        : [];

      const customBadges = normalizeCustomBadges(op.badges);

      // For maximum compatibility: set "badge" too (many layouts only support a single badge)
      const badgesForUI = [...statusBadges, ...tierBadge, ...customBadges];
      const badgeProp = badgesForUI.length > 0 ? badgesForUI : undefined;

      return {
        ...op,
        disabled: effectiveDisabled,
        disabledReason: effectiveReason,
        badge: badgeProp,
        // optionally keep full list for any consumer that supports it
        badges: [...moduleBadge, ...badgesForUI],
      };
    });
  }, [
    operations,
    currentTier,
    onRequestUpgrade,
    moduleRequiredTier,
    moduleTierBlocked,
    moduleDisabledReason,
  ]);

  // Choose a safe fallback operation (first enabled)
  const fallbackOperation = useMemo(() => {
    const firstEnabled = uiOperations.find((op) => !op.disabled)?.id;
    return firstEnabled ?? uiOperations[0]?.id ?? 'overview';
  }, [uiOperations]);

  // If user navigates directly to a disabled operation, redirect to fallback
  useEffect(() => {
    if (!activeOperationId) return;

    const op = uiOperations.find((x) => x.id === activeOperationId);
    if (!op) return;

    if (op.disabled) {
      const target = fallbackOperation;
      if (target && target !== activeOperationId) navigate(`${basePath}/${target}`, { replace: true });
    }
  }, [activeOperationId, uiOperations, fallbackOperation, navigate, basePath]);

  const onOperationChange = useCallback(
    (operationId: string) => {
      const op = uiOperations.find((x) => x.id === operationId);
      if (!op) return;

      // If module is tier-blocked, prefer upgrading module-tier
      if (moduleTierBlocked && moduleRequiredTier) {
        onRequestUpgrade?.(moduleRequiredTier);
        return;
      }

      // If operation is tier-blocked, prefer upgrading op-tier
      const opTierBlocked = op.requiredTier ? !hasTier(currentTier, op.requiredTier) : false;
      if (opTierBlocked && op.requiredTier) {
        onRequestUpgrade?.(op.requiredTier);
        return;
      }

      if (op.disabled) return;

      navigate(`${basePath}/${operationId}`);
    },
    [uiOperations, navigate, basePath, moduleTierBlocked, moduleRequiredTier, onRequestUpgrade, currentTier]
  );

  return (
    <ContentLayout
      operations={uiOperations}
      activeOperation={(activeOperationId ?? fallbackOperation) as string}
      onOperationChange={onOperationChange}
      defaultOperation={fallbackOperation as string}
      contextTitle={contextTitle}
    >
      {/* Router renders operation content */}
      <OutletWrapper theme={theme} />
    </ContentLayout>
  );
}

/**
 * Pass theme via Outlet context
 */
function OutletWrapper({ theme }: { theme: 'light' | 'dark' }) {
  return <Outlet context={{ theme }} />;
}
