import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UnifiedUserProfile } from '../../../shared/types/userTypes';

interface AuthState {
  user: UnifiedUserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Track if auth is initialized from localStorage
  error: string | null;
  loginError: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false, // Start as false
  error: null,
  loginError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Initialize auth from localStorage
    initializeAuth: (state) => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('authUser');
      
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        
        // Try to restore user from localStorage if available
        if (userStr) {
          try {
            state.user = JSON.parse(userStr) as UnifiedUserProfile;
          } catch {
            // Invalid user data, ignore
          }
        }
      }
      
      state.isInitialized = true; // Mark as initialized
    },

    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.loginError = null;
    },

    loginSuccess: (state, action: PayloadAction<{ user: UnifiedUserProfile; token: string }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.loginError = null;
      
      // Store in localStorage for persistence
      localStorage.setItem('authToken', action.payload.token);
      localStorage.setItem('authUser', JSON.stringify(action.payload.user));
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.loginError = action.payload;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
      state.loginError = null;
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    },

    setUser: (state, action: PayloadAction<UnifiedUserProfile>) => {
      state.user = action.payload;
      // Also update localStorage
      localStorage.setItem('authUser', JSON.stringify(action.payload));
    },

    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
      localStorage.setItem('authToken', action.payload);
    },

    clearError: (state) => {
      state.error = null;
      state.loginError = null;
    },

    clearLoginError: (state) => {
      state.loginError = null;
    },
    
    // Optional: Refresh user data
    refreshUser: (state, action: PayloadAction<UnifiedUserProfile>) => {
      state.user = action.payload;
      localStorage.setItem('authUser', JSON.stringify(action.payload));
    },
  },
});

export const {
  initializeAuth,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  setToken,
  clearError,
  clearLoginError,
  refreshUser,
} = authSlice.actions;

export default authSlice.reducer;