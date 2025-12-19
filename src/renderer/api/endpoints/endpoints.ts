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
} as const;

export default API_ENDPOINTS;