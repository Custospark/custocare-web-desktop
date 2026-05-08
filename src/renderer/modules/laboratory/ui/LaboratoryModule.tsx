import {
  ClipboardList,
  LayoutDashboard,
  Receipt,
  Users,
  Workflow,
} from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, LABORATORY_ROUTES } from '../../../app/routes/routeConstants';

const LABORATORY_OPERATIONS = [
  {
    id: 'overview',
    label: 'Laboratory Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Track test volume, diagnostic workload, and lab operational performance',
  },
  {
    id: 'patients',
    label: 'Lab Intake',
    icon: <Users className="w-4 h-4" />,
    subtext: 'Queue and quick intake for patients proceeding to laboratory workflow',
  },
  {
    id: 'action-center',
    label: 'Lab Encounter Center',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Patient context with lab request, results entry, and billing actions',
  },
  {
    id: 'catalog',
    label: 'Service & Inventory Catalog',
    icon: <ClipboardList className="w-4 h-4" />,
    subtext: 'Manage billable laboratory services and inventory items together',
  },
  {
    id: 'receipts',
    label: 'Billing & Receipts',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Review captured charges and issued receipts for laboratory encounters',
  },
];

const LaboratoryModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Laboratory Services"
      operations={LABORATORY_OPERATIONS}
      basePath={ROUTES.LABORATORY}
      defaultOperationPath={LABORATORY_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default LaboratoryModule;