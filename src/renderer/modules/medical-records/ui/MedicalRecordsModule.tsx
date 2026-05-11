import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { MEDICAL_RECORDS_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, MEDICAL_RECORDS_ROUTES } from '../../../app/routes/routeConstants';
/**
 * Note: The id must match an existing route for that base module.
 */
const MedicalRecordsModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Medical Records"
      operations={MEDICAL_RECORDS_MODULE_OPERATIONS}
      basePath={ROUTES.MEDICAL_RECORDS}
      defaultOperationPath={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH}
    />
  );
};

export default MedicalRecordsModule;
