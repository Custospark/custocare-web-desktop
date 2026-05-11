import React, { useCallback } from 'react';

import { BaseModuleWorkspace } from '../../../../shared/components/workspace/BaseModuleWorkspace';
import { ADMINISTRATION_MODULE_OPERATIONS } from '../../../../shared/navigation/moduleWorkspaceOperations';
import { ADMIN_ROUTES } from '../../../../app/routes/constants/administration.paths';
import { ROUTES } from '../../../../app/routes/routeConstants';
import type { PlanTier } from '../../../../shared/entitlements/entitlements';

const AdminModule: React.FC = () => {
  const currentTier: PlanTier = 'essential';

  const onRequestUpgrade = useCallback((requiredTier: PlanTier) => {
    // Keep your existing behavior (modal/alert/etc)
    alert(`Upgrade required: ${requiredTier}`);
  }, []);

  return (
    <BaseModuleWorkspace
      contextTitle="Facility Governance"
      operations={ADMINISTRATION_MODULE_OPERATIONS}
      basePath={ROUTES.ADMINISTRATION}
      defaultOperationPath={ADMIN_ROUTES.OVERVIEW}
      currentTier={currentTier}
      onRequestUpgrade={onRequestUpgrade}
      plansPageUrl="/plans"
    />
  );
};

AdminModule.displayName = 'AdminModule';
export default AdminModule;
