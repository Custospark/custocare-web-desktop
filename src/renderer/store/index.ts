import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'
import patientSlice from './slices/patientSlice'
import notificationSlice from './slices/notificationSlice'
export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    patient: patientSlice,
    notification: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['notification/addNotification'],
        ignoredPaths: ['notification.notifications'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;