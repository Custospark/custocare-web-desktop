import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UnifiedUserProfile } from '../../../shared/types/userTypes';

interface AuthState {
  user: UnifiedUserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginError: string | null;
}

// Initial state remains the same
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: !!localStorage.getItem('authToken'),
  isLoading: false,
  error: null,
  loginError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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
      state.loginError = null;
      localStorage.setItem('authToken', action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.loginError = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loginError = null;
      localStorage.removeItem('authToken');
    },
    setUser: (state, action: PayloadAction<UnifiedUserProfile>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('authToken', action.payload);
    },
    clearError: (state) => {
      state.error = null;
      state.loginError = null;
    },
    clearLoginError: (state) => {
      state.loginError = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  setToken,
  clearError,
  clearLoginError,
} = authSlice.actions;

export default authSlice.reducer;