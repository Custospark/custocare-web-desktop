/**
 * ============================================================================
 * FACILITY SPACE MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Enterprise-grade facility space management with comprehensive CRUD operations,
 * optimistic UI updates, client-side filtering, and theme-aware design.
 *
 * @module FacilitySpace
 * @description Full-featured space management with:
 * - Complete CRUD operations (Create, Read, Update, Delete)
 * - Optimistic UI updates for instant feedback
 * - Client-side search and filtering
 * - Responsive grid/list view modes
 * - Theme-aware styling (dark/light)
 * - Type-safe operations with full TypeScript support
 * - Confirm dialogs for destructive actions
 * - Loading skeletons and error states
 *
 * @requires React Query for data fetching and caching
 * @requires Redux for theme and active context management
 */

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Grid3x3,
  List,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  Layers,
  Activity,
  Box,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building,
} from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetFacilitySpaces,
  useCreateFacilitySpace,
  useUpdateFacilitySpace,
  useDeleteFacilitySpace,
  facilitySpaceKeys,
} from '../../api/facility-space/FacilitySpaceQueries';
import {
  type FacilitySpace as FacilitySpaceType_,
  type FacilitySpaceType,
  type CreateFacilitySpaceRequest,
  type UpdateFacilitySpaceRequest,
  type FacilitySpaceFilters,
  type GetFacilitySpacesResponse,
  SpaceStatus,
} from '../../api/facility-space/FacilitySpaceTypes';
import { cn } from '../../../../../shared/types/cn';

/* -------------------------------------------------------------------------- */
/*                                COMPONENT PROPS                             */
/* -------------------------------------------------------------------------- */

interface FacilitySpaceProps {
  theme: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                                FORM DATA TYPE                              */
/* -------------------------------------------------------------------------- */

interface FacilitySpaceFormData {
  facility_id: number | null;
  name: string;
  type: FacilitySpaceType | '';
  floor: string;
  building: string;
  is_active: boolean;
}

type FacilitySpace = FacilitySpaceType_;

/* -------------------------------------------------------------------------- */
/*                              TYPE/STATUS OPTIONS                           */
/* -------------------------------------------------------------------------- */

const SPACE_TYPE_OPTIONS: Array<{
  value: FacilitySpaceType;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  { value: 'consultation' as FacilitySpaceType, label: 'Consultation Room', icon: Activity, color: 'text-blue-500' },
  { value: 'triage' as FacilitySpaceType, label: 'Triage', icon: AlertCircle, color: 'text-red-500' },
  { value: 'lab' as FacilitySpaceType, label: 'Laboratory', icon: Box, color: 'text-purple-500' },
  { value: 'theatre' as FacilitySpaceType, label: 'Operating Theatre', icon: Activity, color: 'text-orange-500' },
  { value: 'ward' as FacilitySpaceType, label: 'Ward', icon: Building2, color: 'text-green-500' },
  { value: 'pharmacy' as FacilitySpaceType, label: 'Pharmacy', icon: Box, color: 'text-cyan-500' },
];

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

const getEmptyFormData = (facilityId: number | null): FacilitySpaceFormData => ({
  facility_id: facilityId,
  name: '',
  type: '',
  floor: '',
  building: '',
  is_active: true,
});

const getSpaceTypeLabel = (type: FacilitySpaceType): string => {
  const option = SPACE_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
};

const getSpaceTypeIcon = (type: FacilitySpaceType): React.ElementType => {
  const option = SPACE_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.icon || Box;
};

const getSpaceTypeColor = (type: FacilitySpaceType): string => {
  const option = SPACE_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.color || 'text-gray-500';
};

/* -------------------------------------------------------------------------- */
/*                            SAFETY HELPERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Ensures we never call .toLowerCase() on undefined/null/non-string.
 * (Keeps filtering resilient without weakening types.)
 */
const safeLower = (value: string | null | undefined): string => (value ?? '').toLowerCase();

/**
 * Safe date formatting (prevents "Invalid time value" crashes).
 */
const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Narrow unknown errors to a readable message without using `any`.
 */
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const FacilitySpace: React.FC<FacilitySpaceProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  // Redux state
  const activeFacilityId = useAppSelector(state => state.activeContext.activeFacilityId);

