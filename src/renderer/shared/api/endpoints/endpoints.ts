/**
 * API Endpoints Configuration
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    GET_PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
  },

  // Patients
  PATIENTS: {
    LIST: '/patients',
    GET_BY_ID: (id: string) => `/patients/${id}`,
    CREATE: '/patients',
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
    SEARCH: '/patients/search',
    GET_RECORDS: (id: string) => `/patients/${id}/records`,
  },

  // Dashboard
  DASHBOARD: {
    GET_STATS: '/dashboard/stats',
    GET_ANALYTICS: '/dashboard/analytics',
    GET_REPORTS: '/dashboard/reports',
    GET_APPOINTMENTS: '/dashboard/appointments',
  },

  // Medical Records
  RECORDS: {
    LIST: '/records',
    GET_BY_ID: (id: string) => `/records/${id}`,
    CREATE: '/records',
    UPDATE: (id: string) => `/records/${id}`,
    DELETE: (id: string) => `/records/${id}`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    GET_BY_ID: (id: string) => `/appointments/${id}`,
    CREATE: '/appointments',
    UPDATE: (id: string) => `/appointments/${id}`,
    DELETE: (id: string) => `/appointments/${id}`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
  },
  // Billing Endpoints
  BILLING: {
    INVOICES: '/billing/invoices',
    GET_INVOICE: (id: string) => `/billing/invoices/${id}`,
    UPDATE_INVOICE: (id: string) => `/billing/invoices/${id}`,
    DELETE_INVOICE: (id: string) => `/billing/invoices/${id}`,
    CREATE_INVOICE: '/billing/invoices',
    GET_VISIT_INVOICE: (visitId: string) => `/billing/visits/${visitId}/invoice`,
    GET_PATIENT_INVOICES: (patientId: string) => `/billing/patients/${patientId}/invoices`,
    GENERATE_VISIT_INVOICE: (visitId: string) => `/billing/visits/${visitId}/generate-invoice`,
    
    PAYMENTS: '/billing/payments',
    GET_PAYMENT: (id: string) => `/billing/payments/${id}`,
    CREATE_PAYMENT: '/billing/payments',
    UPDATE_PAYMENT: (id: string) => `/billing/payments/${id}`,
    REFUND_PAYMENT: (paymentId: string) => `/billing/payments/${paymentId}/refund`,
    GENERATE_RECEIPT: (paymentId: string) => `/billing/payments/${paymentId}/receipt`,
    
    CLAIMS: '/billing/claims',
    GET_CLAIM: (id: string) => `/billing/claims/${id}`,
    CREATE_CLAIM: '/billing/claims',
    UPDATE_CLAIM: (id: string) => `/billing/claims/${id}`,
    SUBMIT_CLAIM: (claimId: string) => `/billing/claims/${claimId}/submit`,
    
    GET_SUMMARY: (patientId: string) => `/billing/patients/${patientId}/summary`,
    STATISTICS: '/billing/statistics',
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
} as const;

export default API_ENDPOINTS;