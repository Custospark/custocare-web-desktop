import { ROUTES } from "./shared.paths"; 
export const NURSING_ROUTES = {
  ROOT: ROUTES.NURSING,
  /** Nursing intelligence dashboard — same URL shape as Pharmacy `/pharmacy/overview` */
  OVERVIEW: `${ROUTES.NURSING}/overview`,
  /** @deprecated Use OVERVIEW */
  NURSING_INTELLIGENCE: `${ROUTES.NURSING}/overview`,
  WARDS_PATIENTS: `${ROUTES.NURSING}/wards-patients`,
  NURSING_ENCOUNTER: `${ROUTES.NURSING}/nursing-encounter`,
  MEDICATION_TREATMENT: `${ROUTES.NURSING}/medication-treatment`,
  TASKS_SHIFTS: `${ROUTES.NURSING}/tasks-shifts`,

  // Wards & Patients sub actions
  WARDS_PATIENTS_SEARCH_PATIENT: `${ROUTES.NURSING}/wards-patients/search-patient`,
  WARDS_PATIENTS_MY_WARD_PATIENTS: `${ROUTES.NURSING}/wards-patients/my-ward-patients`,
  WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED: `${ROUTES.NURSING}/wards-patients/new-patients-unassigned`,

  // Nursing Encounter sub actions
  NURSING_ENCOUNTER_FORWARD_PATIENT: `${ROUTES.NURSING}/nursing-encounter/forward-patient`,
  NURSING_ENCOUNTER_PATIENT_INFO: `${ROUTES.NURSING}/nursing-encounter/patient-info`,
  NURSING_ENCOUNTER_WARD_BED: `${ROUTES.NURSING}/nursing-encounter/ward-bed`,
  NURSING_ENCOUNTER_TASKS: `${ROUTES.NURSING}/nursing-encounter/tasks`,
  NURSING_ENCOUNTER_MEDS: `${ROUTES.NURSING}/nursing-encounter/meds`,
  NURSING_ENCOUNTER_NOTES: `${ROUTES.NURSING}/nursing-encounter/notes`,

  // Medication & Treatment sub actions
  MEDICATION_TREATMENT_MEDICATION_SCHEDULE: `${ROUTES.NURSING}/medication-treatment/medication-schedule`,
  MEDICATION_TREATMENT_ADMINISTER_MEDICATION: `${ROUTES.NURSING}/medication-treatment/administer-medication`,
  MEDICATION_TREATMENT_MISSED_MEDICATIONS: `${ROUTES.NURSING}/medication-treatment/missed-medications`,
  MEDICATION_TREATMENT_TREATMENT_LOG: `${ROUTES.NURSING}/medication-treatment/treatment-log`,

  // Tasks & Shifts sub actions
  TASKS_SHIFTS_MY_TASKS: `${ROUTES.NURSING}/tasks-shifts/my-tasks`,
  TASKS_SHIFTS_ASSIGN_TASK: `${ROUTES.NURSING}/tasks-shifts/assign-task`,
  TASKS_SHIFTS_SHIFT_HANDOVER: `${ROUTES.NURSING}/tasks-shifts/shift-handover`,
  TASKS_SHIFTS_TASK_HISTORY: `${ROUTES.NURSING}/tasks-shifts/task-history`,

  // Backward-compatible aliases for existing nursing keys.
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