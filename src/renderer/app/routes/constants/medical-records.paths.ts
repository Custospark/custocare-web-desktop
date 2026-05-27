import { ROUTES } from "./shared.paths"; 

export const MEDICAL_RECORDS_ROUTES = {
  ROOT: ROUTES.MEDICAL_RECORDS,
  OVERVIEW: `${ROUTES.MEDICAL_RECORDS}/overview`,
  PATIENTS: `${ROUTES.MEDICAL_RECORDS}/patients`,
  VISIT_ACTION_CENTER: `${ROUTES.MEDICAL_RECORDS}/visit-action-center`,
  
  // Revenue Integrity Review parent route
  REVENUE_INTEGRITY: `${ROUTES.MEDICAL_RECORDS}/revenue`,
  
  // Nested under revenue-integrity-review
  BILLING_CYCLE_REVIEW: `${ROUTES.MEDICAL_RECORDS}/revenue/billing-cycle/review`,
  BILLING_STATS: `${ROUTES.MEDICAL_RECORDS}/revenue/billing-stats`,

  // Patients nested actions
  PATIENTS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.MEDICAL_RECORDS}/patients/register`,
  WALKIN_PATIENT: `${ROUTES.MEDICAL_RECORDS}/patients/walk-in`,
  PATIENT_QUEUE: `${ROUTES.MEDICAL_RECORDS}/patients/queue`,
  PATIENT_STATS: `${ROUTES.MEDICAL_RECORDS}/patients/statistics`,
  
  // Visit Action Center nested routes
  FORWARD_PATIENT: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/forward-patient`,
  GET_COMPLAINTS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/get-complaints`,
  VISIT_STATUS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/visit-status`,
  PATIENT_HISTORY: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/patient-history`,
  PATIENT_BILLING_SPACE: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/billing-space`,
  CLINICAL_CARE: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/clinical-care`,
  CLINICAL_REPORTS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/clinical-reports`,
  PATIENT_RECORDS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/patient-records`,
} as const;

