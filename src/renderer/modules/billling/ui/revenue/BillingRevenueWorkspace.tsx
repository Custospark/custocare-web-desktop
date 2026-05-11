import React from 'react';
import { FileText, Receipt } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { BILLING_ROUTES } from '../../../../app/routes/routeConstants';

interface BillingRevenueWorkspaceProps {
  theme: 'light' | 'dark';
}

const BillingRevenueWorkspace: React.FC<BillingRevenueWorkspaceProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Receipts, Invoices & Reconciliation"
      icon={<Receipt className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={BILLING_ROUTES.RECEIPTS_RECONCILIATION}
      actions={[
        {
          key: 'receipts-reconciliation',
          label: 'Receipts & Reconciliation',
          icon: <Receipt className="h-4 w-4" />,
          to: BILLING_ROUTES.RECEIPTS_RECONCILIATION,
        },
        {
          key: 'invoices',
          label: 'Invoices',
          icon: <FileText className="h-4 w-4" />,
          to: BILLING_ROUTES.INVOICES,
          description: 'Receipts, invoices & reconciliation — preview and print from receipt data',
        },
      ]}
    />
  );
};

export default BillingRevenueWorkspace;
