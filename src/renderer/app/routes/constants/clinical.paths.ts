import { ROUTES } from "./shared.paths"; 
export const CLINICAL_ROUTES = {
  ROOT: ROUTES.CLINICAL,
  OVERVIEW: `${ROUTES.CLINICAL}/overview`,
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