/**
 * ============================================================================
 * USER SECURITY TYPE DEFINITIONS
 * ============================================================================
 * 
 * Based on backend:
 * - GET /{user}/security - returns user security settings
 * - PUT /{user}/security - updates security settings
 * 
 * Data structure from backend (getUserSecurity):
 * {
 *   mfa_enabled: boolean,
 *   requires_password_change: boolean,
 *   password_changed_at: string | null,
 *   last_login_at: string | null,
 *   last_login_ip: string | null,
 *   failed_login_attempts: number,
 *   account_locked_until: string | null
 * }
 */

/**
 * Security settings data structure
 * Matches exactly what the backend returns from getUserSecurity
 */
export interface UserSecurity {
  mfa_enabled: boolean;
  requires_password_change: boolean;
  password_changed_at: string | null; // ISO date string
  last_login_at: string | null;       // ISO date string
  last_login_ip: string | null;
  failed_login_attempts: number;
  account_locked_until: string | null; // ISO date string
}

/**
 * Request payload for updating security settings
 * All fields are optional since you can update one or more at a time
 */
export interface UpdateUserSecurityRequest {
  // For password change - requires current_password
  current_password?: string;
  password?: string;
  password_confirmation?: string;
  
  // For toggling MFA
  mfa_enabled?: boolean;
  
  // For admin/forced password change flag
  requires_password_change?: boolean;
}

export interface UpdateUserSecurityParams {
  userId: number | string;
  data: UpdateUserSecurityRequest;
}

/* ----------------------------- API envelopes ----------------------------- */

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T; // For GET /security, T is UserSecurity object
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type GetUserSecurityResponse = ApiSuccessResponse<UserSecurity>;
export type UpdateUserSecurityResponse = ApiSuccessResponse<UserSecurity>;

/* ----------------------------- Mutations -------------------------------- */

export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* ----------------------------- Utilities -------------------------------- */

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    
    // This automatically uses the user's browser timezone
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short', // Optional: shows timezone abbreviation
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get account status based on security data
 */
export function getAccountStatus(security: UserSecurity): {
  status: 'locked' | 'warning' | 'secure';
  message: string;
} {
  // Check if account is locked
  if (security.account_locked_until) {
    const lockedUntil = new Date(security.account_locked_until);
    if (lockedUntil > new Date()) {
      return {
        status: 'locked',
        message: `Account locked until ${formatDate(security.account_locked_until)}`,
      };
    }
  }

  // Check for failed login attempts
  if (security.failed_login_attempts >= 5) {
    return {
      status: 'warning',
      message: `${security.failed_login_attempts} failed login attempts. Consider changing your password.`,
    };
  }

  // Check password age (90 days = ~3 months)
  if (security.password_changed_at) {
    const lastChange = new Date(security.password_changed_at);
    const daysSinceChange = Math.floor((Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceChange > 90) {
      return {
        status: 'warning',
        message: `Password is ${daysSinceChange} days old. Consider changing it for better security.`,
      };
    }
  }

  return {
    status: 'secure',
    message: 'Your account security is in good standing.',
  };
}