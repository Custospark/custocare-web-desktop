/**
 * vitalQueries.ts
 * ============================================================================
 * VITALS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for vital signs operations.
 * Exactly matches the response structure from VitalController.
 * 
 * @module vitalQueries
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import type {
  VitalFilters,
  CreateVitalRequest,
  UpdateVitalRequest,
  VitalSingleSuccessResponse,
  VitalListSuccessResponse,
  VitalTrendResponse,
  VitalStatisticsResponse,
  VitalDeleteSuccessResponse,
  VitalValidationErrorResponse,
  VitalNotFoundResponse,
  VitalSystemErrorResponse,
} from './vitalTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const vitalKeys = {
  all: ['vitals'] as const,
  lists: () => [...vitalKeys.all, 'list'] as const,
  list: (filters: VitalFilters) => [...vitalKeys.lists(), filters] as const,
  patientList: (patientId: number, filters?: VitalFilters) => 
    [...vitalKeys.all, 'patient', patientId, filters] as const,
  patientLatest: (patientId: number) => [...vitalKeys.all, 'patient', patientId, 'latest'] as const,
  patientTrend: (patientId: number, vitalType: string, limit: number) => 
    [...vitalKeys.all, 'patient', patientId, 'trend', vitalType, limit] as const,
  visitList: (visitId: number) => [...vitalKeys.all, 'visit', visitId] as const,
  details: () => [...vitalKeys.all, 'detail'] as const,
  detail: (id: number) => [...vitalKeys.details(), id] as const,
  abnormal: (facilityId?: number, limit?: number) => [...vitalKeys.all, 'abnormal', facilityId, limit] as const,
  critical: (facilityId?: number, limit?: number) => [...vitalKeys.all, 'critical', facilityId, limit] as const,
  statistics: (facilityId: number, startDate: string, endDate: string) => 
    [...vitalKeys.all, 'statistics', facilityId, startDate, endDate] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useGetVitals = (
  filters?: VitalFilters,
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  const mergedFilters = { ...filters, facility_id: filters?.facility_id ?? facilityId ?? undefined };

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.list(mergedFilters),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>(
          '/vitals',
          { params: mergedFilters }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch vitals', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientVitals = (
  patientId?: number,
  filters?: Omit<VitalFilters, 'patient_id'>,
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.patientList(effectivePatientId ?? 0, filters),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>(
          `/vitals/patient/${effectivePatientId}`,
          { params: { ...filters, facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch patient vitals', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetLatestPatientVitals = (
  patientId?: number,
  options?: Omit<
    UseQueryOptions<VitalSingleSuccessResponse, AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const { showToast } = useToast();

  return useQuery<VitalSingleSuccessResponse, AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>>({
    queryKey: vitalKeys.patientLatest(effectivePatientId ?? 0),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<VitalSingleSuccessResponse>(
          `/vitals/patient/${effectivePatientId}?latest_only=true`
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch latest vitals', 5000);
        }
        throw error;
      }
    },
    enabled: !!effectivePatientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetActiveVisitVitals = (
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const visitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.visitList(visitId ?? 0),
    queryFn: async () => {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>(
          `/vitals/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit vitals', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetVisitVitals = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.visitList(visitId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>(
          `/vitals/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit vitals', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetVital = (
  id: number,
  options?: Omit<
    UseQueryOptions<VitalSingleSuccessResponse, AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<VitalSingleSuccessResponse, AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>>({
    queryKey: vitalKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<VitalSingleSuccessResponse>(`/vitals/${id}`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch vital record', 5000);
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetVitalTrend = (
  patientId: number,
  vitalType: string,
  limit: number = 10,
  options?: Omit<
    UseQueryOptions<VitalTrendResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<VitalTrendResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.patientTrend(patientId, vitalType, limit),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<VitalTrendResponse>(
          `/vitals/patient/${patientId}/trend`,
          { params: { vital_type: vitalType, limit } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch vital trend', 5000);
        throw error;
      }
    },
    enabled: !!patientId && !!vitalType,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetAbnormalVitals = (
  limit?: number,
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.abnormal(facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>('/vitals/abnormal', {
          params: { facility_id: facilityId, limit: limit ?? 50 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch abnormal vitals', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

export const useGetCriticalVitals = (
  limit?: number,
  options?: Omit<
    UseQueryOptions<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalListSuccessResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.critical(facilityId ?? undefined, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<VitalListSuccessResponse>('/vitals/critical', {
          params: { facility_id: facilityId, limit: limit ?? 50 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch critical vitals', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 3 * 60 * 1000,
    ...options,
  });
};

export const useGetVitalStatistics = (
  startDate: string,
  endDate: string,
  options?: Omit<
    UseQueryOptions<VitalStatisticsResponse, AxiosError<VitalSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<VitalStatisticsResponse, AxiosError<VitalSystemErrorResponse>>({
    queryKey: vitalKeys.statistics(facilityId ?? 0, startDate, endDate),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      try {
        const response = await axiosInstance.get<VitalStatisticsResponse>('/vitals/statistics', {
          params: { facility_id: facilityId, start_date: startDate, end_date: endDate }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<VitalSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch vital statistics', 5000);
        throw error;
      }
    },
    enabled: !!facilityId && !!startDate && !!endDate,
    staleTime: 15 * 60 * 1000,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

export const useCreateVital = (callbacks?: {
  onSuccess?: (data: VitalSingleSuccessResponse) => void;
  onError?: (error: AxiosError<VitalValidationErrorResponse | VitalSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const staffId = useSelector(getStaffId);
  const visitId = useSelector(selectActiveVisitId);
  const patientId = useSelector(selectActiveVisitPatientId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useMutation<
    VitalSingleSuccessResponse,
    AxiosError<VitalValidationErrorResponse | VitalSystemErrorResponse>,
    CreateVitalRequest
  >({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        staff_id: data.staff_id ?? staffId ?? undefined,
        visit_id: data.visit_id ?? visitId ?? undefined,
        patient_id: data.patient_id ?? patientId ?? undefined,
        facility_id: data.facility_id ?? facilityId ?? undefined,
      };
      const response = await axiosInstance.post<VitalSingleSuccessResponse>('/vitals', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: vitalKeys.lists() });
        queryClient.invalidateQueries({ queryKey: vitalKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: vitalKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: vitalKeys.patientLatest(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: vitalKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Vital record created successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create vital record';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateVital = (callbacks?: {
  onSuccess?: (data: VitalSingleSuccessResponse) => void;
  onError?: (error: AxiosError<VitalValidationErrorResponse | VitalNotFoundResponse | VitalSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    VitalSingleSuccessResponse,
    AxiosError<VitalValidationErrorResponse | VitalNotFoundResponse | VitalSystemErrorResponse>,
    { id: number; data: UpdateVitalRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<VitalSingleSuccessResponse>(`/vitals/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vitalKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: vitalKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: vitalKeys.patientLatest(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: vitalKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Vital record updated successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update vital record';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDeleteVital = (callbacks?: {
  onSuccess?: (data: VitalDeleteSuccessResponse) => void;
  onError?: (error: AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    VitalDeleteSuccessResponse,
    AxiosError<VitalNotFoundResponse | VitalSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.delete<VitalDeleteSuccessResponse>(`/vitals/${id}`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: vitalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: vitalKeys.lists() });
      showToast('success', data.message || 'Vital record deleted successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete vital record';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export const extractVitalErrorMessage = (
  error: AxiosError<VitalValidationErrorResponse | VitalNotFoundResponse | VitalSystemErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;

  switch (error.response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Unauthorized. Please log in again.';
    case 403: return 'You do not have permission to access these vitals.';
    case 404: return 'Vital record not found.';
    case 422: return 'Validation failed. Please check your input.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || fallbackMessage;
  }
};

export const extractVitalFieldErrors = (
  error: AxiosError<VitalValidationErrorResponse>
): Record<string, string[]> | null => {
  return error.response?.data?.errors || null;
};

/* -------------------------------------------------------------------------- */
/*                                EXPORTS                                     */
/* -------------------------------------------------------------------------- */

export default {
  vitalKeys,
  useGetVitals,
  useGetPatientVitals,
  useGetLatestPatientVitals,
  useGetActiveVisitVitals,
  useGetVisitVitals,
  useGetVital,
  useGetVitalTrend,
  useGetAbnormalVitals,
  useGetCriticalVitals,
  useGetVitalStatistics,
  useCreateVital,
  useUpdateVital,
  useDeleteVital,
  extractVitalErrorMessage,
  extractVitalFieldErrors,
};