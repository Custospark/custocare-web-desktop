import { VisitStatus, PriorityLevel } from './shared';
export {PriorityLevel}

export interface QueueItem {
  visitId: string;
  patientId: string;
  status: VisitStatus;
  priority: PriorityLevel;
  waitTime: number; // in minutes
  clinicalUrgencyScore: number; // 1-10
  assignedTo?: string;
  departmentId: string;
  lastUpdated: string;
}

export interface RoleQueue {
  roleId: string;
  items: QueueItem[];
  totalCount: number;
  lastRefreshed: string;
  metadata: {
    averageWaitTime: number;
    criticalCount: number;
    highPriorityCount: number;
    myAssignedCount: number;
  };
}

export interface QueueAssignment {
  visitId: string;
  assignToUserId: string;
  assignedByUserId: string;
  notes?: string;
}

export interface PriorityUpdate {
  visitId: string;
  newPriority: PriorityLevel;
  reason?: string;
  userId: string;
}

export interface QueueFilter {
  status?: VisitStatus[];
  priority?: PriorityLevel[];
  departmentId?: string;
  assignedToMe?: boolean;
  searchTerm?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface QueueStats {
  totalInQueue: number;
  byStatus: Record<VisitStatus, number>;
  byPriority: Record<PriorityLevel, number>;
  averageWaitTimes: Record<VisitStatus, number>;
  longestWait: {
    visitId: string;
    waitTime: number;
    patientName: string;
  };
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

// Queue mutation responses
export interface PriorityUpdateResult {
  visitId: string;
  oldPriority: PriorityLevel;
  newPriority: PriorityLevel;
  updatedAt: string;
}

export interface QueueAssignmentResult {
  visitId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  assignedAt: string;
}
