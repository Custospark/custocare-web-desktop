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
} as const;