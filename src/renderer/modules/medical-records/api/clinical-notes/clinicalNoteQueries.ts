/**
 * clinicalNoteQueries.ts
 * ============================================================================
 * CLINICAL NOTES REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for clinical note operations.
 * Exactly matches the response structure from ClinicalNoteController.
 * 
 * @module clinicalNoteQueries
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import type {
  ClinicalNoteFilters,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  AmendNoteRequest,
  ClinicalNoteSingleSuccessResponse,
  ClinicalNoteListSuccessResponse,
  ClinicalNoteStatisticsResponse,
  ClinicalNoteDeleteSuccessResponse,
  ClinicalNoteValidationErrorResponse,
  ClinicalNoteNotFoundResponse,
  ClinicalNoteSystemErrorResponse,
} from './clinicalNoteTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const clinicalNoteKeys = {
  all: ['clinical-notes'] as const,
  lists: () => [...clinicalNoteKeys.all, 'list'] as const,
  list: (filters: ClinicalNoteFilters) => [...clinicalNoteKeys.lists(), filters] as const,
  patientList: (patientId: number, filters?: ClinicalNoteFilters) => 
    [...clinicalNoteKeys.all, 'patient', patientId, filters] as const,
  visitList: (visitId: number) => [...clinicalNoteKeys.all, 'visit', visitId] as const,
  details: () => [...clinicalNoteKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...clinicalNoteKeys.details(), uuid] as const,
  history: (uuid: string) => [...clinicalNoteKeys.all, 'history', uuid] as const,
  statistics: (facilityId: number) => [...clinicalNoteKeys.all, 'statistics', facilityId] as const,
  search: (searchTerm: string, facilityId?: number) => 
    [...clinicalNoteKeys.all, 'search', searchTerm, facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useGetClinicalNotes = (
  filters?: ClinicalNoteFilters,
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  const mergedFilters = { ...filters, facility_id: filters?.facility_id ?? facilityId ?? undefined };

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.list(mergedFilters),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>(
          '/clinical-notes',
          { params: mergedFilters }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch clinical notes', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientClinicalNotes = (
  patientId?: number,
  filters?: Omit<ClinicalNoteFilters, 'patient_id'>,
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.patientList(effectivePatientId ?? 0, filters),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>(
          `/clinical-notes/patient/${effectivePatientId}`,
          { params: { ...filters, facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch patient notes', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetActiveVisitClinicalNotes = (
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const visitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.visitList(visitId ?? 0),
    queryFn: async () => {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>(
          `/clinical-notes/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit notes', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetVisitClinicalNotes = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.visitList(visitId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>(
          `/clinical-notes/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit notes', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetClinicalNote = (
  uuid: string,
  options?: Omit<
    UseQueryOptions<ClinicalNoteSingleSuccessResponse, AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<ClinicalNoteSingleSuccessResponse, AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.detail(uuid),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/${uuid}`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch clinical note', 5000);
        }
        throw error;
      }
    },
    enabled: !!uuid,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetNoteHistory = (
  uuid: string,
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.history(uuid),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>(`/clinical-notes/${uuid}/history`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch note history', 5000);
        throw error;
      }
    },
    enabled: !!uuid,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetClinicalNoteStatistics = (
  options?: Omit<
    UseQueryOptions<ClinicalNoteStatisticsResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ClinicalNoteStatisticsResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.statistics(facilityId ?? 0),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ClinicalNoteStatisticsResponse>('/clinical-notes/statistics', {
          params: { facility_id: facilityId }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch statistics', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 15 * 60 * 1000,
    ...options,
  });
};

export const useSearchClinicalNotes = (
  searchTerm: string,
  limit?: number,
  options?: Omit<
    UseQueryOptions<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ClinicalNoteListSuccessResponse, AxiosError<ClinicalNoteSystemErrorResponse>>({
    queryKey: clinicalNoteKeys.search(searchTerm, facilityId ?? undefined),
    queryFn: async () => {
      // Early return for empty search term
      if (!searchTerm) {
        return {
          success: true,
          message: '',
          data: [],
          errors: null,
          meta: {
            total: 0,
            per_page: limit ?? 20,
            current_page: 1,
            last_page: 1,
            from: null,
            to: null,
          }
        } as ClinicalNoteListSuccessResponse;
      }

      // API call for valid search term
      try {
        const response = await axiosInstance.get<ClinicalNoteListSuccessResponse>('/clinical-notes/search', {
          params: {
            q: searchTerm,
            facility_id: facilityId,
            limit: limit ?? 20
          }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to search notes', 5000);
        throw error;
      }
    },
    enabled: !!facilityId && searchTerm.length > 2,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};
export const useGetLatestPatientNote = (
  patientId?: number,
  options?: Omit<
    UseQueryOptions<ClinicalNoteSingleSuccessResponse, AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const { showToast } = useToast();

  return useQuery<ClinicalNoteSingleSuccessResponse, AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>>({
    queryKey: [...clinicalNoteKeys.patientList(effectivePatientId ?? 0), 'latest'],
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/patient/${effectivePatientId}/latest`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ClinicalNoteNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch latest note', 5000);
        }
        throw error;
      }
    },
    enabled: !!effectivePatientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

export const useCreateClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const staffId = useSelector(getStaffId);
  const visitId = useSelector(selectActiveVisitId);
  const patientId = useSelector(selectActiveVisitPatientId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteSystemErrorResponse>,
    CreateClinicalNoteRequest
  >({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        staff_id: data.staff_id ?? staffId ?? undefined,
        visit_id: data.visit_id ?? visitId ?? undefined,
        patient_id: data.patient_id ?? patientId ?? undefined,
        facility_id: data.facility_id ?? facilityId ?? undefined,
      };
      const response = await axiosInstance.post<ClinicalNoteSingleSuccessResponse>('/clinical-notes', payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
        queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(data.data.uuid as string) });
        if (variables.patient_id) {
          queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.patientList(variables.patient_id) });
        }
        if (variables.visit_id) {
          queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.visitList(variables.visit_id) });
        }
      }
      showToast('success', data.message || 'Clinical note created successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create clinical note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    { uuid: string; data: UpdateClinicalNoteRequest }
  >({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.patientList(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Clinical note updated successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update clinical note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDeleteClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteDeleteSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteDeleteSuccessResponse,
    AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    string
  >({
    mutationFn: async (uuid: string) => {
      const response = await axiosInstance.delete<ClinicalNoteDeleteSuccessResponse>(`/clinical-notes/${uuid}`);
      return response.data;
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      showToast('success', data.message || 'Clinical note deleted successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete clinical note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useFinalizeClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    string
  >({
    mutationFn: async (uuid: string) => {
      const response = await axiosInstance.post<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/${uuid}/finalize`);
      return response.data;
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      showToast('success', data.message || 'Note finalized successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to finalize note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useCancelClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    { uuid: string; reason?: string }
  >({
    mutationFn: async ({ uuid, reason }) => {
      const response = await axiosInstance.post(`/clinical-notes/${uuid}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Note cancelled successfully');
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to cancel note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useAmendClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    { uuid: string; data: AmendNoteRequest }
  >({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.post<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/${uuid}/amend`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.history(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      showToast('success', data.message || 'Note amended successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to amend note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useRestoreClinicalNote = (callbacks?: {
  onSuccess?: (data: ClinicalNoteSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ClinicalNoteSingleSuccessResponse,
    AxiosError<ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
    string
  >({
    mutationFn: async (uuid: string) => {
      const response = await axiosInstance.post<ClinicalNoteSingleSuccessResponse>(`/clinical-notes/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data, uuid) => {
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: clinicalNoteKeys.lists() });
      showToast('success', data.message || 'Note restored successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to restore note';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export const extractClinicalNoteErrorMessage = (
  error: AxiosError<ClinicalNoteValidationErrorResponse | ClinicalNoteNotFoundResponse | ClinicalNoteSystemErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;

  switch (error.response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Unauthorized. Please log in again.';
    case 403: return 'You do not have permission to access these notes.';
    case 404: return 'Clinical note not found.';
    case 422: return 'Validation failed. Please check your input.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || fallbackMessage;
  }
};

export const extractClinicalNoteFieldErrors = (
  error: AxiosError<ClinicalNoteValidationErrorResponse>
): Record<string, string[]> | null => {
  return error.response?.data?.errors || null;
};

/* -------------------------------------------------------------------------- */
/*                                EXPORTS                                     */
/* -------------------------------------------------------------------------- */

export default {
  clinicalNoteKeys,
  useGetClinicalNotes,
  useGetPatientClinicalNotes,
  useGetActiveVisitClinicalNotes,
  useGetVisitClinicalNotes,
  useGetClinicalNote,
  useGetNoteHistory,
  useGetClinicalNoteStatistics,
  useSearchClinicalNotes,
  useGetLatestPatientNote,
  useCreateClinicalNote,
  useUpdateClinicalNote,
  useDeleteClinicalNote,
  useFinalizeClinicalNote,
  useCancelClinicalNote,
  useAmendClinicalNote,
  useRestoreClinicalNote,
  extractClinicalNoteErrorMessage,
  extractClinicalNoteFieldErrors,
};