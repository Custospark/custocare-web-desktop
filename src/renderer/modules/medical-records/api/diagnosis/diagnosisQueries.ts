/**
 * diagnosisQueries.ts
 * ============================================================================
 * DIAGNOSIS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for diagnosis operations.
 * Exactly matches the response structure from DiagnosisController.
 * 
 * @module diagnosisQueries
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../app/store/slices/visitSlice';
import type {
  DiagnosisFilters,
  CreateDiagnosisRequest,
  UpdateDiagnosisRequest,
  DiagnosisSingleSuccessResponse,
  DiagnosisListSuccessResponse,
  DiagnosisStatisticsResponse,
  MostCommonDiagnosesResponse,
  IcdCodeSuggestionsResponse,
  DiagnosisDeleteSuccessResponse,
  DiagnosisValidationErrorResponse,
  DiagnosisNotFoundResponse,
  DiagnosisSystemErrorResponse,
} from './diagnosisTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const diagnosisKeys = {
  all: ['diagnoses'] as const,
  lists: () => [...diagnosisKeys.all, 'list'] as const,
  list: (filters: DiagnosisFilters) => [...diagnosisKeys.lists(), filters] as const,
  patientList: (patientId: number, filters?: DiagnosisFilters) => 
    [...diagnosisKeys.all, 'patient', patientId, filters] as const,
  patientActive: (patientId: number) => [...diagnosisKeys.all, 'patient', patientId, 'active'] as const,
  patientPrimary: (patientId: number) => [...diagnosisKeys.all, 'patient', patientId, 'primary'] as const,
  visitList: (visitId: number) => [...diagnosisKeys.all, 'visit', visitId] as const,
  details: () => [...diagnosisKeys.all, 'detail'] as const,
  detail: (id: number) => [...diagnosisKeys.details(), id] as const,
  statistics: (patientId: number) => [...diagnosisKeys.all, 'statistics', patientId] as const,
  mostCommon: (facilityId: number, limit?: number) => [...diagnosisKeys.all, 'most-common', facilityId, limit] as const,
  search: (searchTerm: string, facilityId?: number) => 
    [...diagnosisKeys.all, 'search', searchTerm, facilityId] as const,
  icdSuggestions: (searchTerm: string) => [...diagnosisKeys.all, 'icd-suggestions', searchTerm] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useGetDiagnoses = (
  filters?: DiagnosisFilters,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  const mergedFilters = { ...filters, facility_id: filters?.facility_id ?? facilityId ?? undefined };

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.list(mergedFilters),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          '/diagnoses',
          { params: mergedFilters }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientDiagnoses = (
  patientId?: number,
  filters?: Omit<DiagnosisFilters, 'patient_id'>,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.patientList(effectivePatientId ?? 0, filters),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          `/diagnoses/patient/${effectivePatientId}`,
          { params: { ...filters, facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch patient diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetActivePatientDiagnoses = (
  patientId?: number,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.patientActive(effectivePatientId ?? 0),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          `/diagnoses/patient/${effectivePatientId}?active_only=true`
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch active diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientPrimaryDiagnoses = (
  patientId?: number,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.patientPrimary(effectivePatientId ?? 0),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          `/diagnoses/patient/${effectivePatientId}/primary`
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch primary diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetActiveVisitDiagnoses = (
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const visitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.visitList(visitId ?? 0),
    queryFn: async () => {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          `/diagnoses/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetVisitDiagnoses = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.visitList(visitId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>(
          `/diagnoses/visit/${visitId}`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch visit diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!visitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useGetDiagnosis = (
  id: number,
  options?: Omit<
    UseQueryOptions<DiagnosisSingleSuccessResponse, AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<DiagnosisSingleSuccessResponse, AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.detail(id),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<DiagnosisSingleSuccessResponse>(`/diagnoses/${id}`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch diagnosis', 5000);
        }
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetPatientDiagnosisStatistics = (
  patientId?: number,
  options?: Omit<
    UseQueryOptions<DiagnosisStatisticsResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const effectivePatientId = patientId ?? activePatientId;
  const { showToast } = useToast();

  return useQuery<DiagnosisStatisticsResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.statistics(effectivePatientId ?? 0),
    queryFn: async () => {
      if (!effectivePatientId) {
        throw new Error('Patient ID is required');
      }
      try {
        const response = await axiosInstance.get<DiagnosisStatisticsResponse>(`/diagnoses/patient/${effectivePatientId}/statistics`);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch statistics', 5000);
        throw error;
      }
    },
    enabled: !!effectivePatientId,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

export const useGetMostCommonDiagnoses = (
  limit: number = 10,
  options?: Omit<
    UseQueryOptions<MostCommonDiagnosesResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<MostCommonDiagnosesResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.mostCommon(facilityId ?? 0, limit),
    queryFn: async () => {
      if (!facilityId) {
        throw new Error('Facility ID is required');
      }
      try {
        const response = await axiosInstance.get<MostCommonDiagnosesResponse>('/diagnoses/most-common', {
          params: { facility_id: facilityId, limit }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to fetch common diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!facilityId,
    staleTime: 30 * 60 * 1000,
    ...options,
  });
};

export const useSearchDiagnoses = (
  searchTerm: string,
  limit?: number,
  options?: Omit<
    UseQueryOptions<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<DiagnosisListSuccessResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.search(searchTerm, facilityId ?? undefined),
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
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
        } as DiagnosisListSuccessResponse;
      }

      try {
        const response = await axiosInstance.get<DiagnosisListSuccessResponse>('/diagnoses/search', {
          params: { q: searchTerm, facility_id: facilityId, limit: limit ?? 20 }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to search diagnoses', 5000);
        throw error;
      }
    },
    enabled: !!facilityId && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useSuggestIcdCodes = (
  searchTerm: string,
  limit: number = 10,
  options?: Omit<
    UseQueryOptions<IcdCodeSuggestionsResponse, AxiosError<DiagnosisSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { showToast } = useToast();

  return useQuery<IcdCodeSuggestionsResponse, AxiosError<DiagnosisSystemErrorResponse>>({
    queryKey: diagnosisKeys.icdSuggestions(searchTerm),
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return { success: true, message: '', data: [], errors: null } as IcdCodeSuggestionsResponse;
      }

      try {
        const response = await axiosInstance.get<IcdCodeSuggestionsResponse>('/diagnoses/suggest-icd', {
          params: { q: searchTerm, limit }
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DiagnosisSystemErrorResponse>;
        showToast('error', axiosError.response?.data?.message || 'Failed to get ICD suggestions', 5000);
        throw error;
      }
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30 * 60 * 1000,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

export const useCreateDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisValidationErrorResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const staffId = useSelector(getStaffId);
  const visitId = useSelector(selectActiveVisitId);
  const patientId = useSelector(selectActiveVisitPatientId);
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisValidationErrorResponse | DiagnosisSystemErrorResponse>,
    CreateDiagnosisRequest
  >({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        staff_id: data.staff_id ?? staffId ?? undefined,
        visit_id: data.visit_id ?? visitId ?? undefined,
        patient_id: data.patient_id ?? patientId ?? undefined,
        facility_id: data.facility_id ?? facilityId ?? undefined,
      };
      const response = await axiosInstance.post<DiagnosisSingleSuccessResponse>('/diagnoses', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(data.data.id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.statistics(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: diagnosisKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Diagnosis created successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisValidationErrorResponse | DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisValidationErrorResponse | DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    { id: number; data: UpdateDiagnosisRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<DiagnosisSingleSuccessResponse>(`/diagnoses/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.statistics(data.data.patient_id) });
        if (data.data.visit_id) {
          queryClient.invalidateQueries({ queryKey: diagnosisKeys.visitList(data.data.visit_id) });
        }
      }
      showToast('success', data.message || 'Diagnosis updated successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDeleteDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisDeleteSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisDeleteSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.delete<DiagnosisDeleteSuccessResponse>(`/diagnoses/${id}`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      showToast('success', data.message || 'Diagnosis deleted successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useVerifyDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.post<DiagnosisSingleSuccessResponse>(`/diagnoses/${id}/verify`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.statistics(data.data.patient_id) });
      }
      showToast('success', data.message || 'Diagnosis verified successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to verify diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useDisputeDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    { id: number; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => {
      const response = await axiosInstance.post(`/diagnoses/${id}/dispute`, { reason });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      showToast('success', data.message || 'Diagnosis marked as disputed');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to dispute diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useResolveDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    { id: number; resolution_notes?: string }
  >({
    mutationFn: async ({ id, resolution_notes }) => {
      const response = await axiosInstance.post(`/diagnoses/${id}/resolve`, { resolution_notes });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.statistics(data.data.patient_id) });
      }
      showToast('success', data.message || 'Diagnosis resolved successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to resolve diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useReactivateDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.post<DiagnosisSingleSuccessResponse>(`/diagnoses/${id}/reactivate`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.patientList(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: diagnosisKeys.statistics(data.data.patient_id) });
      }
      showToast('success', data.message || 'Diagnosis reactivated successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to reactivate diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useRestoreDiagnosis = (callbacks?: {
  onSuccess?: (data: DiagnosisSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DiagnosisSingleSuccessResponse,
    AxiosError<DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
    number
  >({
    mutationFn: async (id: number) => {
      const response = await axiosInstance.post<DiagnosisSingleSuccessResponse>(`/diagnoses/${id}/restore`);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: diagnosisKeys.lists() });
      showToast('success', data.message || 'Diagnosis restored successfully');
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to restore diagnosis';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

export const extractDiagnosisErrorMessage = (
  error: AxiosError<DiagnosisValidationErrorResponse | DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;

  switch (error.response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Unauthorized. Please log in again.';
    case 403: return 'You do not have permission to access these diagnoses.';
    case 404: return 'Diagnosis not found.';
    case 409: return 'A diagnosis with this code and type already exists for this visit.';
    case 422: return 'Validation failed. Please check your input.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || fallbackMessage;
  }
};

export const extractDiagnosisFieldErrors = (
  error: AxiosError<DiagnosisValidationErrorResponse>
): Record<string, string[]> | null => {
  return error.response?.data?.errors || null;
};

/* -------------------------------------------------------------------------- */
/*                                EXPORTS                                     */
/* -------------------------------------------------------------------------- */

export default {
  diagnosisKeys,
  useGetDiagnoses,
  useGetPatientDiagnoses,
  useGetActivePatientDiagnoses,
  useGetPatientPrimaryDiagnoses,
  useGetActiveVisitDiagnoses,
  useGetVisitDiagnoses,
  useGetDiagnosis,
  useGetPatientDiagnosisStatistics,
  useGetMostCommonDiagnoses,
  useSearchDiagnoses,
  useSuggestIcdCodes,
  useCreateDiagnosis,
  useUpdateDiagnosis,
  useDeleteDiagnosis,
  useVerifyDiagnosis,
  useDisputeDiagnosis,
  useResolveDiagnosis,
  useReactivateDiagnosis,
  useRestoreDiagnosis,
  extractDiagnosisErrorMessage,
  extractDiagnosisFieldErrors,
};