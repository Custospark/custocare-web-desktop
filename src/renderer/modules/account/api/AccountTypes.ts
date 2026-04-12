/**
 * ============================================================================
 * ACCOUNT / AUTH TYPE DEFINITIONS
 * ============================================================================
 *
 * This file contains all TypeScript types for the authentication flows backed by:
 * - /auth/register
 * - /auth/login
 * - /auth/logout
 * - /auth/me
 * - /auth/verify-email
 * - /auth/resend-verification
 * - /auth/forgot-password
 * - /auth/reset-password
 * plus the provided /user/context/resolve context resolver.
 *
 * Design rules:
 * - Do NOT pass auth data through routes (no query params, no route state).
 * - Persist flow-critical data in Redux slices so screens can pick it up.
 * - Routing is handled in query hooks (React Router navigate).
 */
import type { StaffFacilityAssignment } from "../../../app/store/slices/activeContextSlice";
export type {StaffFacilityAssignment}

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/** RegisterRequest allowed values (backend: in:EU,US,APAC,MEA,SA) */
export enum DataResidencyRegion {
  EU = 'EU',
  US = 'US',
  APAC = 'APAC',
  MEA = 'MEA',
  SA = 'SA',
}

/** Backend supports: email, sms, both */
export enum VerificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both',
}

/**
 * Verification types the UI can enter.
 * - email: user must verify email via /auth/verify-email
 * - mfa: user must provide MFA code (via /auth/login with mfa_code)
 */
export type VerificationType = 'email' | 'mfa';

/**
 * Why verification is happening:
 * - registration: after /auth/register user must verify email then go to Role Selection
 * - login: during /auth/login user must verify (email or MFA) then proceed to Portal Selection
 */
export type VerificationFlow = 'registration' | 'login';

/* -------------------------------------------------------------------------- */
/*                           GENERIC API RESPONSE TYPES                       */
/* -------------------------------------------------------------------------- */

export interface ApiBaseResponse {
  success: boolean;
  code: string;
  message: string;
  requires_mfa: boolean;
}

export interface ApiValidationErrorResponse extends ApiBaseResponse {
  success: false;
  errors?: Record<string, string[]>;
  user: null;
  token: null;
}

export interface ApiAuthSuccessResponse<TUser> extends ApiBaseResponse {
  success: true;
  user: TUser | null;
  token: string | null;
}

/* -------------------------------------------------------------------------- */
/*                              REQUEST PAYLOADS                              */
/* -------------------------------------------------------------------------- */

export interface RegisterRequest {
  national_id?: string | null;
  national_id_country_code?: string | null; // size:3
  email: string;
  phone: string;
  first_name: string;
  last_name: string;

  password: string;
  password_confirmation: string;

  data_residency_region?: DataResidencyRegion | null;
}

export interface LoginRequest {
  email: string;
  password: string;

  /** backend: nullable string size 6 */
  mfa_code?: string | null;

  /** backend: nullable boolean */
  remember_me?: boolean | null;
}

export interface VerifyEmailRequest {
  user_id: number;
  code: string;
  is_token?: boolean;
}

export interface ResendVerificationRequest {
  user_id: number;
  channel?: VerificationChannel;
}

export interface ForgotPasswordRequest {
  email: string;
  channel?: VerificationChannel;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
  new_password_confirmation: string;
  is_token?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                         NON-AUTH CONTEXT RESOLUTION                         */
/* -------------------------------------------------------------------------- */

export interface BackendModule {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface PatientCapability {
  patient_id: number;
  patient_uuid: string;
  primary_facility_id: number | null;
  medical_record_number?: string;
  modules: BackendModule[];
}


export interface StaffCapability {
  staff_id: number;
  staff_uuid: string;
  employee_id: string | null;
  professional_title?: string;
  facilities: StaffFacilityAssignment[];
  modules?: BackendModule[]; // Only for staff without facilities
}

export interface SpatieRoleCapability {
  modules: BackendModule[];
}

export interface UserCapabilities {
  patient?: PatientCapability;
  staff?: StaffCapability;
  [spatieRole: string]:
    | SpatieRoleCapability
    | PatientCapability
    | StaffCapability
    | undefined;
}

/**
 * Minimal user info from /user/context/resolve.
 * Extended with optional fields to match richer user objects from auth responses
 * (e.g., MFA_REQUIRED payload) for legacy compatibility.
 */
export interface MinimalUser {
  id: number;
  uuid: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  national_id_country_code: string | null;
  profile_photo_path: string | null;

  // Optional extra fields (for richer user data, e.g., from MFA_REQUIRED response)
  identity?: {
    state: string;
    verified_at: string | null;
    verification_method: string | null;
  };
  compliance?: {
    data_residency_region: string;
    allowed_processing_regions: string[] | null;
    created_from_facility_id: number | null;
  };
  profile?: {
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
  contact?: {
    email: string | null;
    phone: string | null;
  };
  address?: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
  };
  security?: {
    requires_password_change: boolean;
    mfa_enabled: boolean;
    failed_login_attempts: number;
    account_locked_until: string | null;
  };
  activity?: {
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
  };
  metadata?: Record<string, unknown> | null;
}

export interface FacilityRole {
  facility_id: number;
  facility_name: string | null;
  staff_id: number;
  role_code: string;
  is_primary_facility: boolean;
}

export interface UserContext {
  user: MinimalUser;
  capabilities: UserCapabilities;
  facility_roles: FacilityRole[];
}

/* -------------------------------------------------------------------------- */
/*                              RESPONSE PAYLOADS                             */
/* -------------------------------------------------------------------------- */

export type RegisterResponse<TUser> = ApiAuthSuccessResponse<TUser> | ApiValidationErrorResponse;
export type LoginResponse<TUser> = ApiAuthSuccessResponse<TUser> | ApiValidationErrorResponse;

export interface ResendVerificationResponse extends ApiBaseResponse {
  success: boolean;
  expires_at?: string;
  user: null;
  token: null;
}

export interface ForgotPasswordResponse extends ApiBaseResponse {
  success: true;
  expires_at?: string | null;
  user: null;
  token: null;
}

export interface VerifyEmailResponse extends ApiBaseResponse {
  success: boolean;
  user: null;
  token: null;
}

export interface ResetPasswordResponse extends ApiBaseResponse {
  success: boolean;
  user: null;
  token: null;
}

export interface LogoutResponse extends ApiBaseResponse {
  success: boolean;
  user: null;
  token: null;
}

export interface MeResponse<TUser> extends ApiBaseResponse {
  success: true;
  user: TUser;
  token: null;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData, TError = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Variables for verify-email screen.
 * user_id is optional so screens can rely on slice; hooks will enforce it exists.
 */
export interface VerifyEmailVariables {
  code: string;
  is_token?: boolean;
  user_id?: number;
}

export interface ResendVerificationVariables {
  channel?: VerificationChannel;
  user_id?: number;
}

export interface ResetPasswordVariables extends Omit<ResetPasswordRequest, 'email'> {
  email?: string;
}