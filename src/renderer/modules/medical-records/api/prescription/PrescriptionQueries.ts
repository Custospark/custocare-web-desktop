/**
 * PrescriptionQueries.ts
 * ============================================================================
 * PRESCRIPTION REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for prescription
 * management operations. Handles API communication, error handling, and
 * toast notifications.
 * 
 * @module usePrescriptionQueries
 * @description Provides type-safe, reusable hooks for all prescription CRUD
 * operations and custom queries.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  ApplyTemplateParams,
  ApplyTemplateResponse,
  CancelPrescriptionParams,
  CancelPrescriptionResponse,
  CreatePrescriptionRequest,
  DeletePrescriptionParams,
  DeletePrescriptionResponse,
  DispensePrescriptionParams,
  DispensePrescriptionResponse,
  GetForBillingResponse,
  GetPatientPrescriptionsResponse,
  GetPrescriptionsPaginatedResponse,
  GetPrescriptionsResponse,
  MutationCallbacks,
  PrescriptionFilters,
  PrescriptionId,
  PrescriptionResponse,
  UpdatePrescriptionParams,
} from './PrescriptionTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * Hierarchical structure enables precise cache management.
 */
export const prescriptionKeys = {
  all: () => ['prescriptions'] as const,
  lists: () => [...prescriptionKeys.all(), 'list'] as const,
  list: (filters: PrescriptionFilters = {}) => [...prescriptionKeys.lists(), filters] as const,
  paginated: (page: number, perPage: number, filters: PrescriptionFilters = {}) =>
    [...prescriptionKeys.list(filters), 'paginated', page, perPage] as const,
  details: () => [...prescriptionKeys.all(), 'detail'] as const,
  detail: (id: PrescriptionId) => [...prescriptionKeys.details(), id] as const,
  patient: (patientId: number) => [...prescriptionKeys.all(), 'patient', patientId] as const,
  patientList: (patientId: number, statuses?: string[]) =>
    [...prescriptionKeys.patient(patientId), 'list', statuses] as const,
  billing: (patientId: number) => [...prescriptionKeys.all(), 'billing', patientId] as const,
  billingDetail: (id: PrescriptionId) => [...prescriptionKeys.all(), 'billing', 'detail', id] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches all prescriptions with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options for customizing behavior
 * @returns Query result with prescriptions list and metadata
 */
export const useGetPrescriptions = (
  filters: PrescriptionFilters = {},
  options?: Omit<UseQueryOptions<GetPrescriptionsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetPrescriptionsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetPrescriptionsResponse>(
        '/prescriptions',
        { params: filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches paginated prescriptions.
 * 
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 15)
 * @param filters - Query parameters for filtering
 * @param options - React Query options
 * @returns Query result with paginated prescriptions
 */
export const useGetPrescriptionsPaginated = (
  page: number = 1,
  perPage: number = 15,
  filters: PrescriptionFilters = {},
  options?: Omit<UseQueryOptions<GetPrescriptionsPaginatedResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetPrescriptionsPaginatedResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionKeys.paginated(page, perPage, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetPrescriptionsPaginatedResponse>(
        '/prescriptions/paginate',
        { params: { page, per_page: perPage, ...filters } }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single prescription by ID with all details.
 * 
 * @param id - Prescription ID
 * @param options - React Query options
 * @returns Query result with prescription details
 */
export const useGetPrescriptionById = (
  id: PrescriptionId,
  options?: Omit<UseQueryOptions<PrescriptionResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PrescriptionResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<PrescriptionResponse>(
        `/prescriptions/${id}`
      );
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Fetches all prescriptions for a specific patient.
 * 
 * @param patientId - Patient ID
 * @param statuses - Optional array of statuses to filter by
 * @param options - React Query options
 * @returns Query result with patient prescriptions
 */
export const useGetPatientPrescriptions = (
  patientId: number,
  statuses: string[] = [],
  options?: Omit<UseQueryOptions<GetPatientPrescriptionsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetPatientPrescriptionsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionKeys.patientList(patientId, statuses),
    queryFn: async () => {
      const response = await axiosInstance.get<GetPatientPrescriptionsResponse>(
        `/prescriptions/patient/${patientId}`,
        { params: { statuses: statuses.length ? statuses : undefined } }
      );
      return response.data;
    },
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Fetches a prescription formatted for billing import.
 * 
 * @param id - Prescription ID
 * @param options - React Query options
 * @returns Query result with billing-formatted prescription
 */
export const useGetPrescriptionForBilling = (
  id: PrescriptionId,
  options?: Omit<UseQueryOptions<GetForBillingResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetForBillingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionKeys.billingDetail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<GetForBillingResponse>(
        `/prescriptions/${id}/billing`
      );
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new prescription.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useCreatePrescription = (
  callbacks: MutationCallbacks<PrescriptionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionResponse, AxiosError<ApiErrorResponse>, CreatePrescriptionRequest>({
    mutationFn: async (data: CreatePrescriptionRequest) => {
      const response = await axiosInstance.post<PrescriptionResponse>(
        '/prescriptions',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Prescription created successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      if (data.data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: prescriptionKeys.patient(data.data.patient_id) });
      }
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create prescription.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates an existing prescription.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useUpdatePrescription = (
  callbacks: MutationCallbacks<PrescriptionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionResponse, AxiosError<ApiErrorResponse>, UpdatePrescriptionParams>({
    mutationFn: async ({ id, data }: UpdatePrescriptionParams) => {
      const response = await axiosInstance.put<PrescriptionResponse>(
        `/prescriptions/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Prescription updated successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
      if (data.data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: prescriptionKeys.patient(data.data.patient_id) });
      }
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update prescription.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Deletes a prescription (soft delete).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useDeletePrescription = (
  callbacks: MutationCallbacks<DeletePrescriptionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DeletePrescriptionResponse, AxiosError<ApiErrorResponse>, DeletePrescriptionParams>({
    mutationFn: async ({ id }: DeletePrescriptionParams) => {
      const response = await axiosInstance.delete<DeletePrescriptionResponse>(
        `/prescriptions/${id}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Prescription deleted successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete prescription.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Cancels a prescription.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useCancelPrescription = (
  callbacks: MutationCallbacks<CancelPrescriptionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<CancelPrescriptionResponse, AxiosError<ApiErrorResponse>, CancelPrescriptionParams>({
    mutationFn: async ({ id, data }: CancelPrescriptionParams) => {
      const response = await axiosInstance.post<CancelPrescriptionResponse>(
        `/prescriptions/${id}/cancel`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Prescription cancelled successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
      if (data.data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: prescriptionKeys.patient(data.data.patient_id) });
      }
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to cancel prescription.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Marks a prescription as dispensed.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useMarkPrescriptionDispensed = (
  callbacks: MutationCallbacks<DispensePrescriptionResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DispensePrescriptionResponse, AxiosError<ApiErrorResponse>, DispensePrescriptionParams>({
    mutationFn: async ({ id, data }: DispensePrescriptionParams) => {
      const response = await axiosInstance.post<DispensePrescriptionResponse>(
        `/prescriptions/${id}/dispense`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Prescription marked as dispensed!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
      if (data.data?.patient_id) {
        queryClient.invalidateQueries({ queryKey: prescriptionKeys.patient(data.data.patient_id) });
        queryClient.invalidateQueries({ queryKey: prescriptionKeys.billing(data.data.patient_id) });
      }
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to mark prescription as dispensed.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Applies a clinical template to a prescription.
 * This will auto-fill diagnosis, notes, and medications.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useApplyTemplateToPrescription = (
  callbacks: MutationCallbacks<ApplyTemplateResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApplyTemplateResponse, AxiosError<ApiErrorResponse>, ApplyTemplateParams>({
    mutationFn: async ({ id, data }: ApplyTemplateParams) => {
      const response = await axiosInstance.post<ApplyTemplateResponse>(
        `/prescriptions/${id}/apply-template`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Template applied successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to apply template.';
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

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

export default {
  // Query hooks
  useGetPrescriptions,
  useGetPrescriptionsPaginated,
  useGetPrescriptionById,
  useGetPatientPrescriptions,
  useGetPrescriptionForBilling,

  // Mutation hooks
  useCreatePrescription,
  useUpdatePrescription,
  useDeletePrescription,
  useCancelPrescription,
  useMarkPrescriptionDispensed,
  useApplyTemplateToPrescription,

  // Utilities
  prescriptionKeys,
  extractErrorMessage,
  formatValidationErrors,
};