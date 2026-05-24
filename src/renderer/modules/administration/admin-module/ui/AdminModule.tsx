import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { BaseModuleWorkspace } from '../../../../shared/components/workspace/BaseModuleWorkspace';
import { ADMINISTRATION_MODULE_OPERATIONS } from '../../../../shared/navigation/moduleWorkspaceOperations';
import {
  ADMIN_ROUTES,
  ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES,
} from '../../../../app/routes/constants/administration.paths';
import { ROUTES } from '../../../../app/routes/routeConstants';
import type { PlanTier } from '../../../../shared/entitlements/entitlements';
import {
  filterAdministrationModuleOperations,
  useAdministrationSubscriptionRestriction,
} from '../../../../shared/entitlements/useAdministrationSubscriptionRestriction';

const AdminModule: React.FC = () => {
  const currentTier: PlanTier = 'essential';
  const location = useLocation();
  const navigate = useNavigate();
  const { restrictToPlansOnly, isFacilityOwner } = useAdministrationSubscriptionRestriction();

  const moduleOperations = useMemo(
    () =>
      filterAdministrationModuleOperations(
        ADMINISTRATION_MODULE_OPERATIONS,
        restrictToPlansOnly,
        isFacilityOwner,
      ),
    [restrictToPlansOnly, isFacilityOwner],
  );

  const defaultPath = restrictToPlansOnly
    ? ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS
    : ADMIN_ROUTES.OVERVIEW;

  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith(ROUTES.ADMINISTRATION)) {
      return;
    }

    if (
      path.startsWith(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.ROOT) &&
      !isFacilityOwner
    ) {
      navigate(ADMIN_ROUTES.OVERVIEW, { replace: true });
      return;
    }

    if (!restrictToPlansOnly) {
      return;
    }

    if (path.startsWith(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.ROOT)) {
      return;
    }

    navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS, { replace: true });
  }, [restrictToPlansOnly, isFacilityOwner, location.pathname, navigate]);

  const onRequestUpgrade = useCallback((requiredTier: PlanTier) => {
    alert(`Upgrade required: ${requiredTier}`);
  }, []);

  return (
    <BaseModuleWorkspace
      contextTitle="Facility Governance"
      contextSubtitle={
        restrictToPlansOnly
          ? 'Subscription inactive — manage plans and payments to restore full functionality.'
          : undefined
      }
      operations={moduleOperations}
      basePath={ROUTES.ADMINISTRATION}
      defaultOperationPath={defaultPath}
      currentTier={currentTier}
      onRequestUpgrade={onRequestUpgrade}
      plansPageUrl={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS}
    />
  );
};

AdminModule.displayName = 'AdminModule';
export default AdminModule;
