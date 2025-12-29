import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { roleApi } from './roleApi';
import type {
  Role,
  RolePermission,
  QueueConfiguration,
  UserRoleAssignment,
  RoleUpdateData,
  RoleFilterParams,
  RoleStats,
  PaginatedResponse,
  ApiResponse,
} from '../../types/role';
import { queueQueryKeys } from '../queues/queueQueries';

/**
 * Role Query Keys
 * Hierarchical cache keys for React Query
 * Using explicit return types with 'as const' for TypeScript tuple inference
 */

export const roleQueryKeys = {
  // Root key for all role queries
  all: ['roles'] as const,
  
  // Role list queries
  roles: {
    all: ['roles', 'list'] as const,
    lists: () => ['roles', 'list'] as const,
    list: (params: RoleFilterParams) => 
      ['roles', 'list', params] as const,
  },
  
  // Individual role queries
  roleDetail: (id: string) => 
    ['roles', 'detail', id] as const,
  
  // Permission queries
  permissions: (roleId: string) => 
    ['roles', 'permissions', roleId] as const,
  
  // Queue configuration queries
  queueConfig: (roleId: string) => 
    ['roles', 'queue-config', roleId] as const,
  
  // User role assignment queries
  userRoles: {
    all: (userId: string) => 
      ['roles', 'user', userId, 'roles'] as const,
    lists: (userId: string) => 
      ['roles', 'user', userId, 'roles', 'list'] as const,
  },
  
  // Current user roles
  currentUserRoles: () => 
    ['roles', 'current-user'] as const,
  
  // Statistics queries
  statistics: (facilityId?: string) => 
    ['roles', 'statistics', facilityId].filter(Boolean) as readonly string[],
  
  // Search queries
  search: (query: string) => 
    ['roles', 'search', query] as const,
  
  // Role type queries
  byType: (type: string) => 
    ['roles', 'type', type] as const,
};

// ============================================
// ROLE QUERY HOOKS
// ============================================

/**
 * Hook to fetch paginated list of roles
 * @param params - Filter parameters
 * @param options - React Query options
 * @returns Query result with paginated roles
 */
export const useRoles = (
  params: RoleFilterParams,
  options?: UseQueryOptions<PaginatedResponse<Role>, Error>
) => {
  return useQuery<PaginatedResponse<Role>, Error>({
    queryKey: roleQueryKeys.roles.list(params),
    queryFn: () => roleApi.getRoles(params),
    ...options,
  });
};

/**
 * Hook to fetch a single role by ID
 * @param id - Role ID
 * @param options - React Query options
 * @returns Query result with single role
 */
