import { ROUTES } from "./shared.paths"; 
export const PHARMACY_ROUTES = {
  ROOT: ROUTES.PHARMACY,
  OVERVIEW: `${ROUTES.PHARMACY}/overview`,
  /** Same pattern as medical records: facility queue → action center with visit in slice */
  PATIENTS: `${ROUTES.PHARMACY}/patients`,
  /** Nested under `/patients` — mirror MR patient registry */
  PATIENTS_SEARCH: `${ROUTES.PHARMACY}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.PHARMACY}/patients/register`,
  WALKIN_PATIENT: `${ROUTES.PHARMACY}/patients/walk-in`,
  PATIENT_QUEUE: `${ROUTES.PHARMACY}/patients/queue`,
  /** @deprecated Use ACTION_CENTER_DISPENSING — old URL redirects in routes */
  WORKSTATION: `${ROUTES.PHARMACY}/workstation`,

  /** Visit-scoped workspace (mirrors MR visit-action-center) */
  ACTION_CENTER: `${ROUTES.PHARMACY}/action-center`,
  ACTION_CENTER_FORWARD_PATIENT: `${ROUTES.PHARMACY}/action-center/forward-patient`,
  ACTION_CENTER_DISPENSING: `${ROUTES.PHARMACY}/action-center/dispensing`,
  ACTION_CENTER_PRESCRIPTION_SEARCH: `${ROUTES.PHARMACY}/action-center/prescription-search`,
  /** Visit-scoped Rx needing pharmacist review (from former desk; uses active visit in slice) */
  ACTION_CENTER_PRESCRIPTION_REVIEW: `${ROUTES.PHARMACY}/action-center/prescription-review`,
  /** Edit clinical / pharmacy notes for one Rx (must match active visit + patient + facility in slice) */
  ACTION_CENTER_PRESCRIPTION_NOTES: `${ROUTES.PHARMACY}/action-center/prescription-notes`,
  ACTION_CENTER_CLINICAL_REPORTS: `${ROUTES.PHARMACY}/action-center/clinical-reports`,

  /** @deprecated Facility prescription desk removed — use Queue & intake, then Medication encounter */
  PRESCRIPTIONS: `${ROUTES.PHARMACY}/prescriptions`,
  INVENTORY: `${ROUTES.PHARMACY}/inventory`,
  /** Billing receipts — same UI as Medical Records billing cycle review */
  RECEIPTS: `${ROUTES.PHARMACY}/receipts`,

  // Legacy paths (redirect to patients/queue in router)
  PRESCRIPTIONS_QUEUE: `${ROUTES.PHARMACY}/prescriptions/queue`,
  PRESCRIPTIONS_CREATE: `${ROUTES.PHARMACY}/prescriptions/create`,
  PRESCRIPTIONS_REVIEW: `${ROUTES.PHARMACY}/prescriptions/review`,
  PRESCRIPTIONS_SEARCH: `${ROUTES.PHARMACY}/prescriptions/search`,
  PRESCRIPTIONS_FLAGGED: `${ROUTES.PHARMACY}/prescriptions/flagged`,
  PRESCRIPTIONS_APPROVED: `${ROUTES.PHARMACY}/prescriptions/approved`,

  // Prescriptions Create sub-actions
  PRESCRIPTIONS_CREATE_NEW: `${ROUTES.PHARMACY}/prescriptions/create/new`,
  PRESCRIPTIONS_CREATE_TEMPLATE: `${ROUTES.PHARMACY}/prescriptions/create/template`,
  PRESCRIPTIONS_CREATE_COPY: `${ROUTES.PHARMACY}/prescriptions/create/copy`,
  PRESCRIPTIONS_CREATE_BULK: `${ROUTES.PHARMACY}/prescriptions/create/bulk`,

  // Prescriptions Review sub-actions
  PRESCRIPTIONS_REVIEW_PENDING: `${ROUTES.PHARMACY}/prescriptions/review/pending`,
  PRESCRIPTIONS_REVIEW_APPROVE: `${ROUTES.PHARMACY}/prescriptions/review/approve`,
  PRESCRIPTIONS_REVIEW_REJECT: `${ROUTES.PHARMACY}/prescriptions/review/reject`,
  PRESCRIPTIONS_REVIEW_MODIFY: `${ROUTES.PHARMACY}/prescriptions/review/modify`,

  // Prescriptions Search sub-actions
  PRESCRIPTIONS_SEARCH_BY_PATIENT: `${ROUTES.PHARMACY}/prescriptions/search/patient`,
  PRESCRIPTIONS_SEARCH_BY_DOCTOR: `${ROUTES.PHARMACY}/prescriptions/search/doctor`,
  PRESCRIPTIONS_SEARCH_BY_MEDICATION: `${ROUTES.PHARMACY}/prescriptions/search/medication`,
  PRESCRIPTIONS_SEARCH_BY_STATUS: `${ROUTES.PHARMACY}/prescriptions/search/status`,

  // Prescriptions Queue sub-actions
  PRESCRIPTIONS_QUEUE_PENDING: `${ROUTES.PHARMACY}/prescriptions/queue/pending`,
  PRESCRIPTIONS_QUEUE_PROCESSING: `${ROUTES.PHARMACY}/prescriptions/queue/processing`,
  PRESCRIPTIONS_QUEUE_COMPLETED: `${ROUTES.PHARMACY}/prescriptions/queue/completed`,
  PRESCRIPTIONS_QUEUE_FAILED: `${ROUTES.PHARMACY}/prescriptions/queue/failed`,
} as const;