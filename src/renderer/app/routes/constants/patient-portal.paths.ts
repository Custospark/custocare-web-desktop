import { ROUTES } from "./shared.paths";

/** Base path for the patient portal (`/dashboard/patient`). */
const PP = ROUTES.PATIENT_DASHBOARD;

/**
 * Patient Portal routes. Top-level segments match `PATIENT_PORTAL_MODULE_OPERATIONS` ids
 * so URLs stay in sync with {@link BaseModuleWorkspace} (`${basePath}/${operationId}`).
 */
export const PATIENT_PORTAL_ROUTES = {
  ROOT: PP,

  /** Landing — same URL as {@link PATIENT_PORTAL_ROUTES.DASHBOARD} */
  OVERVIEW: `${PP}/dashboard`,
  DASHBOARD: `${PP}/dashboard`,

  MEDICAL_HISTORY: `${PP}/medical-history`,
  /** Default landing for Medical history operation (redirects to latest visit). */
  MEDICAL_HISTORY_INDEX: `${PP}/medical-history`,
  MEDICAL_HISTORY_LATEST_VISIT: `${PP}/medical-history/latest-visit`,
  MEDICAL_HISTORY_FULL: `${PP}/medical-history/full`,

  MEDICATIONS: `${PP}/medications`,
  LABORATORY_RESULTS: `${PP}/laboratory-results`,
  BILLING: `${PP}/billing-payments`,
  APPOINTMENTS: `${PP}/appointments`,
  NOTIFICATIONS: `${PP}/notifications`,
  /** Message Center (same shell as Account → Messages) */
  NOTIFICATIONS_INBOX: `${PP}/notifications/inbox`,
  NOTIFICATIONS_SENT: `${PP}/notifications/sent`,
  NOTIFICATIONS_DRAFT: `${PP}/notifications/draft`,
  NOTIFICATIONS_TRASH: `${PP}/notifications/trash`,
  NOTIFICATIONS_COMPOSE: `${PP}/notifications/compose`,
  NOTIFICATIONS_CONTACTS: `${PP}/notifications/contacts`,

  DOWNLOADS: `${PP}/downloads-reports`,

  // ─── Legacy / alternate names (same URLs where applicable) ───────────────
  HEALTH: `${PP}/medical-history`,
  RECORDS: `${PP}/records`,
  TEST_RESULTS: `${PP}/laboratory-results`,

  // ─── Records ─────────────────────────────────────────────────────────────
  RECORDS_VIEW: `${PP}/records/view`,
  RECORDS_DOWNLOAD: `${PP}/records/download`,
  RECORDS_SHARE: `${PP}/records/share`,
  RECORDS_REQUEST: `${PP}/records/request`,

  // ─── Laboratory / test results ───────────────────────────────────────────
  TEST_RESULTS_VIEW: `${PP}/laboratory-results/view`,
  TEST_RESULTS_HISTORY: `${PP}/laboratory-results/history`,
  TEST_RESULTS_COMPARE: `${PP}/laboratory-results/compare`,
  TEST_RESULTS_EXPLAIN: `${PP}/laboratory-results/explain`,

  // ─── Appointments ────────────────────────────────────────────────────────
  APPOINTMENTS_UPCOMING: `${PP}/appointments/upcoming`,
  APPOINTMENTS_PAST: `${PP}/appointments/past`,
  APPOINTMENTS_SCHEDULE: `${PP}/appointments/schedule`,
  APPOINTMENTS_CANCEL: `${PP}/appointments/cancel`,

  // ─── Medications ───────────────────────────────────────────────────────────
  MEDICATIONS_CURRENT: `${PP}/medications/current`,
  MEDICATIONS_HISTORY: `${PP}/medications/history`,
  MEDICATIONS_REFILL: `${PP}/medications/refill`,
  MEDICATIONS_INTERACTIONS: `${PP}/medications/interactions`,

  // ─── Billing ─────────────────────────────────────────────────────────────
  BILLING_OVERVIEW: `${PP}/billing-payments/overview`,
  BILLING_PAYMENTS: `${PP}/billing-payments/payments`,
  BILLING_HISTORY: `${PP}/billing-payments/history`,
  BILLING_INVOICES: `${PP}/billing-payments/invoices`,

  // ─── Notifications / Message Center ───────────────────────────────────────
  NOTIFICATIONS_ALL: `${PP}/notifications/all`,
  NOTIFICATIONS_UNREAD: `${PP}/notifications/unread`,
  NOTIFICATIONS_SETTINGS: `${PP}/notifications/settings`,

  // ─── Downloads ─────────────────────────────────────────────────────────────
  DOWNLOADS_ALL: `${PP}/downloads-reports/all`,
  DOWNLOADS_MEDICAL: `${PP}/downloads-reports/medical`,
  DOWNLOADS_LABORATORY: `${PP}/downloads-reports/laboratory`,
  DOWNLOADS_BILLING: `${PP}/downloads-reports/billing`,
} as const;
