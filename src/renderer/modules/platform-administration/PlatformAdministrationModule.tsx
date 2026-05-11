/**
 * ============================================================================
 * PLATFORM ADMINISTRATION MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { PLATFORM_ADMINISTRATION_MODULE_OPERATIONS } from '../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES } from '../../app/routes/routeConstants';
import { PLATFORM_ADMIN_ROUTES } from '../../app/routes/constants/platform-administration.paths';

const PlatformAdministrationModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Platform Administration"
      operations={PLATFORM_ADMINISTRATION_MODULE_OPERATIONS}
      basePath={ROUTES.PLATFORM_ADMINISTRATION}
      defaultOperationPath={PLATFORM_ADMIN_ROUTES.FACILITIES}
    />
  );
};

export default PlatformAdministrationModule;
