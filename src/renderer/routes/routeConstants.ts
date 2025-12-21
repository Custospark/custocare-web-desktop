/**
 * ROUTE CONSTANTS
 * ============================================================================
 *
 * Centralized route path definitions for the Custocare AI application.
 * Provides type-safe route references and prevents hardcoded path strings.
 *
 * Best Practices:
 * - Use these constants instead of hardcoded strings
 * - Update once, reflected everywhere
 * - Enables easy refactoring of URL structure
 * - Type-safe route references
 */

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

  // Analytics & Reporting
  REPORTS: '/reports',
  ANALYTICS: '/analytics',

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

/* ============================================================================
 * Type-safe helper for route values
 * ============================================================================
 */
type RouteValue = typeof ROUTES[keyof typeof ROUTES];

/* ============================================================================
 * Dynamic route generators for parameterized paths
 * ============================================================================
 */
export const generateRoute = {
  patientDetail: (id: string) => `/patients/${id}`,
  encounterDetail: (id: string) => `/encounters/${id}`,
  resetPassword: (token: string, email?: string) =>
    `/reset-password?token=${token}${email ? `&email=${encodeURIComponent(email)}` : ''}`,
  facilityDetail: (id: string) => `/facilities/${id}`,

} as const;

/* ============================================================================
 * Helper for individual route navigation
 * ============================================================================
 */
export const getPatientDetailRoute = (patientId: string): string =>
  generateRoute.patientDetail(patientId);

export const navigateToPatient = (patientId: string): string =>
  getPatientDetailRoute(patientId);

/* ============================================================================
 * Public vs Protected Routes
 * ============================================================================
 */
const PUBLIC_ROUTES: readonly RouteValue[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.TWO_FACTOR_AUTH,
  ROUTES.VERIFY_EMAIL,
];

export const isPublicRoute = (path: string): boolean =>
  PUBLIC_ROUTES.includes(path as RouteValue);

export const isProtectedRoute = (path: string): boolean =>
  !isPublicRoute(path) && path !== ROUTES.HOME;

export default ROUTES;