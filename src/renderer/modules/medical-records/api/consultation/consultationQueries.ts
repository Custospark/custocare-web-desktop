/**
 * consultationQueries.ts
 * ============================================================================
 * CONSULTATION REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for consultation operations.
 * Exactly matches the response structure from ConsultationController.
 * 
 * @module consultationQueries
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import type {
  ConsultationFilters,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  ConsultationSingleSuccessResponse,
  ConsultationListSuccessResponse,
  ConsultationStatisticsResponse,
  ConsultationCountByStatusResponse,
  ConsultationDeleteSuccessResponse,
  ConsultationValidationErrorResponse,
  ConsultationNotFoundResponse,
  ConsultationSystemErrorResponse,
} from './consultationTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const consultationKeys = {
  all: ['consultations'] as const,
  lists: () => [...consultationKeys.all, 'list'] as const,
  list: (filters: ConsultationFilters) => [...consultationKeys.lists(), filters] as const,
  patientList: (patientId: number, filters?: ConsultationFilters) => 
    [...consultationKeys.all, 'patient', patientId, filters] as const,
  visitList: (visitId: number) => [...consultationKeys.all, 'visit', visitId] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail: (id: number) => [...consultationKeys.details(), id] as const,
  pending: (facilityId?: number, limit?: number) => [...consultationKeys.all, 'pending', facilityId, limit] as const,
  urgent: (facilityId?: number, limit?: number) => [...consultationKeys.all, 'urgent', facilityId, limit] as const,
  overdue: (facilityId?: number, limit?: number) => [...consultationKeys.all, 'overdue', facilityId, limit] as const,
  specialty: (specialty: string, facilityId?: number, limit?: number) => 
    [...consultationKeys.all, 'specialty', specialty, facilityId, limit] as const,
  statistics: (facilityId: number, startDate?: string, endDate?: string) => 
    [...consultationKeys.all, 'statistics', facilityId, startDate, endDate] as const,
  countByStatus: (facilityId: number) => [...consultationKeys.all, 'count', facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useGetConsultations = (
  filters?: ConsultationFilters,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  const mergedFilters = { ...filters, facility_id: filters?.facility_id ?? facilityId ?? undefined };

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.list(mergedFilters),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>(
          '/consultations',
          { params: mergedFilters }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch consultations', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientConsultations = (
  patientId?: number,
  filters?: Omit<ConsultationFilters, 'patient_id'>,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.patientList(effectivePatientId ?? 0, filters),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>(
          `/consultations/patient/${effectivePatientId}`,
          { params: { ...filters, facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch patient consultations', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetActiveVisitConsultations = (
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const visitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.visitList(visitId ?? 0),
    queryFn: async () => {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>(
          `/consultations/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit consultations', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetVisitConsultations = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.visitList(visitId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>(
          `/consultations/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit consultations', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetConsultation = (
  id: number,
  options?: Omit<
    UseQueryOptions<ConsultationSingleSuccessResponse, AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<ConsultationSingleSuccessResponse, AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ConsultationSingleSuccessResponse>(`/consultations/${id}`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch consultation', 5000);
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetPendingConsultations = (
  limit?: number,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.pending(facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>('/consultations/pending', {
          params: { facility_id: facilityId, limit: limit ?? 50 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch pending consultations', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useGetUrgentConsultations = (
  limit?: number,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.urgent(facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>('/consultations/urgent', {
          params: { facility_id: facilityId, limit: limit ?? 50 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch urgent consultations', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useGetOverdueConsultations = (
  limit?: number,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.overdue(facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>('/consultations/overdue', {
          params: { facility_id: facilityId, limit: limit ?? 50 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch overdue consultations', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useGetConsultationsBySpecialty = (
  specialty: string,
  limit?: number,
  options?: Omit<
    UseQueryOptions<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationListSuccessResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.specialty(specialty, facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!specialty) {
        throw new Error('Specialty is required');
      }
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationListSuccessResponse>(
          `/consultations/specialty/${encodeURIComponent(specialty)}`,
          { params: { facility_id: facilityId, limit: limit ?? 50 } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch consultations by specialty', 5000);
        throw error;
      }
    },
    enabled: !!specialty && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetConsultationStatistics = (
  startDate?: string,
  endDate?: string,
  options?: Omit<
    UseQueryOptions<ConsultationStatisticsResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationStatisticsResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.statistics(facilityId ?? 0, startDate, endDate),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        if (startDate && endDate) {
          const response = await axiosInstance.get<ConsultationStatisticsResponse>('/consultations/statistics', {
            params: { facility_id: facilityId, start_date: startDate, end_date: endDate }
          });
          return response.data;
        } else {
          const response = await axiosInstance.get<ConsultationStatisticsResponse>('/consultations/statistics', {
            params: { facility_id: facilityId }
          });
          return response.data;
        }
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch consultation statistics', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 15 * 60 * 1000,
    ...options,
  });
};

export const useGetConsultationCountByStatus = (
  options?: Omit<
    UseQueryOptions<ConsultationCountByStatusResponse, AxiosError<ConsultationSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<ConsultationCountByStatusResponse, AxiosError<ConsultationSystemErrorResponse>>({
    queryKey: consultationKeys.countByStatus(facilityId ?? 0),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<ConsultationCountByStatusResponse>('/consultations/statistics', {
          params: { facility_id: facilityId }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ConsultationSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch consultation counts', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

export const useCreateConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationValidationErrorResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const staffId = useSelector(getStaffId);
  const visitId = useSelector(selectActiveVisitId);
  const patientId = useSelector(selectActiveVisitPatientId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationValidationErrorResponse | ConsultationSystemErrorResponse>,
    CreateConsultationRequest
  >({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        requesting_staff_id: data.requesting_staff_id ?? staffId ?? undefined,
        visit_id: data.visit_id ?? visitId ?? undefined,
        patient_id: data.patient_id ?? patientId ?? undefined,
        facility_id: data.facility_id ?? facilityId ?? undefined,
      };
      const response = await axiosInstance.post<ConsultationSingleSuccessResponse>('/consultations', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: consultationKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: consultationKeys.patientList(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: consultationKeys.visitList(data.data.visit_id) });
        }
        queryClient.invalidateQueries({ queryKey: consultationKeys.pending() });
        queryClient.invalidateQueries({ queryKey: consultationKeys.urgent() });
        queryClient.invalidateQueries({ queryKey: consultationKeys.countByStatus(data.data.facility_id) });
      }
      showToast('success', data.message || 'Consultation request created successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationValidationErrorResponse | ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationValidationErrorResponse | ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; data: UpdateConsultationRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<ConsultationSingleSuccessResponse>(`/consultations/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.patientList(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: consultationKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Consultation updated successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDeleteConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationDeleteSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationDeleteSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.delete<ConsultationDeleteSuccessResponse>(`/consultations/${id}`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      showToast('success', data.message || 'Consultation deleted successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useAcceptConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const staffId = useSelector(getStaffId);
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; consultant_staff_id?: number }
  >({
    mutationFn: async ({ id, consultant_staff_id }) => {
      const payload = { consultant_staff_id: consultant_staff_id ?? staffId };
      const response = await axiosInstance.post<ConsultationSingleSuccessResponse>(`/consultations/${id}/accept`, payload);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: consultationKeys.pending() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: consultationKeys.countByStatus(data.data.facility_id) });
      }
      showToast('success', data.message || 'Consultation accepted successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to accept consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDeclineConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => {
      const response = await axiosInstance.post(`/consultations/${id}/decline`, { reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: consultationKeys.pending() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.countByStatus(data.data.facility_id) });
      }
      showToast('success', data.message || 'Consultation declined');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to decline consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useCompleteConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; findings?: string; recommendations?: string; recommended_orders?: Record<string, string[]> }
  >({
    mutationFn: async ({ id, findings, recommendations, recommended_orders }) => {
      const response = await axiosInstance.post(`/consultations/${id}/complete`, { findings, recommendations, recommended_orders });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: consultationKeys.countByStatus(data.data.facility_id) });
      }
      showToast('success', data.message || 'Consultation completed successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to complete consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useCancelConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => {
      const response = await axiosInstance.post(`/consultations/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: consultationKeys.countByStatus(data.data.facility_id) });
      }
      showToast('success', data.message || 'Consultation cancelled');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to cancel consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useScheduleConsultation = (callbacks?: {
  onSuccess?: (data: ConsultationSingleSuccessResponse) => void;
  onError?: (error: AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    ConsultationSingleSuccessResponse,
    AxiosError<ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
    { id: number; scheduled_for: string; location?: string; duration_minutes?: number }
  >({
    mutationFn: async ({ id, scheduled_for, location, duration_minutes }) => {
      const response = await axiosInstance.post(`/consultations/${id}/schedule`, { scheduled_for, location, duration_minutes });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() });
      showToast('success', data.message || 'Consultation scheduled successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to schedule consultation';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export const extractConsultationErrorMessage = (
  error: AxiosError<ConsultationValidationErrorResponse | ConsultationNotFoundResponse | ConsultationSystemErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;

  switch (error.response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Unauthorized. Please log in again.';
    case 403: return 'You do not have permission to access these consultations.';
    case 404: return 'Consultation not found.';
    case 422: return 'Validation failed. Please check your input.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || fallbackMessage;
  }
};

export const extractConsultationFieldErrors = (
  error: AxiosError<ConsultationValidationErrorResponse>
): Record<string, string[]> | null => {
  return error.response?.data?.errors || null;
};

/* -------------------------------------------------------------------------- */
/*                                EXPORTS                                     */
/* -------------------------------------------------------------------------- */

export default {
  consultationKeys,
  useGetConsultations,
  useGetPatientConsultations,
  useGetActiveVisitConsultations,
  useGetVisitConsultations,
  useGetConsultation,
  useGetPendingConsultations,
  useGetUrgentConsultations,
  useGetOverdueConsultations,
  useGetConsultationsBySpecialty,
  useGetConsultationStatistics,
  useGetConsultationCountByStatus,
  useCreateConsultation,
  useUpdateConsultation,
  useDeleteConsultation,
  useAcceptConsultation,
  useDeclineConsultation,
  useCompleteConsultation,
  useCancelConsultation,
  useScheduleConsultation,
  extractConsultationErrorMessage,
  extractConsultationFieldErrors,
};