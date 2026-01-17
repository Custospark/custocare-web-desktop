/**
 * ============================================================================
 * Context Selectors Utility
 * ============================================================================
 * 
 * Centralized utility functions for retrieving essential user context information
 * from the Redux store. This module provides type-safe, null-safe access to:
 * - User identity (ID, UUID, names, contact info)
 * - Staff information (staff ID, employee ID, professional title)
 * - Patient information (patient ID, medical record number)
 * - Active context (capability, facility, role)
 * - Authentication state
 * 
 * @module contextSelectors
 * @author Your Name
 * @created 2024
 */

import type { RootState } from '../store';
import type { 
  StaffCapability, 
  PatientCapability,
  StaffFacilityAssignment,
  BackendModule 
} from '../slices/activeContextSlice';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete user identity information
 */
export interface UserIdentity {
  userId: number;
  uuid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationalIdCountryCode: string | null;
}

/**
 * Staff context information
 */
export interface StaffContext {
  staffId: number;
  staff_uuid: string;
  employeeId: string | null;
  professionalTitle: string | null;
  activeFacilityId: number | null;
  activeFacilityName: string | null;
  activeRoleCode: string | null;
  hasMultipleFacilities: boolean;
  facilities: StaffFacilityAssignment[];
}

/**
 * Patient context information
 */
export interface PatientContext {
  patientId: number;
  patientUuid: string;
  primaryFacilityId: number | null;
  medicalRecordNumber: string | null;
}

/**
 * Complete active context summary
 */
export interface ActiveContextSummary {
  activeCapability: string | null;
  activeFacilityId: number | null;
  activeFacilityName: string | null;
  activeRoleCode: string | null;
  isPatient: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  availableCapabilities: string[];
}

// ============================================================================
// CORE USER IDENTITY SELECTORS
// ============================================================================

/**
 * Get the current user's ID
 * 
 * @param state - Redux root state
 * @returns User ID or null if not authenticated
 * 
 * @example
 * const userId = getUserId(state);
 * if (userId) {
 *   console.log('Current user ID:', userId);
 * }
 */
export const getUserId = (state: RootState): number | null => {
  return state.activeContext.user?.id ?? null;
};

/**
 * Get the current user's UUID
 * 
 * @param state - Redux root state
 * @returns User UUID or null if not authenticated
 * 
 * @example
 * const uuid = getUserUuid(state);
 * // Use for API calls requiring UUID: /api/users/${uuid}
 */
export const getUserUuid = (state: RootState): string | null => {
  return state.activeContext.user?.uuid ?? null;
};

/**
 * Get the current user's full name
 * 
 * @param state - Redux root state
 * @returns Full name or 'Guest' if not authenticated
 * 
 * @example
 * const fullName = getUserFullName(state);
 * // Display: "Welcome, Dr. John Smith"
 */
export const getUserFullName = (state: RootState): string => {
  return state.activeContext.user?.full_name ?? 'Guest';
};

/**
 * Get the current user's first name
 * 
 * @param state - Redux root state
 * @returns First name or empty string if not authenticated
 */
export const getUserFirstName = (state: RootState): string => {
  return state.activeContext.user?.first_name ?? '';
};

/**
 * Get the current user's last name
 * 
 * @param state - Redux root state
 * @returns Last name or empty string if not authenticated
 * 
 * @example
 * const lastName = getUserLastName(state);
 * // Use for formal addressing: "Dr. " + lastName
 */
export const getUserLastName = (state: RootState): string => {
  return state.activeContext.user?.last_name ?? '';
};

/**
 * Get the current user's email address
 * 
 * @param state - Redux root state
 * @returns Email address or null if not available
 * 
 * @example
 * const email = getUserEmail(state);
 * if (email) {
 *   sendNotification(email, message);
 * }
 */
export const getUserEmail = (state: RootState): string | null => {
  return state.activeContext.user?.email ?? null;
};

