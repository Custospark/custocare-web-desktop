import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RoleQueue,
  QueueItem,
  QueueFilter,
  QueueStats,
} from '../../features/types/queue';
import  {
  PriorityLevel,
} from '../../features/types/queue';
import type { Visit, VisitStatus } from '../../features/types/visit';

export interface QueueState {
  roleQueues: Record<string, RoleQueue>;
  activeQueue: RoleQueue | null;
  queueFilters: Record<string, QueueFilter>;
  queueStats: QueueStats | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: string | null;
}

const initialState: QueueState = {
  roleQueues: {},
  activeQueue: null,
  queueFilters: {},
  queueStats: null,
  isLoading: false,
  error: null,
  lastRefreshed: null,
};

const queueSlice = createSlice({
  name: 'queues',
  initialState,
  reducers: {
    // Set role-specific queue
    setRoleQueue: (
      state, 
      action: PayloadAction<{ roleId: string; queue: RoleQueue }>
    ) => {
      const { roleId, queue } = action.payload;
      state.roleQueues[roleId] = queue;
      state.lastRefreshed = new Date().toISOString();
    },
    
    // Set active queue for current user
    setActiveQueue: (state, action: PayloadAction<RoleQueue>) => {
      state.activeQueue = action.payload;
      state.lastRefreshed = new Date().toISOString();
    },
    
    clearActiveQueue: (state) => {
      state.activeQueue = null;
    },
    
    // Update individual queue item
    updateQueueItem: (
      state,
      action: PayloadAction<{
        roleId?: string;
        item: QueueItem;
      }>
    ) => {
      const { roleId, item } = action.payload;
      
      if (roleId && state.roleQueues[roleId]) {
        const queue = state.roleQueues[roleId];
        const index = queue.items.findIndex(qi => qi.visitId === item.visitId);
        if (index !== -1) {
          queue.items[index] = item;
          queue.lastRefreshed = new Date().toISOString();
        }
      }
      
      if (state.activeQueue) {
        const index = state.activeQueue.items.findIndex(qi => qi.visitId === item.visitId);
        if (index !== -1) {
          state.activeQueue.items[index] = item;
          state.activeQueue.lastRefreshed = new Date().toISOString();
        }
      }
    },
    
    // Remove item from queue (when visit is completed or cancelled)
    removeQueueItem: (
      state,
      action: PayloadAction<{
        roleId?: string;
        visitId: string;
      }>
    ) => {
      const { roleId, visitId } = action.payload;
      
      if (roleId && state.roleQueues[roleId]) {
        state.roleQueues[roleId].items = state.roleQueues[roleId].items.filter(
          item => item.visitId !== visitId
        );
        state.roleQueues[roleId].totalCount = state.roleQueues[roleId].items.length;
        state.roleQueues[roleId].lastRefreshed = new Date().toISOString();
      }
      
      if (state.activeQueue) {
        state.activeQueue.items = state.activeQueue.items.filter(
          item => item.visitId !== visitId
        );
        state.activeQueue.totalCount = state.activeQueue.items.length;
        state.activeQueue.lastRefreshed = new Date().toISOString();
      }
    },
    
    // Filter management
    setQueueFilter: (
      state,
      action: PayloadAction<{
        roleId: string;
        filter: Partial<QueueFilter>;
      }>
    ) => {
      const { roleId, filter } = action.payload;
      state.queueFilters[roleId] = {
        ...state.queueFilters[roleId],
        ...filter,
      };
    },
    
    clearQueueFilter: (state, action: PayloadAction<string>) => {
      delete state.queueFilters[action.payload];
    },
    
    // Priority management
    updateItemPriority: (
      state,
      action: PayloadAction<{
        visitId: string;
        newPriority: PriorityLevel;
        reason?: string;
      }>
    ) => {
      const { visitId, newPriority } = action.payload;
      
      // Update in all role queues
      Object.keys(state.roleQueues).forEach(roleId => {
        const queue = state.roleQueues[roleId];
        const item = queue.items.find(qi => qi.visitId === visitId);
        if (item) {
          item.priority = newPriority;
          queue.lastRefreshed = new Date().toISOString();
        }
      });
      
      // Update in active queue
      if (state.activeQueue) {
        const item = state.activeQueue.items.find(qi => qi.visitId === visitId);
        if (item) {
          item.priority = newPriority;
          state.activeQueue.lastRefreshed = new Date().toISOString();
        }
      }
    },
    
    // Assignment management
    assignQueueItem: (
      state,
      action: PayloadAction<{
        visitId: string;
        assignTo: string;
        assignedBy: string;
        notes?: string;
      }>
    ) => {
      const { visitId, assignTo } = action.payload;
      
      // Update in all role queues
      Object.keys(state.roleQueues).forEach(roleId => {
        const queue = state.roleQueues[roleId];
        const item = queue.items.find(qi => qi.visitId === visitId);
        if (item) {
          item.assignedTo = assignTo;
          queue.lastRefreshed = new Date().toISOString();
        }
      });
      
      // Update in active queue
      if (state.activeQueue) {
        const item = state.activeQueue.items.find(qi => qi.visitId === visitId);
        if (item) {
          item.assignedTo = assignTo;
          state.activeQueue.lastRefreshed = new Date().toISOString();
        }
      }
    },
    
    // Stats
    setQueueStats: (state, action: PayloadAction<QueueStats>) => {
      state.queueStats = action.payload;
    },
    
    updateQueueStats: (
      state,
      action: PayloadAction<Partial<QueueStats>>
    ) => {
      if (state.queueStats) {
        state.queueStats = { ...state.queueStats, ...action.payload };
      }
    },
    
    // Role-based queue derivation (client-side filtering)
    filterQueueByRole: (
      state,
      action: PayloadAction<{
        roleId: string;
        allVisits: Visit[]; // or  VisitQueueItem[]
        visibleStatuses: VisitStatus[];
        sortBy?: 'priority' | 'waitTime' | 'registrationTime';
        sortDirection?: 'asc' | 'desc';
      }>
    ) => {
      const { roleId, allVisits, visibleStatuses, sortBy = 'priority', sortDirection = 'desc' } = action.payload;
      
      // Filter visits by visible statuses
      const filteredItems = allVisits
        .filter(visit => visibleStatuses.includes(visit.status))
        .map(visit => ({
          visitId: visit.id,
          patientId: visit.patientId,
          status: visit.status,
          priority: visit.priority,
          waitTime: Math.floor((Date.now() - new Date(visit.registrationTime).getTime()) / (1000 * 60)),
          clinicalUrgencyScore: calculateClinicalUrgency(visit),
          assignedTo: visit.assignedNurseId || visit.assignedPhysicianId,
          departmentId: visit.departmentId,
          lastUpdated: visit.updatedAt,
        }));
      
      // Sort items
      const sortedItems = [...filteredItems].sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = {
            [PriorityLevel.CRITICAL]: 5,
            [PriorityLevel.HIGH]: 4,
            [PriorityLevel.MEDIUM]: 3,
            [PriorityLevel.LOW]: 2,
            [PriorityLevel.ROUTINE]: 1,
          };
          return sortDirection === 'desc' 
            ? priorityOrder[b.priority] - priorityOrder[a.priority]
            : priorityOrder[a.priority] - priorityOrder[b.priority];
        } else if (sortBy === 'waitTime') {
          return sortDirection === 'desc' 
            ? b.waitTime - a.waitTime
            : a.waitTime - b.waitTime;
        } else {
          // registrationTime
          const timeA = new Date(allVisits.find(v => v.id === a.visitId)?.registrationTime || 0).getTime();
          const timeB = new Date(allVisits.find(v => v.id === b.visitId)?.registrationTime || 0).getTime();
          return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
        }
      });
      
      // Calculate queue metadata
      const criticalCount = sortedItems.filter(item => item.priority === PriorityLevel.CRITICAL).length;
      const highPriorityCount = sortedItems.filter(item => item.priority === PriorityLevel.HIGH).length;
      const averageWaitTime = sortedItems.length > 0
        ? sortedItems.reduce((sum, item) => sum + item.waitTime, 0) / sortedItems.length
        : 0;
      
      const queue: RoleQueue = {
        roleId,
        items: sortedItems,
        totalCount: sortedItems.length,
        lastRefreshed: new Date().toISOString(),
        metadata: {
          averageWaitTime,
          criticalCount,
          highPriorityCount,
          myAssignedCount: sortedItems.filter(item => item.assignedTo === 'current-user-id').length, // TODO: Replace with actual user ID
        },
      };
      
      state.roleQueues[roleId] = queue;
    },
    
    // Loading states
    setQueueLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setQueueError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset state
    resetQueueState: () => initialState,
  },
});

