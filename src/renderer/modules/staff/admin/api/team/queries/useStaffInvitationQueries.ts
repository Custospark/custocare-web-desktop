/**
 * ============================================================================
 * STAFF INVITATION REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for staff invitation
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useStaffInvitationQueries
 * @description Provides type-safe, reusable hooks for all staff invitation CRUD
 * operations, acceptance/decline workflows, and batch operations. Component redirects
 * are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

/**
 * ============================================================================
 * STAFF INVITATION REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for staff invitation
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module useStaffInvitationQueries
 * @description Provides type-safe, reusable hooks for all staff invitation CRUD
 * operations, acceptance/decline workflows, and batch operations. Component redirects
 * are handled externally.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CreateStaffInvitationRequest,
  StaffInvitationFilters,
  StaffInvitation,
  InvitationId,
  InvitationUUID,
  GetStaffInvitationsResponse,
  StaffInvitationResponse,
  DeleteStaffInvitationResponse,
  AcceptInvitationResponse,
  DeclineInvitationResponse,
  ResendInvitationResponse,
  CancelInvitationResponse,
  GetMyInvitationsResponse,
  GetMyPendingInvitationsResponse,
  BatchResendInvitationsRequest,
  BatchCancelInvitationsRequest,
  BatchResendInvitationsResponse,
  BatchCancelInvitationsResponse,
  ProcessExpiredInvitationsResponse,
  MutationCallbacks,
  UpdateStaffInvitationParams,
  DeleteStaffInvitationParams,
  AcceptInvitationParams,
  DeclineInvitationParams,
  ResendInvitationParams,
  CancelInvitationParams,
} from '../types/staffInvitationTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 * 
 * @example
 * // Invalidate all staff invitation queries
 * queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
 * 
 * // Invalidate specific invitation
 * queryClient.invalidateQueries({ queryKey: staffInvitationKeys.detail(id) });
 */
