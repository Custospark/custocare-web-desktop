// ========== REGISTER TYPES ==========
// These match the registerUserTypes.ts structure
import type { UserContext } from "../../app/store/slices/activeContextSlice";
export interface UserResource {
  id: string;
  uuid: string;
  national_id_country_code: string | null;
  profile_photo_path: string | null;
  identity: {
    state: string;
    verified_at: string | null;
    verification_method: string | null;
  };
  compliance: {
    data_residency_region: string;
    allowed_processing_regions: string[];
    created_from_facility_id: string | null;
  };
  profile: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
  contact: {
    email: string | null;
    phone: string | null;
  };
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
  };
  security: {
    requires_password_change: boolean;
    mfa_enabled: boolean;
    failed_login_attempts: number;
    account_locked_until: string | null;
  };
  activity: {
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
  };
  metadata: Record<string, unknown> | null;
}

// ========== LOGIN TYPES ==========
export interface LoginUserProfile {
  id: number; // Backend returns number
  email: string;
  name: string;
  role: string;
  uuid?: string;
  national_id_country_code?: string;
  profile_photo_path?: string;
  profile?: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
}

export interface BackendLoginResponse {
  success: boolean;
  code: string;
  message: string;
  requires_mfa: boolean;
  user: LoginUserProfile | null;
  context?: UserContext; // Add this

  token: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: LoginUserProfile;
  token: string;
}

// ========== UNIFIED USER PROFILE (FOR AUTH SLICE) ==========
export interface UnifiedUserProfile {
  id: string; // Always string for Redux
  uuid: string;
  email: string;
  name: string;
  role?: string;
  national_id_country_code: string | null;
  profile_photo_path: string | null;
  profile: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
}

// ========== MAPPING FUNCTIONS ==========

// For register: UserResource → UnifiedUserProfile
export const mapUserResourceToProfile = (user: UserResource): UnifiedUserProfile => ({
  id: user.id, // Already string
  uuid: user.uuid,
  email: user.contact.email || '',
  name: user.profile.full_name,
  role: 'user',
  national_id_country_code: user.national_id_country_code,
  profile_photo_path: user.profile_photo_path,
  profile: {
    first_name: user.profile.first_name,
    last_name: user.profile.last_name,
    full_name: user.profile.full_name,
    title: user.profile.title,
    display_name: user.profile.display_name,
    dob: user.profile.dob,
    gender: user.profile.gender,
  },
});

// For login: LoginUserProfile → UnifiedUserProfile
export const mapLoginUserToProfile = (user: LoginUserProfile): UnifiedUserProfile => ({
  id: user.id.toString(), // Convert number to string
  uuid: user.uuid || '',
  email: user.email || '',
  name: user.name,
  role: user.role,
  national_id_country_code: user.national_id_country_code || null,
  profile_photo_path: user.profile_photo_path || null,
  profile: {
    first_name: user.profile?.first_name || user.name.split(' ')[0] || '',
    last_name: user.profile?.last_name || user.name.split(' ').slice(1).join(' ') || '',
    full_name: user.profile?.full_name || user.name,
    title: user.profile?.title || null,
    display_name: user.profile?.display_name || null,
    dob: user.profile?.dob || null,
    gender: user.profile?.gender || null,
  },
});