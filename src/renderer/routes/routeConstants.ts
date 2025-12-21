// utils/routeConstants.ts
export const ROUTES = {
  // Home & Dashboard
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Authentication Routes
  LOGIN: '/login',
  REGISTER: '/register',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  TWO_FACTOR_AUTH: '/verify-2fa',
  VERIFY_EMAIL: '/verify-email',

  // Facility Management Module
  FACILITIES: '/facilities',
  FACILITY_DETAIL: '/facilities/:id',
  FACILITY_ONBOARDING: '/facilities/onboarding',

  // Patient Management
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  PATIENT_CREATE: '/patients/new',
  PATIENT_SEARCH: '/patients/search',
  PATIENT_REGISTER: '/patients/register',
  PATIENT_DISCHARGE: '/patients/discharge',

  // Clinical Modules
  APPOINTMENTS: '/appointments',
  ENCOUNTERS: '/encounters',
  ENCOUNTER_DETAIL: '/encounters/:id',
  ENCOUNTER_NEW: '/encounters/new',
  ENCOUNTER_CLINICAL: '/encounters/:id/clinical',
  
  // Department Queues
  DEPARTMENT_QUEUES: '/department-queues',
  LAB_QUEUE: '/department-queues/lab',
  PHARMACY_QUEUE: '/department-queues/pharmacy',
  RADIOLOGY_QUEUE: '/department-queues/radiology',
  BILLING_QUEUE: '/department-queues/billing',

  // Analytics & Reporting
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  CLINICAL_ANALYTICS: '/analytics/clinical',

  // System & Administration
  SYSTEM: '/system',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SECURITY: '/security',

  // Support & Help
  HELP: '/help',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Logout
  LOGOUT: '/logout',

  // Error Pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  SERVER_ERROR: '/500',
} as const;

// Dynamic route generators
export const generateRoute = {
  patientDetail: (id: string) => `/patients/${id}`,
  encounterDetail: (id: string) => `/encounters/${id}`,
  encounterClinical: (id: string) => `/encounters/${id}/clinical`,
  resetPassword: (token: string, email?: string) =>
    `/reset-password?token=${token}${email ? `&email=${encodeURIComponent(email)}` : ''}`,
  facilityDetail: (id: string) => `/facilities/${id}`,
  departmentQueue: (department: string) => `/department-queues/${department}`,
} as const;