/**
 * ============================================================================
 * ROLE ACCESS MANAGER COMPONENT
 * ============================================================================
 * 
 * Manage facility roles and module access permissions.
 * 
 * @component RoleAccessManager
 */

import React, { useState } from 'react';
import {
  Shield,
  Settings,
  CheckSquare,
  Plus,
  Edit,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

import { useGetFacilityRoles,useUpdateFacilityRole } from '../../../api/team/queries/useFacilityRoleQueries';
import { useGetModules } from '../../../api/team/queries/useModuleQueries';

interface RoleAccessManagerProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number;
}

export const RoleAccessManager: React.FC<RoleAccessManagerProps> = ({
  theme,

}) => {
  const isDark = theme === 'dark';
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  
  // Fetch roles and modules
  const { data: rolesResponse, isLoading: rolesLoading } = useGetFacilityRoles(
    { is_system_role: true },
    { enabled: true }
  );
  
  const { data: modulesResponse, isLoading: modulesLoading } = useGetModules(
    { is_active: true },
    { enabled: true }
  );
  
  const roles = rolesResponse?.data || [];
  const modules = modulesResponse?.data || [];
  
  const updateRoleMutation = useUpdateFacilityRole();
  
  const selectedRole = roles.find(r => r.id === selectedRoleId);
  
  const handleEditStart = (roleId: number) => {
    setEditingRoleId(roleId);
    // In a real implementation, we'd load the current module permissions for this role
    // For now, we'll use an empty array as placeholder
    setTempPermissions([]);
  };
  
  const handleEditCancel = () => {
    setEditingRoleId(null);
    setTempPermissions([]);
  };
  
  const handleToggleModule = (moduleCode: string) => {
    setTempPermissions(prev =>
      prev.includes(moduleCode)
        ? prev.filter(c => c !== moduleCode)
        : [...prev, moduleCode]
    );
  };
  
  const handleSavePermissions = () => {
    if (!editingRoleId) return;
    
    // In a real implementation, this would update the role-module assignments
    // For now, we'll just close the edit mode
    
    updateRoleMutation.mutate(
      {
        id: editingRoleId,
        data: {
          // Module permissions would be saved here
        },
      },
      {
        onSuccess: () => {
          setEditingRoleId(null);
          setTempPermissions([]);
        },
      }
    );
  };
  
  const isLoading = rolesLoading || modulesLoading;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Roles & Access Management
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure facility roles and their module access permissions
            </p>
          </div>
          
          <button
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className={`rounded-xl p-12 text-center border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className={`inline-flex items-center gap-3 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading roles and permissions...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Roles List */}
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${
              isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="font-semibold">Facility Roles ({roles.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedRoleId === role.id
                      ? (isDark ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'bg-blue-50 border-l-2 border-blue-500')
                      : (isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{role.name}</div>
                      {role.description && (
                        <div className={`text-sm mt-1 line-clamp-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {role.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <code className={`px-2 py-0.5 rounded text-xs ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {role.code}
                        </code>
                        {role.is_system_role && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                          }`}>
                            System
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedRoleId === role.id && (
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Module Access Configuration */}
          <div className={`lg:col-span-2 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            {selectedRole ? (
              <>
                <div className={`p-4 border-b ${
                  isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{selectedRole.name}</h3>
                      <p className={`text-sm mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Configure module access permissions
                      </p>
                    </div>
                    
                    {editingRoleId === selectedRole.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSavePermissions}
                          disabled={updateRoleMutation.isPending}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isDark 
                              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(selectedRole.id)}
                        disabled={selectedRole.is_system_role}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedRole.is_system_role
                            ? (isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                            : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                        }`}
                        title={selectedRole.is_system_role ? 'System roles cannot be modified' : 'Edit permissions'}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  {selectedRole.is_system_role && editingRoleId !== selectedRole.id && (
                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                      isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        This is a system-defined role. Module access is managed by the system and cannot be modified directly.
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Module Access</h4>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {modules.length} modules available
                      </span>
                    </div>
                    
                    {modules.map((module) => {
                      const isChecked = editingRoleId === selectedRole.id
                        ? tempPermissions.includes(module.code)
                        : false; // In real app, check actual permissions
                      
                      return (
                        <label
                          key={module.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            editingRoleId !== selectedRole.id && selectedRole.is_system_role
                              ? 'cursor-not-allowed opacity-60'
                              : isChecked
                              ? (isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300')
                              : (isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-300 hover:border-gray-400')
                          }`}
                        >
                          <div className="mt-0.5">
                            {editingRoleId === selectedRole.id ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleModule(module.code)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            ) : (
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isChecked
                                  ? 'bg-blue-600 border-blue-600'
                                  : (isDark ? 'border-gray-600' : 'border-gray-300')
                              }`}>
                                {isChecked && <CheckSquare className="w-3 h-3 text-white" />}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{module.name}</div>
                              <code className={`px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600'
                              }`}>
                                {module.code}
                              </code>
                            </div>
                            {module.description && (
                              <div className={`text-sm mt-1 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {module.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <Settings className={`w-12 h-12 mx-auto mb-4 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-medium mb-2">Select a Role</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Choose a role from the list to view and manage its module access permissions
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAccessManager;