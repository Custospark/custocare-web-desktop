import { 
  Role, 
  RoleType,
  RolePermission 
} from '../../types/role.types';
import { VisitStatus } from '../../types/visit.types';
import { PatientStatus } from '../../types/patient.types';

// Default role configurations
const DEFAULT_ROLE_PERMISSIONS: Record<RoleType, Partial<Role>> = {
  [RoleType.ADMIN]: {
    patientPermissions: {
      canCreate: true,
      canSearchAll: true,
      canViewSensitive: true,
      canMerge: true,
      canEditDemographics: true,
    },
    visitPermissions: {
      canCreate: true,
      canTransition: Object.values(VisitStatus),
      canViewAll: true,
      canAssign: true,
      canDischarge: true,
    },
  },
  [RoleType.RECEPTIONIST]: {
    patientPermissions: {
      canCreate: true,
      canSearchAll: true,
      canViewSensitive: false,
      canMerge: false,
      canEditDemographics: true,
    },
    visitPermissions: {
      canCreate: true,
      canTransition: [VisitStatus.REGISTERED, VisitStatus.CANCELLED],
      canViewAll: false,
      canAssign: false,
      canDischarge: false,
    },
  },
  [RoleType.TRIAGE_NURSE]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: true,
      canViewSensitive: true,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [
        VisitStatus.TRIAGED,
        VisitStatus.VITAL_SIGNS_TAKEN,
        VisitStatus.CANCELLED,
      ],
      canViewAll: true,
      canAssign: true,
      canDischarge: false,
    },
  },
  [RoleType.PHYSICIAN]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: true,
      canViewSensitive: true,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [
        VisitStatus.PHYSICIAN_ASSESSMENT,
        VisitStatus.DIAGNOSTICS_ORDERED,
        VisitStatus.TREATMENT,
        VisitStatus.ADMISSION_ORDERED,
        VisitStatus.DISCHARGE_ORDERED,
        VisitStatus.CANCELLED,
      ],
      canViewAll: true,
      canAssign: true,
      canDischarge: true,
    },
  },
  [RoleType.NURSE]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: true,
      canViewSensitive: true,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [
        VisitStatus.VITAL_SIGNS_TAKEN,
        VisitStatus.TREATMENT,
      ],
      canViewAll: true,
      canAssign: false,
      canDischarge: false,
    },
  },
  [RoleType.LAB_TECHNICIAN]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: false,
      canViewSensitive: false,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [
        VisitStatus.DIAGNOSTICS_COMPLETED,
      ],
      canViewAll: false,
      canAssign: false,
      canDischarge: false,
    },
  },
  [RoleType.RADIOLOGY_TECH]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: false,
      canViewSensitive: false,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [
        VisitStatus.DIAGNOSTICS_COMPLETED,
      ],
      canViewAll: false,
      canAssign: false,
      canDischarge: false,
    },
  },
  [RoleType.PHARMACIST]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: false,
      canViewSensitive: true, // Need to see allergies
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [],
      canViewAll: false,
      canAssign: false,
      canDischarge: false,
    },
  },
  [RoleType.BILLING_CLERK]: {
    patientPermissions: {
      canCreate: false,
      canSearchAll: true,
      canViewSensitive: false,
      canMerge: false,
      canEditDemographics: false,
    },
    visitPermissions: {
      canCreate: false,
      canTransition: [],
      canViewAll: true,
      canAssign: false,
      canDischarge: false,
    },
  },
};

// Default queue visibility by role
const DEFAULT_QUEUE_VISIBILITY: Record<RoleType, VisitStatus[]> = {
  [RoleType.ADMIN]: Object.values(VisitStatus),
  [RoleType.RECEPTIONIST]: [VisitStatus.REGISTERED, VisitStatus.CANCELLED],
  [RoleType.TRIAGE_NURSE]: [
    VisitStatus.REGISTERED,
    VisitStatus.TRIAGED,
    VisitStatus.VITAL_SIGNS_TAKEN,
  ],
  [RoleType.PHYSICIAN]: [
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.DIAGNOSTICS_ORDERED,
    VisitStatus.DIAGNOSTICS_COMPLETED,
    VisitStatus.TREATMENT,
  ],
  [RoleType.NURSE]: [
    VisitStatus.TRIAGED,
    VisitStatus.VITAL_SIGNS_TAKEN,
    VisitStatus.TREATMENT,
  ],
  [RoleType.LAB_TECHNICIAN]: [VisitStatus.DIAGNOSTICS_ORDERED],
  [RoleType.RADIOLOGY_TECH]: [VisitStatus.DIAGNOSTICS_ORDERED],
  [RoleType.PHARMACIST]: [VisitStatus.TREATMENT],
  [RoleType.BILLING_CLERK]: [VisitStatus.DISCHARGED],
};

export const getDefaultRolePermissions = (roleType: RoleType): Partial<Role> => {
  return DEFAULT_ROLE_PERMISSIONS[roleType] || {};
};

export const getDefaultQueueVisibility = (roleType: RoleType): VisitStatus[] => {
  return DEFAULT_QUEUE_VISIBILITY[roleType] || [];
};

// Permission checking functions
export const canCreatePatient = (role: Role): boolean => {
  return role.patientPermissions.canCreate;
};

