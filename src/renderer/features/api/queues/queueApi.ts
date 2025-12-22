import axiosInstance from '../configs/axiosConfig';
import { ENDPOINTS } from '../endpoints/endpoints';
import {
  RoleQueue,
  QueueAssignment,
  PriorityUpdate,
  QueueFilter,
  QueueStats,
  ApiResponse,
} from '../../types/queue';
import { VisitQueueItem } from '../../types/visit';

export const queueApi = {
  // Get role-specific queue
  getRoleQueue: async (roleId: string, filters?: QueueFilter) => {
    const response = await axiosInstance.get<ApiResponse<RoleQueue>>(
      ENDPOINTS.QUEUES.GET_ROLE_QUEUE(roleId),
      { params: filters }
    );
    return response.data;
  },

  // Get my assigned queue (for current user)
  getMyQueue: async (userId: string, filters?: QueueFilter) => {
    const response = await axiosInstance.get<ApiResponse<RoleQueue>>(
      ENDPOINTS.QUEUES.GET_MY_QUEUE(userId),
      { params: filters }
    );
    return response.data;
  },

  // Update visit priority in queue
  updateQueuePriority: async (priorityUpdate: PriorityUpdate) => {
    const response = await axiosInstance.put<ApiResponse<VisitQueueItem>>(
      ENDPOINTS.QUEUES.UPDATE_PRIORITY(priorityUpdate.visitId),
      priorityUpdate
    );
    return response.data;
  },

  // Assign visit to user
  assignQueueVisit: async (assignment: QueueAssignment) => {
    const response = await axiosInstance.put<ApiResponse<VisitQueueItem>>(
      ENDPOINTS.QUEUES.ASSIGN_VISIT(assignment.visitId),
      assignment
    );
    return response.data;
  },

  // Get queue statistics
  getQueueStats: async (roleId?: string, facilityId?: string) => {
    const response = await axiosInstance.get<ApiResponse<QueueStats>>(
      ENDPOINTS.QUEUES.GET_STATS,
      { params: { roleId, facilityId } }
    );
    return response.data;
  },
};