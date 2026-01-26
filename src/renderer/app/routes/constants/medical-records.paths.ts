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

  // Documents nested actions
  DOCUMENTS_UPLOAD: `${ROUTES.MEDICAL_RECORDS}/documents/upload`,
  DOCUMENTS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/documents/search`,
  DOCUMENTS_CATEGORIZE: `${ROUTES.MEDICAL_RECORDS}/documents/categorize`,
  DOCUMENTS_ARCHIVE: `${ROUTES.MEDICAL_RECORDS}/documents/archive`,

  // Records nested actions
  RECORDS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/records/search`,
  RECORDS_SUMMARY: `${ROUTES.MEDICAL_RECORDS}/records/summary`,
  RECORDS_HISTORY: `${ROUTES.MEDICAL_RECORDS}/records/history`,
  RECORDS_EXPORT: `${ROUTES.MEDICAL_RECORDS}/records/export`,

  // Patient detail view (dynamic route)
  PATIENT_DETAIL_BASE: `${ROUTES.MEDICAL_RECORDS}/patients/detail`,
} as const;