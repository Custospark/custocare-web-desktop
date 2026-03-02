export const ROUTES = {
  // Home & Dashboard
  HOME: '/',
  LANDING: '/home',
  DASHBOARD: '/dashboard',

  // Authentication Routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_SUCCESS: '/reset-password-success',
  TWO_FACTOR_AUTH: '/verify-2fa',

  // Facility Management
  FACILITIES: '/facilities',
  FACILITY_ONBOARDING: '/facilities/onboarding',
  STAFF_DASHBOARD: '/staff/dashboard',

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

  // Dashboards
  PATIENT_DASHBOARD: '/dahboard/patient',

  // Role-Based Clinical Modules
  MEDICAL_RECORDS: '/medical-records',
  NURSING: '/nursing',
  CLINICAL: '/clinical',
  LABORATORY: '/laboratory',

  // Top-level Modules
  PHARMACY: '/pharmacy',
  BILLING: '/billing',
  ADMINISTRATION: '/administration',
  ACCOUNT: '/acount',
} as const;


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