import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';

import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

import {
  selectActiveVisitId,
  selectActiveVisit,
  clearActiveVisit,
} from '../../../../app/store/slices/visitSlice';

import {
  clearPendingForwarding,
  selectPendingForwarding,
  type PendingPatientForwarding,
} from '../../../../app/store/slices/forwardPatientSlice';

import {
  useAssignStaffToVisit,
  useGetStaffForForwarding,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

import { useGetBillableItems } from '../../api/billable-items/BillableItemsQueries';

import {
  type StaffForwardingFilters,
  type ForwardingStaff,
  type StaffPresenceStatus,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import {
  forwardPatientSchema,
  type ForwardPatientFormData,
  type ForwardPatientProps,
  type StaffFilterStatus,
} from './billing-space/forward-patient-components/schema';

import {
  getForwardPatientColors,
  getStatusInfo,
} from './billing-space/forward-patient-components/constants';

import {
  buildForwardingPayload,
  buildStaffSummary,
  filterAndSortStaff,
  getDerivedPatientId,
  getDerivedPatientName,
  getDisplayPatientId,
  getDisplayPatientName,
  getDisplayVisitId,
} from './billing-space/forward-patient-components/utils';

import { useForwardPatientFlow } from './billing-space/forward-patient-components/useForwardPatientFlow';

import {
  ForwardPatientHeader,
  SelectedStaffSummary,
  ServicesDecisionSection,
  StaffSearchFilters,
  StaffSelectionSection,
} from './billing-space/forward-patient-components/sections';

const STAFF_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ============================================
// TRANSFORMER FUNCTION
// ============================================
/**
 * Transforms PendingPatientForwarding (with null values) to the format expected by utils
 * Converts null to undefined for optional properties
 */
const transformPendingForwardingForUtils = (
  forwarding: PendingPatientForwarding | null
): {
  visitId?: number;
  patientId?: number;
  patientName: string;
  assignedStaffId?: number;
  assignedStaffName: string;
  note: string;
  hasProvidedServices: boolean;
  createdAt?: number;
} | null => {
  if (!forwarding) return null;

  return {
    patientName: forwarding.patientName,
    assignedStaffName: forwarding.assignedStaffName,
    note: forwarding.note,
    hasProvidedServices: forwarding.hasProvidedServices,
    ...(forwarding.visitId !== null && { visitId: forwarding.visitId }),
    ...(forwarding.patientId !== null && { patientId: forwarding.patientId }),
    ...(forwarding.assignedStaffId !== null && { assignedStaffId: forwarding.assignedStaffId }),
    ...(forwarding.createdAt !== null && { createdAt: forwarding.createdAt }),
  };
};

export const ForwardPatient: React.FC<ForwardPatientProps> = ({
  onSuccess,
  onCancel,
  theme = 'light',
  currentStaffId,
  queueRedirectTo = MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
}) => {
  const isDark = theme === 'dark';
  const colors = useMemo(() => getForwardPatientColors(theme), [theme]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);
  const pendingForwarding = useSelector(selectPendingForwarding);

  const normalizedPendingForwarding = useMemo(
    () => transformPendingForwardingForUtils(pendingForwarding),
    [pendingForwarding]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [clientSideSearchTerm, setClientSideSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] =
    useState<StaffFilterStatus>('available');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const initialFilters: StaffForwardingFilters = useMemo(
    () => ({
      exclude_current_staff: !!currentStaffId,
      limit: 100,
    }),
    [currentStaffId]
  );

  const {
    data: staffData,
    isLoading: isLoadingStaff,
    isFetching: isFetchingStaff,
    isError: isStaffError,
    refetch: refetchStaff,
  } = useGetStaffForForwarding(initialFilters);

  const {
    refetch: refetchBillableItems,
    isFetching: isFetchingBillableItems,
  } = useGetBillableItems(
    {},
    {
      enabled: false,
    }
  );

  const assignMutation = useAssignStaffToVisit({
    onSuccess: (data) => {
      console.log('[ForwardPatient] Staff assigned successfully', data);
      dispatch(clearPendingForwarding());
      dispatch(clearActiveVisit());
      navigate(queueRedirectTo);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('[ForwardPatient] Failed to assign staff:', error);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ForwardPatientFormData>({
    resolver: zodResolver(forwardPatientSchema),
    mode: 'onChange',
    defaultValues: {
      assigned_staff_id: 0,
      note: '',
    },
  });

  const selectedStaffId = watch('assigned_staff_id');

  const staffMembers: ForwardingStaff[] = useMemo(() => {
    if (!staffData?.data?.staff || !Array.isArray(staffData.data.staff)) return [];
    return staffData.data.staff;
  }, [staffData]);

  const selectedStaff = useMemo(() => {
    return staffMembers.find((staff) => staff.staff_id === selectedStaffId);
  }, [staffMembers, selectedStaffId]);

  const derivedPatientName = useMemo(
    () => getDerivedPatientName(activeVisit),
    [activeVisit]
  );

  const derivedPatientId = useMemo(
    () => getDerivedPatientId(activeVisit),
    [activeVisit]
  );

  const sameVisitPending = pendingForwarding?.visitId === visitId;

  const shouldHideServicesQuestion = Boolean(
    sameVisitPending && pendingForwarding?.hasProvidedServices
  );

  const displayVisitId = useMemo(
    () => getDisplayVisitId(visitId, normalizedPendingForwarding),
    [visitId, normalizedPendingForwarding]
  );

  const displayPatientId = useMemo(
    () => getDisplayPatientId(derivedPatientId, normalizedPendingForwarding),
    [derivedPatientId, normalizedPendingForwarding]
  );

  const displayPatientName = useMemo(
    () => getDisplayPatientName(derivedPatientName, normalizedPendingForwarding),
    [derivedPatientName, normalizedPendingForwarding]
  );

  const buildPayload = useCallback(
    (formData: ForwardPatientFormData, effectiveHasProvidedServices: boolean) =>
      buildForwardingPayload({
        visitId,
        derivedPatientId,
        derivedPatientName,
        selectedStaff,
        pendingForwarding: normalizedPendingForwarding,
        formData,
        effectiveHasProvidedServices,
      }),
    [
      visitId,
      derivedPatientId,
      derivedPatientName,
      selectedStaff,
      normalizedPendingForwarding,
    ]
  );

  const {
    hasProvidedServices,
    setHasProvidedServices,
    servicesDecisionError,
    setServicesDecisionError,
    isOpeningBillingTray,
    handleServicesChoice,
    onSubmit,
  } = useForwardPatientFlow({
    visitId,
    displayVisitId,
    displayPatientId,
    displayPatientName,
    shouldHideServicesQuestion,
    assignMutation,
    dispatch,
    onCancel,
    refetchBillableItems,
    isFetchingBillableItems,
    buildPayload,
  });

  useEffect(() => {
    if (staffMembers.length > 0 && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
    }
  }, [staffMembers, hasLoadedInitialData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClientSideSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    reset({
      assigned_staff_id: sameVisitPending ? pendingForwarding?.assignedStaffId ?? 0 : 0,
      note: sameVisitPending ? pendingForwarding?.note ?? '' : '',
    });

    setHasProvidedServices(
      sameVisitPending ? pendingForwarding?.hasProvidedServices ?? null : null
    );
    setServicesDecisionError(null);
  }, [
    visitId,
    pendingForwarding,
    sameVisitPending,
    reset,
    setHasProvidedServices,
    setServicesDecisionError,
  ]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setClientSideSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (status: StaffFilterStatus) => {
      setFilterStatus(status);
      setCurrentPage(1);
      setValue('assigned_staff_id', 0, { shouldValidate: true });
    },
    [setValue]
  );

  const handleStaffSelect = useCallback(
    (staffId: number, canReceive: boolean) => {
      if (!canReceive) return;
      setValue('assigned_staff_id', staffId, { shouldValidate: true });
    },
    [setValue]
  );

  const handleRefreshStaff = useCallback(async () => {
    setCurrentPage(1);
    await refetchStaff();
  }, [refetchStaff]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const filteredStaff = useMemo(
    () =>
      filterAndSortStaff({
        staffMembers,
        searchTerm: clientSideSearchTerm,
        filterStatus,
      }),
    [staffMembers, clientSideSearchTerm, filterStatus]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStaff.length / pageSize)),
    [filteredStaff.length, pageSize]
  );

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredStaff.slice(startIndex, endIndex);
  }, [filteredStaff, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientSideSearchTerm, filterStatus, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summaryData = useMemo(() => buildStaffSummary(staffMembers), [staffMembers]);

  const getStaffStatusInfo = useCallback(
    (status: StaffPresenceStatus) => getStatusInfo(colors, status),
    [colors]
  );

  if (!visitId || !activeVisit) {
    return (
      <div className={`rounded-xl p-8 text-center ${colors.bg.secondary}`}>
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
        <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
          No Patient Selected
        </h3>
        <p className={colors.text.secondary}>
          Please select a patient to forward to another staff member.
        </p>
      </div>
    );
  }

  const submitButtonLabel =
    shouldHideServicesQuestion || hasProvidedServices === true
      ? 'Add Items/Services & Forward'
      : 'Forward Patient';

  const isSubmitDisabled =
    !isValid ||
    assignMutation.isPending ||
    isSubmitting ||
    isOpeningBillingTray ||
    !selectedStaffId ||
    (!shouldHideServicesQuestion && hasProvidedServices === null);

  return (
    <div
      className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}
    >
      <ForwardPatientHeader
        isDark={isDark}
        colors={colors}
        hasLoadedInitialData={hasLoadedInitialData}
        staffCount={staffMembers.length}
      />

      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <StaffSearchFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            clientSideSearchTerm={clientSideSearchTerm}
            filteredCount={filteredStaff.length}
            colors={colors}
            filterStatus={filterStatus}
            onFilterChange={handleFilterChange}
            clearSearch={clearSearch}
            hasLoadedInitialData={hasLoadedInitialData}
            isDark={isDark}
            onRefresh={handleRefreshStaff}
            isRefreshing={Boolean(isFetchingStaff && hasLoadedInitialData)}
          />

          <StaffSelectionSection
            isLoadingStaff={isLoadingStaff}
            isStaffError={isStaffError}
            filteredStaff={filteredStaff}
            paginatedStaff={paginatedStaff}
            searchTerm={searchTerm}
            hasLoadedInitialData={hasLoadedInitialData}
            clearSearch={clearSearch}
            onRefresh={handleRefreshStaff}
            selectedStaffId={selectedStaffId}
            handleStaffSelect={handleStaffSelect}
            colors={colors}
            isDark={isDark}
            getStatusInfo={getStaffStatusInfo}
            errors={errors}
            summaryData={summaryData}
            clientSideSearchTerm={clientSideSearchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={STAFF_PAGE_SIZE_OPTIONS}
          />

          {selectedStaff && (
            <SelectedStaffSummary
              selectedStaff={selectedStaff}
              colors={colors}
              getStatusInfo={getStaffStatusInfo}
            />
          )}

          <ServicesDecisionSection
            shouldHideServicesQuestion={shouldHideServicesQuestion}
            hasProvidedServices={hasProvidedServices}
            handleServicesChoice={handleServicesChoice}
            colors={colors}
            isFetchingBillableItems={isFetchingBillableItems}
            servicesDecisionError={servicesDecisionError}
          />

          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
              Forwarding Notes (Optional)
            </label>

            <textarea
              {...register('note')}
              placeholder="Add any notes about why you're forwarding this patient..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
            />

            {errors.note && (
              <p className="mt-2 text-sm text-red-500">{errors.note.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={assignMutation.isPending || isOpeningBillingTray}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                isSubmitDisabled
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.bg.accent} ${colors.bg.accentHover} ${colors.text.accent} cursor-pointer`
              }`}
            >
              {assignMutation.isPending || isSubmitting || isOpeningBillingTray ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isOpeningBillingTray ? 'Opening Billing...' : 'Forwarding...'}
                </span>
              ) : (
                submitButtonLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForwardPatient;
