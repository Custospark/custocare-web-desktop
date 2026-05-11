/**
 * ============================================================================
 * PLATFORM ADMINISTRATION MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { 
  Users, 
  Building2,
  BookOpenText,
  GraduationCap,
  MessageSquareHeart,
  CircleHelp,
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
  {
    id: 'api-docs',
    label: 'API Documentation',
    icon: <BookOpenText className="w-4 h-4" />,
    description: 'Explore backend API endpoints by module, auth, and route metadata',
  },
  {
    id: 'learning-materials',
    label: 'Learning Materials',
    icon: <GraduationCap className="w-4 h-4" />,
    description: 'Publish hub learning videos, thumbnails, and descriptions for all users',
  },
  {
    id: 'hub-feedback',
    label: 'Hub feedback & requests',
    icon: <MessageSquareHeart className="w-4 h-4" />,
    description: 'Review feedback and feature requests submitted from the Custocare Hub',
  },
  {
    id: 'hub-support-faqs',
    label: 'Support Center FAQs',
    icon: <CircleHelp className="w-4 h-4" />,
    description: 'Author questions and answers shown in the Custocare Hub Support Center',
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