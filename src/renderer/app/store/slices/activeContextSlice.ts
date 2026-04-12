// store/slices/activeContextSlice.ts
import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import { FacilityType, OperationalStatus } from '../../../modules/medical-records/api/facility/FacilityTypes';

// ============================================================================
// TYPES
// ============================================================================

/** Module from backend */
export interface BackendModule {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

/** Patient capability from backend */
export interface PatientCapability {
  patient_id: number;
  patient_uuid: string;
  primary_facility_id: number | null;
  medical_record_number?: string;
  modules: BackendModule[];
}
// In activeContextSlice.ts, update the StaffFacilityAssignment interface:

export interface StaffFacilityAssignment {
  facility_id: number;
  facility_name: string;
  facility_code: string;
  role_code: string;
  modules: BackendModule[];
  
  // Core Identity
  legal_entity_name?: string | null;
  health_system_name?: string | null;
  
  // Classification
  nature_of_facility?: string | null;
  facility_type?: FacilityType | null;
  facility_tier?: string | null;
  
  // Capacity
  bed_capacity?: number | null;
  available_services?: string[];
  specialty_services?: string[];
  equipment_inventory_summary?: string[];
  
  // Location
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  
  // Contact
  main_phone?: string | null;
  emergency_phone?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;
  
  // Operations
  operating_hours?: any;
  emergency_services_hours?: any;
  is_24_7?: boolean | null;
  operational_status?: OperationalStatus | null;
  average_wait_time_minutes?: number | null;
  monthly_patient_volume?: number | null;
  
  // Licensing
  license_number?: string | null;
  license_issuing_authority?: string | null;
  license_expiry_date?: string | null;
  regulatory_identifiers?: any[];
  participates_in_medicare?: boolean | null;
  participates_in_medicaid?: boolean | null;
  
  // Clinical Capabilities
  has_emergency_department?: boolean | null;
  has_trauma_center?: boolean | null;
  trauma_center_level?: number | null;
  has_intensive_care?: boolean | null;
  has_neonatal_icu?: boolean | null;
  has_cardiac_cath_lab?: boolean | null;
  
  // Financial Configuration
  facility_currency?: string | null;
  tax_enabled?: boolean | number | null;
  tax_name?: string | null;
  tax_rate?: number | null;
  
  // Branding
  facility_logo_path?: string | null;
  primary_brand_color?: string | null;
  secondary_brand_color?: string | null;
  
  // System Configuration
  timezone?: string | null;
  data_residency_region?: string | null;
}

/** Staff capability from backend */
export interface StaffCapability {
  staff_id: number;
  staff_uuid: string;
  employee_id: string | null;
  professional_title?: string;
  facilities: StaffFacilityAssignment[];
  modules?: BackendModule[]; // Only for staff without facilities
}

/** Spatie role capability from backend */
export interface SpatieRoleCapability {
  modules: BackendModule[];
}

/** User capabilities from backend */
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
  profile_photo_path: string | null;

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

/** Facility role for legacy support */
export interface FacilityRole {
  facility_id: number;
  facility_name: string | null;
  staff_id: number;
  role_code: string;
  is_primary_facility: boolean;
}

/** Complete user context from backend */
export interface UserContext {
  user: MinimalUser;
  capabilities: UserCapabilities;
  facility_roles: FacilityRole[];
}

// ============================================================================
// STATE
// ============================================================================

interface ActiveContextState {
  // Core user data
  user: MinimalUser | null;
  capabilities: UserCapabilities;
  facilityRoles: FacilityRole[];

  // Active selections
  activeCapability: string | null;
  activeFacilityId: number | null;

  // Derived state
  availableCapabilities: string[];
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

// ============================================================================
// INITIAL STATE
// ============================================================================

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
    const persistedUserContext = localStorage.getItem('userContext');
    if (!persistedUserContext) return baseState;

    const userContext: UserContext = JSON.parse(persistedUserContext);

    baseState.user = userContext.user;
    baseState.capabilities = userContext.capabilities;
    baseState.facilityRoles = userContext.facility_roles;

    baseState.availableCapabilities = Object.keys(userContext.capabilities);

    baseState.isPatient = Boolean(userContext.capabilities.patient);
    baseState.isStaff = Boolean(userContext.capabilities.staff);

    if (userContext.capabilities.staff) {
      const staffCapability = userContext.capabilities.staff;
      baseState.isStaffWithFacility = staffCapability.facilities.length > 0;
      baseState.isStaffWithoutFacility = staffCapability.facilities.length === 0;
      baseState.hasMultipleFacilities = staffCapability.facilities.length > 1;
    }

