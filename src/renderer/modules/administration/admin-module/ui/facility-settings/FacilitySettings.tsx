/**
 * ============================================================================
 * FACILITY SETTINGS (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Image } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../../shared/components/workspace/BaseActionWorkspace';
import { ADMINISTRATION_FACILITY_SETTINGS_ROUTES } from '../../../../../app/routes/constants/administration.paths';
import { FaBuilding } from 'react-icons/fa';

interface FacilitySettingsProps {
  theme: 'light' | 'dark';
}

const FacilitySettings: React.FC<FacilitySettingsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Enterprise Facility Settings"
      icon={<FaBuilding className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY}
      actions={[
        {
          key: 'identity',
          label: 'Facility Identity',
          icon: <Image className="w-4 h-4" />,
          to: ADMINISTRATION_FACILITY_SETTINGS_ROUTES.FACILITY_IDENTITY,
          description: 'Manage branding, currency, and tax settings for the facility',
        },
        // {
        //   key: 'policies',
        //   label: 'Operational Policies',
        //   icon: <CreditCard className="w-4 h-4" />,
        //   to: ADMINISTRATION_FACILITY_SETTINGS_ROUTES.OPERATIONAL_POLICIES,
        //   description: 'Configure rules, billing policies, and operational guidelines',
        // },
      ]}
    />
  );
};

export default FacilitySettings;