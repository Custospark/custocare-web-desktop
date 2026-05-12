import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { PATIENT_PORTAL_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, PATIENT_PORTAL_ROUTES } from '../../../app/routes/routeConstants';

const PatientPortalModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Patient Portal"
      operations={PATIENT_PORTAL_MODULE_OPERATIONS}
      basePath={ROUTES.PATIENT_DASHBOARD}
      defaultOperationPath={PATIENT_PORTAL_ROUTES.DASHBOARD}
    />
  );
};

export default PatientPortalModule;
