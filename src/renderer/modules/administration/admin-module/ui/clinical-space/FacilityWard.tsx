/**
 * ============================================================================
 * FACILITY WARD MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Enterprise-grade facility ward management with comprehensive CRUD operations,
 * optimistic UI updates, client-side filtering, and theme-aware design.
 *
 * @module FacilityWard
 * @description Full-featured ward management with:
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
  Activity,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building,
  Bed,
  Users,
  Clock,
  Stethoscope,
  Baby,
  Shield,
  Eye,
} from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetWards,
  useCreateWard,
  useUpdateWard,
  useDeleteWard,
  wardKeys,
} from  '../../api/wards/wardQueries';
import {
  type Ward,
  type CreateWardRequest,
  type UpdateWardRequest,
  type WardFilters,
  WardStatus,
  WardType,
  SexRestriction,
  AgeGroup,
} from '../../api/wards/wardTypes';
import { cn } from '../../../../../shared/types/cn';

/* -------------------------------------------------------------------------- */
/*                                COMPONENT PROPS                             */
/* -------------------------------------------------------------------------- */

interface FacilityWardProps {
  theme: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                                FORM DATA TYPE                              */
/* -------------------------------------------------------------------------- */

interface FacilityWardFormData {
  facility_id: number | null;
  name: string;
  code: string;
  ward_type: WardType | '';
  building: string;
  floor: string;
  status: WardStatus;
  capacity_declared: string;
  capacity_operational: string;
  sex_restriction: SexRestriction;
  age_group: AgeGroup;
  note: string;
}

/* -------------------------------------------------------------------------- */
/*                            TYPE/STATUS OPTIONS                             */
/* -------------------------------------------------------------------------- */

const WARD_TYPE_OPTIONS: Array<{
  value: WardType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = [
  { value: WardType.MEDICAL, label: 'Medical Ward', icon: Stethoscope, color: 'text-blue-500', description: 'General medical patients' },
  { value: WardType.SURGICAL, label: 'Surgical Ward', icon: Activity, color: 'text-red-500', description: 'Post-operative care' },
  { value: WardType.MATERNITY, label: 'Maternity Ward', icon: Baby, color: 'text-pink-500', description: 'Obstetric care' },
  { value: WardType.PEDIATRIC, label: 'Pediatric Ward', icon: Users, color: 'text-green-500', description: 'Children and adolescents' },
  { value: WardType.ICU, label: 'Intensive Care Unit', icon: Shield, color: 'text-purple-500', description: 'Critical care' },
  { value: WardType.NICU, label: 'Neonatal ICU', icon: Baby, color: 'text-yellow-500', description: 'Newborn intensive care' },
  { value: WardType.PSYCHIATRIC, label: 'Psychiatric Ward', icon: Eye, color: 'text-indigo-500', description: 'Mental health care' },
  { value: WardType.ISOLATION, label: 'Isolation Ward', icon: Shield, color: 'text-orange-500', description: 'Infection control' },
  { value: WardType.EMERGENCY_OBSERVATION, label: 'Emergency Observation', icon: Clock, color: 'text-cyan-500', description: 'Emergency monitoring' },
  { value: WardType.GENERAL, label: 'General Ward', icon: Bed, color: 'text-gray-500', description: 'General inpatient care' },
];

const STATUS_OPTIONS = [
  { value: WardStatus.ACTIVE, label: 'Active', color: 'text-green-500' },
  { value: WardStatus.INACTIVE, label: 'Inactive', color: 'text-red-500' },
  { value: WardStatus.TEMPORARILY_CLOSED, label: 'Temporarily Closed', color: 'text-yellow-500' },
];

const SEX_RESTRICTION_OPTIONS = [
  { value: SexRestriction.MIXED, label: 'Mixed' },
  { value: SexRestriction.MALE_ONLY, label: 'Male Only' },
  { value: SexRestriction.FEMALE_ONLY, label: 'Female Only' },
];

const AGE_GROUP_OPTIONS = [
  { value: AgeGroup.ALL, label: 'All Ages' },
  { value: AgeGroup.ADULT, label: 'Adult Only' },
  { value: AgeGroup.PEDIATRIC, label: 'Pediatric Only' },
  { value: AgeGroup.NEONATAL, label: 'Neonatal Only' },
];

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

const getEmptyFormData = (facilityId: number | null): FacilityWardFormData => ({
  facility_id: facilityId,
  name: '',
  code: '',
  ward_type: '',
  building: '',
  floor: '',
  status: WardStatus.ACTIVE,
  capacity_declared: '',
  capacity_operational: '',
  sex_restriction: SexRestriction.MIXED,
  age_group: AgeGroup.ALL,
  note: '',
});

const getWardTypeLabel = (type: WardType): string => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
};

const getWardTypeIcon = (type: WardType): React.ElementType => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.icon || Bed;
};

