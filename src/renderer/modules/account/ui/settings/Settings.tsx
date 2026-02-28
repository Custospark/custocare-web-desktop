/**
 * ============================================================================
 * SETTINGS MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { User, Shield, Settings as SettingsIcon } from 'lucide-react';
import { FaPalette } from 'react-icons/fa';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';

interface SettingsProps {
  theme: 'light' | 'dark';
}

const Settings: React.FC<SettingsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Account Administration"
      icon={<SettingsIcon className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ACCOUNT_ROUTES.SETTINGS_PROFILE}
      actions={[
        { 
          key: 'profile', 
          label: 'Profile Management', 
          icon: <User className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.SETTINGS_PROFILE,
          description: 'Maintain and update your account identity information'
        },
        { 
          key: 'security', 
          label: 'Security & Authentication', 
          icon: <Shield className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.SETTINGS_SECURITY,
          description: 'Configure password policies and multi-factor authentication'
        },
        { 
          key: 'preferences', 
          label: 'User Preferences', 
          icon: <FaPalette className="w-4 h-4" />, 
          to: ACCOUNT_ROUTES.SETTINGS_PREFERENCES,
          description: 'Customize interface behavior and system experience'
        },
      ]}
    />
  );
};

export default Settings;