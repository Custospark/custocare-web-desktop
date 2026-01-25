import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  FolderOpen,
  Workflow,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, MEDICAL_RECORDS_ROUTES } from '../../../app/routes/routeConstants';

const MEDICAL_RECORDS_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },

  { id: 'visit-action-center', label: 'Visit Action Center', icon: <Workflow className="w-4 h-4" /> },

  { id: 'appointments', label: 'Appointments', icon: <CalendarCheck className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'records', label: 'Records', icon: <FolderOpen className="w-4 h-4" /> },
];

const MedicalRecordsModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Medical Records"
      operations={MEDICAL_RECORDS_OPERATIONS}
      basePath={ROUTES.MEDICAL_RECORDS}
      defaultOperationPath={MEDICAL_RECORDS_ROUTES.OVERVIEW}
    />
  );
};

export default MedicalRecordsModule;
