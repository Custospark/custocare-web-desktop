/**
 * ============================================================================
 * PHARMACY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  LayoutDashboard,
  CalendarCheckIcon,
} from 'lucide-react';

import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import Appointment from '../../medical-records/ui/Appointments/Appointment';
import ClinicalOverview from './overview/ClinicalOverview';
import Diagnosis from './diagnosis/Diagnosis';
import { FaDiagnoses } from 'react-icons/fa';
export type ClinicalOperationId =
  | 'overview'
  | 'diagnosis'
  | 'appointments';

const CLINICAL_OPERATIONS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'diagnosis', label: 'Diagnosis', icon: <FaDiagnoses className="w-4 h-4" /> },
  { id: 'appointments', label: 'Appointments', icon: <CalendarCheckIcon className="w-4 h-4" /> },
];

const ClinicalModule = () => {
  return (
    <BaseModuleWorkspace<ClinicalOperationId>
      contextTitle="Cinical Workspace"
      operations={CLINICAL_OPERATIONS}
      defaultOperation="overview"
      renderOperation={(operation, theme) => {
        switch (operation) {
          case 'overview':
            return <ClinicalOverview />;
          case 'diagnosis':
            return <Diagnosis theme={theme}/>;
          case 'appointments':
            return <Appointment theme={theme} />;
          default:
            return <ClinicalOverview />;
        }
      }}
    />
  );
};

export default ClinicalModule;
