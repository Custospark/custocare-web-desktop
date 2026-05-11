/**
 * ============================================================================
 * ACCOUNT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { Sparkles } from 'lucide-react';
import { useSelector } from 'react-redux';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ACCOUNT_BASE_MODULE_OPERATIONS } from '../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, ACCOUNT_ROUTES } from '../../app/routes/routeConstants';
import type { RootState } from '../../app/store/rootReducer';
import type { ModuleOperation } from '../../shared/components/workspace/BaseModuleWorkspace';

const AccountModule = () => {
  const isStaffWithoutFacility = useSelector(
    (state: RootState) => state.activeContext.isStaffWithoutFacility
  );

  const welcomeOperation: ModuleOperation = {
    id: 'staff_without_facility_assignment',
    label: 'Welcome to Custocare',
    icon: <Sparkles className="w-4 h-4" />,
  };

  const ACCOUNT_OPERATIONS: ModuleOperation[] = isStaffWithoutFacility
    ? [welcomeOperation, ...ACCOUNT_BASE_MODULE_OPERATIONS]
    : ACCOUNT_BASE_MODULE_OPERATIONS;

  const getDefaultOperationPath = () => {
    if (isStaffWithoutFacility) {
      return ACCOUNT_ROUTES.STAFF_WITHOUT_FACILITY || ROUTES.ACCOUNT;
    }
    return ACCOUNT_ROUTES.SETTINGS_PROFILE;
  };

  return (
    <BaseModuleWorkspace
      contextTitle="Account"
      operations={ACCOUNT_OPERATIONS}
      basePath={ROUTES.ACCOUNT}
      defaultOperationPath={getDefaultOperationPath()}
    />
  );
};

export default AccountModule;
