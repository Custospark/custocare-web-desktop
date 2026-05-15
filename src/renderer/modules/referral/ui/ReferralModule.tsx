import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { REFERRAL_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, REFERRAL_ROUTES } from '../../../app/routes/routeConstants';

const ReferralModule = () => (
  <BaseModuleWorkspace
    contextTitle="Referral coordination"
    operations={REFERRAL_MODULE_OPERATIONS}
    basePath={ROUTES.REFERRAL}
    defaultOperationPath={REFERRAL_ROUTES.PATIENT_QUEUE}
  />
);

export default ReferralModule;
