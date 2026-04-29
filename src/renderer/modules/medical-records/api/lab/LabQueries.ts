/**
 * LabQueries.ts
 * ============================================================================
 * LAB MODULE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for lab operations.
 * Handles API communication, error handling, and toast notifications.
 * 
 * @module useLabQueries
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type { ActiveTemplatesResponse, ApiResponse, PaginatedResponse } from './LabTypes';
import {
  // Types
  type LabTemplate,
  type LabTest,
  type LabTemplateField,
  type LabRequest,
  type LabRequestItem,
  type LabResult,
  type CreateLabTemplateRequest,
  type UpdateLabTemplateRequest,
  type CreateLabTestRequest,
  type UpdateLabTestRequest,
  type CreateLabTemplateFieldRequest,
  type CreateLabRequestRequest,
  type UpdateLabRequestRequest,
  type CreateLabRequestItemRequest,
  type UpdateLabRequestItemRequest,
  type CreateLabResultRequest,
  type UpdateLabResultRequest,
  type CreateLabRequestWithItemsRequest,
  type AddItemsToLabRequestRequest,
  type BulkCreateLabResultsRequest,
  type BulkUpdateDisplayOrdersRequest,
  type DuplicateFieldsRequest,
  type LabTemplateFilters,
  type LabTestFilters,
  type LabTemplateFieldFilters,
  type LabRequestFilters,
  type LabRequestItemFilters,
  type LabResultFilters,
  type LabTestStatistics,
  type LabRequestStatistics,
  type LabResultStatistics,
  type TurnaroundTimeStatistics,
  // Enums
  LabRequestStatus,
  LabRequestItemStatus,
  LabResultFlag,
} from './LabTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const labKeys = {
  all: () => ['lab'] as const,
  
  // Templates
  templates: () => [...labKeys.all(), 'templates'] as const,
  templateList: (filters?: LabTemplateFilters) => [...labKeys.templates(), 'list', filters] as const,
  templateDetail: (uuid: string) => [...labKeys.templates(), 'detail', uuid] as const,
  templateActive: (facilityId?: number) => [...labKeys.templates(), 'active', facilityId] as const,
  templateShared: () => [...labKeys.templates(), 'shared'] as const,
  templateWithRelations: (uuid: string) => [...labKeys.templates(), 'with-relations', uuid] as const,
  
  // Tests
  tests: () => [...labKeys.all(), 'tests'] as const,
  testList: (filters?: LabTestFilters) => [...labKeys.tests(), 'list', filters] as const,
  testDetail: (uuid: string) => [...labKeys.tests(), 'detail', uuid] as const,
  testByTemplate: (templateUuid: string) => [...labKeys.tests(), 'by-template', templateUuid] as const,
  testByCategory: (category: string, facilityId?: number) => [...labKeys.tests(), 'by-category', category, facilityId] as const,
  testFasting: (facilityId?: number) => [...labKeys.tests(), 'fasting', facilityId] as const,
  testPopular: (facilityId: number, limit?: number) => [...labKeys.tests(), 'popular', facilityId, limit] as const,
  testStatistics: (uuid: string) => [...labKeys.tests(), 'statistics', uuid] as const,
  
  // Template Fields
  fields: () => [...labKeys.all(), 'fields'] as const,
  fieldList: (filters?: LabTemplateFieldFilters) => [...labKeys.fields(), 'list', filters] as const,
  fieldDetail: (uuid: string) => [...labKeys.fields(), 'detail', uuid] as const,
  fieldByTemplate: (templateUuid: string) => [...labKeys.fields(), 'by-template', templateUuid] as const,
  fieldActiveByTemplate: (templateUuid: string) => [...labKeys.fields(), 'active-by-template', templateUuid] as const,
  fieldRequiredByTemplate: (templateUuid: string) => [...labKeys.fields(), 'required-by-template', templateUuid] as const,
  fieldCriticalByTemplate: (templateUuid: string) => [...labKeys.fields(), 'critical-by-template', templateUuid] as const,
  
  // Requests
  requests: () => [...labKeys.all(), 'requests'] as const,
  requestList: (filters?: LabRequestFilters) => [...labKeys.requests(), 'list', filters] as const,
  requestDetail: (uuid: string) => [...labKeys.requests(), 'detail', uuid] as const,
  requestPending: (facilityId?: number) => [...labKeys.requests(), 'pending', facilityId] as const,
  requestRequiringAttention: (facilityId: number) => [...labKeys.requests(), 'requiring-attention', facilityId] as const,
  requestByFacility: (facilityId: number, filters?: LabRequestFilters) => [...labKeys.requests(), 'by-facility', facilityId, filters] as const,
  requestByPatient: (patientId: number, filters?: LabRequestFilters) => [...labKeys.requests(), 'by-patient', patientId, filters] as const,
  requestByVisit: (visitId: number) => [...labKeys.requests(), 'by-visit', visitId] as const,
  requestWithItems: (uuid: string) => [...labKeys.requests(), 'with-items', uuid] as const,
  requestWithFullDetails: (uuid: string) => [...labKeys.requests(), 'with-full-details', uuid] as const,
  requestStatistics: (facilityId: number, startDate: string, endDate: string) => [...labKeys.requests(), 'statistics', facilityId, startDate, endDate] as const,
  
  // Request Items
  items: () => [...labKeys.all(), 'items'] as const,
  itemList: (filters?: LabRequestItemFilters) => [...labKeys.items(), 'list', filters] as const,
  itemDetail: (uuid: string) => [...labKeys.items(), 'detail', uuid] as const,
  itemPending: (facilityId?: number) => [...labKeys.items(), 'pending', facilityId] as const,
  itemAbnormalResults: (facilityId?: number) => [...labKeys.items(), 'abnormal-results', facilityId] as const,
  itemAwaitingVerification: (facilityId?: number) => [...labKeys.items(), 'awaiting-verification', facilityId] as const,
  itemByLabRequest: (requestUuid: string) => [...labKeys.items(), 'by-lab-request', requestUuid] as const,
  itemByLabTest: (testUuid: string) => [...labKeys.items(), 'by-lab-test', testUuid] as const,
  itemWithResults: (uuid: string) => [...labKeys.items(), 'with-results', uuid] as const,
  itemWithFullDetails: (uuid: string) => [...labKeys.items(), 'with-full-details', uuid] as const,
  itemTurnaroundTime: (testUuid: string, startDate: string, endDate: string) => [...labKeys.items(), 'turnaround-time', testUuid, startDate, endDate] as const,
  
  // Results
  results: () => [...labKeys.all(), 'results'] as const,
  resultList: (filters?: LabResultFilters) => [...labKeys.results(), 'list', filters] as const,
  resultDetail: (uuid: string) => [...labKeys.results(), 'detail', uuid] as const,
  resultAbnormal: (facilityId?: number) => [...labKeys.results(), 'abnormal', facilityId] as const,
  resultCritical: (facilityId?: number) => [...labKeys.results(), 'critical', facilityId] as const,
  resultCriticalRequiringAttention: (facilityId: number) => [...labKeys.results(), 'critical-requiring-attention', facilityId] as const,
  resultUnverified: (facilityId?: number) => [...labKeys.results(), 'unverified', facilityId] as const,
  resultByFlag: (flag: LabResultFlag, facilityId?: number) => [...labKeys.results(), 'by-flag', flag, facilityId] as const,
  resultByPatient: (patientId: number) => [...labKeys.results(), 'by-patient', patientId] as const,
  resultByLabRequestItem: (itemUuid: string) => [...labKeys.results(), 'by-lab-request-item', itemUuid] as const,
  resultByTemplateField: (fieldUuid: string) => [...labKeys.results(), 'by-template-field', fieldUuid] as const,
  resultWithRelations: (uuid: string) => [...labKeys.results(), 'with-relations', uuid] as const,
  resultTrends: (testUuid: string, patientId: number, limit?: number) => [...labKeys.results(), 'trends', testUuid, patientId, limit] as const,
  resultStatistics: (facilityId: number, startDate: string, endDate: string) => [...labKeys.results(), 'statistics', facilityId, startDate, endDate] as const,
};

/* -------------------------------------------------------------------------- */
/*                          LAB TEMPLATE QUERIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Get all lab templates with pagination
 */
