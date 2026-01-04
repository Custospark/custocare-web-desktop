// hooks/useActiveContext.ts
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { 
  selectIsPatientMode,
  selectAccessibleModules,
  getRoleDisplayName,
  type RoleCode 
} from '../slices/activeContextSlice';

/**
 * Custom hook for accessing active context with helpful utilities
 */
export const useActiveContext = () => {
  const context = useAppSelector((state) => state.activeContext);
  const isPatientMode = useAppSelector(selectIsPatientMode);
  const accessibleModules = useAppSelector(selectAccessibleModules);

  return {
    // Raw context
    ...context,
    
    // Computed properties
    isPatientMode,
    accessibleModules,
    
    // Helper: Check if user has specific role
    hasRole: (roleCode: RoleCode) => context.activeRoleCode === roleCode,
    
    // Helper: Check if user can access module
    canAccess: (module: string) => {
      return accessibleModules.includes(module);
    },
    
    // Helper: Get current facility name
    getFacilityName: () => {
      if (!context.activeFacilityId || !context.activeRoleCode) {
        return 'Unknown Facility';
      }
      
      const role = context.facilityRoles.find(
        r => r.facility_id === context.activeFacilityId && 
             r.role_code === context.activeRoleCode
      );
      return role?.facility_name || 'Unknown Facility';
    },
    
    // Helper: Get display name for current role
    getRoleDisplayName: () => getRoleDisplayName(context.activeRoleCode),
    
    // Helper: Check if user has multiple roles
    hasMultipleRoles: () => context.facilityRoles.length > 1,
    
    // Helper: Get all facilities user has access to
    getAvailableFacilities: () => {
      const facilityMap = new Map<number, { id: number; name: string; roles: RoleCode[] }>();
      
      context.facilityRoles.forEach(role => {
        if (!facilityMap.has(role.facility_id)) {
          facilityMap.set(role.facility_id, {
            id: role.facility_id,
            name: role.facility_name || `Facility ${role.facility_id}`,
            roles: []
          });
        }
        facilityMap.get(role.facility_id)!.roles.push(role.role_code);
      });
      
      return Array.from(facilityMap.values());
    },
  };
};
