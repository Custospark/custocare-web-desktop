import React, { useState, useCallback } from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../../app/store/rootReducer';
import { ContentLayout, type Operation } from  '../../../shared/components/content/ContentLayout';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Pill,
  Receipt,
} from 'lucide-react';

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
   PLACEHOLDER WORKSPACE SECTIONS
============================================================================ */

const PharmacyOverview = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold">Pharmacy Overview</h2>
    <p className="text-sm opacity-70">
      Placeholder for alerts, pending prescriptions, low stock, and KPIs.
    </p>
  </div>
);

const PharmacyPrescriptions = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold">Prescription Queue</h2>
    <p className="text-sm opacity-70">
      Placeholder for incoming, in-progress, and ready prescriptions.
    </p>
  </div>
);

const PharmacyInventory = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold">Inventory Management</h2>
    <p className="text-sm opacity-70">
      Placeholder for stock levels, ledger view, and adjustments.
    </p>
  </div>
);

const PharmacyDispensing = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold">Dispensing</h2>
    <p className="text-sm opacity-70">
      Placeholder for dispense workflow, safety checks, and verification.
    </p>
  </div>
);

const PharmacyBilling = () => (
  <div className="p-6">
    <h2 className="text-lg font-semibold">Billing & Checkout</h2>
    <p className="text-sm opacity-70">
      Placeholder for invoice preview, payment, and receipt generation.
    </p>
  </div>
);

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const PharmacyModule: React.FC = () => {
  /**
   * =========================================================================
   * REDUX STATE
   * =========================================================================
   */

//   const theme = useSelector((state: RootState) => state.ui.theme);

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
        return <PharmacyOverview />;

      case 'prescriptions':
        return <PharmacyPrescriptions />;

      case 'inventory':
        return <PharmacyInventory />;

      case 'dispensing':
        return <PharmacyDispensing />;

      case 'billing':
        return <PharmacyBilling />;

      default:
        return <PharmacyOverview />;
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