export const useGetLabTemplates = (
  filters?: LabTemplateFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabTemplate>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.templateList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/templates', { params: filters });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get single lab template by UUID
 */
export const useGetLabTemplate = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.templateDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/templates/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get active templates
 */
export const useGetActiveTemplates = (
  facilityId?: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<ActiveTemplatesResponse>, AxiosError<ApiResponse<null>>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: labKeys.templateActive(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/templates/active', {
        params: { facility_id: facilityId },
      });

      return response.data;
    },
    ...options,
  });
};

/**
 * Get shared templates
 */
export const useGetSharedTemplates = (
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplate[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.templateShared(),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/templates/shared');
      return response.data;
    },
    ...options,
  });
};

/**
 * Get template with its tests and fields
 */
export const useGetTemplateWithRelations = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.templateWithRelations(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/templates/${uuid}/with-relations`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Create lab template mutation
 */
export const useCreateLabTemplate = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplate>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>, CreateLabTemplateRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/templates', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Template created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update lab template mutation
 */
export const useUpdateLabTemplate = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplate>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>, { uuid: string; data: UpdateLabTemplateRequest }>({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/templates/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Template updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templateDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Delete lab template mutation
 */
export const useDeleteLabTemplate = (callbacks?: { onSuccess?: (data: ApiResponse<null>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.delete(`/lab/templates/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Activate lab template mutation
 */
export const useActivateLabTemplate = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplate>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.post(`/lab/templates/${uuid}/activate`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Template activated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templateDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to activate template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Deactivate lab template mutation
 */
export const useDeactivateLabTemplate = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplate>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.post(`/lab/templates/${uuid}/deactivate`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Template deactivated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templateDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to deactivate template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Copy template to facility mutation
 */
export const useCopyTemplateToFacility = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplate>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplate>, AxiosError<ApiResponse<null>>, { uuid: string; facilityId: number }>({
    mutationFn: async ({ uuid, facilityId }) => {
      const response = await axiosInstance.post(`/lab/templates/${uuid}/copy-to-facility`, { facility_id: facilityId });
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Template copied successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.templates() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to copy template';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                            LAB TEST QUERIES                                */
/* -------------------------------------------------------------------------- */

/**
 * Get all lab tests with pagination
 */
export const useGetLabTests = (
  filters?: LabTestFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabTest>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/tests', { params: filters });
      console.log("Hook response");
      console.log(response.data.data.tests);
      return response.data.data.tests;
    },
    ...options,
  });
};

/**
 * Get single lab test by UUID
 */
export const useGetLabTest = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTest>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/tests/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get tests by template
 */
export const useGetTestsByTemplate = (
  templateUuid: string,
  isActive?: boolean,
  options?: Omit<UseQueryOptions<ApiResponse<LabTest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testByTemplate(templateUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/tests/template/${templateUuid}`, { params: { is_active: isActive } });
      return response.data;
    },
    enabled: !!templateUuid,
    ...options,
  });
};

/**
 * Get tests by category
 */
export const useGetTestsByCategory = (
  category: string,
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabTest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testByCategory(category, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/tests/category/${encodeURIComponent(category)}`, { params: { facility_id: facilityId } });
      return response.data;
    },
    enabled: !!category,
    ...options,
  });
};