/**
 * Get the current user's phone number
 * 
 * @param state - Redux root state
 * @returns Phone number or null if not available
 */
export const getUserPhone = (state: RootState): string | null => {
  return state.activeContext.user?.phone ?? null;
};

/**
 * Get the complete user identity object
 * 
 * @param state - Redux root state
 * @returns Complete user identity or null if not authenticated
 * 
 * @example
 * const identity = getUserIdentity(state);
 * if (identity) {
 *   console.log(`User: ${identity.fullName} (${identity.email})`);
 * }
 */
export const getUserIdentity = (state: RootState): UserIdentity | null => {
  const user = state.activeContext.user;
  if (!user) return null;

  return {
    userId: user.id,
    uuid: user.uuid,
    fullName: user.full_name,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    nationalIdCountryCode: user.national_id_country_code,
  };
};

// ============================================================================
// STAFF CONTEXT SELECTORS
// ============================================================================

/**
 * Get the current staff ID (only available when user has staff capability)
 * 
 * @param state - Redux root state
 * @returns Staff ID or null if user is not staff
 * 
 * @example
 * const staffId = getStaffId(state);
 * if (staffId) {
 *   fetchStaffSchedule(staffId);
 * }
 */
export const getStaffId = (state: RootState): number | null => {
  return state.activeContext.capabilities.staff?.staff_id ?? null;
};
/**
 * 
 * @param state Get staff UUID(Which represents staff professional Number.)
 * @returns 
 */
export const getStaffUuid = (state: RootState): string | null => {
  return state.activeContext.capabilities.staff?.staff_uuid ?? null;
};

/**
 * Get the employee ID for the current staff member
 * 
 * @param state - Redux root state
 * @returns Employee ID or null if not available
 * 
 * @example
 * const employeeId = getEmployeeId(state);
 * // Use for HR systems, payroll, etc.
 */
export const getEmployeeId = (state: RootState): string | null => {
  return state.activeContext.capabilities.staff?.employee_id ?? null;
};

/**
 * Get the professional title for the current staff member
 * 
 * @param state - Redux root state
 * @returns Professional title (e.g., "Dr.", "RN", "MD") or null
 * 
 * @example
 * const title = getProfessionalTitle(state);
 * // Display: "Dr. John Smith" or "John Smith, RN"
 */
export const getProfessionalTitle = (state: RootState): string | null => {
  return state.activeContext.capabilities.staff?.professional_title ?? null;
};

/**
 * Get the active facility ID for the current staff member
 * 
 * @param state - Redux root state
 * @returns Active facility ID or null if not in staff mode or no facility selected
 * 
 * @example
 * const facilityId = getActiveFacilityId(state);
 * if (facilityId) {
 *   fetchFacilityPatients(facilityId);
 * }
 */
export const getActiveFacilityId = (state: RootState): number | null => {
  return state.activeContext.activeFacilityId;
};

/**
 * Get the active facility name for the current staff member
 * 
 * @param state - Redux root state
 * @returns Active facility name or null if not available
 * 
 * @example
 * const facilityName = getActiveFacilityName(state);
 * // Display in header: "Current Location: General Hospital"
 */
export const getActiveFacilityName = (state: RootState): string | null => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (activeCapability !== 'staff' || !activeFacilityId) {
    return null;
  }
  
  const staffCapability = capabilities.staff as StaffCapability | undefined;
  if (!staffCapability) return null;
  
  const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  return facility?.facility_name ?? null;
};

/**
 * Get the active role code for the current staff member at their active facility
 * 
 * @param state - Redux root state
 * @returns Role code (e.g., "doctor", "nurse", "admin") or null
 * 
 * @example
 * const roleCode = getActiveRoleCode(state);
 * if (roleCode === 'doctor') {
 *   showDoctorFeatures();
 * }
 */
