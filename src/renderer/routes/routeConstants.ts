/**
 * Route Constants
 */

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  APPOINTMENTS: '/appointments',

  PROFILE: '/profile',
  SETTINGS: '/settings',
  LOGOUT: '/logout',
} as const;

type RouteValue = typeof ROUTES[keyof typeof ROUTES];

/**
 * Route helpers
 */
export const getPatientDetailRoute = (patientId: string): string =>
  `/patients/${patientId}`;

export const navigateToPatient = (patientId: string): string =>
  getPatientDetailRoute(patientId);

/**
 * Public routes
 */
const PUBLIC_ROUTES: readonly RouteValue[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
];

export const isPublicRoute = (path: string): boolean =>
  PUBLIC_ROUTES.includes(path as RouteValue);

/**
 * Protected routes
 */
export const isProtectedRoute = (path: string): boolean =>
  !isPublicRoute(path) && path !== '/';
