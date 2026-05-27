import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { SystemStatus } from '../../../shared/components/Navigation/status-bar-components/StatusBarTypes';
import { probeNetworkConnectivity } from '../network/connectivityCheck';
import type { RootState } from '../store';

export interface NetworkState {
  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  /** ISO-8601 — serializable for Redux */
  lastCheckedAt: string | null;
  isChecking: boolean;
}

const browserOnline =
  typeof navigator !== 'undefined' ? navigator.onLine : true;

const initialState: NetworkState = {
  systemStatus: browserOnline ? 'online' : 'offline',
  isOnline: browserOnline,
  latency: null,
  lastCheckedAt: null,
  isChecking: false,
};

export const checkNetworkConnectivity = createAsyncThunk(
  'network/checkConnectivity',
  async () => probeNetworkConnectivity(),
);

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    /** Immediate offline from browser `offline` event */
    setBrowserOffline(state) {
      state.systemStatus = 'offline';
      state.isOnline = false;
      state.latency = null;
      state.lastCheckedAt = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkNetworkConnectivity.pending, (state) => {
        state.isChecking = true;
      })
      .addCase(checkNetworkConnectivity.fulfilled, (state, action) => {
        state.isChecking = false;
        state.systemStatus = action.payload.systemStatus;
        state.isOnline = action.payload.isOnline;
        state.latency = action.payload.latency;
        state.lastCheckedAt = new Date().toISOString();
      })
      .addCase(checkNetworkConnectivity.rejected, (state) => {
        state.isChecking = false;
        state.systemStatus = 'offline';
        state.isOnline = false;
        state.latency = null;
        state.lastCheckedAt = new Date().toISOString();
      });
  },
});

export const { setBrowserOffline } = networkSlice.actions;

export const selectSystemStatus = (state: RootState): SystemStatus =>
  state.network.systemStatus;

export const selectIsOnline = (state: RootState): boolean =>
  state.network.isOnline;

export const selectNetworkLatency = (state: RootState): number | null =>
  state.network.latency;

export const selectLastCheckedAt = createSelector(
  [(state: RootState) => state.network.lastCheckedAt],
  (raw): Date | null => raw ? new Date(raw) : null
);

/** Full-screen offline overlay only when completely offline (not slow). */
export const selectIsCompletelyOffline = (state: RootState): boolean =>
  state.network.systemStatus === 'offline';

export const selectNetworkIsChecking = (state: RootState): boolean =>
  state.network.isChecking;

export default networkSlice.reducer;
