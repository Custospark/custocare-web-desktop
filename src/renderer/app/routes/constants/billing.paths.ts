import { ROUTES } from "./shared.paths"; 
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