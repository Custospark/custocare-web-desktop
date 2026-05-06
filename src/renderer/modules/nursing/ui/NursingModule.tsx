import { BrainCircuit, BedDouble, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { ROUTES, NURSING_ROUTES } from '../../../app/routes/routeConstants';

const NURSING_OPERATIONS = [
  {
    id: 'nursing-intelligence',
    label: 'Nursing Intelligence',
    icon: <BrainCircuit className="w-4 h-4" />,
  },
  {
    id: 'wards-patients',
    label: 'Wards & Patients',
    icon: <BedDouble className="w-4 h-4" />,
  },
  {
    id: 'nursing-encounter',
    label: 'Nursing Encounter',
    icon: <Stethoscope className="w-4 h-4" />,
  },
  {
    id: 'medication-treatment',
    label: 'Medication & Treatment',
    icon: <Pill className="w-4 h-4" />,
  },
  {
    id: 'tasks-shifts',
    label: 'Tasks & Shifts',
    icon: <ClipboardList className="w-4 h-4" />,
  },
];

const NursingModule = () => {
  return (
    <BaseModuleWorkspace
      contextTitle="Nursing"
      operations={NURSING_OPERATIONS}
      basePath={ROUTES.NURSING}
      defaultOperationPath={NURSING_ROUTES.NURSING_INTELLIGENCE}
    />
  );
};

export default NursingModule;