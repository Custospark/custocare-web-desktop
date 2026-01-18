import { LayoutDashboard, FileText, Calendar, Heart, Pill, Stethoscope } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, PATIENT_PORTAL_ROUTES } from '../../../app/routes/routeConstants';

const PATIENT_PORTAL_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'health', label: 'My Health', icon: <Heart className="w-4 h-4" /> },
  { id: 'records', label: 'Medical Records', icon: <FileText className="w-4 h-4" /> },
  { id: 'test_results', label: 'Test Results', icon: <Stethoscope className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  { id: 'medications', label: 'Medications', icon: <Pill className="w-4 h-4" /> },
];

const PatientPortalModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Patient Portal"
      operations={PATIENT_PORTAL_OPERATIONS}
      basePath={ROUTES.PATIENT_DASHBOARD}
      defaultOperationPath={PATIENT_PORTAL_ROUTES.OVERVIEW}
    />
  );
};

export default PatientPortalModule;