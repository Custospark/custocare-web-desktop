// MRBilling.tsx
/**
 * ============================================================================
 * BILLING / REVENUE CYCLE WORKSPACE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Receipt, FileCheck } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

interface MRBillingProps {
  theme: 'light' | 'dark';
}

const MRBillingCycle: React.FC<MRBillingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Revenue Cycle Management"
      icon={<Receipt className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={MEDICAL_RECORDS_ROUTES.BILLING_CYCLE_REVIEW}
      actions={[
        {
          key: 'billing_review',
          label: 'Billing Review',
          icon: <FileCheck className="w-4 h-4" />,
          to: MEDICAL_RECORDS_ROUTES.BILLING_CYCLE_REVIEW,
        },
       
      ]}
    />
  );
};

export default MRBillingCycle;