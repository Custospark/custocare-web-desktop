/**
 * ============================================================================
 * ROLE ACCESS MANAGER COMPONENT
 * ============================================================================
 * 
 * Comprehensive role management interface for healthcare facilities.
 * Provides tabular view with filtering between system and custom roles.
 * Supports full CRUD operations for custom roles with read-only system roles.
 * 
 * @component RoleAccessManager
 * @description Manage facility-specific access roles and permissions
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react';

import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  facilityRoleKeys,
  useGetSystemFacilityRoles,
  useGetFacilitySpecificRoles,
  useCreateFacilityRole,
  useUpdateFacilityRole,
  useDeleteFacilityRole,
} from '../../api/team-management/queries/useFacilityRoleQueries';

import type {
  FacilityRole,
  CreateFacilityRoleRequest,
  UpdateFacilityRoleRequest,
} from '../../api/team-management/types/facilityRolesTypes';

interface RoleAccessManagerProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number;
}

type RoleType = 'all' | 'system' | 'custom';
type DrawerMode = 'create' | 'edit';

// Helper function to generate role code from name
const generateRoleCode = (name: string): string => {
  if (!name.trim()) return '';
  
  // Split by spaces, join with underscores, and capitalize
  return name
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('_');
};

// Helper function to ensure code is never undefined
const ensureCode = (code: string | undefined): string => {
  return code || '';
};

export const RoleAccessManager: React.FC<RoleAccessManagerProps> = ({
  theme,
  facilityId,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  // State management
  const [activeRoleType, setActiveRoleType] = useState<RoleType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedRole, setSelectedRole] = useState<FacilityRole | null>(null);
  const [formData, setFormData] = useState<CreateFacilityRoleRequest>({
    name: '',
    code: '',
    description: '',
    is_system_role: false,
    facility_id: facilityId,
  });

  // Auto-generate code when name changes (only for create mode)
  useEffect(() => {
    if (drawerMode === 'create' && formData.name.trim()) {
      const generatedCode = generateRoleCode(formData.name);
      setFormData(prev => ({
        ...prev,
        code: generatedCode
      }));
    }
  }, [formData.name, drawerMode]);

  // Fetch roles
  const {
    data: systemRolesResponse,
    isLoading: isLoadingSystem,
    refetch: refetchSystem,
  } = useGetSystemFacilityRoles();

  const {
    data: customRolesResponse,
    isLoading: isLoadingCustom,
    refetch: refetchCustom,
  } = useGetFacilitySpecificRoles(facilityId);

  const systemRoles = systemRolesResponse?.data || [];
  const customRoles = customRolesResponse?.data || [];
  const allRoles = [...systemRoles, ...customRoles];

  // Filter and search logic
  const filteredRoles = useMemo(() => {
    let roles = allRoles;

    // Filter by type
    if (activeRoleType === 'system') {
      roles = systemRoles;
    } else if (activeRoleType === 'custom') {
      roles = customRoles;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      roles = roles.filter(role =>
        role.name.toLowerCase().includes(term) ||
        role.code.toLowerCase().includes(term) ||
        (role.description?.toLowerCase() || '').includes(term)
      );
    }

    return roles;
  }, [allRoles, systemRoles, customRoles, activeRoleType, searchTerm]);

  // Loading states
  const isLoading = isLoadingSystem || isLoadingCustom;
  const isEmpty = !isLoading && filteredRoles.length === 0;

  // Role statistics
  const roleStats = {
    total: allRoles.length,
    system: systemRoles.length,
    custom: customRoles.length,
    showing: filteredRoles.length,
  };

  // Clear search
  const handleClearSearch = () => setSearchTerm('');

  // Refresh data
  const handleRefresh = () => {
    refetchSystem();
    refetchCustom();
  };

  // Drawer handlers
  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_system_role: false,
      facility_id: facilityId,
    });
    setDrawerOpen(true);
  };

  const openEditDrawer = (role: FacilityRole) => {
    // Only allow editing custom roles
    if (role.is_system_role) {
      confirm({
        title: 'System Role Protection',
        message: 'System-defined roles cannot be edited as they are required for core functionality.',
        confirmText: 'Understood',
        cancelText: "No, close.",
        variant: 'info',
        theme,
      });
      return;
    }

    setDrawerMode('edit');
    setSelectedRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      is_system_role: role.is_system_role,
      facility_id: role.facility_id,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_system_role: false,
      facility_id: facilityId,
    });
  };

  // Optimistic update helper with proper typing
  const updateCache = (roleType: RoleType, updater: (roles: FacilityRole[]) => FacilityRole[]) => {
    if (roleType === 'system' || roleType === 'all') {
      queryClient.setQueryData(facilityRoleKeys.systemRoles(), (old: any) => ({
        ...old,
        data: updater(old?.data || []),
      }));
    }
    if (roleType === 'custom' || roleType === 'all') {
      queryClient.setQueryData(facilityRoleKeys.facilitySpecific(facilityId), (old: any) => ({
        ...old,
        data: updater(old?.data || []),
      }));
    }
  };

  // Mutations
  const createMutation = useCreateFacilityRole({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateFacilityRole({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteFacilityRole({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all });
    },
  });

  // Form submission with optimistic updates
  const handleSubmit = () => {
    if (!facilityId) return;

    // Ensure code is generated from name for create mode and is never undefined
    const submitData = {
      ...formData,
      code: ensureCode(drawerMode === 'create' 
        ? (formData.code || generateRoleCode(formData.name))
        : formData.code
      )
    };

    if (drawerMode === 'create') {
      const previousCache = queryClient.getQueryData(facilityRoleKeys.facilitySpecific(facilityId));
      const now = new Date().toISOString();
      const tempId = -Date.now(); // Negative ID for optimistic update

      const optimisticRole: FacilityRole = {
        id: tempId,
        code: submitData.code,
        name: submitData.name,
        description: submitData.description || null,
        is_system_role: false,
        facility_id: facilityId,
        created_at: now,
        updated_at: now,
        facility: undefined // Optional property
      };

      // Optimistic update
      updateCache('custom', current => [optimisticRole, ...current]);

      // Execute mutation
      createMutation.mutate(submitData, {
        onError: () => {
          // Revert on error
          if (previousCache) {
            queryClient.setQueryData(facilityRoleKeys.facilitySpecific(facilityId), previousCache);
          }
        },
      });
    } else if (drawerMode === 'edit' && selectedRole && !selectedRole.is_system_role) {
      const previousCache = queryClient.getQueryData(facilityRoleKeys.facilitySpecific(facilityId));

      // Ensure code is never undefined for optimistic update
      const safeSubmitData = {
        ...submitData,
        code: ensureCode(submitData.code)
      };

      // Create properly typed optimistic role update
      const createOptimisticRole = (role: FacilityRole): FacilityRole => ({
        ...role,
        name: safeSubmitData.name,
        code: safeSubmitData.code,
        description: safeSubmitData.description || null,
        updated_at: new Date().toISOString(),
      });

      // Optimistic update with proper typing
      updateCache('custom', current =>
        current.map(role =>
          role.id === selectedRole.id
            ? createOptimisticRole(role)
            : role
        )
      );

      // Execute mutation
      updateMutation.mutate(
        {
          id: selectedRole.id,
          data: safeSubmitData as UpdateFacilityRoleRequest,
        },
        {
          onError: () => {
            // Revert on error
            if (previousCache) {
              queryClient.setQueryData(facilityRoleKeys.facilitySpecific(facilityId), previousCache);
            }
          },
        }
      );
    }
  };

  // Delete role with confirmation
  const handleDeleteRole = async (role: FacilityRole) => {
    if (role.is_system_role) {
      await confirm({
        title: 'System Role Protection',
        message: 'System-defined roles cannot be deleted as they are required for core functionality.',
        confirmText: 'Understood',
        cancelText: "No, close.",
        variant: 'info',
        theme,
      });
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete Role',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    const previousCache = queryClient.getQueryData(facilityRoleKeys.facilitySpecific(facilityId));

    // Optimistic removal
    updateCache('custom', current => current.filter(r => r.id !== role.id));

    // Execute mutation
    deleteMutation.mutate(
      { id: role.id },
      {
        onError: () => {
          // Revert on error
          if (previousCache) {
            queryClient.setQueryData(facilityRoleKeys.facilitySpecific(facilityId), previousCache);
          }
        },
      }
    );
  };

  // Validation
  const canSubmit = formData.name.trim().length > 0;

  // Render loading state
  if (isLoading && !systemRolesResponse && !customRolesResponse) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading roles..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-1 cursor-default">
              <Shield className="w-5 h-5" />
              Role Management
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              View system roles and manage custom roles for your facility
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            <button
              onClick={openCreateDrawer}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              type="button"
              data-testid="create-role-button"
            >
              <Plus className="w-4 h-4" />
              Create Custom Role
            </button>
          </div>
        </div>

        {/* Role Type Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setActiveRoleType('all')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeRoleType === 'all'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }`}
            type="button"
          >
            <Users className="w-4 h-4" />
            All Roles ({roleStats.total})
          </button>

          <button
            onClick={() => setActiveRoleType('system')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeRoleType === 'system'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }`}
            type="button"
          >
            <ShieldCheck className="w-4 h-4" />
            System Roles ({roleStats.system})
          </button>

          <button
            onClick={() => setActiveRoleType('custom')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeRoleType === 'custom'
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }`}
            type="button"
          >
            <ShieldOff className="w-4 h-4" />
            Custom Roles ({roleStats.custom})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
          <input
            type="text"
            placeholder="Search roles by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-text`}
            data-testid="role-search-input"
          />

          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
              aria-label="Clear search"
              type="button"
              data-testid="clear-search-button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Summary */}
        {searchTerm && (
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {roleStats.showing} of {activeRoleType === 'all' ? roleStats.total :
                activeRoleType === 'system' ? roleStats.system : roleStats.custom} roles
            </span>
            <button
              onClick={handleClearSearch}
              className={`text-sm flex items-center gap-1 cursor-pointer ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              type="button"
            >
              <X className="w-3 h-3" />
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Roles Table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
        {isEmpty ? (
          <div className="p-12 text-center">
            <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'
              }`} />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No matching roles found' : 'No Roles Available'}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? (
                <>
                  No roles match "<span className="font-semibold">{searchTerm}</span>"
                  <button
                    onClick={handleClearSearch}
                    className={`ml-2 px-2 py-1 rounded text-sm cursor-pointer ${isDark
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'
                      } transition-colors`}
                    type="button"
                  >
                    Clear search
                  </button>
                </>
              ) : activeRoleType === 'custom' ? (
                'Create custom roles to define specific access permissions for your facility.'
              ) : activeRoleType === 'system' ? (
                'System roles are predefined and managed by the platform.'
              ) : (
                'No roles available for display in this category.'
              )}
            </p>
            {activeRoleType === 'custom' && !searchTerm && (
              <button
                onClick={openCreateDrawer}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                type="button"
              >
                <Plus className="w-4 h-4" />
                Create Your First Custom Role
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Role Details
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Code
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Created
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {filteredRoles.map((role) => {
                  const isSystemRole = role.is_system_role;
                  const canEdit = !isSystemRole;
                  const canDelete = !isSystemRole;

                  return (
                    <tr
                      key={role.id}
                      className={`transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
                        }`}
                      data-testid={`role-row-${role.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {role.name}
                          </div>
                          {role.description && (
                            <div className={`text-xs mt-1 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {role.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className={`inline-flex px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {role.code}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.is_system_role
                            ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                            : (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')
                          }`}>
                          {role.is_system_role ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              System
                            </>
                          ) : (
                            <>
                              <ShieldOff className="w-3 h-3" />
                              Custom
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(role.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDrawer(role)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${canEdit
                                ? (isDark
                                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                                : (isDark
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              }`}
                            title={canEdit ? 'Edit role' : 'System roles cannot be edited'}
                            type="button"
                            disabled={!canEdit}
                            data-testid={`edit-role-${role.id}`}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteRole(role)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${canDelete
                                ? (isDark
                                  ? 'bg-red-900/20 hover:bg-red-900/30 text-red-300'
                                  : 'bg-red-50 hover:bg-red-100 text-red-700')
                                : (isDark
                                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              }`}
                            title={canDelete ? 'Delete role' : 'System roles cannot be deleted'}
                            type="button"
                            disabled={!canDelete}
                            data-testid={`delete-role-${role.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Role Drawer */}
      {drawerOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden ${isDark ? 'bg-black/50' : 'bg-black/30'
          }`}>
          <div className="absolute inset-0" onClick={closeDrawer} />
          <div className={`absolute right-0 top-0 h-full w-full max-w-md ${isDark ? 'bg-gray-900' : 'bg-white'
            } shadow-xl`}>
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {drawerMode === 'create' ? 'Create New Role' : 'Edit Role'}
                  </h3>
                  <button
                    onClick={closeDrawer}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    type="button"
                    data-testid="close-drawer-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {drawerMode === 'create'
                    ? 'Define a new custom role for your facility'
                    : 'Update custom role details'}
                </p>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Role Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text`}
                      placeholder="e.g., Senior Nurse"
                      data-testid="role-name-input"
                      autoFocus
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Role code will be auto-generated from this name
                    </p>
                  </div>

                  {/* Role Code (read-only in create mode, editable in edit mode) */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Role Code
                    </label>
                    {drawerMode === 'create' ? (
                      <div className={`w-full px-3 py-2 rounded-lg border ${isDark
                          ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-300 text-gray-600'
                        }`}>
                        {formData.code || 'Enter role name to generate code'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${isDark
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text`}
                        placeholder="e.g., Senior_Nurse"
                        data-testid="role-code-input"
                      />
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {drawerMode === 'create' 
                        ? 'Auto-generated unique identifier (spaces become underscores)'
                        : 'Unique identifier for the role'}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      Description
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none cursor-text`}
                      placeholder="Describe the role's purpose and permissions..."
                      data-testid="role-description-input"
                    />
                  </div>

                  {/* System Role Warning */}
                  {drawerMode === 'edit' && selectedRole?.is_system_role && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-yellow-50 border-yellow-200'
                      } border`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-600'
                          }`} />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-800'
                            }`}>
                            System Role
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-yellow-400/80' : 'text-yellow-700'
                            }`}>
                            This is a system-defined role. Editing is restricted.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={closeDrawer}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    type="button"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || createMutation.isPending || updateMutation.isPending || (drawerMode === 'edit' && selectedRole?.is_system_role)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${!canSubmit || createMutation.isPending || updateMutation.isPending || (drawerMode === 'edit' && selectedRole?.is_system_role)
                        ? (isDark
                          ? 'bg-blue-800/50 text-blue-300/50 cursor-not-allowed'
                          : 'bg-blue-400 text-white cursor-not-allowed')
                        : (isDark
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white')
                      }`}
                    type="button"
                    data-testid="submit-role-button"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                        {drawerMode === 'create' ? 'Creating...' : 'Updating...'}
                      </>
                    ) : drawerMode === 'create' ? (
                      'Create Role'
                    ) : (
                      'Update Role'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleAccessManager;