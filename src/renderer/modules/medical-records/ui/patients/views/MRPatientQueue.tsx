// components/medical-records/MRPatientQueue.tsx
import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

import PatientQueue from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import {
  CareDeliveryWorkflow,
  type QueueVisitItem,
} from '../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
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
import {
  getPatientIntakeRoutes,
  type PatientIntakeModule,
} from '../../../../../app/routes/utils/patientIntakeRoutes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface MRPatientQueueProps {
  theme: Theme;
  className?: string;
  intakeModule?: PatientIntakeModule;
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const MRPatientQueue: React.FC<MRPatientQueueProps> = ({
  theme,
  className = '',
  intakeModule = 'medical-records',
}) => {
  const routes = getPatientIntakeRoutes(intakeModule);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queueTitle =
    intakeModule === 'nursing'
      ? 'New Patients (Unassigned)'
      : intakeModule === 'billing'
        ? 'Billing Queue'
        : intakeModule === 'laboratory'
          ? 'Laboratory Queue'
          : intakeModule === 'ambulance'
            ? 'Transport Queue'
            : 'Patient Queue';
  const queueDescription =
    intakeModule === 'nursing'
      ? 'Visits without a ward assignment; counts match this list. Assign wards from bed board or ward workspace.'
      : intakeModule === 'billing'
        ? 'Visits ready for billing capture and payment processing'
        : intakeModule === 'laboratory'
          ? 'Visits ready for laboratory diagnostics, test requests, and results workflow'
          : intakeModule === 'ambulance'
            ? 'Visits ready for EMS transport dispatch and trip workflow'
            : 'Patients requiring medical documentation and chart updates';
  const actionButtonText =
    intakeModule === 'nursing'
      ? isProcessing
        ? 'Opening...'
        : 'Start Nursing Encounter'
      : isProcessing
        ? 'Loading...'
        : 'Take Action';
  const newPatientButtonText =
    intakeModule === 'nursing'
      ? 'Nursing Queue Intake'
      : intakeModule === 'billing'
        ? 'Express Intake'
        : intakeModule === 'laboratory'
          ? 'Lab Express Intake'
          : intakeModule === 'ambulance'
            ? 'Transport Express Intake'
            : 'New Patient';

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
      showToast(
        'success',
        intakeModule === 'billing'
          ? `Billing queue ready for ${visit.patient?.name || 'patient'}.`
          : intakeModule === 'laboratory'
            ? `Laboratory queue ready for ${visit.patient?.name || 'patient'}.`
            : intakeModule === 'ambulance'
              ? `Transport queue ready for ${visit.patient?.name || 'patient'}.`
              : `Ready to care for ${visit.patient?.name || 'patient'}. Let's get started!`,
        3000
      );
      
      // Navigate to action center
      navigate(routes.actionCenter);
    } catch (error) {
      console.error('Error setting active visit:', error);
      showToast('error', 'Failed to load patient data. Please try again.', 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewPatient = () => {
    navigate(routes.register);
  };

  const initialFilters = useMemo(() => {
    const workflowByModule: Record<PatientIntakeModule, CareDeliveryWorkflow> = {
      'medical-records': CareDeliveryWorkflow.MEDICAL_RECORDS,
      nursing: CareDeliveryWorkflow.NURSING,
      billing: CareDeliveryWorkflow.BILLING,
      laboratory: CareDeliveryWorkflow.LABORATORY,
      clinical: CareDeliveryWorkflow.CLINICAL,
      pharmacy: CareDeliveryWorkflow.PHARMACY,
      ambulance: CareDeliveryWorkflow.AMBULANCE,
    };

    const care_delivery_workflow = workflowByModule[intakeModule];

    return {
      department_id: undefined,
      include_unassigned: true,
      limit: 100,
      care_delivery_workflow,
      ...(intakeModule === 'nursing' ? { without_ward_assignment: true as const } : {}),
    };
  }, [intakeModule]);

  return (
    <div className={cn(className)}>
      <PatientQueue
        title={queueTitle}
        description={queueDescription}
        onTakeAction={handleTakeAction}
        onNewPatientRegistration={handleCreateNewPatient}
        actionButtonText={actionButtonText}
        newPatientButtonText={newPatientButtonText}
        newPatientButtonIcon={<Stethoscope className="w-4 h-4" />}
        showStats={true}
        showWorkflowStageFilter={true}
        allowPhaseFilter={false}
        allowDepartmentFilter={false}
        showUnassignedToggle={true}
        showSearch={true}
        showNewPatientRegistration={true}
        theme={theme}
        className="cursor-default"
        initialFilters={initialFilters}
        showCompletedWorkTab
      />
    </div>
  );
};

MRPatientQueue.displayName = 'MRPatientQueue';

export default MRPatientQueue;