import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PendingPatientForwarding {
  visitId: number | null;
  patientId: number | null;
  patientName: string;
  assignedStaffId: number | null;
  assignedStaffName: string;
  note: string;
  hasProvidedServices: boolean;
  createdAt: number | null;
}

interface ForwardPatientState {
  pendingForwarding: PendingPatientForwarding | null;
}

const initialState: ForwardPatientState = {
  pendingForwarding: null,
};

const forwardPatientSlice = createSlice({
  name: 'patientForwarding',
  initialState,
  reducers: {
    setPendingForwarding: (
      state,
      action: PayloadAction<Omit<PendingPatientForwarding, 'createdAt'> & { createdAt?: number }>
    ) => {
      state.pendingForwarding = {
        ...action.payload,
        createdAt: action.payload.createdAt ?? Date.now(),
      };
    },

    patchPendingForwarding: (
      state,
      action: PayloadAction<Partial<PendingPatientForwarding>>
    ) => {
      if (!state.pendingForwarding) {
        state.pendingForwarding = {
          visitId: null,
          patientId: null,
          patientName: '',
          assignedStaffId: null,
          assignedStaffName: '',
          note: '',
          hasProvidedServices: false,
          createdAt: Date.now(),
          ...action.payload,
        };
        return;
      }

      state.pendingForwarding = {
        ...state.pendingForwarding,
        ...action.payload,
      };
    },

    clearPendingForwarding: (state) => {
      state.pendingForwarding = null;
    },
  },
});

export const {
  setPendingForwarding,
  patchPendingForwarding,
  clearPendingForwarding,
} = forwardPatientSlice.actions;

export default forwardPatientSlice.reducer;

// Selectors
export const selectPendingForwarding = (state: {
  patientForwarding: ForwardPatientState;
}) => state.patientForwarding.pendingForwarding;

export const selectHasPendingForwarding = (state: {
  patientForwarding: ForwardPatientState;
}) => Boolean(state.patientForwarding.pendingForwarding);