export const canSearchAllPatients = (role: Role): boolean => {
  return role.patientPermissions.canSearchAll;
};

export const canViewSensitivePatientInfo = (role: Role): boolean => {
  return role.patientPermissions.canViewSensitive;
};

export const canMergePatients = (role: Role): boolean => {
  return role.patientPermissions.canMerge;
};

export const canEditPatientDemographics = (role: Role): boolean => {
  return role.patientPermissions.canEditDemographics;
};

export const canCreateVisit = (role: Role): boolean => {
  return role.visitPermissions.canCreate;
};

export const canTransitionVisitStatus = (
  role: Role, 
  targetStatus: VisitStatus
): boolean => {
  return role.visitPermissions.canTransition.includes(targetStatus);
};

export const canViewAllVisits = (role: Role): boolean => {
  return role.visitPermissions.canViewAll;
};

export const canAssignVisit = (role: Role): boolean => {
  return role.visitPermissions.canAssign;
};

export const canDischargeVisit = (role: Role): boolean => {
  return role.visitPermissions.canDischarge;
};

// Queue visibility checking
export const canViewVisitInQueue = (
  role: Role, 
  visitStatus: VisitStatus
): boolean => {
  return role.queueConfig.visibleStatuses.includes(visitStatus);
};

// Role-based action authorization
export const authorizePatientAction = (
  role: Role,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MERGE',
  patientStatus?: PatientStatus
): boolean => {
  switch (action) {
    case 'CREATE':
      return canCreatePatient(role);
    case 'READ':
      return canSearchAllPatients(role);
    case 'UPDATE':
      return canEditPatientDemographics(role);
    case 'DELETE':
      return role.type === RoleType.ADMIN;
    case 'MERGE':
      return canMergePatients(role);
    default:
      return false;
  }
};

export const authorizeVisitAction = (
  role: Role,
  action: 'CREATE' | 'TRANSITION' | 'ASSIGN' | 'DISCHARGE' | 'VIEW',
  visitStatus?: VisitStatus,
  targetStatus?: VisitStatus
): boolean => {
  switch (action) {
    case 'CREATE':
      return canCreateVisit(role);
    case 'TRANSITION':
      return targetStatus ? canTransitionVisitStatus(role, targetStatus) : false;
    case 'ASSIGN':
      return canAssignVisit(role);
    case 'DISCHARGE':
      return canDischargeVisit(role);
    case 'VIEW':
      return canViewAllVisits(role) || 
             (visitStatus ? canViewVisitInQueue(role, visitStatus) : false);
    default:
      return false;
  }
};

// Emergency override permissions
export const hasEmergencyOverride = (role: Role): boolean => {
  const emergencyRoles = [
    RoleType.ADMIN,
    RoleType.PHYSICIAN,
    RoleType.TRIAGE_NURSE,
  ];
  return emergencyRoles.includes(role.type);
};

// Department-specific permissions
export const canAccessDepartment = (
  role: Role,
  departmentId: string,
  userDepartments: string[]
): boolean => {
  if (role.type === RoleType.ADMIN) return true;
  
  // Check if user has access to this department
  return userDepartments.includes(departmentId);
};

// Permission escalation checking
export const canEscalatePriority = (role: Role): boolean => {
  const escalationRoles = [
    RoleType.ADMIN,
    RoleType.PHYSICIAN,
    RoleType.TRIAGE_NURSE,
  ];
  return escalationRoles.includes(role.type);
};

// Audit trail access
export const canViewAuditTrail = (role: Role): boolean => {
  const auditRoles = [
    RoleType.ADMIN,
    RoleType.PHYSICIAN,
  ];
  return auditRoles.includes(role.type);
};

// Billing access
export const canViewBilling = (role: Role): boolean => {
  const billingRoles = [
    RoleType.ADMIN,
    RoleType.BILLING_CLERK,
    RoleType.PHYSICIAN, // For treatment decisions
  ];
  return billingRoles.includes(role.type);
};

export const canEditBilling = (role: Role): boolean => {
  const billingEditRoles = [
    RoleType.ADMIN,
    RoleType.BILLING_CLERK,
  ];
  return billingEditRoles.includes(role.type);
};

// Utility to check multiple permissions
export const checkPermissions = (
  role: Role,
  permissions: Array<{
    resource: 'PATIENT' | 'VISIT' | 'QUEUE' | 'BILLING' | 'AUDIT';
    action: string;
    context?: any;
  }>
): boolean => {
  return permissions.every(permission => {
    switch (permission.resource) {
      case 'PATIENT':
        return authorizePatientAction(
          role, 
          permission.action as any, 
          permission.context?.patientStatus
        );
      case 'VISIT':
        return authorizeVisitAction(
          role,
          permission.action as any,
          permission.context?.visitStatus,
          permission.context?.targetStatus
        );
      case 'QUEUE':
        return canViewVisitInQueue(role, permission.context?.visitStatus);
      case 'BILLING':
        if (permission.action === 'VIEW') return canViewBilling(role);
        if (permission.action === 'EDIT') return canEditBilling(role);
        return false;
      case 'AUDIT':
        return canViewAuditTrail(role);
      default:
        return false;
    }
  });
};