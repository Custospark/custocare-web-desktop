import React from 'react';
import { ListOrdered, PersonStanding } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { BILLING_ROUTES } from '../../../../app/routes/routeConstants';

interface BillingFrontDeskProps {
  theme: 'light' | 'dark';
}

const BillingFrontDesk: React.FC<BillingFrontDeskProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Billing Intake"
      icon={<PersonStanding className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={BILLING_ROUTES.PATIENT_QUEUE}
      actions={[
        {
          key: 'billing-queue',
          label: 'Billing Queue',
          icon: <ListOrdered className="h-4 w-4" />,
          to: BILLING_ROUTES.PATIENT_QUEUE,
          description: 'Visits ready for charge capture and payment entry',
        },
        {
          key: 'express-intake',
          label: 'Express Intake',
          icon: <PersonStanding className="h-4 w-4" />,
          to: BILLING_ROUTES.WALKIN_PATIENT,
          description: 'Quick-start walk-in billing sessions',
        },
      ]}
    />
  );
};

export default BillingFrontDesk;
