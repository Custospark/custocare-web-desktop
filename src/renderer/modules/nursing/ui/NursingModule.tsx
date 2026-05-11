import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { NURSING_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, NURSING_ROUTES } from '../../../app/routes/routeConstants';

const NursingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Nursing"
      operations={NURSING_MODULE_OPERATIONS}
      basePath={ROUTES.NURSING}
      defaultOperationPath={NURSING_ROUTES.OVERVIEW}
    />
  );
};

export default NursingModule;
