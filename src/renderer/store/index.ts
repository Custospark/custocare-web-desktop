import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import patientSlice from './slices/patientSlice';
import notificationSlice from './slices/notificationSlice';
import facilitySlice from './slices/facilitySlice'; 


/**
 * Redux Store Configuration
 * 
 * Enterprise-Grade State Management:
 * - Centralized state management
 * - Type-safe with TypeScript
 * - DevTools integration for debugging
 * - Middleware configuration
 * - Persistent state via localStorage (in slices)
 * 
 * Store Structure:
 * - auth: Authentication & user state
 * - ui: UI preferences & loading states
 * - patient: Patient data & filters
 * - notification: System notifications
 */
export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    patient: patientSlice,
    notification: notificationSlice,
    facility: facilitySlice,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['notification/addNotification'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['notification.notifications'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;