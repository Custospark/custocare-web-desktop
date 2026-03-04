/**
 * ============================================================================
 * PLATFORM ADMINISTRATION MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { 
  Users, 
  Building2,
} from 'lucide-react';
import { BaseModuleWorkspace } from '../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES } from '../../app/routes/routeConstants';
import { PLATFORM_ADMIN_ROUTES } from '../../app/routes/constants/platform-administration.paths';

const PLATFORM_ADMIN_OPERATIONS = [

  { 
    id: 'facilities', 
    label: 'Facility Management', 
    icon: <Building2 className="w-4 h-4" />,
    description: 'Manage all facilities across the platform'
  },
  { 
    id: 'users', 
    label: 'User Administration', 
    icon: <Users className="w-4 h-4" />,
    description: 'Manage users, roles, and permissions globally'
  },
];

const PlatformAdministrationModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Platform Administration"
      operations={PLATFORM_ADMIN_OPERATIONS}
      basePath={ROUTES.PLATFORM_ADMINISTRATION}
      defaultOperationPath={PLATFORM_ADMIN_ROUTES.FACILITIES}
    />
  );
};

export default PlatformAdministrationModule;