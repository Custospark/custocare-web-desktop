// components/medical-records/MRPatientQueue.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import PatientQueue from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { type QueueVisitItem, VisitPhase } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

// Import Redux actions
import { setActiveVisit } from '../../../../../app/store/slices/visitSlice';

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
  const dispatch = useDispatch();

  const handleTakeAction = (visit: QueueVisitItem) => {
    // Get current staff ID from auth context or localStorage
    const currentStaffId = parseInt(localStorage.getItem('staff_id') || '0', 10);
    
    // Dispatch to Redux to set active visit
    dispatch(setActiveVisit({
      visit,
      staffId: currentStaffId,
      // You can also pass departmentId and facilityId if available
    }));
    
    console.log('✅ Active visit set in Redux:', visit.visit_uuid);
    
    // Navigate to action center
    navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER);
  };

  const handleCreateNewPatient = () => {
    navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER);
  };

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Patient Queue"
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
          current_phase: VisitPhase.REGISTRATION,
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