import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Crown, AlertTriangle, FlaskConical, Sparkles } from 'lucide-react';

import { ContentLayout, type Operation as ContentOperation } from '../content/ContentLayout';
import type { RootState } from '../../../app/store/rootReducer';

import type { BadgeSpec } from '../../utils/Badge';
import { hasTier, tierLabel, type FeatureStatus, type PlanTier } from '../../entitlements/entitlements';

export type ModuleOperation = Omit<ContentOperation, 'badge'> & {
  requiredTier?: PlanTier;
  status?: FeatureStatus;
  badges?: (BadgeSpec | string)[];
  disabledReason?: string;
  badge?: string | number | BadgeSpec | BadgeSpec[]; // Now properly overrides
  /** Optional short line under the label in module chrome (not all surfaces render it). */
  subtext?: string;
};

export interface ModuleWorkspaceProps {
  contextTitle: string;
  operations: ModuleOperation[];
  basePath: string;
  defaultOperationPath: string;

  currentTier?: PlanTier;
  onRequestUpgrade?: (requiredTier: PlanTier) => void;

  moduleDisabledReason?: string;

  /**
   * NEW: plans page URL for upgrade redirect
   */
  plansPageUrl?: string;
}

function buildStatusBadges(status: FeatureStatus | undefined): BadgeSpec[] {
  if (!status) return [];

  if (status === 'beta') {
    return [{ text: 'BETA', tone: 'info', icon: <FlaskConical className="w-3 h-3" />, title: 'This feature is in beta' }];
  }
  if (status === 'new') {
    return [{ text: 'NEW', tone: 'success', icon: <Sparkles className="w-3 h-3" />, title: 'Recently added feature' }];
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
  currentTier = 'essential',
  onRequestUpgrade,
  moduleDisabledReason,
  plansPageUrl = '/plans',
}: ModuleWorkspaceProps) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const location = useLocation();
  const navigate = useNavigate();

  const returnUrl = `${location.pathname}${location.search ?? ''}`;

  const requestUpgrade = useCallback(
    (tier: PlanTier) => {
      onRequestUpgrade?.(tier);
      navigate(plansPageUrl, {
        state: { requiredTier: tier, returnUrl },
      });
    },
    [onRequestUpgrade, navigate, plansPageUrl, returnUrl]
  );

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

    // keep existing behavior: op becomes disabled if tier-blocked or explicitly disabled
    const effectiveDisabled = !!op.disabled || opTierBlocked;

    const effectiveReason =
      moduleDisabledReason ??
      op.disabledReason ??
      (opTierBlocked && op.requiredTier ? `Requires ${tierLabel(op.requiredTier)} Plan` : undefined);

    const statusBadges = buildStatusBadges(op.status);

    // Tier badge is clickable when blocked => goes to Plans page
    const tierBadge: BadgeSpec[] = op.requiredTier && opTierBlocked
      ? [
          {
            text: tierLabel(op.requiredTier),
            tone: 'premium',
            icon: <Crown className="w-3 h-3" />,
            title: `Available on ${tierLabel(op.requiredTier)} tier and above`,
            onClick: () => requestUpgrade(op.requiredTier!),
          },
        ]
      : [];

    const customBadges = normalizeCustomBadges(op.badges);

    // Always include status badges, conditionally include tier badges (only when blocked)
    const badgesForUI = [...statusBadges, ...tierBadge, ...customBadges];
    const badgeProp = badgesForUI.length > 0 ? badgesForUI : undefined;

    return {
      ...op,
      disabled: effectiveDisabled,
      disabledReason: effectiveReason,
      badge: badgeProp,
    };
  });
}, [operations, currentTier, moduleDisabledReason, requestUpgrade]);

  const fallbackOperation = useMemo(() => {
    const firstEnabled = uiOperations.find((op) => !op.disabled)?.id;
    return firstEnabled ?? uiOperations[0]?.id ?? 'overview';
  }, [uiOperations]);

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

      // If operation is tier-blocked => go to Plans page
      const opTierBlocked = op.requiredTier ? !hasTier(currentTier, op.requiredTier) : false;
      if (opTierBlocked && op.requiredTier) {
        requestUpgrade(op.requiredTier);
        return;
      }

      if (op.disabled) return;
      navigate(`${basePath}/${operationId}`);
    },
    [uiOperations, navigate, basePath, currentTier, requestUpgrade]
  );

  return (
    <ContentLayout
      operations={uiOperations}
      activeOperation={(activeOperationId ?? fallbackOperation) as string}
      onOperationChange={onOperationChange}
      defaultOperation={fallbackOperation as string}
      contextTitle={contextTitle}
    >
      <OutletWrapper theme={theme} />
    </ContentLayout>
  );
}

function OutletWrapper({ theme }: { theme: 'light' | 'dark' }) {
  return <Outlet context={{ theme }} />;
}
