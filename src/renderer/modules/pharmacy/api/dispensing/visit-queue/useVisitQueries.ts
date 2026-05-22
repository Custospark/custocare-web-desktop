/**
 * ============================================================================
 * VISIT REACT QUERY HOOKS
 * ============================================================================
 * 
 * React Query hooks for visit management operations in the healthcare
 * facility management system. These hooks provide type-safe access to
 * visit APIs with proper error handling, caching, and optimistic updates.
 * 
 * @module useVisitQueries
 * @description Provides type-safe, reusable hooks for all visit CRUD
 * operations and custom queries. Component redirects are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type { RootState } from '../../../../../app/store/store';
import { useSelector } from 'react-redux';
import { getActiveFacilityId, getStaffId, getActiveRoleCode } from '../../../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  CancelVisitParams,
  CreateVisitRequest,
  DeleteVisitParams,
  DischargeVisitParams,
  EndClinicalCareParams,
  MyCompletedWorkFilters,
  MyCompletedWorkResponse,
  QueueFilters,
  QueueResponse,
  RegisterVisitParams,
  RestoreVisitParams,
  StartClinicalCareParams,
  UpdateVisitParams,
  UpdateVisitPhaseParams,
  UpdateVisitStatusParams,
  Visit,
  VisitFilters,
  VisitListResponse,
  VisitResponse,
  VisitStatisticsResponse,
  VisitUUID,
  MutationCallbacks,
  UpdateVisitPhaseMutationContext,
  CreateVisitMutationContext,
  AssignStaffToVisitParams,
  AssignStaffToVisitResponse,
  StaffForwardingFilters,
  StaffForwardingResponse,
  ForwardingStaff,
} from './visitTypes';
import {
  VisitPhase,
  VisitStatus,
  PaymentStatus,
  InsuranceVerificationStatus,
  DischargeDisposition,
  ModeOfArrival,
  VisitType,
  StaffPresenceStatus,
  FacilitySpaceType
} from './visitTypes';

export type MyQueueQueryKey = ReturnType<typeof visitKeys.queue>;

export type MyQueueQueryOptions = Omit<
  UseQueryOptions<QueueResponse, AxiosError<ApiErrorResponse>, QueueResponse, MyQueueQueryKey>,
  'queryKey' | 'queryFn'
>;

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all visit queries
 * queryClient.invalidateQueries({ queryKey: visitKeys.all });
 * 
 * // Invalidate specific visit
 * queryClient.invalidateQueries({ queryKey: visitKeys.detail(uuid) });
 */
