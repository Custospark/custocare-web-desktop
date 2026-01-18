import React from 'react';
import { CreditCard, FileText, Receipt, AlertOctagon, History, Filter } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { BILLING_ROUTES } from '../../../../app/routes/routeConstants';

interface BillingProps {
  theme: 'light' | 'dark';
}

const Billing: React.FC<BillingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Billing"
      icon={<CreditCard className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={BILLING_ROUTES.INVOICES}
      actions={[
        { 
          key: 'invoices', 
          label: 'Invoices', 
          icon: <FileText className="w-4 h-4" />, 
          to: BILLING_ROUTES.INVOICES 
        },
        { 
          key: 'payments', 
          label: 'Payments', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: BILLING_ROUTES.PAYMENTS 
        },
        { 
          key: 'claims', 
          label: 'Insurance Claims', 
          icon: <Receipt className="w-4 h-4" />, 
          to: BILLING_ROUTES.CLAIMS 
        },
        { 
          key: 'queue', 
          label: 'Billing Queue', 
          icon: <Filter className="w-4 h-4" />, 
          to: `${BILLING_ROUTES.ROOT}/queue` 
        },
        { 
          key: 'history', 
          label: 'History', 
          icon: <History className="w-4 h-4" />, 
          to: `${BILLING_ROUTES.ROOT}/history` 
        },
        { 
          key: 'issues', 
          label: 'Issues', 
          icon: <AlertOctagon className="w-4 h-4" />, 
          to: `${BILLING_ROUTES.ROOT}/issues` 
        },
      ]}
    />
  );
};

export default Billing;