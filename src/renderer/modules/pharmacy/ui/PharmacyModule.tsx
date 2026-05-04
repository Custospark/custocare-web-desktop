/**
 * Pharmacy shell — sidebar labels follow the same convention as Medical Records
 * (capability name + purpose). Route `id` values must match path segments under `/pharmacy`.
 */
import { LayoutDashboard, Package, Receipt, Users, Workflow } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, PHARMACY_ROUTES } from '../../../app/routes/routeConstants';

const PHARMACY_OPERATIONS = [
  {
    id: 'overview',
    label: 'Pharmacy Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Volume, trends, and operational signals for the dispensary',
  },
  {
    id: 'patients',
    label: 'Queue & Patient Intake',
    icon: <Users className="w-4 h-4" />,
    subtext: 'Single entry: queue shows visits with Rx ready for dispensing; choose search, register, or walk-in',
  },
  {
    id: 'action-center',
    label: 'Medication Encounter Center',
    icon: <Workflow className="w-4 h-4" />,
    subtext: 'Active visit from slice: dispense, search & review prescriptions for this patient',
  },
  {
    id: 'inventory',
    label: 'Stock & Catalog',
    icon: <Package className="w-4 h-4" />,
    subtext: 'Items, lots, and on-hand levels',
  },
  {
    id: 'receipts',
    label: 'Billing & Receipts',
    icon: <Receipt className="w-4 h-4" />,
    subtext: 'Charge review and issued receipts',
  },
];

const PharmacyModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Pharmacy Services"
      operations={PHARMACY_OPERATIONS}
      basePath={ROUTES.PHARMACY}
      defaultOperationPath={PHARMACY_ROUTES.PATIENT_QUEUE}
    />
  );
};

export default PharmacyModule;
