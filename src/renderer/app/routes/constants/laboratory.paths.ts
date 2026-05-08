import { ROUTES } from "./shared.paths"; 
export const LABORATORY_ROUTES = {
  ROOT: ROUTES.LABORATORY,
  OVERVIEW: `${ROUTES.LABORATORY}/overview`,
  PATIENTS: `${ROUTES.LABORATORY}/patients`,
  PATIENTS_SEARCH: `${ROUTES.LABORATORY}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.LABORATORY}/patients/register`,
  PATIENT_QUEUE: `${ROUTES.LABORATORY}/patients/queue`,
  WALKIN_PATIENT: `${ROUTES.LABORATORY}/patients/walk-in`,

  ACTION_CENTER: `${ROUTES.LABORATORY}/action-center`,
  ACTION_CENTER_REQUEST: `${ROUTES.LABORATORY}/action-center/lab-request`,
  ACTION_CENTER_RESULTS: `${ROUTES.LABORATORY}/action-center/lab-results`,
  ACTION_CENTER_REQUEST_FOCUS: `${ROUTES.LABORATORY}/action-center/lab-request/focus`,
  ACTION_CENTER_RESULTS_FOCUS: `${ROUTES.LABORATORY}/action-center/lab-results/focus`,
  ACTION_CENTER_BILLING: `${ROUTES.LABORATORY}/action-center/billing-space`,

  CATALOG: `${ROUTES.LABORATORY}/catalog`,
  CATALOG_SERVICES: `${ROUTES.LABORATORY}/catalog/services`,
  CATALOG_INVENTORY: `${ROUTES.LABORATORY}/catalog/inventory`,

  RECEIPTS: `${ROUTES.LABORATORY}/receipts`,
} as const;