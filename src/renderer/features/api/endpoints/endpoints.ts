export const ENDPOINTS = {
  // Patient Endpoints
  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    GET_BY_ID: (id: string) => `/patients/${id}`,
    UPDATE: (id: string) => `/patients/${id}`,
    SEARCH: '/patients/search',
    CHECK_DUPLICATES: '/patients/check-duplicates',
    MERGE: '/patients/merge',
    STATS: '/patients/stats',
    ACTIVITY: (id: string) => `/patients/${id}/activity`,
  },
  
  // Visit Endpoints
  VISITS: {
    CREATE: '/visits',
    GET_BY_ID: (id: string) => `/visits/${id}`,
    TRANSITION: (id: string) => `/visits/${id}/transition`,
    GET_PATIENT_VISITS: (patientId: string) => `/visits/patient/${patientId}`,
    EMERGENCY: '/visits/emergency',
    UPDATE_PRIORITY: (id: string) => `/visits/${id}/priority`,
    UPDATE_ASSIGNMENT: (id: string) => `/visits/${id}/assign`,
    STATS: '/visits/stats',
    FILTER: '/visits/filter',
  },
  
  // Queue Endpoints
  QUEUES: {
    GET_ROLE_QUEUE: (roleId: string) => `/queues/role/${roleId}`,
    UPDATE_PRIORITY: (visitId: string) => `/queues/visit/${visitId}/priority`,
    ASSIGN_VISIT: (visitId: string) => `/queues/visit/${visitId}/assign`,
    GET_STATS: '/queues/stats',
    GET_MY_QUEUE: (userId: string) => `/queues/user/${userId}`,
  },
  
  // Role Endpoints
  ROLES: {
    GET_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    UPDATE_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    GET_QUEUE_CONFIG: (roleId: string) => `/queue-configurations/role/${roleId}`,
    UPDATE_QUEUE_CONFIG: (configId: string) => `/queue-configurations/${configId}`,
    GET_ALL: '/roles',
    GET_BY_TYPE: (type: string) => `/roles/type/${type}`,
  },
  
  // Billing Endpoints
  BILLING: {
    CREATE_INVOICE: '/billing/invoices',
    GET_INVOICE: (id: string) => `/billing/invoices/${id}`,
    GET_PATIENT_INVOICES: (patientId: string) => `/billing/patients/${patientId}/invoices`,
    GET_VISIT_INVOICE: (visitId: string) => `/billing/visits/${visitId}/invoice`,
    CREATE_CLAIM: '/billing/claims',
    PROCESS_PAYMENT: '/billing/payments',
    GET_SUMMARY: (patientId: string) => `/billing/patients/${patientId}/summary`,
  },
  
  // Audit Endpoints
  AUDIT: {
    GET_ENTITY_AUDIT: (entityType: string, entityId: string) => 
      `/audit/${entityType}/${entityId}`,
    SEARCH_AUDIT: '/audit/search',
    EXPORT_AUDIT: '/audit/export',
  },
} as const;