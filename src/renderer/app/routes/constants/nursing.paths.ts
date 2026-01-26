import { ROUTES } from "./shared.paths"; 
export const NURSING_ROUTES = {
  ROOT: ROUTES.NURSING,
  OVERVIEW: `${ROUTES.NURSING}/overview`,
  WARDS: `${ROUTES.NURSING}/wards`,
  PATIENTS: `${ROUTES.NURSING}/patients`,
  VITALS: `${ROUTES.NURSING}/vitals`,
  MEDICATION: `${ROUTES.NURSING}/medication`,
  ALERTS: `${ROUTES.NURSING}/alerts`,

  // Wards nested actions
  WARDS_OVERVIEW: `${ROUTES.NURSING}/wards/overview`,
  WARDS_ASSIGN: `${ROUTES.NURSING}/wards/assign`,
  WARDS_TRANSFER: `${ROUTES.NURSING}/wards/transfer`,
  WARDS_CAPACITY: `${ROUTES.NURSING}/wards/capacity`,

  // Patients nested actions
  PATIENTS_ASSIGNED: `${ROUTES.NURSING}/patients/assigned`,
  PATIENTS_ADMIT: `${ROUTES.NURSING}/patients/admit`,
  PATIENTS_DISCHARGE: `${ROUTES.NURSING}/patients/discharge`,
  PATIENTS_ROSTER: `${ROUTES.NURSING}/patients/roster`,

  // Vitals nested actions
  VITALS_RECORD: `${ROUTES.NURSING}/vitals/record`,
  VITALS_HISTORY: `${ROUTES.NURSING}/vitals/history`,
  VITALS_TRENDS: `${ROUTES.NURSING}/vitals/trends`,
  VITALS_ALERTS: `${ROUTES.NURSING}/vitals/alerts`,

  // Medication nested actions
  MEDICATION_ADMINISTER: `${ROUTES.NURSING}/medication/administer`,
  MEDICATION_SCHEDULE: `${ROUTES.NURSING}/medication/schedule`,
  MEDICATION_CHART: `${ROUTES.NURSING}/medication/chart`,
  MEDICATION_INVENTORY: `${ROUTES.NURSING}/medication/inventory`,

  // Alerts nested actions
  ALERTS_ACTIVE: `${ROUTES.NURSING}/alerts/active`,
  ALERTS_PENDING: `${ROUTES.NURSING}/alerts/pending`,
  ALERTS_RESOLVED: `${ROUTES.NURSING}/alerts/resolved`,
  ALERTS_SETTINGS: `${ROUTES.NURSING}/alerts/settings`,
} as const;