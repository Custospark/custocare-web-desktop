import { LayoutDashboard, Users, Workflow, Receipt } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, CLINICAL_ROUTES } from '../../../app/routes/routeConstants';

const CLINICAL_OPERATIONS = [
  {
    id: 'overview',
    label: 'Clinical Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'patients',
    label: 'Patient Registry Management',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'visit-action-center',
    label: 'Clinical Encounter Workflow',
    icon: <Workflow className="w-4 h-4" />,
  },
  {
    id: 'revenue',
    label: 'Billing & Reconciliation',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Validate and reconcile clinical charges',
  },
];

const ClinicalModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Clinical"
      operations={CLINICAL_OPERATIONS}
      basePath={ROUTES.CLINICAL}
      defaultOperationPath={CLINICAL_ROUTES.PATIENTS_SEARCH}
    />
  );
};

export default ClinicalModule;