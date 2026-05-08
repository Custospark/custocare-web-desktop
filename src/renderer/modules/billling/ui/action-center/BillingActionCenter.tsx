import React from 'react';
import { Receipt } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { BILLING_ROUTES } from '../../../../app/routes/routeConstants';

interface BillingActionCenterProps {
  theme: 'light' | 'dark';
}

const BillingActionCenter: React.FC<BillingActionCenterProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Charge Capture Center"
      icon={<Receipt className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={BILLING_ROUTES.BILLING_SPACE}
      actions={[
        {
          key: 'billing-space',
          label: 'Payment Entry Workspace',
          icon: <Receipt className="h-4 w-4" />,
          to: BILLING_ROUTES.BILLING_SPACE,
          description: 'Open billing tray to capture and settle visit charges',
        },
      ]}
    />
  );
};

export default BillingActionCenter;
