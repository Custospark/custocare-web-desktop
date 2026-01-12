import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/rootReducer';
import { ContentLayout, type Operation } from  '../../../shared/components/content/ContentLayout';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Pill,
  Receipt,
} from 'lucide-react';
 import PharmacyOverview from './overview/PharmacyOverview';
import Inventory from './inventory/Inventory';
import Dispensing from './dispensing/Dispensing';
import Billing from './billing/Billing';
import Prescriptions from './precriptions/Prescriptions';
/**
 * ============================================================================
 * PHARMACY MODULE - MAIN INTEGRATION COMPONENT
 * ============================================================================
 *
 * Purpose:
 * --------
 * Centralized pharmacy workspace for:
 * - Pharmacy operational overview
 * - Prescription intake & queue
 * - Inventory & stock management
 * - Dispensing workflow
 * - Billing & checkout
 *
 * Design Principles:
 * ------------------
 * - Mirrors AdminModule & PatientModule patterns
 * - Status-driven navigation
 * - Workflow-aligned operations (not tech-based)
 * - Placeholder-first (components plugged in later)
 *
 * Module Structure:
 * -----------------
 * 1. Overview
 * 2. Prescriptions
 * 3. Inventory
 * 4. Dispensing
 * 5. Billing
 *
 * @example
 * ```tsx
 * <Route path="/pharmacy" element={<PharmacyModule />} />
 * ```
 */

/* ============================================================================
   OPERATIONS CONFIGURATION
============================================================================ */

/**
 * Pharmacy module operations (right sidebar)
 */
const PHARMACY_OPERATIONS: Operation[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: 'Pharmacy activity, alerts, and workload',
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: <ClipboardList className="w-4 h-4" />,
    description: 'Incoming and active prescriptions',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Package className="w-4 h-4" />,
    description: 'Stock levels, expiry, and adjustments',
  },
  {
    id: 'dispensing',
    label: 'Dispensing',
    icon: <Pill className="w-4 h-4" />,
    description: 'Prepare and verify medication dispensing',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <Receipt className="w-4 h-4" />,
    description: 'Invoice review, payment, and checkout',
  },
];

/* ============================================================================
   TYPES
============================================================================ */

export type PharmacyOperationId =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'dispensing'
  | 'billing';
/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const PharmacyModule: React.FC = () => {
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
    useState<PharmacyOperationId>('overview');

  /**
   * =========================================================================
   * EVENT HANDLERS
   * =========================================================================
   */

  /**
   * Handle sidebar operation change
   */
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as PharmacyOperationId);
  }, []);

  /**
   * =========================================================================
   * WORKSPACE CONTENT RENDERER
   * =========================================================================
   */

  const renderWorkspaceContent = () => {
    switch (activeOperation) {
      case 'overview':
        return <PharmacyOverview theme={theme}/>;

      case 'prescriptions':
        return <Prescriptions theme={theme} />;

      case 'inventory':
        return <Inventory theme={theme} />;

      case 'dispensing':
        return <Dispensing theme={theme} />;

      case 'billing':
        return <Billing theme={theme} />;

      default:
        return <PharmacyOverview theme={theme}/>;
    }
  };

  /**
   * =========================================================================
   * MAIN RENDER
   * =========================================================================
   */

  return (
    <ContentLayout
      operations={PHARMACY_OPERATIONS}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation="overview"
      contextTitle="Pharmacy"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

// Display name for React DevTools
PharmacyModule.displayName = 'PharmacyModule';

export default PharmacyModule;
