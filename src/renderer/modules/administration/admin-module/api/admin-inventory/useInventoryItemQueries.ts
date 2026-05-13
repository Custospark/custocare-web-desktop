/**
 * ============================================================================
 * INVENTORY ITEM REACT QUERY HOOKS
 * ============================================================================
 * 
 * React Query hooks for inventory item management operations.
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import type {
  ApiErrorResponse,
  CategoryItemsParams,
  CategoryItemsResponse,
  ControlledSubstancesParams,
  ControlledSubstancesResponse,
  CreateInventoryItemRequest,
  CurrentBalanceResponse,
  DeleteInventoryItemParams,
  AdjustStockRequest,
  InventoryItem,
  LedgerEntryResponse,
  GetCurrentBalanceParams,
  InventoryItemFilters,
  InventoryItemListResponse,
  InventoryItemResponse,
  InventoryItemSearchResponse,
  ItemCode,
  ItemUUID,
  MutationCallbacks,
  RestoreInventoryItemParams,
  SearchInventoryItemsParams,
  SpecialHandlingItemsResponse,
  SpecialHandlingParams,
  UpdateInventoryItemParams,
} from './inventoryItemTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const inventoryItemKeys = {
  all: ['inventory-items'] as const,
  lists: () => [...inventoryItemKeys.all, 'list'] as const,
  list: (filters: InventoryItemFilters) => [...inventoryItemKeys.lists(), filters] as const,
  details: () => [...inventoryItemKeys.all, 'detail'] as const,
  detail: (uuid: ItemUUID) => [...inventoryItemKeys.details(), uuid] as const,
  search: (params: SearchInventoryItemsParams) => [...inventoryItemKeys.all, 'search', params] as const,
  byCategory: (params: CategoryItemsParams) => [...inventoryItemKeys.all, 'category', params] as const,
  controlledSubstances: (params: ControlledSubstancesParams) => [...inventoryItemKeys.all, 'controlled-substances', params] as const,
  specialHandling: (params: SpecialHandlingParams) => [...inventoryItemKeys.all, 'special-handling', params] as const,
  byCode: (itemCode: ItemCode) => [...inventoryItemKeys.all, 'code', itemCode] as const,
};

/* -------------------------------------------------------------------------- */
/*                              QUERY HOOKS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetches paginated inventory items for current facility
 */
export const useGetInventoryItems = (
  filters: InventoryItemFilters = {},
  options?: Omit<UseQueryOptions<InventoryItemListResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InventoryItemListResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<InventoryItemListResponse>('/inventory-items', {
        params: filters,
      });
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches a single inventory item by UUID
 */
export const useGetInventoryItemByUUID = (
  uuid: ItemUUID,
  options?: Omit<UseQueryOptions<InventoryItemResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InventoryItemResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.detail(uuid),
    queryFn: async () => {
      const response = await axiosInstance.get<InventoryItemResponse>(`/inventory-items/${uuid}`);
      return response.data;
    },
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Fetches inventory item by item code
 */
export const useGetInventoryItemByCode = (
  itemCode: ItemCode,
  options?: Omit<UseQueryOptions<InventoryItemResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InventoryItemResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.byCode(itemCode),
    queryFn: async () => {
      const response = await axiosInstance.get<InventoryItemResponse>(`/inventory-items/code/${itemCode}`);
      return response.data;
    },
    enabled: !!itemCode,
    ...options,
  });
};

/**
 * Searches inventory items by name, code, or description
 */
