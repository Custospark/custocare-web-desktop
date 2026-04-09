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
    label: 'Clinical Overview', 
    icon: <LayoutDashboard className="w-4 h-4" /> 
  },

  { 
    id: 'patients', 
    label: 'Patient Registry Management', 
    icon: <Users className="w-4 h-4" /> 
  },

  { 
    id: 'visit-action-center', 
    label: 'Clinical Encounter Workflow', 
    icon: <Workflow className="w-4 h-4" /> 
  },

  {  
    id: 'revenue',  
    label: 'Revenue Cycle Management',  
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