/**
 * ============================================================================
 * STAFF PRESENCE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for staff presence
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useStaffPresenceQueries
 * @description Provides type-safe, reusable hooks for all staff presence
 * operations with automatic facility ID injection from context.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 * @requires ../../../../../app/store/contextSelectors
 */

import { useMutation, useQuery, type UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import {
  getActiveFacilityId,
  getStaffId,
  hasCompleteStaffContext,
  isInStaffMode,
} from '../../../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  EligibleForForwardingQuery,
  EligibleForForwardingResponse,
  MutationCallbacks,
  MyPresenceResponse,
  SetMyPresenceResponse,
  SetPresenceRequest,
  UpdatePresenceRequest,
  StaffPresence,
  FacilityId,
  StaffId,
  PresenceId,
} from './StaffPresenceTypes';
import {
  UpdatedBy,
  StaffPresenceStatus,
} from './StaffPresenceTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 */
export const staffPresenceKeys = {
  all: ['staff-presence'] as const,
  lists: () => [...staffPresenceKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...staffPresenceKeys.lists(), filters] as const,
  details: () => [...staffPresenceKeys.all, 'detail'] as const,
  detail: (id: PresenceId) => [...staffPresenceKeys.details(), id] as const,
  myPresence: (facilityId?: FacilityId, staffId?: StaffId) => [
    ...staffPresenceKeys.all, 
    'my-presence', 
    facilityId, 
    staffId
  ] as const,
  eligibleForForwarding: (facilityId: FacilityId) => [
    ...staffPresenceKeys.all, 
    'eligible-for-forwarding', 
    facilityId
  ] as const,
  staffHistory: (staffId: StaffId, facilityId?: FacilityId) => [
    ...staffPresenceKeys.all, 
    'staff-history', 
    staffId, 
    facilityId
  ] as const,
  facilityPresence: (facilityId: FacilityId) => [
    ...staffPresenceKeys.all, 
    'facility', 
    facilityId
  ] as const,
  activePresence: () => [...staffPresenceKeys.all, 'active'] as const,
  presenceStats: (facilityId: FacilityId) => [
    ...staffPresenceKeys.all, 
    'stats', 
    facilityId
  ] as const,
};

/* -------------------------------------------------------------------------- */
/*                              CUSTOM HOOKS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Custom hook to get active facility ID with validation
 * Throws error if not in staff mode or no facility selected
 */
const useActiveFacilityId = (): FacilityId => {
  const isStaff = useAppSelector(isInStaffMode);
  const facilityId = useAppSelector(getActiveFacilityId);
  
  if (!isStaff) {
    throw new Error('User is not in staff mode. Staff presence features require staff capability.');
  }
  
  if (!facilityId) {
    throw new Error('No active facility selected. Please select a facility to use presence features.');
  }
  
  return facilityId;
};

/**
 * Custom hook to get staff ID with validation
 */
const useCurrentStaffId = (): StaffId => {
  const staffId = useAppSelector(getStaffId);
  
  if (!staffId) {
    throw new Error('Staff ID not found. User must have staff capability.');
  }
  
  return staffId;
};

/**
 * Hook to validate if user has complete staff context for presence operations
 */
export const useHasStaffPresenceContext = (): boolean => {
  return useAppSelector(hasCompleteStaffContext);
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the current user's active presence in the active facility.
 * Automatically uses the active facility ID and staff ID from context.
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with current presence or null
 */
export const useGetMyPresence = (
  options?: Omit<UseQueryOptions<MyPresenceResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const facilityId = useActiveFacilityId();
  const staffId = useCurrentStaffId();

  return useQuery<MyPresenceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffPresenceKeys.myPresence(facilityId, staffId),
    queryFn: async () => {
      const response = await axiosInstance.get<MyPresenceResponse>('/staff/presence/facility', {
        params: { 
          facility_id: facilityId,
          staff_id: staffId
        },
      });
      return response.data;
    },
    enabled: !!facilityId && !!staffId,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no presence found) or 403 (no permission)
      if (error.response?.status === 404 || error.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 50, // 50 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * Fetches all active presence records for the active facility.
 * Useful for real-time presence dashboards and monitoring.
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with active presence records
 */
export const useGetFacilityPresence = (
  options?: Omit<UseQueryOptions<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffPresenceKeys.facilityPresence(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<EligibleForForwardingResponse>(
        '/staff/presence/facility/all',
        { params: { facility_id: facilityId } }
      );
      return response.data;
    },
    enabled: !!facilityId,
    retry: 2,
    staleTime: 1000 * 15, // 15 seconds (presence changes frequently)
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    ...options,
  });
};

