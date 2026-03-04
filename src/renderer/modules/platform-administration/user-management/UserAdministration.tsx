/**
 * ============================================================================
 * USER ADMINISTRATION MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Users, Shield, BarChart3 } from 'lucide-react';
import { PLATFORM_ADMIN_ROUTES } from '../../../app/routes/constants/platform-administration.paths';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';


interface UserAdministrationProps {
  theme: 'light' | 'dark';
}

const UserAdministration: React.FC<UserAdministrationProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="User Administration"
      icon={<Users className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PLATFORM_ADMIN_ROUTES.USERS}
      actions={[
        { 
          key: 'permissions', 
          label: 'Permissions', 
          icon: <Shield className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.USERS_PERMISSIONS 
        },
        { 
          key: 'user-stats', 
          label: 'User Statistics', 
          icon: <BarChart3 className="w-4 h-4" />, 
          to: PLATFORM_ADMIN_ROUTES.USERS_USER_STATS 
        },
      ]}
    />
  );
};

export default UserAdministration;