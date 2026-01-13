/**
 * ============================================================================
 * INVENTORY ITEM REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains all React Query mutation and query hooks for inventory item
 * management operations. Handles API communication, error handling, and
 * toast notifications. Uses active context for facility ID.
 * 
 * @module useInventoryItemQueries
 * @description Provides type-safe, reusable hooks for all inventory item CRUD
 * operations and custom queries.
 * 
 * @requires @tanstack/react-query
 * @requires axios
 */

import { useMutation, useQuery, type UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { useSelector } from 'react-redux';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';

import type {
  ApiErrorResponse,
  CreateInventoryItemRequest,
  DeleteInventoryItemParams,
  DeleteInventoryItemResponse,
  InventoryItemFilters,
  InventoryItemResponse,
  InventoryItemUUID,
  GetInventoryItemsResponse,
  GetInventoryItemsByCategoryResponse,
  GetControlledSubstancesResponse,
  SearchInventoryItemsResponse,
  InventoryItemSearchParams,
  MutationCallbacks,
  RestoreInventoryItemParams,
  RestoreInventoryItemResponse,
  UpdateInventoryItemParams,
  Category,
} from './InventoryItemTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 */
export const inventoryItemKeys = {
  all: ['inventory-items'] as const,
  lists: () => [...inventoryItemKeys.all, 'list'] as const,
  list: (filters: InventoryItemFilters) => [...inventoryItemKeys.lists(), filters] as const,
  details: () => [...inventoryItemKeys.all, 'detail'] as const,
  detail: (uuid: InventoryItemUUID) => [...inventoryItemKeys.details(), uuid] as const,
  byCategory: (category: Category, filters: Partial<InventoryItemFilters>) => 
    [...inventoryItemKeys.all, 'category', category, filters] as const,
  controlledSubstances: (filters: Partial<InventoryItemFilters>) => 
    [...inventoryItemKeys.all, 'controlled-substances', filters] as const,
  search: (params: InventoryItemSearchParams) => 
    [...inventoryItemKeys.all, 'search', params] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches a paginated list of inventory items with optional filtering.
 * Automatically includes active facility ID from context.
 * 
 * @param filters - Query parameters for filtering and pagination
 * @param options - React Query options for customizing behavior
 * @returns Query result with inventory items list and pagination metadata
 */
export const useGetInventoryItems = (
  filters: InventoryItemFilters = {},
  options?: Omit<UseQueryOptions<GetInventoryItemsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
    const activeFacilityId = useSelector(getActiveFacilityId);
  
  // Auto-include active facility ID if not specified
  const finalFilters: InventoryItemFilters = {
    ...filters,
    facility_id: filters.facility_id ?? activeFacilityId ?? undefined,
  };

  return useQuery<GetInventoryItemsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.list(finalFilters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetInventoryItemsResponse>('/inventory-items', {
        params: finalFilters,
      });
      return response.data;
    },
    enabled: !!finalFilters.facility_id, // Only run if facility_id is available
    ...options,
  });
};

/**
 * Fetches a single inventory item by UUID with full details.
 * 
 * @param uuid - Inventory item UUID to fetch
 * @param options - React Query options for customizing behavior
 * @returns Query result with complete inventory item details
 */
export const useGetInventoryItemByUUID = (
  uuid: InventoryItemUUID,
  options?: Omit<UseQueryOptions<InventoryItemResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InventoryItemResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.detail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<InventoryItemResponse>(`/inventory-items/${uuid}`);
      return response.data;
    },
    enabled: !!uuid, // Only run query if UUID is provided
    ...options,
  });
};

/**
 * Fetches all inventory items for a specific category.
 * Automatically includes active facility ID from context.
 * 
 * @param category - Category to filter items
 * @param filters - Additional filters (status, etc.)
 * @param options - React Query options for customizing behavior
 * @returns Query result with category-specific inventory items
 */
export const useGetInventoryItemsByCategory = (
  category: Category,
  filters: Pick<InventoryItemFilters, 'status' | 'facility_id'> = {},
  options?: Omit<UseQueryOptions<GetInventoryItemsByCategoryResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
    const activeFacilityId = useSelector(getActiveFacilityId);
  
  // Auto-include active facility ID if not specified
  const finalFilters: Pick<InventoryItemFilters, 'status' | 'facility_id'> = {
    ...filters,
    facility_id: filters.facility_id ?? activeFacilityId ?? undefined,
  };

  return useQuery<GetInventoryItemsByCategoryResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.byCategory(category, finalFilters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetInventoryItemsByCategoryResponse>(
        `/inventory-items/category/${category}`,
        { params: finalFilters }
      );
      return response.data;
    },
    enabled: !!category && !!finalFilters.facility_id,
    ...options,
  });
};

/**
 * Fetches all controlled substances.
 * Automatically includes active facility ID from context.
 * 
 * @param filters - Additional filters (status, etc.)
 * @param options - React Query options for customizing behavior
 * @returns Query result with controlled substances
 */
