import { LayoutDashboard, DollarSign, FileText, CreditCard } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, BILLING_ROUTES } from '../../../app/routes/routeConstants';

const BILLING_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'claims', label: 'Insurance Claims', icon: <DollarSign className="w-4 h-4" /> },
];

const BillingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Billing & Insurance"
      operations={BILLING_OPERATIONS}
      basePath={ROUTES.BILLING}
      defaultOperationPath={BILLING_ROUTES.OVERVIEW}
    />
  );
};

export default BillingModule;