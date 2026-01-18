import { LayoutDashboard, BedDouble, Users, ClipboardCheck, Activity, Bell } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, NURSING_ROUTES } from '../../../app/routes/routeConstants';

const NURSING_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'wards', label: 'Wards', icon: <BedDouble className="w-4 h-4" /> },
  { id: 'patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
  { id: 'vitals', label: 'Vitals', icon: <Activity className="w-4 h-4" /> },
  { id: 'medication', label: 'Medication', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
];

const NursingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Nursing"
      operations={NURSING_OPERATIONS}
      basePath={ROUTES.NURSING}
      defaultOperationPath={NURSING_ROUTES.OVERVIEW}
    />
  );
};

export default NursingModule;