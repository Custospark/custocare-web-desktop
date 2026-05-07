import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import PatientQueue from '../../../pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue';
import type { QueueVisitItem } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { setActiveVisit, emergencyClearVisit } from '../../../../app/store/slices/visitSlice';
import { clearAll } from '../../../medical-records/ui/visit-action-center/billing-space';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import {
  getActiveFacilityId,
  getStaffId,
  hasCompleteStaffContext,
} from '../../../../app/store/utils/contextSelectors';
import { getPatientIntakeRoutes } from '../../../../app/routes/utils/patientIntakeRoutes';
import { useNursingWardPatients } from '../../api/ward-patients/useNursingWardPatients';
import { useGetWards } from '../../../administration/admin-module/api/wards/wardQueries';
import { cn } from '../../../../shared/utils/classNameUtils';

type Theme = 'light' | 'dark';

export interface MyWardPatientsViewProps {
  theme: Theme;
  className?: string;
}

function asWardList(raw: unknown): { id: number; name: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((w) => {
      if (!w || typeof w !== 'object') return null;
      const o = w as { id?: unknown; name?: unknown };
      const id = typeof o.id === 'number' ? o.id : Number(o.id);
      const name = typeof o.name === 'string' ? o.name : '';
      if (!Number.isFinite(id) || id <= 0 || !name) return null;
      return { id, name };
    })
    .filter((x): x is { id: number; name: string } => x !== null);
}

const MyWardPatientsView: React.FC<MyWardPatientsViewProps> = ({ theme, className = '' }) => {
  const routes = getPatientIntakeRoutes('nursing');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [wardId, setWardId] = useState<number | ''>('');

  const facilityId = useAppSelector(getActiveFacilityId);
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);

  const wardFilters = useMemo(
    () => ({
      facility_id: Number(facilityId) || 0,
      status: 'active' as const,
      per_page: 100,
    }),
    [facilityId]
  );

  const wardsQuery = useGetWards(wardFilters, { enabled: Number(facilityId) > 0 });
  const wards = useMemo(() => asWardList(wardsQuery.data), [wardsQuery.data]);

  const wardPatientsQuery = useNursingWardPatients(
    {
      ward_id: wardId === '' ? undefined : wardId,
      limit: 100,
    },
    { enabled: Number(facilityId) > 0 }
  );

  const visitsOverride = wardPatientsQuery.data?.meta.queue_visits ?? [];
  const isDark = theme === 'dark';

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

      showToast('success', `Nursing encounter — ${visit.patient?.name || 'patient'}.`, 3500);
      navigate(routes.actionCenter);
    } catch (error) {
      console.error('Error setting active visit:', error);
      showToast('error', 'Failed to load patient data. Please try again.', 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewPatient = () => {
    navigate(routes.search);
  };

  return (
    <div className={cn(className)}>
      <div
        className={cn(
          'mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
          isDark ? 'text-gray-300' : 'text-gray-700'
        )}
      >
        <div>
          <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            Ward filter
          </h2>
          <p className="mt-1 text-sm opacity-90">
            Limit the list to one ward, or show all ward-bed assignments for this facility.
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:w-72">
          <label htmlFor="my-ward-filter" className="text-xs font-medium uppercase tracking-wide">
            Ward
          </label>
          <select
            id="my-ward-filter"
            aria-label="Filter ward patients by ward"
            value={wardId === '' ? '' : String(wardId)}
            onChange={(e) => {
              const v = e.target.value;
              setWardId(v === '' ? '' : Number(v));
            }}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              isDark ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
            )}
          >
            <option value="">All wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PatientQueue
        title="My ward patients"
        description="In-facility visits with an active ward/bed assignment. Select a patient to open the nursing encounter."
        visitsOverride={visitsOverride}
        onVisitsRefetch={() => wardPatientsQuery.refetch()}
        isLoading={wardPatientsQuery.isLoading}
        error={wardPatientsQuery.error instanceof Error ? wardPatientsQuery.error : null}
        onTakeAction={handleTakeAction}
        onNewPatientRegistration={handleNewPatient}
        actionButtonText={
          isProcessing ? 'Opening…' : 'Start nursing encounter'
        }
        newPatientButtonText="Search patient"
        showStats={true}
        allowPhaseFilter={true}
        allowDepartmentFilter={false}
        showUnassignedToggle={false}
        showSearch={true}
        showNewPatientRegistration={true}
        refreshInterval={15000}
        refetchOnWindowFocus={true}
        theme={theme}
        className="cursor-default"
        initialFilters={{
          limit: 100,
        }}
      />
    </div>
  );
};

export default MyWardPatientsView;
