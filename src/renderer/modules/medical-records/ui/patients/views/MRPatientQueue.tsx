// components/medical-records/MRPatientQueue.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import PatientQueue from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { type QueueVisitItem, VisitPhase } from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

// Import Redux actions and selectors
import { setActiveVisit, emergencyClearVisit } from '../../../../../app/store/slices/visitSlice';
import { clearAll } from '../../visit-action-center/billing-space';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { 
  getActiveFacilityId, 
  getStaffId,
  hasCompleteStaffContext
} from '../../../../../app/store/utils/contextSelectors';

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
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get staff context
  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);

  const handleTakeAction = async (visit: QueueVisitItem) => {
    // Validate staff context
    if (!hasCompleteStaff) {
      showToast('error', 'Complete staff context required. Please ensure you are logged in as staff with an active facility.', 5000);
      return;
    }

    if (!facilityId) {
      showToast('error', 'No active facility selected. Please select a facility first.', 4000);
      return;
    }

    if (!staffId) {
      showToast('error', 'Staff ID not found. Please ensure you are logged in as staff.', 4000);
      return;
    }

    setIsProcessing(true);

    try {
      // Clear any existing billing draft from session storage for current visit
      const currentVisitId = visit.visit_id?.toString();
      if (currentVisitId) {
        const billingDraftKey = `billing_draft_${currentVisitId}`;
        sessionStorage.removeItem(billingDraftKey);
      }
      // Clear visit slice state (force clear without storing as previous)
      dispatch(emergencyClearVisit());
      
      // Clear billing slice state
      dispatch(clearAll());
      
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Set new active visit in Redux
      dispatch(setActiveVisit({
        visit,
        staffId: staffId,
        departmentId: visit.current_department_id || undefined,
        facilityId: visit.facility_id,
      }));
      
      
      // Show success message
      showToast('success', `Ready to care for ${visit.patient?.name || 'patient'}. Let's get started!`, 3000);
      
      // Navigate to action center
      navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER);
    } catch (error) {
      console.error('Error setting active visit:', error);
      showToast('error', 'Failed to load patient data. Please try again.', 4000);
    } finally {
      setIsProcessing(false);
    }
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
        actionButtonText={isProcessing ? "Loading..." : "Take Action"}
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