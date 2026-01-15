/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import MedicalRecordsOverView from './overview/MedicalRecordsOverView';
import Patient from './patients/Patient';
import Appointment from './Appointments/Appointment';


export type MedicalRecordsOperationId =
  | 'overview_medical_records'
  | 'patients'
  | 'appointments';

const MEDICAL_RECORDS_OPERATIONS = [
  { id: 'overview_medical_records', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'patients', label: 'Patients', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <ClipboardList className="w-4 h-4" /> },
];

const MedicalRecordsModule = () => {
  return (
    <BaseModuleWorkspace<MedicalRecordsOperationId>
      contextTitle="Medical Records."
      operations={MEDICAL_RECORDS_OPERATIONS}
      defaultOperation="overview_medical_records"
      renderOperation={(operation, theme) => {
        switch (operation) {
          case 'overview_medical_records':
            return <MedicalRecordsOverView />;
          case 'patients':
            return <Patient theme={theme} />;
          case 'appointments':
            return <Appointment theme={theme} />;
          default:
            return null;
        }
      }}
    />
  );
};

export default MedicalRecordsModule;
