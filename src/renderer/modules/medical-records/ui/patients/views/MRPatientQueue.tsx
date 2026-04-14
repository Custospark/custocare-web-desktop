// components/medical-records/MRPatientQueue.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Users, UserPlus, Search } from 'lucide-react';

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

  // Custom empty state component
  const EmptyQueueState = () => {
    const isDark = theme === 'dark';
    
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border-2 border-dashed ${
        isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'
      }`}>
        <div className={`p-4 rounded-full mb-4 ${
          isDark ? 'bg-gray-800' : 'bg-white shadow-sm'
        }`}>
          <Users className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          No Patients Waiting 👋
        </h3>
        
        <p className={`text-sm mb-6 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          The queue is currently empty. When patients check in, they'll appear here ready for care.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCreateNewPatient}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </button>
          
          <button
            onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Search for Patient
          </button>
        </div>
      </div>
    );
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
        emptyStateComponent={<EmptyQueueState />}
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