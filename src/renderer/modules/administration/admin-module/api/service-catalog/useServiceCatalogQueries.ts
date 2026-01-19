/**
 * ============================================================================
 * SERVICE CATALOG REACT QUERY HOOKS
 * ============================================================================
 * 
 * React Query hooks for service catalog management operations.
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CheckEffectivenessParams,
  CheckEffectivenessResponse,
  CreateServiceCatalogRequest,
  DeleteServiceCatalogParams,
  EffectiveServicesParams,
  MutationCallbacks,
  RestoreServiceCatalogParams,
  SearchServiceCatalogsParams,
  ServiceCatalogFilters,
  ServiceCatalogListResponse,
  ServiceCatalogResponse,
  ServiceCatalogSearchResponse,
  ServiceUUID,
  UpdateServiceCatalogParams,
  ServiceCategoryParam,
  CodeSystemParam,
} from './serviceCatalogTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const serviceCatalogKeys = {
  all: ['service-catalogs'] as const,
  lists: () => [...serviceCatalogKeys.all, 'list'] as const,
  list: (filters: ServiceCatalogFilters) => [...serviceCatalogKeys.lists(), filters] as const,
  details: () => [...serviceCatalogKeys.all, 'detail'] as const,
  detail: (uuid: ServiceUUID) => [...serviceCatalogKeys.details(), uuid] as const,
  search: (params: SearchServiceCatalogsParams) => [...serviceCatalogKeys.all, 'search', params] as const,
  effective: (params: EffectiveServicesParams) => [...serviceCatalogKeys.all, 'effective', params] as const,
  byCodeSystem: (codeSystem: CodeSystemParam, filters: ServiceCatalogFilters) => 
    [...serviceCatalogKeys.all, 'code-system', codeSystem, filters] as const,
  byCategory: (category: ServiceCategoryParam, filters: ServiceCatalogFilters) => 
    [...serviceCatalogKeys.all, 'category', category, filters] as const,
  byCode: (serviceCode: string) => [...serviceCatalogKeys.all, 'code', serviceCode] as const,
  effectiveness: (params: CheckEffectivenessParams) => [...serviceCatalogKeys.all, 'effectiveness', params] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches paginated service catalogs for current facility
 */
