// store/slices/visitSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { type QueueVisitItem, VisitPhase, VisitStatus } from '../../../modules/pharmacy/api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                       VISIT STATE - SINGLE ITEM STORAGE                    */
/* -------------------------------------------------------------------------- */

export interface VisitsState {
  // Single active visit being worked on (from queue)
  activeVisit: QueueVisitItem | null;
  
  // Previous visit for quick navigation (optional)
  previousVisit: QueueVisitItem | null;
  
  // Context information
  context: {
    facilityId: number | null;
    departmentId: number | null;
    staffId: number | null;
    enteredAt: string | null;
  };
  
  // UI state
  ui: {
    isTakingAction: boolean;
    hasVisitLoaded: boolean;
    error: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/*                           INITIAL STATE                                    */
/* -------------------------------------------------------------------------- */

const initialState: VisitsState = {
  activeVisit: null,
  previousVisit: null,
  
  context: {
    facilityId: null,
    departmentId: null,
    staffId: null,
    enteredAt: null,
  },
  
  ui: {
    isTakingAction: false,
    hasVisitLoaded: false,
    error: null,
  },
};

/* -------------------------------------------------------------------------- */
/*                           SLICE DEFINITION                                 */
/* -------------------------------------------------------------------------- */

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    /**
     * SET ACTIVE VISIT - Called when staff clicks "Take Action"
     * This clears any previous visit and sets the new one
     */
    setActiveVisit: (state, action: PayloadAction<{
      visit: QueueVisitItem;
      staffId: number;
      departmentId?: number;
      facilityId?: number;
    }>) => {
      const { visit, staffId, departmentId, facilityId } = action.payload;
      
      // Store current as previous if exists
      if (state.activeVisit) {
        state.previousVisit = state.activeVisit;
      }
      
      // Set new active visit
      state.activeVisit = visit;
      
      // Update context
      state.context = {
        staffId,
        departmentId: departmentId ?? visit.current_department_id ?? null,
        facilityId: facilityId ?? visit.facility_id,
        enteredAt: new Date().toISOString(),
      };
      
      state.ui.hasVisitLoaded = true;
      state.ui.error = null;
    },
    
    /**
     * START TAKING ACTION - UI loading state
     */
    startTakingAction: (state) => {
      state.ui.isTakingAction = true;
      state.ui.error = null;
    },
    
    /**
     * ACTION COMPLETED - Clear active visit
     */
    clearActiveVisit: (state) => {
      if (state.activeVisit) {
        state.previousVisit = state.activeVisit;
      }
      
      state.activeVisit = null;
      state.context = {
        facilityId: null,
        departmentId: null,
        staffId: null,
        enteredAt: null,
      };
      state.ui.hasVisitLoaded = false;
    },
    
    /**
     * UPDATE ACTIVE VISIT PHASE - When visit moves to next phase
     */
    updateActiveVisitPhase: (state, action: PayloadAction<{
      phase: VisitPhase;
      departmentId?: number;
    }>) => {
      if (state.activeVisit) {
        state.activeVisit.current_phase = action.payload.phase;
        if (action.payload.departmentId !== undefined) {
          state.activeVisit.current_department_id = action.payload.departmentId;
        }
      }
    },
    
    /**
     * UPDATE ACTIVE VISIT STATUS - When status changes
     */
    updateActiveVisitStatus: (state, action: PayloadAction<VisitStatus>) => {
      if (state.activeVisit) {
        state.activeVisit.status = action.payload;
      }
    },
    
    /**
     * SWITCH TO PREVIOUS VISIT - Quick navigation back
     */
    switchToPreviousVisit: (state) => {
      if (state.previousVisit) {
        const temp = state.activeVisit;
        state.activeVisit = state.previousVisit;
        state.previousVisit = temp;
      }
    },
    
    /**
     * UPDATE VISIT PATIENT INFO - When patient data is updated
     */
    updateActiveVisitPatient: (state, action: PayloadAction<Partial<QueueVisitItem['patient']>>) => {
      if (state.activeVisit?.patient) {
        state.activeVisit.patient = {
          ...state.activeVisit.patient,
          ...action.payload,
        };
      }
    },
    
    /**
     * SET ERROR STATE
     */
    setVisitError: (state, action: PayloadAction<string | null>) => {
      state.ui.error = action.payload;
    },
    
    /**
     * RESET VISIT STATE - On logout or cleanup
     */
    resetVisitsState: () => initialState,
    
    /**
     * EMERGENCY CLEAR - Force clear without storing as previous
     */
    emergencyClearVisit: (state) => {
      state.activeVisit = null;
      state.previousVisit = null;
      state.context = initialState.context;
      state.ui.hasVisitLoaded = false;
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                         EXPORT REDUCER & ACTIONS                           */
/* -------------------------------------------------------------------------- */

export const {
  setActiveVisit,
  startTakingAction,
  clearActiveVisit,
  updateActiveVisitPhase,
  updateActiveVisitStatus,
  switchToPreviousVisit,
  updateActiveVisitPatient,
  setVisitError,
  resetVisitsState,
  emergencyClearVisit,
} = visitsSlice.actions;

export default visitsSlice.reducer;

/* -------------------------------------------------------------------------- */
/*                           SELECTORS                                        */
/* -------------------------------------------------------------------------- */

// Primary selectors
export const selectActiveVisit = (state: RootState) => state.visits.activeVisit;
export const selectPreviousVisit = (state: RootState) => state.visits.previousVisit;
export const selectVisitContext = (state: RootState) => state.visits.context;

// UI state selectors
export const selectIsTakingAction = (state: RootState) => state.visits.ui.isTakingAction;
export const selectHasVisitLoaded = (state: RootState) => state.visits.ui.hasVisitLoaded;
export const selectVisitError = (state: RootState) => state.visits.ui.error;

// Derived selectors
export const selectActiveVisitUuid = (state: RootState) => 
  state.visits.activeVisit?.visit_uuid || null;

export const selectActivePatient = (state: RootState) => 
  state.visits.activeVisit?.patient || null;

export const selectActiveVisitPhase = (state: RootState) => 
  state.visits.activeVisit?.current_phase || null;

export const selectActiveVisitStatus = (state: RootState) => 
  state.visits.activeVisit?.status || null;

export const selectActiveVisitDepartment = (state: RootState) => 
  state.visits.activeVisit?.current_department_id || null;

// Check if we have an active visit
export const selectHasActiveVisit = (state: RootState) => 
  !!state.visits.activeVisit;

// Get visit info for display - FIXED VERSION
export const selectActiveVisitInfo = (state: RootState) => {
  const visit = state.visits.activeVisit;
  if (!visit) return null;
  
  return {
    uuid: visit.visit_uuid,
    patientName: visit.patient?.name || 'Unknown Patient',
    patientNumber: visit.patient?.patient_number || 'N/A',
    phase: visit.current_phase,
    type: visit.visit_type,
    status: visit.status,
    acuity: visit.acuity_score,
    waitTime: visit.waiting_since,
    arrivedAt: visit.arrived_at,
  };
};