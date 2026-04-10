// MRBilling.tsx
/**
 * ============================================================================
 * BILLING / REVENUE CYCLE WORKSPACE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Receipt, FileCheck, Activity } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { ADMIN_ROUTES } from '../../../../app/routes/constants/administration.paths';

interface MRBillingProps {
  theme: 'light' | 'dark';
}

const FacilityAdminBillingCycle: React.FC<MRBillingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Revenue Cycle Management"
      icon={<Receipt className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ADMIN_ROUTES.BILLING_CYCLE_REVENUE_STATS}
      actions={[

          {
          key: 'billing_stats',
          label: 'Billing Statistics',
          icon: <Activity className="w-4 h-4" />,
          to: ADMIN_ROUTES.BILLING_CYCLE_REVENUE_STATS,
        },
        {
          key: 'billing_review',
          label: 'Billing Review',
          icon: <FileCheck className="w-4 h-4" />,
          to: ADMIN_ROUTES.BILLING_CYCLE_BILLING_REVIEW,
        },
      
       
      ]}
    />
  );
};

export default FacilityAdminBillingCycle;