export const visitKeys = {
  all: ['visits'] as const,
  lists: () => [...visitKeys.all, 'list'] as const,
  list: (filters: VisitFilters) => [...visitKeys.lists(), filters] as const,
  details: () => [...visitKeys.all, 'detail'] as const,
  detail: (uuid: VisitUUID) => [...visitKeys.details(), uuid] as const,
  queue: (filters: QueueFilters) => [...visitKeys.all, 'queue', filters] as const,
  completedWork: (filters: MyCompletedWorkFilters) =>
    [...visitKeys.all, 'my-completed-work', filters] as const,
  byFacility: (facilityId: number, filters: Partial<VisitFilters>) => 
    [...visitKeys.all, 'facility', facilityId, filters] as const,
  byPatient: (patientId: number, filters: Partial<VisitFilters>) => 
    [...visitKeys.all, 'patient', patientId, filters] as const,
  statistics: (facilityId?: number, dateRange?: string) => 
    [...visitKeys.all, 'statistics', facilityId, dateRange] as const,
  longWaiting: (minutesThreshold: number, facilityId?: number) => 
    [...visitKeys.all, 'long-waiting', minutesThreshold, facilityId] as const,
  assignStaff: () => [...visitKeys.all, 'assign-staff'] as const,
  staffForwarding: (filters: StaffForwardingFilters) => 
    [...visitKeys.all, 'staff-forwarding', filters] as const,
  /** Staff forwarding list scoped by explicit facility (e.g. patient portal booking). */
  staffForwardingByFacility: (facilityId: number, filters: StaffForwardingFilters) =>
    [...visitKeys.all, 'staff-forwarding-by-facility', facilityId, filters] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a paginated list of visits with optional filtering.
 * 
 * @param filters - Query parameters for filtering and pagination
 * @param options - React Query options for customizing behavior
 * @returns Query result with visits list and pagination metadata
 * 
 * @example
 * const { data, isLoading, error } = useGetVisits({
 *   facility_id: 1,
 *   status: 'active',
 *   per_page: 20
 * });
 */
export const useGetVisits = (
  filters: VisitFilters = {},
  options?: Omit<UseQueryOptions<VisitListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<VisitListResponse>('/visits', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single visit by UUID with full details.
 * 
 * @param uuid - Visit UUID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete visit details
 * 
 * @example
 * const { data, isLoading } = useGetVisitByUUID('abc-123-def');
 */
export const useGetVisitByUUID = (
  uuid: VisitUUID,
  options?: Omit<UseQueryOptions<VisitResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.detail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<VisitResponse>(`/visits/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Laravel's `boolean` rule accepts true/false, 0/1, "0"/"1" — not the strings
 * "true"/"false". Axios serializes JS booleans in query strings as "true"/"false".
 */
function queueFiltersToQueryParams(filters: QueueFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') {
      params[key] = value ? 1 : 0;
    } else {
      params[key] = value as string | number;
    }
  }
  return params;
}

/**
 * Fetches staff-specific queue visits.
 * 
 * @param filters - Queue filtering parameters
 * @param options - React Query options for customizing behavior
 * @returns Query result with queue data
 * 
 * @example
 * const { data } = useGetMyQueue({ current_phase: 'waiting_provider' });
 */
export const useGetMyQueue = (
  filters: QueueFilters = {},
  options?: Omit<UseQueryOptions<QueueResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useQuery<QueueResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.queue(filters),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('No active facility selected');
      }

      const response = await axiosInstance.get<QueueResponse>('/visits/my-queue', {
        params: queueFiltersToQueryParams(filters),
        headers: {
          'X-Facility-Id': facilityId.toString(),
        },
      });
      return response.data;
    },
    enabled: !!facilityId && !!staffId,
    staleTime: 5000,                      // Data fresh for 5 seconds
    refetchInterval: 5000,               // Refetch every 5 seconds
    refetchIntervalInBackground: true,   // Keep refetching even when tab is inactive
    ...options,
  });
};

function completedWorkFiltersToParams(filters: MyCompletedWorkFilters): Record<string, string | number> {
  return {
    date_preset: filters.date_preset,
    limit: filters.limit ?? 100,
  };
}

/**
 * Completed facility visits (`status = completed`) for the discharge/end date window.
 * `X-Facility-Id` is set on every request (see `axiosConfig` interceptor). Not scoped by workflow or staff.
 */
export const useGetMyCompletedWork = (
  filters: MyCompletedWorkFilters,
  options?: Omit<
    UseQueryOptions<MyCompletedWorkResponse, AxiosError<ApiErrorResponse>, MyCompletedWorkResponse, ReturnType<typeof visitKeys.completedWork>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useQuery({
    queryKey: visitKeys.completedWork(filters),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('No active facility selected');
      }

      const response = await axiosInstance.get<MyCompletedWorkResponse>('/visits/my-completed-work', {
        params: completedWorkFiltersToParams(filters),
      });
      return response.data;
    },
    enabled: !!facilityId && !!staffId,
    staleTime: 60_000,
    ...options,
  });
};

/**
 * Fetches staff available for patient forwarding within the facility.
 * 
 * @param filters - Staff filtering parameters
 * @param options - React Query options for customizing behavior
 * @returns Query result with available staff list
 * 
 * @example
 * const { data } = useGetStaffForForwarding({ 
 *   role_code: 'doctor',
 *   exclude_current_staff: true 
 * });
 */
export const useGetStaffForForwarding = (
  filters: StaffForwardingFilters = {},
  options?: Omit<UseQueryOptions<StaffForwardingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useQuery<StaffForwardingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.staffForwarding(filters),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('No active facility selected');
      }

      const response = await axiosInstance.get<StaffForwardingResponse>('/visits/staff/forwarding', {
        params: filters,
        headers: {
          'X-Facility-Id': facilityId.toString(),
        },
      });
      return response.data;
    },
    enabled: !!facilityId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Same as {@link useGetStaffForForwarding} but uses an explicit facility id for `X-Facility-Id`
 * (patient portal and other flows without an active facility in Redux).
 */
export const useGetStaffForForwardingByFacility = (
  facilityId: number | null | undefined,
  filters: StaffForwardingFilters = {},
  options?: Omit<UseQueryOptions<StaffForwardingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const fid = typeof facilityId === 'number' && facilityId > 0 ? facilityId : 0;

  return useQuery<StaffForwardingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.staffForwardingByFacility(fid, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<StaffForwardingResponse>('/visits/staff/forwarding', {
        params: {
          limit: 100,
          exclude_current_staff: false,
          ...filters,
        },
        headers: {
          'X-Facility-Id': String(fid),
        },
      });
      return response.data;
    },
    enabled: fid > 0,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Fetches all visits for a specific facility.
 * 
 * @param facilityId - Facility ID to filter visits
 * @param filters - Additional filters (status, visit_type, etc.)
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific visits
 * 
 * @example
 * const { data } = useGetVisitsByFacility(5, { status: 'active' });
 */
export const useGetVisitsByFacility = (
  facilityId: number,
  filters: Partial<VisitFilters> = {},
  options?: Omit<UseQueryOptions<VisitListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.byFacility(facilityId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<VisitListResponse>(`/visits/facility/${facilityId}`, {
        params: filters,
      });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Fetches all visits for a specific patient.
 * 
 * @param patientId - Patient ID to filter visits
 * @param filters - Additional filters (status, visit_type, etc.)
 * @param options - React Query options for customizing behavior
 * @returns Query result with patient-specific visits
 * 
 * @example
 * const { data } = useGetVisitsByPatient(123, { status: 'completed' });
 */
export const useGetVisitsByPatient = (
  patientId: number,
  filters: Partial<VisitFilters> = {},
  options?: Omit<UseQueryOptions<VisitListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.byPatient(patientId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<VisitListResponse>(`/visits/patient/${patientId}`, {
        params: filters,
      });
      return response.data;
    },
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Fetches visit statistics for reporting and dashboards.
 * 
 * @param facilityId - Optional facility ID to scope statistics
 * @param dateRange - Optional date range for statistics
 * @param options - React Query options for customizing behavior
 * @returns Query result with visit statistics
 * 
 * @example
 * const { data } = useGetVisitStatistics(1, 'today');
 */
export const useGetVisitStatistics = (
  facilityId?: number,
  dateRange?: string,
  options?: Omit<UseQueryOptions<VisitStatisticsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitStatisticsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.statistics(facilityId, dateRange),
    queryFn: async () => {
      const response = await axiosInstance.get<{ success: boolean; message: string; data: VisitStatisticsResponse }>(
        '/visits/reports/statistics',
        { params: { facility_id: facilityId, date_range: dateRange } }
      );
      return response.data.data;
    },
    ...options,
  });
};

/**
 * Fetches visits with excessive waiting times.
 * 
 * @param minutesThreshold - Minimum waiting time in minutes
 * @param facilityId - Optional facility ID to scope the search
 * @param options - React Query options for customizing behavior
 * @returns Query result with long-waiting visits
 * 
 * @example
 * const { data } = useGetLongWaitingVisits(30, 1);
 */
export const useGetLongWaitingVisits = (
  minutesThreshold: number,
  facilityId?: number,
  options?: Omit<UseQueryOptions<VisitListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<VisitListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: visitKeys.longWaiting(minutesThreshold, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<VisitListResponse>('/visits/reports/long-waiting', {
        params: { minutes_threshold: minutesThreshold, facility_id: facilityId },
      });
      return response.data;
    },
    enabled: !!minutesThreshold,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new visit in the system.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateVisit({
 *   onSuccess: (data) => console.log('Created visit:', data.data.visit_uuid),
 * });
 */
export const useCreateVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useMutation<
    VisitResponse, 
    AxiosError<ApiErrorResponse>, 
    CreateVisitRequest, 
    CreateVisitMutationContext
  >({
    mutationFn: async (data: CreateVisitRequest) => {
      const response = await axiosInstance.post<VisitResponse>('/visits', data);
      return response.data;

    },
    onMutate: async (newVisit) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.lists() });
      await queryClient.cancelQueries({ queryKey: visitKeys.queue({}) });

      const previousVisits = queryClient.getQueryData<VisitListResponse>(visitKeys.lists());

      if (previousVisits) {
        queryClient.setQueryData<VisitListResponse>(visitKeys.lists(), (old) => {
          if (!old) return old;
          
          const optimisticVisit: Visit = {
            id: Date.now(),
            visit_uuid: `temp-${Date.now()}`,
            facility_id: newVisit.facility_id,
            patient_id: newVisit.patient_id,
            visit_type: newVisit.visit_type,
            visit_subtype: newVisit.visit_subtype || null,
            acuity_score: newVisit.acuity_score || 3,
            chief_complaints: newVisit.chief_complaints,
            symptoms_on_arrival: newVisit.symptoms_on_arrival || null,
            patient_reported_history: newVisit.patient_reported_history || null,
            arrived_at: newVisit.arrived_at,
            registered_at: newVisit.registered_at || null,
            waiting_since: null,
            clinical_care_started_at: null,
            clinical_care_ended_at: null,
            scheduled_time: newVisit.scheduled_time || null,
            expected_duration_minutes: newVisit.expected_duration_minutes || null,
            actual_duration_minutes: null,
            mode_of_arrival: newVisit.mode_of_arrival || null,
            accompanying_person: newVisit.accompanying_person || null,
            is_walk_in: newVisit.is_walk_in || false,
            referring_facility_id: newVisit.referring_facility_id || null,
            referring_provider_staff_id: newVisit.referring_provider_staff_id || null,
            external_referral_id: newVisit.external_referral_id || null,
            referral_reason: newVisit.referral_reason || null,
            current_department_id: newVisit.current_department_id || null,
            current_phase: newVisit.current_phase || VisitPhase.REGISTRATION,
            status: newVisit.status || VisitStatus.ACTIVE,
            assigned_staff_id: null,
            assigned_at: null,
            insurance_preauth_id: newVisit.insurance_preauth_id || null,
            insurance_verification_status: newVisit.insurance_verification_status || InsuranceVerificationStatus.NOT_VERIFIED,
            insurance_verified_at: null,
            estimated_total_charges: newVisit.estimated_total_charges || null,
            patient_estimated_responsibility: newVisit.patient_estimated_responsibility || null,
            payment_status: newVisit.payment_status || PaymentStatus.NOT_BILLED,
            vital_signs_summary: null,
            diagnosis_codes: null,
            procedure_codes: null,
            medications_administered: null,
            discharged_at: null,
            discharged_by_staff_id: null,
            discharge_disposition: null,
            discharge_instructions: null,
            discharge_medications: null,
            followup_scheduled_at: null,
            followup_provider_staff_id: null,
            sentinel_event_flagged: false,
            safety_alerts: null,
            requires_interpreter: newVisit.requires_interpreter || false,
            interpreter_language: newVisit.interpreter_language || null,
            isolation_required: newVisit.isolation_required || false,
            isolation_type: newVisit.isolation_type || null,
            cancellation_reason: null,
            cancelled_at: null,
            scheduled_appointment_id: newVisit.scheduled_appointment_id || null,
            metadata: newVisit.metadata || null,
            created_by_staff_id: null,
            updated_by_staff_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
          };

          return {
            ...old,
            data: {
              ...old.data,
              data: [optimisticVisit, ...old.data],
            },
          };
        });
      }

      return { previousVisits };
    },
    onSuccess: (data) => {
      // const successMessage = data.message || 'Visit created successfully!';
      // showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: visitKeys.byFacility(facilityId, {}) });
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create visit.';

      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);
      
      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Updates an existing visit by UUID.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateVisit();
 */
export const useUpdateVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    VisitResponse, 
    AxiosError<ApiErrorResponse>, 
    UpdateVisitParams, 
    UpdateVisitPhaseMutationContext
  >({
    mutationFn: async ({ uuid, data }: UpdateVisitParams) => {
      const response = await axiosInstance.put<VisitResponse>(`/visits/${uuid}`, data);
      return response.data;
    },
    onMutate: async ({ uuid, data }) => {
      await queryClient.cancelQueries({ queryKey: visitKeys.detail(uuid) });
      await queryClient.cancelQueries({ queryKey: visitKeys.lists() });

      const previousVisit = queryClient.getQueryData<VisitResponse>(visitKeys.detail(uuid));

      if (previousVisit) {
        queryClient.setQueryData<VisitResponse>(visitKeys.detail(uuid), (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ...data,
              updated_at: new Date().toISOString(),
            },
          };
        });
      }

      return { previousVisit };
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Visit updated successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>, { uuid }, context) => {
      if (context?.previousVisit) {
        queryClient.setQueryData(visitKeys.detail(uuid), context.previousVisit);
      }

      const apiMessage = error.response?.data?.message || error.message || 'Failed to update visit.';

      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);
      
      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Updates the phase of a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateVisitPhase();
 */
export const useUpdateVisitPhase = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const roleCode = useSelector((state: RootState) => getActiveRoleCode(state));

  return useMutation<
    VisitResponse, 
    AxiosError<ApiErrorResponse>, 
    UpdateVisitPhaseParams, 
    UpdateVisitPhaseMutationContext
  >({
    mutationFn: async ({ uuid, data }: UpdateVisitPhaseParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/phase`, data);
      return response.data;
    },
    onMutate: async ({ uuid, data }) => {
      if (roleCode && data.phase) {
        // Role-based validation logic can be added here
      }

      await queryClient.cancelQueries({ queryKey: visitKeys.detail(uuid) });
      await queryClient.cancelQueries({ queryKey: visitKeys.queue({}) });

      const previousVisit = queryClient.getQueryData<VisitResponse>(visitKeys.detail(uuid));

      if (previousVisit) {
        queryClient.setQueryData<VisitResponse>(visitKeys.detail(uuid), (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              current_phase: data.phase,
              updated_at: new Date().toISOString(),
            },
          };
        });
      }

      return { previousVisit };
    },
    onSuccess: (data) => {
      const successMessage = `Visit phase updated to ${data.data.current_phase}`;
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>, { uuid }, context) => {
      if (context?.previousVisit) {
        queryClient.setQueryData(visitKeys.detail(uuid), context.previousVisit);
      }

      const apiMessage = error.response?.data?.message || error.message || 'Failed to update visit phase.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Updates the status of a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateVisitStatus();
 */
export const useUpdateVisitStatus = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, UpdateVisitStatusParams>({
    mutationFn: async ({ uuid, data }: UpdateVisitStatusParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/status`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = `Visit status updated to ${data.data.status}`;
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update visit status.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Assigns staff to a visit for patient forwarding.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useAssignStaffToVisit();
 */
export const useAssignStaffToVisit = (
  callbacks: MutationCallbacks<AssignStaffToVisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useMutation<AssignStaffToVisitResponse, AxiosError<ApiErrorResponse>, AssignStaffToVisitParams>({
    mutationFn: async ({ data }: AssignStaffToVisitParams) => {
      if (!facilityId) throw new Error('No active facility selected');

      const response = await axiosInstance.post<AssignStaffToVisitResponse>(
        '/visits/assign-staff',
        data,
        {
          headers: {
            'X-Facility-Id': facilityId.toString(),
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Patient forwarded successfully!';
      showToast('success', successMessage, 8000);

      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });

      if (data?.data?.visit_uuid) {
        queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      }

      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to forward patient.';

      let errorDetails = '';
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
      }

      const displayMessage = errorDetails ? `${apiMessage} (${errorDetails})` : apiMessage;
      showToast('error', displayMessage, 8000);

      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Bulk reassign all active visits from current staff to another (shift handover).
 */
export const useBulkReassignStaff = (
  callbacks: MutationCallbacks<{ success: boolean; reassigned_count: number; message: string }, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  return useMutation<{ success: boolean; reassigned_count: number; message: string }, AxiosError<ApiErrorResponse>, { to_staff_id: number }>({
    mutationFn: async ({ to_staff_id }) => {
      if (!facilityId) throw new Error('No active facility selected');

      const response = await axiosInstance.post<{ success: boolean; reassigned_count: number; message: string }>(
        '/visits/bulk-reassign-staff',
        { to_staff_id },
        {
          headers: {
            'X-Facility-Id': facilityId.toString(),
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      showToast('error', error.response?.data?.message || error.message || 'Failed to reassign visits.', 6000);
      callbacks.onError?.(error);
    },
    onSettled: () => {
      callbacks.onSettled?.();
    },
  });
};

/**
 * Discharges a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useDischargeVisit();
 */
export const useDischargeVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, DischargeVisitParams>({
    mutationFn: async ({ uuid, data }: DischargeVisitParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/discharge`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = `Patient discharged with ${data.data.discharge_disposition} disposition`;
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to discharge visit.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Registers a visit (post-arrival processing).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useRegisterVisit();
 */
export const useRegisterVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, RegisterVisitParams>({
    mutationFn: async ({ uuid, data }: RegisterVisitParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/register`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Visit registered successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to register visit.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Starts clinical care for a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useStartClinicalCare();
 */
export const useStartClinicalCare = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, StartClinicalCareParams>({
    mutationFn: async ({ uuid }: StartClinicalCareParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/clinical-care/start`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Clinical care started!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to start clinical care.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Ends clinical care for a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useEndClinicalCare();
 */
export const useEndClinicalCare = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, EndClinicalCareParams>({
    mutationFn: async ({ uuid }: EndClinicalCareParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/clinical-care/end`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Clinical care ended!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to end clinical care.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Cancels a visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useCancelVisit();
 */
export const useCancelVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, CancelVisitParams>({
    mutationFn: async ({ uuid, data }: CancelVisitParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/cancel`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Visit cancelled successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to cancel visit.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Deletes a visit (soft delete).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useDeleteVisit();
 */
export const useDeleteVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, DeleteVisitParams>({
    mutationFn: async ({ uuid }: DeleteVisitParams) => {
      const response = await axiosInstance.delete<VisitResponse>(`/visits/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Visit deleted successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.queue({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete visit.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/**
 * Restores a previously soft-deleted visit.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useRestoreVisit();
 */
export const useRestoreVisit = (
  callbacks: MutationCallbacks<VisitResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<VisitResponse, AxiosError<ApiErrorResponse>, RestoreVisitParams>({
    mutationFn: async ({ uuid }: RestoreVisitParams) => {
      const response = await axiosInstance.post<VisitResponse>(`/visits/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = 'Visit restored successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: visitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: visitKeys.detail(data.data.visit_uuid) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to restore visit.';
      showToast('error', apiMessage, 8000);
      
      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * 
 * @param error - Axios error from failed request
 * @param fallbackMessage - Default message if API message unavailable
 * @returns Human-readable error message
 * 
 * @internal
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
 * 
 * @param errors - Validation errors object from API
 * @returns Formatted error string or empty string if no errors
 * 
 * @internal
 */
export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) {
    return '';
  }

  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

/**
 * Calculates wait time in minutes.
 * 
 * @param waitingSince - ISO string timestamp when waiting started
 * @returns Wait time in minutes or null if invalid
 */
export const calculateWaitTime = (waitingSince: string | null): number | null => {
  if (!waitingSince) return null;
  
  const waitStart = new Date(waitingSince);
  const now = new Date();
  
  if (isNaN(waitStart.getTime())) return null;
  
  return Math.floor((now.getTime() - waitStart.getTime()) / (1000 * 60));
};

/**
 * Determines if a visit is overdue based on acuity score.
 * 
 * @param acuityScore - Visit acuity score (1-5)
 * @param waitingSince - ISO string timestamp when waiting started
 * @returns True if visit is overdue based on acuity-based thresholds
 */
export const isVisitOverdue = (acuityScore: number, waitingSince: string | null): boolean => {
  const waitTime = calculateWaitTime(waitingSince);
  if (waitTime === null) return false;
  
  const maxWaitTimes: Record<number, number> = {
    1: 0,   // Resuscitation - immediate
    2: 15,  // Emergent - 15 minutes
    3: 60,  // Urgent - 1 hour
    4: 120, // Semi-urgent - 2 hours
    5: 240, // Non-urgent - 4 hours
  };
  
  const maxWait = maxWaitTimes[acuityScore] || 240;
  return waitTime > maxWait;
};

/**
 * Gets phase display name for UI.
 * 
 * @param phase - Visit phase enum value
 * @returns Human-readable phase name
 */
export const getPhaseDisplayName = (phase: VisitPhase): string => {
  const phaseMap: Record<VisitPhase, string> = {
    [VisitPhase.REGISTRATION]: 'Registration',
    [VisitPhase.WAITING_TRIAGE]: 'Waiting for Triage',
    [VisitPhase.TRIAGE]: 'Triage',
    [VisitPhase.WAITING_PROVIDER]: 'Waiting for Provider',
    [VisitPhase.CONSULTATION]: 'Consultation',
    [VisitPhase.DIAGNOSTIC_TESTS]: 'Diagnostic Tests',
    [VisitPhase.AWAITING_RESULTS]: 'Awaiting Results',
    [VisitPhase.TREATMENT]: 'Treatment',
    [VisitPhase.PROCEDURES]: 'Procedures',
    [VisitPhase.OBSERVATION]: 'Observation',
    [VisitPhase.ADMISSION_PENDING]: 'Admission Pending',
    [VisitPhase.BILLING]: 'Billing',
    [VisitPhase.DISCHARGE_PENDING]: 'Discharge Pending',
    [VisitPhase.DISCHARGED]: 'Discharged',
    [VisitPhase.LEFT_WITHOUT_BEING_SEEN]: 'Left Without Being Seen',
    [VisitPhase.LEFT_AGAINST_MEDICAL_ADVICE]: 'Left Against Medical Advice',
    [VisitPhase.TRANSFERRED]: 'Transferred',
    [VisitPhase.ADMITTED]: 'Admitted',
    [VisitPhase.EXPIRED]: 'Expired',
  };
  
  return phaseMap[phase] || phase.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets status color for UI display.
 * 
 * @param status - Visit status enum value
 * @returns Tailwind CSS classes for status badge
 */
export const getStatusColor = (status: VisitStatus): string => {
  const colorMap: Record<VisitStatus, string> = {
    [VisitStatus.ACTIVE]: 'bg-blue-100 text-blue-800',
    [VisitStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [VisitStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [VisitStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [VisitStatus.NO_SHOW]: 'bg-gray-100 text-gray-800',
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Gets type display name for UI.
 * 
 * @param type - Visit type enum value
 * @returns Human-readable type name
 */
export const getTypeDisplayName = (type: VisitType): string => {
  const typeMap: Record<VisitType, string> = {
    [VisitType.OUTPATIENT]: 'Outpatient',
    [VisitType.INPATIENT]: 'Inpatient',
    [VisitType.EMERGENCY]: 'Emergency',
    [VisitType.URGENT_CARE]: 'Urgent Care',
    [VisitType.VIRTUAL_TELEHEALTH]: 'Virtual Telehealth',
    [VisitType.HOME_HEALTH]: 'Home Health',
    [VisitType.OBSERVATION]: 'Observation',
    [VisitType.DAY_SURGERY]: 'Day Surgery',
    [VisitType.CONSULTATION]: 'Consultation',
    [VisitType.FOLLOWUP]: 'Follow-up',
    [VisitType.PREVENTIVE_WELLNESS]: 'Preventive Wellness',
  };
  
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets mode of arrival display name for UI.
 * 
 * @param mode - Mode of arrival enum value or null
 * @returns Human-readable arrival mode
 */
export const getModeOfArrivalDisplayName = (mode: ModeOfArrival | null): string => {
  if (!mode) return 'Unknown';
  
  const modeMap: Record<ModeOfArrival, string> = {
    [ModeOfArrival.WALK_IN]: 'Walk-in',
    [ModeOfArrival.AMBULANCE]: 'Ambulance',
    [ModeOfArrival.PRIVATE_VEHICLE]: 'Private Vehicle',
    [ModeOfArrival.POLICE_TRANSPORT]: 'Police Transport',
    [ModeOfArrival.AIR_AMBULANCE]: 'Air Ambulance',
    [ModeOfArrival.WHEELCHAIR_TRANSPORT]: 'Wheelchair Transport',
    [ModeOfArrival.TRANSFER_FROM_FACILITY]: 'Transfer from Facility',
  };
  
  return modeMap[mode] || mode.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets discharge disposition display name for UI.
 * 
 * @param disposition - Discharge disposition enum value or null
 * @returns Human-readable discharge disposition
 */
export const getDischargeDispositionDisplayName = (disposition: DischargeDisposition | null): string => {
  if (!disposition) return 'Not Discharged';
  
  const dispositionMap: Record<DischargeDisposition, string> = {
    [DischargeDisposition.HOME]: 'Home',
    [DischargeDisposition.ADMITTED_TO_HOSPITAL]: 'Admitted to Hospital',
    [DischargeDisposition.TRANSFERRED_TO_FACILITY]: 'Transferred to Facility',
    [DischargeDisposition.LEFT_AMA]: 'Left Against Medical Advice',
    [DischargeDisposition.LEFT_WITHOUT_SEEN]: 'Left Without Being Seen',
    [DischargeDisposition.EXPIRED]: 'Expired',
    [DischargeDisposition.HOSPICE]: 'Hospice',
    [DischargeDisposition.SKILLED_NURSING_FACILITY]: 'Skilled Nursing Facility',
    [DischargeDisposition.REHABILITATION_FACILITY]: 'Rehabilitation Facility',
    [DischargeDisposition.PSYCHIATRIC_FACILITY]: 'Psychiatric Facility',
    [DischargeDisposition.LAW_ENFORCEMENT_CUSTODY]: 'Law Enforcement Custody',
  };
  
  return dispositionMap[disposition] || disposition.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets presence status display name for UI.
 * 
 * @param status - Staff presence status enum value
 * @returns Human-readable presence status
 */
export const getPresenceStatusDisplayName = (status: StaffPresenceStatus): string => {
  const statusMap: Record<StaffPresenceStatus, string> = {
    [StaffPresenceStatus.OFF_DUTY]: 'Off Duty',
    [StaffPresenceStatus.ON_DUTY]: 'On Duty',
    [StaffPresenceStatus.ON_BREAK]: 'On Break',
    [StaffPresenceStatus.BUSY]: 'Busy',
    [StaffPresenceStatus.UNAVAILABLE]: 'Unavailable',
  };
  
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets space type display name for UI.
 * 
 * @param type - Facility space type enum value
 * @returns Human-readable space type
 */
export const getSpaceTypeDisplayName = (type: FacilitySpaceType): string => {
  const typeMap: Record<FacilitySpaceType, string> = {
    [FacilitySpaceType.CONSULTATION]: 'Consultation',
    [FacilitySpaceType.TRIAGE]: 'Triage',
    [FacilitySpaceType.LAB]: 'Lab',
    [FacilitySpaceType.THEATRE]: 'Theatre',
    [FacilitySpaceType.WARD]: 'Ward',
    [FacilitySpaceType.PHARMACY]: 'Pharmacy',
  };
  
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Gets availability color based on staff status.
 * 
 * @param staff - Forwarding staff object
 * @returns Tailwind CSS classes for availability badge
 */
export const getAvailabilityColor = (staff: ForwardingStaff): string => {
  if (!staff.is_available) return 'bg-red-100 text-red-800';
  if (staff.presence_status === StaffPresenceStatus.BUSY) return 'bg-yellow-100 text-yellow-800';
  if (staff.workload_percentage > 80) return 'bg-orange-100 text-orange-800';
  return 'bg-green-100 text-green-800';
};

/**
 * Gets availability badge text.
 * 
 * @param staff - Forwarding staff object
 * @returns Text for availability badge
 */
export const getAvailabilityBadge = (staff: ForwardingStaff): string => {
  if (!staff.is_available) return 'Unavailable';
  if (staff.presence_status === StaffPresenceStatus.BUSY) return 'Busy';
  if (staff.workload_percentage > 80) return 'High Workload';
  return 'Available';
};

/**
 * Filters staff list by various criteria.
 * 
 * @param staff - Array of forwarding staff
 * @param filters - Filter criteria
 * @returns Filtered staff array
 */
export const filterStaffList = (
  staff: ForwardingStaff[],
  filters: StaffForwardingFilters
): ForwardingStaff[] => {
  return staff.filter(staffMember => {
    if (filters.role_code && staffMember.role_code !== filters.role_code) {
      return false;
    }
    
    if (filters.department_id && staffMember.department_ids) {
      if (!staffMember.department_ids.includes(filters.department_id)) {
        return false;
      }
    }
    
    if (filters.presence_status && staffMember.presence_status !== filters.presence_status) {
      return false;
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        staffMember.first_name.toLowerCase().includes(searchTerm) ||
        staffMember.last_name.toLowerCase().includes(searchTerm) ||
        staffMember.full_name.toLowerCase().includes(searchTerm) ||
        staffMember.employee_id.toLowerCase().includes(searchTerm) ||
        staffMember.professional_title?.toLowerCase().includes(searchTerm) ||
        false;
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Main export object containing all visit-related hooks and utilities.
 */
const visitQueries = {
  // Query keys
  visitKeys,
  
  // Query hooks
  useGetVisits,
  useGetVisitByUUID,
  useGetMyQueue,
  useGetVisitsByFacility,
  useGetVisitsByPatient,
  useGetVisitStatistics,
  useGetLongWaitingVisits,
  useGetStaffForForwarding,
  
  // Mutation hooks
  useCreateVisit,
  useUpdateVisit,
  useUpdateVisitPhase,
  useUpdateVisitStatus,
  useAssignStaffToVisit,
  useBulkReassignStaff,
  useDischargeVisit,
  useRegisterVisit,
  useStartClinicalCare,
  useEndClinicalCare,
  useCancelVisit,
  useDeleteVisit,
  useRestoreVisit,
  
  // Utilities
  extractErrorMessage,
  formatValidationErrors,
  calculateWaitTime,
  isVisitOverdue,
  getPhaseDisplayName,
  getStatusColor,
  getTypeDisplayName,
  getModeOfArrivalDisplayName,
  getDischargeDispositionDisplayName,
  getPresenceStatusDisplayName,
  getSpaceTypeDisplayName,
  getAvailabilityColor,
  getAvailabilityBadge,
  filterStaffList,
};

export default visitQueries;