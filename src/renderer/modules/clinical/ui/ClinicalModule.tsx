import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { CLINICAL_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, CLINICAL_ROUTES } from '../../../app/routes/routeConstants';

const ClinicalModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Clinical"
      operations={CLINICAL_MODULE_OPERATIONS}
      basePath={ROUTES.CLINICAL}
      defaultOperationPath={CLINICAL_ROUTES.PATIENTS_SEARCH}
    />
  );
};

export default ClinicalModule;
