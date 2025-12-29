// ============================================
// UPDATED ENDPOINTS CONFIGURATION
// ============================================

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
    // Basic CRUD operations
    GET_ALL: '/roles',
    GET_BY_ID: (id: string) => `/roles/${id}`,
    CREATE: '/roles',
    UPDATE: (id: string) => `/roles/${id}`,
    DELETE: (id: string) => `/roles/${id}`,
    
    // Role types
    GET_BY_TYPE: (type: string) => `/roles/type/${type}`,
    
    // Permission management
    GET_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    UPDATE_PERMISSIONS: (id: string) => `/roles/${id}/permissions`,
    
    // Queue configuration
    GET_QUEUE_CONFIG: (roleId: string) => `/queue-configurations/role/${roleId}`,
    UPDATE_QUEUE_CONFIG: (roleId: string) => `/queue-configurations/role/${roleId}`,
    
    // User role assignments
    GET_USER_ROLES: (userId: string) => `/users/${userId}/roles`,
    ASSIGN_USER_ROLE: '/user-role-assignments',
    UPDATE_USER_ASSIGNMENT: (assignmentId: string) => `/user-role-assignments/${assignmentId}`,
    REMOVE_USER_ROLE: (assignmentId: string) => `/user-role-assignments/${assignmentId}`,
    
    // Current user roles
    CURRENT_USER_ROLES: '/users/me/roles',
    
    // Statistics
    STATISTICS: '/roles/statistics',
    
    // Permission checks
    CHECK_PERMISSIONS: '/permissions/check',
    
    // Role search
    SEARCH: '/roles/search',
  },
  
  // Billing Endpoints - COMPLETELY UPDATED
  BILLING: {
    // Invoice Endpoints
    INVOICES: '/billing/invoices',
    CREATE_INVOICE: '/billing/invoices',
    GET_INVOICE: (id: string) => `/billing/invoices/${id}`,
    UPDATE_INVOICE: (id: string) => `/billing/invoices/${id}`,
    DELETE_INVOICE: (id: string) => `/billing/invoices/${id}`,
    GET_PATIENT_INVOICES: (patientId: string) => `/billing/patients/${patientId}/invoices`,
    GET_VISIT_INVOICE: (visitId: string) => `/billing/visits/${visitId}/invoice`,
    GENERATE_VISIT_INVOICE: (visitId: string) => `/billing/visits/${visitId}/generate-invoice`,
    REGENERATE_INVOICE: (invoiceId: string) => `/billing/invoices/${invoiceId}/regenerate`,
    
    // Payment Endpoints
    PAYMENTS: '/billing/payments',
    CREATE_PAYMENT: '/billing/payments',
    GET_PAYMENT: (id: string) => `/billing/payments/${id}`,
    UPDATE_PAYMENT: (id: string) => `/billing/payments/${id}`,
    DELETE_PAYMENT: (id: string) => `/billing/payments/${id}`,
    REFUND_PAYMENT: (paymentId: string) => `/billing/payments/${paymentId}/refund`,
    PROCESS_PAYMENT: '/billing/payments/process',
    
    // Claim Endpoints
    CLAIMS: '/billing/claims',
    CREATE_CLAIM: '/billing/claims',
    GET_CLAIM: (id: string) => `/billing/claims/${id}`,
    UPDATE_CLAIM: (id: string) => `/billing/claims/${id}`,
    DELETE_CLAIM: (id: string) => `/billing/claims/${id}`,
    SUBMIT_CLAIM: (claimId: string) => `/billing/claims/${claimId}/submit`,
    
    // Summary & Statistics
    GET_SUMMARY: (patientId: string) => `/billing/patients/${patientId}/summary`,
    STATISTICS: '/billing/statistics',
    
    // Document Generation
    GENERATE_RECEIPT: (paymentId: string) => `/billing/payments/${paymentId}/receipt`,
    GENERATE_INVOICE_PDF: (invoiceId: string) => `/billing/invoices/${invoiceId}/pdf`,
    GENERATE_CLAIM_FORM: (claimId: string) => `/billing/claims/${claimId}/form`,
    
    // Batch Operations
    BATCH_PAYMENTS: '/billing/payments/batch',
    BATCH_SUBMIT_CLAIMS: '/billing/claims/batch-submit',
  },
  
  // Audit Endpoints
  AUDIT: {
    GET_ENTITY_AUDIT: (entityType: string, entityId: string) => 
      `/audit/${entityType}/${entityId}`,
    SEARCH_AUDIT: '/audit/search',
    EXPORT_AUDIT: '/audit/export',
  },
} as const;