// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import patientSlice from './slices/patientSlice';
import notificationSlice from './slices/notificationSlice';
import facilitySlice from './slices/facilitySlice';
import clinicalEncounterSlice from './slices/clinicalEncounterSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    patient: patientSlice,
    notification: notificationSlice,
    facility: facilitySlice,
    clinicalEncounter: clinicalEncounterSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notification/addNotification'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['notification.notifications'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;