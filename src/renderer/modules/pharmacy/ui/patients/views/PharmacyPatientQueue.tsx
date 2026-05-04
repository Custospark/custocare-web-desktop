import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pill } from 'lucide-react';

import PatientQueue from '../../dispensing/dispensing-medication/views/PatientQueue';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { PHARMACY_ROUTES } from '../../../../../app/routes/routeConstants';
import { type QueueVisitItem, VisitPhase } from '../../../api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useGetPrescriptions } from '../../../../medical-records/api/prescription/PrescriptionQueries';
import { PrescriptionStatus } from '../../../../medical-records/api/prescription/PrescriptionTypes';

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
 * Same UX as medical records patient queue: shared PatientQueue UI, visit stored in visitSlice,
 * billing draft cleared, then navigate to the pharmacy action center. Queue rows are limited to visits
 * that have at least one active, visit-linked prescription for this facility once prescription data loads.
 */
const PharmacyPatientQueue: React.FC<PharmacyPatientQueueProps> = ({ theme, className = '' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);

  const readyRxQuery = useGetPrescriptions(
    {
      facility_id: facilityId ?? undefined,
      status: PrescriptionStatus.ACTIVE,
    },
    {
      enabled: !!facilityId,
      refetchInterval: 15000,
    }
  );

  const visitIdsWithReadyPrescription = useMemo(() => {
    const rows = readyRxQuery.data?.data ?? [];
    const ids = new Set<number>();
    for (const p of rows) {
      if (p.visit_id != null) {
        ids.add(p.visit_id);
      }
    }
    return ids;
  }, [readyRxQuery.data]);

  const filterVisit = useCallback(
    (visit: QueueVisitItem) => {
      if (!readyRxQuery.isFetched) return true;
      return visit.visit_id != null && visitIdsWithReadyPrescription.has(visit.visit_id);
    },
    [readyRxQuery.isFetched, visitIdsWithReadyPrescription]
  );

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

      showToast(
        'success',
        `Ready for pharmacy — ${visit.patient?.name || 'patient'}. Open the billing tray to record dispensed items.`,
        3500
      );

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

  return (
    <div className={cn(className)}>
      <PatientQueue
        title="Queue & patient intake"
        description="Visits with active prescriptions — select a row to open the medication encounter workflow"
        filterVisit={filterVisit}
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

PharmacyPatientQueue.displayName = 'PharmacyPatientQueue';

export default PharmacyPatientQueue;
