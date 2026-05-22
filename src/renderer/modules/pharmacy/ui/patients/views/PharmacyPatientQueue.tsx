import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pill } from 'lucide-react';

import PatientQueue from '../../dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { PHARMACY_ROUTES } from '../../../../../app/routes/routeConstants';
import {
  CareDeliveryWorkflow,
  type QueueFilters,
  type QueueVisitItem,
} from '../../../api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

import { setActiveVisit, emergencyClearVisit } from '../../../../../app/store/slices/visitSlice';
import { clearAll } from '../../../../medical-records/ui/visit-action-center/billing-space';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import {
  getActiveFacilityId,
  getStaffId,
  hasCompleteStaffContext,
} from '../../../../../app/store/utils/contextSelectors';

type Theme = 'light' | 'dark';

export interface PharmacyPatientQueueProps {
  theme: Theme;
  className?: string;
}

/**
 * Queue lists all visits routed to the Pharmacy workflow.
 * Selecting a row loads the visit into visitSlice and opens the medication encounter workflow.
 */
const PharmacyPatientQueue: React.FC<PharmacyPatientQueueProps> = ({ theme, className = '' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);

  const handleTakeAction = async (visit: QueueVisitItem) => {
    if (!hasCompleteStaff) {
      showToast(
        'error',
        'Complete staff context required. Please ensure you are logged in as staff with an active facility.',
        5000
      );
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
      const currentVisitId = visit.visit_id?.toString();
      if (currentVisitId) {
        sessionStorage.removeItem(`billing_draft_${currentVisitId}`);
      }
      dispatch(emergencyClearVisit());
      dispatch(clearAll());

      await new Promise((resolve) => setTimeout(resolve, 50));

      dispatch(
        setActiveVisit({
          visit,
          staffId,
          departmentId: visit.current_department_id || undefined,
          facilityId: visit.facility_id,
        })
      );

      showToast('success', `Medication encounter — ${visit.patient?.name || 'patient'}.`, 3500);

      navigate(PHARMACY_ROUTES.ACTION_CENTER_DISPENSING);
    } catch (error) {
      console.error('Error setting active visit:', error);
      showToast('error', 'Failed to load patient data. Please try again.', 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateNewPatient = () => {
    navigate(PHARMACY_ROUTES.PATIENTS_REGISTER);
  };

  const queueApiFilters = useMemo(
    (): QueueFilters => ({
      include_unassigned: true,
      limit: 100,
      care_delivery_workflow: CareDeliveryWorkflow.PHARMACY,
    }),
    []
  );

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Queue & patient intake"
        description="Patients routed to the Pharmacy workflow for medication management."
        
        onTakeAction={handleTakeAction}
        onNewPatientRegistration={handleCreateNewPatient}
        actionButtonText={isProcessing ? 'Loading...' : 'Take Action'}
        newPatientButtonText="New Patient"
        newPatientButtonIcon={<Pill className="h-4 w-4" />}
        showStats={true}
        allowPhaseFilter={true}
        allowDepartmentFilter={true}
        showUnassignedToggle={true}
        showSearch={true}
        showNewPatientRegistration={true}
        theme={theme}
        className="cursor-default"
        initialFilters={queueApiFilters}
        showCompletedWorkTab
      />
    </div>
  );
};

PharmacyPatientQueue.displayName = 'PharmacyPatientQueue';

export default PharmacyPatientQueue;
