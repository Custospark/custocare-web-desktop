import { ROUTES } from "./shared.paths"; 

export const MEDICAL_RECORDS_ROUTES = {
  ROOT: ROUTES.MEDICAL_RECORDS,
  OVERVIEW: `${ROUTES.MEDICAL_RECORDS}/overview`,
  PATIENTS: `${ROUTES.MEDICAL_RECORDS}/patients`,
  VISIT_ACTION_CENTER: `${ROUTES.MEDICAL_RECORDS}/visit-action-center`,
  APPOINTMENTS: `${ROUTES.MEDICAL_RECORDS}/appointments`,
  DOCUMENTS: `${ROUTES.MEDICAL_RECORDS}/documents`,
  RECORDS: `${ROUTES.MEDICAL_RECORDS}/records`,

  // Patients nested actions
  PATIENTS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.MEDICAL_RECORDS}/patients/register`,
  WALKIN_PATIENT: `${ROUTES.MEDICAL_RECORDS}/patients/walk-in`,
  PATIENT_QUEUE: `${ROUTES.MEDICAL_RECORDS}/patients/queue`,

  // Appointments nested actions
  APPOINTMENTS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/appointments/search`,
  APPOINTMENTS_SCHEDULE: `${ROUTES.MEDICAL_RECORDS}/appointments/schedule`,
  APPOINTMENTS_CALENDAR: `${ROUTES.MEDICAL_RECORDS}/appointments/calendar`,
  APPOINTMENTS_HISTORY: `${ROUTES.MEDICAL_RECORDS}/appointments/history`,

  // Visit Action Center nested routes
  FORWARD_PATIENT: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/forward-patient`,
  GET_COMPLAINTS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/get-complaints`,
  VISIT_STATUS: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/visit-status`,
  PATIENT_HISTORY: `${ROUTES.MEDICAL_RECORDS}/visit-action-center/patient-history`,
} as const;