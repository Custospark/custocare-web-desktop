// components/RoleSwitcher.tsx
import React, { useState } from 'react';
import { Check, Building2, ChevronDown, User, Crown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks/useApp';
import {
  switchFacilityRole,
  switchToPatientMode,
  getRoleDisplayName,
  type FacilityRole,
  type RoleCode,
} from '../../app/store/slices/activeContextSlice';
import { cn } from '../../shared/types/cn';

interface RoleSwitcherProps {
  theme?: 'light' | 'dark';
  variant?: 'full' | 'compact' | 'dropdown';
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ 
  theme = 'dark',
  variant = 'full'
}) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    facilityRoles,
    activeFacilityId,
    activeRoleCode,
    capabilities,
    isPatient,
    isStaff,
    user,
  } = useAppSelector((state) => state.activeContext);

  const isDark = theme === 'dark';

  const handleRoleSwitch = (facilityId: number, roleCode: RoleCode) => {
    dispatch(switchFacilityRole({ facilityId, roleCode }));
    setIsOpen(false);
  };

  const handlePatientModeSwitch = () => {
    dispatch(switchToPatientMode());
    setIsOpen(false);
  };

  // Group roles by facility
  const rolesByFacility = facilityRoles.reduce((acc, role) => {
    if (!acc[role.facility_id]) {
      acc[role.facility_id] = {
        facilityName: role.facility_name || `Facility ${role.facility_id}`,
        roles: []
      };
    }
    acc[role.facility_id].roles.push(role);
    return acc;
  }, {} as Record<number, { facilityName: string; roles: FacilityRole[] }>);

  if (!isStaff && !isPatient) {
    return null;
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
            isDark
              ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-200'
              : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
          )}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            {activeRoleCode ? getRoleDisplayName(activeRoleCode) : 'Patient'}
          </span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className={cn(
              'absolute top-full right-0 mt-2 w-72 rounded-xl shadow-2xl border z-50',
              'animate-in slide-in-from-top-2 duration-200',
              isDark
                ? 'bg-gray-900 border-gray-800'
                : 'bg-white border-gray-200'
            )}>
              <div className="p-2 max-h-96 overflow-y-auto">
                {Object.entries(rolesByFacility).map(([facilityId, data]) => (
                  <div key={facilityId} className="mb-2">
                    <div className={cn(
                      'px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {data.facilityName}
                    </div>
                    {data.roles.map((role) => {
                      const isActive = 
                        activeFacilityId === role.facility_id && 
                        activeRoleCode === role.role_code;
                      
                      return (
                        <button
                          key={`${role.facility_id}-${role.role_code}`}
                          onClick={() => handleRoleSwitch(role.facility_id, role.role_code)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                            'transition-colors text-left',
                            isActive
                              ? isDark
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-blue-50 text-blue-600'
                              : isDark
                                ? 'hover:bg-gray-800 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {role.is_primary_facility && (
                              <Crown className="w-3 h-3 text-amber-500" />
                            )}
                            <span className="text-sm font-medium">
                              {getRoleDisplayName(role.role_code)}
                            </span>
                          </div>
                          {isActive && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {isPatient && (
                  <>
                    <div className={cn(
                      'my-2 border-t',
                      isDark ? 'border-gray-800' : 'border-gray-200'
                    )} />
                    <button
                      onClick={handlePatientModeSwitch}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                        'transition-colors text-left',
                        !activeRoleCode
                          ? isDark
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-green-50 text-green-600'
                          : isDark
                            ? 'hover:bg-gray-800 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Patient Portal</span>
                      </div>
                      {!activeRoleCode && <Check className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full variant (original design)
  return (
    <div className={cn(
      'rounded-lg shadow p-4',
      isDark ? 'bg-gray-800' : 'bg-white'
    )}>
      <h3 className={cn(
        'text-lg font-semibold mb-3',
        isDark ? 'text-gray-200' : 'text-gray-900'
      )}>
        Switch Role
      </h3>
      
      <div className="space-y-2">
        {/* Staff Roles */}
        {isStaff && Object.entries(rolesByFacility).map(([facilityId, data]) => (
          <div key={facilityId} className="border-b pb-2 dark:border-gray-700">
            <p className={cn(
              'text-sm font-medium mb-1',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {data.facilityName}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {data.roles.map((role) => {
                const isActive = 
                  activeFacilityId === role.facility_id && 
                  activeRoleCode === role.role_code;
                
                return (
                  <button
                    key={`${role.facility_id}-${role.role_code}`}
                    onClick={() => handleRoleSwitch(role.facility_id, role.role_code)}
                    className={cn(
                      'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {getRoleDisplayName(role.role_code)}
                    {role.is_primary_facility && (
                      <span className="ml-1 text-xs">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Patient Mode */}
        {isPatient && (
          <button
            onClick={handlePatientModeSwitch}
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
              !activeRoleCode
                ? 'bg-green-600 text-white'
                : isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Patient Portal
          </button>
        )}
      </div>

      {/* Current Context Display */}
      <div className={cn(
        'mt-4 pt-4 border-t text-sm',
        isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
      )}>
        <p><strong>User:</strong> {user?.full_name}</p>
        <p><strong>Active Role:</strong> {activeRoleCode ? getRoleDisplayName(activeRoleCode) : 'Patient'}</p>
        {activeFacilityId && (
          <p><strong>Facility ID:</strong> {activeFacilityId}</p>
        )}
        {capabilities.staff && (
          <p><strong>Staff ID:</strong> {capabilities.staff.staff_id}</p>
        )}
        {capabilities.patient && (
          <p><strong>Patient ID:</strong> {capabilities.patient.patient_id}</p>
        )}
      </div>
    </div>
  );
};

export default RoleSwitcher;
