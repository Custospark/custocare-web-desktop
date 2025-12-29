// store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';

// Import all slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import patientReducer from './slices/patientSlice';
import notificationReducer from './slices/notificationSlice';
import facilityReducer from './slices/facilitySlice';
import clinicalEncounterReducer from './slices/clinicalEncounterSlice';

// Import all the new slices we created
import visitReducer from './slices/visitSlice';
import queueReducer from './slices/queueSlice';
import billingReducer from './slices/billingSlice';
import roleReducer from './slices/roleSlice';
import auditReducer from './slices/auditSlice';

// Combine all reducers
export const rootReducer = combineReducers({
  // Existing slices
  auth: authReducer,
  ui: uiReducer,
  patient: patientReducer,
  notification: notificationReducer,
  facility: facilityReducer,
  clinicalEncounter: clinicalEncounterReducer,
  
  // New slices from our healthcare system
  visit: visitReducer,
  queue: queueReducer,
  billing: billingReducer,
  role: roleReducer,
  audit: auditReducer,
});

export type RootState = ReturnType<typeof rootReducer>;