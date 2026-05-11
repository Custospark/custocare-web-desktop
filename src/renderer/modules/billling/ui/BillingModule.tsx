import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { BILLING_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, BILLING_ROUTES } from '../../../app/routes/routeConstants';

const BillingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Billing Operations"
      operations={BILLING_MODULE_OPERATIONS}
      basePath={ROUTES.BILLING}
      defaultOperationPath={BILLING_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default BillingModule;
