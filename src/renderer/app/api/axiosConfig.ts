// api/axiosConfig.ts
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';

import { store } from '../store/store';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';
import type { RoleCode } from '../store/slices/activeContextSlice';

/**
 * Axios instance
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Injects:
 * - Authorization token
 * - Active context headers (facility / role)
 * - Optional staff_id / patient_id
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    /**
     * 1️⃣ Authorization
     */
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /**
     * 2️⃣ Active Context
     */
    const {
      activeFacilityId,
      activeRoleCode,
      isPatient,
      isStaffWithFacility,
      capabilities,
    } = state.activeContext;

    /**
     * Facility + Role headers (STAFF WITH FACILITY ONLY)
     */
    if (isStaffWithFacility && activeFacilityId && activeRoleCode) {
      config.headers['X-Active-Facility-Id'] = String(activeFacilityId);
      config.headers['X-Active-Role-Code'] = activeRoleCode as RoleCode;
    }

    /**
     * Patient mode (NO role code)
     */
    if (isPatient && !activeRoleCode) {
      const patientId = capabilities.patient?.patient_id;
      if (patientId) {
        config.headers['X-Patient-Id'] = String(patientId);
      }
    }

    /**
     * Optional: Staff ID (auditing / logging)
     */
    const staffId = capabilities.staff?.staff_id;
    if (staffId) {
      config.headers['X-Staff-Id'] = String(staffId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * - Do NOT swallow errors
 * - Let React Query + hooks decide how to handle them
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Optional: centralized auth failure logging
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401)');
      // DO NOT logout here — let auth slice / React Query decide
    }

    return Promise.reject(error);
  }
);

/**
 * React Query Client
 * Centralized defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 10,   // 10 min
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
