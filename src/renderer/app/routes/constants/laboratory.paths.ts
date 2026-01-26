import { ROUTES } from "./shared.paths"; 
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