export const useRole = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Role>, Error>
) => {
  return useQuery<ApiResponse<Role>, Error>({
    queryKey: roleQueryKeys.roleDetail(id),
    queryFn: () => roleApi.getRoleById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to fetch roles by type
 * @param type - Role type
 * @param options - React Query options
 * @returns Query result with roles of specified type
 */
export const useRolesByType = (
  type: string,
  options?: UseQueryOptions<ApiResponse<Role[]>, Error>
) => {
  return useQuery<ApiResponse<Role[]>, Error>({
    queryKey: roleQueryKeys.byType(type),
    queryFn: () => roleApi.getRolesByType(type),
    enabled: !!type,
    ...options,
  });
};

/**
 * Hook to search roles
 * @param query - Search query
 * @param options - React Query options
 * @returns Query result with search matches
 */
export const useSearchRoles = (
  query: string,
  options?: UseQueryOptions<ApiResponse<Role[]>, Error>
) => {
  return useQuery<ApiResponse<Role[]>, Error>({
    queryKey: roleQueryKeys.search(query),
    queryFn: () => roleApi.searchRoles(query),
    enabled: query.length > 0,
    ...options,
  });
};

/**
 * Hook to fetch role permissions
 * @param roleId - Role ID
 * @param options - React Query options
 * @returns Query result with role permissions
 */
export const useRolePermissions = (
  roleId: string,
  options?: UseQueryOptions<ApiResponse<RolePermission[]>, Error>
) => {
  return useQuery<ApiResponse<RolePermission[]>, Error>({
    queryKey: roleQueryKeys.permissions(roleId),
    queryFn: () => roleApi.getRolePermissions(roleId),
    enabled: !!roleId,
    ...options,
  });
};

/**
 * Hook to fetch queue configuration for a role
 * @param roleId - Role ID
 * @param options - React Query options
 * @returns Query result with queue configuration
 */
export const useQueueConfiguration = (
  roleId: string,
  options?: UseQueryOptions<ApiResponse<QueueConfiguration>, Error>
) => {
  return useQuery<ApiResponse<QueueConfiguration>, Error>({
    queryKey: roleQueryKeys.queueConfig(roleId),
    queryFn: () => roleApi.getQueueConfiguration(roleId),
    enabled: !!roleId,
    ...options,
  });
};

/**
 * Hook to fetch role assignments for a user
 * @param userId - User ID
 * @param options - React Query options
 * @returns Query result with user's role assignments
 */
export const useUserRoles = (
  userId: string,
  options?: UseQueryOptions<ApiResponse<UserRoleAssignment[]>, Error>
) => {
  return useQuery<ApiResponse<UserRoleAssignment[]>, Error>({
    queryKey: roleQueryKeys.userRoles.all(userId),
    queryFn: () => roleApi.getUserRoles(userId),
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to fetch current user's roles
 * @param options - React Query options
 * @returns Query result with current user's roles
 */
export const useCurrentUserRoles = (
  options?: UseQueryOptions<ApiResponse<Role[]>, Error>
) => {
  return useQuery<ApiResponse<Role[]>, Error>({
    queryKey: roleQueryKeys.currentUserRoles(),
    queryFn: () => roleApi.getCurrentUserRoles(),
    ...options,
  });
};

/**
 * Hook to fetch role statistics
 * @param facilityId - Optional facility ID for filtering
 * @returns Query result with role statistics
 */
export const useRoleStatistics = (facilityId?: string) => {
  return useQuery<ApiResponse<RoleStats>, Error>({
    queryKey: roleQueryKeys.statistics(facilityId),
    queryFn: () => roleApi.getRoleStatistics(facilityId),
  });
};

// ============================================
// ROLE MUTATION HOOKS
// ============================================

/**
 * Hook to create a new role
 * @returns Mutation function for role creation
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Role>, Error, Partial<Role>>({
    mutationFn: roleApi.createRole,
    onSuccess: (data) => {
      // Invalidate role lists
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles.all });
      
      // Cache the new role
      queryClient.setQueryData(roleQueryKeys.roleDetail(data.data.id), data);
      
      // Invalidate type-specific queries if role has type
      if (data.data.type) {
        queryClient.invalidateQueries({ queryKey: roleQueryKeys.byType(data.data.type) });
      }
    },
  });
};

/**
 * Hook to update an existing role
 * @returns Mutation function for role updates
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Role>,
    Error,
    { id: string; data: RoleUpdateData }
  >({
    mutationFn: ({ id, data }) => roleApi.updateRole(id, data),
    onSuccess: (data, variables) => {
      // Update role cache
      queryClient.setQueryData(roleQueryKeys.roleDetail(variables.id), data);
      
      // Invalidate role lists
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles.all });
      
      // If queue configuration changed, invalidate queue queries
      if (variables.data.queueConfig) {
        queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      }
      
      // Invalidate type queries if type changed
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.byType(data.data.type) });
    },
  });
};

/**
 * Hook to delete a role
 * @returns Mutation function for role deletion
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<void>, Error, { id: string; roleType: string }>({
    mutationFn: ({ id }) => roleApi.deleteRole(id),
    onSuccess: (_, variables) => {
      // Remove role from cache
      queryClient.removeQueries({ queryKey: roleQueryKeys.roleDetail(variables.id) });
      queryClient.removeQueries({ queryKey: roleQueryKeys.permissions(variables.id) });
      queryClient.removeQueries({ queryKey: roleQueryKeys.queueConfig(variables.id) });
      
      // Invalidate role lists
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles.all });
      
      // Invalidate type-specific queries
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.byType(variables.roleType) });
      
      // Invalidate queue queries
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
    },
  });
};

// ============================================
// PERMISSION MUTATION HOOKS
// ============================================

/**
 * Hook to update role permissions
 * @returns Mutation function for permission updates
 */
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<RolePermission[]>,
    Error,
    { roleId: string; permissions: RolePermission[] }
  >({
    mutationFn: ({ roleId, permissions }) => 
      roleApi.updateRolePermissions(roleId, permissions),
    onSuccess: (data, variables) => {
      // Update permissions cache
      queryClient.setQueryData(roleQueryKeys.permissions(variables.roleId), data);
      
      // Invalidate role cache to reflect permission changes
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleDetail(variables.roleId) });
    },
  });
};

// ============================================
// QUEUE CONFIGURATION MUTATION HOOKS
// ============================================

/**
 * Hook to update queue configuration
 * @returns Mutation function for queue configuration updates
 */
export const useUpdateQueueConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<QueueConfiguration>,
    Error,
    { roleId: string; config: Partial<QueueConfiguration> }
  >({
    mutationFn: ({ roleId, config }) => 
      roleApi.updateQueueConfiguration(roleId, config),
    onSuccess: (data, variables) => {
      // Update queue config cache
      queryClient.setQueryData(roleQueryKeys.queueConfig(variables.roleId), data);
      
      // Invalidate queue queries since configuration changed
      queryClient.invalidateQueries({ queryKey: queueQueryKeys.all });
      
      // Update role cache
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleDetail(variables.roleId) });
    },
  });
};

