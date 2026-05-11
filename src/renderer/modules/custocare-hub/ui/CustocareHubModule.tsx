import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { CUSTOCARE_HUB_WORKSPACE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, CUSTOCARE_HUB_ROUTES } from '../../../app/routes/routeConstants';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';

const CustocareHubModule = (_props: ThemeProp) => {
  return (
    <BaseModuleWorkspace
      contextTitle="Custocare Hub"
      operations={CUSTOCARE_HUB_WORKSPACE_OPERATIONS}
      basePath={ROUTES.CUSTOCARE_HUB}
      defaultOperationPath={CUSTOCARE_HUB_ROUTES.LEARNING_CENTER}
    />
  );
};

export default CustocareHubModule;
