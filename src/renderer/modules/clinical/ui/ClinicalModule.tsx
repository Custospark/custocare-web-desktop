import { LayoutDashboard, CalendarCheck, Stethoscope } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, CLINICAL_ROUTES } from '../../../app/routes/routeConstants';

const CLINICAL_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'diagnosis', label: 'Diagnosis', icon: <Stethoscope className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <CalendarCheck className="w-4 h-4" /> },
  { id: 'vitals', label: 'Vitals', icon: <Stethoscope className="w-4 h-4" /> },
  { id: 'treatments', label: 'Treatments', icon: <Stethoscope className="w-4 h-4" /> },
];

const ClinicalModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Clinical Workspace"
      operations={CLINICAL_OPERATIONS}
      basePath={ROUTES.CLINICAL}
      defaultOperationPath={CLINICAL_ROUTES.OVERVIEW}
    />
  );
};

export default ClinicalModule;