const getWardTypeColor = (type: WardType): string => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
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

/**
 * Format capacity display with fallback
 */
const formatCapacity = (declared: number | null, operational: number | null): string => {
  if (declared === null && operational === null) return 'Not set';
  if (operational === null) return `${declared}`;
  if (declared === null) return `${operational}`;
  return `${operational}/${declared}`;
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const FacilityWard: React.FC<FacilityWardProps> = ({ theme }) => {
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
  const [typeFilter, setTypeFilter] = useState<WardType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WardStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState<FacilityWardFormData>(() =>
    getEmptyFormData(activeFacilityId ?? null)
  );

  // Expanded rows (for list view details)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  /* ---------------------------- API Queries ------------------------------- */

  const filters: WardFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      ward_type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    [activeFacilityId, typeFilter, statusFilter]
  );

  const listQueryKey = useMemo(() => wardKeys.list(filters), [filters]);

  const { data: wards, isLoading, error, refetch } = useGetWards(filters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
    staleTime: 1000 * 30,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      // Keep the rotation for at least 300ms for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  };
  /**
   * Defensive normalization:
   * - `wards` is already typed as Ward[] by GetWardsResponse
   * - but we still guard to avoid runtime crashes if API misbehaves.
   */
  const normalizedWards: Ward[] = useMemo(() => {
    return Array.isArray(wards) ? wards : [];
  }, [wards]);

  /* ------------------------ Client-Side Filtering ------------------------- */

  const filteredWards = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    if (!term) return normalizedWards;

    return normalizedWards.filter(ward => {
      if (!ward) return false;

      const name = safeLower(ward?.name);
      const code = safeLower(ward?.code);
      const building = safeLower(ward?.building);
      const floor = safeLower(ward?.floor);
      const wardTypeLabel = safeLower(getWardTypeLabel(ward.ward_type));

      return (
        name.includes(term) ||
        code.includes(term) ||
        building.includes(term) ||
        floor.includes(term) ||
        wardTypeLabel.includes(term)
      );
    });
  }, [normalizedWards, searchTerm]);

  /* ---------------------------- Mutations --------------------------------- */

  const createMutation = useCreateWard({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wardKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateWard({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wardKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteWard({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wardKeys.all });
      setSelectedWard(null);
    },
  });

  /* ------------------------ Cache Update Helpers -------------------------- */

  const setListCache = (
    updater: (current: Ward[] | undefined) => Ward[] | undefined
  ) => {
    queryClient.setQueryData<Ward[]>(listQueryKey, updater);
  };

  /* -------------------------- Drawer Handlers ----------------------------- */

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedWard(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
    setDrawerOpen(true);
  };

  const openEditDrawer = (ward: Ward) => {
    // keep runtime safe
    if (!ward) return;

    setDrawerMode('edit');
    setSelectedWard(ward);
    setFormData({
      facility_id: ward.facility_id,
      name: ward.name ?? '',
      code: ward.code ?? '',
      ward_type: ward.ward_type ?? '',
      building: ward.building ?? '',
      floor: ward.floor ?? '',
      status: ward.status ?? WardStatus.ACTIVE,
      capacity_declared: ward.capacity_declared?.toString() ?? '',
      capacity_operational: ward.capacity_operational?.toString() ?? '',
      sex_restriction: ward.sex_restriction ?? SexRestriction.MIXED,
      age_group: ward.age_group ?? AgeGroup.ALL,
      note: ward.note ?? '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedWard(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
  };

  /* -------------------------- Form Submission ----------------------------- */

  const handleSubmit = () => {
    const facilityId = formData.facility_id;
    const name = formData.name.trim();

    if (!facilityId || !name || !formData.ward_type) return;

    const payload: CreateWardRequest = {
      facility_id: facilityId,
      name,
      code: formData.code.trim() || undefined,
      ward_type: formData.ward_type as WardType,
      building: formData.building.trim() || undefined,
      floor: formData.floor.trim() || undefined,
      status: formData.status,
      capacity_declared: formData.capacity_declared ? parseInt(formData.capacity_declared) : undefined,
      capacity_operational: formData.capacity_operational ? parseInt(formData.capacity_operational) : undefined,
      sex_restriction: formData.sex_restriction,
      age_group: formData.age_group,
      note: formData.note.trim() || undefined,
    };

    if (drawerMode === 'create') {
      // Optimistic update for create
      const previousData = queryClient.getQueryData<Ward[]>(listQueryKey);
      const tempId = Date.now();
      const now = new Date().toISOString();

      const optimisticWard: Ward = {
        id: tempId,
        facility_id: payload.facility_id,
        name: payload.name,
        code: payload.code ?? null,
        ward_type: payload.ward_type as WardType,
        building: payload.building ?? null,
        floor: payload.floor ?? null,
        status: payload.status ?? WardStatus.ACTIVE,
        capacity_declared: payload.capacity_declared ?? null,
        capacity_operational: payload.capacity_operational ?? null,
        sex_restriction: payload.sex_restriction ?? SexRestriction.MIXED,
        age_group: payload.age_group ?? AgeGroup.ALL,
        note: payload.note ?? null,
        created_by_user_id: null,
        updated_by_user_id: null,
        created_at: now,
        updated_at: now,
      };

      setListCache(current => {
        if (!current || !Array.isArray(current)) return current;
        return [optimisticWard, ...current];
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previousData);
        },
      });
    } else if (drawerMode === 'edit' && selectedWard?.id != null) {
      // Optimistic update for edit
      const previousData = queryClient.getQueryData<Ward[]>(listQueryKey);

      setListCache(current => {
        if (!current || !Array.isArray(current)) return current;
        return current.map(ward =>
          ward.id === selectedWard.id
            ? {
                ...ward,
                ...payload,
                capacity_declared: payload.capacity_declared ?? ward.capacity_declared,
                capacity_operational: payload.capacity_operational ?? ward.capacity_operational,
                updated_at: new Date().toISOString(),
              }
            : ward
        );
      });

      const updatePayload: UpdateWardRequest = {
        name: payload.name,
        code: payload.code,
        ward_type: payload.ward_type,
        building: payload.building,
        floor: payload.floor,
        status: payload.status,
        capacity_declared: payload.capacity_declared,
        capacity_operational: payload.capacity_operational,
        sex_restriction: payload.sex_restriction,
        age_group: payload.age_group,
        note: payload.note,
      };

      updateMutation.mutate(
        { 
          id: selectedWard.id, 
          facility_id: selectedWard.facility_id, 
          data: updatePayload 
        },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previousData);
          },
        }
      );
    }
  };

  /* -------------------------- Delete Handler ------------------------------ */

  const handleDelete = async (ward: Ward) => {
    if (!ward?.id) return;

    const confirmed = await confirm({
      title: 'Delete Ward',
      message: `Are you sure you want to delete "${ward.name ?? ''}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    const previousData = queryClient.getQueryData<Ward[]>(listQueryKey);

    setListCache(current => {
      if (!current || !Array.isArray(current)) return current;
      return current.filter(w => w.id !== ward.id);
    });

    deleteMutation.mutate(
      { id: ward.id, facility_id: ward.facility_id },
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

  const canSubmit = !!formData.facility_id && !!formData.name.trim() && !!formData.ward_type;
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
          Please select a facility from the sidebar to manage wards.
        </p>
      </div>
    );
  }

  if (isLoading && !wards) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading wards..." />;
  }

  /* ---------------------------- Render JSX -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>Ward Management</h1>
            <p className={colors.text.secondary}>
              Manage medical, surgical, ICU, and other specialized wards in your facility
            </p>
          </div>

          <div className="flex items-center gap-3">
          <button
                onClick={handleRefresh}
                className={cn(
                  'p-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.bg.hover
                )}
                title="Refresh"
                disabled={isRefreshing}
              >
                <RefreshCw 
                  className={cn(
                    'w-5 h-5 transition-transform duration-300',
                    colors.text.secondary,
                    isRefreshing && 'animate-spin'
                  )} 
                />
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
              <span>Add Ward</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Total Wards</p>
            <p className={cn('text-2xl font-bold', colors.text.primary)}>{normalizedWards.length}</p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Active</p>
            <p className={cn('text-2xl font-bold text-green-500')}>
              {normalizedWards.filter(w => w.status === WardStatus.ACTIVE).length}
            </p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Total Capacity</p>
            <p className={cn('text-2xl font-bold', colors.text.primary)}>
              {normalizedWards.reduce((sum, ward) => sum + (ward.capacity_operational || 0), 0)}
            </p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Filtered</p>
            <p className={cn('text-2xl font-bold', colors.text.primary)}>{filteredWards.length}</p>
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
                placeholder="Search wards by name, code, building, or floor..."
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
                Ward Type
              </label>
              <select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTypeFilter(e.target.value as WardType | 'all')
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Types</option>
                {WARD_TYPE_OPTIONS.map(opt => (
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
                  setStatusFilter(e.target.value as WardStatus | 'all')
                }
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
              <p className="font-medium text-red-500">Error Loading Wards</p>
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
      {!isLoading && filteredWards.length === 0 && (
        <div className={cn('rounded-xl p-12 text-center', colors.bg.secondary)}>
          <Bed className={cn('w-16 h-16 mx-auto mb-4', colors.text.tertiary)} />
          <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No Wards Found' : 'No Wards Yet'}
          </h3>
          <p className={cn('mb-6', colors.text.secondary)}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search criteria'
              : 'Get started by creating your first ward'}
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
              <span>Add First Ward</span>
            </button>
          )}
        </div>
      )}

      {/* List View */}
      {!isLoading && filteredWards.length > 0 && viewMode === 'list' && (
        <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
          {/* Table Header */}
          <div className={cn('grid grid-cols-12 gap-4 p-4 font-medium border-b', colors.bg.secondary, colors.border.primary)}>
            <div className="col-span-3">Ward Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Capacity</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className={colors.bg.elevated}>
            {filteredWards.map(ward => {
              const isExpanded = expandedRows.has(ward.id);
              const Icon = getWardTypeIcon(ward.ward_type);
              const created = safeDate(ward.created_at);
              const updated = safeDate(ward.updated_at);

              return (
                <div key={ward.id} className={cn('border-b last:border-b-0', colors.border.primary)}>
                  {/* Main Row */}
                  <div
                    className={cn(
                      'grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer',
                      colors.bg.hover
                    )}
                    onClick={() => toggleExpand(ward.id)}
                  >
                    {/* Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className={cn('font-medium', colors.text.primary)}>{ward.name ?? '—'}</span>
                        {ward.code && (
                          <span className={cn('text-xs px-2 py-1 rounded', colors.bg.secondary, colors.text.secondary)}>
                            {ward.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', getWardTypeColor(ward.ward_type))} />
                        <span className={colors.text.secondary}>
                          {getWardTypeLabel(ward.ward_type)}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Building className={cn('w-4 h-4', colors.text.tertiary)} />
                        <span className={colors.text.secondary}>
                          {ward.building ? `${ward.building}${ward.floor ? `, ${ward.floor}` : ''}` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Users className={cn('w-4 h-4', colors.text.tertiary)} />
                        <span className={colors.text.secondary}>
                          {formatCapacity(ward.capacity_declared, ward.capacity_operational)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      {ward.status === WardStatus.ACTIVE ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : ward.status === WardStatus.INACTIVE ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-sm">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm">
                          <XCircle className="w-3 h-3" />
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          openEditDrawer(ward);
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
                          void handleDelete(ward);
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
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Restrictions</p>
                          <p className={colors.text.primary}>
                            {ward.sex_restriction.replace('_', ' ').toUpperCase()}, {ward.age_group}
                          </p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Capacities</p>
                          <p className={colors.text.primary}>
                            Operational: {ward.capacity_operational ?? '—'}<br/>
                            Declared: {ward.capacity_declared ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Created</p>
                          <p className={colors.text.primary}>{created ? created.toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Updated</p>
                          <p className={colors.text.primary}>{updated ? updated.toLocaleDateString() : '—'}</p>
                        </div>
                        {ward.note && (
                          <div className="col-span-2 md:col-span-4">
                            <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Notes</p>
                            <p className={cn('text-sm italic', colors.text.primary)}>{ward.note}</p>
                          </div>
                        )}
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
      {!isLoading && filteredWards.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWards.map(ward => {
            const Icon = getWardTypeIcon(ward.ward_type);

            return (
              <div
                key={ward.id}
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
                      <Icon className={cn('w-6 h-6', getWardTypeColor(ward.ward_type))} />
                    </div>
                    <div>
                      <h3 className={cn('font-semibold', colors.text.primary)}>{ward.name ?? '—'}</h3>
                      {ward.code && (
                        <p className={cn('text-sm', colors.text.secondary)}>{ward.code}</p>
                      )}
                      <p className={cn('text-sm', colors.text.secondary)}>
                        {getWardTypeLabel(ward.ward_type)}
                      </p>
                    </div>
                  </div>

                  {ward.status === WardStatus.ACTIVE ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : ward.status === WardStatus.INACTIVE ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>

                {/* Location & Capacity */}
                <div className={cn('mb-4 p-3 rounded-lg', colors.bg.secondary)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={cn('text-sm', colors.text.secondary)}>
                      {ward.building ?? 'No building'} {ward.floor ? `· ${ward.floor}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={cn('text-sm', colors.text.secondary)}>
                      Capacity: {formatCapacity(ward.capacity_declared, ward.capacity_operational)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn('text-xs px-2 py-1 rounded', colors.bg.primary, colors.text.secondary)}>
                      {ward.sex_restriction.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={cn('text-xs px-2 py-1 rounded', colors.bg.primary, colors.text.secondary)}>
                      {ward.age_group}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDrawer(ward)}
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
                    onClick={() => void handleDelete(ward)}
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
                {drawerMode === 'create' ? 'Create New Ward' : 'Edit Ward'}
              </h2>
              <p className={colors.text.secondary}>
                {drawerMode === 'create' ? 'Add a new ward to your facility' : `Editing: ${selectedWard?.name ?? ''}`}
              </p>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Ward Name */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Ward Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Medical Ward A, ICU, Pediatric Ward"
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary,
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>

              {/* Code */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Ward Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="e.g., MED-A, ICU-01, PED-WARD"
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary,
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>

              {/* Ward Type */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Ward Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ward_type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData(prev => ({ ...prev, ward_type: e.target.value as WardType }))
                  }
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary
                  )}
                >
                  <option value="">Select ward type...</option>
                  {WARD_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
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
                    placeholder="e.g., Main Building, Tower B"
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
                    placeholder="e.g., 1st Floor, Ground Floor"
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

              {/* Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                    Declared Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity_declared}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, capacity_declared: e.target.value }))
                    }
                    placeholder="e.g., 50"
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
                    Operational Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity_operational}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData(prev => ({ ...prev, capacity_operational: e.target.value }))
                    }
                    placeholder="e.g., 40"
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

              {/* Restrictions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                    Sex Restriction
                  </label>
                  <select
                    value={formData.sex_restriction}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData(prev => ({ ...prev, sex_restriction: e.target.value as SexRestriction }))
                    }
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                      colors.border.primary,
                      colors.bg.primary,
                      colors.text.primary
                    )}
                  >
                    {SEX_RESTRICTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                    Age Group
                  </label>
                  <select
                    value={formData.age_group}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData(prev => ({ ...prev, age_group: e.target.value as AgeGroup }))
                    }
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                      colors.border.primary,
                      colors.bg.primary,
                      colors.text.primary
                    )}
                  >
                    {AGE_GROUP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData(prev => ({ ...prev, status: e.target.value as WardStatus }))
                  }
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary
                  )}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Notes
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData(prev => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Additional notes about the ward..."
                  rows={3}
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
                {isSubmitting ? 'Saving...' : drawerMode === 'create' ? 'Create Ward' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};