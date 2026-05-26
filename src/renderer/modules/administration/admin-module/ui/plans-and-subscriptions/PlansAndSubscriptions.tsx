// PlansAndSubscriptions.tsx
/**
 * ============================================================================
 * PLANS & SUBSCRIPTIONS MODULE (ROUTER-DRIVEN) - ADMINISTRATION
 * ============================================================================
 */

import React from 'react';
import { CreditCard, Clock, Zap, FileText } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../../shared/components/workspace/BaseActionWorkspace';

import { ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES } from '../../../../../app/routes/constants/administration.paths';


interface PlansAndSubscriptionsProps {
  theme: 'light' | 'dark';
}

const PlansAndSubscriptions: React.FC<PlansAndSubscriptionsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Plans & Subscriptions"
      icon={<CreditCard className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS}
      actions={[
        { 
          key: 'available-plans', 
          label: 'Available Plans', 
          icon: <Zap className="w-4 h-4" />, 
          to: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS 
        },
        { 
          key: 'subscriptions', 
          label: 'Subscriptions', 
          icon: <Clock className="w-4 h-4" />, 
          to: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.SUBSCRIPTIONS 
        },
        { 
          key: 'payments', 
          label: 'Payments', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.PAYMENTS 
        },
        { 
          key: 'invoices', 
          label: 'Receipts & Invoices', 
          icon: <FileText className="w-4 h-4" />, 
          to: ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.INVOICES 
        },
      ]}
    />
  );
};

export default PlansAndSubscriptions;