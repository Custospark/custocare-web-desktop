/**
 * ============================================================================
 * MODULE NAVIGATION SLICE WITH LOCALSTORAGE PERSISTENCE
 * ============================================================================
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const LOCAL_STORAGE_KEY = 'moduleNavigationCurrent';

export interface NavigationState {
  operation: string;
  action?: string;
  payload?: unknown;
  timestamp?: number;
}

interface ModuleNavigationState {
  current: NavigationState;
  history: NavigationState[];
  isLoading: boolean;
}

/**
 * Load the last saved navigation state from localStorage
 */
const loadCurrentFromStorage = (): NavigationState => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as NavigationState;
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load navigation state from localStorage:', error);
  }
  
  // Default to overview if nothing stored
  return { 
    operation: 'overview',
    timestamp: Date.now()
  };
};

const initialState: ModuleNavigationState = {
  current: loadCurrentFromStorage(),
  history: [],
  isLoading: false,
};

const moduleNavigationSlice = createSlice({
  name: 'moduleNavigation',
  initialState,
  reducers: {
    /**
     * Navigate to a new operation/action
     */
    navigate(state, action: PayloadAction<NavigationState>) {
      const newState = action.payload;
      
      // Don't push to history if navigating to same state
      if (
        state.current.operation === newState.operation &&
        state.current.action === newState.action
      ) {
        // Still update current to refresh timestamp/payload
        state.current = {
          ...newState,
          timestamp: Date.now(),
        };
      } else {
        // Save current to history for back navigation
        state.history.push({ ...state.current });
        
        // Update current with timestamp
        state.current = {
          ...newState,
          timestamp: Date.now(),
        };
      }

      // Persist ONLY current to localStorage
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(state.current)
        );
      } catch (error) {
        console.warn('Failed to save navigation state to localStorage:', error);
      }

      // DevTools-friendly log
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[NAVIGATE]',
          newState.operation,
          newState.action || '(no action)',
          newState.payload ? 'with payload' : ''
        );
      }
    },

    /**
     * Go back to previous state in memory
     */
    back(state) {
      if (state.history.length === 0) {
        // If no history, go to overview
        state.current = { 
          operation: 'overview',
          timestamp: Date.now()
        };
      } else {
        const last = state.history.pop();
        if (last) {
          state.current = {
            ...last,
            timestamp: Date.now(),
          };
        }
      }

      // Persist new current to storage
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(state.current)
        );
      } catch (error) {
        console.warn('Failed to save navigation state to localStorage:', error);
      }
    },

    /**
     * Navigate back to a specific operation
     */
    navigateBackToOperation(state, action: PayloadAction<string>) {
      const targetOperation = action.payload;
      const index = state.history.findIndex(
        item => item.operation === targetOperation
      );
      
      if (index !== -1) {
        // Remove all items after the target
        state.history = state.history.slice(0, index);
        
        // Set current to the target
        state.current = {
          ...state.history[index] || { operation: targetOperation },
          timestamp: Date.now(),
        };
        
        // Update storage
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(state.current)
          );
        } catch (error) {
          console.warn('Failed to save navigation state to localStorage:', error);
        }
      }
    },

    /**
     * Reset navigation completely
     */
    resetNavigation(state) {
      state.current = { 
        operation: 'overview',
        timestamp: Date.now()
      };
      state.history = [];
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to remove navigation state from localStorage:', error);
      }
    },

    /**
     * Set loading state
     */
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    /**
     * Update current state payload only
     */
    updatePayload(state, action: PayloadAction<unknown>) {
      state.current = {
        ...state.current,
        payload: action.payload,
        timestamp: Date.now(),
      };
      
      // Persist updated current
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(state.current)
        );
      } catch (error) {
        console.warn('Failed to save navigation state to localStorage:', error);
      }
    },

    /**
     * Clear payload from current state
     */
    clearPayload(state) {
      const { ...rest } = state.current;
      state.current = {
        ...rest,
        timestamp: Date.now(),
      };
      
      // Persist updated current
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(state.current)
        );
      } catch (error) {
        console.warn('Failed to save navigation state to localStorage:', error);
      }
    },
  },
});

// Create a simple action creator for easier usage
export const createNavigateAction = (operation: string, action?: string, payload?: unknown) => {
  return navigate({ operation, action, payload });
};

export const { 
  navigate, 
  back, 
  resetNavigation, 
  navigateBackToOperation,
  setLoading,
  updatePayload,
  clearPayload,
} = moduleNavigationSlice.actions;

export default moduleNavigationSlice.reducer;