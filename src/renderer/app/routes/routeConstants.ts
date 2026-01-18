// routeConstants.ts

/**
 * Application Route Constants
 *
 * Centralized route management for maintainability
 * All routes use HashRouter format (prefixed with # in browser)
 */

export const ROUTES = {
  // Home & Dashboard
  HOME: '/',
  LANDING: '/landing',
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

/**
 * Pharmacy nested routes (best practice: explicit, centralized)
 */
export const PHARMACY_ROUTES = {
  ROOT: ROUTES.PHARMACY,
  OVERVIEW: `${ROUTES.PHARMACY}/overview`,
  PRESCRIPTIONS: `${ROUTES.PHARMACY}/prescriptions`,
  INVENTORY: `${ROUTES.PHARMACY}/inventory`,
  DISPENSING: `${ROUTES.PHARMACY}/dispensing`,
  BILLING: `${ROUTES.PHARMACY}/billing`,

  // Inventory nested actions
  INVENTORY_OVERVIEW: `${ROUTES.PHARMACY}/inventory/overview`,
  INVENTORY_ADD_STOCK: `${ROUTES.PHARMACY}/inventory/add-stock`,
  INVENTORY_SEARCH_ITEM: `${ROUTES.PHARMACY}/inventory/search-item`,
  INVENTORY_ADJUST_STOCK: `${ROUTES.PHARMACY}/inventory/adjust-stock`,
  INVENTORY_EXPIRED_ITEMS: `${ROUTES.PHARMACY}/inventory/expired-items`,
} as const;

  /**
   * Account nested routes 
   */
  export const ACCOUNT_ROUTES = {
    ROOT: ROUTES.ACCOUNT,
    PROFILE: `${ROUTES.ACCOUNT}/profile`,
    SECURITY: `${ROUTES.ACCOUNT}/security`,
    INVITATIONS: `${ROUTES.ACCOUNT}/invitations`,
    MESSAGES: `${ROUTES.ACCOUNT}/messages`,
    APPEARANCE: `${ROUTES.ACCOUNT}/appearance`,

    // Messages nested actions
    MESSAGES_INBOX: `${ROUTES.ACCOUNT}/messages/inbox`,
    MESSAGES_SENT: `${ROUTES.ACCOUNT}/messages/sent`,
    MESSAGES_DRAFT: `${ROUTES.ACCOUNT}/messages/draft`,
    MESSAGES_TRASH: `${ROUTES.ACCOUNT}/messages/trash`,
    MESSAGES_SPAM: `${ROUTES.ACCOUNT}/messages/spam`,
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

  pharmacyOperation: (operation: string) => `${ROUTES.PHARMACY}/${operation}`,
  pharmacyInventoryAction: (action: string) => `${ROUTES.PHARMACY}/inventory/${action}`,
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
