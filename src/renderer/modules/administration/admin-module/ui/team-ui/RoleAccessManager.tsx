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
  ChevronUp,
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';

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
  const [isFocused, setIsFocused] = useState(false);
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
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
          'group'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />

        <div className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                  : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
              )}>
                <Shield className={cn(
                  'w-6 h-6',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Role Management
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  )}>
                    {roleStats.total} roles
                  </span>
                </h2>
                <p className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  View system roles and manage custom roles for your facility.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                  'cursor-pointer'
                )}
                type="button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateDrawer}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5 cursor-pointer'
                )}
                type="button"
              >
                <Plus className="w-4 h-4" />
                Create Custom Role
              </motion.button>
            </div>
          </div>

          {/* Role Type Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveRoleType('all')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'border-2 transition-all',
                activeRoleType === 'all'
                  ? isDark
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                'cursor-pointer'
              )}
              type="button"
            >
              <Users className="w-4 h-4" />
              All Roles ({roleStats.total})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveRoleType('system')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'border-2 transition-all',
                activeRoleType === 'system'
                  ? isDark
                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20'
                    : 'bg-green-600 border-green-400 text-white shadow-lg shadow-green-500/20'
                  : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                'cursor-pointer'
              )}
              type="button"
            >
              <ShieldCheck className="w-4 h-4" />
              System Roles ({roleStats.system})
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveRoleType('custom')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'border-2 transition-all',
                activeRoleType === 'custom'
                  ? isDark
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                'cursor-pointer'
              )}
              type="button"
            >
              <ShieldOff className="w-4 h-4" />
              Custom Roles ({roleStats.custom})
            </motion.button>
          </div>

          {/* Animated Search Bar */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-lg z-0"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #8b5cf6, #3b82f6)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                duration: isFocused ? 2 : 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                  isFocused 
                    ? 'text-blue-500' 
                    : isDark 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                )}
              />
              <input
                type="text"
                placeholder="Search roles by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  'w-full pl-10 pr-10 py-3 text-sm border-transparent',
                  'focus:outline-none focus:ring-0',
                  'transition-colors placeholder:text-sm',
                  isDark
                    ? 'bg-gray-900 text-white placeholder-gray-500'
                    : 'bg-white text-gray-900 placeholder-gray-400'
                )}
              />

              {searchTerm && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={handleClearSearch}
                  className={cn(
                    'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full',
                    'transition-colors cursor-pointer',
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <AnimatePresence>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-3 flex items-center justify-between"
              >
                <span className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Showing {roleStats.showing} of{' '}
                  {activeRoleType === 'all'
                    ? roleStats.total
                    : activeRoleType === 'system'
                      ? roleStats.system
                      : roleStats.custom}{' '}
                  roles
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearSearch}
                  className={cn(
                    'text-sm flex items-center gap-1 px-2 py-1 rounded-lg',
                    'border-2 transition-all',
                    isDark
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    'cursor-pointer'
                  )}
                  type="button"
                >
                  <X className="w-3 h-3" />
                  Clear search
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Roles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
        )}
      >
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <div className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              <Shield className={cn(
                'w-10 h-10',
                isDark ? 'text-gray-600' : 'text-gray-400'
              )} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {searchTerm ? 'No matching roles found' : 'No Roles Available'}
            </h3>
            <p className={cn(
              'text-sm mb-6 max-w-md mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {searchTerm
                ? <>No roles match "<span className="font-semibold">{searchTerm}</span>".</>
                : activeRoleType === 'custom'
                  ? 'Create custom roles to match how your facility works.'
                  : activeRoleType === 'system'
                    ? 'System roles are provided by the platform.'
                    : 'No roles available in this view.'}
            </p>
            {activeRoleType === 'custom' && !searchTerm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateDrawer}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5 cursor-pointer'
                )}
                type="button"
              >
                <Plus className="w-4 h-4" />
                Create Your First Custom Role
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={cn(
                  'border-b-2',
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                )}>
                  <th className={cn(
                    'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Role Details
                    </div>
                  </th>
                  <th className={cn(
                    'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">Code</code>
                    </div>
                  </th>
                  <th className={cn(
                    'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Type
                    </div>
                  </th>
                  <th className={cn(
                    'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Created
                    </div>
                  </th>
                  <th className={cn(
                    'px-6 py-4 text-left text-xs font-medium uppercase tracking-wider',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={cn(
                'divide-y-2',
                isDark ? 'divide-gray-800' : 'divide-gray-200'
              )}>
                {filteredRoles.map((role, index) => {
                  const canEdit = isCustomRole(role);
                  const canDelete = isCustomRole(role);

                  return (
                    <motion.tr
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'transition-all duration-200 group/row',
                        isDark 
                          ? 'hover:bg-gray-800/60 hover:shadow-inner' 
                          : 'hover:bg-gray-50/80 hover:shadow-sm'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className={cn(
                            'text-sm font-semibold',
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          )}>
                            {role.name}
                          </div>
                          {role.description ? (
                            <div className={cn(
                              'text-xs mt-1 max-w-md',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {role.description}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <code
                          className={cn(
                            'inline-flex px-2 py-1 rounded-lg text-xs font-mono',
                            'border-2 transition-all',
                            isDark 
                              ? 'bg-gray-800/80 border-gray-700 text-gray-300 group-hover/row:border-blue-500/30' 
                              : 'bg-gray-100 border-gray-200 text-gray-700 group-hover/row:border-blue-300'
                          )}
                        >
                          {role.code}
                        </code>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            'border-2 transition-all',
                            role.is_system_role
                              ? isDark
                                ? 'bg-green-900/20 border-green-500/30 text-green-300 group-hover/row:bg-green-900/30 group-hover/row:border-green-500/50'
                                : 'bg-green-50 border-green-200 text-green-700 group-hover/row:bg-green-100 group-hover/row:border-green-300'
                              : isDark
                                ? 'bg-blue-900/20 border-blue-500/30 text-blue-300 group-hover/row:bg-blue-900/30 group-hover/row:border-blue-500/50'
                                : 'bg-blue-50 border-blue-200 text-blue-700 group-hover/row:bg-blue-100 group-hover/row:border-blue-300'
                          )}
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
                        <div className={cn(
                          'text-sm',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {toReadableDate(role.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={canEdit ? { scale: 1.05 } : {}}
                            whileTap={canEdit ? { scale: 0.95 } : {}}
                            onClick={() => openEditDrawer(role)}
                            className={cn(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                              'border-2 transition-all',
                              canEdit
                                ? isDark
                                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 cursor-pointer'
                                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 cursor-pointer'
                                : isDark
                                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                            )}
                            title={canEdit ? 'Edit role' : 'System roles cannot be edited'}
                            type="button"
                            disabled={!canEdit}
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </motion.button>

                          <motion.button
                            whileHover={canDelete ? { scale: 1.05 } : {}}
                            whileTap={canDelete ? { scale: 0.95 } : {}}
                            onClick={() => handleDeleteRole(role)}
                            className={cn(
                              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                              'border-2 transition-all',
                              canDelete
                                ? isDark
                                  ? 'bg-red-900/20 border-red-500/30 text-red-300 hover:bg-red-900/30 hover:border-red-500/50 cursor-pointer'
                                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 cursor-pointer'
                                : isDark
                                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50',
                              deleteMutation.isPending && 'opacity-50'
                            )}
                            title={canDelete ? 'Delete role' : 'System roles cannot be deleted'}
                            type="button"
                            disabled={!canDelete || deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>

              {/* Table Footer */}
              <tfoot className={cn(
                'border-t-2',
                isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'
              )}>
                <tr>
                  <td colSpan={5} className="px-6 py-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Showing {filteredRoles.length} of {roleStats.total} roles
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          System: {roleStats.system}
                        </span>
                        <span className={cn(
                          'w-1 h-1 rounded-full',
                          isDark ? 'bg-gray-600' : 'bg-gray-300'
                        )} />
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Custom: {roleStats.custom}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                'absolute right-0 top-0 h-full w-full max-w-md',
                'border-l-2',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30' 
                  : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200'
              )}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={cn(
                  'relative p-6 border-b-2',
                  isDark ? 'border-gray-700' : 'border-gray-200'
                )}>
                  {/* Background decoration */}
                  <div className={cn(
                    'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30',
                    isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
                  )} />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-xl',
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                      )}>
                        {drawerMode === 'create' ? (
                          <Plus className={cn(
                            'w-5 h-5',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        ) : (
                          <Edit className={cn(
                            'w-5 h-5',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">
                          {drawerMode === 'create' ? 'Create New Role' : 'Edit Role'}
                        </h3>
                        <p className={cn(
                          'text-sm mt-1',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {drawerMode === 'create'
                            ? 'Create a custom role for your facility.'
                            : 'Update this custom role.'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeDrawer}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        createMutation.isPending || updateMutation.isPending
                          ? isDark 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-400 cursor-not-allowed'
                          : isDark 
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-white cursor-pointer' 
                            : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer'
                      )}
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <label className={cn(
                        'block text-sm font-medium mb-2',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Shield className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )} />
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 rounded-lg border-2',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            'transition-all',
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          )}
                          placeholder="e.g., Senior Nurse"
                        />
                      </div>

                      {/* Friendly preview */}
                      <p className={cn(
                        'text-xs mt-2 flex items-center gap-1',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        <code className="text-blue-500">Code preview:</code>
                        <span className="font-mono font-semibold">
                          {form.name.trim() ? generateRoleCodeFromName(form.name) : '—'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className={cn(
                        'block text-sm font-medium mb-2',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg border-2',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'resize-none transition-all',
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        )}
                        placeholder="Describe the role's purpose..."
                      />
                    </div>

                    {drawerMode === 'edit' && selectedRole?.is_system_role && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'p-4 rounded-xl border-2',
                          isDark
                            ? 'bg-yellow-900/20 border-yellow-500/30'
                            : 'bg-yellow-50 border-yellow-200'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={cn(
                            'w-5 h-5 mt-0.5',
                            isDark ? 'text-yellow-400' : 'text-yellow-600'
                          )} />
                          <div>
                            <p className={cn(
                              'text-sm font-medium',
                              isDark ? 'text-yellow-300' : 'text-yellow-800'
                            )}>
                              System Role Protection
                            </p>
                            <p className={cn(
                              'text-xs mt-1',
                              isDark ? 'text-yellow-400/80' : 'text-yellow-700'
                            )}>
                              System roles are protected and cannot be edited here.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className={cn(
                  'p-6 border-t-2',
                  isDark ? 'border-gray-700' : 'border-gray-200'
                )}>
                  <div className="flex items-center justify-between gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={closeDrawer}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
                        'border-2 transition-all',
                        createMutation.isPending || updateMutation.isPending
                          ? isDark 
                            ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-100/50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : isDark 
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 cursor-pointer' 
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 cursor-pointer'
                      )}
                      type="button"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={
                        !canSubmit ||
                        createMutation.isPending ||
                        updateMutation.isPending ||
                        (drawerMode === 'edit' && !!selectedRole?.is_system_role)
                      }
                      className={cn(
                        'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
                        'border-2 transition-all',
                        !canSubmit ||
                        createMutation.isPending ||
                        updateMutation.isPending ||
                        (drawerMode === 'edit' && !!selectedRole?.is_system_role)
                          ? isDark 
                            ? 'bg-blue-800/30 border-blue-700/30 text-blue-400/50 cursor-not-allowed' 
                            : 'bg-blue-300/50 border-blue-200 text-blue-100 cursor-not-allowed'
                          : isDark 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer' 
                            : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer',
                        'transform hover:-translate-y-0.5'
                      )}
                      type="button"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>
                            {drawerMode === 'create' ? 'Creating...' : 'Updating...'}
                          </span>
                        </div>
                      ) : drawerMode === 'create' ? (
                        'Create Role'
                      ) : (
                        'Update Role'
                      )}
                    </motion.button>
                  </div>
                  <div className={cn(
                    'mt-4 text-xs text-center',
                    isDark ? 'text-gray-500' : 'text-gray-500'
                  )}>
                    Changes appear immediately while saving in the background.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleAccessManager;