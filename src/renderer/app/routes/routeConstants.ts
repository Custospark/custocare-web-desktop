// routeConstants.ts

/**
 * Application Route Constants
 *
 * Centralized route management for maintainability
 * All routes use HashRouter format (prefixed with # in browser)
 */

export const ROUTES = {
  // Home & Dashboard
  HOME: '/',
  LANDING: '/landing',
  DASHBOARD: '/dashboard',

  // Authentication Routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  TWO_FACTOR_AUTH: '/verify-2fa',

  // Facility Management
  FACILITIES: '/facilities',
  FACILITY_ONBOARDING: '/facilities/onboarding',
  STAFF_DASHBOARD: '/staff/dashboard',

  // Patient Management
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',

  // Clinical Modules
  ENCOUNTERS: '/encounters',

  // Analytics & Reporting
  REPORTS: '/reports',
  ANALYTICS: '/analytics',

  // System & Administration
  SYSTEM: '/system',
  SETTINGS: '/settings',
  SECURITY: '/security',

  // Support & Help
  HELP: '/help',

  // Dashboards
  PATIENT_DASHBOARD: '/dahboard/patient',

  // Role-Based Clinical Modules
  MEDICAL_RECORDS: '/medical-records',
  NURSING: '/nursing',
  CLINICAL: '/clinical',
  LABORATORY: '/laboratory',

  // Top-level Modules
  PHARMACY: '/pharmacy',
  BILLING: '/billing',
  ADMINISTRATION: '/administration',
  ACCOUNT: '/acount',
} as const;

/**
 * Pharmacy nested routes (best practice: explicit, centralized)
 */
