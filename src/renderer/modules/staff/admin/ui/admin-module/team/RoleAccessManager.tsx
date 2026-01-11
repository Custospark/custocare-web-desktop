/**
 * ============================================================================
 * ROLE ACCESS MANAGER COMPONENT
 * ============================================================================
 * 
 * Manage facility roles and module access permissions.
 * Fetches both system-defined roles and facility-specific roles based on
 * the active facility context.
 * 
 * @component RoleAccessManager
 */

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Settings,
  CheckSquare,
  Plus,
  Edit,
  Save,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';

import { 
  useGetFacilityRoles,
  useGetFacilitySpecificRoles,
  useCreateFacilityRole,
} from '../../../api/team/queries/useFacilityRoleQueries';
import { useGetModules, useAssignRoleModuleDefault } from '../../../api/team/queries/useModuleQueries';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

interface RoleAccessManagerProps {
  theme: 'light' | 'dark';
  refreshKey?: number;
  facilityId?:number;
}

interface CreateRoleFormData {
  name: string;
  code: string;
  description: string;
}

export const RoleAccessManager: React.FC<RoleAccessManagerProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';
  
  // Get active facility ID from Redux store (same way axios does)
  const activeFacilityId = useSelector(
    (state: RootState) => state.activeContext.activeFacilityId
  );
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateRoleFormData>({
    name: '',
    code: '',
    description: '',
  });
  
  // Fetch system roles
  const { data: systemRolesResponse, isLoading: systemRolesLoading } = useGetFacilityRoles(
    { is_system_role: true },
    { enabled: true }
  );
  
  // Fetch facility-specific roles (only if we have an active facility)
  const { data: facilityRolesResponse, isLoading: facilityRolesLoading } = useGetFacilitySpecificRoles(
    activeFacilityId!,
    { enabled: !!activeFacilityId }
  );
  
  // Fetch modules
  const { data: modulesResponse, isLoading: modulesLoading } = useGetModules(
    { is_active: true },
  );
  
  const systemRoles = systemRolesResponse?.data || [];
  const facilityRoles = facilityRolesResponse?.data || [];
  const modules = modulesResponse?.data || [];
  
  // Combine system and facility roles
  const allRoles = useMemo(() => {
    return [...facilityRoles,...systemRoles];
  }, [systemRoles, facilityRoles]);
  
  const createRoleMutation = useCreateFacilityRole();
  const assignModuleMutation = useAssignRoleModuleDefault();
  
  const selectedRole = allRoles.find(r => r.id === selectedRoleId);
  
  const handleEditStart = (roleId: number) => {
    const role = allRoles.find(r => r.id === roleId);
    if (!role) return;
    
    setEditingRoleId(roleId);
    // TODO: Load current module permissions for this role
    // For now, using empty array as placeholder
    setTempPermissions(['kk','yy']);
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
  
  const handleSavePermissions = async () => {
    if (!editingRoleId || !selectedRole) return;
    
    try {
      // Assign each module permission
      for (const moduleCode of tempPermissions) {
        await assignModuleMutation.mutateAsync({
          role_code: selectedRole.code,
          module_code: moduleCode,
          default_access: true,
        });
      }
      
      setEditingRoleId(null);
      setTempPermissions([]);
    } catch (error) {
      // Error already handled by mutation hook
      console.error('Failed to save permissions:', error);
    }
  };
  
  const handleCreateRole = () => {
    if (!activeFacilityId) {
      console.error('No active facility ID');
      return;
    }
    
    createRoleMutation.mutate(
      {
        name: createFormData.name,
        code: createFormData.code,
        description: createFormData.description,
        is_system_role: false,
        facility_id: activeFacilityId,
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          setCreateFormData({ name: '', code: '', description: '' });
        },
      }
    );
  };
  
  const isLoading = systemRolesLoading || facilityRolesLoading || modulesLoading;
  
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
            {activeFacilityId && (
              <div className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded text-xs ${
                isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                <Building2 className="w-3 h-3" />
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!activeFacilityId}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !activeFacilityId
                ? (isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
            }`}
            title={!activeFacilityId ? 'No active facility selected' : 'Create custom facility role'}
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        </div>
      </div>
      
      {/* Create Role Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl max-w-md w-full p-6 ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Create Custom Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role Name *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Senior Nurse"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role Code *
                </label>
                <input
                  type="text"
                  value={createFormData.code}
                  onChange={(e) => setCreateFormData(prev => ({ 
                    ...prev, 
                    code: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                  }))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., senior_nurse"
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Unique identifier (lowercase, underscores only)
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Brief description of this role..."
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleCreateRole}
                  disabled={!createFormData.name || !createFormData.code || createRoleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateFormData({ name: '', code: '', description: '' });
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        // <div className={`rounded-xl p-12 text-center border ${
        //   isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        // }`}>
        //   <div className={`inline-flex items-center gap-3 ${
        //     isDark ? 'text-gray-400' : 'text-gray-600'
        //   }`}>
        //     <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        //     Loading roles and permissions...
        //   </div>
        // </div>
        <LoadingSkeleton variant='detail' theme={theme} message='Loading roles and permissions...'/>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Roles List */}
          <div className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${
              isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="font-semibold">
                All Roles ({allRoles.length})
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {systemRoles.length} system · {facilityRoles.length} facility
              </p>
            </div>
            
            <div className={`divide-y max-h-[600px] overflow-y-auto ${
              isDark ? 'divide-gray-800' : 'divide-gray-200'
            }`}>
              {allRoles.map((role) => (
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
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <code className={`px-2 py-0.5 rounded text-xs ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {role.code}
                        </code>
                        {role.is_system_role ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                          }`}>
                            System
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            Facility
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
              
              {allRoles.length === 0 && (
                <div className="p-8 text-center">
                  <Shield className={`w-12 h-12 mx-auto mb-2 ${
                    isDark ? 'text-gray-700' : 'text-gray-300'
                  }`} />
                  <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                    No roles available
                  </p>
                </div>
              )}
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
                      <h3 className="font-semibold flex items-center gap-2">
                        {selectedRole.name}
                        {selectedRole.is_system_role ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                          }`}>
                            System Role
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            Facility Role
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm mt-0.5 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Assign module access permissions
                      </p>
                    </div>
                    
                    {editingRoleId === selectedRole.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSavePermissions}
                          disabled={assignModuleMutation.isPending}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {assignModuleMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={assignModuleMutation.isPending}
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
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Permissions
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
                        This is a system-defined role. You can still assign module access permissions to customize what this role can access in your facility.
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
                    
                    {modules.length === 0 ? (
                      <div className="text-center py-8">
                        <Settings className={`w-12 h-12 mx-auto mb-2 ${
                          isDark ? 'text-gray-700' : 'text-gray-300'
                        }`} />
                        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                          No modules available
                        </p>
                      </div>
                    ) : (
                      modules.map((module) => {
                        const isChecked = editingRoleId === selectedRole.id
                          ? tempPermissions.includes(module.code)
                          : false; // In real app, check actual permissions from role.modules
                        
                        return (
                          <label
                            key={module.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              editingRoleId !== selectedRole.id
                                ? 'cursor-default'
                                : 'cursor-pointer'
                            } ${
                              isChecked
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
                      })
                    )}
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
