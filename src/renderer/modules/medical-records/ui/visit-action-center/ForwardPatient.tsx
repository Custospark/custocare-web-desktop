// ForwardPatient.tsx (fixed version)
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  DoorClosed,
  Loader2,
  Search,
  AlertCircle,
  UserPlus,
  X,
  RefreshCw,
} from 'lucide-react';

import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

import {
  selectActiveVisitId,
  selectActiveVisit,
  clearActiveVisit,
} from '../../../../app/store/slices/visitSlice';

import {
  setPendingForwarding,
  clearPendingForwarding,
  selectPendingForwarding,
} from '../../../../app/store/slices/forwardPatientSlice';

import { openTray } from './billing-space/billingSlice';

import {
  useAssignStaffToVisit,
  useGetStaffForForwarding,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

import { useGetBillableItems } from '../../api/billable-items/BillableItemsQueries';

import {
  type AssignStaffToVisitRequest,
  type StaffForwardingFilters,
  type ForwardingStaff,
  StaffPresenceStatus,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import { getRoleDisplayName as formatRole } from '../../../../shared/utils/facilityRoleFormator';

const forwardPatientSchema = z.object({
  assigned_staff_id: z.number().min(1, 'Please select a staff member'),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});

type ForwardPatientFormData = z.infer<typeof forwardPatientSchema>;

interface ForwardPatientProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
  currentStaffId?: number;
}

const statusOrder: Record<StaffPresenceStatus, number> = {
  [StaffPresenceStatus.ON_DUTY]: 0,
  [StaffPresenceStatus.BUSY]: 1,
  [StaffPresenceStatus.ON_BREAK]: 2,
  [StaffPresenceStatus.UNAVAILABLE]: 3,
  [StaffPresenceStatus.OFF_DUTY]: 4,
};

export const ForwardPatient: React.FC<ForwardPatientProps> = ({
  onSuccess,
  onCancel,
  theme = 'light',
  currentStaffId,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);
  const pendingForwarding = useSelector(selectPendingForwarding);

  const [searchTerm, setSearchTerm] = useState('');
  const [clientSideSearchTerm, setClientSideSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'busy' | 'on_duty' | 'available'>('available');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasProvidedServices, setHasProvidedServices] = useState<boolean | null>(null);
  const [servicesDecisionError, setServicesDecisionError] = useState<string | null>(null);
  const [isOpeningBillingTray, setIsOpeningBillingTray] = useState(false);

  const hasPrefetchedBillableItemsRef = useRef(false);
  const latestBillingOpenAttemptRef = useRef(0);

  const debugLog = useCallback((message: string, payload?: unknown) => {
    console.log(`[ForwardPatient] ${message}`, payload ?? '');
  }, []);

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
      debugLog('Staff assigned successfully', data);
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

  // Move selectedStaff BEFORE it's used in useCallback
  const selectedStaff = useMemo(() => {
    return staffMembers.find((staff) => staff.staff_id === selectedStaffId);
  }, [staffMembers, selectedStaffId]);

  const derivedPatientName = useMemo(() => {
    const visit = activeVisit as any;
    return visit?.patient?.name ?? visit?.patientName ?? visit?.patient_name ?? '';
  }, [activeVisit]);

  const derivedPatientId = useMemo(() => {
    const visit = activeVisit as any;
    return visit?.patient_id ?? visit?.patient?.id ?? null;
  }, [activeVisit]);

  const sameVisitPending = pendingForwarding?.visitId === visitId;
  const shouldHideServicesQuestion = Boolean(
    sameVisitPending && pendingForwarding?.hasProvidedServices
  );

  const displayVisitId = useMemo(() => {
    if (visitId != null) return String(visitId);
    if (pendingForwarding?.visitId != null) return String(pendingForwarding.visitId);
    return undefined;
  }, [visitId, pendingForwarding]);

  const displayPatientId = useMemo(() => {
    if (derivedPatientId != null) return String(derivedPatientId);
    if (pendingForwarding?.patientId != null) return String(pendingForwarding.patientId);
    return undefined;
  }, [derivedPatientId, pendingForwarding]);

  const displayPatientName = useMemo(() => {
    return derivedPatientName || pendingForwarding?.patientName || undefined;
  }, [derivedPatientName, pendingForwarding]);

  // Now selectedStaff is defined, so this useCallback is safe
  const buildForwardingPayload = useCallback(
    (formData: ForwardPatientFormData, effectiveHasProvidedServices: boolean) => ({
      visitId,
      patientId: derivedPatientId,
      patientName: derivedPatientName || '',
      assignedStaffId: formData.assigned_staff_id,
      assignedStaffName:
        selectedStaff?.full_name || pendingForwarding?.assignedStaffName || '',
      note: formData.note?.trim() || '',
      hasProvidedServices: effectiveHasProvidedServices,
    }),
    [
      visitId,
      derivedPatientId,
      derivedPatientName,
      selectedStaff,
      pendingForwarding,
    ]
  );

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
  }, [visitId, pendingForwarding, sameVisitPending, reset]);

  useEffect(() => {
    if (isFetchingBillableItems) {
      debugLog('Billable items fetch in progress');
    } else if (hasPrefetchedBillableItemsRef.current) {
      debugLog('Billable items fetch completed or idle after prefetch');
    }
  }, [isFetchingBillableItems, debugLog]);

  const prefetchBillingInBackground = useCallback(() => {
    if (hasPrefetchedBillableItemsRef.current) {
      debugLog('Skipping prefetch because billable items were already requested');
      return;
    }

    hasPrefetchedBillableItemsRef.current = true;
    debugLog('Starting billable items prefetch');

    const runPrefetch = () => {
      refetchBillableItems()
        .then((result) => {
          debugLog('Billable items prefetched successfully', result);
        })
        .catch((error) => {
          console.error('[ForwardPatient] Background prefetch failed:', error);
          hasPrefetchedBillableItemsRef.current = false;
        });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(runPrefetch, { timeout: 2000 });
    } else {
      setTimeout(runPrefetch, 150);
    }
  }, [refetchBillableItems, debugLog]);

  const closeForwardPanelAfterBillingLaunch = useCallback(() => {
    debugLog('Scheduling ForwardPatient close after billing tray dispatch');

    const runClose = () => {
      debugLog('Calling onCancel after billing tray open attempt');
      onCancel?.();
    };

    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(runClose, 80);
        });
      });
    } else {
      setTimeout(runClose, 150);
    }
  }, [onCancel, debugLog]);

