// src/renderer/app/api/axiosConfig.ts

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { QueryClient } from '@tanstack/react-query';

import { store } from '../store/store';
import { API_BASE_URL, API_TIMEOUT } from './apiConfig';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    // IMPORTANT: do NOT set Content-Type globally
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();

    // ---------------- Authorization ----------------
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ---------------- Context Headers ----------------
    const { activeFacilityId, isPatient, isStaffWithFacility, capabilities } =
      state.activeContext;

    if (isStaffWithFacility && activeFacilityId) {
      config.headers['X-Active-Facility-Id'] = String(activeFacilityId);
      config.headers['X-Facility-Id'] = String(activeFacilityId);
    }

    if (isPatient) {
      const patientId = capabilities.patient?.patient_id;
      if (patientId) config.headers['X-Patient-Id'] = String(patientId);
    }

    const staffId = capabilities.staff?.staff_id;
    if (staffId) config.headers['X-Staff-Id'] = String(staffId);

    // ---------------- Content-Type Strategy ----------------
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      // Let the browser set: multipart/form-data; boundary=....
      // Remove any forced JSON content-type if present.
      // Axios v1 headers can be AxiosHeaders, so support both delete styles.
      (config.headers as any)?.delete?.('Content-Type');
      delete (config.headers as any)['Content-Type'];
    } else {
      // For JSON requests, set application/json when there's a body.
      const method = (config.method || 'get').toLowerCase();
      const hasBody = ['post', 'put', 'patch', 'delete'].includes(method);

      if (hasBody && config.data !== undefined) {
        (config.headers as any)?.set?.('Content-Type', 'application/json');
        if (!(config.headers as any)?.set) {
          (config.headers as any)['Content-Type'] = 'application/json';
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized (401)');
    }
    return Promise.reject(error);
  },
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: { retry: 1 },
  },
});

export { axiosInstance };
export default axiosInstance;