    baseState.isPatientOnly = Boolean(userContext.capabilities.patient && !userContext.capabilities.staff);

    const storedCapability = localStorage.getItem('activeCapability');
    const storedFacilityId = localStorage.getItem('activeFacilityId');

    if (baseState.availableCapabilities.length > 0) {
      baseState.activeCapability =
        storedCapability && baseState.availableCapabilities.includes(storedCapability)
          ? storedCapability
          : baseState.availableCapabilities[0];
    }

    if (baseState.isStaffWithFacility && baseState.activeCapability === 'staff') {
      const staffCapability = userContext.capabilities.staff;
      if (staffCapability && staffCapability.facilities.length > 0) {
        const primaryFacility =
          staffCapability.facilities.find(f => f.role_code.includes('primary')) ??
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

// ============================================================================
// SLICE
// ============================================================================

const activeContextSlice = createSlice({
  name: 'activeContext',
  initialState,
  reducers: {
    /** Set complete user context (called after login/register) */
    setUserContext: (state, action: PayloadAction<UserContext>) => {
      const { user, capabilities, facility_roles } = action.payload;

      state.user = user;
      state.capabilities = capabilities;
      state.facilityRoles = facility_roles;

      state.availableCapabilities = Object.keys(capabilities);

      state.isPatient = Boolean(capabilities.patient);
      state.isStaff = Boolean(capabilities.staff);

      if (capabilities.staff) {
        const staffCapability = capabilities.staff;
        state.isStaffWithFacility = staffCapability.facilities.length > 0;
        state.isStaffWithoutFacility = staffCapability.facilities.length === 0;
        state.hasMultipleFacilities = staffCapability.facilities.length > 1;
      }

      state.isPatientOnly = Boolean(capabilities.patient && !capabilities.staff);

      if (state.availableCapabilities.length > 0 && !state.activeCapability) {
        state.activeCapability = state.availableCapabilities[0];
      }

      if (state.isStaffWithFacility && state.activeCapability === 'staff') {
        const staffCapability = capabilities.staff;
        if (staffCapability && staffCapability.facilities.length > 0) {
          const primaryFacility =
            staffCapability.facilities.find(f => f.role_code.includes('primary')) ??
            staffCapability.facilities[0];
          state.activeFacilityId = primaryFacility.facility_id;
        }
      }

      localStorage.setItem('userContext', JSON.stringify(action.payload));
      if (state.activeCapability) {
        localStorage.setItem('activeCapability', state.activeCapability);
      }
      if (state.activeFacilityId) {
        localStorage.setItem('activeFacilityId', state.activeFacilityId.toString());
      }

      state.error = null;
    },

    /** Switch to a different capability */
    switchCapability: (state, action: PayloadAction<string>) => {
      const capability = action.payload;

      if (!state.availableCapabilities.includes(capability)) {
        state.error = `Capability "${capability}" not available`;
        return;
      }

      state.activeCapability = capability;

      if (capability !== 'staff') {
        state.activeFacilityId = null;
        localStorage.removeItem('activeFacilityId');
      }

      if (capability === 'staff' && state.isStaffWithFacility) {
        const staffCapability = state.capabilities.staff;
        if (staffCapability && staffCapability.facilities.length > 0) {
          const primaryFacility =
            staffCapability.facilities.find(f => f.role_code.includes('primary')) ??
            staffCapability.facilities[0];
          state.activeFacilityId = primaryFacility.facility_id;
          localStorage.setItem('activeFacilityId', state.activeFacilityId.toString());
        }
      }

      localStorage.setItem('activeCapability', capability);
      state.error = null;
    },

    /** Switch to a different facility (staff only) */
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

      const facilityExists = staffCapability.facilities.some(
        f => f.facility_id === action.payload,
      );
      if (!facilityExists) {
        state.error = 'Facility not found for current staff';
        return;
      }

      state.activeFacilityId = action.payload;
      localStorage.setItem('activeFacilityId', action.payload.toString());
      state.error = null;
    },

    /** Clear active context (on logout) */
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

    /** Set loading state */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /** Set error */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    /** Clear error */
    clearError: (state) => {
      state.error = null;
    },

    // ============================================================================
    // NEW FACILITY CONFIGURATION SETTERS
    // ============================================================================

    /** Update facility currency for the active facility */
    updateActiveFacilityCurrency: (state, action: PayloadAction<string | null>) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) {
        state.error = 'Staff capability not found';
        return;
      }

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        facility.facility_currency = action.payload;
        // Persist to localStorage
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update facility logo path for the active facility */
    updateActiveFacilityLogoPath: (state, action: PayloadAction<string | null>) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) return;

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        facility.facility_logo_path = action.payload;
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update tax enabled status for the active facility */
    updateActiveFacilityTaxEnabled: (state, action: PayloadAction<boolean | number | null>) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) return;

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        facility.tax_enabled = action.payload;
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update primary brand color for the active facility */
    updateActiveFacilityPrimaryBrandColor: (state, action: PayloadAction<string | null>) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) return;

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        facility.primary_brand_color = action.payload;
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update secondary brand color for the active facility */
    updateActiveFacilitySecondaryBrandColor: (state, action: PayloadAction<string | null>) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) return;

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        facility.secondary_brand_color = action.payload;
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update multiple facility config values at once for the active facility */
    updateActiveFacilityConfig: (
      state,
      action: PayloadAction<Partial<Omit<StaffFacilityAssignment, 'facility_id' | 'facility_name' | 'role_code' | 'modules'>>>
    ) => {
      if (state.activeCapability !== 'staff' || !state.activeFacilityId) {
        state.error = 'Not in staff mode or no active facility';
        return;
      }

      const staffCapability = state.capabilities.staff;
      if (!staffCapability) return;

      const facility = staffCapability.facilities.find(
        f => f.facility_id === state.activeFacilityId
      );
      
      if (facility) {
        Object.assign(facility, action.payload);
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },

    /** Update a specific facility by ID (for bulk updates) */
    updateFacilityById: (
      state,
      action: PayloadAction<{ facilityId: number; updates: Partial<StaffFacilityAssignment> }>
    ) => {
      const { facilityId, updates } = action.payload;
      
      const staffCapability = state.capabilities.staff;
      if (!staffCapability) {
        state.error = 'Staff capability not found';
        return;
      }

      const facility = staffCapability.facilities.find(
        f => f.facility_id === facilityId
      );
      
      if (facility) {
        Object.assign(facility, updates);
        localStorage.setItem('userContext', JSON.stringify({
          user: state.user,
          capabilities: state.capabilities,
          facility_roles: state.facilityRoles,
        }));
      }
    },
  },
});

