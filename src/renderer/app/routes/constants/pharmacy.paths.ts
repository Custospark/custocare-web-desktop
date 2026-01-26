import { ROUTES } from "./shared.paths"; 
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