/**
 * Get tests requiring fasting
 */
export const useGetTestsRequiringFasting = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabTest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testFasting(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/tests/fasting', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get popular tests
 */
export const useGetPopularTests = (
  facilityId: number,
  limit: number = 10,
  options?: Omit<UseQueryOptions<ApiResponse<LabTest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testPopular(facilityId, limit),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/tests/popular', { params: { facility_id: facilityId, limit } });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Get test statistics
 */
export const useGetTestStatistics = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTestStatistics>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.testStatistics(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/tests/${uuid}/statistics`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Create lab test mutation
 */
export const useCreateLabTest = (callbacks?: { onSuccess?: (data: ApiResponse<LabTest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTest>, AxiosError<ApiResponse<null>>, CreateLabTestRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/tests', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Test created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.tests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create test';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update lab test mutation
 */
export const useUpdateLabTest = (callbacks?: { onSuccess?: (data: ApiResponse<LabTest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTest>, AxiosError<ApiResponse<null>>, { uuid: string; data: UpdateLabTestRequest }>({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/tests/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Test updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.testDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.tests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update test';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Delete lab test mutation
 */
export const useDeleteLabTest = (callbacks?: { onSuccess?: (data: ApiResponse<null>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.delete(`/lab/tests/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Test deleted successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.tests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete test';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                        LAB TEMPLATE FIELD QUERIES                          */
/* -------------------------------------------------------------------------- */

/**
 * Get all template fields with pagination
 */
export const useGetLabTemplateFields = (
  filters?: LabTemplateFieldFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabTemplateField>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/template-fields', { params: filters });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get single template field by UUID
 */
export const useGetLabTemplateField = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplateField>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/template-fields/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get fields by template
 */
export const useGetFieldsByTemplate = (
  templateUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldByTemplate(templateUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/template-fields/template/${templateUuid}`);
      return response.data;
    },
    enabled: !!templateUuid,
    ...options,
  });
};

/**
 * Get active fields by template
 */
export const useGetActiveFieldsByTemplate = (
  templateUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldActiveByTemplate(templateUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/template-fields/template/${templateUuid}/active`);
      return response.data;
    },
    enabled: !!templateUuid,
    ...options,
  });
};

/**
 * Get required fields by template
 */
export const useGetRequiredFieldsByTemplate = (
  templateUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldRequiredByTemplate(templateUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/template-fields/template/${templateUuid}/required`);
      return response.data;
    },
    enabled: !!templateUuid,
    ...options,
  });
};

/**
 * Get critical fields by template
 */
export const useGetCriticalFieldsByTemplate = (
  templateUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.fieldCriticalByTemplate(templateUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/template-fields/template/${templateUuid}/critical`);
      return response.data;
    },
    enabled: !!templateUuid,
    ...options,
  });
};

