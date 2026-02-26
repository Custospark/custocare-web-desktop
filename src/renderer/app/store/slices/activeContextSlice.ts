// store/slices/activeContextSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Module from backend
 */
export interface BackendModule {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

/**
 * Patient capability from backend
 */
export interface PatientCapability {
  patient_id: number;
  patient_uuid: string;
  primary_facility_id: number | null;
  medical_record_number?: string;
  modules: BackendModule[];
}

/**
 * Facility assignment for staff
 */
export interface StaffFacilityAssignment {
  facility_id: number;
  facility_name: string;
  role_code: string;
  modules: BackendModule[];
}

/**
 * Staff capability from backend
 */
export interface StaffCapability {
  staff_id: number;
  staff_uuid: string;
  employee_id: string | null;
  professional_title?: string;
  facilities: StaffFacilityAssignment[];
  modules?: BackendModule[]; // Only for staff without facilities
}

/**
 * Spatie role capability from backend
 */
export interface SpatieRoleCapability {
  modules: BackendModule[];
}

/**
 * User capabilities from backend
 */
export interface UserCapabilities {
  patient?: PatientCapability;
  staff?: StaffCapability;
  [spatieRole: string]: SpatieRoleCapability | PatientCapability | StaffCapability | undefined;
}

/**
 * Minimal user info from backend – extended with optional fields
 * to accommodate richer user objects from auth responses (e.g., MFA_REQUIRED payload)
 * without breaking legacy consumers.
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

/**
 * Facility role for legacy support
 */
export interface FacilityRole {
  facility_id: number;
  facility_name: string | null;
  staff_id: number;
  role_code: string;
  is_primary_facility: boolean;
}

/**
 * Complete user context from backend
 */
export interface UserContext {
  user: MinimalUser;
  capabilities: UserCapabilities;
  facility_roles: FacilityRole[];
}

/**
 * Active Context State
 */
interface ActiveContextState {
  // Core user data
  user: MinimalUser | null;
  capabilities: UserCapabilities;
  facilityRoles: FacilityRole[];
  
  // Active selections
  activeCapability: string | null; // 'patient', 'staff', 'super_admin', 'regulator', etc.
  activeFacilityId: number | null; // Only for staff with facilities
  
