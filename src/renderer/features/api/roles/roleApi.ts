// src/api/roleApi.ts - UPDATED VERSION
import axiosInstance from '../configs/axiosConfig';
import { ENDPOINTS } from '../endpoints/endpoints';
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

export const roleApi = {
  // ============================================
  // ROLE MANAGEMENT
  // ============================================
  
  getRoles: async (params: RoleFilterParams): Promise<PaginatedResponse<Role>> => {
    const response = await axiosInstance.get<PaginatedResponse<Role>>(
      ENDPOINTS.ROLES.GET_ALL,
      { params }
    );
    return response.data;
  },

  getRoleById: async (id: string): Promise<ApiResponse<Role>> => {
    const response = await axiosInstance.get<ApiResponse<Role>>(
      ENDPOINTS.ROLES.GET_BY_ID(id)
    );
    return response.data;
  },

  createRole: async (roleData: Partial<Role>): Promise<ApiResponse<Role>> => {
    const response = await axiosInstance.post<ApiResponse<Role>>(
      ENDPOINTS.ROLES.CREATE,
      roleData
    );
    return response.data;
  },

  updateRole: async (
    id: string,
    updateData: RoleUpdateData
  ): Promise<ApiResponse<Role>> => {
    const response = await axiosInstance.put<ApiResponse<Role>>(
      ENDPOINTS.ROLES.UPDATE(id),
      updateData
    );
    return response.data;
  },

  deleteRole: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      ENDPOINTS.ROLES.DELETE(id)
    );
    return response.data;
  },

  getRolesByType: async (type: string): Promise<ApiResponse<Role[]>> => {
    const response = await axiosInstance.get<ApiResponse<Role[]>>(
      ENDPOINTS.ROLES.GET_BY_TYPE(type)
    );
    return response.data;
  },

  searchRoles: async (query: string): Promise<ApiResponse<Role[]>> => {
    const response = await axiosInstance.post<ApiResponse<Role[]>>(
      ENDPOINTS.ROLES.SEARCH,
      { query }
    );
    return response.data;
  },

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  getRolePermissions: async (roleId: string): Promise<ApiResponse<RolePermission[]>> => {
    const response = await axiosInstance.get<ApiResponse<RolePermission[]>>(
      ENDPOINTS.ROLES.GET_PERMISSIONS(roleId)
    );
    return response.data;
  },

  updateRolePermissions: async (
    roleId: string,
    permissions: RolePermission[]
  ): Promise<ApiResponse<RolePermission[]>> => {
    const response = await axiosInstance.put<ApiResponse<RolePermission[]>>(
      ENDPOINTS.ROLES.UPDATE_PERMISSIONS(roleId),
      permissions
    );
    return response.data;
  },

  // ============================================
  // QUEUE CONFIGURATION
  // ============================================

  getQueueConfiguration: async (roleId: string): Promise<ApiResponse<QueueConfiguration>> => {
    const response = await axiosInstance.get<ApiResponse<QueueConfiguration>>(
      ENDPOINTS.ROLES.GET_QUEUE_CONFIG(roleId)
    );
    return response.data;
  },

  updateQueueConfiguration: async (
    roleId: string,
    config: Partial<QueueConfiguration>
  ): Promise<ApiResponse<QueueConfiguration>> => {
    const response = await axiosInstance.put<ApiResponse<QueueConfiguration>>(
      ENDPOINTS.ROLES.UPDATE_QUEUE_CONFIG(roleId),
      config
    );
    return response.data;
  },

  // ============================================
  // USER ROLE ASSIGNMENTS
  // ============================================

  getUserRoles: async (userId: string): Promise<ApiResponse<UserRoleAssignment[]>> => {
    const response = await axiosInstance.get<ApiResponse<UserRoleAssignment[]>>(
      ENDPOINTS.ROLES.GET_USER_ROLES(userId)
    );
    return response.data;
  },

  assignUserRole: async (
    userId: string,
    roleId: string,
    facilityId: string,
    departmentId?: string
  ): Promise<ApiResponse<UserRoleAssignment>> => {
    const response = await axiosInstance.post<ApiResponse<UserRoleAssignment>>(
      ENDPOINTS.ROLES.ASSIGN_USER_ROLE,
      { userId, roleId, facilityId, departmentId }
    );
    return response.data;
  },

  updateUserRoleAssignment: async (
    assignmentId: string,
    updateData: Partial<UserRoleAssignment>
  ): Promise<ApiResponse<UserRoleAssignment>> => {
    const response = await axiosInstance.put<ApiResponse<UserRoleAssignment>>(
      ENDPOINTS.ROLES.UPDATE_USER_ASSIGNMENT(assignmentId),
      updateData
    );
    return response.data;
  },

  removeUserRole: async (assignmentId: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      ENDPOINTS.ROLES.REMOVE_USER_ROLE(assignmentId)
    );
    return response.data;
  },

  // ============================================
  // ROLE STATISTICS
  // ============================================

  getRoleStatistics: async (facilityId?: string): Promise<ApiResponse<RoleStats>> => {
    const response = await axiosInstance.get<ApiResponse<RoleStats>>(
      ENDPOINTS.ROLES.STATISTICS,
      { params: { facilityId } }
    );
    return response.data;
  },

  // ============================================
  // CURRENT USER ROLES
  // ============================================

  getCurrentUserRoles: async (): Promise<ApiResponse<Role[]>> => {
    const response = await axiosInstance.get<ApiResponse<Role[]>>(
      ENDPOINTS.ROLES.CURRENT_USER_ROLES
    );
    return response.data;
  },

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  checkPermissions: async (
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> => {
    const response = await axiosInstance.post<ApiResponse<{ allowed: boolean; reason?: string }>>(
      ENDPOINTS.ROLES.CHECK_PERMISSIONS,
      { resource, action, context }
    );
    return response.data;
  },
};

// Type assertion to ensure all methods are properly typed
export default roleApi as typeof roleApi;