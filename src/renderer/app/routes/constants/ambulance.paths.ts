import { ROUTES } from './shared.paths';

const A = ROUTES.AMBULANCE;

export const AMBULANCE_ROUTES = {
  ROOT: A,
  OVERVIEW: `${A}/overview`,

  // Patient intake (mirrors laboratory / pharmacy)
  PATIENTS: `${A}/patients`,
  PATIENTS_SEARCH: `${A}/patients/search`,
  PATIENTS_REGISTER: `${A}/patients/register`,
  PATIENT_QUEUE: `${A}/patients/queue`,
  WALKIN_PATIENT: `${A}/patients/walk-in`,

  // Transport encounter center (visit-scoped only)
  ACTION_CENTER: `${A}/action-center`,
  ACTION_CENTER_FORWARD_PATIENT: `${A}/action-center/forward-patient`,
  ACTION_CENTER_TRANSPORT: `${A}/action-center/transport`,
  ACTION_CENTER_TRANSPORT_REQUEST: `${A}/action-center/transport-request`,
  ACTION_CENTER_PATIENT_INFO: `${A}/action-center/patient-info`,
  ACTION_CENTER_TRANSPORT_TIMELINE: `${A}/action-center/transport/timeline`,
  ACTION_CENTER_TRANSPORT_LOGS: `${A}/action-center/transport/logs`,
  ACTION_CENTER_CLINICAL_REPORTS: `${A}/action-center/clinical-reports`,

  // Fleet (facility-wide — not tied to a loaded visit)
  FLEET: `${A}/fleet`,
  FLEET_OVERVIEW: `${A}/fleet/overview`,
  FLEET_DISPATCH: `${A}/fleet/dispatch`,
  FLEET_ASSETS: `${A}/fleet/assets`,
  FLEET_ACTIVE_BOARD: `${A}/fleet/dispatch/active-board`,
  FLEET_TRIP_HISTORY: `${A}/fleet/dispatch/trip-history`,
  FLEET_NEW_TRIP: `${A}/fleet/dispatch/new-trip`,
  FLEET_VEHICLES: `${A}/fleet/vehicles`,
  FLEET_VEHICLES_ALL: `${A}/fleet/vehicles/all`,
  FLEET_VEHICLES_CREATE: `${A}/fleet/vehicles/create`,
  FLEET_VEHICLES_DETAIL: `${A}/fleet/vehicles/:uuid`,
  FLEET_VEHICLES_EDIT: `${A}/fleet/vehicles/:uuid/edit`,
  FLEET_VEHICLES_SERVICE_SCHEDULE: `${A}/fleet/vehicles/service-schedule`,
  FLEET_CREW: `${A}/fleet/crew`,
  FLEET_CREW_BY_VEHICLE: `${A}/fleet/crew/by-vehicle`,
  FLEET_CREW_BY_STAFF: `${A}/fleet/crew/by-staff`,
  FLEET_CREW_ASSIGN: `${A}/fleet/crew/assign`,
  FLEET_ANALYTICS: `${A}/fleet/analytics`,

  RECEIPTS: `${A}/receipts`,

  /** @deprecated Use ACTION_CENTER_TRANSPORT */
  ACTION_CENTER_ACTIVE_BOARD: `${A}/action-center/active-board`,
  /** @deprecated Use FLEET_TRIP_HISTORY */
  ACTION_CENTER_TRIP_HISTORY: `${A}/action-center/trip-history`,
  /** @deprecated Use ACTION_CENTER_TRANSPORT_REQUEST */
  ACTION_CENTER_NEW_TRIP: `${A}/action-center/new-trip`,
  /** @deprecated Use ACTION_CENTER_TRANSPORT */
  ACTION_CENTER_TRIP_WORKSPACE: `${A}/action-center/trip-workspace`,
  /** @deprecated Use ACTION_CENTER_TRANSPORT_TIMELINE */
  ACTION_CENTER_TRIP_TIMELINE: `${A}/action-center/trip-workspace/timeline`,
  /** @deprecated Use ACTION_CENTER_TRANSPORT_LOGS */
  ACTION_CENTER_TRIP_LOGS: `${A}/action-center/trip-workspace/logs`,
} as const;
