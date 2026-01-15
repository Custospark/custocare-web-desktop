/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  CalendarCheckIcon,
  Microscope,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import Appointment from '../../medical-records/ui/Appointments/Appointment';
import LaboratoryOverview from './overview/LaboratoryOverview';
import LaboratoryTest from './lab-test/LaboratoryTest';
export type LaboratoryOperationId =
  | 'overview'
  | 'lab_test'
  | 'appointments';

const LABORATORY_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'lab_test', label: 'Laboratory Tests.', icon: <Microscope className="w-4 h-4" /> },
  { id: 'appointments', label: 'Lab Appointments', icon: <CalendarCheckIcon className="w-4 h-4" /> },
];

const LaboratoryModule = () => {
  return (
    <BaseModuleWorkspace<LaboratoryOperationId>
      contextTitle="Cinical Workspace"
      operations={LABORATORY_OPERATIONS}
      defaultOperation="overview"
      renderOperation={(operation, theme) => {
        switch (operation) {
          case 'overview':
            return <LaboratoryOverview />;
          case 'lab_test':
            return <LaboratoryTest theme={theme}/>;
          case 'appointments':
            return <Appointment theme={theme} />;
          default:
            return <LaboratoryOverview />;
        }
      }}
    />
  );
};

export default LaboratoryModule;