export const useGetControlledSubstances = (
  filters: Pick<InventoryItemFilters, 'status' | 'facility_id'> = {},
  options?: Omit<UseQueryOptions<GetControlledSubstancesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
    const activeFacilityId = useSelector(getActiveFacilityId);
  
  // Auto-include active facility ID if not specified
  const finalFilters: Pick<InventoryItemFilters, 'status' | 'facility_id'> = {
    ...filters,
    facility_id: filters.facility_id ?? activeFacilityId ?? undefined,
  };

  return useQuery<GetControlledSubstancesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.controlledSubstances(finalFilters),
    queryFn: async () => {
      const response = await axiosInstance.get<GetControlledSubstancesResponse>(
        '/inventory-items/controlled-substances',
        { params: finalFilters }
      );
      return response.data;
    },
    enabled: !!finalFilters.facility_id,
    ...options,
  });
};

/**
 * Searches inventory items by term.
 * Automatically includes active facility ID from context.
 * 
 * @param params - Search parameters including search term
 * @param options - React Query options for customizing behavior
 * @returns Query result with search results
 */
export const useSearchInventoryItems = (
  params: InventoryItemSearchParams,
  options?: Omit<UseQueryOptions<SearchInventoryItemsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
    const activeFacilityId = useSelector(getActiveFacilityId);
  
  // Auto-include active facility ID if not specified in params
  const finalParams = {
    ...params,
    facility_id: params.category ? undefined : activeFacilityId, // Don't override if category search
  };

  return useQuery<SearchInventoryItemsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.search(finalParams),
    queryFn: async () => {
      const response = await axiosInstance.get<SearchInventoryItemsResponse>(
        '/inventory-items/search',
        { params: finalParams }
      );
      return response.data;
    },
    enabled: !!finalParams.q && !!activeFacilityId,
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                             MUTATION HOOKS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new inventory item in the system.
 * Automatically includes active facility ID from context.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useCreateInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
    const activeFacilityId = useSelector(getActiveFacilityId);

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, CreateInventoryItemRequest>({
    mutationFn: async (data: CreateInventoryItemRequest) => {
      // Auto-include active facility ID if not provided
      const requestData = {
        ...data,
        facility_id: data.facility_id ?? activeFacilityId,
      };

      if (!requestData.facility_id) {
        throw new Error('Facility ID is required. Please ensure you have an active facility selected.');
      }

      const response = await axiosInstance.post<InventoryItemResponse>('/inventory-items', requestData);
      return response.data;
    },
    onSuccess: (data) => {
      const successMessage = data.message || 'Inventory item created successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.controlledSubstances({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to create inventory item.';

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
 * Updates an existing inventory item by UUID.
 * Supports partial updates - only provided fields are modified.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useUpdateInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, UpdateInventoryItemParams>({
    mutationFn: async ({ uuid, data }: UpdateInventoryItemParams) => {
      const response = await axiosInstance.put<InventoryItemResponse>(`/inventory-items/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Inventory item updated successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.controlledSubstances({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update inventory item.';

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
 * Partially updates an inventory item using PATCH method.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const usePatchInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, UpdateInventoryItemParams>({
    mutationFn: async ({ uuid, data }: UpdateInventoryItemParams) => {
      const response = await axiosInstance.patch<InventoryItemResponse>(`/inventory-items/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Inventory item updated successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.detail(variables.uuid) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to update inventory item.';

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
 * Soft-deletes an inventory item by UUID.
 * Item can be restored later using the restore endpoint.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useDeleteInventoryItem = (
  callbacks: MutationCallbacks<DeleteInventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DeleteInventoryItemResponse, AxiosError<ApiErrorResponse>, DeleteInventoryItemParams>({
    mutationFn: async ({ uuid }: DeleteInventoryItemParams) => {
      const response = await axiosInstance.delete<DeleteInventoryItemResponse>(`/inventory-items/${uuid}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Inventory item deleted successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.detail(variables.uuid) });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.controlledSubstances({}) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to delete inventory item.';
      showToast('error', apiMessage, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * Restores a previously soft-deleted inventory item.
 * Only works on items that have been soft-deleted.
 * 
 * @param callbacks - Optional onSuccess and onError callbacks
 * @returns Mutation object with mutate function and state
 */
export const useRestoreInventoryItem = (
  callbacks: MutationCallbacks<RestoreInventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<RestoreInventoryItemResponse, AxiosError<ApiErrorResponse>, RestoreInventoryItemParams>({
    mutationFn: async ({ uuid }: RestoreInventoryItemParams) => {
      const response = await axiosInstance.post<RestoreInventoryItemResponse>(`/inventory-items/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const successMessage = data.message || 'Inventory item restored successfully!';
      showToast('success', successMessage, 8000);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryItemKeys.detail(variables.uuid) });
      
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to restore inventory item.';
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

/**
 * Helper to get active facility ID safely.
 * Throws error if no facility is selected.
 */
export const useActiveFacilityId = (): number => {
    const activeFacilityId = useSelector(getActiveFacilityId);
  
  if (!activeFacilityId) {
    throw new Error('No active facility selected. Please select a facility before performing this action.');
  }
  
  return activeFacilityId;
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 */
export default {
  // Query hooks
  useGetInventoryItems,
  useGetInventoryItemByUUID,
  useGetInventoryItemsByCategory,
  useGetControlledSubstances,
  useSearchInventoryItems,

  // Mutation hooks
  useCreateInventoryItem,
  useUpdateInventoryItem,
  usePatchInventoryItem,
  useDeleteInventoryItem,
  useRestoreInventoryItem,

  // Utilities
  inventoryItemKeys,
  extractErrorMessage,
  formatValidationErrors,
  useActiveFacilityId,
};