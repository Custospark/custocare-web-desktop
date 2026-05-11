import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

import PatientQueue from './PatientQueue';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';
import {
  CareDeliveryWorkflow,
  type QueueVisitItem,
} from '../../../../api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface DispensingQueueProps {
  theme: Theme;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const DispensingQueue: React.FC<DispensingQueueProps> = ({ theme, className = '' }) => {
  const navigate = useNavigate();


  const handleTakeAction = ( queueVisit?: QueueVisitItem) => {
    // Navigation handled by this component
    // Use both patient and queue visit data if available
    console.log('Taking action for patient:','with visit:', queueVisit);
    navigate(`${PHARMACY_ROUTES.PATIENTS_SEARCH}`);
  };

  const handleCreateNewPatient = () => {
    // Navigation handled by this component
    navigate(PHARMACY_ROUTES.PATIENTS_REGISTER);
  };

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Dispensing Queue"
        description="Patients waiting for medication dispensing"
        // onPatientSelect={handlePatientSelect}
        onTakeAction={handleTakeAction}
        onNewPatientRegistration={handleCreateNewPatient}
        actionButtonText="Dispense"
        newPatientButtonText="New Patient"
        newPatientButtonIcon={<UserPlus className="w-4 h-4" />}
        showStats={true}
        allowPhaseFilter={true}
        allowDepartmentFilter={false}
        showUnassignedToggle={true}
        showSearch={true}
        showNewPatientRegistration={true}
        theme={theme}
        className="cursor-default"
        initialFilters={{
          current_phase: undefined,
          department_id: undefined,
          include_unassigned: false,
          limit: 50,
          care_delivery_workflow: CareDeliveryWorkflow.PHARMACY,
        }}
        showCompletedWorkTab
      />
    </div>
  );
};

DispensingQueue.displayName = 'DispensingQueue';

export default DispensingQueue;