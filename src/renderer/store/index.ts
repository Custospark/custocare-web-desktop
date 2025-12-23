// store/index.ts
export { store, type RootState, type AppDispatch } from './store';
export { rootReducer } from './rootReducer';

// Export all slice actions and selectors
export * from './slices/authSlice';
export * from './slices/uiSlice';
export * from './slices/patientSlice';
export * from './slices/notificationSlice';
export * from './slices/facilitySlice';
export * from './slices/clinicalEncounterSlice';
export * from './slices/visitSlice';
export * from './slices/queueSlice';
export * from './slices/billingSlice';
export * from './slices/roleSlice';
export * from './slices/auditSlice';

// Export all selectors
export * from './selectors/patientSelectors';
export * from './selectors/visitSelectors';
export * from './selectors/integratedSelectors';