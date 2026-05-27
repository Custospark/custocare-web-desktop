import { ROUTES } from "./shared.paths"; 
export const BILLING_ROUTES = {
  ROOT: ROUTES.BILLING,
  OVERVIEW: `${ROUTES.BILLING}/overview`,
  PATIENTS: `${ROUTES.BILLING}/patients`,
  ACTION_CENTER: `${ROUTES.BILLING}/action-center`,
  REVENUE: `${ROUTES.BILLING}/revenue`,

  // Patient registry nested actions
  PATIENT_QUEUE: `${ROUTES.BILLING}/patients/queue`,
  WALKIN_PATIENT: `${ROUTES.BILLING}/patients/walk-in`,

  // Action center nested actions
  BILLING_SPACE: `${ROUTES.BILLING}/action-center/billing-space`,
  FORWARD_PATIENT: `${ROUTES.BILLING}/action-center/forward-patient`,
  VISIT_STATUS: `${ROUTES.BILLING}/action-center/visit-status`,
  ACTION_CENTER_CLINICAL_REPORTS: `${ROUTES.BILLING}/action-center/clinical-reports`,

  // Revenue nested actions
  RECEIPTS_RECONCILIATION: `${ROUTES.BILLING}/revenue/receipts-reconciliation`,
  INVOICES: `${ROUTES.BILLING}/revenue/invoices`,
  INTELLIGENCE: `${ROUTES.BILLING}/revenue/intelligence`,

  // Legacy aliases kept for compatibility
  PAYMENTS: `${ROUTES.BILLING}/revenue/receipts-reconciliation`,
  CLAIMS: `${ROUTES.BILLING}/revenue/invoices`,
  INVOICES_CREATE: `${ROUTES.BILLING}/revenue/invoices`,
  INVOICES_SEARCH: `${ROUTES.BILLING}/revenue/invoices`,
  INVOICES_DRAFT: `${ROUTES.BILLING}/revenue/invoices`,
  INVOICES_PENDING: `${ROUTES.BILLING}/revenue/invoices`,
  PAYMENTS_RECEIVE: `${ROUTES.BILLING}/action-center/billing-space`,
  PAYMENTS_HISTORY: `${ROUTES.BILLING}/revenue/receipts-reconciliation`,
  PAYMENTS_RECONCILE: `${ROUTES.BILLING}/revenue/receipts-reconciliation`,
  CLAIMS_SUBMIT: `${ROUTES.BILLING}/revenue/invoices`,
  CLAIMS_TRACK: `${ROUTES.BILLING}/revenue/invoices`,
  CLAIMS_APPROVED: `${ROUTES.BILLING}/revenue/invoices`,
  CLAIMS_DENIED: `${ROUTES.BILLING}/revenue/invoices`,
  } as const;