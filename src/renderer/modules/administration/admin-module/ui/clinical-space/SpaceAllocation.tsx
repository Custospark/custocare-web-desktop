/**
 * ============================================================================
 * SPACE ALLOCATION MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Container component for staff space allocation management.
 * Keeps data fetching, optimistic mutations, state orchestration,
 * and composes all presentational space-allocation-components.
 */

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Building2, DoorOpen, Plus } from 'lucide-react';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/types/cn';

import {
  staffSpaceAssignmentKeys,
  useAssignSpaceByAdmin,
  useGetAvailableSpaces,
  useGetCurrentOccupancy,
  useGetStaffForAssignment,
  useReleaseSpaceByAdmin,
} from '../../api/staff-space-assignment/StaffSpaceAssignmentQueries';

import type {
  AssignSpaceRequest,
  AvailableSpace,
  AvailableSpacesFilters,
  OccupancyFilters,
  SpaceWithAssignment,
  StaffForAssignment,
} from '../../api/staff-space-assignment/StaffSpaceAssignmentTypes';

import {
  AssignSpaceDrawer,
  ReleaseSpaceDrawer,
  SpaceAllocationFiltersBar,
  SpaceAllocationGridView,
  SpaceAllocationHeader,
  SpaceAllocationListView,
  SpaceAllocationStatsCards,
} from './space-allocation-components';

import {
  createSpaceAllocationColors,
  getEmptyAssignFormData,
  getEmptyReleaseFormData,
} from './space-allocation-components/space-allocation.constants';

import {
  createOptimisticAssignment,
  getErrorMessage,
  safeLower,
} from './space-allocation-components/space-allocation.utils';

import type {
  AssignSpaceFormData,
  OccupancyFilterValue,
  ReleaseSpaceFormData,
  SpaceAllocationProps,
  SpaceAllocationViewMode,
} from './space-allocation-components/space-allocation.types';