export const getActiveRoleCode = (state: RootState): string | null => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (activeCapability !== 'staff' || !activeFacilityId) {
    return null;
  }
  
  const staffCapability = capabilities.staff as StaffCapability | undefined;
  if (!staffCapability) return null;
  
  const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  return facility?.role_code ?? null;
};

/**
 * Get all facilities assigned to the current staff member
 * 
 * @param state - Redux root state
 * @returns Array of facility assignments or empty array
 * 
 * @example
 * const facilities = getStaffFacilities(state);
 * // Render facility switcher dropdown
 * facilities.forEach(f => console.log(f.facility_name));
 */
export const getStaffFacilities = (state: RootState): StaffFacilityAssignment[] => {
  const staffCapability = state.activeContext.capabilities.staff;
  return staffCapability?.facilities ?? [];
};

/**
 * Get complete staff context information
 * 
 * @param state - Redux root state
 * @returns Complete staff context or null if user is not staff
 * 
 * @example
 * const staffContext = getStaffContext(state);
 * if (staffContext) {
 *   console.log(`Staff ID: ${staffContext.staffId}`);
 *   console.log(`Facility: ${staffContext.activeFacilityName}`);
 * }
 */
export const getStaffContext = (state: RootState): StaffContext | null => {
  const staffCapability = state.activeContext.capabilities.staff;
  if (!staffCapability) return null;

  return {
    staffId: staffCapability.staff_id,
    staff_uuid: staffCapability.staff_uuid,
    employeeId: staffCapability.employee_id,
    professionalTitle: staffCapability.professional_title ?? null,
    activeFacilityId: state.activeContext.activeFacilityId,
    activeFacilityName: getActiveFacilityName(state),
    activeRoleCode: getActiveRoleCode(state),
    hasMultipleFacilities: staffCapability.facilities.length > 1,
    facilities: staffCapability.facilities,
  };
};

// ============================================================================
// PATIENT CONTEXT SELECTORS
// ============================================================================

/**
 * Get the current patient ID (only available when user has patient capability)
 * 
 * @param state - Redux root state
 * @returns Patient ID or null if user is not a patient
 * 
 * @example
 * const patientId = getPatientId(state);
 * if (patientId) {
 *   fetchPatientRecords(patientId);
 * }
 */
export const getPatientId = (state: RootState): number | null => {
  return state.activeContext.capabilities.patient?.patient_id ?? null;
};

/**
 * Get Patient UUID.
 */
export const getPatientUuid=(state:RootState):string | null =>{
  return state.activeContext.capabilities.patient?.patient_uuid ?? null;
}

/**
 * Get the patient's primary facility ID
 * 
 * @param state - Redux root state
 * @returns Primary facility ID or null if not available
 */
export const getPatientPrimaryFacilityId = (state: RootState): number | null => {
  return state.activeContext.capabilities.patient?.primary_facility_id ?? null;
};

/**
 * Get the patient's medical record number (MRN)
 * 
 * @param state - Redux root state
 * @returns Medical record number or null if not available
 * 
 * @example
 * const mrn = getPatientMedicalRecordNumber(state);
 * // Display: "MRN: 123456789"
 */
export const getPatientMedicalRecordNumber = (state: RootState): string | null => {
  return state.activeContext.capabilities.patient?.medical_record_number ?? null;
};

/**
 * Get complete patient context information
 * 
 * @param state - Redux root state
 * @returns Complete patient context or null if user is not a patient
 * 
 * @example
 * const patientContext = getPatientContext(state);
 * if (patientContext) {
 *   console.log(`Patient ID: ${patientContext.patientId}`);
 *   console.log(`MRN: ${patientContext.medicalRecordNumber}`);
 * }
 */
export const getPatientContext = (state: RootState): PatientContext | null => {
  const patientCapability = state.activeContext.capabilities.patient;
  if (!patientCapability) return null;

  return {
    patientId: patientCapability.patient_id,
    patientUuid: patientCapability.patient_uuid,
    primaryFacilityId: patientCapability.primary_facility_id,
    medicalRecordNumber: patientCapability.medical_record_number ?? null,
  };
};

