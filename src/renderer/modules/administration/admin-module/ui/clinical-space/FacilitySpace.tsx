import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Box, Building2, Activity } from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useCreateFacilitySpace,
  useDeleteFacilitySpace,
  useGetFacilitySpaces,
  useUpdateFacilitySpace,
  facilitySpaceKeys,
} from '../../api/facility-space/FacilitySpaceQueries';
import {
  type FacilitySpace as FacilitySpaceEntity,
  type FacilitySpaceType,
  type CreateFacilitySpaceRequest,
  type UpdateFacilitySpaceRequest,
  type FacilitySpaceFilters,
  type GetFacilitySpacesResponse,
  SpaceStatus,
} from '../../api/facility-space/FacilitySpaceTypes';

import FacilitySpacePageHeader from './facility_space_components/FacilitySpacePageHeader';
import FacilitySpaceStatsOverview from './facility_space_components/FacilitySpaceStatsOverview';
import FacilitySpaceFiltersBar from './facility_space_components/FacilitySpaceFiltersBar';
import FacilitySpaceFormDrawer, {
  type FacilitySpaceFormData,
} from './facility_space_components/FacilitySpaceFormDrawer';
import FacilitySpaceList from './facility_space_components/FacilitySpaceList';

interface FacilitySpaceProps {
  theme: 'light' | 'dark';
}

interface SpaceTypeOption {
  value: FacilitySpaceType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const SPACE_TYPE_OPTIONS: SpaceTypeOption[] = [
  { value: 'consultation' as FacilitySpaceType, label: 'Consultation Room', icon: Activity, color: 'text-blue-500' },
  { value: 'triage' as FacilitySpaceType, label: 'Triage', icon: AlertCircle, color: 'text-red-500' },
  { value: 'lab' as FacilitySpaceType, label: 'Laboratory', icon: Box, color: 'text-purple-500' },
  { value: 'theatre' as FacilitySpaceType, label: 'Operating Theatre', icon: Activity, color: 'text-orange-500' },
  { value: 'ward' as FacilitySpaceType, label: 'Ward', icon: Building2, color: 'text-green-500' },
  { value: 'pharmacy' as FacilitySpaceType, label: 'Pharmacy', icon: Box, color: 'text-cyan-500' },
];

const getEmptyFormData = (facilityId: number | null): FacilitySpaceFormData => ({
  facility_id: facilityId,
  name: '',
  type: '',
  floor: '',
  building: '',
  is_active: true,
});

const getSpaceTypeLabel = (type: FacilitySpaceType): string => {
  const option = SPACE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

const safeLower = (value: string | null | undefined): string => (value ?? '').toLowerCase();

export const FacilitySpace: React.FC<FacilitySpaceProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const activeFacilityId = useAppSelector((state) => state.activeContext.activeFacilityId);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FacilitySpaceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedSpace, setSelectedSpace] = useState<FacilitySpaceEntity | null>(null);
  const [formData, setFormData] = useState<FacilitySpaceFormData>(
    getEmptyFormData(activeFacilityId ?? null)
  );

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);

  useEffect(() => {
    if (!drawerOpen) {
      setFormData(getEmptyFormData(activeFacilityId ?? null));
    }
  }, [activeFacilityId, drawerOpen]);

  const filters: FacilitySpaceFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [activeFacilityId, typeFilter, statusFilter]
  );

  const listQueryKey = useMemo(() => facilitySpaceKeys.list(filters), [filters]);

  const {
    data: spacesResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetFacilitySpaces(filters, {
    enabled: !!activeFacilityId,
    staleTime: 1000 * 30,
  });

  const spaces: FacilitySpaceEntity[] = useMemo(() => {
    const data = spacesResponse?.data;
    return Array.isArray(data) ? data : [];
  }, [spacesResponse]);

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    if (!term) return spaces;

    return spaces.filter((space) => {
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

  const hasActiveFilters =
    Boolean(searchTerm.trim()) || typeFilter !== 'all' || statusFilter !== 'all';

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedSpace(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
  };

  const setListCache = (
    updater: (
      current: GetFacilitySpacesResponse | undefined
    ) => GetFacilitySpacesResponse | undefined
  ) => {
    queryClient.setQueryData<GetFacilitySpacesResponse>(listQueryKey, updater);
  };

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

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedSpace(null);
    setFormData(getEmptyFormData(activeFacilityId ?? null));
    setDrawerOpen(true);
  };

  const openEditDrawer = (space: FacilitySpaceEntity) => {
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
      const previousData = queryClient.getQueryData<GetFacilitySpacesResponse>(listQueryKey);
      const tempId = Date.now();
      const now = new Date().toISOString();

      const optimisticSpace: FacilitySpaceEntity = {
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

      setListCache((current) => {
        if (!current || !Array.isArray(current.data)) return current;
        return {
          ...current,
          data: [optimisticSpace, ...current.data],
        };
      });

      createMutation.mutate(payload, {
        onError: () => {
          queryClient.setQueryData(listQueryKey, previousData);
        },
      });

      return;
    }

    if (drawerMode === 'edit' && selectedSpace?.id != null) {
      const previousData = queryClient.getQueryData<GetFacilitySpacesResponse>(listQueryKey);

      setListCache((current) => {
        if (!current || !Array.isArray(current.data)) return current;

        return {
          ...current,
          data: current.data.map((space) =>
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
        {
          id: selectedSpace.id,
          data: payload as UpdateFacilitySpaceRequest,
        },
        {
          onError: () => {
            queryClient.setQueryData(listQueryKey, previousData);
          },
        }
      );
    }
  };

  const handleDelete = async (space: FacilitySpaceEntity) => {
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

    setListCache((current) => {
      if (!current || !Array.isArray(current.data)) return current;
      return {
        ...current,
        data: current.data.filter((item) => item.id !== space.id),
      };
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

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshAnimating(true);
    try {
      await refetch();
    } finally {
      window.setTimeout(() => {
        setIsRefreshAnimating(false);
      }, 500);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const canSubmit = !!formData.facility_id && !!formData.name.trim() && !!formData.type;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!activeFacilityId) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          No Facility Selected
        </h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility from the sidebar to manage facility spaces.
        </p>
      </div>
    );
  }

  if (isLoading && !spacesResponse) {
    return <LoadingSkeleton variant="dashboard" theme={theme} message="Loading facility spaces..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <FacilitySpacePageHeader
          theme={theme}
          isRefreshing={isFetching || isRefreshAnimating}
          onRefresh={handleRefresh}
          onCreate={openCreateDrawer}
        />

        <FacilitySpaceStatsOverview
          theme={theme}
          spaces={spaces}
          filteredCount={filteredSpaces.length}
          searchTerm={searchTerm}
        />

        <FacilitySpaceFiltersBar
          theme={theme}
          searchTerm={searchTerm}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          showFilters={showFilters}
          viewMode={viewMode}
          spaceTypeOptions={SPACE_TYPE_OPTIONS}
          onSearchTermChange={setSearchTerm}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          onToggleFilters={() => setShowFilters((prev) => !prev)}
          onViewModeChange={setViewMode}
          onClearFilters={handleClearFilters}
        />

        <FacilitySpaceList
          theme={theme}
          viewMode={viewMode}
          spaces={filteredSpaces}
          expandedRows={expandedRows}
          isLoading={isLoading && !!spacesResponse}
          error={error}
          hasActiveFilters={hasActiveFilters}
          spaceTypeOptions={SPACE_TYPE_OPTIONS}
          onRetry={handleRefresh}
          onToggleExpand={toggleExpand}
          onEdit={openEditDrawer}
          onDelete={handleDelete}
        />
      </div>

      <FacilitySpaceFormDrawer
        theme={theme}
        mode={drawerMode}
        open={drawerOpen}
        formData={formData}
        spaceTypeOptions={SPACE_TYPE_OPTIONS}
        onChange={setFormData}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        selectedSpaceName={selectedSpace?.name}
      />
    </>
  );
};

export default FacilitySpace;

        