/**
 * Create template field mutation
 */
export const useCreateLabTemplateField = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplateField>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplateField>, AxiosError<ApiResponse<null>>, CreateLabTemplateFieldRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/template-fields', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Field created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.fields() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create field';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Bulk create fields mutation
 */
export const useBulkCreateFields = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplateField[]>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>, { templateUuid: string; fields: CreateLabTemplateFieldRequest[] }>({
    mutationFn: async ({ templateUuid, fields }) => {
      const response = await axiosInstance.post(`/lab/template-fields/template/${templateUuid}/bulk`, { fields });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Fields created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.fieldByTemplate(variables.templateUuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create fields';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Bulk update display orders mutation
 */
export const useBulkUpdateDisplayOrders = (callbacks?: { onSuccess?: (data: ApiResponse<null>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, AxiosError<ApiResponse<null>>, BulkUpdateDisplayOrdersRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.put('/lab/template-fields/bulk/orders', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Display orders updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.fields() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update display orders';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Duplicate fields mutation
 */
export const useDuplicateFields = (callbacks?: { onSuccess?: (data: ApiResponse<LabTemplateField[]>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabTemplateField[]>, AxiosError<ApiResponse<null>>, DuplicateFieldsRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/template-fields/duplicate', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Fields duplicated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.fields() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to duplicate fields';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           LAB REQUEST QUERIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Get all lab requests with pagination
 */
export const useGetLabRequests = (
  filters?: LabRequestFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabRequest>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/requests', { params: filters });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get single lab request by UUID
 */
export const useGetLabRequest = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get pending lab requests
 */
export const useGetPendingRequests = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestPending(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/requests/pending', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get requests requiring attention (STAT priority)
 */
export const useGetRequestsRequiringAttention = (
  facilityId: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequest[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestRequiringAttention(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/requests/requiring-attention', { params: { facility_id: facilityId } });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Get requests by facility
 */
export const useGetRequestsByFacility = (
  facilityId: number,
  filters?: LabRequestFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabRequest>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestByFacility(facilityId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/facility/${facilityId}`, { params: filters });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Get requests by patient
 */
export const useGetRequestsByPatient = (
  patientId: number,
  filters?: LabRequestFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabRequest>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestByPatient(patientId, filters),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/patient/${patientId}`, { params: filters });
      return response.data;
    },
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Get requests by visit
 */
export const useGetRequestsByVisit = (
  visitId: number,
  options?: Omit<
    UseQueryOptions<LabRequest[], AxiosError<ApiResponse<null>>>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: labKeys.requestByVisit(visitId),
    queryFn: async (): Promise<LabRequest[]> => {
      const response = await axiosInstance.get(`/lab/requests/visit/${visitId}`);
      return response.data.data.requests;
    },
    enabled: !!visitId,
    ...options,
  });
};

/**
 * Get request with its items
 */
export const useGetRequestWithItems = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestWithItems(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/${uuid}/with-items`);

      return response.data.data.request;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get request with full details (items and results)
 */
export const useGetRequestWithFullDetails = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestWithFullDetails(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/${uuid}/with-full-details`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get request statistics
 */
export const useGetRequestStatistics = (
  facilityId: number,
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestStatistics>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.requestStatistics(facilityId, startDate, endDate),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/requests/statistics', { params: { facility_id: facilityId, start_date: startDate, end_date: endDate } });
      return response.data;
    },
    enabled: !!facilityId && !!startDate && !!endDate,
    ...options,
  });
};

/**
 * Create lab request mutation
 */
export const useCreateLabRequest = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, CreateLabRequestRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/requests', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Lab request created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create lab request';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Create lab request with items mutation
 */
export const useCreateLabRequestWithItems = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, CreateLabRequestWithItemsRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/requests/with-items', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Lab request with items created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create lab request with items';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update lab request mutation
 */
export const useUpdateLabRequest = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, { uuid: string; data: UpdateLabRequestRequest }>({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/requests/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Lab request updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requestDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update lab request';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update request status mutation
 */
export const useUpdateRequestStatus = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, { uuid: string; status: LabRequestStatus }>({
    mutationFn: async ({ uuid, status }) => {
      const response = await axiosInstance.put(`/lab/requests/${uuid}/status`, { status });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Request status updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requestDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update request status';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Cancel lab request mutation
 */
export const useCancelLabRequest = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, { uuid: string; reason: string; cancelledByStaffId?: number }>({
    mutationFn: async ({ uuid, reason, cancelledByStaffId }) => {
      const response = await axiosInstance.post(`/lab/requests/${uuid}/cancel`, { reason, cancelled_by_staff_id: cancelledByStaffId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Lab request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requestDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to cancel lab request';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Add items to request mutation
 */
export const useAddItemsToRequest = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequest>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequest>, AxiosError<ApiResponse<null>>, { uuid: string; items: AddItemsToLabRequestRequest['items'] }>({
    mutationFn: async ({ uuid, items }) => {
      const response = await axiosInstance.post(`/lab/requests/${uuid}/add-items`, { items });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Items added successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.requestDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.requestWithItems(variables.uuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add items';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                         LAB REQUEST ITEM QUERIES                           */
/* -------------------------------------------------------------------------- */

/**
 * Get all Lab Request Tests with pagination
 */
export const useGetLabRequestItems = (
  filters?: LabRequestItemFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabRequestItem>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/request-items', { params: filters });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get single lab request item by UUID
 */
export const useGetLabRequestItem = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get pending items
 */
export const useGetPendingItems = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemPending(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/request-items/pending', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get items with abnormal results
 */
export const useGetItemsWithAbnormalResults = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemAbnormalResults(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/request-items/abnormal-results', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get items awaiting verification
 */
export const useGetItemsAwaitingVerification = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemAwaitingVerification(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/request-items/awaiting-verification', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get items by lab request
 */
export const useGetItemsByLabRequest = (
  requestUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemByLabRequest(requestUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/request/${requestUuid}`);
      return response.data;
    },
    enabled: !!requestUuid,
    ...options,
  });
};

/**
 * Get items by lab test
 */
export const useGetItemsByLabTest = (
  testUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemByLabTest(testUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/test/${testUuid}`);
      return response.data;
    },
    enabled: !!testUuid,
    ...options,
  });
};

/**
 * Get item with its results
 */
export const useGetItemWithResults = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemWithResults(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/${uuid}/with-results`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get item with full details
 */
export const useGetItemWithFullDetails = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemWithFullDetails(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/${uuid}/with-full-details`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get turnaround time statistics
 */
export const useGetTurnaroundTimeStatistics = (
  testUuid: string,
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<ApiResponse<TurnaroundTimeStatistics>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.itemTurnaroundTime(testUuid, startDate, endDate),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/request-items/test/${testUuid}/turnaround-time`, { params: { start_date: startDate, end_date: endDate } });
      return response.data;
    },
    enabled: !!testUuid && !!startDate && !!endDate,
    ...options,
  });
};

/**
 * Create lab request item mutation
 */
export const useCreateLabRequestItem = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, CreateLabRequestItemRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/request-items', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Item created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.items() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create item';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update lab request item mutation
 */
export const useUpdateLabRequestItem = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, { uuid: string; data: UpdateLabRequestItemRequest }>({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/request-items/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Item updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.itemDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.items() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update item';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update item status mutation
 */
export const useUpdateItemStatus = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, { uuid: string; status: LabRequestItemStatus }>({
    mutationFn: async ({ uuid, status }) => {
      const response = await axiosInstance.put(`/lab/request-items/${uuid}/status`, { status });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Item status updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.itemDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.items() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update item status';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Mark sample collected mutation
 */
export const useMarkSampleCollected = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, { uuid: string; collectedByStaffId: number; sampleIdentifier?: string }>({
    mutationFn: async ({ uuid, collectedByStaffId, sampleIdentifier }) => {
      const response = await axiosInstance.post(`/lab/request-items/${uuid}/collect-sample`, { 
        collected_by_staff_id: collectedByStaffId, 
        sample_identifier: sampleIdentifier 
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Sample marked as collected');
      queryClient.invalidateQueries({ queryKey: labKeys.itemDetail(variables.uuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark sample as collected';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Mark item as verified mutation
 */
export const useVerifyItem = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, { uuid: string; verifiedByStaffId: number }>({
    mutationFn: async ({ uuid, verifiedByStaffId }) => {
      const response = await axiosInstance.post(`/lab/request-items/${uuid}/verify`, { verified_by_staff_id: verifiedByStaffId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Item verified successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.itemDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.items() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to verify item';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Cancel item mutation
 */
export const useCancelItem = (callbacks?: { onSuccess?: (data: ApiResponse<LabRequestItem>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabRequestItem>, AxiosError<ApiResponse<null>>, { uuid: string; reason: string; cancelledByStaffId?: number }>({
    mutationFn: async ({ uuid, reason, cancelledByStaffId }) => {
      const response = await axiosInstance.post(`/lab/request-items/${uuid}/cancel`, { reason, cancelled_by_staff_id: cancelledByStaffId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Item cancelled successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.itemDetail(variables.uuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to cancel item';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Bulk update items status mutation
 */
export const useBulkUpdateItemsStatus = (callbacks?: { onSuccess?: (data: ApiResponse<null>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, AxiosError<ApiResponse<null>>, { itemUuids: string[]; status: LabRequestItemStatus }>({
    mutationFn: async ({ itemUuids, status }) => {
      const response = await axiosInstance.post('/lab/request-items/bulk/status', { item_uuids: itemUuids, status });
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Items updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.items() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update items';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                            LAB RESULT QUERIES                              */
/* -------------------------------------------------------------------------- */

/**
 * Get all lab results with pagination
 */
export const useGetLabResults = (
  filters?: LabResultFilters,
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabResult>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultList(filters),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results', { params: filters });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get single lab result by UUID
 */
export const useGetLabResult = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultDetail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get abnormal results
 */
export const useGetAbnormalResults = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultAbnormal(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results/abnormal', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get critical results
 */
export const useGetCriticalResults = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultCritical(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results/critical', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get critical results requiring attention
 */
export const useGetCriticalResultsRequiringAttention = (
  facilityId: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultCriticalRequiringAttention(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results/critical/requiring-attention', { params: { facility_id: facilityId } });
      return response.data;
    },
    enabled: !!facilityId,
    ...options,
  });
};

/**
 * Get unverified results
 */
export const useGetUnverifiedResults = (
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultUnverified(facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results/unverified', { params: { facility_id: facilityId } });
      return response.data;
    },
    ...options,
  });
};

/**
 * Get results by flag
 */
export const useGetResultsByFlag = (
  flag: LabResultFlag,
  facilityId?: number,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultByFlag(flag, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/flag/${flag}`, { params: { facility_id: facilityId } });
      return response.data;
    },
    enabled: !!flag,
    ...options,
  });
};

/**
 * Get results by patient
 */
export const useGetResultsByPatient = (
  patientId: number,
  filters?: { flag?: LabResultFlag; date_from?: string; date_to?: string; order_by?: string; order_direction?: 'asc' | 'desc'; per_page?: number },
  options?: Omit<UseQueryOptions<ApiResponse<PaginatedResponse<LabResult>>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultByPatient(patientId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/patient/${patientId}`, { params: filters });
      return response.data;
    },
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Get results by lab request item
 */
export const useGetResultsByLabRequestItem = (
  itemUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultByLabRequestItem(itemUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/item/${itemUuid}`);
      return response.data;
    },
    enabled: !!itemUuid,
    ...options,
  });
};

/**
 * Get results by template field
 */
export const useGetResultsByTemplateField = (
  fieldUuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultByTemplateField(fieldUuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/field/${fieldUuid}`);
      return response.data;
    },
    enabled: !!fieldUuid,
    ...options,
  });
};

/**
 * Get result with relationships
 */
export const useGetResultWithRelations = (
  uuid: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultWithRelations(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/${uuid}/with-relations`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Get result trends
 */
export const useGetResultTrends = (
  testUuid: string,
  patientId: number,
  limit: number = 10,
  options?: Omit<UseQueryOptions<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultTrends(testUuid, patientId, limit),
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/results/test/${testUuid}/trends`, { params: { patient_id: patientId, limit } });
      return response.data;
    },
    enabled: !!testUuid && !!patientId,
    ...options,
  });
};

/**
 * Get result statistics
 */
export const useGetResultStatistics = (
  facilityId: number,
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<ApiResponse<LabResultStatistics>, AxiosError<ApiResponse<null>>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: labKeys.resultStatistics(facilityId, startDate, endDate),
    queryFn: async () => {
      const response = await axiosInstance.get('/lab/results/statistics', { params: { facility_id: facilityId, start_date: startDate, end_date: endDate } });
      return response.data;
    },
    enabled: !!facilityId && !!startDate && !!endDate,
    ...options,
  });
};

/**
 * Create lab result mutation
 */
export const useCreateLabResult = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>, CreateLabResultRequest>({
    mutationFn: async (data) => {
      const response = await axiosInstance.post('/lab/results', data);
      return response.data;
    },
    onSuccess: (data) => {
      showToast('success', data.message || 'Result created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create result';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Bulk create results mutation
 */
export const useBulkCreateResults = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult[]>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult[]>, AxiosError<ApiResponse<null>>, { itemUuid: string; results: BulkCreateLabResultsRequest['results'] }>({
    mutationFn: async ({ itemUuid, results }) => {
      const response = await axiosInstance.post(`/lab/results/item/${itemUuid}/bulk`, { results });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Results created successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.resultByLabRequestItem(variables.itemUuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create results';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Update lab result mutation
 */
export const useUpdateLabResult = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>, { uuid: string; data: UpdateLabResultRequest }>({
    mutationFn: async ({ uuid, data }) => {
      const response = await axiosInstance.put(`/lab/results/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Result updated successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.resultDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update result';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Verify result mutation
 */
export const useVerifyResult = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>, { uuid: string; verifiedByStaffId: number }>({
    mutationFn: async ({ uuid, verifiedByStaffId }) => {
      const response = await axiosInstance.post(`/lab/results/${uuid}/verify`, { verified_by_staff_id: verifiedByStaffId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Result verified successfully');
      queryClient.invalidateQueries({ queryKey: labKeys.resultDetail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: labKeys.results() });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to verify result';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Mark critical alert sent mutation
 */
export const useMarkCriticalAlertSent = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.post(`/lab/results/${uuid}/critical-alert-sent`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Critical alert marked as sent');
      queryClient.invalidateQueries({ queryKey: labKeys.resultDetail(variables.uuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark critical alert';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/**
 * Recalculate result flag mutation
 */
export const useRecalculateResultFlag = (callbacks?: { onSuccess?: (data: ApiResponse<LabResult>) => void; onError?: (error: AxiosError<ApiResponse<null>>) => void }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LabResult>, AxiosError<ApiResponse<null>>, { uuid: string }>({
    mutationFn: async ({ uuid }) => {
      const response = await axiosInstance.post(`/lab/results/${uuid}/recalculate-flag`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      showToast('success', data.message || 'Result flag recalculated');
      queryClient.invalidateQueries({ queryKey: labKeys.resultDetail(variables.uuid) });
      callbacks?.onSuccess?.(data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to recalculate flag';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                              EXPORT ALL                                    */
/* -------------------------------------------------------------------------- */

export default {
  // Query keys
  labKeys,
  
  // Template queries
  useGetLabTemplates,
  useGetLabTemplate,
  useGetActiveTemplates,
  useGetSharedTemplates,
  useGetTemplateWithRelations,
  useCreateLabTemplate,
  useUpdateLabTemplate,
  useDeleteLabTemplate,
  useActivateLabTemplate,
  useDeactivateLabTemplate,
  useCopyTemplateToFacility,
  
  // Test queries
  useGetLabTests,
  useGetLabTest,
  useGetTestsByTemplate,
  useGetTestsByCategory,
  useGetTestsRequiringFasting,
  useGetPopularTests,
  useGetTestStatistics,
  useCreateLabTest,
  useUpdateLabTest,
  useDeleteLabTest,
  
  // Field queries
  useGetLabTemplateFields,
  useGetLabTemplateField,
  useGetFieldsByTemplate,
  useGetActiveFieldsByTemplate,
  useGetRequiredFieldsByTemplate,
  useGetCriticalFieldsByTemplate,
  useCreateLabTemplateField,
  useBulkCreateFields,
  useBulkUpdateDisplayOrders,
  useDuplicateFields,
  
  // Request queries
  useGetLabRequests,
  useGetLabRequest,
  useGetPendingRequests,
  useGetRequestsRequiringAttention,
  useGetRequestsByFacility,
  useGetRequestsByPatient,
  useGetRequestsByVisit,
  useGetRequestWithItems,
  useGetRequestWithFullDetails,
  useGetRequestStatistics,
  useCreateLabRequest,
  useCreateLabRequestWithItems,
  useUpdateLabRequest,
  useUpdateRequestStatus,
  useCancelLabRequest,
  useAddItemsToRequest,
  
  // Item queries
  useGetLabRequestItems,
  useGetLabRequestItem,
  useGetPendingItems,
  useGetItemsWithAbnormalResults,
  useGetItemsAwaitingVerification,
  useGetItemsByLabRequest,
  useGetItemsByLabTest,
  useGetItemWithResults,
  useGetItemWithFullDetails,
  useGetTurnaroundTimeStatistics,
  useCreateLabRequestItem,
  useUpdateLabRequestItem,
  useUpdateItemStatus,
  useMarkSampleCollected,
  useVerifyItem,
  useCancelItem,
  useBulkUpdateItemsStatus,
  
  // Result queries
  useGetLabResults,
  useGetLabResult,
  useGetAbnormalResults,
  useGetCriticalResults,
  useGetCriticalResultsRequiringAttention,
  useGetUnverifiedResults,
  useGetResultsByFlag,
  useGetResultsByPatient,
  useGetResultsByLabRequestItem,
  useGetResultsByTemplateField,
  useGetResultWithRelations,
  useGetResultTrends,
  useGetResultStatistics,
  useCreateLabResult,
  useBulkCreateResults,
  useUpdateLabResult,
  useVerifyResult,
  useMarkCriticalAlertSent,
  useRecalculateResultFlag,
};