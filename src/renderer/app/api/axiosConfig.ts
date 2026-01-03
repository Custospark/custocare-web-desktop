import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { store } from '../store/store';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

/**
 * ======================================================
 * Axios Instance
 * - No redirects
 * - No side effects
 * - Only request enrichment
 * ======================================================
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
 * ======================================================
 * REQUEST INTERCEPTOR
 * - Inject auth token
 * - Inject active role & facility context
 * ======================================================
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    // Auth token (patients + staff)
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /**
     * Active context
     * - Present for staff & facility-bound users
     * - Absent for patients (safe to skip)
     */
    const { activeRoleId, activeFacilityId } = state.activeContext;

    if (activeRoleId) {
      config.headers['X-Active-Role-Id'] = activeRoleId.toString();
    }

    if (activeFacilityId) {
      config.headers['X-Active-Facility-Id'] =
        activeFacilityId.toString();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ======================================================
 * RESPONSE INTERCEPTOR
 * - DO NOT redirect
 * - DO NOT swallow errors
 * - React Query handles everything
 * ======================================================
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

/**
 * ======================================================
 * React Query Client
 *
 * ======================================================
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
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
