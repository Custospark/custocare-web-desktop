import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, CircleAlert, RefreshCw } from 'lucide-react';

import {
  usePlatformFacilities,
  usePlatformPatients,
  useUpdateFacilityStatus,
} from '../statistics/api/platform-control/PlatformControlQueries';

import type {
  Facility,
  FacilityFilters,
  PatientFilters,
  PatientsResponse,
  FacilitiesResponse,
} from '../statistics/api/platform-control/PlatformControlTypes';

import FacilityGovernanceHeader from './facility-governance/FacilityGovernanceHeader';
import FacilityGovernanceMetrics from './facility-governance/FacilityGovernanceMetrics';
import FacilityGovernanceFiltersPanel from './facility-governance/FacilityGovernanceFilters';
import FacilityGovernanceFacilityTable from './facility-governance/FacilityGovernanceFacilityTable';
import FacilityGovernancePatientTable from './facility-governance/FacilityGovernancePatientTable';
import FacilityGovernanceFacilityDrawer from './facility-governance/FacilityGovernanceFacilityDrawer';
import FacilityGovernanceStatusModal from './facility-governance/FacilityGovernanceStatusModal';
import {
  EmptyState,
  GovernanceTableSkeleton,
} from './facility-governance/facilityGovernance.primitives';
import {
  cn,
  getPageShellClass,
  getPanelClass,
} from './facility-governance/facilityGovernance.utils';

interface ThemeRootState {
  ui?: {
    theme?: 'light' | 'dark';
  };
}

type GovernanceTab = 'facilities' | 'patients';

const CLIENT_PAGE_SIZE = 10;

const DEFAULT_FACILITY_FILTERS: FacilityFilters = {
  per_page: 100,
  page: 1,
  period: 'this_month',
};

const DEFAULT_PATIENT_FILTERS: PatientFilters = {
  per_page: 100,
  page: 1,
  period: 'this_month',
};