export const useGetServiceCatalogs = (
  filters: ServiceCatalogFilters = {},
  options?: Omit<UseQueryOptions<ServiceCatalogListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogListResponse>('/service-catalogs', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single service catalog by UUID
 */
export const useGetServiceCatalogByUUID = (
  uuid: ServiceUUID,
  options?: Omit<UseQueryOptions<ServiceCatalogResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.detail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogResponse>(`/service-catalogs/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Fetches service catalog by service code
 */
export const useGetServiceCatalogByCode = (
  serviceCode: string,
  options?: Omit<UseQueryOptions<ServiceCatalogResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.byCode(serviceCode),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogResponse>(`/service-catalogs/code/${serviceCode}`);
      return response.data;
    },
    enabled: !!serviceCode,
    ...options,
  });
};

/**
 * Searches service catalogs by name, code, or description
 */
export const useSearchServiceCatalogs = (
  params: SearchServiceCatalogsParams,
  options?: Omit<UseQueryOptions<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.search(params),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogSearchResponse>('/service-catalogs/search', {
        params: {
          q: params.query,
          ...params.filters,
        },
      });
      return response.data;
    },
    enabled: !!params.query && params.query.length >= 2,
    ...options,
  });
};

/**
 * Fetches services effective on a specific date
 */
export const useGetEffectiveServices = (
  params: EffectiveServicesParams,
  options?: Omit<UseQueryOptions<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.effective(params),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogSearchResponse>(
        `/service-catalogs/effective/${params.date}`,
        { params: params.filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches services by code system
 */
export const useGetServicesByCodeSystem = (
  codeSystem: CodeSystemParam,
  filters: ServiceCatalogFilters = {},
  options?: Omit<UseQueryOptions<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.byCodeSystem(codeSystem, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogSearchResponse>(
        `/service-catalogs/code-system/${codeSystem}`,
        { params: filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches services by category
 */
export const useGetServicesByCategory = (
  category: ServiceCategoryParam,
  filters: ServiceCatalogFilters = {},
  options?: Omit<UseQueryOptions<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ServiceCatalogSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.byCategory(category, filters),
    queryFn: async () => {
      const response = await axiosInstance.get<ServiceCatalogSearchResponse>(
        `/service-catalogs/category/${category}`,
        { params: filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Checks if a service is effective on a given date
 */
export const useCheckServiceEffectiveness = (
  params: CheckEffectivenessParams,
  options?: Omit<UseQueryOptions<CheckEffectivenessResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CheckEffectivenessResponse, AxiosError<ApiErrorResponse>>({
    queryKey: serviceCatalogKeys.effectiveness(params),
    queryFn: async () => {
      const response = await axiosInstance.get<CheckEffectivenessResponse>(
        `/service-catalogs/${params.uuid}/check-effectiveness`,
        { params: { date: params.date } }
      );
      return response.data;
    },
    enabled: !!params.uuid,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new service catalog
 */
export const useCreateServiceCatalog = (
  callbacks: MutationCallbacks<ServiceCatalogResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ServiceCatalogResponse, AxiosError<ApiErrorResponse>, CreateServiceCatalogRequest>({
    mutationFn: async (data: CreateServiceCatalogRequest) => {
      const response = await axiosInstance.post<ServiceCatalogResponse>('/service-catalogs', data);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Service catalog created successfully!';
      showToast('success', message, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create service catalog.';
      
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
 * Updates an existing service catalog
 */
export const useUpdateServiceCatalog = (
  callbacks: MutationCallbacks<ServiceCatalogResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ServiceCatalogResponse, AxiosError<ApiErrorResponse>, UpdateServiceCatalogParams>({
    mutationFn: async ({ uuid, data }: UpdateServiceCatalogParams) => {
      const response = await axiosInstance.put<ServiceCatalogResponse>(`/service-catalogs/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Service catalog updated successfully!';
      showToast('success', message, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update service catalog.';
      
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
 * Deletes a service catalog
 */
export const useDeleteServiceCatalog = (
  callbacks: MutationCallbacks<ServiceCatalogResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ServiceCatalogResponse, AxiosError<ApiErrorResponse>, DeleteServiceCatalogParams>({
    mutationFn: async ({ uuid }: DeleteServiceCatalogParams) => {
      const response = await axiosInstance.delete<ServiceCatalogResponse>(`/service-catalogs/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Service catalog deleted successfully!';
      showToast('success', message, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete service catalog.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Restores a soft-deleted service catalog
 */
export const useRestoreServiceCatalog = (
  callbacks: MutationCallbacks<ServiceCatalogResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<ServiceCatalogResponse, AxiosError<ApiErrorResponse>, RestoreServiceCatalogParams>({
    mutationFn: async ({ uuid }: RestoreServiceCatalogParams) => {
      const response = await axiosInstance.post<ServiceCatalogResponse>(`/service-catalogs/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Service catalog restored successfully!';
      showToast('success', message, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to restore service catalog.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Extracts error message from API error
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Formats validation errors for display
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
  // Query keys
  serviceCatalogKeys,

  // Query hooks
  useGetServiceCatalogs,
  useGetServiceCatalogByUUID,
  useGetServiceCatalogByCode,
  useSearchServiceCatalogs,
  useGetEffectiveServices,
  useGetServicesByCodeSystem,
  useGetServicesByCategory,
  useCheckServiceEffectiveness,

  // Mutation hooks
  useCreateServiceCatalog,
  useUpdateServiceCatalog,
  useDeleteServiceCatalog,
  useRestoreServiceCatalog,

  // Utilities
  extractErrorMessage,
  formatValidationErrors,
};