export const staffInvitationKeys = {
  all: ['staff-invitations'] as const,
  lists: () => [...staffInvitationKeys.all, 'list'] as const,
  list: (filters: StaffInvitationFilters) => [...staffInvitationKeys.lists(), filters] as const,
  details: () => [...staffInvitationKeys.all, 'detail'] as const,
  detail: (id: InvitationId) => [...staffInvitationKeys.details(), id] as const,
  byUuid: (uuid: InvitationUUID) => [...staffInvitationKeys.all, 'uuid', uuid] as const,
  byStaff: (staffId: number) => [...staffInvitationKeys.all, 'staff', staffId] as const,
  byFacility: (facilityId: number) => [...staffInvitationKeys.all, 'facility', facilityId] as const,
  myInvitations: () => [...staffInvitationKeys.all, 'my-invitations'] as const,
  myPending: () => [...staffInvitationKeys.all, 'my-pending'] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a paginated list of staff invitations with optional filtering.
 * 
 * @param filters - Query parameters for filtering and pagination
 * @param options - React Query options for customizing behavior
 * @returns Query result with invitations list and pagination metadata
 * 
 * @example
 * const { data, isLoading, error } = useGetStaffInvitations({
 *   status: 'pending',
 *   facility_id: 1,
 *   per_page: 20
 * });
 */
export const useGetStaffInvitations = (
  filters: StaffInvitationFilters = {},
  options?: Omit<UseQueryOptions<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffInvitationsResponse>('/staff-invitations', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single staff invitation by ID with full details.
 * Automatically loads relationships (staff, facility, department, role, modules).
 * 
 * @param id - Invitation ID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete invitation details
 * 
 * @example
 * const { data, isLoading } = useGetStaffInvitationById(123);
 */
export const useGetStaffInvitationById = (
  id: InvitationId,
  options?: Omit<UseQueryOptions<StaffInvitation, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<StaffInvitation, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<StaffInvitationResponse>(`/staff-invitations/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Only run query if ID is provided
    ...options,
  });
};

/**
 * Fetches a staff invitation by UUID (public endpoint).
 * Used for invitation links that don't require authentication.
 * 
 * @param uuid - Invitation UUID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with invitation details
 * 
 * @example
 * const { data } = useGetStaffInvitationByUuid('abc-123-def-456');
 */
export const useGetStaffInvitationByUuid = (
  uuid: InvitationUUID,
  options?: Omit<UseQueryOptions<StaffInvitation, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<StaffInvitation, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.byUuid(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<StaffInvitationResponse>(`/staff-invitations/by-uuid/${uuid}`);
      return response.data.data;
    },
    enabled: !!uuid, // Only run query if UUID is provided
    ...options,
  });
};

/**
 * Fetches all invitations for current authenticated staff member.
 * Shows both pending and responded invitations.
 * 
 * @param filters - Additional filters (status, facility_id, department_id)
 * @param options - React Query options for customizing behavior
 * @returns Query result with user's invitations
 * 
 * @example
 * const { data } = useGetMyInvitations({ status: 'pending' });
 */
export const useGetMyInvitations = (
  filters: Pick<StaffInvitationFilters, 'status' | 'facility_id' | 'department_id'> = {},
  options?: Omit<UseQueryOptions<GetMyInvitationsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetMyInvitationsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.myInvitations(),
    queryFn: async () => {
      const response = await axiosInstance.get<GetMyInvitationsResponse>('/staff-invitations/my/invitations', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches pending invitations for current authenticated staff member.
 * Convenient shortcut for getting invitations requiring action.
 * 
 * @param options - React Query options for customizing behavior
 * @returns Query result with user's pending invitations
 * 
 * @example
 * const { data, isLoading } = useGetMyPendingInvitations();
 */
export const useGetMyPendingInvitations = (
  options?: Omit<UseQueryOptions<GetMyPendingInvitationsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetMyPendingInvitationsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.myPending(),
    queryFn: async () => {
      const response = await axiosInstance.get<GetMyPendingInvitationsResponse>('/staff-invitations/my/pending-invitations');
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches all invitations for a specific staff member (admin view).
 * 
 * @param staffId - Staff ID to filter invitations
 * @param filters - Additional filters
 * @param options - React Query options for customizing behavior
 * @returns Query result with staff-specific invitations
 * 
 * @example
 * const { data } = useGetInvitationsByStaff(456, { status: 'pending' });
 */
export const useGetInvitationsByStaff = (
  staffId: number,
  filters: Omit<StaffInvitationFilters, 'staff_id'> = {},
  options?: Omit<UseQueryOptions<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.byStaff(staffId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffInvitationsResponse>('/staff-invitations', {
        params: { ...filters, staff_id: staffId },
      });
      return response.data;
    },
    enabled: !!staffId, // Only run query if staffId is provided
    ...options,
  });
};

/**
 * Fetches all invitations for a specific facility.
 * 
 * @param facilityId - Facility ID to filter invitations
 * @param filters - Additional filters
 * @param options - React Query options for customizing behavior
 * @returns Query result with facility-specific invitations
 * 
 * @example
 * const { data } = useGetInvitationsByFacility(5);
 */
export const useGetInvitationsByFacility = (
  facilityId: number,
  filters: Omit<StaffInvitationFilters, 'facility_id'> = {},
  options?: Omit<UseQueryOptions<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetStaffInvitationsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: staffInvitationKeys.byFacility(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetStaffInvitationsResponse>('/staff-invitations', {
        params: { ...filters, facility_id: facilityId },
      });
      return response.data;
    },
    enabled: !!facilityId, // Only run query if facilityId is provided
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new staff invitation and sends it to the staff member.
 * Handles validation errors and displays appropriate toast notifications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useCreateStaffInvitation({
 *   onSuccess: (data) => navigate(`/invitations/${data.data.id}`),
 * });
 * 
 * mutate({
 *   staff_id: 123,
 *   facility_id: 5,
 *   department_id: 10,
 *   role_code: 'attending_physician',
 *   module_code: ['clinical', 'prescriptions']
 * });
 */
export const useCreateStaffInvitation = (
  callbacks: MutationCallbacks<StaffInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffInvitationResponse, AxiosError<ApiErrorResponse>, CreateStaffInvitationRequest>({
    mutationFn: async (data: CreateStaffInvitationRequest) => {
      const response = await axiosInstance.post<StaffInvitationResponse>('/staff-invitations', data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation created and sent successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create invitation.';

      // Extract validation errors if present
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

/**
 * Updates an existing staff invitation by ID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useUpdateStaffInvitation({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all }),
 * });
 * 
 * mutate({
 *   id: 123,
 *   data: { role_code: 'senior_physician', module_code: ['clinical', 'prescriptions', 'radiology'] }
 * });
 */
export const useUpdateStaffInvitation = (
  callbacks: MutationCallbacks<StaffInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<StaffInvitationResponse, AxiosError<ApiErrorResponse>, UpdateStaffInvitationParams>({
    mutationFn: async ({ id, data }: UpdateStaffInvitationParams) => {
      const response = await axiosInstance.put<StaffInvitationResponse>(`/staff-invitations/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation updated successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update invitation.';

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

/**
 * Deletes a staff invitation by ID.
 * Permanent deletion - cannot be undone.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useDeleteStaffInvitation({
 *   onSuccess: () => navigate('/invitations'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useDeleteStaffInvitation = (
  callbacks: MutationCallbacks<DeleteStaffInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeleteStaffInvitationResponse, AxiosError<ApiErrorResponse>, DeleteStaffInvitationParams>({
    mutationFn: async ({ id }: DeleteStaffInvitationParams) => {
      const response = await axiosInstance.delete<DeleteStaffInvitationResponse>(`/staff-invitations/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation deleted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete invitation.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Accepts a staff invitation.
 * Creates facility staff assignment and grants module access.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate, isPending } = useAcceptInvitation({
 *   onSuccess: (data) => {
 *     showToast('success', 'You have joined the facility!');
 *     navigate('/dashboard');
 *   },
 * });
 * 
 * mutate({ id: 123 });
 */
export const useAcceptInvitation = (
  callbacks: MutationCallbacks<AcceptInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<AcceptInvitationResponse, AxiosError<ApiErrorResponse>, AcceptInvitationParams>({
    mutationFn: async ({ id }: AcceptInvitationParams) => {
      const response = await axiosInstance.post<AcceptInvitationResponse>(`/staff-invitations/${id}/accept`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation accepted successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to accept invitation.';

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

/**
 * Declines a staff invitation.
 * Marks invitation as declined - no facility assignment is created.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useDeclineInvitation({
 *   onSuccess: () => navigate('/invitations'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useDeclineInvitation = (
  callbacks: MutationCallbacks<DeclineInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<DeclineInvitationResponse, AxiosError<ApiErrorResponse>, DeclineInvitationParams>({
    mutationFn: async ({ id }: DeclineInvitationParams) => {
      const response = await axiosInstance.post<DeclineInvitationResponse>(`/staff-invitations/${id}/decline`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation declined.';
      showToast('info', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to decline invitation.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Resends a staff invitation.
 * Sends a new notification email/SMS to the staff member.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useResendInvitation({
 *   onSuccess: () => showToast('success', 'Invitation resent!'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useResendInvitation = (
  callbacks: MutationCallbacks<ResendInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ResendInvitationResponse, AxiosError<ApiErrorResponse>, ResendInvitationParams>({
    mutationFn: async ({ id }: ResendInvitationParams) => {
      const response = await axiosInstance.post<ResendInvitationResponse>(`/staff-invitations/${id}/resend`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation resent successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to resend invitation.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Cancels a staff invitation.
 * Soft-deletes the invitation - can be restored if needed.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useCancelInvitation({
 *   onSuccess: () => navigate('/invitations'),
 * });
 * 
 * mutate({ id: 123 });
 */
export const useCancelInvitation = (
  callbacks: MutationCallbacks<CancelInvitationResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<CancelInvitationResponse, AxiosError<ApiErrorResponse>, CancelInvitationParams>({
    mutationFn: async ({ id }: CancelInvitationParams) => {
      const response = await axiosInstance.post<CancelInvitationResponse>(`/staff-invitations/${id}/cancel`);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Invitation cancelled successfully!';
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to cancel invitation.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Batch resends multiple invitations.
 * Useful for bulk notification operations.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useBatchResendInvitations({
 *   onSuccess: (data) => {
 *     console.log(`Resent: ${data.meta.successful_count}, Failed: ${data.meta.failed_count}`);
 *   },
 * });
 * 
 * mutate({ invitation_ids: [1, 2, 3, 4] });
 */
export const useBatchResendInvitations = (
  callbacks: MutationCallbacks<BatchResendInvitationsResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<BatchResendInvitationsResponse, AxiosError<ApiErrorResponse>, BatchResendInvitationsRequest>({
    mutationFn: async (data: BatchResendInvitationsRequest) => {
      const response = await axiosInstance.post<BatchResendInvitationsResponse>('/staff-invitations/batch/resend', data);
      return response.data;
    },
    onSuccess: (data) => {
      const { successful_count, failed_count } = data.meta;
      const successMessage = `Successfully resent ${successful_count} invitation(s). ${failed_count > 0 ? `Failed: ${failed_count}.` : ''}`;
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to resend invitations.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Batch cancels multiple invitations.
 * Useful for bulk cancellation operations.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useBatchCancelInvitations({
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all }),
 * });
 * 
 * mutate({ invitation_ids: [1, 2, 3] });
 */
export const useBatchCancelInvitations = (
  callbacks: MutationCallbacks<BatchCancelInvitationsResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<BatchCancelInvitationsResponse, AxiosError<ApiErrorResponse>, BatchCancelInvitationsRequest>({
    mutationFn: async (data: BatchCancelInvitationsRequest) => {
      const response = await axiosInstance.post<BatchCancelInvitationsResponse>('/staff-invitations/batch/cancel', data);
      return response.data;
    },
    onSuccess: (data) => {
      const { successful_count, failed_count } = data.meta;
      const successMessage = `Successfully cancelled ${successful_count} invitation(s). ${failed_count > 0 ? `Failed: ${failed_count}.` : ''}`;
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to cancel invitations.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Processes all expired invitations (admin operation).
 * Marks expired invitations as 'expired' status.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 * 
 * @example
 * const { mutate } = useProcessExpiredInvitations({
 *   onSuccess: (data) => {
 *     console.log(`Processed ${data.data.processed_count} expired invitations`);
 *   },
 * });
 * 
 * mutate();
 */
export const useProcessExpiredInvitations = (
  callbacks: MutationCallbacks<ProcessExpiredInvitationsResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ProcessExpiredInvitationsResponse, AxiosError<ApiErrorResponse>, void>({
    mutationFn: async () => {
      const response = await axiosInstance.post<ProcessExpiredInvitationsResponse>('/staff-invitations/process-expired');
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || `Processed ${data.data.processed_count} expired invitation(s).`;
      showToast('success', successMessage, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to process expired invitations.';
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
 * Prioritizes API message, falls back to generic error message.
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
 * Converts Laravel validation error format to user-friendly display.
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

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Query hooks
  useGetStaffInvitations,
  useGetStaffInvitationById,
  useGetStaffInvitationByUuid,
  useGetMyInvitations,
  useGetMyPendingInvitations,
  useGetInvitationsByStaff,
  useGetInvitationsByFacility,

  // Mutation hooks
  useCreateStaffInvitation,
  useUpdateStaffInvitation,
  useDeleteStaffInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
  useResendInvitation,
  useCancelInvitation,
  useBatchResendInvitations,
  useBatchCancelInvitations,
  useProcessExpiredInvitations,

  // Utilities
  staffInvitationKeys,
  extractErrorMessage,
  formatValidationErrors,
};