// ============================================================================
// ACTIVE CONTEXT SELECTORS
// ============================================================================

/**
 * Get the currently active capability (e.g., 'staff', 'patient', 'admin')
 * 
 * @param state - Redux root state
 * @returns Active capability name or null
 * 
 * @example
 * const capability = getActiveCapability(state);
 * if (capability === 'staff') {
 *   showStaffDashboard();
 * }
 */
export const getActiveCapability = (state: RootState): string | null => {
  return state.activeContext.activeCapability;
};

/**
 * Get all available capabilities for the current user
 * 
 * @param state - Redux root state
 * @returns Array of capability names
 * 
 * @example
 * const capabilities = getAvailableCapabilities(state);
 * // Render capability switcher: ['staff', 'patient']
 */
export const getAvailableCapabilities = (state: RootState): string[] => {
  return state.activeContext.availableCapabilities;
};

/**
 * Check if user is currently in patient mode
 * 
 * @param state - Redux root state
 * @returns True if in patient mode
 */
export const isInPatientMode = (state: RootState): boolean => {
  return state.activeContext.activeCapability === 'patient';
};

/**
 * Check if user is currently in staff mode
 * 
 * @param state - Redux root state
 * @returns True if in staff mode
 */
export const isInStaffMode = (state: RootState): boolean => {
  return state.activeContext.activeCapability === 'staff';
};

/**
 * Check if user is currently in admin mode
 * 
 * @param state - Redux root state
 * @returns True if in any admin mode
 */
export const isInAdminMode = (state: RootState): boolean => {
  const { activeCapability } = state.activeContext;
  return ['super_admin', 'admin', 'system_admin', 'facility_admin'].includes(activeCapability ?? '');
};

/**
 * Check if user has patient capability (regardless of active mode)
 * 
 * @param state - Redux root state
 * @returns True if user has patient capability
 */
export const hasPatientCapability = (state: RootState): boolean => {
  return state.activeContext.isPatient;
};

/**
 * Check if user has staff capability (regardless of active mode)
 * 
 * @param state - Redux root state
 * @returns True if user has staff capability
 */
export const hasStaffCapability = (state: RootState): boolean => {
  return state.activeContext.isStaff;
};

/**
 * Get complete active context summary
 * 
 * @param state - Redux root state
 * @returns Complete active context information
 * 
 * @example
 * const context = getActiveContextSummary(state);
 * console.log(`Current mode: ${context.activeCapability}`);
 * console.log(`At facility: ${context.activeFacilityName}`);
 */
export const getActiveContextSummary = (state: RootState): ActiveContextSummary => {
  return {
    activeCapability: state.activeContext.activeCapability,
    activeFacilityId: state.activeContext.activeFacilityId,
    activeFacilityName: getActiveFacilityName(state),
    activeRoleCode: getActiveRoleCode(state),
    isPatient: state.activeContext.isPatient,
    isStaff: state.activeContext.isStaff,
    isAdmin: isInAdminMode(state),
    availableCapabilities: state.activeContext.availableCapabilities,
  };
};

// ============================================================================
// AUTHENTICATION SELECTORS
// ============================================================================

/**
 * Get the current authentication token
 * 
 * @param state - Redux root state
 * @returns Auth token or null if not authenticated
 * 
 * @example
 * const token = getAuthToken(state);
 * fetch('/api/data', { headers: { Authorization: `Bearer ${token}` }});
 */
export const getAuthToken = (state: RootState): string | null => {
  return state.auth.token;
};

/**
 * Check if user is authenticated
 * 
 * @param state - Redux root state
 * @returns True if user is authenticated
 */
export const isAuthenticated = (state: RootState): boolean => {
  return state.auth.isAuthenticated;
};

/**
 * Check if authentication is initialized
 * 
 * @param state - Redux root state
 * @returns True if auth has been initialized (loaded from localStorage)
 */
