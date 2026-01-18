// PharmacyModule.tsx
/**
 * ============================================================================
 * PHARMACY MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import { LayoutDashboard, ClipboardList, Package, Pill, Receipt } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, PHARMACY_ROUTES } from '../../../app/routes/routeConstants'; // adjust import path as per your structure

const PHARMACY_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'prescriptions', label: 'Prescriptions', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'dispensing', label: 'Dispensing', icon: <Pill className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <Receipt className="w-4 h-4" /> },
];

const PharmacyModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Pharmacy"
      operations={PHARMACY_OPERATIONS}
      basePath={ROUTES.PHARMACY}
      defaultOperationPath={PHARMACY_ROUTES.OVERVIEW}
    />
  );
};

export default PharmacyModule;
