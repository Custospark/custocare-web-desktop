import React from 'react';
import { Receipt, FileCheck } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { CLINICAL_ROUTES } from '../../../../app/routes/routeConstants';

interface ClinicalBillingCycleProps {
  theme: 'light' | 'dark';
}

const ClinicalBillingCycle: React.FC<ClinicalBillingCycleProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Revenue Cycle Management"
      icon={<Receipt className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={CLINICAL_ROUTES.BILLING_CYCLE_REVIEW}
      actions={[
        {
          key: 'billing_review',
          label: 'Billing Review',
          icon: <FileCheck className="w-4 h-4" />,
          to: CLINICAL_ROUTES.BILLING_CYCLE_REVIEW,
        },
      ]}
    />
  );
};

export default ClinicalBillingCycle;
