/**
 * Laboratory shell — operation ids must match path segments under `/laboratory`.
 */
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { LABORATORY_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, LABORATORY_ROUTES } from '../../../app/routes/routeConstants';

const LaboratoryModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Laboratory Services"
      operations={LABORATORY_MODULE_OPERATIONS}
      basePath={ROUTES.LABORATORY}
      defaultOperationPath={LABORATORY_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default LaboratoryModule;
