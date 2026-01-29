/**
 * ============================================================================
 * ROLE ACCESS MANAGER COMPONENT
 * ============================================================================
 *
 * Mature, facility-focused role management interface.
 * - Shows both system roles (read-only) and facility custom roles (editable)
 * - Table-based browsing with instant, on-screen search (no server-side searching)
 * - Create / Edit / Delete custom roles with optimistic UI updates
 * - Uses existing React Query hooks for all CRUD operations
 * - Respects light/dark theme and avoids unnecessary re-renders
 *
 * Notes on role code:
 * - The form does not ask for a role code.
 * - Code is generated from the role name:
 *   - spaces are converted to underscores
 *   - result is uppercased
 *   - e.g. "Senior Nurse" -> "SENIOR_NURSE"
 */

import React, { useCallback, useMemo, useState } from 'react';
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
  GetFacilityRolesResponse,
} from '../../api/team-management/types/facilityRolesTypes';

interface RoleAccessManagerProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number; // kept to preserve existing contract (no side-effects needed)
}

type RoleType = 'all' | 'system' | 'custom';
type DrawerMode = 'create' | 'edit';

type RoleFormState = {
  name: string;
  description: string;
};

const emptyForm = (): RoleFormState => ({
  name: '',
  description: '',
});

const toReadableDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

const normalize = (v: string) => v.trim().toLowerCase();

/**
 * Generate role code from name:
 * - collapse whitespace -> single underscore
 * - remove leading/trailing underscores
 * - uppercase
 */
const generateRoleCodeFromName = (name: string) => {
  const cleaned = name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.toUpperCase();
};

const isCustomRole = (role: FacilityRole) => !role.is_system_role;

