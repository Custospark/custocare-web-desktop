import { createSlice, createEntityAdapter, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Role,
  RolePermission,
  QueueConfiguration,
  UserRoleAssignment,
  RoleType,
} from '../../features//types/role';

export interface RoleState {
  roles: Role[];
  permissions: RolePermission[];
  queueConfigurations: QueueConfiguration[];
  userAssignments: UserRoleAssignment[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  currentUserRoles: string[]; // Role IDs for current user
}

const rolesAdapter = createEntityAdapter<Role>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const initialState = rolesAdapter.getInitialState<RoleState>({
  roles: [],
  permissions: [],
  queueConfigurations: [],
  userAssignments: [],
  selectedRole: null,
  isLoading: false,
  error: null,
  currentUserRoles: [],
});

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    // Role management
    setRoles: (state, action: PayloadAction<Role[]>) => {
      rolesAdapter.setAll(state, action.payload);
      state.roles = action.payload;
    },
    
    addRole: (state, action: PayloadAction<Role>) => {
      rolesAdapter.addOne(state, action.payload);
      state.roles.push(action.payload);
    },
    
    updateRole: (state, action: PayloadAction<Role>) => {
      rolesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
      const index = state.roles.findIndex(role => role.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
    },
    
    deleteRole: (state, action: PayloadAction<string>) => {
      rolesAdapter.removeOne(state, action.payload);
      state.roles = state.roles.filter(role => role.id !== action.payload);
    },
    
    // Permission management
    setPermissions: (state, action: PayloadAction<RolePermission[]>) => {
      state.permissions = action.payload;
    },
    
    updatePermission: (state, action: PayloadAction<RolePermission>) => {
      const index = state.permissions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.permissions[index] = action.payload;
      }
    },
    
    // Queue configuration
    setQueueConfigurations: (state, action: PayloadAction<QueueConfiguration[]>) => {
      state.queueConfigurations = action.payload;
    },
    
    updateQueueConfiguration: (state, action: PayloadAction<QueueConfiguration>) => {
      const index = state.queueConfigurations.findIndex(config => config.id === action.payload.id);
      if (index !== -1) {
        state.queueConfigurations[index] = action.payload;
      }
    },
    
    // User role assignments
    setUserAssignments: (state, action: PayloadAction<UserRoleAssignment[]>) => {
      state.userAssignments = action.payload;
    },
    
    addUserAssignment: (state, action: PayloadAction<UserRoleAssignment>) => {
      state.userAssignments.push(action.payload);
    },
    
    updateUserAssignment: (state, action: PayloadAction<UserRoleAssignment>) => {
      const index = state.userAssignments.findIndex(assignment => assignment.id === action.payload.id);
      if (index !== -1) {
        state.userAssignments[index] = action.payload;
      }
    },
    
    removeUserAssignment: (state, action: PayloadAction<string>) => {
      state.userAssignments = state.userAssignments.filter(assignment => assignment.id !== action.payload);
    },
    
    // Current user roles
    setCurrentUserRoles: (state, action: PayloadAction<string[]>) => {
      state.currentUserRoles = action.payload;
    },
    
    // Selection
    selectRole: (state, action: PayloadAction<Role | null>) => {
      state.selectedRole = action.payload;
    },
    
    // Role type filtering
    getRolesByType: (state, action: PayloadAction<RoleType>) => {
      return {
        ...state,
        roles: state.roles.filter(role => role.type === action.payload),
      };
    },
    
    // Loading states
    setRoleLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setRoleError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset
    resetRoleState: () => initialState,
  },
});

export const {
  selectAll: selectAllRoles,
  selectById: selectRoleById,
  selectIds: selectRoleIds,
  selectTotal: selectTotalRoles,
} = rolesAdapter.getSelectors((state: { roles: ReturnType<typeof roleSlice.reducer> }) => state.roles);

export const {
  setRoles,
  addRole,
  updateRole,
  deleteRole,
  setPermissions,
  updatePermission,
  setQueueConfigurations,
  updateQueueConfiguration,
  setUserAssignments,
  addUserAssignment,
  updateUserAssignment,
  removeUserAssignment,
  setCurrentUserRoles,
  selectRole,
  getRolesByType,
  setRoleLoading,
  setRoleError,
  resetRoleState,
} = roleSlice.actions;

export default roleSlice.reducer;