// store/slices/activeContextSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Represents a user's role assignment, may be linked to a facility or not
 */
export interface FacilityRole {
  id: number;                   // Unique ID for this role assignment
  facilityId?: number | null;   // Facility ID; null for patient-only roles or staff without facilities
  facilityName?: string;
  facilityCode?: string;
  roleCode: string;             // e.g., 'PATIENT', 'STAFF', 'OWNER'
  roleName: string;             // Human-readable name
  departmentIds: number[];      // Departments within the facility (if any)
  isPrimaryFacility?: boolean;  // Marks default role/facility to auto-select on login
  permissions: string[];        // e.g., ['pharmacy:read', 'lab:write']
  modules: string[];            // e.g., ['pharmacy', 'lab', 'billing']
}

/**
 * Active Context Slice State
 * Tracks the currently active role and facility, and available roles
 */
interface ActiveContextState {
  activeRoleId: number | null;
  activeFacilityId: number | null;
  activeRole: FacilityRole | null;
  availableRoles: FacilityRole[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ActiveContextState = {
  activeRoleId: null,
  activeFacilityId: null,
  activeRole: null,
  availableRoles: [],
  isLoading: false,
  error: null,
};

const activeContextSlice = createSlice({
  name: 'activeContext',
  initialState,
  reducers: {
    /**
     * Set all roles available to the user (called after login)
     * Automatically selects primary role or falls back to first role
     */
    setAvailableRoles: (state, action: PayloadAction<FacilityRole[]>) => {
      state.availableRoles = action.payload;

      // Auto-select primary facility role if available, else fallback to first role
      const primaryRole =
        action.payload.find(role => role.isPrimaryFacility) || action.payload[0];

      if (primaryRole) {
        state.activeRole = primaryRole;
        state.activeRoleId = primaryRole.id;
        state.activeFacilityId = primaryRole.facilityId ?? null;

        // Persist to localStorage
        localStorage.setItem('activeRoleId', primaryRole.id.toString());
        localStorage.setItem('activeFacilityId', (primaryRole.facilityId ?? '').toString());
      }
    },

    /**
     * Switch to a different role (by role ID)
     * Handles Staff ↔ Patient ↔ Owner switching
     */
    switchRole: (state, action: PayloadAction<number>) => {
      const newRole = state.availableRoles.find(role => role.id === action.payload);

      if (newRole) {
        state.activeRole = newRole;
        state.activeRoleId = newRole.id;
        state.activeFacilityId = newRole.facilityId ?? null;
        state.error = null;

        // Persist to localStorage
        localStorage.setItem('activeRoleId', newRole.id.toString());
        localStorage.setItem('activeFacilityId', (newRole.facilityId ?? '').toString());
      } else {
        state.error = 'Role not found';
      }
    },

    /**
     * Switch facility for staff with multiple facility assignments
     * Optionally specify roleCode if multiple roles exist in the same facility
     */
    switchFacility: (state, action: PayloadAction<{ facilityId: number; roleCode?: string }>) => {
      const { facilityId, roleCode } = action.payload;

      // Find the role corresponding to this facility (and optional roleCode)
      const newRole = roleCode
        ? state.availableRoles.find(role => role.facilityId === facilityId && role.roleCode === roleCode)
        : state.availableRoles.find(role => role.facilityId === facilityId);

      if (newRole) {
        state.activeRole = newRole;
        state.activeRoleId = newRole.id;
        state.activeFacilityId = newRole.facilityId ?? null;
        state.error = null;

        // Persist to localStorage
        localStorage.setItem('activeRoleId', newRole.id.toString());
        localStorage.setItem('activeFacilityId', (newRole.facilityId ?? '').toString());
      } else {
        state.error = 'No role found for this facility';
      }
    },

    /**
     * Initialize active context from localStorage
     * Called on app startup
     */
    initializeActiveContext: (state) => {
      const storedRoleId = localStorage.getItem('activeRoleId');
      const storedFacilityId = localStorage.getItem('activeFacilityId');

      if (storedRoleId && state.availableRoles.length > 0) {
        const roleId = parseInt(storedRoleId, 10);
        const role = state.availableRoles.find(r => r.id === roleId);

        if (role) {
          state.activeRole = role;
          state.activeRoleId = role.id;
          state.activeFacilityId = role.facilityId ?? null;
        }
      } else if (storedFacilityId && state.availableRoles.length > 0) {
        const facilityId = parseInt(storedFacilityId, 10);
        const role = state.availableRoles.find(r => r.facilityId === facilityId);

        if (role) {
          state.activeRole = role;
          state.activeRoleId = role.id;
          state.activeFacilityId = role.facilityId ?? null;
        }
      }
    },

    /**
     * Clear active context (on logout)
     */
    clearActiveContext: (state) => {
      state.activeRoleId = null;
      state.activeFacilityId = null;
      state.activeRole = null;
      state.availableRoles = [];
      state.error = null;

      localStorage.removeItem('activeRoleId');
      localStorage.removeItem('activeFacilityId');
    },

    /**
     * Set loading state (for UI spinners, etc.)
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setAvailableRoles,
  switchRole,
  switchFacility,
  initializeActiveContext,
  clearActiveContext,
  setLoading,
  setError,
  clearError,
} = activeContextSlice.actions;

export default activeContextSlice.reducer;