// Helper function to calculate clinical urgency score
const calculateClinicalUrgency = (visit: Visit): number => {
  let score = 0;
  
  // Base score based on priority
  const priorityScores = {
    [PriorityLevel.CRITICAL]: 10,
    [PriorityLevel.HIGH]: 8,
    [PriorityLevel.MEDIUM]: 5,
    [PriorityLevel.LOW]: 3,
    [PriorityLevel.ROUTINE]: 1,
  };
  score += priorityScores[visit.priority] || 1;
  
  // Adjust based on wait time (every 30 minutes adds 1 point)
  const waitTimeHours = (Date.now() - new Date(visit.registrationTime).getTime()) / (1000 * 60 * 60);
  score += Math.floor(waitTimeHours * 2);
  
  // Adjust for emergency visits
  if (visit.isEmergency) {
    score += 3;
  }
  
  // Adjust based on symptoms (simplified)
  if (visit.symptoms && visit.symptoms.length > 3) {
    score += 2;
  }
  
  // Cap at 10
  return Math.min(score, 10);
};

// Export actions
export const {
  setRoleQueue,
  setActiveQueue,
  clearActiveQueue,
  updateQueueItem,
  removeQueueItem,
  setQueueFilter,
  clearQueueFilter,
  updateItemPriority,
  assignQueueItem,
  setQueueStats,
  updateQueueStats,
  filterQueueByRole,
  setQueueLoading,
  setQueueError,
  resetQueueState,
} = queueSlice.actions;

// Export reducer
export default queueSlice.reducer;