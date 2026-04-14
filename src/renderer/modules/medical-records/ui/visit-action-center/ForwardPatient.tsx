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
    // Convert null to undefined by only including if not null
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
}) => {
  const isDark = theme === 'dark';
  const colors = useMemo(() => getForwardPatientColors(theme), [theme]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);
  const pendingForwarding = useSelector(selectPendingForwarding);

  // Transform pendingForwarding for use in utils
  const normalizedPendingForwarding = useMemo(
    () => transformPendingForwardingForUtils(pendingForwarding),
    [pendingForwarding]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [clientSideSearchTerm, setClientSideSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] =
    useState<StaffFilterStatus>('available');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

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
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
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

  // Use normalized version for getDisplayVisitId
  const displayVisitId = useMemo(
    () => getDisplayVisitId(visitId, normalizedPendingForwarding),
    [visitId, normalizedPendingForwarding]
  );

  // Use normalized version for getDisplayPatientId
  const displayPatientId = useMemo(
    () => getDisplayPatientId(derivedPatientId, normalizedPendingForwarding),
    [derivedPatientId, normalizedPendingForwarding]
  );

  // Use normalized version for getDisplayPatientName
  const displayPatientName = useMemo(
    () => getDisplayPatientName(derivedPatientName, normalizedPendingForwarding),
    [derivedPatientName, normalizedPendingForwarding]
  );

  // FIXED: Use normalizedPendingForwarding here instead of pendingForwarding
  const buildPayload = useCallback(
    (formData: ForwardPatientFormData, effectiveHasProvidedServices: boolean) =>
      buildForwardingPayload({
        visitId,
        derivedPatientId,
        derivedPatientName,
        selectedStaff,
        pendingForwarding: normalizedPendingForwarding, // ✅ Use normalized version
        formData,
        effectiveHasProvidedServices,
      }),
    [
      visitId,
      derivedPatientId,
      derivedPatientName,
      selectedStaff,
      normalizedPendingForwarding, // ✅ Update dependency
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
  }, []);

  const handleFilterChange = useCallback(
    (status: StaffFilterStatus) => {
      setFilterStatus(status);
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

  const filteredStaff = useMemo(
    () =>
      filterAndSortStaff({
        staffMembers,
        searchTerm: clientSideSearchTerm,
        filterStatus,
      }),
    [staffMembers, clientSideSearchTerm, filterStatus]
  );

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
          />

          <StaffSelectionSection
            isLoadingStaff={isLoadingStaff}
            isStaffError={isStaffError}
            filteredStaff={filteredStaff}
            searchTerm={searchTerm}
            hasLoadedInitialData={hasLoadedInitialData}
            clearSearch={clearSearch}
            refetchStaff={refetchStaff}
            selectedStaffId={selectedStaffId}
            handleStaffSelect={handleStaffSelect}
            colors={colors}
            isDark={isDark}
            getStatusInfo={getStaffStatusInfo}
            errors={errors}
            summaryData={summaryData}
            clientSideSearchTerm={clientSideSearchTerm}
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