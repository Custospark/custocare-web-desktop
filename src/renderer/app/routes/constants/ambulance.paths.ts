import { ROUTES } from "./shared.paths";

export const AMBULANCE_ROUTES = {
  ROOT: ROUTES.AMBULANCE,
  OVERVIEW: `${ROUTES.AMBULANCE}/overview`,

  // Dispatch & Trip Center
  DISPATCH: `${ROUTES.AMBULANCE}/dispatch`,
  DISPATCH_ACTIVE_BOARD: `${ROUTES.AMBULANCE}/dispatch/active-board`,
  DISPATCH_NEW_TRIP: `${ROUTES.AMBULANCE}/dispatch/new-trip`,
  DISPATCH_TRIP_HISTORY: `${ROUTES.AMBULANCE}/dispatch/trip-history`,

  // Trip Workspace (separate operation — accessible after Take Action)
  TRIP_WORKSPACE: `${ROUTES.AMBULANCE}/trip-workspace`,
  TRIP_WORKSPACE_TIMELINE: `${ROUTES.AMBULANCE}/trip-workspace/timeline`,
  TRIP_WORKSPACE_LOGS: `${ROUTES.AMBULANCE}/trip-workspace/logs`,

  // Trip detail by UUID (for direct links)
  DISPATCH_TRIP_DETAIL: `${ROUTES.AMBULANCE}/dispatch/:uuid`,

  // Vehicle Fleet Management (legacy — now under /admin)
  VEHICLES: `${ROUTES.AMBULANCE}/admin/vehicles`,
  VEHICLES_ALL: `${ROUTES.AMBULANCE}/admin/vehicles/all`,
  VEHICLES_CREATE: `${ROUTES.AMBULANCE}/admin/vehicles/create`,
  VEHICLES_DETAIL: `${ROUTES.AMBULANCE}/admin/vehicles/:uuid`,
  VEHICLES_EDIT: `${ROUTES.AMBULANCE}/admin/vehicles/:uuid/edit`,
  VEHICLES_SERVICE_SCHEDULE: `${ROUTES.AMBULANCE}/admin/vehicles/service-schedule`,

  // Crew Management (legacy — now under /admin)
  CREW: `${ROUTES.AMBULANCE}/admin/crew`,
  CREW_BY_VEHICLE: `${ROUTES.AMBULANCE}/admin/crew/by-vehicle`,
  CREW_BY_STAFF: `${ROUTES.AMBULANCE}/admin/crew/by-staff`,
  CREW_ASSIGN: `${ROUTES.AMBULANCE}/admin/crew/assign`,

  // Fleet Administration (landing page for /admin operation)
  ADMIN: `${ROUTES.AMBULANCE}/admin`,

  // Fleet Analytics (legacy — now under /admin)
  ANALYTICS: `${ROUTES.AMBULANCE}/admin/analytics`,
} as const;
