/**
 * ============================================================================
 * ADMIN MODULE (ROUTER-DRIVEN)
 * ============================================================================
 * 
 * Centralized administrative control panel for managing:
 * - System overview & setup health
 * - Team (staff, invitations, roles)
 * - Facility structure
 * - Service catalog & pricing
 * - Plans & subscriptions
 * - Clinical space management
 * - Inventory management
 * - Facility settings
 * 
 * Architecture:
 * ------------
 * - Uses BaseModuleWorkspace for consistent layout
 * - Router-driven navigation with nested routes
 * - Theme-aware rendering
 * - Scalable operation-based architecture
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  Boxes,
  MapIcon,
  Settings2,
  CreditCard,
} from 'lucide-react';
import { BaseModuleWorkspace } from '../../../../shared/components/workspace/BaseModuleWorkspace';
import { ADMIN_ROUTES } from '../../../../app/routes/constants/administration.paths';
import { ROUTES } from '../../../../app/routes/routeConstants';
/**
 * Admin module operations configuration
 * Each operation corresponds to a nested route under /admin
 */
const ADMIN_OPERATIONS = [
  { 
    id: 'overview', 
    label: 'Command Center', 
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Administrative overview and setup status',
    status: 'new' // Add status badge
  },
  { 
    id: 'facility-setup', 
    label: 'Clinical Departments', 
    icon: <Building2 className="w-4 h-4" />,
    description: 'Configure departments and facility structure'
  },
  { 
    id: 'clinical-space-management', 
    label: 'Clinical Space Management', 
    icon: <MapIcon className="w-4 h-4" />,
    description: 'Define rooms, floors, buildings, and manage staff space assignments',
    tierBadge: 'enterprise' // Add tier badge
  },
  { 
    id: 'service-catalog', 
    label: 'Clinical & Billing Services', 
    icon: <Layers className="w-4 h-4" />,
    description: 'Manage services and pricing versions',
    status: 'beta' // Add status badge
  },
  { 
    id: 'inventory', 
    label: 'Supply & Inventory Management', 
    icon: <Boxes className="w-4 h-4" />,
    description: 'Manage stock items, locations, and inventory controls'
  },
  { 
    id: 'team', 
    label: 'Workforce Administration', 
    icon: <Users className="w-4 h-4" />,
    description: 'Manage staff, invitations, and roles'
  },
  { 
    id: 'plans-subscriptions', 
    label: 'Plans & Subscriptions', 
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Manage facility plans, subscriptions, and billing',
    badge: 3 // Numeric badge for count
  },
  { 
    id: 'settings', 
    label: 'Enterprise Facility Settings', 
    icon: <Settings2 className="w-4 h-4" />,
    description: 'Manage facility identity, regulatory parameters, and operational policies',
    tierBadge: 'professional' // Add tier badge
  },
];

/**
 * Admin Module
 * 
 * Provides a workspace with operation-based navigation for all
 * administrative functions. Each operation maps to a nested route
 * under the /admin base path.
 * 
 * @example
 * ```tsx
 * <Route path="/admin/*" element={<AdminModule />} />
 * ```
 */
const AdminModule: React.FC = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Facility Governance"
      operations={ADMIN_OPERATIONS}
      basePath={ROUTES.ADMINISTRATION}
      defaultOperationPath={ADMIN_ROUTES.OVERVIEW}
    />
  );
};

// Display name for React DevTools
AdminModule.displayName = 'AdminModule';

export default AdminModule;