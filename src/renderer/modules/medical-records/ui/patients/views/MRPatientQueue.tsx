import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import PatientQueue from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { QueueVisitItem, VisitPhase,} from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface MRPatientQueueProps {
  theme: Theme;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const MRPatientQueue: React.FC<MRPatientQueueProps> = ({ theme, className = '' }) => {
  const navigate = useNavigate();



  const handleTakeAction = (patient: QueueVisitItem, queueVisit?: QueueVisitItem) => {
    // Navigation handled by this component
    // Use both patient and queue visit data if available
    console.log('Medical Records - Taking action for patient:', patient.patient_id, 'with visit:', queueVisit);
    navigate(`${MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}`);
  };

  const handleCreateNewPatient = () => {
    // Navigation handled by this component
    navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER);
  };

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Medical Records Queue"
        description="Patients requiring medical documentation and chart updates"
        onTakeAction={handleTakeAction}
        onNewPatientRegistration={handleCreateNewPatient}
        actionButtonText="Take Action"
        newPatientButtonText="New Patient"
        newPatientButtonIcon={<Stethoscope className="w-4 h-4" />}
        showStats={true}
        allowPhaseFilter={true}
        allowDepartmentFilter={true}
        showUnassignedToggle={true}
        showSearch={true}
        showNewPatientRegistration={true}
        theme={theme}
        className="cursor-default"
        initialFilters={{
          current_phase: VisitPhase.REGISTRATION, // Focus on documentation phase for medical records
          department_id: undefined,
          include_unassigned: true,
          limit: 100,
        }}
      />
    </div>
  );
};

MRPatientQueue.displayName = 'MRPatientQueue';

export default MRPatientQueue;