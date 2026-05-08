import {
  // LayoutDashboard,
  Users,
  Workflow,
  Receipt,
  LayoutDashboard
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, MEDICAL_RECORDS_ROUTES } from '../../../app/routes/routeConstants';
/**
 * Note: The id must match an existing route for that base module.
 */
const MEDICAL_RECORDS_OPERATIONS = [
  { 
    id: 'overview', 
    label: 'Patient Intelligence', 
    icon: <LayoutDashboard className="w-4 h-4" /> 
  },

  { 
    id: 'patients', 
    label: 'Patient Registry Management', 
    icon: <Users className="w-4 h-4" /> 
  },

  { 
    id: 'visit-action-center', 
    label: 'Patient Encounter Hub', 
    icon: <Workflow className="w-4 h-4" /> 
  },
  {  
    id: 'revenue',  
    label: 'Billing & Reconciliation',  
    icon: <Receipt className="w-4 h-4" />, 
    subtext: 'Validate and reconcile clinical charges'
  }
];

const MedicalRecordsModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Medical Records"
      operations={MEDICAL_RECORDS_OPERATIONS}
      basePath={ROUTES.MEDICAL_RECORDS}
      defaultOperationPath={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH}
    />
  );
};

export default MedicalRecordsModule;