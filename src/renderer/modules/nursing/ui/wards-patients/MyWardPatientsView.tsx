import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

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
import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import { cn } from '../../../../shared/utils/classNameUtils';

type Theme = 'light' | 'dark';

export interface MyWardPatientsViewProps {
  theme: Theme;
  className?: string;
}

/** Same normalization as Assign Task / medication views — API must return an array of wards. */
function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

/** Match Ward & Bed encounter labels (name, code, building/floor). */
function formatWardOptionLabel(w: Ward): string {
  const primary = w.name?.trim() || `Ward #${w.id}`;
  const code = w.code?.trim();
  const meta = [w.building?.trim(), w.floor?.trim()].filter(Boolean).join(' · ');
  if (code && meta) return `${primary} (${code}) — ${meta}`;
  if (code) return `${primary} (${code})`;
  if (meta) return `${primary} — ${meta}`;
  return primary;
}

const MyWardPatientsView: React.FC<MyWardPatientsViewProps> = ({ theme, className = '' }) => {
  const routes = getPatientIntakeRoutes('nursing');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [wardId, setWardId] = useState<number | ''>('');

  const facilityId = useAppSelector(getActiveFacilityId) ?? 0;
  const staffId = useAppSelector(getStaffId);
  const hasCompleteStaff = useAppSelector(hasCompleteStaffContext);

  /** Same filters as Assign Task / Treatment log — `GET /wards` by facility only (no extra filters that can empty the list). */
  const wardFilters = useMemo(() => ({ facility_id: facilityId }), [facilityId]);

  const wardsQuery = useGetWards(wardFilters, {
    enabled: facilityId > 0,
    staleTime: 1000 * 30,
  });

  const wards = useMemo(() => asArray<Ward>(wardsQuery.data), [wardsQuery.data]);

  const wardPatientsQuery = useNursingWardPatients(
    {
      ward_id: wardId === '' ? undefined : wardId,
      limit: 100,
    },
    { enabled: facilityId > 0 }
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
        <div className="flex flex-col gap-1 sm:w-80">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="my-ward-filter" className="text-xs font-medium uppercase tracking-wide">
              Ward
            </label>
            <button
              type="button"
              onClick={() => wardsQuery.refetch()}
              disabled={wardsQuery.isFetching || facilityId <= 0}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium disabled:cursor-not-allowed',
                isDark
                  ? 'text-cyan-400 hover:bg-white/10 disabled:opacity-40'
                  : 'text-blue-600 hover:bg-gray-100 disabled:opacity-40'
              )}
              title="Refresh ward list"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', wardsQuery.isFetching && 'animate-spin')} />
              Wards
            </button>
          </div>
          <select
            id="my-ward-filter"
            aria-label="Filter ward patients by ward"
            value={wardId === '' ? '' : String(wardId)}
            onChange={(e) => {
              const v = e.target.value;
              setWardId(v === '' ? '' : Number(v));
            }}
            disabled={facilityId <= 0 || wardsQuery.isLoading}
            className={cn(
              'cursor-pointer rounded-lg border px-3 py-2 text-sm appearance-none',
              isDark ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900',
              (facilityId <= 0 || wardsQuery.isLoading) && 'cursor-not-allowed opacity-70'
            )}
          >
            <option value="">{wardsQuery.isLoading ? 'Loading wards…' : 'All wards'}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {formatWardOptionLabel(w)}
              </option>
            ))}
          </select>
          {wardsQuery.error && (
            <p className="text-xs text-red-500" role="alert">
              Could not load wards. Use refresh or check your connection.
            </p>
          )}
          {!wardsQuery.isLoading && !wardsQuery.error && facilityId > 0 && wards.length === 0 && (
            <p className="text-xs opacity-80">No wards found for this facility. Add wards in administration.</p>
          )}
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
        showCompletedWorkTab
      />
    </div>
  );
};

export default MyWardPatientsView;
