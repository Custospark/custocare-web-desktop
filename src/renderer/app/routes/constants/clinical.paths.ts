import { ROUTES } from "./shared.paths"; 
export const CLINICAL_ROUTES = {
  ROOT: ROUTES.CLINICAL,
  OVERVIEW: `${ROUTES.CLINICAL}/overview`,
  PATIENTS: `${ROUTES.CLINICAL}/patients`,
  VISIT_ACTION_CENTER: `${ROUTES.CLINICAL}/visit-action-center`,
  REVENUE_INTEGRITY: `${ROUTES.CLINICAL}/revenue`,

  // Revenue nested actions
  BILLING_CYCLE_REVIEW: `${ROUTES.CLINICAL}/revenue/billing-cycle/review`,
  BILLING_STATS: `${ROUTES.CLINICAL}/revenue/billing-stats`,

  // Patient registry nested actions
  PATIENTS_SEARCH: `${ROUTES.CLINICAL}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.CLINICAL}/patients/register`,
  WALKIN_PATIENT: `${ROUTES.CLINICAL}/patients/walk-in`,
  PATIENT_QUEUE: `${ROUTES.CLINICAL}/patients/queue`,

  // Visit action center nested actions
  FORWARD_PATIENT: `${ROUTES.CLINICAL}/visit-action-center/forward-patient`,
  GET_COMPLAINTS: `${ROUTES.CLINICAL}/visit-action-center/get-complaints`,
  VISIT_STATUS: `${ROUTES.CLINICAL}/visit-action-center/visit-status`,
  PATIENT_HISTORY: `${ROUTES.CLINICAL}/visit-action-center/patient-history`,
  PATIENT_BILLING_SPACE: `${ROUTES.CLINICAL}/visit-action-center/billing-space`,
  CLINICAL_CARE: `${ROUTES.CLINICAL}/visit-action-center/clinical-care`,
  PATIENT_RECORDS: `${ROUTES.CLINICAL}/visit-action-center/patient-records`,

  // Legacy clinical module aliases
  DIAGNOSIS: `${ROUTES.CLINICAL}/diagnosis`,
  APPOINTMENTS: `${ROUTES.CLINICAL}/appointments`,
  VITALS: `${ROUTES.CLINICAL}/vitals`,
  TREATMENTS: `${ROUTES.CLINICAL}/treatments`,

  // Diagnosis nested actions
  DIAGNOSIS_CREATE: `${ROUTES.CLINICAL}/diagnosis/create`,
  DIAGNOSIS_HISTORY: `${ROUTES.CLINICAL}/diagnosis/history`,
  DIAGNOSIS_PENDING: `${ROUTES.CLINICAL}/diagnosis/pending`,
  DIAGNOSIS_REVIEW: `${ROUTES.CLINICAL}/diagnosis/review`,

  // Appointments nested actions
  APPOINTMENTS_SCHEDULE: `${ROUTES.CLINICAL}/appointments/schedule`,
  APPOINTMENTS_TODAY: `${ROUTES.CLINICAL}/appointments/today`,
  APPOINTMENTS_UPCOMING: `${ROUTES.CLINICAL}/appointments/upcoming`,
  APPOINTMENTS_PAST: `${ROUTES.CLINICAL}/appointments/past`,
  APPOINTMENTS_CALENDAR: `${ROUTES.CLINICAL}/appointments/calendar`,

  // Vitals nested actions
  VITALS_RECORD: `${ROUTES.CLINICAL}/vitals/record`,
  VITALS_HISTORY: `${ROUTES.CLINICAL}/vitals/history`,
  VITALS_TRENDS: `${ROUTES.CLINICAL}/vitals/trends`,

  // Treatments nested actions
  TREATMENTS_PRESCRIBE: `${ROUTES.CLINICAL}/treatments/prescribe`,
  TREATMENTS_HISTORY: `${ROUTES.CLINICAL}/treatments/history`,
  TREATMENTS_PENDING: `${ROUTES.CLINICAL}/treatments/pending`,
} as const;