/**
 * ============================================================================
 * ADMIN MODULE (ROUTER-DRIVEN) — with module gating + operation gating
 * ============================================================================
 */
import React, { useCallback } from 'react';
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
import type { PlanTier } from '../../../../shared/entitlements/entitlements';

/**
 * Admin module operations configuration
 */
const ADMIN_OPERATIONS = [
  {
    id: 'overview',
    label: 'Command Center',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Administrative overview and setup status',
    status: 'new' as const,
  },
  {
    id: 'facility-setup',
    label: 'Clinical Departments',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Configure departments and facility structure',
  },
  {
    id: 'clinical-space-management',
    label: 'Clinical Space Management',
    icon: <MapIcon className="w-4 h-4" />,
    description: 'Define rooms, floors, buildings, and manage staff space assignments',
    requiredTier: 'professional' as const,
  },
  {
    id: 'service-catalog',
    label: 'Clinical & Billing Services',
    icon: <Layers className="w-4 h-4" />,
    description: 'Manage services and pricing versions',
    status: 'beta' as const,
  },
  {
    id: 'inventory',
    label: 'Supply & Inventory Management',
    icon: <Boxes className="w-4 h-4" />,
    description: 'Manage stock items, locations, and inventory controls',
    requiredTier: 'professional' as const,
  },
  {
    id: 'team',
    label: 'Workforce Administration',
    icon: <Users className="w-4 h-4" />,
    description: 'Manage staff, invitations, and roles',
    requiredTier: 'professional' as const,
  },
  {
    id: 'plans-subscriptions',
    label: 'Plans & Subscriptions',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Manage facility plans, subscriptions, and billing',
    requiredTier: 'enterprise' as const,
  },
  {
    id: 'settings',
    label: 'Enterprise Facility Settings',
    icon: <Settings2 className="w-4 h-4" />,
    description: 'Manage facility identity, regulatory parameters, and operational policies',
    requiredTier: 'essential' as const,
  },
];

/**
 * Admin Module
 */
const AdminModule: React.FC = () => {
  // UI-first test: swap this to selector later (auth/session)
  const currentTier: PlanTier = 'essential';

  const onRequestUpgrade = useCallback((requiredTier: PlanTier) => {
    // Replace with modal / billing route later
    alert(`Upgrade required: ${requiredTier}`);
  }, []);

  return (
    <BaseModuleWorkspace
      contextTitle="Facility Governance"
      operations={ADMIN_OPERATIONS as any}
      basePath={ROUTES.ADMINISTRATION}
      defaultOperationPath={ADMIN_ROUTES.OVERVIEW}
      currentTier={currentTier}
      onRequestUpgrade={onRequestUpgrade}
      moduleRequiredTier="essential"
      moduleDisabledReason="Admin is available on Enterprise tier"
    />
  );
};

AdminModule.displayName = 'AdminModule';
export default AdminModule;