export const isAuthInitialized = (state: RootState): boolean => {
  return state.auth.isInitialized;
};

// ============================================================================
// MODULE ACCESS SELECTORS
// ============================================================================

/**
 * Get all accessible modules for the current context
 * 
 * @param state - Redux root state
 * @returns Array of accessible modules
 * 
 * @example
 * const modules = getAccessibleModules(state);
 * modules.forEach(m => console.log(`Can access: ${m.name}`));
 */
export const getAccessibleModules = (state: RootState): BackendModule[] => {
  const { activeCapability, capabilities, activeFacilityId } = state.activeContext;
  
  if (!activeCapability || !capabilities[activeCapability]) {
    return [];
  }
  
  const capability = capabilities[activeCapability];
  
  if (activeCapability === 'staff') {
    const staffCapability = capability as StaffCapability;
    
    if (staffCapability.facilities.length > 0) {
      if (activeFacilityId) {
        const facility = staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
        return facility?.modules?.filter(m => m.is_active) ?? [];
      }
      return [];
    } else {
      return staffCapability.modules?.filter(m => m.is_active) ?? [];
    }
  }
  
  const typedCapability = capability as PatientCapability | { modules?: BackendModule[] };
  return typedCapability.modules?.filter(m => m.is_active) ?? [];
};

/**
 * Get accessible module codes for the current context
 * 
 * @param state - Redux root state
 * @returns Array of module codes (e.g., ['appointments', 'billing'])
 * 
 * @example
 * const moduleCodes = getAccessibleModuleCodes(state);
 * if (moduleCodes.includes('appointments')) {
 *   showAppointmentsTab();
 * }
 */
export const getAccessibleModuleCodes = (state: RootState): string[] => {
  const modules = getAccessibleModules(state);
  return modules.map(m => m.code);
};

/**
 * Check if user can access a specific module
 * 
 * @param state - Redux root state
 * @param moduleCode - Module code to check
 * @returns True if user can access the module
 * 
 * @example
 * if (canAccessModule(state, 'billing')) {
 *   showBillingSection();
 * }
 */
export const canAccessModule = (state: RootState, moduleCode: string): boolean => {
  const codes = getAccessibleModuleCodes(state);
  return codes.includes(moduleCode);
};

// ============================================================================
// COMBINED UTILITY SELECTORS
// ============================================================================

/**
 * Get essential user information for API requests
 * Combines user ID, staff ID, facility ID in one object
 * 
 * @param state - Redux root state
 * @returns Essential IDs for API calls
 * 
 * @example
 * const ids = getEssentialIds(state);
 * apiClient.post('/create-appointment', {
 *   user_id: ids.userId,
 *   staff_id: ids.staffId,
 *   facility_id: ids.facilityId
 * });
 */
export const getEssentialIds = (state: RootState) => {
  return {
    userId: getUserId(state),
    staffId: getStaffId(state),
    patientId: getPatientId(state),
    facilityId: getActiveFacilityId(state),
  };
};

/**
 * Get user display information for UI
 * 
 * @param state - Redux root state
 * @returns Display information for user profile
 * 
 * @example
 * const display = getUserDisplayInfo(state);
 * // Show in header: "Dr. John Smith | General Hospital | Doctor"
 */
export const getUserDisplayInfo = (state: RootState) => {
  return {
    fullName: getUserFullName(state),
    email: getUserEmail(state),
    professionalTitle: getProfessionalTitle(state),
    facilityName: getActiveFacilityName(state),
    roleCode: getActiveRoleCode(state),
    capability: getActiveCapability(state),
  };
};

/**
 * Check if user has complete staff context (staff mode with facility selected)
 * 
 * @param state - Redux root state
 * @returns True if user is in staff mode with active facility
 */
export const hasCompleteStaffContext = (state: RootState): boolean => {
  return isInStaffMode(state) && getActiveFacilityId(state) !== null;
};
