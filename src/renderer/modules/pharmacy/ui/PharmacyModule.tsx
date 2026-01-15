/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Pill,
  Receipt,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';

import PharmacyOverview from './overview/PharmacyOverview';
import Inventory from './inventory/Inventory';
import Dispensing from './dispensing/Dispensing';
import Billing from './billing/Billing';
import Prescriptions from './precriptions/Prescriptions';

export type PharmacyOperationId =
  | 'overview'
  | 'prescriptions'
  | 'inventory'
  | 'dispensing'
  | 'billing';

const PHARMACY_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'prescriptions', label: 'Prescriptions', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'dispensing', label: 'Dispensing', icon: <Pill className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <Receipt className="w-4 h-4" /> },
];

const PharmacyModule = () => {
  return (
    <BaseModuleWorkspace<PharmacyOperationId>
      contextTitle="Pharmacy"
      operations={PHARMACY_OPERATIONS}
      defaultOperation="overview"
      renderOperation={(operation, theme) => {
        switch (operation) {
          case 'overview':
            return <PharmacyOverview theme={theme} />;
          case 'prescriptions':
            return <Prescriptions theme={theme} />;
          case 'inventory':
            return <Inventory theme={theme} />;
          case 'dispensing':
            return <Dispensing theme={theme} />;
          case 'billing':
            return <Billing theme={theme} />;
          default:
            return <PharmacyOverview theme={theme} />;
        }
      }}
    />
  );
};

export default PharmacyModule;
