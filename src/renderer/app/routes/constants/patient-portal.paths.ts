import { ROUTES } from "./shared.paths"; 
export const PATIENT_PORTAL_ROUTES = {
  ROOT: ROUTES.PATIENT_DASHBOARD,
  OVERVIEW: `${ROUTES.PATIENT_DASHBOARD}/overview`,
  HEALTH: `${ROUTES.PATIENT_DASHBOARD}/health`,
  RECORDS: `${ROUTES.PATIENT_DASHBOARD}/records`,
  TEST_RESULTS: `${ROUTES.PATIENT_DASHBOARD}/test-results`,
  APPOINTMENTS: `${ROUTES.PATIENT_DASHBOARD}/appointments`,
  MEDICATIONS: `${ROUTES.PATIENT_DASHBOARD}/medications`,

  // Health nested actions
  HEALTH_SUMMARY: `${ROUTES.PATIENT_DASHBOARD}/health/summary`,
  HEALTH_VITALS: `${ROUTES.PATIENT_DASHBOARD}/health/vitals`,
  HEALTH_CONDITIONS: `${ROUTES.PATIENT_DASHBOARD}/health/conditions`,
  HEALTH_ALLERGIES: `${ROUTES.PATIENT_DASHBOARD}/health/allergies`,

  // Records nested actions
  RECORDS_VIEW: `${ROUTES.PATIENT_DASHBOARD}/records/view`,
  RECORDS_DOWNLOAD: `${ROUTES.PATIENT_DASHBOARD}/records/download`,
  RECORDS_SHARE: `${ROUTES.PATIENT_DASHBOARD}/records/share`,
  RECORDS_REQUEST: `${ROUTES.PATIENT_DASHBOARD}/records/request`,

  // Test Results nested actions
  TEST_RESULTS_VIEW: `${ROUTES.PATIENT_DASHBOARD}/test-results/view`,
  TEST_RESULTS_HISTORY: `${ROUTES.PATIENT_DASHBOARD}/test-results/history`,
  TEST_RESULTS_COMPARE: `${ROUTES.PATIENT_DASHBOARD}/test-results/compare`,
  TEST_RESULTS_EXPLAIN: `${ROUTES.PATIENT_DASHBOARD}/test-results/explain`,

  // Appointments nested actions
  APPOINTMENTS_UPCOMING: `${ROUTES.PATIENT_DASHBOARD}/appointments/upcoming`,
  APPOINTMENTS_PAST: `${ROUTES.PATIENT_DASHBOARD}/appointments/past`,
  APPOINTMENTS_SCHEDULE: `${ROUTES.PATIENT_DASHBOARD}/appointments/schedule`,
  APPOINTMENTS_CANCEL: `${ROUTES.PATIENT_DASHBOARD}/appointments/cancel`,

  // Medications nested actions
  MEDICATIONS_CURRENT: `${ROUTES.PATIENT_DASHBOARD}/medications/current`,
  MEDICATIONS_HISTORY: `${ROUTES.PATIENT_DASHBOARD}/medications/history`,
  MEDICATIONS_REFILL: `${ROUTES.PATIENT_DASHBOARD}/medications/refill`,
  MEDICATIONS_INTERACTIONS: `${ROUTES.PATIENT_DASHBOARD}/medications/interactions`,
} as const;