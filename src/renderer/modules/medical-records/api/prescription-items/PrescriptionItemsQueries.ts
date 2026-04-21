/**
 * PrescriptionItemsQueries.ts
 * ============================================================================
 * PRESCRIPTION ITEMS REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for prescription
 * item operations. Handles API communication, error handling, and toast notifications.
 * 
 * @module usePrescriptionItemsQueries
 * @description Provides type-safe, reusable hooks for prescription item CRUD operations.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  PrescriptionItem,
  PrescriptionItemResponse,
  PrescriptionItemsResponse,
} from './PrescriptionItemsTypes';
import type { MutationCallbacks, PrescriptionId } from '../prescription/PrescriptionTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const prescriptionItemKeys = {
  all: () => ['prescriptionItems'] as const,
  lists: () => [...prescriptionItemKeys.all(), 'list'] as const,
  list: (prescriptionId: PrescriptionId) => [...prescriptionItemKeys.lists(), prescriptionId] as const,
  details: () => [...prescriptionItemKeys.all(), 'detail'] as const,
  detail: (id: number) => [...prescriptionItemKeys.details(), id] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches all items for a specific prescription.
 * 
 * @param prescriptionId - Prescription ID
 * @param options - React Query options
 * @returns Query result with prescription items
 */
export const useGetPrescriptionItems = (
  prescriptionId: PrescriptionId,
  options?: Omit<UseQueryOptions<PrescriptionItemsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PrescriptionItemsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionItemKeys.list(prescriptionId),
    queryFn: async () => {
      const response = await axiosInstance.get<PrescriptionItemsResponse>(
        `/prescriptions/${prescriptionId}/items`
      );
      return response.data;
    },
    enabled: !!prescriptionId,
    ...options,
  });
};

/**
 * Fetches a single prescription item by ID.
 * 
 * @param id - Prescription item ID
 * @param options - React Query options
 * @returns Query result with prescription item
 */
export const useGetPrescriptionItemById = (
  id: number,
  options?: Omit<UseQueryOptions<PrescriptionItemResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<PrescriptionItemResponse, AxiosError<ApiErrorResponse>>({
    queryKey: prescriptionItemKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<PrescriptionItemResponse>(
        `/prescription-items/${id}`
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
 * Creates a new prescription item.
 * 
 * @param prescriptionId - Prescription ID
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useCreatePrescriptionItem = (
  prescriptionId: PrescriptionId,
  callbacks: MutationCallbacks<PrescriptionItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionItemResponse, AxiosError<ApiErrorResponse>, Partial<PrescriptionItem>>({
    mutationFn: async (data: Partial<PrescriptionItem>) => {
      const response = await axiosInstance.post<PrescriptionItemResponse>(
        `/prescriptions/${prescriptionId}/items`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Medication added successfully!';
      showToast('success', successMessage, 2000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.list(prescriptionId) });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescriptionId] });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to add medication.';
      showToast('error', apiMessage, 5000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates an existing prescription item.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useUpdatePrescriptionItem = (
  callbacks: MutationCallbacks<PrescriptionItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionItemResponse, AxiosError<ApiErrorResponse>, { id: number; data: Partial<PrescriptionItem> }>({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<PrescriptionItemResponse>(
        `/prescription-items/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Medication updated successfully!';
      showToast('success', successMessage, 2000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.lists() });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update medication.';
      showToast('error', apiMessage, 5000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Deletes a prescription item.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useDeletePrescriptionItem = (
  callbacks: MutationCallbacks<PrescriptionItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionItemResponse, AxiosError<ApiErrorResponse>, { id: number; prescriptionId: number }>({
    mutationFn: async ({ id }) => {
      const response = await axiosInstance.delete<PrescriptionItemResponse>(
        `/prescription-items/${id}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Medication removed successfully!';
      showToast('success', successMessage, 2000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.list(variables.prescriptionId) });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.prescriptionId] });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to remove medication.';
      showToast('error', apiMessage, 5000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Bulk update prescription items (add, update, delete multiple at once).
 * 
 * @param prescriptionId - Prescription ID
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useBulkUpdatePrescriptionItems = (
  prescriptionId: PrescriptionId,
  callbacks: MutationCallbacks<PrescriptionItemsResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<PrescriptionItemsResponse, AxiosError<ApiErrorResponse>, Partial<PrescriptionItem>[]>({
    mutationFn: async (items: Partial<PrescriptionItem>[]) => {
      const response = await axiosInstance.put<PrescriptionItemsResponse>(
        `/prescriptions/${prescriptionId}/items/bulk`,
        { items }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Medications updated successfully!';
      showToast('success', successMessage, 2000);
      
      queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.list(prescriptionId) });
      queryClient.invalidateQueries({ queryKey: ['prescriptions', prescriptionId] });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update medications.';
      showToast('error', apiMessage, 5000);
      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

export default {
  // Query hooks
  useGetPrescriptionItems,
  useGetPrescriptionItemById,

  // Mutation hooks
  useCreatePrescriptionItem,
  useUpdatePrescriptionItem,
  useDeletePrescriptionItem,
  useBulkUpdatePrescriptionItems,

  // Utilities
  prescriptionItemKeys,
};