/**
 * ClinicalTemplateQueries.ts
 * ============================================================================
 * CLINICAL TEMPLATE REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for clinical
 * template operations. Handles API communication, error handling, and toast notifications.
 * 
 * @module useClinicalTemplateQueries
 * @description Provides type-safe, reusable hooks for all template CRUD operations.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CategoriesResponse,
  CreateTemplateRequest,
  DeleteTemplateResponse,
  FacilityTemplatesParams,
  GetFacilityTemplatesResponse,
  GetTemplatesByCategoryResponse,
  GetTemplatesResponse,
  SearchTemplatesResponse,
  TemplateFilters,
  TemplateResponse,
  ToggleStatusResponse,
  UpdateTemplateRequest,
} from './ClinicalTemplateTypes';
 import {
  TemplateCategory,
  TemplateVisibility,
} from './ClinicalTemplateTypes';
import type { MutationCallbacks } from  '../prescription/PrescriptionTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const templateKeys = {
  all: () => ['clinicalTemplates'] as const,
  lists: () => [...templateKeys.all(), 'list'] as const,
  list: (filters: TemplateFilters = {}) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all(), 'detail'] as const,
  detail: (id: number) => [...templateKeys.details(), id] as const,
  facility: (facilityId: number, includeSystem: boolean = true) =>
    [...templateKeys.all(), 'facility', facilityId, includeSystem] as const,
  category: (category: TemplateCategory, facilityId: number) =>
    [...templateKeys.all(), 'category', category, facilityId] as const,
  search: (keyword: string, facilityId: number) =>
    [...templateKeys.all(), 'search', keyword, facilityId] as const,
  categories: () => [...templateKeys.all(), 'categories'] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches all clinical templates with optional filtering.
 * 
 * @param filters - Query parameters for filtering
 * @param options - React Query options
 * @returns Query result with templates list and metadata
 */
export const useGetTemplates = (
  filters: TemplateFilters = {},
  options?: Omit<UseQueryOptions<GetTemplatesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetTemplatesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetTemplatesResponse>(
        '/clinical-templates',
        { params: filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches templates for a specific facility (for dropdown on prescription page).
 * 
 * @param params - Facility ID and include system flag
 * @param options - React Query options
 * @returns Query result with facility templates
 */
export const useGetFacilityTemplates = (
  params: FacilityTemplatesParams,
  options?: Omit<UseQueryOptions<GetFacilityTemplatesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetFacilityTemplatesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.facility(params.facility_id, params.include_system),
    queryFn: async () => {
      const response = await axiosInstance.get<GetFacilityTemplatesResponse>(
        '/clinical-templates/facility',
        { params }
      );
      return response.data;
    },
    enabled: !!params.facility_id,
    ...options,
  });
};

/**
 * Fetches templates by category for a specific facility.
 * 
 * @param category - Template category
 * @param facilityId - Facility ID
 * @param options - React Query options
 * @returns Query result with templates in category
 */
export const useGetTemplatesByCategory = (
  category: TemplateCategory,
  facilityId: number,
  options?: Omit<UseQueryOptions<GetTemplatesByCategoryResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetTemplatesByCategoryResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.category(category, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<GetTemplatesByCategoryResponse>(
        `/clinical-templates/category/${encodeURIComponent(category)}`,
        { params: { facility_id: facilityId } }
      );
      return response.data;
    },
    enabled: !!category && !!facilityId,
    ...options,
  });
};

/**
 * Fetches a single clinical template by ID.
 * 
 * @param id - Template ID
 * @param options - React Query options
 * @returns Query result with template details
 */
export const useGetTemplateById = (
  id: number,
  options?: Omit<UseQueryOptions<TemplateResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TemplateResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<TemplateResponse>(
        `/clinical-templates/${id}`
      );
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Searches templates by keyword.
 * 
 * @param keyword - Search keyword
 * @param facilityId - Facility ID
 * @param options - React Query options
 * @returns Query result with search results
 */
export const useSearchTemplates = (
  keyword: string,
  facilityId: number,
  options?: Omit<UseQueryOptions<SearchTemplatesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SearchTemplatesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.search(keyword, facilityId),
    queryFn: async () => {
      const response = await axiosInstance.get<SearchTemplatesResponse>(
        '/clinical-templates/search',
        { params: { keyword, facility_id: facilityId } }
      );
      return response.data;
    },
    enabled: !!keyword && keyword.length >= 2 && !!facilityId,
    ...options,
  });
};

/**
 * Fetches all available template categories.
 * 
 * @param options - React Query options
 * @returns Query result with categories list
 */
