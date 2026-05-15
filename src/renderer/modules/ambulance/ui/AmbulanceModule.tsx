import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { AMBULANCE_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, AMBULANCE_ROUTES } from '../../../app/routes/routeConstants';

const AmbulanceModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Ambulance Services"
      operations={AMBULANCE_MODULE_OPERATIONS}
      basePath={ROUTES.AMBULANCE}
      defaultOperationPath={AMBULANCE_ROUTES.OVERVIEW}
    />
  );
};

export default AmbulanceModule;
