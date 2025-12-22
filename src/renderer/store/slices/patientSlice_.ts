import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PatientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  medicalHistory: string[];
  [key: string]: string | string[] | null;
}

interface PatientState {
  selectedPatient: PatientData | null;
  recentPatients: PatientData[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PatientState = {
  selectedPatient: null,
  recentPatients: [],
  isLoading: false,
  error: null,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    // Select patient
    setSelectedPatient: (state, action: PayloadAction<PatientData | null>) => {
      state.selectedPatient = action.payload;
    },

    // Set recent patients
    setRecentPatients: (state, action: PayloadAction<PatientData[]>) => {
      state.recentPatients = action.payload;
    },

    // Add patient to recent
    addRecentPatient: (state, action: PayloadAction<PatientData>) => {
      // Remove if already exists
      state.recentPatients = state.recentPatients.filter(
        (p) => p.id !== action.payload.id
      );
      // Add to front
      state.recentPatients.unshift(action.payload);
      // Keep only last 5
      state.recentPatients = state.recentPatients.slice(0, 5);
    },

    // Loading state
    setPatientLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error state
    setPatientError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear patient data
    clearPatientData: (state) => {
      state.selectedPatient = null;
      state.recentPatients = [];
      state.error = null;
    },
  },
});

export const {
  setSelectedPatient,
  setRecentPatients,
  addRecentPatient,
  setPatientLoading,
  setPatientError,
  clearPatientData,
} = patientSlice.actions;

export default patientSlice.reducer;