export const SpaceAllocation: React.FC<SpaceAllocationProps> = ({ theme }) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const activeFacilityId = useAppSelector(state => state.activeContext.activeFacilityId);

  const colors = useMemo(() => createSpaceAllocationColors(theme), [theme]);

  const [viewMode, setViewMode] = useState<SpaceAllocationViewMode>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<OccupancyFilterValue>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [releaseDrawerOpen, setReleaseDrawerOpen] = useState(false);

  const [assignFormData, setAssignFormData] = useState<AssignSpaceFormData>(() =>
    getEmptyAssignFormData(activeFacilityId ?? null)
  );
  const [releaseFormData, setReleaseFormData] = useState<ReleaseSpaceFormData>(() =>
    getEmptyReleaseFormData(activeFacilityId ?? null)
  );

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedSpace, setSelectedSpace] = useState<SpaceWithAssignment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const occupancyFilters: OccupancyFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      per_page: 50,
    }),
    [activeFacilityId]
  );

  const {
    data: occupancyData,
    isLoading: isLoadingOccupancy,
    error: occupancyError,
    refetch: refetchOccupancy,
  } = useGetCurrentOccupancy(occupancyFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
    staleTime: 1000 * 30,
  });

  const availableSpacesFilters: AvailableSpacesFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      per_page: 100,
    }),
    [activeFacilityId]
  );

  const { data: availableSpacesData } = useGetAvailableSpaces(availableSpacesFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
  });

  const { data: staffData, isLoading: isLoadingStaff } = useGetStaffForAssignment(
    activeFacilityId || 0,
    { per_page: 100 },
    { enabled: !!activeFacilityId && activeFacilityId > 0 }
  );

  const normalizedSpaces: SpaceWithAssignment[] = useMemo(() => {
    if (!occupancyData?.data || !Array.isArray(occupancyData.data)) return [];

    return occupancyData.data.filter(
      (space): space is SpaceWithAssignment =>
        !!space &&
        typeof space === 'object' &&
        'id' in space &&
        typeof space.id === 'number'
    );
  }, [occupancyData]);

  const normalizedAvailableSpaces: AvailableSpace[] = useMemo(() => {
    if (!availableSpacesData?.data || !Array.isArray(availableSpacesData.data)) return [];

    return availableSpacesData.data.filter(
      (space): space is AvailableSpace =>
        !!space &&
        typeof space === 'object' &&
        'id' in space &&
        typeof space.id === 'number'
    );
  }, [availableSpacesData]);

  const normalizedStaff: StaffForAssignment[] = useMemo(() => {
    if (!staffData?.data || !Array.isArray(staffData.data)) return [];

    return staffData.data.filter(
      (staff): staff is StaffForAssignment =>
        !!staff &&
        typeof staff === 'object' &&
        'staff_id' in staff &&
        typeof staff.staff_id === 'number'
    );
  }, [staffData]);

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();

    return normalizedSpaces.filter(space => {
      if (occupancyFilter === 'occupied' && !space.current_assignment) return false;
      if (occupancyFilter === 'available' && space.current_assignment) return false;

      if (spaceTypeFilter !== 'all' && space.type !== spaceTypeFilter) return false;
      if (buildingFilter !== 'all' && space.building !== buildingFilter) return false;
      if (floorFilter !== 'all' && space.floor !== floorFilter) return false;

      if (!term) return true;

      const name = safeLower(space.name);
      const type = safeLower(space.type);
      const building = safeLower(space.building);
      const floor = safeLower(space.floor);
      const staffName = safeLower(space.current_assignment?.staff?.user?.full_name);
      const employeeId = safeLower(space.current_assignment?.staff?.employee_id);
      const staffUuid = safeLower(space.current_assignment?.staff?.staff_uuid);

      return (
        name.includes(term) ||
        type.includes(term) ||
        building.includes(term) ||
        floor.includes(term) ||
        staffName.includes(term) ||
        employeeId.includes(term) ||
        staffUuid.includes(term)
      );
    });
  }, [
    normalizedSpaces,
    searchTerm,
    occupancyFilter,
    spaceTypeFilter,
    buildingFilter,
    floorFilter,
  ]);

  const spaceTypes = useMemo(() => {
    const set = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.type) set.add(space.type);
    });
    return Array.from(set).sort();
  }, [normalizedSpaces]);

  const buildings = useMemo(() => {
    const set = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.building) set.add(space.building);
    });
    return Array.from(set).sort();
  }, [normalizedSpaces]);

  const floors = useMemo(() => {
    const set = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.floor) set.add(space.floor);
    });
    return Array.from(set).sort();
  }, [normalizedSpaces]);

  const assignMutation = useAssignSpaceByAdmin({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      closeAssignDrawer();
      setSelectedSpace(null);
    },
  });

  const releaseMutation = useReleaseSpaceByAdmin({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      closeReleaseDrawer();
      setSelectedSpace(null);
    },
  });

  const updateOccupancyCache = (
    spaceId: number,
    updater: (space: SpaceWithAssignment) => SpaceWithAssignment
  ) => {
    queryClient.setQueriesData(
      { queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters) },
      (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;

        const data = oldData as { data?: SpaceWithAssignment[] };

        if (!Array.isArray(data.data)) return oldData;

        return {
          ...data,
          data: data.data.map(space => (space.id === spaceId ? updater(space) : space)),
        };
      }
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchOccupancy();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  };

  const openAssignDrawer = (space?: SpaceWithAssignment) => {
    if (space) {
      setSelectedSpace(space);
      setAssignFormData({
        facility_id: activeFacilityId ?? null,
        space_id: space.id,
        staff_id: null,
        note: '',
      });
    } else {
      setSelectedSpace(null);
      setAssignFormData(getEmptyAssignFormData(activeFacilityId ?? null));
    }

    setAssignDrawerOpen(true);
  };

  const openReleaseDrawer = (space: SpaceWithAssignment) => {
    if (!space.current_assignment) return;

    setSelectedSpace(space);
    setReleaseFormData({
      facility_id: activeFacilityId ?? null,
      staff_id: space.current_assignment.staff_id,
      assignment_id: space.current_assignment.id,
      note: '',
    });
    setReleaseDrawerOpen(true);
  };

  const closeAssignDrawer = () => {
    setAssignDrawerOpen(false);
    setSelectedSpace(null);
    setAssignFormData(getEmptyAssignFormData(activeFacilityId ?? null));
  };

  const closeReleaseDrawer = () => {
    setReleaseDrawerOpen(false);
    setSelectedSpace(null);
    setReleaseFormData(getEmptyReleaseFormData(activeFacilityId ?? null));
  };

  const handleAssignSubmit = () => {
    const { facility_id, space_id, staff_id } = assignFormData;

    if (!facility_id || !space_id || !staff_id) return;

    const payload: AssignSpaceRequest = {
      facility_id,
      space_id,
      staff_id,
      note: assignFormData.note.trim() || undefined,
    };

    const targetSpace =
      normalizedSpaces.find(space => space.id === space_id) ||
      normalizedAvailableSpaces.find(space => space.id === space_id);

    const targetStaff = normalizedStaff.find(staff => staff.staff_id === staff_id);

    if (targetSpace && targetStaff) {
      const optimisticAssignment = createOptimisticAssignment(
        Date.now(),
        facility_id,
        space_id,
        staff_id,
        assignFormData.note.trim() || null,
        targetSpace,
        targetStaff
      );

      updateOccupancyCache(space_id, space => ({
        ...space,
        current_assignment: optimisticAssignment,
      }));
    }

    assignMutation.mutate(payload, {
      onError: () => {
        queryClient.invalidateQueries({
          queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters),
        });
      },
    });
  };

  const handleReleaseSubmit = () => {
    const { facility_id, staff_id, assignment_id } = releaseFormData;

    if (!facility_id || !staff_id || !assignment_id || !selectedSpace) return;

    const payload = {
      facility_id,
      staff_id,
    };

    updateOccupancyCache(selectedSpace.id, space => ({
      ...space,
      current_assignment: null,
    }));

    releaseMutation.mutate(payload, {
      onError: () => {
        queryClient.invalidateQueries({
          queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters),
        });
      },
    });
  };

  const handleRelease = async (space: SpaceWithAssignment) => {
    if (!space.current_assignment) return;

    const staffName = space.current_assignment.staff?.user?.full_name || 'this staff member';

    const confirmed = await confirm({
      title: 'Release Space',
      message: `Are you sure you want to release "${space.name}" from ${staffName}?`,
      confirmText: 'Release',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });

    if (!confirmed) return;

    openReleaseDrawer(space);
  };

  const toggleExpand = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSpaceTypeFilter('all');
    setBuildingFilter('all');
    setFloorFilter('all');
    setOccupancyFilter('all');
  };

  const occupiedCount = normalizedSpaces.filter(space => !!space.current_assignment).length;
  const availableCount = normalizedSpaces.filter(space => !space.current_assignment).length;
  const totalCapacity = normalizedSpaces.length;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

  const canAssign =
    !!assignFormData.facility_id &&
    !!assignFormData.space_id &&
    !!assignFormData.staff_id;

  const canRelease =
    !!releaseFormData.facility_id &&
    !!releaseFormData.staff_id &&
    !!releaseFormData.assignment_id;

  const isAssigning = assignMutation.isPending;
  const isReleasing = releaseMutation.isPending;

  if (!activeFacilityId) {
    return (
      <div className={cn('rounded-xl p-8 text-center', colors.bg.secondary)}>
        <Building2 className={cn('w-12 h-12 mx-auto mb-4', colors.text.tertiary)} />
        <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
          No Facility Selected
        </h3>
        <p className={colors.text.secondary}>
          Please select a facility from the sidebar to manage room allocations.
        </p>
      </div>
    );
  }

  if (isLoadingOccupancy && !occupancyData) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        theme={theme}
        message="Loading space allocations..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
        <SpaceAllocationHeader
          colors={colors}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onAssign={() => openAssignDrawer()}
        />

        <SpaceAllocationStatsCards
          theme={theme}
          totalCapacity={totalCapacity}
          occupiedCount={occupiedCount}
          availableCount={availableCount}
          occupancyRate={occupancyRate}
        />
      </div>

      <SpaceAllocationFiltersBar
        theme={theme}
        colors={colors}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        spaceTypeFilter={spaceTypeFilter}
        onSpaceTypeFilterChange={setSpaceTypeFilter}
        buildingFilter={buildingFilter}
        onBuildingFilterChange={setBuildingFilter}
        floorFilter={floorFilter}
        onFloorFilterChange={setFloorFilter}
        occupancyFilter={occupancyFilter}
        onOccupancyFilterChange={setOccupancyFilter}
        spaceTypes={spaceTypes}
        buildings={buildings}
        floors={floors}
        onClearFilters={clearFilters}
      />

      {occupancyError && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500">Error Loading Room Allocations</p>
              <p className={cn('text-sm', colors.text.secondary)}>
                {getErrorMessage(occupancyError)}
              </p>
            </div>
            <button
              onClick={() => void refetchOccupancy()}
              className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoadingOccupancy && filteredSpaces.length === 0 && (
        <div className={cn('rounded-xl p-12 text-center', colors.bg.secondary)}>
          <DoorOpen className={cn('w-16 h-16 mx-auto mb-4', colors.text.tertiary)} />
          <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
            {searchTerm ||
            spaceTypeFilter !== 'all' ||
            buildingFilter !== 'all' ||
            floorFilter !== 'all' ||
            occupancyFilter !== 'all'
              ? 'No Spaces Found'
              : 'No Spaces Available'}
          </h3>

          <p className={cn('mb-6', colors.text.secondary)}>
            {searchTerm ||
            spaceTypeFilter !== 'all' ||
            buildingFilter !== 'all' ||
            floorFilter !== 'all' ||
            occupancyFilter !== 'all'
              ? 'Try adjusting your filters or search criteria'
              : 'All spaces are currently unallocated or no spaces are configured'}
          </p>

          {!searchTerm &&
            spaceTypeFilter === 'all' &&
            buildingFilter === 'all' &&
            floorFilter === 'all' &&
            occupancyFilter === 'all' && (
              <button
                onClick={() => openAssignDrawer()}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer',
                  colors.accent.primary,
                  colors.accent.hover,
                  colors.accent.text
                )}
                type="button"
              >
                <Plus className="w-5 h-5" />
                <span>Assign First Room</span>
              </button>
            )}
        </div>
      )}

      {!isLoadingOccupancy && filteredSpaces.length > 0 && viewMode === 'list' && (
        <SpaceAllocationListView
          colors={colors}
          spaces={filteredSpaces}
          expandedRows={expandedRows}
          onToggleExpand={toggleExpand}
          onAssign={openAssignDrawer}
          onRelease={handleRelease}
        />
      )}

      {!isLoadingOccupancy && filteredSpaces.length > 0 && viewMode === 'grid' && (
        <SpaceAllocationGridView
          colors={colors}
          spaces={filteredSpaces}
          onAssign={openAssignDrawer}
          onRelease={handleRelease}
        />
      )}

      <AssignSpaceDrawer
        theme={theme}
        open={assignDrawerOpen}
        formData={assignFormData}
        availableSpaces={normalizedAvailableSpaces}
        staff={normalizedStaff}
        preselectedSpace={selectedSpace}
        onChange={setAssignFormData}
        onClose={closeAssignDrawer}
        onSubmit={handleAssignSubmit}
        isSubmitting={isAssigning}
        isLoadingStaff={isLoadingStaff}
        canSubmit={canAssign}
      />

      <ReleaseSpaceDrawer
        theme={theme}
        open={releaseDrawerOpen}
        formData={releaseFormData}
        selectedSpace={selectedSpace}
        onChange={setReleaseFormData}
        onClose={closeReleaseDrawer}
        onSubmit={handleReleaseSubmit}
        isSubmitting={isReleasing}
        canSubmit={canRelease}
      />
    </div>
  );
};

export default SpaceAllocation;
