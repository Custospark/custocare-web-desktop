import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/store/rootReducer';
import { ContentLayout, type Operation } from '../../../../shared/components/content/ContentLayout';
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
} from 'lucide-react';
import AdminOverview from './admin-overview-ui/AdminOverview';
import AdminTeam from './team-ui/AdminTeam';
import AdminFacilitySetup from './facility-setup-ui/AdminFacilitySetup';
import AdminServiceCatalog from './service-catalog-ui/AdminServiceCatalog';

/**
 * ============================================================================
 * ADMIN MODULE - MAIN INTEGRATION COMPONENT
 * ============================================================================
 *
 * Purpose:
 * --------
 * Centralized administrative control panel for managing:
 * - System overview & setup health
 * - Team (staff, invitations, roles)
 * - Facility structure
 * - Service catalog & pricing
 *
 * Architecture Highlights:
 * -----------------------
 * - Mirrors PatientModule integration pattern
 * - Stateless workspace (theme-only components)
 * - Clean domain boundaries
 * - Scalable admin navigation
 * - Theme-aware rendering (light/dark)
 *
 * Module Structure:
 * ----------------
 * 1. AdminOverview
 * 2. AdminTeam
 * 3. AdminFacilitySetup
 * 4. AdminServiceCatalog
 *
 * @example
 * ```tsx
 * <Route path="/admin" element={<AdminModule />} />
 * ```
 */

/* ============================================================================
   OPERATIONS CONFIGURATION
============================================================================ */

/**
 * Admin module operations (right sidebar)
 */
const ADMIN_OPERATIONS: Operation[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Administrative overview and setup status',
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="w-4 h-4" />,
    description: 'Manage staff, invitations, and roles',
  },
  {
    id: 'facility-setup',
    label: 'Facility Setup',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Configure departments and facility structure',
  },
  {
    id: 'service-catalog',
    label: 'Service Catalog',
    icon: <Layers className="w-4 h-4" />,
    description: 'Manage services and pricing versions',
  },
];

/* ============================================================================
   TYPES
============================================================================ */

export type AdminOperationId =
  | 'overview'
  | 'team'
  | 'facility-setup'
  | 'service-catalog';

/* ============================================================================
   SUBCOMPONENT IMPORTS
============================================================================ */


/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const AdminModule: React.FC = () => {
  /**
   * =========================================================================
   * REDUX STATE
   * =========================================================================
   */

  const theme = useSelector((state: RootState) => state.ui.theme);

  /**
   * =========================================================================
   * LOCAL STATE
   * =========================================================================
   */

  const [activeOperation, setActiveOperation] =
    useState<AdminOperationId>('overview');

  /**
   * =========================================================================
   * EVENT HANDLERS
   * =========================================================================
   */

  /**
   * Handle sidebar operation change
   */
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as AdminOperationId);
  }, []);

  /**
   * =========================================================================
   * WORKSPACE CONTENT RENDERER
   * =========================================================================
   */

  const renderWorkspaceContent = () => {
    switch (activeOperation) {
      case 'overview':
        return <AdminOverview theme={theme} />;

      case 'team':
        return <AdminTeam theme={theme} />;

      case 'facility-setup':
        return <AdminFacilitySetup theme={theme} />;

      case 'service-catalog':
        return <AdminServiceCatalog theme={theme} />;

      default:
        return <AdminOverview theme={theme} />;
    }
  };

  /**
   * =========================================================================
   * MAIN RENDER
   * =========================================================================
   */

  return (
    <ContentLayout
      operations={ADMIN_OPERATIONS}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation="overview"
      contextTitle="Administration"

    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

// Display name for React DevTools
AdminModule.displayName = 'AdminModule';

export default AdminModule;
