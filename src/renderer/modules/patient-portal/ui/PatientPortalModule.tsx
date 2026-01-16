/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  Calendar1Icon,
  FileTextIcon,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import MyHealth from './myhealth/MyHealth';
import TestResults from './test-results/TestResults';
import MyAppointments from './my-appointments/MyAppointments';

export type PatientPortalOperationId =
  | 'my_health'
  | 'test_results'
  | 'appointments';

const PATIENT_PORTAL_OPERATIONS = [
  { id: 'my_health', label: 'My Health', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'test_results', label: 'Test Results', icon: <FileTextIcon className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <Calendar1Icon className="w-4 h-4" /> },
];

const PatientPortalModule = () => {
  return (
    <BaseModuleWorkspace<PatientPortalOperationId>
      contextTitle="Patient Portal"
      operations={PATIENT_PORTAL_OPERATIONS}
      defaultOperation="my_health"
      renderOperation={(operation) => {
        switch (operation) {
          case 'my_health':
            return <MyHealth />;
          case 'test_results':
            return <TestResults />;
          case 'appointments':
            return <MyAppointments />;
          default:
            return <MyHealth />;
        }
      }}
    />
  );
};

export default PatientPortalModule;
