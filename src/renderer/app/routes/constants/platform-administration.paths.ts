// Create new PLATFORM_ADMIN_ROUTES object
export const PLATFORM_ADMIN_ROUTES = {
  // Base
  ROOT: '/platform-admin',
  
  // Facilities routes
  FACILITIES: '/platform-admin/facilities',
  FACILITIES_STATS: '/platform-admin/facilities/stats',
  PLATFORM_FACILITY_GOVERNANCE: '/platform-admin/facilities/platform-facility-governance',
  FACILITIES_PLANS: '/platform-admin/facilities/plans',
  FACILITIES_SUBSCRIPTIONS: '/platform-admin/facilities/subscriptions',
  
  // Users routes
  USERS: '/platform-admin/users',
  USERS_PERMISSIONS: '/platform-admin/users/permissions',
  USERS_USER_STATS: '/platform-admin/users/user-stats',

  // Documentation routes
  API_DOCS: '/platform-admin/api-docs',

  /** Platform-managed Custocare Hub learning videos & assets */
  LEARNING_MATERIALS: '/platform-admin/learning-materials',

  /** Custocare Hub user feedback & feature requests */
  HUB_FEEDBACK: '/platform-admin/hub-feedback',

  /** Custocare Hub Support Center FAQs (Q&A for all users) */
  HUB_SUPPORT_FAQS: '/platform-admin/hub-support-faqs',

  /** Custocare Hub Support Center tickets (submitted by users) */
  HUB_SUPPORT_TICKETS: '/platform-admin/hub-support-tickets',

  /** Custocare Hub Community — product updates (read-only in hub; authored here) */
  HUB_PRODUCT_UPDATES: '/platform-admin/hub-product-updates',
} as const;