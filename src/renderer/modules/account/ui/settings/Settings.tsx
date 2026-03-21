/**
 * ============================================================================
 * SETTINGS MODULE (ROUTER-DRIVEN) — with action gating + badges
 * ============================================================================
 */

import React, { useCallback } from 'react';
import { User, Shield, Settings as SettingsIcon } from 'lucide-react';
import { FaPalette } from 'react-icons/fa';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import type { PlanTier } from '../../../../shared/entitlements/entitlements';

interface SettingsProps {
  theme: 'light' | 'dark';
}

const Settings: React.FC<SettingsProps> = ({ theme }) => {
  // UI-first test: wire to backend later
  const currentTier: PlanTier = 'essential';

  const onRequestUpgrade = useCallback((requiredTier: PlanTier) => {
    alert(`Upgrade required: ${requiredTier}`);
  }, []);

  return (
    <BaseActionWorkspace
      title="Account Center"
      icon={<SettingsIcon className="w-6 h-6" />}
      theme={theme}
      currentTier={currentTier}
      onRequestUpgrade={onRequestUpgrade}
      defaultActionTo={ACCOUNT_ROUTES.SETTINGS_PROFILE}
      actions={[
        {
          key: 'profile',
          label: 'My Profile',
          icon: <User className="w-4 h-4" />,
          to: ACCOUNT_ROUTES.SETTINGS_PROFILE,
          description: 'Maintain and update your account identity information',
          // badges: ['Core'],
        },
        {
          key: 'security',
          label: 'Account Security',
          icon: <Shield className="w-4 h-4" />,
          to: ACCOUNT_ROUTES.SETTINGS_SECURITY,
          description: 'Configure password policies and multi-factor authentication',
          // status: 'new',
        },
        {
          key: 'preferences',
          label: 'User Preferences',
          icon: <FaPalette className="w-4 h-4" />,
          to: ACCOUNT_ROUTES.SETTINGS_PREFERENCES,
          description: 'Customize interface behavior and system experience',
          // requiredTier: 'professional',
          // badges: ['Recommended'],
        },
      ]}
    />
  );
};

export default Settings;
