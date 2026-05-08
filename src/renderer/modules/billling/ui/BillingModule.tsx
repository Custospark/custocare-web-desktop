import { LayoutDashboard, ListOrdered, Workflow, Receipt } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, BILLING_ROUTES } from '../../../app/routes/routeConstants';

const BILLING_OPERATIONS = [
  {
    id: 'overview',
    label: 'Financial Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Track billing trends, collections, and operational performance',
  },
  {
    id: 'patients',
    label: 'Billing Intake',
    icon: <ListOrdered className="w-4 h-4" />,
    subtext: 'Select queue visits or quick-start walk-ins for billing',
  },
  {
    id: 'action-center',
    label: 'Billing Encounter',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Patient context, billing actions, and encounter-level flow control',
  },
  {
    id: 'revenue',
    label: 'Receipts, Invoices & Reconciliation',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Manage receipts, derive invoices, and run reconciliation',
  },
];

const BillingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Billing Operations"
      operations={BILLING_OPERATIONS}
      basePath={ROUTES.BILLING}
      defaultOperationPath={BILLING_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default BillingModule;