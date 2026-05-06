import { ROUTES } from "./shared.paths"; 
export const NURSING_ROUTES = {
  ROOT: ROUTES.NURSING,
  NURSING_INTELLIGENCE: `${ROUTES.NURSING}/nursing-intelligence`,
  WARDS_PATIENTS: `${ROUTES.NURSING}/wards-patients`,
  NURSING_ENCOUNTER: `${ROUTES.NURSING}/nursing-encounter`,
  MEDICATION_TREATMENT: `${ROUTES.NURSING}/medication-treatment`,
  TASKS_SHIFTS: `${ROUTES.NURSING}/tasks-shifts`,

  // Backward-compatible aliases for existing nursing sub-routes.
  WARDS: `${ROUTES.NURSING}/wards-patients`,
  PATIENTS: `${ROUTES.NURSING}/wards-patients/patients`,
  VITALS: `${ROUTES.NURSING}/nursing-encounter/vitals`,
  MEDICATION: `${ROUTES.NURSING}/medication-treatment`,
  ALERTS: `${ROUTES.NURSING}/tasks-shifts/alerts`,

  // Wards nested actions
  WARDS_OVERVIEW: `${ROUTES.NURSING}/wards-patients/overview`,
  WARDS_ASSIGN: `${ROUTES.NURSING}/wards-patients/assign`,
  WARDS_TRANSFER: `${ROUTES.NURSING}/wards-patients/transfer`,
  WARDS_CAPACITY: `${ROUTES.NURSING}/wards-patients/capacity`,

  // Patients nested actions
  PATIENTS_ASSIGNED: `${ROUTES.NURSING}/wards-patients/patients/assigned`,
  PATIENTS_ADMIT: `${ROUTES.NURSING}/wards-patients/patients/admit`,
  PATIENTS_DISCHARGE: `${ROUTES.NURSING}/wards-patients/patients/discharge`,
  PATIENTS_ROSTER: `${ROUTES.NURSING}/wards-patients/patients/roster`,

  // Vitals nested actions
  VITALS_RECORD: `${ROUTES.NURSING}/nursing-encounter/vitals/record`,
  VITALS_HISTORY: `${ROUTES.NURSING}/nursing-encounter/vitals/history`,
  VITALS_TRENDS: `${ROUTES.NURSING}/nursing-encounter/vitals/trends`,
  VITALS_ALERTS: `${ROUTES.NURSING}/nursing-encounter/vitals/alerts`,

  // Medication nested actions
  MEDICATION_ADMINISTER: `${ROUTES.NURSING}/medication-treatment/administer`,
  MEDICATION_SCHEDULE: `${ROUTES.NURSING}/medication-treatment/schedule`,
  MEDICATION_CHART: `${ROUTES.NURSING}/medication-treatment/chart`,
  MEDICATION_INVENTORY: `${ROUTES.NURSING}/medication-treatment/inventory`,

  // Alerts nested actions
  ALERTS_ACTIVE: `${ROUTES.NURSING}/tasks-shifts/alerts/active`,
  ALERTS_PENDING: `${ROUTES.NURSING}/tasks-shifts/alerts/pending`,
  ALERTS_RESOLVED: `${ROUTES.NURSING}/tasks-shifts/alerts/resolved`,
  ALERTS_SETTINGS: `${ROUTES.NURSING}/tasks-shifts/alerts/settings`,
} as const;