function FacilityGovernance() {
  const theme = useSelector((state: ThemeRootState) => state.ui?.theme ?? 'light');
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<GovernanceTab>('facilities');

  const [facilityFilters, setFacilityFilters] =
    useState<FacilityFilters>(DEFAULT_FACILITY_FILTERS);
  const [patientFilters, setPatientFilters] =
    useState<PatientFilters>(DEFAULT_PATIENT_FILTERS);

  const [facilityPage, setFacilityPage] = useState(1);
  const [patientPage, setPatientPage] = useState(1);

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [statusTarget, setStatusTarget] = useState<Facility | null>(null);

  const {
    data: facilitiesResponse,
    isLoading: isFacilitiesLoading,
    isFetching: isFacilitiesFetching,
    error: facilitiesError,
    refetch: refetchFacilities,
  } = usePlatformFacilities(facilityFilters);

  const {
    data: patientsResponse,
    isLoading: isPatientsLoading,
    isFetching: isPatientsFetching,
    error: patientsError,
    refetch: refetchPatients,
  } = usePlatformPatients(patientFilters);

  const updateFacilityStatusMutation = useUpdateFacilityStatus();

  // ✅ Memoize facilities and patients with proper typing
  const facilities = useMemo(
    () => facilitiesResponse?.data ?? [],
    [facilitiesResponse?.data]
  );

  const facilitiesMeta = useMemo(
    () => facilitiesResponse?.meta as FacilitiesResponse['meta'] | undefined,
    [facilitiesResponse?.meta]
  );

  const patients = useMemo(
    () => patientsResponse?.data ?? [],
    [patientsResponse?.data]
  );

  const patientsMeta = useMemo(
    () => patientsResponse?.meta as PatientsResponse['meta'] | undefined,
    [patientsResponse?.meta]
  );

  // Facility counts with proper fallback
  const facilityCounts = facilitiesMeta?.facility_counts ?? {
    total: 0,
    today: 0,
    this_week: 0,
    this_month: 0,
    active: 0,
    suspended: 0,
    banned: 0,
  };

  const staffCounts = facilitiesMeta?.staff_counts ?? {
    total: 0,
    assigned: 0,
    unassigned: 0,
  };

  // Patient counts with proper fallback
  const patientCounts = patientsMeta?.counts ?? {
    total: 0,
    today: 0,
    this_week: 0,
    this_month: 0,
    active: 0,
    inactive: 0,
    deceased: 0,
  };

  const totalFacilityPages = Math.max(1, Math.ceil(facilities.length / CLIENT_PAGE_SIZE));
  const totalPatientPages = Math.max(1, Math.ceil(patients.length / CLIENT_PAGE_SIZE));

  const paginatedFacilities = useMemo(() => {
    const start = (facilityPage - 1) * CLIENT_PAGE_SIZE;
    return facilities.slice(start, start + CLIENT_PAGE_SIZE);
  }, [facilities, facilityPage]);

  const paginatedPatients = useMemo(() => {
    const start = (patientPage - 1) * CLIENT_PAGE_SIZE;
    return patients.slice(start, start + CLIENT_PAGE_SIZE);
  }, [patients, patientPage]);

  const handleRefresh = async () => {
    await Promise.all([refetchFacilities(), refetchPatients()]);
  };

  const handleFacilityFilterChange = (
    key: keyof FacilityFilters,
    value: string | number | undefined
  ) => {
    setFacilityPage(1);
    setFacilityFilters((prev) => {
      const nextValue = value === '' ? undefined : value;
      if (key === 'period') {
        return {
          ...prev,
          period: nextValue as FacilityFilters['period'],
          date_from: undefined,
          date_to: undefined,
        };
      }
      if (key === 'date_from' || key === 'date_to') {
        return {
          ...prev,
          [key]: nextValue,
          period: undefined,
        };
      }
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const handlePatientFilterChange = (
    key: keyof PatientFilters,
    value: string | number | undefined
  ) => {
    setPatientPage(1);
    setPatientFilters((prev) => {
      const nextValue = value === '' ? undefined : value;
      if (key === 'period') {
        return {
          ...prev,
          period: nextValue as PatientFilters['period'],
          date_from: undefined,
          date_to: undefined,
        };
      }
      if (key === 'date_from' || key === 'date_to') {
        return {
          ...prev,
          [key]: nextValue,
          period: undefined,
        };
      }
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const handleResetFacilityFilters = () => {
    setFacilityPage(1);
    setFacilityFilters(DEFAULT_FACILITY_FILTERS);
  };

  const handleResetPatientFilters = () => {
    setPatientPage(1);
    setPatientFilters(DEFAULT_PATIENT_FILTERS);
  };

  const handleSubmitStatusUpdate = async (payload: {
    status: Facility['status'];
    reason?: string;
  }) => {
    if (!statusTarget) return;
    await updateFacilityStatusMutation.mutateAsync({
      facilityId: statusTarget.id,
      data: {
        status: payload.status,
        status_reason: payload.reason,
      },
    });
    setStatusTarget(null);
  };

  const activeError =
    activeTab === 'facilities'
      ? facilitiesError?.response?.data?.message || facilitiesError?.message
      : patientsError?.response?.data?.message || patientsError?.message;

  const activeIsLoading =
    activeTab === 'facilities'
      ? isFacilitiesLoading && !facilitiesResponse
      : isPatientsLoading && !patientsResponse;

  const activeIsFetching =
    activeTab === 'facilities' ? isFacilitiesFetching : isPatientsFetching;

  return (
    <div className={getPageShellClass(isDark)}>
      <div className="mx-auto max-w-[1720px] space-y-6">
        <FacilityGovernanceHeader
          isDark={isDark}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={handleRefresh}
          isFetching={isFacilitiesFetching || isPatientsFetching}
          facilityTotal={facilityCounts.total}
          patientTotal={patientCounts.total}
        />

        <FacilityGovernanceMetrics
          isDark={isDark}
          facilityCounts={facilityCounts}
          staffCounts={staffCounts}
          patientCounts={patientCounts}
        />

        <FacilityGovernanceFiltersPanel
          isDark={isDark}
          activeTab={activeTab}
          facilityFilters={facilityFilters}
          patientFilters={patientFilters}
          onFacilityFilterChange={handleFacilityFilterChange}
          onPatientFilterChange={handlePatientFilterChange}
          onResetFacilityFilters={handleResetFacilityFilters}
          onResetPatientFilters={handleResetPatientFilters}
        />

        {activeError && (
          <div className={cn(getPanelClass(isDark), 'border-rose-500/20 p-5')}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                  )}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isDark ? 'text-white' : 'text-slate-950'
                    )}
                  >
                    Unable to load {activeTab}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {activeError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  isDark
                    ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <RefreshCw
                  className={cn('h-4 w-4', activeIsFetching && 'animate-spin')}
                />
                Retry
              </button>
            </div>
          </div>
        )}

        {activeIsLoading ? (
          <GovernanceTableSkeleton isDark={isDark} />
        ) : activeTab === 'facilities' ? (
          facilities.length ? (
            <FacilityGovernanceFacilityTable
              isDark={isDark}
              facilities={paginatedFacilities}
              meta={facilitiesMeta}
              currentPage={facilityPage}
              totalPages={totalFacilityPages}
              pageSize={CLIENT_PAGE_SIZE}
              totalItems={facilities.length}
              isFetching={isFacilitiesFetching}
              onPageChange={setFacilityPage}
              onViewDetails={setSelectedFacility}
              onOpenStatus={(facility) => {
                updateFacilityStatusMutation.reset();
                setStatusTarget(facility);
              }}
            />
          ) : (
            <EmptyState
              isDark={isDark}
              title="No facilities found"
              subtitle="No facility records match the current governance filters."
              icon={CircleAlert}
            />
          )
        ) : patients.length ? (
          <FacilityGovernancePatientTable
            isDark={isDark}
            patients={paginatedPatients}
            meta={patientsMeta}
            currentPage={patientPage}
            totalPages={totalPatientPages}
            pageSize={CLIENT_PAGE_SIZE}
            totalItems={patients.length}
            isFetching={isPatientsFetching}
            onPageChange={setPatientPage}
          />
        ) : (
          <EmptyState
            isDark={isDark}
            title="No patients found"
            subtitle="No patient registry records match the current governance filters."
            icon={CircleAlert}
          />
        )}
      </div>

      <FacilityGovernanceFacilityDrawer
        isDark={isDark}
        facility={selectedFacility}
        open={Boolean(selectedFacility)}
        onClose={() => setSelectedFacility(null)}
        onOpenStatus={(facility) => {
          updateFacilityStatusMutation.reset();
          setStatusTarget(facility);
        }}
      />

      <FacilityGovernanceStatusModal
        isDark={isDark}
        open={Boolean(statusTarget)}
        facility={statusTarget}
        isSubmitting={updateFacilityStatusMutation.isPending}
        errorMessage={
          updateFacilityStatusMutation.error?.response?.data?.message ||
          updateFacilityStatusMutation.error?.message
        }
        onClose={() => {
          updateFacilityStatusMutation.reset();
          setStatusTarget(null);
        }}
        onSubmit={handleSubmitStatusUpdate}
      />
    </div>
  );
}

export default FacilityGovernance;