export const PHARMACY_ROUTES = {
  ROOT: ROUTES.PHARMACY,
  OVERVIEW: `${ROUTES.PHARMACY}/overview`,
  PRESCRIPTIONS: `${ROUTES.PHARMACY}/prescriptions`,
  INVENTORY: `${ROUTES.PHARMACY}/inventory`,
  DISPENSING: `${ROUTES.PHARMACY}/dispensing`,
  BILLING: `${ROUTES.PHARMACY}/billing`,

  // Inventory nested actions
  INVENTORY_OVERVIEW: `${ROUTES.PHARMACY}/inventory/overview`,
  INVENTORY_ADD_STOCK: `${ROUTES.PHARMACY}/inventory/add-stock`,
  INVENTORY_SEARCH_ITEM: `${ROUTES.PHARMACY}/inventory/search-item`,
  INVENTORY_ADJUST_STOCK: `${ROUTES.PHARMACY}/inventory/adjust-stock`,
  INVENTORY_EXPIRED_ITEMS: `${ROUTES.PHARMACY}/inventory/expired-items`,

  // Dispensing nested actions.
  DISPENSING_DISPENSE_MEDICATION: `${ROUTES.PHARMACY}/dispensing/dispense-medication`,
  DISPENSING_VALIDATE_PRESCRIPTION: `${ROUTES.PHARMACY}/dispensing/validate-prescription`,
  DISPENSING_SEARCH_PRESCRIPTION: `${ROUTES.PHARMACY}/dispensing/search-prescription`,
  DISPENSING_HISTORY: `${ROUTES.PHARMACY}/dispensing/history`,
  DISPENSING_ISSUES_QUEUE: `${ROUTES.PHARMACY}/dispensing/issues-queue`,

  DISPENSING_WALK_IN: `${ROUTES.PHARMACY}/dispensing/dispense-medication/walk-in`,
  DISPENSING_PATIENT_SEARCH: `${ROUTES.PHARMACY}/dispensing/dispense-medication/patient-search`,
  DISPENSING_QUICK_CREATE: `${ROUTES.PHARMACY}/dispensing/dispense-medication/quick-create`,
  DISPENSING_QUEUE: `${ROUTES.PHARMACY}/dispensing/dispense-medication/queue`,

  //Prescriptions.
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

  /**
   * Account nested routes 
   */
  export const ACCOUNT_ROUTES = {
    ROOT: ROUTES.ACCOUNT,
    PROFILE: `${ROUTES.ACCOUNT}/profile`,
    SECURITY: `${ROUTES.ACCOUNT}/security`,
    INVITATIONS: `${ROUTES.ACCOUNT}/invitations`,
    MESSAGES: `${ROUTES.ACCOUNT}/messages`,
    APPEARANCE: `${ROUTES.ACCOUNT}/appearance`,

    // Messages nested actions
    MESSAGES_INBOX: `${ROUTES.ACCOUNT}/messages/inbox`,
    MESSAGES_SENT: `${ROUTES.ACCOUNT}/messages/sent`,
    MESSAGES_DRAFT: `${ROUTES.ACCOUNT}/messages/draft`,
    MESSAGES_TRASH: `${ROUTES.ACCOUNT}/messages/trash`,
    MESSAGES_SPAM: `${ROUTES.ACCOUNT}/messages/spam`,
  } as const;

  /**
   * Billing route constants.
   */
  /**
 * Billing nested routes
 */
  export const BILLING_ROUTES = {
    ROOT: ROUTES.BILLING,
    OVERVIEW: `${ROUTES.BILLING}/overview`,
    INVOICES: `${ROUTES.BILLING}/invoices`,
    PAYMENTS: `${ROUTES.BILLING}/payments`,
    CLAIMS: `${ROUTES.BILLING}/claims`,

    // Invoices nested actions
    INVOICES_CREATE: `${ROUTES.BILLING}/invoices/create`,
    INVOICES_SEARCH: `${ROUTES.BILLING}/invoices/search`,
    INVOICES_DRAFT: `${ROUTES.BILLING}/invoices/draft`,
    INVOICES_PENDING: `${ROUTES.BILLING}/invoices/pending`,
    
    // Payments nested actions
    PAYMENTS_RECEIVE: `${ROUTES.BILLING}/payments/receive`,
    PAYMENTS_HISTORY: `${ROUTES.BILLING}/payments/history`,
    PAYMENTS_RECONCILE: `${ROUTES.BILLING}/payments/reconcile`,
    
    // Claims nested actions
    CLAIMS_SUBMIT: `${ROUTES.BILLING}/claims/submit`,
    CLAIMS_TRACK: `${ROUTES.BILLING}/claims/track`,
    CLAIMS_APPROVED: `${ROUTES.BILLING}/claims/approved`,
    CLAIMS_DENIED: `${ROUTES.BILLING}/claims/denied`,
  } as const;

  /**
 * Clinical nested routes
 */
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

/**
 * Medical Records nested routes
 */
export const MEDICAL_RECORDS_ROUTES = {
  ROOT: ROUTES.MEDICAL_RECORDS,
  OVERVIEW: `${ROUTES.MEDICAL_RECORDS}/overview`,
  PATIENTS: `${ROUTES.MEDICAL_RECORDS}/patients`,
  APPOINTMENTS: `${ROUTES.MEDICAL_RECORDS}/appointments`,
  DOCUMENTS: `${ROUTES.MEDICAL_RECORDS}/documents`,
  RECORDS: `${ROUTES.MEDICAL_RECORDS}/records`,

  // Patients nested actions
  PATIENTS_SEARCH: `${ROUTES.MEDICAL_RECORDS}/patients/search`,
  PATIENTS_REGISTER: `${ROUTES.MEDICAL_RECORDS}/patients/register`,
  PATIENTS_PROFILES: `${ROUTES.MEDICAL_RECORDS}/patients/profiles`,
  PATIENTS_DETAIL: `${ROUTES.MEDICAL_RECORDS}/patients/detail`,

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

/**
 * Laboratory nested routes
 */
export const LABORATORY_ROUTES = {
  ROOT: ROUTES.LABORATORY,
  OVERVIEW: `${ROUTES.LABORATORY}/overview`,
  TESTS: `${ROUTES.LABORATORY}/tests`,
  SAMPLES: `${ROUTES.LABORATORY}/samples`,
  EQUIPMENT: `${ROUTES.LABORATORY}/equipment`,
  REPORTS: `${ROUTES.LABORATORY}/reports`,

  // Tests nested actions
  TESTS_ORDER: `${ROUTES.LABORATORY}/tests/order`,
  TESTS_RECORD: `${ROUTES.LABORATORY}/tests/record`,
  TESTS_PENDING: `${ROUTES.LABORATORY}/tests/pending`,
  TESTS_SEARCH: `${ROUTES.LABORATORY}/tests/search`,
  TESTS_UPLOAD: `${ROUTES.LABORATORY}/tests/upload`,
  TESTS_EXPORT: `${ROUTES.LABORATORY}/tests/export`,

  // Tests Order sub-actions
  TESTS_ORDER_NEW: `${ROUTES.LABORATORY}/tests/order/new`,
  TESTS_ORDER_SELECT: `${ROUTES.LABORATORY}/tests/order/select`,
  TESTS_ORDER_BATCH: `${ROUTES.LABORATORY}/tests/order/batch`,
  TESTS_ORDER_TEMPLATE: `${ROUTES.LABORATORY}/tests/order/template`,

  // Tests Record sub-actions
  TESTS_RECORD_ENTER: `${ROUTES.LABORATORY}/tests/record/enter`,
  TESTS_RECORD_VERIFY: `${ROUTES.LABORATORY}/tests/record/verify`,
  TESTS_RECORD_APPROVE: `${ROUTES.LABORATORY}/tests/record/approve`,
  TESTS_RECORD_AMEND: `${ROUTES.LABORATORY}/tests/record/amend`,

  // Tests Search sub-actions
  TESTS_SEARCH_BY_PATIENT: `${ROUTES.LABORATORY}/tests/search/patient`,
  TESTS_SEARCH_BY_TEST: `${ROUTES.LABORATORY}/tests/search/test`,
  TESTS_SEARCH_BY_DATE: `${ROUTES.LABORATORY}/tests/search/date`,
  TESTS_SEARCH_ADVANCED: `${ROUTES.LABORATORY}/tests/search/advanced`,

  // Samples nested actions
  SAMPLES_COLLECT: `${ROUTES.LABORATORY}/samples/collect`,
  SAMPLES_TRACK: `${ROUTES.LABORATORY}/samples/track`,
  SAMPLES_STORE: `${ROUTES.LABORATORY}/samples/store`,
  SAMPLES_DISPOSE: `${ROUTES.LABORATORY}/samples/dispose`,

  // Equipment nested actions
  EQUIPMENT_MANAGE: `${ROUTES.LABORATORY}/equipment/manage`,
  EQUIPMENT_CALIBRATE: `${ROUTES.LABORATORY}/equipment/calibrate`,
  EQUIPMENT_MAINTENANCE: `${ROUTES.LABORATORY}/equipment/maintenance`,
  EQUIPMENT_INVENTORY: `${ROUTES.LABORATORY}/equipment/inventory`,

  // Reports nested actions
  REPORTS_GENERATE: `${ROUTES.LABORATORY}/reports/generate`,
  REPORTS_DAILY: `${ROUTES.LABORATORY}/reports/daily`,
  REPORTS_MONTHLY: `${ROUTES.LABORATORY}/reports/monthly`,
  REPORTS_QUALITY: `${ROUTES.LABORATORY}/reports/quality`,
} as const;

/**
 * Nursing nested routes
 */
export const NURSING_ROUTES = {
  ROOT: ROUTES.NURSING,
  OVERVIEW: `${ROUTES.NURSING}/overview`,
  WARDS: `${ROUTES.NURSING}/wards`,
  PATIENTS: `${ROUTES.NURSING}/patients`,
  VITALS: `${ROUTES.NURSING}/vitals`,
  MEDICATION: `${ROUTES.NURSING}/medication`,
  ALERTS: `${ROUTES.NURSING}/alerts`,

  // Wards nested actions
  WARDS_OVERVIEW: `${ROUTES.NURSING}/wards/overview`,
  WARDS_ASSIGN: `${ROUTES.NURSING}/wards/assign`,
  WARDS_TRANSFER: `${ROUTES.NURSING}/wards/transfer`,
  WARDS_CAPACITY: `${ROUTES.NURSING}/wards/capacity`,

  // Patients nested actions
  PATIENTS_ASSIGNED: `${ROUTES.NURSING}/patients/assigned`,
  PATIENTS_ADMIT: `${ROUTES.NURSING}/patients/admit`,
  PATIENTS_DISCHARGE: `${ROUTES.NURSING}/patients/discharge`,
  PATIENTS_ROSTER: `${ROUTES.NURSING}/patients/roster`,

  // Vitals nested actions
  VITALS_RECORD: `${ROUTES.NURSING}/vitals/record`,
  VITALS_HISTORY: `${ROUTES.NURSING}/vitals/history`,
  VITALS_TRENDS: `${ROUTES.NURSING}/vitals/trends`,
  VITALS_ALERTS: `${ROUTES.NURSING}/vitals/alerts`,

  // Medication nested actions
  MEDICATION_ADMINISTER: `${ROUTES.NURSING}/medication/administer`,
  MEDICATION_SCHEDULE: `${ROUTES.NURSING}/medication/schedule`,
  MEDICATION_CHART: `${ROUTES.NURSING}/medication/chart`,
  MEDICATION_INVENTORY: `${ROUTES.NURSING}/medication/inventory`,

  // Alerts nested actions
  ALERTS_ACTIVE: `${ROUTES.NURSING}/alerts/active`,
  ALERTS_PENDING: `${ROUTES.NURSING}/alerts/pending`,
  ALERTS_RESOLVED: `${ROUTES.NURSING}/alerts/resolved`,
  ALERTS_SETTINGS: `${ROUTES.NURSING}/alerts/settings`,
} as const;

/**
 * Type-safe route generators
 * For dynamic routes with parameters
 */
export const generateRoute = {
  patientDetail: (id: string) => `/patients/${id}`,
  encounterDetail: (id: string) => `/encounters/${id}`,
  resetPassword: (token: string, email?: string) =>
    `/reset-password?token=${token}${email ? `&email=${encodeURIComponent(email)}` : ''}`,

  pharmacyOperation: (operation: string) => `${ROUTES.PHARMACY}/${operation}`,
  pharmacyInventoryAction: (action: string) => `${ROUTES.PHARMACY}/inventory/${action}`,
  // Add billing route generators
  billingOperation: (operation: string) => `${ROUTES.BILLING}/${operation}`,
  billingInvoicesAction: (action: string) => `${ROUTES.BILLING}/invoices/${action}`,
  billingPaymentsAction: (action: string) => `${ROUTES.BILLING}/payments/${action}`,
  billingClaimsAction: (action: string) => `${ROUTES.BILLING}/claims/${action}`,

  // Add clinical route generators
  clinicalOperation: (operation: string) => `${ROUTES.CLINICAL}/${operation}`,
  clinicalDiagnosisAction: (action: string) => `${ROUTES.CLINICAL}/diagnosis/${action}`,
  clinicalAppointmentsAction: (action: string) => `${ROUTES.CLINICAL}/appointments/${action}`,
  clinicalVitalsAction: (action: string) => `${ROUTES.CLINICAL}/vitals/${action}`,
  clinicalTreatmentsAction: (action: string) => `${ROUTES.CLINICAL}/treatments/${action}`,
  //Laboratory
  laboratoryOperation: (operation: string) => `${ROUTES.LABORATORY}/${operation}`,
  laboratoryTestsAction: (action: string) => `${ROUTES.LABORATORY}/tests/${action}`,
  laboratorySamplesAction: (action: string) => `${ROUTES.LABORATORY}/samples/${action}`,
  laboratoryEquipmentAction: (action: string) => `${ROUTES.LABORATORY}/equipment/${action}`,
  laboratoryReportsAction: (action: string) => `${ROUTES.LABORATORY}/reports/${action}`,
} as const;

/**
 * Patient Portal nested routes
 */
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

/**
 * Helper function to check if a route is public (no auth required)
 */
export const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.TWO_FACTOR_AUTH,
  ];

  return publicRoutes.some(route => pathname.startsWith(route));
};

/**
 * Helper function to get the current route from hash
 * For HashRouter compatibility
 */
export const getCurrentRoute = (): string => {
  const hash = window.location.hash;
  return hash.startsWith('#') ? hash.substring(1) || '/' : hash;
};