export const useGetTemplateCategories = (
  options?: Omit<UseQueryOptions<CategoriesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoriesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: templateKeys.categories(),
    queryFn: async () => {
      const response = await axiosInstance.get<CategoriesResponse>(
        '/clinical-templates/categories'
      );
      return response.data;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new clinical template.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useCreateTemplate = (
  callbacks: MutationCallbacks<TemplateResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<TemplateResponse, AxiosError<ApiErrorResponse>, CreateTemplateRequest>({
    mutationFn: async (data: CreateTemplateRequest) => {
      const response = await axiosInstance.post<TemplateResponse>(
        '/clinical-templates',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Template created successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.categories() });
      
      if (data.data?.facility_id) {
        queryClient.invalidateQueries({ queryKey: templateKeys.facility(data.data.facility_id) });
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create template.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Updates an existing clinical template.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useUpdateTemplate = (
  callbacks: MutationCallbacks<TemplateResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<TemplateResponse, AxiosError<ApiErrorResponse>, { id: number; data: UpdateTemplateRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await axiosInstance.put<TemplateResponse>(
        `/clinical-templates/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Template updated successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      
      if (data.data?.facility_id) {
        queryClient.invalidateQueries({ queryKey: templateKeys.facility(data.data.facility_id) });
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update template.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Deletes a clinical template.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useDeleteTemplate = (
  callbacks: MutationCallbacks<DeleteTemplateResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DeleteTemplateResponse, AxiosError<ApiErrorResponse>, { id: number; facilityId?: number }>({
    mutationFn: async ({ id }) => {
      const response = await axiosInstance.delete<DeleteTemplateResponse>(
        `/clinical-templates/${id}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Template deleted successfully!';
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      
      if (variables.facilityId) {
        queryClient.invalidateQueries({ queryKey: templateKeys.facility(variables.facilityId) });
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete template.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Toggles a template's active status (activate/deactivate).
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useToggleTemplateStatus = (
  callbacks: MutationCallbacks<ToggleStatusResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<ToggleStatusResponse, AxiosError<ApiErrorResponse>, { id: number; facilityId?: number }>({
    mutationFn: async ({ id }) => {
      const response = await axiosInstance.post<ToggleStatusResponse>(
        `/clinical-templates/${id}/toggle-status`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const newStatus = data.data?.is_active ? 'activated' : 'deactivated';
      const successMessage = `Template ${newStatus} successfully!`;
      showToast('success', successMessage, 8000);
      
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      
      if (variables.facilityId) {
        queryClient.invalidateQueries({ queryKey: templateKeys.facility(variables.facilityId) });
      }
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to toggle template status.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to get category badge color.
 */
export const getCategoryBadgeColor = (category: TemplateCategory): string => {
  const colorMap: Record<TemplateCategory, string> = {
    [TemplateCategory.GENERAL_PRACTICE]: 'bg-blue-100 text-blue-800',
    [TemplateCategory.EMERGENCY_MEDICINE]: 'bg-red-100 text-red-800',
    [TemplateCategory.PEDIATRICS]: 'bg-pink-100 text-pink-800',
    [TemplateCategory.GERIATRICS]: 'bg-purple-100 text-purple-800',
    [TemplateCategory.CARDIOLOGY]: 'bg-red-100 text-red-800',
    [TemplateCategory.NEUROLOGY]: 'bg-indigo-100 text-indigo-800',
    [TemplateCategory.PULMONOLOGY]: 'bg-cyan-100 text-cyan-800',
    [TemplateCategory.GASTROENTEROLOGY]: 'bg-emerald-100 text-emerald-800',
    [TemplateCategory.ENDOCRINOLOGY]: 'bg-orange-100 text-orange-800',
    [TemplateCategory.INFECTIOUS_DISEASES]: 'bg-amber-100 text-amber-800',
    [TemplateCategory.PSYCHIATRY]: 'bg-violet-100 text-violet-800',
    [TemplateCategory.OBSTETRICS_GYNECOLOGY]: 'bg-rose-100 text-rose-800',
    [TemplateCategory.ORTHOPEDICS]: 'bg-lime-100 text-lime-800',
    [TemplateCategory.DERMATOLOGY]: 'bg-fuchsia-100 text-fuchsia-800',
    [TemplateCategory.OPHTHALMOLOGY]: 'bg-sky-100 text-sky-800',
    [TemplateCategory.DENTISTRY]: 'bg-teal-100 text-teal-800',
    [TemplateCategory.UROLOGY]: 'bg-blue-100 text-blue-800',
    [TemplateCategory.NEPHROLOGY]: 'bg-indigo-100 text-indigo-800',
    [TemplateCategory.ONCOLOGY]: 'bg-purple-100 text-purple-800',
    [TemplateCategory.RHEUMATOLOGY]: 'bg-pink-100 text-pink-800',
    [TemplateCategory.ALLERGY_IMMUNOLOGY]: 'bg-amber-100 text-amber-800',
    [TemplateCategory.SPORTS_MEDICINE]: 'bg-green-100 text-green-800',
    [TemplateCategory.PAIN_MANAGEMENT]: 'bg-gray-100 text-gray-800',
    [TemplateCategory.PALLIATIVE_CARE]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Helper function to get visibility badge color.
 */
export const getVisibilityBadgeColor = (visibility: TemplateVisibility): string => {
  const colorMap: Record<TemplateVisibility, string> = {
    [TemplateVisibility.SYSTEM_WIDE]: 'bg-purple-100 text-purple-800',
    [TemplateVisibility.FACILITY_ONLY]: 'bg-blue-100 text-blue-800',
    [TemplateVisibility.DEPARTMENT_ONLY]: 'bg-green-100 text-green-800',
    [TemplateVisibility.PRIVATE]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[visibility] || 'bg-gray-100 text-gray-800';
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

export default {
  // Query hooks
  useGetTemplates,
  useGetFacilityTemplates,
  useGetTemplatesByCategory,
  useGetTemplateById,
  useSearchTemplates,
  useGetTemplateCategories,

  // Mutation hooks
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useToggleTemplateStatus,

  // Utilities
  templateKeys,
  getCategoryBadgeColor,
  getVisibilityBadgeColor,
};