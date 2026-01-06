// src/renderer/app/api/axiosConfig.ts

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';

import { store } from '../store/store';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

/* -------------------------------------------------------------------------- */
/*                                AXIOS INSTANCE                               */
/* -------------------------------------------------------------------------- */

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/* -------------------------------------------------------------------------- */
/*                             REQUEST INTERCEPTOR                             */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    /* ---------------------------- Authorization ---------------------------- */
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /* ---------------------------- Active Context ---------------------------- */
    const {
      activeFacilityId,
      isPatient,
      isStaffWithFacility,
      capabilities,
    } = state.activeContext;

    /**
     * STAFF MODE
     * Facility + Role headers are mandatory for staff-with-facility requests
     */
    if (isStaffWithFacility && activeFacilityId) {
      config.headers['X-Active-Facility-Id'] = String(activeFacilityId);
    }

    /**
     * PATIENT MODE
     * No role code, only patient identity
     */
    if (isPatient) {
      const patientId = capabilities.patient?.patient_id;
      if (patientId) {
        config.headers['X-Patient-Id'] = String(patientId);
      }
    }

    /**
     * OPTIONAL STAFF ID
     * Useful for auditing & backend tracing
     */
    const staffId = capabilities.staff?.staff_id;
    if (staffId) {
      config.headers['X-Staff-Id'] = String(staffId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------------------------------------------------------------- */
/*                            RESPONSE INTERCEPTOR                             */
/* -------------------------------------------------------------------------- */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401)');
      /**
       * ❗ DO NOT logout here
       * Let:
       * - authSlice
       * - React Query
       * - AppInitializer
       * decide what to do
       */
    }

    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/*                           REACT QUERY CLIENT                                */
/* -------------------------------------------------------------------------- */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
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

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

/**
 * ✅ BOTH exports supported
 * Prevents ESM import errors across the app
 */
export { axiosInstance };
export default axiosInstance;
