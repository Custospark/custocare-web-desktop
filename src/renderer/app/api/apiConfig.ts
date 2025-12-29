/**
 * API Configuration & Endpoints
 * Centralized configuration for API calls, feature flags, and endpoints
 */

/* ======================================================
   Environment
====================================================== */
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/* ======================================================
   Base URL & Timeout
====================================================== */

  export const API_BASE_URL =isDevelopment
                            ? 'http://localhost:3000/api/v1' // local dev
                            : 'https://custocareai-api.custospark.com/api/v1'; // production



export const API_TIMEOUT = parseInt(
  '30000',
  10
); // 30 seconds by default

/* ======================================================
   Feature Flags
====================================================== */
export const FEATURES = {
  ENABLE_ANALYTICS: !isDevelopment,
  ENABLE_ERROR_LOGGING: isProduction,
  ENABLE_PERFORMANCE_MONITORING: isProduction,
  ENABLE_DEBUG_MODE: isDevelopment,
} as const;

/* ======================================================
   API Config
====================================================== */
export const API_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheDuration: {
    short: 1000 * 60 * 1,   // 1 minute
    medium: 1000 * 60 * 5,  // 5 minutes
    long: 1000 * 60 * 30,   // 30 minutes
  },
} as const;

/* ======================================================
   Rate Limiting
====================================================== */
export const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 1000 * 60, // 1 minute
} as const;

/* ======================================================
   API Endpoints
====================================================== */


/* ======================================================
   Default Export
====================================================== */
export default {
  API_BASE_URL,
  API_TIMEOUT,
  FEATURES,
  API_CONFIG,
  RATE_LIMIT,
  // API_ENDPOINTS,
};
