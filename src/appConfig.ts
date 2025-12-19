/**
 * Application Configuration
 * Global app settings and constants
 */

// App Metadata
export const APP_CONFIG = {
  name: 'CustoCare AI',
  version: '1.0.0',
  description: 'Healthcare Intelligence Platform',
  baseUrl: process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  tokenStorageKey: 'authToken',
  userStorageKey: 'authUser',
  sessionTimeout: 1000 * 60 * 30, // 30 minutes
  refreshTokenBeforeExpiry: 1000 * 60 * 5, // Refresh 5 minutes before expiry
} as const;

// Pagination
export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
} as const;

// File Upload
export const FILE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'],
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  defaultDuration: 5000, // 5 seconds
  maxNotifications: 5,
} as const;

// Date Format Configuration
export const DATE_CONFIG = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  defaultTheme: 'dark',
  themes: ['dark', 'light'] as const,
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneRegex: /^\+?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  passwordMinLength: 8,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
} as const;

export default {
  APP_CONFIG,
  SESSION_CONFIG,
  PAGINATION_CONFIG,
  FILE_CONFIG,
  NOTIFICATION_CONFIG,
  DATE_CONFIG,
  THEME_CONFIG,
  VALIDATION_CONFIG,
};