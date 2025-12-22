// patientSlice.ts
import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import {
  Patient,
  PatientStatus,
  PatientSearchParams,
  PatientDemographics,
  PatientMergeData,
} from '../../features/types/patient';

// Define the PatientState interface
export interface PatientState {
  searchResults: Patient[];
  searchParams: PatientSearchParams;
  selectedPatient: Patient | null;
  duplicates: Array<{
    patient: Patient;
    matchScore: number;
    matchingFields: string[];
  }>;
  mergeInProgress: boolean;
  stats: {
    total: number;
    active: number;
    newToday: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Create entity adapter for normalized patient storage
const patientsAdapter = createEntityAdapter<Patient>({
  sortComparer: (a, b) => 
    `${a.demographics.lastName} ${a.demographics.firstName}`.localeCompare(
      `${b.demographics.lastName} ${b.demographics.firstName}`
    ),
});

// Helper function to get full name from demographics
const getFullName = (demographics: PatientDemographics): string => {
  return `${demographics.firstName} ${demographics.lastName}`.trim();
};

// Helper function to get initials
const getInitials = (demographics: PatientDemographics): string => {
  return `${demographics.firstName.charAt(0)}${demographics.lastName.charAt(0)}`.toUpperCase();
};

// Initialize state
const initialState = patientsAdapter.getInitialState<PatientState>({
  searchResults: [],
  searchParams: {
    page: 1,
    limit: 20,
    includeArchived: false,
  },
  selectedPatient: null,
  duplicates: [],
  mergeInProgress: false,
  stats: {
    total: 0,
    active: 0,
    newToday: 0,
  },
  isLoading: false,
  error: null,
});

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    // Patient CRUD operations
    setPatients: (state, action: PayloadAction<Patient[]>) => {
      patientsAdapter.setAll(state, action.payload);
    },
    
    addPatient: (state, action: PayloadAction<Patient>) => {
      const patient = action.payload;
      // Ensure required fields
      const normalizedPatient: Patient = {
        ...patient,
        linkedPatientIds: patient.linkedPatientIds || [],
        isMasterRecord: patient.isMasterRecord ?? true,
        completionPercentage: patient.completionPercentage ?? 0,
        medicalInfo: {
          ...patient.medicalInfo,
        },
        contactInfo: {
          ...patient.contactInfo,
        },
      };
      
      patientsAdapter.addOne(state, normalizedPatient);
      if (state.selectedPatient?.id === normalizedPatient.id) {
        state.selectedPatient = normalizedPatient;
      }
    },
    
    updatePatient: (state, action: PayloadAction<Partial<Patient> & { id: string }>) => {
      const updateData = action.payload;
      patientsAdapter.updateOne(state, {
        id: updateData.id,
        changes: updateData,
      });
      if (state.selectedPatient?.id === updateData.id) {
        state.selectedPatient = {
          ...state.selectedPatient,
          ...updateData,
        };
      }
    },
    
    removePatient: (state, action: PayloadAction<string>) => {
      patientsAdapter.removeOne(state, action.payload);
      if (state.selectedPatient?.id === action.payload) {
        state.selectedPatient = null;
      }
    },
    
    // Patient selection
    selectPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    
    // Search functionality
    setSearchParams: (state, action: PayloadAction<Partial<PatientSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    
    setSearchResults: (state, action: PayloadAction<Patient[]>) => {
      state.searchResults = action.payload;
      // Add to entity cache
      patientsAdapter.upsertMany(state, action.payload);
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    // Duplicate management
    setPotentialDuplicates: (
      state, 
      action: PayloadAction<Array<{
        patient: Patient;
        matchScore: number;
        matchingFields: string[];
      }>>
    ) => {
      state.duplicates = action.payload;
    },
    
    clearDuplicates: (state) => {
      state.duplicates = [];
    },
    
    startMerge: (state) => {
      state.mergeInProgress = true;
    },
    
    completeMerge: (state, action: PayloadAction<PatientMergeData>) => {
      const { masterPatientId, duplicatePatientId } = action.payload;
      
      // Remove duplicate
      patientsAdapter.removeOne(state, duplicatePatientId);
      
      // Update master with any merged data if available
      const master = state.entities[masterPatientId];
      if (master) {
        const updatedMaster: Patient = {
          ...master,
          linkedPatientIds: [...(master.linkedPatientIds || []), duplicatePatientId],
          updatedAt: new Date().toISOString(),
        };
        
        patientsAdapter.updateOne(state, {
          id: masterPatientId,
          changes: updatedMaster,
        });
      }
      
      state.mergeInProgress = false;
      state.duplicates = state.duplicates.filter(
        dup => dup.patient.id !== duplicatePatientId
      );
    },
    
    // Emergency patient
    addEmergencyPatient: (state, action: PayloadAction<Patient>) => {
      const patient = {
        ...action.payload,
        isEmergency: true,
        requiresDataCompletion: true,
        completionPercentage: 30, // Estimated completion for emergency patients
      };
      patientsAdapter.addOne(state, patient);
      state.selectedPatient = patient;
    },
    
    updateEmergencyPatient: (state, action: PayloadAction<Partial<Patient> & { id: string }>) => {
      const patientData = action.payload;
      const patient = {
        ...patientData,
        isEmergency: false,
        requiresDataCompletion: false,
        completionPercentage: patientData.completionPercentage ?? 100,
      };
      
      patientsAdapter.updateOne(state, {
        id: patient.id,
        changes: patient,
      });
      
      if (state.selectedPatient?.id === patient.id) {
        state.selectedPatient = {
          ...state.selectedPatient,
          ...patient,
        };
      }
    },
    
    // Cross-facility resolution
    linkPatients: (state, action: PayloadAction<{ masterId: string; linkedId: string }>) => {
      const { masterId, linkedId } = action.payload;
      const master = state.entities[masterId];
      const linked = state.entities[linkedId];
      
      if (master && linked) {
        const updatedMaster = {
          ...master,
          linkedPatientIds: [...(master.linkedPatientIds || []), linkedId],
          updatedAt: new Date().toISOString(),
        };
        
        const updatedLinked = {
          ...linked,
          masterPatientId: masterId,
          isMasterRecord: false,
          updatedAt: new Date().toISOString(),
        };
        
        patientsAdapter.updateMany(state, [
          { id: masterId, changes: updatedMaster },
          { id: linkedId, changes: updatedLinked },
        ]);
      }
    },
    
    // Status management
    updatePatientStatus: (
      state, 
      action: PayloadAction<{ patientId: string; status: PatientStatus }>
    ) => {
      patientsAdapter.updateOne(state, {
        id: action.payload.patientId,
        changes: { 
          status: action.payload.status, 
          updatedAt: new Date().toISOString() 
        },
      });
    },
    
    // Stats
    updatePatientStats: (
      state, 
      action: PayloadAction<Partial<PatientState['stats']>>
    ) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    // Bulk operations
    bulkUpdatePatients: (state, action: PayloadAction<Array<Partial<Patient> & { id: string }>>) => {
      const updates = action.payload.map(patient => ({
        id: patient.id,
        changes: patient,
      }));
      patientsAdapter.updateMany(state, updates);
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset state
    resetPatientState: () => initialState,
    
    // Utility actions
    calculateCompletionPercentage: (state, action: PayloadAction<string>) => {
      const patient = state.entities[action.payload];
      if (patient) {
        let completion = 0;
        
        // Demographic completion (30%)
        if (patient.demographics.firstName && patient.demographics.lastName && patient.demographics.dateOfBirth) {
          completion += 30;
        }
        
        // Contact info completion (30%)
        if (patient.contactInfo?.phone) {
          completion += 30;
        }
        
        // Medical info completion (20%)
        if (patient.medicalInfo?.allergies || patient.medicalInfo?.chronicConditions) {
          completion += 20;
        }
        
        // Insurance completion (20%)
        if (patient.primaryInsurance?.policyNumber) {
          completion += 20;
        }
        
        patientsAdapter.updateOne(state, {
          id: action.payload,
          changes: { 
            completionPercentage: Math.min(100, completion),
            requiresDataCompletion: completion < 80,
          },
        });
      }
    },
  },
});

// Export the entity adapter selectors
export const {
  selectAll: selectAllPatients,
  selectById: selectPatientById,
  selectIds: selectPatientIds,
  selectTotal: selectTotalPatients,
  selectEntities: selectPatientEntities,
} = patientsAdapter.getSelectors();

// Custom selectors
export const selectPatientState = (state: { patients: PatientState }) => state.patients;
export const selectSearchResults = (state: { patients: PatientState }) => state.patients.searchResults;
export const selectSelectedPatient = (state: { patients: PatientState }) => state.patients.selectedPatient;
export const selectPatientStats = (state: { patients: PatientState }) => state.patients.stats;
export const selectIsLoading = (state: { patients: PatientState }) => state.patients.isLoading;
export const selectError = (state: { patients: PatientState }) => state.patients.error;
export const selectDuplicates = (state: { patients: PatientState }) => state.patients.duplicates;

// Export helper functions
export const patientHelpers = {
  getFullName,
  getInitials,
  isCompletePatient: (patient: Patient): boolean => {
    return patient.completionPercentage >= 80 && !patient.requiresDataCompletion;
  },
};

// Export actions
export const {
  setPatients,
  addPatient,
  updatePatient,
  removePatient,
  selectPatient,
  clearSelectedPatient,
  setSearchParams,
  setSearchResults,
  clearSearchResults,
  setPotentialDuplicates,
  clearDuplicates,
  startMerge,
  completeMerge,
  addEmergencyPatient,
  updateEmergencyPatient,
  linkPatients,
  updatePatientStatus,
  updatePatientStats,
  bulkUpdatePatients,
  setLoading,
  setError,
  resetPatientState,
  calculateCompletionPercentage,
} = patientSlice.actions;

// Export reducer
export default patientSlice.reducer;