  /* ---------------------------- Local State ------------------------------- */

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FacilitySpaceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedSpace, setSelectedSpace] = useState<FacilitySpace | null>(null);
  const [formData, setFormData] = useState<FacilitySpaceFormData>(() =>
    getEmptyFormData(activeFacilityId ?? null)
  );

  // Expanded rows (for list view details)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  /* ---------------------------- API Queries ------------------------------- */

  const filters: FacilitySpaceFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [activeFacilityId, typeFilter, statusFilter]
  );

  const listQueryKey = useMemo(() => facilitySpaceKeys.list(filters), [filters]);

  const { data: spacesResponse, isLoading, error, refetch } = useGetFacilitySpaces(filters, {
    enabled: !!activeFacilityId,
    staleTime: 1000 * 30,
  });

  /**
   * Defensive normalization:
   * - `spacesResponse?.data` is already typed as FacilitySpace[] by GetFacilitySpacesResponse
   * - but we still guard to avoid runtime crashes if API misbehaves.
   */
  const spaces: FacilitySpace[] = useMemo(() => {
    const data = spacesResponse?.data;
    return Array.isArray(data) ? data : [];
  }, [spacesResponse]);

  /* ------------------------ Client-Side Filtering ------------------------- */

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    if (!term) return spaces;

    return spaces.filter(space => {
      // space is strongly typed, but keep runtime safe for unexpected nullish values
      const name = safeLower(space?.name);
      const typeLabel = safeLower(space?.type_label);
      const floor = safeLower(space?.floor ?? undefined);
      const building = safeLower(space?.building ?? undefined);
      const fullLocation = safeLower(space?.full_location ?? undefined);

      return (
        name.includes(term) ||
        typeLabel.includes(term) ||
        floor.includes(term) ||
        building.includes(term) ||
        fullLocation.includes(term)
      );
    });
  }, [spaces, searchTerm]);

  /* ---------------------------- Mutations --------------------------------- */

  const createMutation = useCreateFacilitySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateFacilitySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteFacilitySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all });
      setSelectedSpace(null);
    },
  });

  /* ------------------------ Cache Update Helpers -------------------------- */

  const setListCache = (
    updater: (current: GetFacilitySpacesResponse | undefined) => GetFacilitySpacesResponse | undefined
  ) => {
    queryClient.setQueryData<GetFacilitySpacesResponse>(listQueryKey, updater);
  };

  /* -------------------------- Drawer Handlers ----------------------------- */

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedSpace(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
    setDrawerOpen(true);
  };

  const openEditDrawer = (space: FacilitySpace) => {
    // keep runtime safe
    if (!space) return;

    setDrawerMode('edit');
    setSelectedSpace(space);
    setFormData({
      facility_id: space.facility_id ?? null,
      name: space.name ?? '',
      type: space.type ?? '',
      floor: space.floor ?? '',
      building: space.building ?? '',
      is_active: space.is_active ?? true,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedSpace(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
  };

  /* -------------------------- Form Submission ----------------------------- */

  const handleSubmit = () => {
    const facilityId = formData.facility_id;
    const name = formData.name.trim();
    const type = formData.type;

    if (!facilityId || !name || !type) return;

    const payload: CreateFacilitySpaceRequest = {
      facility_id: facilityId,
      name,
      type: type as FacilitySpaceType,
      floor: formData.floor.trim() || undefined,
      building: formData.building.trim() || undefined,
      is_active: formData.is_active,
    };

    if (drawerMode === 'create') {
      // Optimistic update for create
      const previousData = queryClient.getQueryData<GetFacilitySpacesResponse>(listQueryKey);
      const tempId = Date.now();
      const now = new Date().toISOString();

      const optimisticSpace: FacilitySpace = {
        id: tempId,
        facility_id: payload.facility_id,
        name: payload.name,
        type: payload.type,
        type_label: getSpaceTypeLabel(payload.type),
        floor: payload.floor ?? null,
        building: payload.building ?? null,
        is_active: payload.is_active ?? true,
        status: payload.is_active ? SpaceStatus.ACTIVE : SpaceStatus.INACTIVE,
        status_label: payload.is_active ? 'Active' : 'Inactive',
        created_at: now,
        updated_at: now,
        full_location: [payload.building, payload.floor].filter(Boolean).join(', ') || null,
        is_available: true,
      };

      setListCache(current => {
        if (!current || !Array.isArray(current.data)) return current;
        return { ...current, data: [optimisticSpace, ...current.data] };
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previousData);
        },
      });
    } else if (drawerMode === 'edit' && selectedSpace?.id != null) {
      // Optimistic update for edit
      const previousData = queryClient.getQueryData<GetFacilitySpacesResponse>(listQueryKey);

      setListCache(current => {
        if (!current || !Array.isArray(current.data)) return current;
        return {
          ...current,
          data: current.data.map(space =>
            space.id === selectedSpace.id
              ? {
                  ...space,
                  ...payload,
                  type_label: getSpaceTypeLabel(payload.type),
                  status: payload.is_active ? SpaceStatus.ACTIVE : SpaceStatus.INACTIVE,
                  status_label: payload.is_active ? 'Active' : 'Inactive',
                  full_location: [payload.building, payload.floor].filter(Boolean).join(', ') || null,
                  updated_at: new Date().toISOString(),
                }
              : space
          ),
        };
      });

      updateMutation.mutate(
        { id: selectedSpace.id, data: payload as UpdateFacilitySpaceRequest },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previousData);
          },
        }
      );
    }
  };

  /* -------------------------- Delete Handler ------------------------------ */

  const handleDelete = async (space: FacilitySpace) => {
    if (!space?.id) return;

    const confirmed = await confirm({
      title: 'Delete Facility Space',
      message: `Are you sure you want to delete "${space.name ?? ''}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    const previousData = queryClient.getQueryData<GetFacilitySpacesResponse>(listQueryKey);

    setListCache(current => {
      if (!current || !Array.isArray(current.data)) return current;
      return { ...current, data: current.data.filter(s => s.id !== space.id) };
    });

    deleteMutation.mutate(
      { id: space.id },
      {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previousData);
        },
      }
    );
  };

  /* ------------------------- Toggle Handlers ------------------------------ */

  const toggleExpand = (id: number) => {
    if (!id) return;
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /* --------------------------- Validation --------------------------------- */

  const canSubmit = !!formData.facility_id && !!formData.name.trim() && !!formData.type;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /* ---------------------------- Color Tokens ------------------------------ */

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-600' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  /* --------------------------- Guard Clauses ------------------------------ */

  if (!activeFacilityId) {
    return (
      <div className={cn('rounded-xl p-8 text-center', colors.bg.secondary)}>
        <Building2 className={cn('w-12 h-12 mx-auto mb-4', colors.text.tertiary)} />
        <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>No Facility Selected</h3>
        <p className={colors.text.secondary}>
          Please select a facility from the sidebar to manage facility spaces.
        </p>
      </div>
    );
  }

  if (isLoading && !spacesResponse) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading facility spaces..." />;
  }

  /* ---------------------------- Render JSX -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>Clinical Space Management
</h1>
            <p className={colors.text.secondary}>
              Manage consultation rooms, wards, labs, and other facility spaces
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className={cn(
                'p-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.bg.hover
              )}
              title="Refresh"
            >
              <RefreshCw className={cn('w-5 h-5', colors.text.secondary)} />
            </button>

            <button
              onClick={openCreateDrawer}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                colors.accent.primary,
                colors.accent.hover,
                colors.accent.text
              )}
            >
              <Plus className="w-5 h-5" />
              <span>Add Space</span>
            </button>
          </div>
        </div>

       {/* Statistics Cards - Enhanced with gradients, icons, and better visual hierarchy */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {/* Total Spaces Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2', // Thicker border
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className={cn(
            'flex items-center justify-between mb-3'
          )}>
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            )}>
              <Building2 className={cn(
                'w-6 h-6',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              Total
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {spaces.length}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Total Spaces
          </p>
          
          {/* Trend indicator */}
          <div className="absolute bottom-3 right-3">
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )}>
              <span>+{spaces.length > 0 ? Math.floor(spaces.length * 0.2) : 0}%</span>
              <ChevronUp className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Active Spaces Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20' 
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110' 
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            )}>
              <CheckCircle2 className={cn(
                'w-6 h-6',
                isDark ? 'text-green-400' : 'text-green-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30'
            )}>
              Active
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {spaces.filter(s => s.is_active).length}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Active Spaces
          </p>
          
          {/* Progress bar */}
          <div className="absolute bottom-3 right-3 w-16">
            <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${spaces.length > 0 ? (spaces.filter(s => s.is_active).length / spaces.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Inactive Spaces Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20' 
            : 'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-red-500/10 group-hover:opacity-100' : 'bg-red-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110' 
                : 'bg-red-100 group-hover:bg-red-200 group-hover:scale-110'
            )}>
              <XCircle className={cn(
                'w-6 h-6',
                isDark ? 'text-red-400' : 'text-red-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/30'
            )}>
              Inactive
            </span>
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {spaces.filter(s => !s.is_active).length}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Inactive Spaces
          </p>
          
          {/* Warning indicator if high inactive count */}
          {spaces.filter(s => !s.is_active).length > 3 && (
            <div className="absolute top-3 right-3">
              <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Filtered Spaces Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20' 
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          {/* Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110' 
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            )}>
              <Filter className={cn(
                'w-6 h-6',
                isDark ? 'text-purple-400' : 'text-purple-600'
              )} />
            </div>
            {searchTerm && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
                Filtered
              </span>
            )}
          </div>
          
          {/* Value */}
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {filteredSpaces.length}
          </p>
          
          {/* Label */}
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Filtered Results
          </p>
          
          {/* Search indicator */}
          {searchTerm && (
            <div className="absolute bottom-3 right-3">
              <div className={cn(
                'text-xs px-2 py-1 rounded-full',
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              )}>
                Search: {searchTerm}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Filters Bar */}
      <div className={cn('rounded-xl p-4 border', colors.border.primary, colors.bg.elevated)}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5', colors.text.tertiary)} />
              <input
                type="text"
                placeholder="Search clincial spaces and rooms..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors cursor-text',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer',
              colors.border.primary,
              colors.bg.primary,
              colors.bg.hover
            )}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle */}
          <div className={cn('flex items-center gap-1 p-1 rounded-lg border', colors.border.primary, colors.bg.secondary)}>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors cursor-pointer',
                viewMode === 'list' ? colors.accent.primary + ' text-white' : colors.bg.hover
              )}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors cursor-pointer',
                viewMode === 'grid' ? colors.accent.primary + ' text-white' : colors.bg.hover
              )}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t"
            style={{ borderColor: colors.border.primary.split(' ')[0].replace('border-', '') }}
          >
            {/* Type Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Space Type
              </label>
              <select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTypeFilter(e.target.value as FacilitySpaceType | 'all')
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Types</option>
                {SPACE_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover
                )}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500">Error Loading Spaces</p>
              <p className={cn('text-sm', colors.text.secondary)}>{getErrorMessage(error)}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSpaces.length === 0 && (
        <div className={cn('rounded-xl p-12 text-center', colors.bg.secondary)}>
          <Building2 className={cn('w-16 h-16 mx-auto mb-4', colors.text.tertiary)} />
          <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No Spaces Found' : 'No Spaces Yet'}
          </h3>
          <p className={cn('mb-6', colors.text.secondary)}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search criteria'
              : 'Get started by creating your first facility space'}
          </p>
          {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={openCreateDrawer}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer',
                colors.accent.primary,
                colors.accent.hover,
                colors.accent.text
              )}
            >
              <Plus className="w-5 h-5" />
              <span>Add First Space</span>
            </button>
          )}
        </div>
      )}

      {/* List View */}
      {!isLoading && filteredSpaces.length > 0 && viewMode === 'list' && (
        <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
          {/* Table Header */}
          <div className={cn('grid grid-cols-12 gap-4 p-4 font-medium border-b', colors.bg.secondary, colors.border.primary)}>
            <div className="col-span-3">Space Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Building</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className={colors.bg.elevated}>
            {filteredSpaces.map(space => {
              const isExpanded = expandedRows.has(space.id);
              const Icon = getSpaceTypeIcon(space.type);

              const created = safeDate(space.created_at);
              const updated = safeDate(space.updated_at);

              return (
                <div key={space.id} className={cn('border-b last:border-b-0', colors.border.primary)}>
                  {/* Main Row */}
                  <div
                    className={cn(
                      'grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer',
                      colors.bg.hover
                    )}
                    onClick={() => toggleExpand(space.id)}
                  >
                    {/* Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className={cn('font-medium', colors.text.primary)}>{space.name ?? '—'}</span>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', getSpaceTypeColor(space.type))} />
                        <span className={colors.text.secondary}>
                          {space.type_label ?? getSpaceTypeLabel(space.type)}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        <Building className={cn('w-4 h-4', colors.text.tertiary)} />
                        <span className={colors.text.secondary}>
                          {space.building ?? 'Not specified'}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      {space.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-sm">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          openEditDrawer(space);
                        }}
                        className={cn(
                          'p-2 rounded-lg border transition-colors cursor-pointer',
                          colors.border.primary,
                          colors.bg.hover
                        )}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          void handleDelete(space);
                        }}
                        className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className={cn('p-4 border-t', colors.bg.secondary, colors.border.primary)}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Building</p>
                          <p className={colors.text.primary}>{space.building ?? '—'}</p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Floor</p>
                          <p className={colors.text.primary}>{space.floor ?? '—'}</p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Created</p>
                          <p className={colors.text.primary}>{created ? created.toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Updated</p>
                          <p className={colors.text.primary}>{updated ? updated.toLocaleDateString() : '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && filteredSpaces.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map(space => {
            const Icon = getSpaceTypeIcon(space.type);

            return (
              <div
                key={space.id}
                className={cn(
                  'rounded-xl p-6 border transition-all cursor-pointer',
                  colors.border.primary,
                  colors.bg.elevated,
                  'hover:shadow-lg hover:scale-105'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', colors.bg.secondary)}>
                      <Icon className={cn('w-6 h-6', getSpaceTypeColor(space.type))} />
                    </div>
                    <div>
                      <h3 className={cn('font-semibold', colors.text.primary)}>{space.name ?? '—'}</h3>
                      <p className={cn('text-sm', colors.text.secondary)}>
                        {space.type_label ?? getSpaceTypeLabel(space.type)}
                      </p>
                    </div>
                  </div>

                  {space.is_active ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {/* Location */}
                <div className={cn('mb-4 p-3 rounded-lg', colors.bg.secondary)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={cn('text-sm', colors.text.secondary)}>
                      {space.building ?? 'No building'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={cn('text-sm', colors.text.secondary)}>
                      {space.floor ?? 'No floor'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDrawer(space)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                      colors.border.primary,
                      colors.bg.hover
                    )}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => void handleDelete(space)}
                    className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className={cn(
              'w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl',
              colors.bg.elevated
            )}
          >
            {/* Drawer Header */}
            <div className={cn('sticky top-0 p-6 border-b z-10', colors.bg.elevated, colors.border.primary)}>
              <h2 className={cn('text-xl font-bold', colors.text.primary)}>
                {drawerMode === 'create' ? 'Create New Space' : 'Edit Space'}
              </h2>
              <p className={colors.text.secondary}>
                {drawerMode === 'create' ? 'Add a new space to your facility' : `Editing: ${selectedSpace?.name ?? ''}`}
              </p>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Space Name */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Space Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Consultation Room 101"
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary,
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>

              {/* Space Type */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Space Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData(prev => ({ ...prev, type: e.target.value as FacilitySpaceType }))
                  }
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary
                  )}
                >
                  <option value="">Select type...</option>
                  {SPACE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building & Floor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                    Building
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, building: e.target.value }))
                    }
                    placeholder="e.g., Main Building"
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                      colors.border.primary,
                      colors.bg.primary,
                      colors.text.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, floor: e.target.value }))
                    }
                    placeholder="e.g., 1st Floor"
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                      colors.border.primary,
                      colors.bg.primary,
                      colors.text.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="is_active" className={cn('font-medium cursor-pointer', colors.text.primary)}>
                  Active
                </label>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={cn('sticky bottom-0 p-6 border-t flex items-center justify-end gap-3', colors.bg.elevated, colors.border.primary)}>
              <button
                onClick={closeDrawer}
                disabled={isSubmitting}
                className={cn(
                  'px-6 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover,
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                  colors.accent.primary,
                  colors.accent.hover,
                  colors.accent.text,
                  (!canSubmit || isSubmitting) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Saving...' : drawerMode === 'create' ? 'Create Space' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
