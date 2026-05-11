/**
 * Pharmacy shell — sidebar labels follow the same convention as Medical Records
 * (capability name + purpose). Route `id` values must match path segments under `/pharmacy`.
 */
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { PHARMACY_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, PHARMACY_ROUTES } from '../../../app/routes/routeConstants';

const PharmacyModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Pharmacy Services"
      operations={PHARMACY_MODULE_OPERATIONS}
      basePath={ROUTES.PHARMACY}
      defaultOperationPath={PHARMACY_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default PharmacyModule;