export const RoleAccessManager: React.FC<RoleAccessManagerProps> = ({
  theme,
  facilityId,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  // ---------------------------------------------------------------------------
  // UI state (kept minimal to avoid cascading re-renders)
  // ---------------------------------------------------------------------------
  const [activeRoleType, setActiveRoleType] = useState<RoleType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
  const [selectedRole, setSelectedRole] = useState<FacilityRole | null>(null);
  const [form, setForm] = useState<RoleFormState>(() => emptyForm());

  // ---------------------------------------------------------------------------
  // Queries (no server-side search; we filter on UI data only)
  // ---------------------------------------------------------------------------
  const {
    data: systemRolesResponse,
    isLoading: isLoadingSystem,
    refetch: refetchSystem,
  } = useGetSystemFacilityRoles({
    staleTime: 1000 * 30,
  });

  const {
    data: customRolesResponse,
    isLoading: isLoadingCustom,
    refetch: refetchCustom,
  } = useGetFacilitySpecificRoles(facilityId, {
    enabled: !!facilityId,
    staleTime: 1000 * 30,
  });

  const systemRoles = useMemo(() => systemRolesResponse?.data ?? [], [systemRolesResponse]);
  const customRoles = useMemo(() => customRolesResponse?.data ?? [], [customRolesResponse]);

  const allRoles = useMemo(() => {
    // De-duplicate by id to stay safe if endpoints ever overlap.
    const merged = [...systemRoles, ...customRoles];
    const seen = new Set<number>();
    return merged.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [systemRoles, customRoles]);

  // ---------------------------------------------------------------------------
  // Filtering + on-screen search (memoized)
  // ---------------------------------------------------------------------------
  const filteredRoles = useMemo(() => {
    const base =
      activeRoleType === 'system'
        ? systemRoles
        : activeRoleType === 'custom'
          ? customRoles
          : allRoles;

    const q = normalize(searchTerm);
    if (!q) return base;

    return base.filter(role => {
      const hay = [
        role.name,
        role.code,
        role.description ?? '',
        role.is_system_role ? 'system' : 'custom',
      ]
        .map(v => normalize(v || ''))
        .join(' ');
      return hay.includes(q);
    });
  }, [activeRoleType, systemRoles, customRoles, allRoles, searchTerm]);

  const isLoading = isLoadingSystem || isLoadingCustom;
  const isEmpty = !isLoading && filteredRoles.length === 0;

  const roleStats = useMemo(
    () => ({
      total: allRoles.length,
      system: systemRoles.length,
      custom: customRoles.length,
      showing: filteredRoles.length,
    }),
    [allRoles.length, systemRoles.length, customRoles.length, filteredRoles.length]
  );

  // ---------------------------------------------------------------------------
  // Query keys + typed cache helpers (optimistic updates)
  // ---------------------------------------------------------------------------
  const customKey = useMemo(
    () => facilityRoleKeys.facilitySpecific(facilityId),
    [facilityId]
  );

  const patchRolesResponse = useCallback(
    (current: GetFacilityRolesResponse | undefined, nextRoles: FacilityRole[]) => {
      if (!current) return current;
      return { ...current, data: nextRoles };
    },
    []
  );

  const setCustomCache = useCallback(
    (updater: (roles: FacilityRole[]) => FacilityRole[]) => {
      queryClient.setQueryData<GetFacilityRolesResponse>(customKey, current => {
        const existing = current?.data ?? [];
        return patchRolesResponse(current, updater(existing));
      });
    },
    [patchRolesResponse, queryClient, customKey]
  );

  const invalidateAllRoleQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: facilityRoleKeys.all });
  }, [queryClient]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleClearSearch = useCallback(() => setSearchTerm(''), []);
  const handleRefresh = useCallback(() => {
    refetchSystem();
    refetchCustom();
  }, [refetchSystem, refetchCustom]);

  // Drawer handlers (stable callbacks)
  const openCreateDrawer = useCallback(() => {
    setDrawerMode('create');
    setSelectedRole(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback(
    async (role: FacilityRole) => {
      if (role.is_system_role) {
        await confirm({
          title: 'System Role Protection',
          message:
            'System roles are part of the platform’s default setup and cannot be edited.',
          confirmText: 'Understood',
          cancelText: 'Close',
          variant: 'info',
          theme,
        });
        return;
      }

      setDrawerMode('edit');
      setSelectedRole(role);
      setForm({
        name: role.name,
        description: role.description ?? '',
      });
      setDrawerOpen(true);
    },
    [confirm, theme]
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedRole(null);
    setForm(emptyForm());
  }, []);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createMutation = useCreateFacilityRole({
    onSuccess: () => {
      invalidateAllRoleQueries();
      closeDrawer();
    },
  });

  const updateMutation = useUpdateFacilityRole({
    onSuccess: () => {
      invalidateAllRoleQueries();
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteFacilityRole({
    onSuccess: () => {
      invalidateAllRoleQueries();
    },
  });

  // ---------------------------------------------------------------------------
  // Submit with optimistic updates (typed + safe rollback)
  // ---------------------------------------------------------------------------
  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  const handleSubmit = useCallback(() => {
    if (!facilityId) return;
    if (!canSubmit) return;

    const now = new Date().toISOString();
    const code = generateRoleCodeFromName(form.name);

    if (drawerMode === 'create') {
      const payload: CreateFacilityRoleRequest = {
        name: form.name.trim(),
        code,
        description: form.description.trim() ? form.description.trim() : null,
        is_system_role: false,
        facility_id: facilityId,
      };

      const prevCustom = queryClient.getQueryData<GetFacilityRolesResponse>(customKey);

      const tempId = -Math.floor(Date.now()); // negative id reserved for optimistic items

      const optimisticRole: FacilityRole = {
        id: tempId,
        code: payload.code ?? code,
        name: payload.name,
        description: payload.description ?? null,
        is_system_role: false,
        facility_id: facilityId,
        created_at: now,
        updated_at: now,
      };

      setCustomCache(current => [optimisticRole, ...current]);

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(customKey, prevCustom);
        },
      });

      return;
    }

    if (drawerMode === 'edit' && selectedRole && isCustomRole(selectedRole)) {
      const prevCustom = queryClient.getQueryData<GetFacilityRolesResponse>(customKey);

      const patch: UpdateFacilityRoleRequest = {
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : null,
      };

      setCustomCache(current =>
        current.map(r =>
          r.id === selectedRole.id
            ? {
                ...r,
                ...patch,
                // keep code stable for edits unless your backend updates it automatically;
                // we do not change it here to avoid surprise changes
                updated_at: now,
              }
            : r
        )
      );

      updateMutation.mutate(
        { id: selectedRole.id, data: patch },
        {
          onError: () => {
            queryClient.setQueryData(customKey, prevCustom);
          },
        }
      );
    }
  }, [
    facilityId,
    canSubmit,
    drawerMode,
    form.description,
    form.name,
    selectedRole,
    createMutation,
    updateMutation,
    customKey,
    queryClient,
    setCustomCache,
  ]);

  // ---------------------------------------------------------------------------
  // Delete with confirmation + optimistic removal
  // ---------------------------------------------------------------------------
  const handleDeleteRole = useCallback(
    async (role: FacilityRole) => {
      if (role.is_system_role) {
        await confirm({
          title: 'System Role Protection',
          message:
            'System roles are part of the default setup and cannot be removed.',
          confirmText: 'Understood',
          cancelText: 'Close',
          variant: 'info',
          theme,
        });
        return;
      }

      const confirmed = await confirm({
        title: 'Delete Role',
        message: `Are you sure you want to delete "${role.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      const prevCustom = queryClient.getQueryData<GetFacilityRolesResponse>(customKey);

      setCustomCache(current => current.filter(r => r.id !== role.id));

      deleteMutation.mutate(
        { id: role.id },
        {
          onError: () => {
            queryClient.setQueryData(customKey, prevCustom);
          },
        }
      );
    },
    [confirm, theme, customKey, deleteMutation, queryClient, setCustomCache]
  );

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading && !systemRolesResponse && !customRolesResponse) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading roles..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-1 cursor-default">
              <Shield className="w-5 h-5" />
              Role Management
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              View system roles and manage custom roles for your facility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isDark
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              type="button"
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
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeRoleType === 'all'
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            type="button"
          >
            <Users className="w-4 h-4" />
            All Roles ({roleStats.total})
          </button>

          <button
            onClick={() => setActiveRoleType('system')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeRoleType === 'system'
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            type="button"
          >
            <ShieldCheck className="w-4 h-4" />
            System Roles ({roleStats.system})
          </button>

          <button
            onClick={() => setActiveRoleType('custom')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeRoleType === 'custom'
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            type="button"
          >
            <ShieldOff className="w-4 h-4" />
            Custom Roles ({roleStats.custom})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search roles by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-text`}
          />

          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Clear search"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Summary */}
        {searchTerm && (
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {roleStats.showing} of{' '}
              {activeRoleType === 'all'
                ? roleStats.total
                : activeRoleType === 'system'
                  ? roleStats.system
                  : roleStats.custom}{' '}
              roles
            </span>
            <button
              onClick={handleClearSearch}
              className={`text-sm flex items-center gap-1 cursor-pointer ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
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
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {isEmpty ? (
          <div className="p-12 text-center">
            <Shield className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No matching roles found' : 'No Roles Available'}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm
                ? <>No roles match “<span className="font-semibold">{searchTerm}</span>”.</>
                : activeRoleType === 'custom'
                  ? 'Create custom roles to match how your facility works.'
                  : activeRoleType === 'system'
                    ? 'System roles are provided by the platform.'
                    : 'No roles available in this view.'}
            </p>
            {activeRoleType === 'custom' && !searchTerm && (
              <button
                onClick={openCreateDrawer}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role Details
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Code
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Created
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {filteredRoles.map((role) => {
                  const canEdit = isCustomRole(role);
                  const canDelete = isCustomRole(role);

                  return (
                    <tr
                      key={role.id}
                      className={`transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            {role.name}
                          </div>
                          {role.description ? (
                            <div className={`text-xs mt-1 max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {role.description}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <code
                          className={`inline-flex px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {role.code}
                        </code>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            role.is_system_role
                              ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                              : (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')
                          }`}
                        >
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
                          {toReadableDate(role.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDrawer(role)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              canEdit
                                ? (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                                : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                            }`}
                            title={canEdit ? 'Edit role' : 'System roles cannot be edited'}
                            type="button"
                            disabled={!canEdit}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteRole(role)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              canDelete
                                ? (isDark ? 'bg-red-900/20 hover:bg-red-900/30 text-red-300' : 'bg-red-50 hover:bg-red-100 text-red-700')
                                : (isDark ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                            }`}
                            title={canDelete ? 'Delete role' : 'System roles cannot be deleted'}
                            type="button"
                            disabled={!canDelete || deleteMutation.isPending}
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

      {/* Create/Edit Drawer */}
      {drawerOpen && (
        <div className={`fixed inset-0 z-50 overflow-hidden ${isDark ? 'bg-black/50' : 'bg-black/30'}`}>
          <div className="absolute inset-0" onClick={closeDrawer} />

          <div className={`absolute right-0 top-0 h-full w-full max-w-md ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-xl`}>
            <div className="flex flex-col h-full">
              {/* Header */}
             <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {drawerMode === 'create' ? 'Create New Role' : 'Edit Role'}
              </h3>
              <button
                onClick={closeDrawer}
                disabled={createMutation.isPending || updateMutation.isPending}
                className={`p-2 rounded-lg transition-colors ${
                  createMutation.isPending || updateMutation.isPending
                    ? isDark 
                      ? 'text-gray-600 cursor-not-allowed' 
                      : 'text-gray-400 cursor-not-allowed'
                    : isDark 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer'
                }`}
                type="button"
                title={
                  createMutation.isPending || updateMutation.isPending 
                    ? 'Please wait while saving...' 
                    : 'Close'
                }
              >
                <X className="w-5 h-5" />
              </button>
            </div>

              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {drawerMode === 'create'
                  ? 'Create a custom role for your facility. The role code will be created automatically from the name.'
                  : 'Update this custom role. The displayed code remains stable.'}
              </p>
            </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Role Name <span className={isDark ? 'text-red-300' : 'text-red-600'}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text`}
                      placeholder="e.g., Senior Nurse"
                    />

                    {/* Friendly preview (no extra form field) */}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Code preview: <span className="font-semibold">{form.name.trim() ? generateRoleCodeFromName(form.name) : '—'}</span>
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none cursor-text`}
                      placeholder="Describe the role’s purpose..."
                    />
                  </div>

                  {drawerMode === 'edit' && selectedRole?.is_system_role && (
                    <div
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                            System Role
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-yellow-400/80' : 'text-yellow-700'}`}>
                            System roles are protected and cannot be edited here.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
             <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={closeDrawer}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      createMutation.isPending || updateMutation.isPending
                        ? isDark 
                          ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-100/50 text-gray-400 cursor-not-allowed'
                        : isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer'
                    }`}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      !canSubmit ||
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      (drawerMode === 'edit' && !!selectedRole?.is_system_role)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !canSubmit ||
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      (drawerMode === 'edit' && !!selectedRole?.is_system_role)
                        ? isDark 
                          ? 'bg-blue-800/30 text-blue-400/50 cursor-not-allowed' 
                          : 'bg-blue-300 text-blue-100 cursor-not-allowed'
                        : isDark 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    }`}
                    type="button"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
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
                <div className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Changes appear immediately while saving in the background. If saving fails, the previous view is restored.
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
