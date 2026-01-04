// store/slices/activeContextSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Role codes from backend facility_staff_roles table
 */
export type RoleCode =
  | 'physician'
  | 'surgeon'
  | 'anesthesiologist'
  | 'nurse'
  | 'nurse_manager'
  | 'pharmacist'
  | 'pharmacy_technician'
  | 'radiologist'
  | 'radiology_technician'
  | 'laboratory_scientist'
  | 'respiratory_therapist'
  | 'physical_therapist'
  | 'occupational_therapist'
  | 'social_worker'
  | 'case_manager'
  | 'medical_assistant'
  | 'receptionist'
  | 'facility_administrator'
  | 'department_manager'
  | 'quality_coordinator'
  | 'infection_control'
  | 'it_support';

/**
 * Minimal user info from backend
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
}

/**
 * Patient capability
 */
export interface PatientCapability {
  patient_id: number;
  primary_facility_id: number | null;
}

/**
 * Staff capability (without facility assignment)
 */
export interface StaffCapability {
  staff_id: number;
  employee_id: string | null;
}

/**
 * User capabilities (patient/staff)
 */
export interface UserCapabilities {
  patient?: PatientCapability;
  staff?: StaffCapability;
}

/**
 * Facility role assignment (only for staff with facility)
 */
export interface FacilityRole {
  facility_id: number;
  facility_name: string | null;
  staff_id: number;
  role_code: RoleCode;
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
  
  // Active selections (null if patient-only or staff without facility)
  activeFacilityId: number | null;
  activeRoleCode: RoleCode | null;
  
  // Derived state
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
    activeFacilityId: null,
    activeRoleCode: null,
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
    if (persistedUserContext) {
      const userContext: UserContext = JSON.parse(persistedUserContext);
      
      baseState.user = userContext.user;
      baseState.capabilities = userContext.capabilities;
      baseState.facilityRoles = userContext.facility_roles;
      
      // Set derived flags
      baseState.isPatient = !!userContext.capabilities.patient;
      baseState.isStaff = !!userContext.capabilities.staff;
      baseState.isStaffWithFacility = !!userContext.capabilities.staff && userContext.facility_roles.length > 0;
      baseState.isStaffWithoutFacility = !!userContext.capabilities.staff && userContext.facility_roles.length === 0;
      baseState.isPatientOnly = !!userContext.capabilities.patient && !userContext.capabilities.staff;
      baseState.hasMultipleFacilities = userContext.facility_roles.length > 1;
    }

    // Load active facility and role
    const storedFacilityId = localStorage.getItem('activeFacilityId');
    const storedRoleCode = localStorage.getItem('activeRoleCode');
    
    if (storedFacilityId) {
      baseState.activeFacilityId = parseInt(storedFacilityId, 10);
    }
    
    if (storedRoleCode && isValidRoleCode(storedRoleCode)) {
      baseState.activeRoleCode = storedRoleCode as RoleCode;
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    // Return base state if there's an error
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
      
      // Set derived flags
      state.isPatient = !!capabilities.patient;
      state.isStaff = !!capabilities.staff;
      state.isStaffWithFacility = !!capabilities.staff && facility_roles.length > 0;
      state.isStaffWithoutFacility = !!capabilities.staff && facility_roles.length === 0;
      state.isPatientOnly = !!capabilities.patient && !capabilities.staff;
      state.hasMultipleFacilities = facility_roles.length > 1;
      
      // Persist user context to localStorage
      localStorage.setItem('userContext', JSON.stringify(action.payload));
      
      // Auto-select active context based on user type
      if (facility_roles.length > 0) {
        // Staff with facility: select primary or first facility role
        const primaryRole = facility_roles.find(role => role.is_primary_facility);
        const defaultRole = primaryRole || facility_roles[0];
        
        state.activeFacilityId = defaultRole.facility_id;
        state.activeRoleCode = defaultRole.role_code;
        
        // Persist to localStorage
        localStorage.setItem('activeFacilityId', defaultRole.facility_id.toString());
        localStorage.setItem('activeRoleCode', defaultRole.role_code);
      } else if (capabilities.patient && !capabilities.staff) {
        // Patient-only: set facility but no role code
        state.activeFacilityId = capabilities.patient.primary_facility_id;
        state.activeRoleCode = null;
        
        if (capabilities.patient.primary_facility_id) {
          localStorage.setItem('activeFacilityId', capabilities.patient.primary_facility_id.toString());
        }
        localStorage.removeItem('activeRoleCode');
      } else if (capabilities.staff && facility_roles.length === 0) {
        // Staff without facility: no active context
        state.activeFacilityId = null;
        state.activeRoleCode = null;
        
        localStorage.removeItem('activeFacilityId');
        localStorage.removeItem('activeRoleCode');
      }
      
      state.error = null;
    },

    /**
     * Switch to a different facility role (staff only)
     */
    switchFacilityRole: (state, action: PayloadAction<{ facilityId: number; roleCode: RoleCode }>) => {
      const { facilityId, roleCode } = action.payload;
      
      if (!state.isStaffWithFacility) {
        state.error = 'User is not staff with facility assignment';
        return;
      }
      
      const role = state.facilityRoles.find(
        r => r.facility_id === facilityId && r.role_code === roleCode
      );
      
      if (role) {
        state.activeFacilityId = facilityId;
        state.activeRoleCode = roleCode;
        state.error = null;
        
        // Persist to localStorage
        localStorage.setItem('activeFacilityId', facilityId.toString());
        localStorage.setItem('activeRoleCode', roleCode);
      } else {
        state.error = 'Role not found for this facility';
      }
    },

    /**
     * Switch to patient mode (if user has patient capability)
     */
    switchToPatientMode: (state) => {
      if (!state.capabilities.patient) {
        state.error = 'User does not have patient capability';
        return;
      }
      
      state.activeFacilityId = state.capabilities.patient.primary_facility_id;
      state.activeRoleCode = null;
      
      // Persist to localStorage
      if (state.capabilities.patient.primary_facility_id) {
        localStorage.setItem('activeFacilityId', state.capabilities.patient.primary_facility_id.toString());
      } else {
        localStorage.removeItem('activeFacilityId');
      }
      localStorage.removeItem('activeRoleCode');
      
      state.error = null;
    },

    /**
     * Initialize context from localStorage (legacy support - now handled in loadInitialState)
     */
    initializeActiveContext: (state) => {
      const storedFacilityId = localStorage.getItem('activeFacilityId');
      const storedRoleCode = localStorage.getItem('activeRoleCode');
      
      if (storedFacilityId && storedRoleCode && state.facilityRoles.length > 0) {
        const facilityId = parseInt(storedFacilityId, 10);
        const role = state.facilityRoles.find(
          r => r.facility_id === facilityId && r.role_code === storedRoleCode
        );
        
        if (role) {
          state.activeFacilityId = facilityId;
          state.activeRoleCode = storedRoleCode as RoleCode;
        }
      } else if (storedFacilityId && !storedRoleCode && state.isPatient) {
        state.activeFacilityId = parseInt(storedFacilityId, 10);
        state.activeRoleCode = null;
      }
    },

    /**
     * Clear active context (on logout)
     */
    clearActiveContext: (state) => {
      Object.assign(state, {
        user: null,
        capabilities: {},
        facilityRoles: [],
        activeFacilityId: null,
        activeRoleCode: null,
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
      localStorage.removeItem('activeFacilityId');
      localStorage.removeItem('activeRoleCode');
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
  switchFacilityRole,
  switchToPatientMode,
  initializeActiveContext,
  clearActiveContext,
  setLoading,
  setError,
  clearError,
} = activeContextSlice.actions;

export default activeContextSlice.reducer;

/**
 * Type guard for checking if roleCode is valid
 */
export const isValidRoleCode = (code: string | null): code is RoleCode => {
  if (!code) return false;
  const validRoles: RoleCode[] = [
    'physician', 'surgeon', 'anesthesiologist', 'nurse', 'nurse_manager',
    'pharmacist', 'pharmacy_technician', 'radiologist', 'radiology_technician',
    'laboratory_scientist', 'respiratory_therapist', 'physical_therapist',
    'occupational_therapist', 'social_worker', 'case_manager', 'medical_assistant',
    'receptionist', 'facility_administrator', 'department_manager',
    'quality_coordinator', 'infection_control', 'it_support'
  ];
  return validRoles.includes(code as RoleCode);
};

/**
 * Role-based module permissions
 */
const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  // Clinical Roles
  physician: ['clinical', 'prescriptions', 'lab', 'radiology', 'billing', 'reports', 'encounters'],
  surgeon: ['clinical', 'prescriptions', 'lab', 'radiology', 'billing', 'operating_room', 'encounters'],
  anesthesiologist: ['clinical', 'prescriptions', 'operating_room', 'reports', 'encounters'],
  nurse: ['clinical', 'prescriptions', 'lab', 'vitals', 'medication_administration', 'encounters'],
  nurse_manager: ['clinical', 'prescriptions', 'lab', 'staff_management', 'scheduling', 'reports', 'encounters'],
  
  // Pharmacy
  pharmacist: ['pharmacy', 'prescriptions', 'medication_dispensing', 'drug_interactions', 'billing'],
  pharmacy_technician: ['pharmacy', 'medication_dispensing', 'inventory'],
  
  // Radiology
  radiologist: ['radiology', 'imaging', 'reports', 'clinical'],
  radiology_technician: ['radiology', 'imaging', 'scheduling'],
  
  // Laboratory
  laboratory_scientist: ['lab', 'lab_results', 'reports', 'quality_control'],
  
  // Therapy & Rehabilitation
  respiratory_therapist: ['clinical', 'respiratory_therapy', 'reports', 'encounters'],
  physical_therapist: ['physical_therapy', 'rehabilitation', 'reports', 'encounters'],
  occupational_therapist: ['occupational_therapy', 'rehabilitation', 'reports', 'encounters'],
  
  // Support Services
  social_worker: ['social_services', 'patient_support', 'discharge_planning', 'reports', 'encounters'],
  case_manager: ['case_management', 'care_coordination', 'discharge_planning', 'reports', 'encounters'],
  medical_assistant: ['clinical', 'vitals', 'scheduling', 'patient_intake', 'encounters'],
  
  // Administrative
  receptionist: ['scheduling', 'appointments', 'registration', 'billing', 'front_desk'],
  facility_administrator: ['admin', 'staff_management', 'facility_settings', 'reports', 'billing', 'compliance', 'all_modules'],
  department_manager: ['department_management', 'staff_management', 'scheduling', 'reports', 'inventory'],
  
  // Quality & Safety
  quality_coordinator: ['quality_assurance', 'compliance', 'reports', 'audits'],
  infection_control: ['infection_control', 'compliance', 'reports', 'outbreak_management'],
  
  // IT
  it_support: ['system_admin', 'user_management', 'technical_support', 'reports'],
};

/**
 * Patient-accessible modules
 */
const PATIENT_MODULES = ['appointments', 'medical_records', 'prescriptions', 'billing', 'patient_portal', 'messages'];

/**
 * Selectors
 */
export const selectActiveRole = (state: { activeContext: ActiveContextState }): FacilityRole | null => {
  if (!state.activeContext.activeFacilityId || !state.activeContext.activeRoleCode) {
    return null;
  }
  
  return state.activeContext.facilityRoles.find(
    role => role.facility_id === state.activeContext.activeFacilityId &&
            role.role_code === state.activeContext.activeRoleCode
  ) || null;
};

/**
 * Check if user can access specific module based on role
 * FIXED: Properly handles null roleCode
 */
export const selectCanAccessModule = (module: string) => (state: { activeContext: ActiveContextState }): boolean => {
  const { activeRoleCode, isPatient, isStaffWithoutFacility } = state.activeContext;
  
  // Patient-only users (no role_code)
  if (!activeRoleCode && isPatient) {
    return PATIENT_MODULES.includes(module);
  }
  
  // Staff without facility (no role_code)
  if (!activeRoleCode && isStaffWithoutFacility) {
    return false;
  }
  
  // Staff with facility and valid role code
  if (activeRoleCode && isValidRoleCode(activeRoleCode)) {
    const permissions = ROLE_PERMISSIONS[activeRoleCode];
    return permissions?.includes(module) || permissions?.includes('all_modules') || false;
  }
  
  return false;
};

/**
 * Get user type for UI routing/display
 */
export const selectUserType = (state: { activeContext: ActiveContextState }): 'patient' | 'staff' | 'staff_no_facility' | 'unknown' => {
  if (state.activeContext.isStaffWithFacility) return 'staff';
  if (state.activeContext.isStaffWithoutFacility) return 'staff_no_facility';
  if (state.activeContext.isPatientOnly) return 'patient';
  return 'unknown';
};

/**
 * Check if user is in patient mode
 */
export const selectIsPatientMode = (state: { activeContext: ActiveContextState }): boolean => {
  return state.activeContext.isPatient && !state.activeContext.activeRoleCode;
};

/**
 * Get human-readable role name
 * FIXED: Properly handles null roleCode
 */
export const getRoleDisplayName = (roleCode: RoleCode | null): string => {
  if (!roleCode) return 'Patient';
  
  const roleNames: Record<RoleCode, string> = {
    physician: 'Physician',
    surgeon: 'Surgeon',
    anesthesiologist: 'Anesthesiologist',
    nurse: 'Nurse',
    nurse_manager: 'Nurse Manager',
    pharmacist: 'Pharmacist',
    pharmacy_technician: 'Pharmacy Technician',
    radiologist: 'Radiologist',
    radiology_technician: 'Radiology Technician',
    laboratory_scientist: 'Laboratory Scientist',
    respiratory_therapist: 'Respiratory Therapist',
    physical_therapist: 'Physical Therapist',
    occupational_therapist: 'Occupational Therapist',
    social_worker: 'Social Worker',
    case_manager: 'Case Manager',
    medical_assistant: 'Medical Assistant',
    receptionist: 'Receptionist',
    facility_administrator: 'Facility Administrator',
    department_manager: 'Department Manager',
    quality_coordinator: 'Quality Coordinator',
    infection_control: 'Infection Control',
    it_support: 'IT Support',
  };
  
  return roleNames[roleCode] || roleCode;
};

/**
 * Get accessible modules for current role
 */
export const selectAccessibleModules = (state: { activeContext: ActiveContextState }): string[] => {
  const { activeRoleCode, isPatient, isStaffWithoutFacility } = state.activeContext;
  
  if (!activeRoleCode && isPatient) {
    return PATIENT_MODULES;
  }
  
  if (!activeRoleCode && isStaffWithoutFacility) {
    return [];
  }
  
  if (activeRoleCode && isValidRoleCode(activeRoleCode)) {
    return ROLE_PERMISSIONS[activeRoleCode] || [];
  }
  
  return [];
};
