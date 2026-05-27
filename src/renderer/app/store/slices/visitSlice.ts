// store/slices/visitSlice.ts
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { type QueueVisitItem, VisitPhase, VisitStatus } from '../../../modules/pharmacy/api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                       LOCAL STORAGE KEYS                                   */
/* -------------------------------------------------------------------------- */

const STORAGE_KEYS = {
  ACTIVE_VISIT: 'custocare_active_visit',
  PREVIOUS_VISIT: 'custocare_previous_visit',
  VISIT_CONTEXT: 'custocare_visit_context',
  VISIT_UI_STATE: 'custocare_visit_ui_state',
} as const;

/* -------------------------------------------------------------------------- */
/*                       HELPER: LOAD FROM LOCAL STORAGE                      */
/* -------------------------------------------------------------------------- */

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
  }
  return defaultValue;
};

/* -------------------------------------------------------------------------- */
/*                       HELPER: SAVE TO LOCAL STORAGE                        */
/* -------------------------------------------------------------------------- */

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
};

/* -------------------------------------------------------------------------- */
/*                       HELPER: CLEAR ALL VISIT DATA                         */
/* -------------------------------------------------------------------------- */

const clearAllVisitStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

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

  /** Pharmacy intake: visit IDs that currently have Rx ready for dispensing (from queue queries). */
  medicationEncounterQueue: {
    visitIdsReadyForDispensing: number[];
    lastSyncedAt: string | null;
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

// Load from localStorage to survive page refreshes
const initialState: VisitsState = {
  activeVisit: loadFromStorage<QueueVisitItem | null>(STORAGE_KEYS.ACTIVE_VISIT, null),
  previousVisit: loadFromStorage<QueueVisitItem | null>(STORAGE_KEYS.PREVIOUS_VISIT, null),
  
  context: loadFromStorage(STORAGE_KEYS.VISIT_CONTEXT, {
    facilityId: null,
    departmentId: null,
    staffId: null,
    enteredAt: null,
  }),

  medicationEncounterQueue: {
    visitIdsReadyForDispensing: [],
    lastSyncedAt: null,
  },
  
  ui: loadFromStorage(STORAGE_KEYS.VISIT_UI_STATE, {
    isTakingAction: false,
    hasVisitLoaded: false,
    error: null,
  }),
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
        // Save previous visit to localStorage
        saveToStorage(STORAGE_KEYS.PREVIOUS_VISIT, state.previousVisit);
      }
      
      // Set new active visit
      state.activeVisit = visit;
      // Save active visit to localStorage
      saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, state.activeVisit);
      
      // Update context
      state.context = {
        staffId,
        departmentId: departmentId ?? visit.current_department_id ?? null,
        facilityId: facilityId ?? visit.facility_id,
        enteredAt: new Date().toISOString(),
      };
      // Save context to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_CONTEXT, state.context);
      
      state.ui.hasVisitLoaded = true;
      state.ui.error = null;
      // Save UI state to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_UI_STATE, state.ui);
    },
    
    /**
     * START TAKING ACTION - UI loading state
     */
    startTakingAction: (state) => {
      state.ui.isTakingAction = true;
      state.ui.error = null;
      // CHANGE: Save UI state to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_UI_STATE, state.ui);
    },
    
    /**
     * ACTION COMPLETED - Clear active visit
     */
    clearActiveVisit: (state) => {
      if (state.activeVisit) {
        state.previousVisit = state.activeVisit;
        // CHANGE: Save previous visit to localStorage
        saveToStorage(STORAGE_KEYS.PREVIOUS_VISIT, state.previousVisit);
      }
      
      state.activeVisit = null;
      // CHANGE: Remove active visit from localStorage
      saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, null);
      
      state.context = {
        facilityId: null,
        departmentId: null,
        staffId: null,
        enteredAt: null,
      };
      // CHANGE: Save cleared context to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_CONTEXT, state.context);
      
      state.ui.hasVisitLoaded = false;
      // CHANGE: Save UI state to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_UI_STATE, state.ui);
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
        // CHANGE: Save updated active visit to localStorage
        saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, state.activeVisit);
      }
    },
    
    /**
     * UPDATE ACTIVE VISIT STATUS - When status changes
     */
    updateActiveVisitStatus: (state, action: PayloadAction<VisitStatus>) => {
      if (state.activeVisit) {
        state.activeVisit.status = action.payload;
        // CHANGE: Save updated active visit to localStorage
        saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, state.activeVisit);
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
        // CHANGE: Save swapped visits to localStorage
        saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, state.activeVisit);
        saveToStorage(STORAGE_KEYS.PREVIOUS_VISIT, state.previousVisit);
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
        // CHANGE: Save updated active visit to localStorage
        saveToStorage(STORAGE_KEYS.ACTIVE_VISIT, state.activeVisit);
      }
    },
    
    /**
     * SET ERROR STATE
     */
    setVisitError: (state, action: PayloadAction<string | null>) => {
      state.ui.error = action.payload;
      // CHANGE: Save UI state to localStorage
      saveToStorage(STORAGE_KEYS.VISIT_UI_STATE, state.ui);
    },

    setMedicationEncounterQueue: (
      state,
      action: PayloadAction<{ visitIds: number[]; syncedAt?: string }>
    ) => {
      state.medicationEncounterQueue = {
        visitIdsReadyForDispensing: action.payload.visitIds,
        lastSyncedAt: action.payload.syncedAt ?? new Date().toISOString(),
      };
    },
    
    /**
     * RESET VISIT STATE - On logout or cleanup
     */
    resetVisitsState: () => {
      // Clear localStorage when resetting state
      clearAllVisitStorage();
      return initialState;
    },
    
    /**
     * EMERGENCY CLEAR - Force clear without storing as previous
     */
    emergencyClearVisit: (state) => {
      state.activeVisit = null;
      state.previousVisit = null;
      state.context = initialState.context;
      state.ui.hasVisitLoaded = false;
      // Clear localStorage on emergency clear
      clearAllVisitStorage();
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
  setMedicationEncounterQueue,
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
export const selectActiveVisitId = (state: RootState) => 
  state.visits.activeVisit?.visit_id || null;

export const selectActivePatient = (state: RootState) => 
  state.visits.activeVisit?.patient || null;

export const selectActiveVisitPatientId = (state: RootState) => 
  state.visits.activeVisit?.patient_id || null;

export const selectActiveVisitPhase = (state: RootState) => 
  state.visits.activeVisit?.current_phase || null;

export const selectActiveVisitStatus = (state: RootState) => 
  state.visits.activeVisit?.status || null;

export const selectActiveVisitDepartment = (state: RootState) => 
  state.visits.activeVisit?.current_department_id || null;

// Check if we have an active visit
export const selectHasActiveVisit = (state: RootState) => 
  !!state.visits.activeVisit;

/** Whether the active visit has a completed status. */
export const selectIsVisitCompleted = (state: RootState): boolean => {
  const status = selectActiveVisitStatus(state);
  return status === 'completed';
};

export const selectMedicationEncounterQueueVisitIds = (state: RootState) =>
  state.visits.medicationEncounterQueue?.visitIdsReadyForDispensing ?? [];

// Get visit info for display - memoized
export const selectActiveVisitInfo = createSelector(
  selectActiveVisit,
  (visit) => {
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
  }
);