const openBillingTrayForForwarding = useCallback(
  async (formData: ForwardPatientFormData) => {
    const attemptId = Date.now();
    latestBillingOpenAttemptRef.current = attemptId;
    setIsOpeningBillingTray(true);

    try {
      const payload = buildForwardingPayload(formData, true);

      debugLog('Preparing forwarding-to-billing flow', {
        attemptId,
        payload,
        trayPayload: {
          step: 'charge_entry',
          visitId: displayVisitId,
          patientId: displayPatientId,
          patientName: displayPatientName,
        },
      });

      dispatch(setPendingForwarding(payload));
      debugLog('Pending forwarding saved before opening billing tray');

      dispatch(
        openTray({
          step: 'charge_entry',
          visitId: displayVisitId,
          patientId: displayPatientId,
          patientName: displayPatientName,
        })
      );
      debugLog('openTray dispatched for charge_entry');

      prefetchBillingInBackground();

      setTimeout(() => {
        if (latestBillingOpenAttemptRef.current === attemptId) {
          debugLog('Billing tray open dispatch completed');
        }
      }, 250);

      closeForwardPanelAfterBillingLaunch();
    } finally {
      setIsOpeningBillingTray(false);
    }
  },
  [
    buildForwardingPayload,
    dispatch,
    displayVisitId,
    displayPatientId,
    displayPatientName,
    prefetchBillingInBackground,
    closeForwardPanelAfterBillingLaunch,
    debugLog,
  ]
);

  const handleServicesChoice = useCallback(
    (value: boolean) => {
      setHasProvidedServices(value);
      setServicesDecisionError(null);

      debugLog('Services choice updated', { hasProvidedServices: value });

      if (value) {
        prefetchBillingInBackground();
      }
    },
    [prefetchBillingInBackground, debugLog]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setClientSideSearchTerm('');
  }, []);

  const handleFilterChange = useCallback(
    (status: typeof filterStatus) => {
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

  const filteredStaff = useMemo(() => {
    let staff = staffMembers;

    if (clientSideSearchTerm.trim()) {
      const searchLower = clientSideSearchTerm.toLowerCase().trim();
      staff = staff.filter((member) =>
        member.full_name?.toLowerCase().includes(searchLower) ||
        member.employee_id?.toLowerCase().includes(searchLower) ||
        member.staff_uuid?.toLowerCase().includes(searchLower) ||
        member.role_code?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStatus === 'available') {
      staff = staff.filter((member) => member.is_available);
    } else if (filterStatus === 'on_duty') {
      staff = staff.filter(
        (member) => member.presence_status === StaffPresenceStatus.ON_DUTY
      );
    } else if (filterStatus === 'busy') {
      staff = staff.filter(
        (member) => member.presence_status === StaffPresenceStatus.BUSY
      );
    }

    return [...staff].sort((a, b) => {
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1;
      }

      const aOrder = statusOrder[a.presence_status] ?? 99;
      const bOrder = statusOrder[b.presence_status] ?? 99;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return a.workload_percentage - b.workload_percentage;
    });
  }, [staffMembers, clientSideSearchTerm, filterStatus]);

  const summaryData = useMemo(() => {
    if (staffMembers.length === 0) return null;

    const available = staffMembers.filter((staff) => staff.is_available).length;
    const busy = staffMembers.filter(
      (staff) => staff.presence_status === StaffPresenceStatus.BUSY
    ).length;
    const total = staffMembers.length;

    return { available, busy, total };
  }, [staffMembers]);

  const handleDirectForward = useCallback(
    async (formData: ForwardPatientFormData) => {
      if (!visitId) {
        console.error('[ForwardPatient] No visit selected');
        return;
      }

      const request: AssignStaffToVisitRequest = {
        visit_id: visitId,
        assigned_staff_id: formData.assigned_staff_id,
      };

      try {
        debugLog('Proceeding with direct forward without billing', request);
        dispatch(clearPendingForwarding());
        await assignMutation.mutateAsync({ data: request });
      } catch (error) {
        console.error('[ForwardPatient] Failed to assign staff:', error);
      }
    },
    [visitId, assignMutation, dispatch, debugLog]
  );

  const onSubmit = async (formData: ForwardPatientFormData) => {
    if (!visitId) {
      console.error('[ForwardPatient] No visit selected');
      return;
    }

    const effectiveHasProvidedServices = shouldHideServicesQuestion
      ? true
      : hasProvidedServices;

    debugLog('Submitting forward patient form', {
      visitId,
      selectedStaffId: formData.assigned_staff_id,
      effectiveHasProvidedServices,
      shouldHideServicesQuestion,
    });

    if (effectiveHasProvidedServices === null) {
      setServicesDecisionError(
        'Please indicate whether you provided any services or items to the patient.'
      );
      return;
    }

    if (effectiveHasProvidedServices) {
      await openBillingTrayForForwarding(formData);
      return;
    }

    await handleDirectForward(formData);
  };

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-700',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: 'text-white',
    },
    status: {
      on_duty: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'On Duty' },
      busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Busy' },
      on_break: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'On Break' },
      unavailable: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Unavailable' },
      off_duty: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Off Duty' },
    },
  };

  const getStatusInfo = (status: StaffPresenceStatus) => {
    const statusInfo = colors.status[status] || colors.status.off_duty;
    const icon = {
      [StaffPresenceStatus.ON_DUTY]: <CheckCircle2 className="w-4 h-4" />,
      [StaffPresenceStatus.BUSY]: <Activity className="w-4 h-4" />,
      [StaffPresenceStatus.ON_BREAK]: <Clock className="w-4 h-4" />,
      [StaffPresenceStatus.UNAVAILABLE]: <XCircle className="w-4 h-4" />,
      [StaffPresenceStatus.OFF_DUTY]: <XCircle className="w-4 h-4" />,
    }[status] || <XCircle className="w-4 h-4" />;

    return { ...statusInfo, icon };
  };

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

 const submitButtonLabel = (shouldHideServicesQuestion || hasProvidedServices === true)
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
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />

          <div className="flex-1">
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>
              Forward Patient
            </h2>
            <p className={colors.text.secondary}>
              Assign patient to another staff member
            </p>
          </div>

          {hasLoadedInitialData && (
            <div
              className={`text-xs px-2 py-1 rounded cursor-default ${
                isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
              }`}
            >
              ✓ Staff directory updated • {staffMembers.length} active members
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`}
              />

              <input
                type="text"
                placeholder="Search staff by name, staff number, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
              />

              {hasLoadedInitialData && clientSideSearchTerm && (
                <>
                  <div
                    className={`absolute right-12 top-1/2 -translate-y-1/2 text-xs ${colors.text.tertiary} cursor-default`}
                  >
                    {filteredStaff.length} results
                  </div>

                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${colors.bg.hover} transition-colors cursor-pointer`}
                    title="Clear search"
                    aria-label="Clear search results"
                  >
                    <X className={`w-4 h-4 ${colors.text.tertiary}`} />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm ${colors.text.secondary} cursor-default`}>
                Filter by status:
              </span>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'available' as const, label: 'Available' },
                  { value: 'on_duty' as const, label: 'On Duty' },
                  { value: 'busy' as const, label: 'Busy' },
                  { value: 'all' as const, label: 'All Staff' },
                ].map(({ value, label }) => {
                  const isActive = filterStatus === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleFilterChange(value)}
                      disabled={!hasLoadedInitialData}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? `${
                              value === 'available'
                                ? 'bg-green-500/10 text-green-600'
                                : value === 'on_duty'
                                  ? 'bg-green-500/10 text-green-600'
                                  : value === 'busy'
                                    ? 'bg-yellow-500/10 text-yellow-600'
                                    : 'bg-gray-500/10 text-gray-600'
                            } border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                          : `${colors.bg.hover} ${colors.text.secondary} border ${colors.border.primary}`
                      } ${!hasLoadedInitialData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {value !== 'all' &&
                        (value === 'available' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : value === 'on_duty' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : value === 'busy' ? (
                          <Activity className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        ))}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-3 ${colors.text.secondary} cursor-default`}
            >
              Select Staff Member to Forward To <span className="text-red-500">*</span>
              <span className={`block text-xs mt-1 ${colors.text.tertiary} cursor-default`}>
                Staff must be available to receive patients (On Duty or Busy with capacity)
              </span>
            </label>

            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                />
                <span className="ml-3 text-gray-500">Loading staff...</span>
              </div>
            ) : isStaffError ? (
              <div className={`py-8 text-center rounded-lg border ${colors.border.primary}`}>
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
                  Failed to Load Staff
                </h3>
                <p className={colors.text.secondary}>
                  Unable to load staff list. Please try again.
                </p>

                <button
                  type="button"
                  onClick={() => refetchStaff()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
                <Users className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
                  {searchTerm ? 'No Matching Staff Found' : 'No Staff Available'}
                </h3>
                <p className={colors.text.secondary}>
                  {searchTerm
                    ? 'No loaded staff match your search criteria'
                    : 'No staff are available to receive patients'}
                </p>

                {searchTerm && hasLoadedInitialData && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                {filteredStaff.map((staff) => {
                  const statusInfo = getStatusInfo(staff.presence_status);
                  const isSelected = selectedStaffId === staff.staff_id;
                  const canReceive = staff.is_available;

                  return (
                    <div
                      key={staff.staff_id}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? `${isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`
                          : `${colors.border.primary} ${colors.bg.hover}`
                      } ${!canReceive ? 'opacity-50' : 'cursor-pointer'}`}
                      onClick={() => handleStaffSelect(staff.staff_id, canReceive)}
                      role="button"
                      tabIndex={canReceive ? 0 : -1}
                      onKeyDown={(e) => {
                        if (!canReceive) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStaffSelect(staff.staff_id, canReceive);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className={`w-4 h-4 ${colors.text.tertiary}`} />
                            <h4 className={`font-semibold truncate ${colors.text.primary}`}>
                              {staff.full_name}
                            </h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <span className={colors.text.secondary}>
                                Staff Number: {staff.staff_uuid}
                              </span>
                              <span className={colors.text.secondary}>
                                Role: {formatRole(staff.role_code)}
                              </span>
                            </div>

                            {staff.current_space && (
                              <div className="flex items-center gap-3 text-sm flex-wrap">
                                <div className="flex items-center gap-1">
                                  <DoorClosed className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={colors.text.secondary}>
                                    {staff.current_space.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Building className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={colors.text.secondary}>
                                    {staff.current_space.type}
                                    {staff.current_space.floor
                                      ? `, Floor ${staff.current_space.floor}`
                                      : ''}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <div className="flex items-center gap-1">
                                <Activity className={`w-4 h-4 ${colors.text.tertiary}`} />
                                <span className={colors.text.secondary}>
                                  Workload: {staff.current_patient_count}/
                                  {staff.max_concurrent_patients}
                                </span>
                              </div>
                              <div className={colors.text.secondary}>
                                Capacity: {staff.workload_percentage}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckCircle2
                              className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full border ${colors.border.primary}`}
                            />
                          )}
                        </div>
                      </div>

                      {!canReceive && (
                        <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {staff.availability_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {summaryData && (
              <div className="mt-4 flex gap-3 text-sm flex-wrap">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  Available: {summaryData.available}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Busy: {summaryData.busy}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  Total: {summaryData.total}
                </span>
                {clientSideSearchTerm && filteredStaff.length !== summaryData.total && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    Filtered: {filteredStaff.length}
                  </span>
                )}
              </div>
            )}

            {errors.assigned_staff_id && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.assigned_staff_id.message}
              </p>
            )}
          </div>

          {selectedStaff && (
            <div
              className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
            >
              <h4 className={`text-sm font-medium mb-3 ${colors.text.secondary}`}>
                Forwarding to:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Staff Member</p>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {selectedStaff.full_name}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusInfo(selectedStaff.presence_status).icon}
                    <span className={`font-medium ${colors.text.primary}`}>
                      {getStatusInfo(selectedStaff.presence_status).label}
                    </span>
                  </div>
                </div>

                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Location</p>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {selectedStaff.current_space?.name || 'No room assigned'}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Workload</p>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {selectedStaff.current_patient_count}/
                    {selectedStaff.max_concurrent_patients} patients
                  </p>
                </div>
              </div>
            </div>
          )}

          {!shouldHideServicesQuestion && (
            <div
              className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
            >
              <label className={`block text-sm font-medium mb-3 ${colors.text.secondary}`}>
                Did you provide any services or items to this patient?{' '}
                <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleServicesChoice(true)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    hasProvidedServices === true
                      ? 'bg-blue-600 text-white border-blue-600'
                      : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
                  }`}
                >
                  Yes, add charges before forwarding
                </button>

                <button
                  type="button"
                  onClick={() => handleServicesChoice(false)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    hasProvidedServices === false
                      ? 'bg-green-600 text-white border-green-600'
                      : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
                  }`}
                >
                  No, just forward patient
                </button>
              </div>

              <p className={`mt-3 text-xs ${colors.text.tertiary}`}>
                If you provided services or dispensed items, we will open charge entry and keep
                the forwarding details for completion after billing.
              </p>

              {hasProvidedServices === true && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  {isFetchingBillableItems ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Preparing billing items...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Billing handoff is ready.</span>
                    </>
                  )}
                </div>
              )}

              {servicesDecisionError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {servicesDecisionError}
                </p>
              )}
            </div>
          )}

          {shouldHideServicesQuestion && (
            <div
              className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
            >
              <p className={`text-sm ${colors.text.secondary}`}>
                Charges were already indicated for this patient. Continue to billing to add
                services/items before forwarding.
              </p>
            </div>
          )}

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