/**
 * Fetches presence history for a specific staff member.
 * Can be used for reporting, attendance tracking, or auditing.
 * 
 * @param staffId - Staff ID to fetch history for (defaults to current staff)
 * @param options - React Query options for customizing behavior
 * @returns Query result with historical presence records
 */
export const useGetStaffPresenceHistory = (
  staffId?: StaffId,
  options?: Omit<UseQueryOptions<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const currentStaffId = useCurrentStaffId();
  const targetStaffId = staffId || currentStaffId;
  const facilityId = useActiveFacilityId();

  return useQuery<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffPresenceKeys.staffHistory(targetStaffId, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<EligibleForForwardingResponse>(
        `/staff/presence/history/${targetStaffId}`,
        { params: { facility_id: facilityId } }
      );
      return response.data;
    },
    enabled: !!targetStaffId && !!facilityId,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes (history doesn't change often)
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
};

/**
 * Fetches staff members eligible for forwarding in the active facility.
 * Based on backend's scopeEligibleForForwarding (status in ['on_duty', 'busy']).
 * 
 * @param filters - Additional filters (search term)
 * @param options - React Query options for customizing behavior
 * @returns Query result with eligible staff presence records
 */
export const useGetEligibleForForwarding = (
  filters: Omit<EligibleForForwardingQuery, 'facility_id'> = {},
  options?: Omit<UseQueryOptions<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<EligibleForForwardingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffPresenceKeys.eligibleForForwarding(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<EligibleForForwardingResponse>(
        '/facilities/staff/eligible-for-forwarding',
        {
          params: { facility_id: facilityId, ...filters },
        }
      );
      return response.data;
    },
    enabled: !!facilityId,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403
      if (error.response?.status === 404 || error.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60, // 1 minute (eligibility can change frequently)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Gets the display label for a presence status.
 */
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    [StaffPresenceStatus.OFF_DUTY]: 'Off Duty',
    [StaffPresenceStatus.ON_DUTY]: 'On Duty',
    [StaffPresenceStatus.ON_BREAK]: 'On Break',
    [StaffPresenceStatus.BUSY]: 'Busy',
    [StaffPresenceStatus.UNAVAILABLE]: 'Unavailable',
  };
  return labels[status] || status;
};

/**
 * Determines if a presence status is eligible for forwarding.
 */
const isEligibleForForwardingStatus = (status: StaffPresenceStatus | string): boolean => {
  return status === StaffPresenceStatus.ON_DUTY || status === StaffPresenceStatus.BUSY;
};

/**
 * Sets the current user's presence status in the active facility.
 * Used by staff members to update their own status.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useSetMyPresence = (
  callbacks: MutationCallbacks<SetMyPresenceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const facilityId = useActiveFacilityId();
  const staffId = useCurrentStaffId();
  const queryClient = useQueryClient();

  return useMutation<SetMyPresenceResponse, AxiosError<ApiErrorResponse>, Omit<SetPresenceRequest, 'facility_id'>>({
    mutationFn: async (data) => {
      const payload: SetPresenceRequest = {
        ...data,
        facility_id: facilityId,
        updated_by: UpdatedBy.STAFF,
      };
      
      const response = await axiosInstance.post<SetMyPresenceResponse>('/staff/presence/facility', payload);
      return response.data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: staffPresenceKeys.myPresence(facilityId, staffId) });
      await queryClient.cancelQueries({ queryKey: staffPresenceKeys.eligibleForForwarding(facilityId) });

      // Snapshot the previous value
      const previousPresence = queryClient.getQueryData<MyPresenceResponse>(
        staffPresenceKeys.myPresence(facilityId, staffId)
      );

      // Create optimistic update
      const optimisticData: MyPresenceResponse = {
        success: true,
        message: 'Updating presence...',
        data: {
          id: previousPresence?.data?.id || Date.now(), // Temporary ID for optimistic update
          staff_id: staffId,
          facility_id: facilityId,
          status: variables.status,
          status_label: getStatusLabel(variables.status),
          note: variables.note || null,
          started_at: previousPresence?.data?.started_at || new Date().toISOString(),
          ended_at: null,
          updated_by: UpdatedBy.STAFF,
          updated_by_user_id: null,
          created_at: previousPresence?.data?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          is_eligible_for_forwarding: isEligibleForForwardingStatus(variables.status),
        },
      };

      // Optimistically update the cache
      queryClient.setQueryData(staffPresenceKeys.myPresence(facilityId, staffId), optimisticData);

      return { previousPresence };
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Presence updated successfully!';
      showToast('success', successMessage, 5000);
      
      // Update cache with real API data
      queryClient.setQueryData(staffPresenceKeys.myPresence(facilityId, staffId), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: staffPresenceKeys.eligibleForForwarding(facilityId) });
      queryClient.invalidateQueries({ queryKey: staffPresenceKeys.facilityPresence(facilityId) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {

      const apiMessage = error.response?.data?.message || error.message || 'Failed to update presence.';

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
      // Always refetch to ensure we have latest data
      queryClient.invalidateQueries({ queryKey: staffPresenceKeys.myPresence(facilityId, staffId) });
    },
  });
};

/**
 * Ends the current presence session.
 * Sets ended_at to current timestamp and status to 'off_duty'.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useEndMyPresence = (
  callbacks: MutationCallbacks<SetMyPresenceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const facilityId = useActiveFacilityId();
  const staffId = useCurrentStaffId();
  const queryClient = useQueryClient();

  return useMutation<SetMyPresenceResponse, AxiosError<ApiErrorResponse>, { note?: string }>({
    mutationFn: async ({ note } = {}) => {
      const response = await axiosInstance.post<SetMyPresenceResponse>('/staff/presence/end', {
        facility_id: facilityId,
        staff_id: staffId,
        note,
        updated_by: UpdatedBy.STAFF,
      });
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: staffPresenceKeys.myPresence(facilityId, staffId) });
      await queryClient.cancelQueries({ queryKey: staffPresenceKeys.eligibleForForwarding(facilityId) });

      const previousPresence = queryClient.getQueryData<MyPresenceResponse>(
        staffPresenceKeys.myPresence(facilityId, staffId)
      );

      if (previousPresence?.data) {
        const optimisticData: MyPresenceResponse = {
          success: true,
          message: 'Ending presence session...',
          data: {
            ...previousPresence.data,
            status: StaffPresenceStatus.OFF_DUTY,
            status_label: getStatusLabel(StaffPresenceStatus.OFF_DUTY),
            ended_at: new Date().toISOString(),
            note: variables?.note || previousPresence.data.note,
            updated_at: new Date().toISOString(),
            is_active: false,
            is_eligible_for_forwarding: false,
          },
        };

        queryClient.setQueryData(staffPresenceKeys.myPresence(facilityId, staffId), optimisticData);
      }

      return { previousPresence };
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Presence session ended successfully!';
      showToast('success', successMessage, 5000);
      
      // Update cache with real data
      queryClient.setQueryData(staffPresenceKeys.myPresence(facilityId, staffId), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: staffPresenceKeys.eligibleForForwarding(facilityId) });
      queryClient.invalidateQueries({ queryKey: staffPresenceKeys.facilityPresence(facilityId) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {

      const apiMessage = error.response?.data?.message || error.message || 'Failed to end presence session.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates any staff member's presence (admin/system use).
 * Requires appropriate permissions on backend.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useUpdateStaffPresence = (
  callbacks: MutationCallbacks<SetMyPresenceResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<SetMyPresenceResponse, AxiosError<ApiErrorResponse>, UpdatePresenceRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.put<SetMyPresenceResponse>('/staff/presence/admin', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Staff presence updated successfully!';
      showToast('success', successMessage, 5000);
      
      // Invalidate queries for the affected facility and staff
      const facilityId = data.data?.facility_id;
      const staffId = data.data?.staff_id;
      
      if (facilityId) {
        queryClient.invalidateQueries({ queryKey: staffPresenceKeys.eligibleForForwarding(facilityId) });
        queryClient.invalidateQueries({ queryKey: staffPresenceKeys.facilityPresence(facilityId) });
        
        if (staffId) {
          queryClient.invalidateQueries({ queryKey: staffPresenceKeys.staffHistory(staffId, facilityId) });
          queryClient.invalidateQueries({ queryKey: staffPresenceKeys.myPresence(facilityId, staffId) });
        }
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update staff presence.';

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
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * Prioritizes API message, falls back to generic error message.
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
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
 * Determines if a presence record is eligible for forwarding.
 * Based on backend's scopeEligibleForForwarding logic.
 */
export const isEligibleForForwarding = (presence: StaffPresence | null): boolean => {
  if (!presence) return false;
  return isEligibleForForwardingStatus(presence.status);
};

/**
 * Gets the color for a presence status (for UI indicators).
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    [StaffPresenceStatus.OFF_DUTY]: 'gray',
    [StaffPresenceStatus.ON_DUTY]: 'green',
    [StaffPresenceStatus.ON_BREAK]: 'orange',
    [StaffPresenceStatus.BUSY]: 'red',
    [StaffPresenceStatus.UNAVAILABLE]: 'purple',
  };
  return colors[status] || 'gray';
};

/**
 * Gets the badge variant for a presence status (for UI components).
 */
export const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
    [StaffPresenceStatus.OFF_DUTY]: 'default',
    [StaffPresenceStatus.ON_DUTY]: 'success',
    [StaffPresenceStatus.ON_BREAK]: 'warning',
    [StaffPresenceStatus.BUSY]: 'destructive',
    [StaffPresenceStatus.UNAVAILABLE]: 'secondary',
  };
  return variants[status] || 'default';
};

