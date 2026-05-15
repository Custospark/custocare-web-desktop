import { ROUTES } from './shared.paths';

const R = ROUTES.REFERRAL;

export const REFERRAL_ROUTES = {
  ROOT: R,
  OVERVIEW: `${R}/overview`,

  PATIENTS: `${R}/patients`,
  PATIENTS_SEARCH: `${R}/patients/search`,
  PATIENTS_REGISTER: `${R}/patients/register`,
  PATIENT_QUEUE: `${R}/patients/queue`,
  WALKIN_PATIENT: `${R}/patients/walk-in`,

  ACTION_CENTER: `${R}/action-center`,
  ACTION_CENTER_FORWARD_PATIENT: `${R}/action-center/forward-patient`,
  ACTION_CENTER_PATIENT_INFO: `${R}/action-center/patient-info`,
  ACTION_CENTER_REFERRAL_STATUS: `${R}/action-center/referral-status`,
  ACTION_CENTER_CREATE_REFERRAL: `${R}/action-center/create-referral`,

  NETWORK: `${R}/network`,
  NETWORK_PENDING: `${R}/network/pending`,
  NETWORK_INCOMING: `${R}/network/incoming`,
  NETWORK_OUTGOING: `${R}/network/outgoing`,

  RECEIPTS: `${R}/receipts`,
} as const;
