// store/slices/tripSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../rootReducer';
import type { AmbulanceTrip } from '../../../modules/ambulance/api/ambulance-trips/ambulanceTripTypes';

/* -------------------------------------------------------------------------- */
/*                       LOCAL STORAGE KEYS                                   */
/* -------------------------------------------------------------------------- */

const STORAGE_KEYS = {
  ACTIVE_TRIP: 'custocare_active_trip',
  PREVIOUS_TRIP: 'custocare_previous_trip',
  TRIP_CONTEXT: 'custocare_trip_context',
  TRIP_UI_STATE: 'custocare_trip_ui_state',
} as const;

/* -------------------------------------------------------------------------- */
/*                       HELPER: LOAD FROM LOCAL STORAGE                      */
/* -------------------------------------------------------------------------- */

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
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
  } catch { /* ignore */ }
};

/* -------------------------------------------------------------------------- */
/*                       HELPER: CLEAR ALL TRIP DATA                          */
/* -------------------------------------------------------------------------- */

const clearAllTripStorage = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

/* -------------------------------------------------------------------------- */
/*                       TRIP STATE DEFINITION                                */
/* -------------------------------------------------------------------------- */

export interface TripState {
  activeTrip: AmbulanceTrip | null;
  previousTrip: AmbulanceTrip | null;

  context: {
    facilityId: number | null;
    staffId: number | null;
    enteredAt: string | null;
  };

  ui: {
    isTakingAction: boolean;
    hasTripLoaded: boolean;
    error: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/*                           INITIAL STATE                                    */
/* -------------------------------------------------------------------------- */

const initialState: TripState = {
  activeTrip: loadFromStorage<AmbulanceTrip | null>(STORAGE_KEYS.ACTIVE_TRIP, null),
  previousTrip: loadFromStorage<AmbulanceTrip | null>(STORAGE_KEYS.PREVIOUS_TRIP, null),

  context: loadFromStorage(STORAGE_KEYS.TRIP_CONTEXT, {
    facilityId: null,
    staffId: null,
    enteredAt: null,
  }),

  ui: loadFromStorage(STORAGE_KEYS.TRIP_UI_STATE, {
    isTakingAction: false,
    hasTripLoaded: false,
    error: null,
  }),
};

/* -------------------------------------------------------------------------- */
/*                           SLICE DEFINITION                                 */
/* -------------------------------------------------------------------------- */

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    /**
     * SET ACTIVE TRIP — Called when user selects a trip to work on
     */
    setActiveTrip: (state, action: PayloadAction<{
      trip: AmbulanceTrip;
      staffId?: number;
      facilityId?: number;
    }>) => {
      const { trip, staffId, facilityId } = action.payload;

      if (state.activeTrip) {
        state.previousTrip = state.activeTrip;
        saveToStorage(STORAGE_KEYS.PREVIOUS_TRIP, state.previousTrip);
      }

      state.activeTrip = trip;
      saveToStorage(STORAGE_KEYS.ACTIVE_TRIP, state.activeTrip);

      state.context = {
        staffId: staffId ?? null,
        facilityId: facilityId ?? trip.facility_id,
        enteredAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEYS.TRIP_CONTEXT, state.context);

      state.ui.hasTripLoaded = true;
      state.ui.error = null;
      saveToStorage(STORAGE_KEYS.TRIP_UI_STATE, state.ui);
    },

    /**
     * UPDATE ACTIVE TRIP STATUS — When status changes via transitions
     */
    updateActiveTripStatus: (state, action: PayloadAction<Partial<AmbulanceTrip>>) => {
      if (state.activeTrip) {
        state.activeTrip = { ...state.activeTrip, ...action.payload };
        saveToStorage(STORAGE_KEYS.ACTIVE_TRIP, state.activeTrip);
      }
    },

    /**
     * CLEAR ACTIVE TRIP — Move current to previous, clear active
     */
    clearActiveTrip: (state) => {
      if (state.activeTrip) {
        state.previousTrip = state.activeTrip;
        saveToStorage(STORAGE_KEYS.PREVIOUS_TRIP, state.previousTrip);
      }

      state.activeTrip = null;
      saveToStorage(STORAGE_KEYS.ACTIVE_TRIP, null);

      state.context = { facilityId: null, staffId: null, enteredAt: null };
      saveToStorage(STORAGE_KEYS.TRIP_CONTEXT, state.context);

      state.ui.hasTripLoaded = false;
      saveToStorage(STORAGE_KEYS.TRIP_UI_STATE, state.ui);
    },

    /**
     * SWITCH TO PREVIOUS TRIP — Quick toggle back
     */
    switchToPreviousTrip: (state) => {
      if (state.previousTrip) {
        const temp = state.activeTrip;
        state.activeTrip = state.previousTrip;
        state.previousTrip = temp;
        saveToStorage(STORAGE_KEYS.ACTIVE_TRIP, state.activeTrip);
        saveToStorage(STORAGE_KEYS.PREVIOUS_TRIP, state.previousTrip);
      }
    },

    /**
     * SET TRIP ERROR
     */
    setTripError: (state, action: PayloadAction<string | null>) => {
      state.ui.error = action.payload;
      saveToStorage(STORAGE_KEYS.TRIP_UI_STATE, state.ui);
    },

    /**
     * START TAKING ACTION — Loading state
     */
    startTakingAction: (state) => {
      state.ui.isTakingAction = true;
      state.ui.error = null;
      saveToStorage(STORAGE_KEYS.TRIP_UI_STATE, state.ui);
    },

    /**
     * ACTION COMPLETED
     */
    actionCompleted: (state) => {
      state.ui.isTakingAction = false;
      saveToStorage(STORAGE_KEYS.TRIP_UI_STATE, state.ui);
    },

    /**
     * RESET — On logout or full cleanup
     */
    resetTripState: () => {
      clearAllTripStorage();
      return initialState;
    },

    /**
     * EMERGENCY CLEAR — Force clear without storing as previous
     */
    emergencyClearTrip: (state) => {
      state.activeTrip = null;
      state.previousTrip = null;
      state.context = initialState.context;
      state.ui = initialState.ui;
      clearAllTripStorage();
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                         EXPORT REDUCER & ACTIONS                           */
/* -------------------------------------------------------------------------- */

export const {
  setActiveTrip,
  updateActiveTripStatus,
  clearActiveTrip,
  switchToPreviousTrip,
  setTripError,
  startTakingAction,
  actionCompleted,
  resetTripState,
  emergencyClearTrip,
} = tripSlice.actions;

export default tripSlice.reducer;

/* -------------------------------------------------------------------------- */
/*                           SELECTORS                                        */
/* -------------------------------------------------------------------------- */

export const selectActiveTrip = (state: RootState) => state.trip.activeTrip;
export const selectPreviousTrip = (state: RootState) => state.trip.previousTrip;
export const selectTripContext = (state: RootState) => state.trip.context;

export const selectIsTakingTripAction = (state: RootState) => state.trip.ui.isTakingAction;
export const selectHasTripLoaded = (state: RootState) => state.trip.ui.hasTripLoaded;
export const selectTripError = (state: RootState) => state.trip.ui.error;

export const selectActiveTripUuid = (state: RootState) =>
  state.trip.activeTrip?.trip_uuid ?? null;

export const selectActiveTripStatus = (state: RootState) =>
  state.trip.activeTrip?.status ?? null;

export const selectHasActiveTrip = (state: RootState) =>
  !!state.trip.activeTrip;
