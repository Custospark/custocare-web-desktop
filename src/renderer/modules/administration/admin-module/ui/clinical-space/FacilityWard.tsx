/**
 * ============================================================================
 * FACILITY WARD MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Container component for facility ward management.
 * Keeps data fetching, optimistic mutations, state orchestration,
 * and composes all presentational ward-components.
 */

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bed, Building2, Plus } from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/types/cn';

import {
  useGetWards,
  useCreateWard,
  useUpdateWard,
  useDeleteWard,
  wardKeys,
} from '../../api/wards/wardQueries';

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

import {
  WardHeader,
  WardStatsCards,
  WardFiltersBar,
  WardListView,
  WardGridView,
  WardFormDrawer,
} from './ward-components';

import {
  createWardColors,
  getEmptyFormData,
} from './ward-components/ward.constants';

import {
  safeLower,
  getErrorMessage,
  parseOptionalInteger,
} from './ward-components/ward.utils';

import type {
  FacilityWardFormData,
  FacilityWardProps,
  WardViewMode,
} from './ward-components/ward.types';

export const FacilityWard: React.FC<FacilityWardProps> = ({ theme }) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const activeFacilityId = useAppSelector(state => state.activeContext.activeFacilityId);

  const colors = useMemo(() => createWardColors(theme), [theme]);

  const [viewMode, setViewMode] = useState<WardViewMode>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<WardType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WardStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [formData, setFormData] = useState<FacilityWardFormData>(() =>
    getEmptyFormData(activeFacilityId ?? null)
  );

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filters: WardFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      ward_type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    [activeFacilityId, statusFilter, typeFilter]
  );

  const listQueryKey = useMemo(() => wardKeys.list(filters), [filters]);

  const {
    data: wards,
    isLoading,
    error,
    refetch,
  } = useGetWards(filters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
    staleTime: 1000 * 30,
  });

  const normalizedWards: Ward[] = useMemo(() => {
    return Array.isArray(wards) ? wards : [];
  }, [wards]);

  const filteredWards = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    if (!term) return normalizedWards;

    return normalizedWards.filter(ward => {
      if (!ward) return false;

      const name = safeLower(ward.name);
      const code = safeLower(ward.code);
      const building = safeLower(ward.building);
      const floor = safeLower(ward.floor);
      const wardType = safeLower(ward.ward_type);

      return (
        name.includes(term) ||
        code.includes(term) ||
        building.includes(term) ||
        floor.includes(term) ||
        wardType.includes(term)
      );
    });
  }, [normalizedWards, searchTerm]);

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

  const setListCache = (
    updater: (current: Ward[] | undefined) => Ward[] | undefined
  ) => {
    queryClient.setQueryData<Ward[]>(listQueryKey, updater);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  };

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedWard(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
    setDrawerOpen(true);
  };

  const openEditDrawer = (ward: Ward) => {
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
      capacity_declared: parseOptionalInteger(formData.capacity_declared),
      capacity_operational: parseOptionalInteger(formData.capacity_operational),
      sex_restriction: formData.sex_restriction,
      age_group: formData.age_group,
      note: formData.note.trim() || undefined,
    };

    if (drawerMode === 'create') {
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
        if (!Array.isArray(current)) return [optimisticWard];
        return [optimisticWard, ...current];
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previousData);
        },
      });

      return;
    }

    if (drawerMode === 'edit' && selectedWard?.id != null) {
      const previousData = queryClient.getQueryData<Ward[]>(listQueryKey);

      setListCache(current => {
        if (!Array.isArray(current)) return current;

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
          data: updatePayload,
        },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previousData);
          },
        }
      );
    }
  };

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
      if (!Array.isArray(current)) return current;
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

  const toggleExpand = (id: number) => {
    if (!id) return;

    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const canSubmit =
    !!formData.facility_id &&
    !!formData.name.trim() &&
    !!formData.ward_type;

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  if (!activeFacilityId) {
    return (
      <div className={cn('rounded-xl p-8 text-center', colors.bg.secondary)}>
        <Building2 className={cn('w-12 h-12 mx-auto mb-4', colors.text.tertiary)} />
        <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
          No Facility Selected
        </h3>
        <p className={colors.text.secondary}>
          Please select a facility from the sidebar to manage wards.
        </p>
      </div>
    );
  }

  if (isLoading && !wards) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        theme={theme}
        message="Loading wards..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
        <WardHeader
          colors={colors}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onCreate={openCreateDrawer}
        />

        <WardStatsCards
          theme={theme}
          wards={normalizedWards}
          filteredCount={filteredWards.length}
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
        />
      </div>

      <WardFiltersBar
        theme={theme}
        colors={colors}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearFilters}
      />

      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500">Error Loading Wards</p>
              <p className={cn('text-sm', colors.text.secondary)}>
                {getErrorMessage(error)}
              </p>
            </div>
            <button
              onClick={() => void refetch()}
              className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && filteredWards.length === 0 && (
        <div className={cn('rounded-xl p-12 text-center', colors.bg.secondary)}>
          <Bed className={cn('w-16 h-16 mx-auto mb-4', colors.text.tertiary)} />
          <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No Wards Found'
              : 'No Wards Yet'}
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

      {!isLoading && filteredWards.length > 0 && viewMode === 'list' && (
        <WardListView
          colors={colors}
          wards={filteredWards}
          expandedRows={expandedRows}
          onToggleExpand={toggleExpand}
          onEdit={openEditDrawer}
          onDelete={handleDelete}
        />
      )}

      {!isLoading && filteredWards.length > 0 && viewMode === 'grid' && (
        <WardGridView
          colors={colors}
          wards={filteredWards}
          onEdit={openEditDrawer}
          onDelete={handleDelete}
        />
      )}

      <WardFormDrawer
        theme={theme}
        mode={drawerMode}
        open={drawerOpen}
        formData={formData}
        selectedWardName={selectedWard?.name ?? ''}
        onChange={setFormData}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />
    </div>
  );
};

export default FacilityWard;