/**
 * Calculates the duration of a presence session in minutes.
 * Returns null if the session is still active.
 */
export const calculatePresenceDuration = (presence: StaffPresence): number | null => {
  if (!presence.started_at) return null;
  
  const startTime = new Date(presence.started_at);
  const endTime = presence.ended_at ? new Date(presence.ended_at) : new Date();
  
  const durationMs = endTime.getTime() - startTime.getTime();
  return Math.floor(durationMs / (1000 * 60)); // Convert to minutes
};

/**
 * Formats a presence duration for display.
 */
export const formatPresenceDuration = (minutes: number | null): string => {
  if (minutes === null) return 'Ongoing';
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Checks if a presence session is currently active.
 */
export const isPresenceActive = (presence: StaffPresence | null | undefined): boolean => {
  return !!presence && !presence.ended_at;
};

/* -------------------------------------------------------------------------- */
/*                         PRESENCE STATE MANAGEMENT                          */
/* -------------------------------------------------------------------------- */

/**
 * Hook to manage staff presence state and operations.
 * Provides a simplified interface for common presence operations.
 */
export const useStaffPresence = () => {
  const facilityId = useActiveFacilityId();
  const staffId = useCurrentStaffId();
  
  const {
    data: presenceData,
    isLoading,
    error,
    refetch,
  } = useGetMyPresence();
  
  const setPresenceMutation = useSetMyPresence();
  const endPresenceMutation = useEndMyPresence();
  
  const currentPresence = presenceData?.data || null;
  
  const setStatus = (status: StaffPresenceStatus, note?: string) => {
    return setPresenceMutation.mutateAsync({ status, note });
  };
  
  const setOnDuty = (note?: string) => setStatus(StaffPresenceStatus.ON_DUTY, note);
  const setOnBreak = (note?: string) => setStatus(StaffPresenceStatus.ON_BREAK, note);
  const setBusy = (note?: string) => setStatus(StaffPresenceStatus.BUSY, note);
  const setUnavailable = (note?: string) => setStatus(StaffPresenceStatus.UNAVAILABLE, note);
  const endPresence = (note?: string) => endPresenceMutation.mutateAsync({ note });
  
  const isOnDuty = currentPresence?.status === StaffPresenceStatus.ON_DUTY;
  const isOnBreak = currentPresence?.status === StaffPresenceStatus.ON_BREAK;
  const isBusy = currentPresence?.status === StaffPresenceStatus.BUSY;
  const isUnavailable = currentPresence?.status === StaffPresenceStatus.UNAVAILABLE;
  const isOffDuty = currentPresence?.status === StaffPresenceStatus.OFF_DUTY || !currentPresence;
  const isActive = isPresenceActive(currentPresence);
  const canReceiveForwarding = isEligibleForForwarding(currentPresence);
  
  const durationMinutes = currentPresence ? calculatePresenceDuration(currentPresence) : null;
  const formattedDuration = formatPresenceDuration(durationMinutes);
  
  return {
    // State
    currentPresence,
    isLoading: isLoading || setPresenceMutation.isPending || endPresenceMutation.isPending,
    error: error || setPresenceMutation.error || endPresenceMutation.error,
    
    // Status flags
    isOnDuty,
    isOnBreak,
    isBusy,
    isUnavailable,
    isOffDuty,
    isActive,
    canReceiveForwarding,
    
    // Duration
    durationMinutes,
    formattedDuration,
    
    // Actions
    setOnDuty,
    setOnBreak,
    setBusy,
    setUnavailable,
    endPresence,
    setStatus,
    refetch,
    
    // Mutations (for advanced use)
    setPresenceMutation,
    endPresenceMutation,
    
    // Context
    facilityId,
    staffId,
  };
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Context hooks
  useHasStaffPresenceContext,
  
  // Query hooks
  useGetMyPresence,
  useGetEligibleForForwarding,
  useGetFacilityPresence,
  useGetStaffPresenceHistory,
  
  // Mutation hooks
  useSetMyPresence,
  useEndMyPresence,
  useUpdateStaffPresence,
  
  // Combined hook
  useStaffPresence,
  
  // Utilities
  staffPresenceKeys,
  extractErrorMessage,
  formatValidationErrors,
  isEligibleForForwarding,
  isEligibleForForwardingStatus,
  getStatusLabel,
  getStatusColor,
  getStatusBadgeVariant,
  calculatePresenceDuration,
  formatPresenceDuration,
  isPresenceActive,
};