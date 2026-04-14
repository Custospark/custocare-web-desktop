/**
 * ============================================================================
 * FACILITY MANAGEMENT MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Building2, CreditCard, Layers, BarChart2, ShieldCheck } from 'lucide-react';
import { PLATFORM_ADMIN_ROUTES } from '../../../app/routes/constants/platform-administration.paths';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';
interface FacilityManagementProps {
  theme: 'light' | 'dark';
}

const FacilityManagement: React.FC<FacilityManagementProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Facility Management"
      icon={<Building2 className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PLATFORM_ADMIN_ROUTES.FACILITIES}
      actions={[
        { 
          key: 'stats', 
          label: 'Facility Statistics', 
          icon: <BarChart2 className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.FACILITIES_STATS 
        },
        { 
          key: 'platform-facility-governance', 
          label: 'Facility Governance', 
          icon: <ShieldCheck className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.PLATFORM_FACILITY_GOVERNANCE 
        },
        { 
          key: 'plans', 
          label: 'Plans', 
          icon: <Layers className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.FACILITIES_PLANS 
        },
        { 
          key: 'subscriptions', 
          label: 'Subscriptions', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.FACILITIES_SUBSCRIPTIONS 
        },
      ]}
    />
  );
};

export default FacilityManagement;