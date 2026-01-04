import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { store } from '../store/store';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

/**
 * Axios Instance with automatic context header injection
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Automatically injects:
 * - Authorization token
 * - X-Active-Facility-Id (from activeContext)
 * - X-Active-Role-Code (from activeContext)
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    // 1. Inject auth token
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inject active facility ID (for multi-facility staff)
    const { activeFacilityId, activeRoleCode } = state.activeContext;
    
    if (activeFacilityId) {
      config.headers['X-Active-Facility-Id'] = activeFacilityId.toString();
    }

    // 3. Inject active role code (DOCTOR, NURSE, PATIENT, etc.)
    if (activeRoleCode) {
      config.headers['X-Active-Role-Code'] = activeRoleCode;
    }

    // 4. Optional: Add staff_id if needed
    const staffId = state.activeContext.capabilities.staff?.staff_id;
    if (staffId) {
      config.headers['X-Staff-Id'] = staffId.toString();
    }

    // // 5. Optional: Add patient_id if in patient mode
    // const patientId = state.activeContext.capabilities.patient?.patient_id;
    // if (patientId && activeRoleCode === 'PATIENT') {
    //   config.headers['X-Patient-Id'] = patientId.toString();
    // }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Let React Query handle errors naturally
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Handle 401 globally
    if (error.response?.status === 401) {
      // Let auth slice handle logout via React Query error boundary
      console.warn('Unauthorized request detected');
    }
    
    return Promise.reject(error);
  }
);

/**
 * React Query Client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default axiosInstance;

/**
 * Helper: Fetch user context from backend
 * Call this after login to get updated context
 */
export const fetchUserContext = async () => {
  const response = await axiosInstance.get('/api/user/context');
  return response.data.data; // Returns UserContext
};