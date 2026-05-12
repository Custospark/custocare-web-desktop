// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { buildAuthStateFromStorage } from './slices/authSlice';

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    auth: buildAuthStateFromStorage(),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'notification/addNotification',
          'patient/addEmergencyPatient',
          'visit/addEmergencyVisit',
          'audit/logAuditTrail',
        ],
        ignoredActionPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.previousState',
          'payload.newState',
          'payload.auditTrail',
        ],
        ignoredPaths: [
          'notification.notifications',
          'patient.entities',
          'visit.entities',
          'audit.trail',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;