// Export all actions
export const {
  setUserContext,
  switchCapability,
  switchFacility,
  clearActiveContext,
  setLoading,
  setError,
  clearError,
  updateActiveFacilityCurrency,
  updateActiveFacilityLogoPath,
  updateActiveFacilityTaxEnabled,
  updateActiveFacilityPrimaryBrandColor,
  updateActiveFacilitySecondaryBrandColor,
  updateActiveFacilityConfig,
  updateFacilityById,
} = activeContextSlice.actions;

export default activeContextSlice.reducer;

// ============================================================================
// UTILITY FUNCTIONS
// (pure functions — no state dependency, no memoization needed)
// ============================================================================

/** Convert role/capability code to a human-readable display name */
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

  return (
    displayNames[roleCode] ??
    roleCode
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

/** Alias for getRoleDisplayName */
export const getCapabilityDisplayName = getRoleDisplayName;

/** Format a facility role code for display */
export const formatRoleCode = (roleCode: string): string => getRoleDisplayName(roleCode);

// ============================================================================
// TYPES FOR SELECTORS
// ============================================================================

/** Type for Redux state with activeContext */
export interface RootState {
  activeContext: ActiveContextState;
}

// ============================================================================
// BASE (INPUT) SELECTORS
// These are plain property-access functions — no memoization needed.
// They are kept private so consumers always go through the memoized selectors.
// ============================================================================

const selectActiveCapability = (state: RootState) => state.activeContext.activeCapability;
const selectCapabilities    = (state: RootState) => state.activeContext.capabilities;
const selectActiveFacilityId = (state: RootState) => state.activeContext.activeFacilityId;
const selectFacilityRoles   = (state: RootState) => state.activeContext.facilityRoles;

// ============================================================================
// MEMOIZED SELECTORS
// All derived data goes through createSelector so referential equality
// is preserved and downstream React components / hooks skip needless re-renders.
// ============================================================================

/**
 * Returns every active BackendModule visible in the current capability + facility context.
 * Re-runs only when activeCapability, capabilities, or activeFacilityId change.
 */
export const selectAccessibleModules = createSelector(
  [selectActiveCapability, selectCapabilities, selectActiveFacilityId],
  (activeCapability, capabilities, activeFacilityId): BackendModule[] => {
    if (!activeCapability || !capabilities[activeCapability]) return [];

    const capability = capabilities[activeCapability];

    if (activeCapability === 'staff') {
      const staffCapability = capability as StaffCapability;

      if (staffCapability.facilities.length > 0) {
        // Staff with facilities — scope to the selected facility
        if (!activeFacilityId) return [];
        const facility = staffCapability.facilities.find(
          f => f.facility_id === activeFacilityId,
        );
        return facility?.modules?.filter(m => m.is_active) ?? [];
      }

      // Staff without any facility assignment
      return staffCapability.modules?.filter(m => m.is_active) ?? [];
    }

    // Patient or Spatie role
    const typedCapability = capability as PatientCapability | SpatieRoleCapability;
    return 'modules' in typedCapability
      ? typedCapability.modules.filter(m => m.is_active)
      : [];
  },
);

/**
 * Returns the string codes of all accessible modules.
 * Derived from selectAccessibleModules — re-runs only when that result changes.
 */
export const selectAccessibleModuleCodes = createSelector(
  [selectAccessibleModules],
  (modules): string[] => modules.map(m => m.code),
);

/**
 * Returns true when the given moduleCode is accessible in the current context.
 *
 * Usage (RTK / reselect v5 standard — param passed as second argument):
 *   const canAccess = useAppSelector(state => selectCanAccessModule(state, 'BILLING'));
 *
 * ⚠️  Breaking change from the original API:
 *   Before: selectCanAccessModule('BILLING')(state)
 *   After:  selectCanAccessModule(state, 'BILLING')
 */
export const selectCanAccessModule = createSelector(
  [
    selectAccessibleModuleCodes,
    (_state: RootState, moduleCode: string) => moduleCode,
  ],
  (codes, moduleCode): boolean => codes.includes(moduleCode),
);

/**
 * Returns true when at least one of the requiredModules is accessible,
 * or when no modules are required at all.
 *
 * Usage:
 *   const ok = useAppSelector(state => selectCanAccessAnyModule(state, ['MOD_A', 'MOD_B']));
 *
 * ⚠️  Breaking change from the original API:
 *   Before: selectCanAccessAnyModule(['MOD_A'])(state)
 *   After:  selectCanAccessAnyModule(state, ['MOD_A'])
 */
export const selectCanAccessAnyModule = createSelector(
  [
    selectAccessibleModuleCodes,
    (_state: RootState, requiredModules: string[] | undefined) => requiredModules,
  ],
  (codes, requiredModules): boolean => {
    if (!requiredModules || requiredModules.length === 0) return true;
    return requiredModules.some(mod => codes.includes(mod));
  },
);

/**
 * Returns the human-readable display name for the currently active capability.
 */
export const selectCurrentCapabilityName = createSelector(
  [selectActiveCapability],
  (activeCapability): string =>
    activeCapability ? getRoleDisplayName(activeCapability) : 'User',
);

/**
 * Returns the facility_name of the currently selected facility (staff only).
 */
export const selectActiveFacilityName = createSelector(
  [selectActiveCapability, selectCapabilities, selectActiveFacilityId],
  (activeCapability, capabilities, activeFacilityId): string | null => {
    if (activeCapability !== 'staff' || !activeFacilityId) return null;
    const staffCapability = capabilities.staff;
    if (!staffCapability) return null;
    return (
      staffCapability.facilities.find(f => f.facility_id === activeFacilityId)
        ?.facility_name ?? null
    );
  },
);

/**
 * Returns the role_code of the currently selected facility (staff only).
 */
export const selectActiveRoleCode = createSelector(
  [selectActiveCapability, selectCapabilities, selectActiveFacilityId],
  (activeCapability, capabilities, activeFacilityId): string | null => {
    if (activeCapability !== 'staff' || !activeFacilityId) return null;
    const staffCapability = capabilities.staff;
    if (!staffCapability) return null;
    return (
      staffCapability.facilities.find(f => f.facility_id === activeFacilityId)
        ?.role_code ?? null
    );
  },
);

/** Returns true when the active capability is 'patient'. */
export const selectIsPatientMode = createSelector(
  [selectActiveCapability],
  (activeCapability): boolean => activeCapability === 'patient',
);

/** Returns true when the active capability is 'staff'. */
export const selectIsStaffMode = createSelector(
  [selectActiveCapability],
  (activeCapability): boolean => activeCapability === 'staff',
);

/** Returns true when the active capability is any administrative role. */
export const selectIsAdminMode = createSelector(
  [selectActiveCapability],
  (activeCapability): boolean =>
    ['super_admin', 'admin', 'system_admin', 'facility_administrator'].includes(
      activeCapability ?? '',
    ),
);

/**
 * Returns all facility assignments for the current staff member,
 * or an empty array when not in staff mode.
 */
export const selectStaffFacilities = createSelector(
  [selectActiveCapability, selectCapabilities],
  (activeCapability, capabilities): StaffFacilityAssignment[] => {
    if (activeCapability !== 'staff') return [];
    return capabilities.staff?.facilities ?? [];
  },
);

/**
 * Returns the currently selected facility assignment (staff only).
 * Includes all facility configuration fields.
 */
export const selectActiveFacility = createSelector(
  [selectActiveCapability, selectCapabilities, selectActiveFacilityId],
  (activeCapability, capabilities, activeFacilityId): StaffFacilityAssignment | null => {
    if (activeCapability !== 'staff' || !activeFacilityId) return null;
    const staffCapability = capabilities.staff;
    if (!staffCapability) return null;
    return staffCapability.facilities.find(f => f.facility_id === activeFacilityId) ?? null;
  },
);

/**
 * Returns the facility_currency of the currently selected facility.
 * Returns null if not in staff mode or no facility selected.
 */
export const selectActiveFacilityCurrency = createSelector(
  [selectActiveFacility],
  (activeFacility): string | null | undefined => activeFacility?.facility_currency,
);

/**
 * Returns the facility_logo_path of the currently selected facility.
 * Returns null if not in staff mode or no facility selected.
 */
export const selectActiveFacilityLogoPath = createSelector(
  [selectActiveFacility],
  (activeFacility): string | null | undefined => activeFacility?.facility_logo_path,
);

/**
 * Returns the tax_enabled status of the currently selected facility.
 * Returns null if not in staff mode or no facility selected.
 */
export const selectActiveFacilityTaxEnabled = createSelector(
  [selectActiveFacility],
  (activeFacility): boolean | number | null | undefined => activeFacility?.tax_enabled,
);

/**
 * Returns the primary_brand_color of the currently selected facility.
 * Returns null if not in staff mode or no facility selected.
 */
export const selectActiveFacilityPrimaryBrandColor = createSelector(
  [selectActiveFacility],
  (activeFacility): string | null | undefined => activeFacility?.primary_brand_color,
);

/**
 * Returns the secondary_brand_color of the currently selected facility.
 * Returns null if not in staff mode or no facility selected.
 */
export const selectActiveFacilitySecondaryBrandColor = createSelector(
  [selectActiveFacility],
  (activeFacility): string | null | undefined => activeFacility?.secondary_brand_color,
);

/**
 * Returns the complete facility configuration object for the active facility.
 * Useful for theme providers or facility context providers.
 */
export const selectActiveFacilityConfig = createSelector(
  [selectActiveFacility],
  (activeFacility): Partial<StaffFacilityAssignment> | null => {
    if (!activeFacility) return null;
    return {
      facility_currency: activeFacility.facility_currency,
      facility_logo_path: activeFacility.facility_logo_path,
      tax_enabled: activeFacility.tax_enabled,
      primary_brand_color: activeFacility.primary_brand_color,
      secondary_brand_color: activeFacility.secondary_brand_color,
    };
  },
);

/** Returns the full StaffCapability object, or null if not present. */
export const selectStaffProfile = createSelector(
  [selectCapabilities],
  (capabilities): StaffCapability | null => capabilities.staff ?? null,
);

/** Returns the full PatientCapability object, or null if not present. */
export const selectPatientProfile = createSelector(
  [selectCapabilities],
  (capabilities): PatientCapability | null => capabilities.patient ?? null,
);

/**
 * Looks up a single FacilityRole by facilityId + roleCode.
 *
 * Usage:
 *   const role = useAppSelector(state => selectFacilityRole(state, facilityId, roleCode));
 *
 * ⚠️  Breaking change from the original API (was getFacilityRole):
 *   Before: getFacilityRole(facilityId, roleCode)(state)
 *   After:  selectFacilityRole(state, facilityId, roleCode)
 *
 * The selector is also renamed to follow the select* convention.
 */
export const selectFacilityRole = createSelector(
  [
    selectFacilityRoles,
    (_state: RootState, facilityId: number) => facilityId,
    (_state: RootState, _facilityId: number, roleCode: string) => roleCode,
  ],
  (facilityRoles, facilityId, roleCode): FacilityRole | undefined =>
    facilityRoles.find(
      role => role.facility_id === facilityId && role.role_code === roleCode,
    ),
);