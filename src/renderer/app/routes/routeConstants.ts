
/**
 * Application Route Constants
 * 
 * Centralized route management for maintainability
 * All routes use HashRouter format (prefixed with # in browser)
 */

export const ROUTES = {
  // Home & Dashboard
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Authentication Routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  TWO_FACTOR_AUTH: '/verify-2fa',

  // Facility Management
  FACILITIES: '/facilities',
  FACILITY_ONBOARDING: '/facilities/onboarding',

  // Patient Management
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',

  // Clinical Modules
  ENCOUNTERS: '/encounters',

  // Analytics & Reporting
  REPORTS: '/reports',
  ANALYTICS: '/analytics',

  // System & Administration
  SYSTEM: '/system',
  SETTINGS: '/settings',
  SECURITY: '/security',

  // Support & Help
  HELP: '/help',

  // Role-Based Clinical Modules
  FRONT_DESK: '/front-desk',
  NURSING: '/nursing',
  CLINICAL_WORKSPACE: '/clinical-workspace',
  LABORATORY: '/laboratory',
  PHARMACY: '/pharmacy',
  BILLING: '/billing',
  CLINICAL_SERVICES: '/clinical-services',
  ADMINISTRATION: '/administration',

} as const;

/**
 * Type-safe route generators
 * For dynamic routes with parameters
 */
export const generateRoute = {
  patientDetail: (id: string) => `/patients/${id}`,
  encounterDetail: (id: string) => `/encounters/${id}`,
  resetPassword: (token: string, email?: string) =>
    `/reset-password?token=${token}${email ? `&email=${encodeURIComponent(email)}` : ''}`,
} as const;

/**
 * Helper function to check if a route is public (no auth required)
 */
export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.TWO_FACTOR_AUTH,
  ];
  
  return publicRoutes.some(route => pathname.startsWith(route));
};

/**
 * Helper function to get the current route from hash
 * For HashRouter compatibility
 */
export const getCurrentRoute = (): string => {
  const hash = window.location.hash;
  return hash.startsWith('#') ? hash.substring(1) || '/' : hash;
};