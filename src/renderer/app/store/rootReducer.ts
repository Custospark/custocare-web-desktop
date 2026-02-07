// store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';

// ==============================
// CORE SLICES
// ==============================
import authReducer from './slices/authSlice';
import activeContextReducer from './slices/activeContextSlice';
import uiReducer from './slices/uiSlice';

// ==============================
// DOMAIN SLICES
// ==============================
import patientReducer from './slices/patientSlice';
import notificationReducer from './slices/notificationSlice';
import facilityReducer from './slices/facilitySlice';
import clinicalEncounterReducer from './slices/clinicalEncounterSlice';
import queueReducer from './slices/queueSlice';
import billingReducer from '../../modules/medical-records/ui/visit-action-center/billing-newest/billing-slice';
import roleReducer from './slices/roleSlice';
import auditReducer from './slices/auditSlice';
import visitReducer from './slices/visitSlice';
// ==============================
// MODULE NAVIGATION (NEW)
// ==============================
import moduleNavigationReducer from './slices/moduleNavigationSlice';

// ==============================
// ROOT REDUCER
// ==============================
export const rootReducer = combineReducers({
  auth: authReducer,
  activeContext: activeContextReducer, // Role / Facility context
  ui: uiReducer,
  visits:visitReducer,

  /**
   * Module-level navigation state
   * (operation, action, payload, history)
   */
  moduleNavigation: moduleNavigationReducer,

  patient: patientReducer,
  notification: notificationReducer,
  facility: facilityReducer,
  clinicalEncounter: clinicalEncounterReducer,
  visit: visitReducer,
  queue: queueReducer,
  billing: billingReducer,
  role: roleReducer,
  audit: auditReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