export const useSearchInventoryItems = (
  params: SearchInventoryItemsParams,
  options?: Omit<UseQueryOptions<InventoryItemSearchResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<InventoryItemSearchResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.search(params),
    queryFn: async () => {
      const response = await axiosInstance.get<InventoryItemSearchResponse>('/inventory-items/search', {
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
 * Fetches inventory items by category
 */
export const useGetInventoryItemsByCategory = (
  params: CategoryItemsParams,
  options?: Omit<UseQueryOptions<CategoryItemsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CategoryItemsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.byCategory(params),
    queryFn: async () => {
      const response = await axiosInstance.get<CategoryItemsResponse>(
        `/inventory-items/category/${params.category}`,
        { params: params.filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches controlled substances
 */
export const useGetControlledSubstances = (
  params: ControlledSubstancesParams = {},
  options?: Omit<UseQueryOptions<ControlledSubstancesResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<ControlledSubstancesResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.controlledSubstances(params),
    queryFn: async () => {
      const response = await axiosInstance.get<ControlledSubstancesResponse>(
        '/inventory-items/controlled-substances',
        { params: params.filters }
      );
      return response.data;
    },
    ...options,
  });
};

/**
 * Fetches items requiring special handling
 */
export const useGetSpecialHandlingItems = (
  params: SpecialHandlingParams = {},
  options?: Omit<UseQueryOptions<SpecialHandlingItemsResponse, AxiosError<ApiErrorResponse>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SpecialHandlingItemsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryItemKeys.specialHandling(params),
    queryFn: async () => {
      const response = await axiosInstance.get<SpecialHandlingItemsResponse>(
        '/inventory-items/special-handling',
        { params: params.filters }
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
 * Creates a new inventory item
 */
export const useCreateInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, CreateInventoryItemRequest>({
    mutationFn: async (data: CreateInventoryItemRequest) => {
      const response = await axiosInstance.post<InventoryItemResponse>('/inventory-items', data);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Inventory item created successfully!';
      showToast('success', message, 8000);
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
 * Updates an existing inventory item
 */
export const useUpdateInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, UpdateInventoryItemParams>({
    mutationFn: async ({ uuid, data }: UpdateInventoryItemParams) => {
      const response = await axiosInstance.put<InventoryItemResponse>(`/inventory-items/${uuid}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Inventory item updated successfully!';
      showToast('success', message, 8000);
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
 * Deletes an inventory item
 */
export const useDeleteInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, DeleteInventoryItemParams>({
    mutationFn: async ({ uuid }: DeleteInventoryItemParams) => {
      const response = await axiosInstance.delete<InventoryItemResponse>(`/inventory-items/${uuid}`);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Inventory item deleted successfully!';
      showToast('success', message, 8000);
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
 * Restores a soft-deleted inventory item
 */
export const useRestoreInventoryItem = (
  callbacks: MutationCallbacks<InventoryItemResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();

  return useMutation<InventoryItemResponse, AxiosError<ApiErrorResponse>, RestoreInventoryItemParams>({
    mutationFn: async ({ uuid }: RestoreInventoryItemParams) => {
      const response = await axiosInstance.post<InventoryItemResponse>(`/inventory-items/${uuid}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      const message = data.message || 'Inventory item restored successfully!';
      showToast('success', message, 8000);
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
/*                         INVENTORY LEDGER HOOKS                             */
/* -------------------------------------------------------------------------- */

/**
 * Query key for stock balance
 */
export const inventoryLedgerKeys = {
  balance: (facilityId: number, itemId: number) => ['inventory-ledger', 'balance', facilityId, itemId] as const,
};

/**
 * Fetches current stock balance for an inventory item at a facility
 */
export const useGetCurrentStockBalance = (
  params: GetCurrentBalanceParams,
  options?: { enabled?: boolean }
) => {
  return useQuery<CurrentBalanceResponse, AxiosError<ApiErrorResponse>>({
    queryKey: inventoryLedgerKeys.balance(params.facility_id, params.inventory_item_id),
    queryFn: async () => {
      const response = await axiosInstance.get<CurrentBalanceResponse>(
        '/inventory/ledger/balance/current',
        { params }
      );
      return response.data;
    },
    enabled: options?.enabled ?? (params.facility_id > 0 && params.inventory_item_id > 0),
  });
};

/**
 * Adjusts stock for an inventory item (increase or decrease)
 * User enters only the delta — system calculates the new balance.
 */
export const useAdjustStock = (
  callbacks: MutationCallbacks<LedgerEntryResponse, AxiosError<ApiErrorResponse>> = {}
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<LedgerEntryResponse, AxiosError<ApiErrorResponse>, AdjustStockRequest>({
    mutationFn: async (data: AdjustStockRequest) => {
      const response = await axiosInstance.post<LedgerEntryResponse>(
        '/inventory/ledger/adjustment',
        data
      );
      return response.data;
    },
    onMutate: async (data) => {
      const listKeys = queryClient.getQueriesData<InventoryItemListResponse>({ queryKey: inventoryItemKeys.lists() });
      for (const [key, cached] of listKeys) {
        if (!cached?.data) continue;
        queryClient.setQueryData(key, {
          ...cached,
          data: cached.data.map((item: InventoryItem) =>
            item.id === data.inventory_item_id
              ? { ...item, current_balance: item.current_balance + data.quantity }
              : item
          ),
        });
      }
    },
    onSuccess: (data) => {
      const direction = data.data.quantity_change > 0 ? 'increased' : 'decreased';
      showToast('success', `Stock ${direction} successfully. New balance: ${data.data.balance_after_transaction}`, 6000);
      callbacks.onSuccess?.(data);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const apiMessage = error.response?.data?.message || error.message || 'Failed to adjust stock.';
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
  inventoryItemKeys,
  inventoryLedgerKeys,

  // Query hooks
  useGetInventoryItems,
  useGetInventoryItemByUUID,
  useGetInventoryItemByCode,
  useSearchInventoryItems,
  useGetInventoryItemsByCategory,
  useGetControlledSubstances,
  useGetSpecialHandlingItems,
  useGetCurrentStockBalance,

  // Mutation hooks
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useRestoreInventoryItem,
  useAdjustStock,

  // Utilities
  extractErrorMessage,
  formatValidationErrors,
};