// ============================================
// USER ROLE ASSIGNMENT MUTATION HOOKS
// ============================================

/**
 * Hook to assign a role to a user
 * @returns Mutation function for role assignment
 */
export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<UserRoleAssignment>,
    Error,
    { userId: string; roleId: string; facilityId: string; departmentId?: string }
  >({
    mutationFn: ({ userId, roleId, facilityId, departmentId }) => 
      roleApi.assignUserRole(userId, roleId, facilityId, departmentId),
    onSuccess: (data, variables) => {
      console.log(data)
      // Invalidate user roles queries
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles.all(variables.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.currentUserRoles() });
    },
  });
};

/**
 * Hook to update a user role assignment
 * @returns Mutation function for assignment updates
 */
export const useUpdateUserRoleAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<UserRoleAssignment>,
    Error,
    { assignmentId: string; updateData: Partial<UserRoleAssignment> }
  >({
    mutationFn: ({ assignmentId, updateData }) => 
      roleApi.updateUserRoleAssignment(assignmentId, updateData),
    onSuccess: (data) => {
      // Invalidate user roles queries
      const assignment = data.data;
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles.all(assignment.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.currentUserRoles() });
    },
  });
};

/**
 * Hook to remove a user role assignment
 * @returns Mutation function for removing assignments
 */
export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<void>, Error, { assignmentId: string; userId: string }>({
    mutationFn: ({ assignmentId }) => roleApi.removeUserRole(assignmentId),
    onSuccess: (_, variables) => {
      // Invalidate user-specific role queries
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles.all(variables.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.currentUserRoles() });
    },
  });
};

// ============================================
// PERMISSION CHECK HOOK
// ============================================

/**
 * Hook to check user permissions
 * @param resource - Resource to check
 * @param action - Action to check
 * @param context - Optional context for permission check
 * @param options - React Query options
 * @returns Query result with permission check
 */
export const useCheckPermissions = (
  resource: string,
  action: string,
  context?: Record<string, unknown>,
  options?: UseQueryOptions<ApiResponse<{ allowed: boolean; reason?: string }>, Error>
) => {
  return useQuery<ApiResponse<{ allowed: boolean; reason?: string }>, Error>({
    queryKey: ['permissions-check', resource, action, context],
    queryFn: () => roleApi.checkPermissions(resource, action, context),
    ...options,
  });
};