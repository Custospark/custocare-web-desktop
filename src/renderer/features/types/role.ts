import { 
  RoleType, 
  VisitStatus, 
  PriorityLevel,
  BaseEntity,
  BaseFilterParams,
    PaginatedResponse,
  ApiResponse,
} from './shared';

export {RoleType , PaginatedResponse,
  ApiResponse,}


// Resource types for permissions
export type ResourceType = 
  | 'PATIENT' 
  | 'VISIT' 
  | 'QUEUE' 
  | 'BILLING' 
  | 'AUDIT' 
  | 'ROLE' 
  | 'FACILITY' 
  | 'USER';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE' | 'EXPORT';
export type PermissionScope = 'OWN' | 'DEPARTMENT' | 'FACILITY' | 'ALL';

// Type-safe conditions for permissions
export interface PermissionConditions {
  allowedStatuses?: VisitStatus[];
  allowedPriorities?: PriorityLevel[];
  departmentIds?: string[];
  facilityIds?: string[];
  minUrgencyScore?: number;
  maxWaitTime?: number; // in minutes
}

export interface RolePermission {
  id: string;
  roleId: string;
  resource: ResourceType;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: PermissionConditions;
}

export interface QueueConfiguration {
  id: string;
  roleId: string;
  visibleStatuses: VisitStatus[];
  defaultPriority: PriorityLevel[];
  sortOrder: {
    field: 'priority' | 'waitTime' | 'registrationTime' | 'clinicalUrgency';
    direction: 'asc' | 'desc';
  };
  autoAssign: boolean;
  maxQueueSize?: number;
  refreshInterval: number; // in seconds
  filters?: {
    departments?: string[];
    maxWaitTime?: number;
    minPriority?: PriorityLevel;
  };
}

export interface Role extends BaseEntity {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  facilityId: string;
  departmentId?: string;
  
  // Patient Permissions
  patientPermissions: {
    canCreate: boolean;
    canSearchAll: boolean;
    canViewSensitive: boolean;
    canMerge: boolean;
    canEditDemographics: boolean;
    canArchive: boolean;
    allowedPatientStatuses: string[]; // Which patient statuses this role can view
  };
  
  // Visit Permissions
  visitPermissions: {
    canCreate: boolean;
    canTransition: VisitStatus[];
    canViewAll: boolean;
    canAssign: boolean;
    canDischarge: boolean;
    canCancel: boolean;
    allowedDepartments?: string[]; // Specific departments this role can work in
  };
  
  // Queue Configuration
  queueConfig: QueueConfiguration;
  
  // System
  isActive: boolean;
  permissions: RolePermission[]; // Granular permissions for fine-grained control
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  facilityId: string;
  departmentId?: string;
  effectiveDate: string;
  expiryDate?: string;
  isDefault: boolean;
  isActive: boolean;
  assignedBy: string;
  assignedAt: string;
}

export interface RoleUpdateData {
  name?: string;
  description?: string;
  patientPermissions?: Partial<Role['patientPermissions']>;
  visitPermissions?: Partial<Role['visitPermissions']>;
  queueConfig?: Partial<QueueConfiguration>;
  isActive?: boolean;
  permissions?: RolePermission[];
}

export interface RoleFilterParams extends BaseFilterParams {
  type?: RoleType;
  isActive?: boolean;
  facilityId?: string;
  departmentId?: string;
  name?: string;
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  byType: Record<RoleType, number>;
  usersPerRole: Record<string, number>;
}

// Permission checking utilities
export interface PermissionCheck {
  resource: ResourceType;
  action: PermissionAction;
  scope?: PermissionScope;
  conditions?: PermissionConditions;
}

// Role-based access control interfaces
export interface RBACContext {
  userId: string;
  facilityId: string;
  departmentId?: string;
  userRoles: string[]; // Role IDs
  timestamp: string;
}

// Queue visibility configuration
export interface QueueVisibilityRule {
  roleId: string;
  statuses: VisitStatus[];
  priorities: PriorityLevel[];
  departments: string[];
  filters: {
    maxWaitTime: number;
    minUrgencyScore: number;
  };
}