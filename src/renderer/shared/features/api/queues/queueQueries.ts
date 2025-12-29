import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { queueApi } from './queueApi';
import type {
  RoleQueue,
  QueueAssignment,
  PriorityUpdate,
  QueueFilter,
  QueueStats,
  QueueItem,
} from '../../types/queue';
import { visitQueryKeys } from '../visits/visitQueries';

    // Shared API response types

        export interface ApiResponse<T> {
        data: T;
        message: string;
        success: boolean;
        timestamp: string;
        }

        export interface PaginationMeta {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        }

        export interface PaginatedResponse<T> extends ApiResponse<T[]> {
        pagination: PaginationMeta;
        }

// Query keys
export const queueQueryKeys = {
  all: ['queues'] as const,
  roleQueues: () => [...queueQueryKeys.all, 'role'] as const,
  roleQueue: (roleId: string, filters?: QueueFilter) => 
    [...queueQueryKeys.roleQueues(), roleId, filters] as const,
  myQueue: (userId: string, filters?: QueueFilter) => 
    [...queueQueryKeys.all, 'my', userId, filters] as const,
  stats: (roleId?: string) => 
    [...queueQueryKeys.all, 'stats', roleId] as const,
};

// Query hooks
export const useRoleQueue = (
  roleId: string,
  filters?: QueueFilter,
  options?: UseQueryOptions<ApiResponse<RoleQueue>, Error>
) => {
  return useQuery<ApiResponse<RoleQueue>, Error>({
    queryKey: queueQueryKeys.roleQueue(roleId, filters),
    queryFn: () => queueApi.getRoleQueue(roleId, filters),
    enabled: !!roleId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    ...options,
  });
};

export const useMyQueue = (
  userId: string,
  filters?: QueueFilter,
  options?: UseQueryOptions<ApiResponse<RoleQueue>, Error>
) => {
  return useQuery<ApiResponse<RoleQueue>, Error>({
    queryKey: queueQueryKeys.myQueue(userId, filters),
    queryFn: () => queueApi.getMyQueue(userId, filters),
    enabled: !!userId,
    refetchInterval: 30000,
    ...options,
  });
};

export const useQueueStats = (roleId?: string) => {
  return useQuery<ApiResponse<QueueStats>, Error>({
    queryKey: queueQueryKeys.stats(roleId),
    queryFn: () => queueApi.getQueueStats(roleId),
  });
};

// Mutation hooks
export const useUpdateQueuePriority = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<QueueItem>, // ✅ what the API RETURNS
    Error,
    PriorityUpdate               // ✅ what the mutation ACCEPTS
  >({
    mutationFn: queueApi.updateQueuePriority,

    onSuccess: (variables) => {
      // Invalidate queues
      queryClient.invalidateQueries({
        queryKey: queueQueryKeys.all,
      });

      // Invalidate visit detail
      queryClient.invalidateQueries({
        queryKey: visitQueryKeys.detail(variables.timestamp),
      });
    },
  });
};
;



export const useAssignQueueVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<QueueItem>, Error, QueueAssignment>({
    mutationFn: queueApi.assignQueueVisit,
    onSuccess: ( variables) => {
      // Invalidate all queue queries
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      
      // Update visit cache with assignment
      queryClient.invalidateQueries({ 
        queryKey: visitQueryKeys.detail(variables.timestamp) 
      });
    },
  });
};