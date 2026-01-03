// shared/types/userTypes.ts

// ================= REGISTER / BACKEND USER TYPES =================

/**
 * User resource returned from backend or registration
 */
export interface UserResource {
  id: string;
  uuid: string;
  national_id_country_code: string | null;

  identity: {
    state: string; // 'pending' | 'verified' | etc.
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

  // NEW: Roles for multi-role / multi-facility users
  roles?: FacilityRoleResource[];
}

/**
 * Facility role returned from backend
 */
export interface FacilityRoleResource {
  id: number;
  facility_id?: number | null; // Nullable for patients or staff without facility
  facility_name?: string;
  facility_code?: string;
  role_code: string;            // 'PATIENT', 'STAFF', 'OWNER', etc.
  role_name: string;            // Human-readable, e.g., 'Pharmacist'
  department_ids: number[];
  is_primary_facility?: boolean;
  assignment_status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  permissions: string[];        // For access control
  accessible_modules: string[]; // For UI module control
}

// ================= LOGIN TYPES =================

export interface LoginUserProfile {
  id: number; // backend returns number
  uuid?: string;
  email: string;
  name: string;
  role: string;
  national_id_country_code?: string;
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
  user: LoginUserProfile | UserResource | null;
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

// ================= FRONTEND UNIFIED PROFILE =================

/**
 * Facility role used in frontend (matches activeContextSlice)
 */
export interface FacilityRole {
  id: number;
  facilityId?: number | null;
  facilityName?: string;
  facilityCode?: string;
  roleCode: string;            // 'PATIENT', 'STAFF', 'OWNER', etc.
  roleName: string;            // Human-readable
  departmentIds: number[];
  isPrimaryFacility?: boolean;
  permissions: string[];
  modules: string[];
}

/**
 * Unified frontend user profile
 */
export interface UnifiedUserProfile {
  id: string; // always string for Redux
  uuid: string;
  email: string;
  name: string;
  role?: string;
  national_id_country_code: string | null;

  profile: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };

  // NEW: Available roles for switching context
  availableRoles: FacilityRole[];
}

// ================= MAPPING FUNCTIONS =================

/**
 * Map backend UserResource → frontend UnifiedUserProfile
 */
export const mapUserResourceToProfile = (user: UserResource): UnifiedUserProfile => ({
  id: user.id,
  uuid: user.uuid,
  email: user.contact.email || '',
  name: user.profile.full_name,
  role: 'user', // fallback
  national_id_country_code: user.national_id_country_code,
  profile: {
    first_name: user.profile.first_name,
    last_name: user.profile.last_name,
    full_name: user.profile.full_name,
    title: user.profile.title,
    display_name: user.profile.display_name,
    dob: user.profile.dob,
    gender: user.profile.gender,
  },
  availableRoles: (user.roles || []).map(mapRoleResourceToRole),
});

/**
 * Map backend login user → frontend UnifiedUserProfile
 */
export const mapLoginUserToProfile = (
  user: LoginUserProfile | UserResource
): UnifiedUserProfile => {
  // Type guard for UserResource (has 'profile' and 'contact' fields)
  const isUserResource = (u:unknown): u is UserResource => {
    return (u as UserResource).contact !== undefined && (u as UserResource).profile !== undefined;
  };

  if (isUserResource(user)) {
    // UserResource path
    return mapUserResourceToProfile(user);
  }

  // LoginUserProfile path
  return {
    id: user.id.toString(),
    uuid: user.uuid || '',
    email: user.email || '',
    name: user.name,
    role: user.role,
    national_id_country_code: user.national_id_country_code || null,
    profile: {
      first_name: user.profile?.first_name || user.name.split(' ')[0] || '',
      last_name: user.profile?.last_name || user.name.split(' ').slice(1).join(' ') || '',
      full_name: user.profile?.full_name || user.name,
      title: user.profile?.title || null,
      display_name: user.profile?.display_name || null,
      dob: user.profile?.dob || null,
      gender: user.profile?.gender || null,
    },
    availableRoles: [], // LoginUserProfile does not include roles
  };
};


/**
 * Map backend FacilityRoleResource → frontend FacilityRole
 */
export const mapRoleResourceToRole = (resource: FacilityRoleResource): FacilityRole => ({
  id: resource.id,
  facilityId: resource.facility_id ?? null,
  facilityName: resource.facility_name,
  facilityCode: resource.facility_code,
  roleCode: resource.role_code,
  roleName: resource.role_name,
  departmentIds: resource.department_ids,
  isPrimaryFacility: resource.is_primary_facility,
  permissions: resource.permissions,
  modules: resource.accessible_modules,
});