  // Derived state
  availableCapabilities: string[]; // All capabilities user can switch to
  isPatient: boolean;
  isStaff: boolean;
  isStaffWithFacility: boolean;
  isPatientOnly: boolean;
  isStaffWithoutFacility: boolean;
  hasMultipleFacilities: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

/**
 * Load initial state from localStorage
 */
const loadInitialState = (): ActiveContextState => {
  const baseState: ActiveContextState = {
    user: null,
    capabilities: {},
    facilityRoles: [],
    activeCapability: null,
    activeFacilityId: null,
    availableCapabilities: [],
    isPatient: false,
    isStaff: false,
    isStaffWithFacility: false,
    isPatientOnly: false,
    isStaffWithoutFacility: false,
    hasMultipleFacilities: false,
    isLoading: false,
    error: null,
  };

  try {
    // Load persisted user context
    const persistedUserContext = localStorage.getItem('userContext');
    if (!persistedUserContext) {
      return baseState;
    }

    const userContext: UserContext = JSON.parse(persistedUserContext);
    
    baseState.user = userContext.user;
    baseState.capabilities = userContext.capabilities;
    baseState.facilityRoles = userContext.facility_roles;
    
    // Extract available capabilities
    baseState.availableCapabilities = Object.keys(userContext.capabilities);
    
    // Set derived flags
    baseState.isPatient = Boolean(userContext.capabilities.patient);
    baseState.isStaff = Boolean(userContext.capabilities.staff);
    
    if (userContext.capabilities.staff) {
      const staffCapability = userContext.capabilities.staff;
      baseState.isStaffWithFacility = staffCapability.facilities.length > 0;
      baseState.isStaffWithoutFacility = staffCapability.facilities.length === 0;
      baseState.hasMultipleFacilities = staffCapability.facilities.length > 1;
    }
    
    baseState.isPatientOnly = Boolean(userContext.capabilities.patient && !userContext.capabilities.staff);
    
    // Load active selections
    const storedCapability = localStorage.getItem('activeCapability');
    const storedFacilityId = localStorage.getItem('activeFacilityId');
    
    // Auto-select first available capability
    if (baseState.availableCapabilities.length > 0) {
      baseState.activeCapability = storedCapability && baseState.availableCapabilities.includes(storedCapability)
        ? storedCapability
        : baseState.availableCapabilities[0];
    }
    
    // Auto-select first facility for staff
    if (baseState.isStaffWithFacility && baseState.activeCapability === 'staff') {
      const staffCapability = userContext.capabilities.staff;
      if (staffCapability && staffCapability.facilities.length > 0) {
        const primaryFacility = staffCapability.facilities.find(f => f.role_code.includes('primary')) || 
                               staffCapability.facilities[0];
        baseState.activeFacilityId = storedFacilityId 
          ? parseInt(storedFacilityId, 10)
          : primaryFacility.facility_id;
      }
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }

  return baseState;
};

const initialState: ActiveContextState = loadInitialState();

const activeContextSlice = createSlice({
  name: 'activeContext',
  initialState,
  reducers: {
    /**
     * Set complete user context (called after login/register)
     */
    setUserContext: (state, action: PayloadAction<UserContext>) => {
      const { user, capabilities, facility_roles } = action.payload;
      
      state.user = user;
      state.capabilities = capabilities;
      state.facilityRoles = facility_roles;
      
      // Extract available capabilities
      state.availableCapabilities = Object.keys(capabilities);
      
      // Set derived flags
      state.isPatient = Boolean(capabilities.patient);
      state.isStaff = Boolean(capabilities.staff);
      
      if (capabilities.staff) {
        const staffCapability = capabilities.staff;
        state.isStaffWithFacility = staffCapability.facilities.length > 0;
        state.isStaffWithoutFacility = staffCapability.facilities.length === 0;
        state.hasMultipleFacilities = staffCapability.facilities.length > 1;
      }
      
      state.isPatientOnly = Boolean(capabilities.patient && !capabilities.staff);
      
      // Auto-select first capability
      if (state.availableCapabilities.length > 0 && !state.activeCapability) {
        state.activeCapability = state.availableCapabilities[0];
      }
      
      // Auto-select first facility for staff
      if (state.isStaffWithFacility && state.activeCapability === 'staff') {
        const staffCapability = capabilities.staff;
        if (staffCapability && staffCapability.facilities.length > 0) {
          const primaryFacility = staffCapability.facilities.find(f => f.role_code.includes('primary')) || 
                                 staffCapability.facilities[0];
          state.activeFacilityId = primaryFacility.facility_id;
        }
      }
      
      // Persist to localStorage
      localStorage.setItem('userContext', JSON.stringify(action.payload));
      if (state.activeCapability) {
        localStorage.setItem('activeCapability', state.activeCapability);
      }
      if (state.activeFacilityId) {
        localStorage.setItem('activeFacilityId', state.activeFacilityId.toString());
      }
      
      state.error = null;
    },

    /**
     * Switch to a different capability
     */
    switchCapability: (state, action: PayloadAction<string>) => {
      const capability = action.payload;
      
      if (!state.availableCapabilities.includes(capability)) {
        state.error = `Capability "${capability}" not available`;
        return;
      }
      
      state.activeCapability = capability;
      
      // Reset facility if switching away from staff
      if (capability !== 'staff') {
        state.activeFacilityId = null;
        localStorage.removeItem('activeFacilityId');
      }
      
      // Auto-select first facility if switching to staff with facilities
      if (capability === 'staff' && state.isStaffWithFacility) {
        const staffCapability = state.capabilities.staff;
        if (staffCapability && staffCapability.facilities.length > 0) {
          const primaryFacility = staffCapability.facilities.find(f => f.role_code.includes('primary')) || 
                                 staffCapability.facilities[0];
          state.activeFacilityId = primaryFacility.facility_id;
          localStorage.setItem('activeFacilityId', state.activeFacilityId.toString());
        }
      }
      
      localStorage.setItem('activeCapability', capability);
      state.error = null;
    },

    /**
     * Switch to a different facility (staff only)
     */
    switchFacility: (state, action: PayloadAction<number>) => {
      if (state.activeCapability !== 'staff' || !state.isStaffWithFacility) {
        state.error = 'Not in staff capability or no facility assignments';
        return;
      }
      
      const staffCapability = state.capabilities.staff;
      if (!staffCapability) {
        state.error = 'Staff capability not found';
        return;
      }
      
      const facilityExists = staffCapability.facilities.some(f => f.facility_id === action.payload);
      if (!facilityExists) {
        state.error = 'Facility not found for current staff';
        return;
      }
      
      state.activeFacilityId = action.payload;
      localStorage.setItem('activeFacilityId', action.payload.toString());
      state.error = null;
    },

    /**
     * Clear active context (on logout)
     */
    clearActiveContext: (state) => {
      Object.assign(state, {
        user: null,
        capabilities: {},
        facilityRoles: [],
        activeCapability: null,
        activeFacilityId: null,
        availableCapabilities: [],
        isPatient: false,
        isStaff: false,
        isStaffWithFacility: false,
        isPatientOnly: false,
        isStaffWithoutFacility: false,
        hasMultipleFacilities: false,
        isLoading: false,
        error: null,
      });
      localStorage.removeItem('userContext');
      localStorage.removeItem('activeCapability');
      localStorage.removeItem('activeFacilityId');
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUserContext,
  switchCapability,
  switchFacility,
  clearActiveContext,
  setLoading,
  setError,
  clearError,
} = activeContextSlice.actions;

export default activeContextSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Type for Redux state with activeContext
 */
interface RootState {
  activeContext: ActiveContextState;
}

/**
 * Get accessible modules for current context
 */
export const selectAccessibleModules = (state: RootState): BackendModule[] => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (!activeCapability || !capabilities[activeCapability]) {
    return [];
  }
  
  const capability = capabilities[activeCapability];
  
  // Handle staff capability with facilities
  if (activeCapability === 'staff') {
    const staffCapability = capability as StaffCapability;
    
    if (staffCapability.facilities.length > 0) {
      // Staff with facilities
      if (activeFacilityId) {
        const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
        return facility?.modules?.filter(m => m.is_active) || [];
      }
      return [];
    } else {
      // Staff without facilities
      return staffCapability.modules?.filter(m => m.is_active) || [];
    }
  }
  
  // Handle patient or Spatie role
  const typedCapability = capability as PatientCapability | SpatieRoleCapability;
  return 'modules' in typedCapability ? typedCapability.modules.filter(m => m.is_active) : [];
};

/**
 * Get accessible module codes for current context
 */
export const selectAccessibleModuleCodes = (state: RootState): string[] => {
  const accessibleModules = selectAccessibleModules(state);
  return accessibleModules.map(module => module.code);
};

/**
 * Check if current context can access a specific module
 */
export const selectCanAccessModule = (moduleCode: string) => (state: RootState): boolean => {
  const accessibleCodes = selectAccessibleModuleCodes(state);
  return accessibleCodes.includes(moduleCode);
};

/**
 * Check if current context can access any of the required modules
 */
export const selectCanAccessAnyModule = (requiredModules?: string[]) => (state: RootState): boolean => {
  if (!requiredModules || requiredModules.length === 0) return true;
  const accessibleCodes = selectAccessibleModuleCodes(state);
  return requiredModules.some(module => accessibleCodes.includes(module));
};

/**
 * Get current capability display name
 */
export const selectCurrentCapabilityName = (state: RootState): string => {
  const { activeCapability } = state.activeContext;
  if (!activeCapability) return 'User';
  
  return getRoleDisplayName(activeCapability);
};

/**
 * Get active facility name (for staff with facilities)
 */
export const selectActiveFacilityName = (state: RootState): string | null => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (activeCapability !== 'staff' || !activeFacilityId) {
    return null;
  }
  
  const staffCapability = capabilities.staff as StaffCapability | undefined;
  if (!staffCapability) return null;
  
  const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  return facility?.facility_name || null;
};

/**
 * Get active role code (for staff with facilities)
 */
export const selectActiveRoleCode = (state: RootState): string | null => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (activeCapability !== 'staff' || !activeFacilityId) {
    return null;
  }
  
  const staffCapability = capabilities.staff as StaffCapability | undefined;
  if (!staffCapability) return null;
  
  const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  return facility?.role_code || null;
};

/**
 * Check if user is in patient mode
 */
export const selectIsPatientMode = (state: RootState): boolean => {
  return state.activeContext.activeCapability === 'patient';
};

/**
 * Get all facilities for current staff
 */
export const selectStaffFacilities = (state: RootState): StaffFacilityAssignment[] => {
  const { capabilities, activeCapability } = state.activeContext;
  
  if (activeCapability !== 'staff') return [];
  
  const staffCapability = capabilities.staff as StaffCapability | undefined;
  return staffCapability?.facilities || [];
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert role/capability code to human-readable display name
 * This is the missing function that was causing the error
 */
export const getRoleDisplayName = (roleCode: string): string => {
  const displayNames: Record<string, string> = {
    patient: 'Patient',
    staff: 'Staff',
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    regulator: 'Regulator',
    auditor: 'Auditor',
    doctor: 'Doctor',
    nurse: 'Nurse',
    pharmacist: 'Pharmacist',
    lab_technician: 'Lab Technician',
    receptionist: 'Receptionist',
    billing_clerk: 'Billing Clerk',
    system_admin: 'System Administrator',
    facility_admin: 'Facility Administrator',
  };
  
  // Return mapped name or format the code nicely
  return displayNames[roleCode] || roleCode
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get capability display name (alias for getRoleDisplayName)
 */
export const getCapabilityDisplayName = getRoleDisplayName;

/**
 * Format facility role code for display
 */
export const formatRoleCode = (roleCode: string): string => {
  return getRoleDisplayName(roleCode);
};

/**
 * Get facility role from facility ID and role code
 */
export const getFacilityRole = (facilityId: number, roleCode: string) => 
  (state: RootState): FacilityRole | undefined => {
    return state.activeContext.facilityRoles.find(
      role => role.facility_id === facilityId && role.role_code === roleCode
    );
  };

/**
 * Check if user is in staff mode
 */
export const selectIsStaffMode = (state: RootState): boolean => {
  return state.activeContext.activeCapability === 'staff';
};

/**
 * Check if user is in admin mode
 */
export const selectIsAdminMode = (state: RootState): boolean => {
  const { activeCapability } = state.activeContext;
  return ['super_admin', 'admin', 'system_admin', 'facility_administrator'].includes(activeCapability || '');
};

/**
 * Get staff profile data
 */
export const selectStaffProfile = (state: RootState): StaffCapability | null => {
  const { capabilities } = state.activeContext;
  return capabilities.staff || null;
};

/**
 * Get patient profile data
 */
export const selectPatientProfile = (state: RootState): PatientCapability | null => {
  const { capabilities } = state.activeContext;
  return capabilities.patient || null;
};