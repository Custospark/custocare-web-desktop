/**
 * ============================================================================
 * SPACE ALLOCATION MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Enterprise-grade space allocation management for staff workspace assignments.
 * Allows admins to assign and release spaces for staff members with:
 * - Real-time occupancy tracking
 * - Optimistic UI updates with proper type safety
 * - Client-side search and filtering
 * - Responsive grid/list view modes
 * - Type-safe operations with full TypeScript support
 * - Theme-aware styling (dark/light)
 *
 * @module SpaceAllocation
 * @description Admin interface for managing staff space assignments
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
  AlertCircle,
  Building2,
  Users,
  User,
  MapPin,
  DoorOpen,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building,
  Clock,
  Calendar,
  FileText,
  MoreVertical,
  Home,
  Monitor,
  Briefcase,
  PillBottle,
  Bed,
  Activity,
  FlaskConical,
} from 'lucide-react';
import { getRoleDisplayName as formatName } from '../../../../../shared/utils/facilityRoleFormator';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetCurrentOccupancy,
  useGetAvailableSpaces,
  useGetStaffForAssignment,
  useAssignSpaceByAdmin,
  useReleaseSpaceByAdmin,
  staffSpaceAssignmentKeys,
} from '../../api/staff-space-assignment/StaffSpaceAssignmentQueries';
import type {
  SpaceWithAssignment,
  AvailableSpace,
  StaffForAssignment,
  OccupancyFilters,
  AvailableSpacesFilters,
  AssignSpaceRequest,
  StaffSpaceAssignment,
  StaffReference,
  SpaceReference,
  UserReference,
} from '../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import  {
  StaffSpaceAssignmentStatus,

} from '../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import { getRoleDisplayName as formatDisplayName } from '../../../../../shared/utils/facilityRoleFormator';
import { cn } from '../../../../../shared/types/cn';

/* -------------------------------------------------------------------------- */
/*                                COMPONENT PROPS                             */
/* -------------------------------------------------------------------------- */

interface SpaceAllocationProps {
  theme: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                               FORM DATA TYPES                              */
/* -------------------------------------------------------------------------- */

interface AssignSpaceFormData {
  facility_id: number | null;
  space_id: number | null;
  staff_id: number | null;
  note: string;
}

interface ReleaseSpaceFormData {
  facility_id: number | null;
  staff_id: number | null;
  assignment_id: number | null;
  note: string;
}

/* -------------------------------------------------------------------------- */
/*                               SPACE TYPE ICONS                             */
/* -------------------------------------------------------------------------- */

const SPACE_TYPE_ICONS: Record<string, React.ElementType> = {
  consultation: Monitor,
  triage: AlertCircle,
  lab: FlaskConical,
  theatre: Activity,
  ward: Bed,
  pharmacy: PillBottle,
  office: Briefcase,
  meeting: Users,
  cubicle: Home,
  default: DoorOpen,
};

const SPACE_TYPE_COLORS: Record<string, string> = {
  consultation: 'text-blue-500',
  triage: 'text-orange-500',
  lab: 'text-purple-500',
  theatre: 'text-red-500',
  ward: 'text-green-500',
  pharmacy: 'text-yellow-500',
  office: 'text-indigo-500',
  meeting: 'text-cyan-500',
  cubicle: 'text-gray-500',
  default: 'text-gray-400',
};

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

const getEmptyAssignFormData = (facilityId: number | null): AssignSpaceFormData => ({
  facility_id: facilityId,
  space_id: null,
  staff_id: null,
  note: '',
});

const getEmptyReleaseFormData = (facilityId: number | null): ReleaseSpaceFormData => ({
  facility_id: facilityId,
  staff_id: null,
  assignment_id: null,
  note: '',
});

const getSpaceTypeIcon = (type: string | null | undefined): React.ElementType => {
  return SPACE_TYPE_ICONS[type?.toLowerCase() ?? ''] || SPACE_TYPE_ICONS.default;
};

const getSpaceTypeColor = (type: string | null | undefined): string => {
  return SPACE_TYPE_COLORS[type?.toLowerCase() ?? ''] || SPACE_TYPE_COLORS.default;
};
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const safeLower = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return value.toLowerCase();
};
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
};

const buildSafeUserReference = (
  id: number,
  firstName: string,
  lastName: string
): UserReference => ({
  id,
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`.trim(),
});

const buildSafeStaffReference = (
  staff: StaffForAssignment,
  userId: number = 0
): StaffReference => ({
  staff_id: staff.staff_id,
  staff_uuid: staff.staff_uuid,
  employee_id: staff.employee_id,
  user: buildSafeUserReference(userId, staff.first_name, staff.last_name),
  role_code: staff.role_code,
});

const buildSafeSpaceReference = (space: SpaceWithAssignment | AvailableSpace): SpaceReference => ({
  id: space.id,
  name: space.name,
  type: space.type,
  floor: space.floor,
  building: space.building,
  is_active: space.is_active,
  facility_id: space.facility_id,
});

/* -------------------------------------------------------------------------- */
/*                            OPTIMISTIC UPDATE HELPERS                       */
/* -------------------------------------------------------------------------- */

const createOptimisticAssignment = (
  tempId: number,
  facilityId: number,
  spaceId: number,
  staffId: number,
  note: string | null,
  targetSpace: SpaceWithAssignment | AvailableSpace,
  selectedStaff: StaffForAssignment
): StaffSpaceAssignment => {
  const now = new Date().toISOString();
  
  return {
    id: tempId,
    facility_id: facilityId,
    space_id: spaceId,
    staff_id: staffId,
    assigned_by_user_id: null,
    released_by_user_id: null,
    assigned_at: now,
    released_at: null,
    note: note,
    status: StaffSpaceAssignmentStatus.ACTIVE,
    created_at: now,
    updated_at: now,
    space: buildSafeSpaceReference(targetSpace),
    staff: buildSafeStaffReference(selectedStaff),
    assigned_by_user: undefined, // Optional field - leave as undefined
    released_by_user: undefined, // Optional field - leave as undefined
  };
};

const createOptimisticReleasedAssignment = (
  previousAssignment: StaffSpaceAssignment,
  note: string | null
): StaffSpaceAssignment => {
  const now = new Date().toISOString();
  
  return {
    ...previousAssignment,
    released_at: now,
    status: StaffSpaceAssignmentStatus.RELEASED,
    updated_at: now,
    note: note ?? previousAssignment.note,
    released_by_user: undefined, // Optional field - leave as undefined
  };
};

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const SpaceAllocation: React.FC<SpaceAllocationProps> = ({ theme }) => {
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
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<'all' | 'occupied' | 'available'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [releaseDrawerOpen, setReleaseDrawerOpen] = useState(false);
  const [assignFormData, setAssignFormData] = useState<AssignSpaceFormData>(() =>
    getEmptyAssignFormData(activeFacilityId ?? null)
  );
  const [releaseFormData, setReleaseFormData] = useState<ReleaseSpaceFormData>(() =>
    getEmptyReleaseFormData(activeFacilityId ?? null)
  );

  // Expanded rows (for list view details)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Selected space for operations
  const [selectedSpace, setSelectedSpace] = useState<SpaceWithAssignment | null>(null);

  /* ---------------------------- API Queries ------------------------------- */

  // Occupancy query
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
    refetch: refetchOccupancy 
  } = useGetCurrentOccupancy(occupancyFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
    staleTime: 1000 * 30,
  });

  // Available spaces query
  const availableSpacesFilters: AvailableSpacesFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      per_page: 100,
    }),
    [activeFacilityId]
  );

  const { 
    data: availableSpacesData, 
  } = useGetAvailableSpaces(availableSpacesFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
  });

  // Staff list query
  const { 
    data: staffData, 
    isLoading: isLoadingStaff 
  } = useGetStaffForAssignment(
    activeFacilityId || 0, 
    { per_page: 100 }, 
    { enabled: !!activeFacilityId && activeFacilityId > 0 }
  );

  /* ------------------------ Normalize Data ------------------------- */

  const normalizedSpaces: SpaceWithAssignment[] = useMemo(() => {
    if (!occupancyData?.data || !Array.isArray(occupancyData.data)) return [];
    return occupancyData.data.filter((space): space is SpaceWithAssignment => 
      space && 
      typeof space === 'object' && 
      'id' in space && 
      typeof space.id === 'number'
    );
  }, [occupancyData]);

  const normalizedAvailableSpaces: AvailableSpace[] = useMemo(() => {
    if (!availableSpacesData?.data || !Array.isArray(availableSpacesData.data)) return [];
    return availableSpacesData.data.filter((space): space is AvailableSpace => 
      space && 
      typeof space === 'object' && 
      'id' in space && 
      typeof space.id === 'number'
    );
  }, [availableSpacesData]);

  const normalizedStaff: StaffForAssignment[] = useMemo(() => {
    if (!staffData?.data || !Array.isArray(staffData.data)) return [];
    return staffData.data.filter((staff): staff is StaffForAssignment => 
      staff && 
      typeof staff === 'object' && 
      'staff_id' in staff && 
      typeof staff.staff_id === 'number'
    );
  }, [staffData]);

  /* ------------------------ Client-Side Filtering ------------------------- */

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    
    return normalizedSpaces.filter(space => {
      // Apply occupancy filter
      if (occupancyFilter === 'occupied' && !space.current_assignment) return false;
      if (occupancyFilter === 'available' && space.current_assignment) return false;
      
      // Apply space type filter
      if (spaceTypeFilter !== 'all' && space.type !== spaceTypeFilter) return false;
      
      // Apply building filter
      if (buildingFilter !== 'all' && space.building !== buildingFilter) return false;
      
      // Apply floor filter
      if (floorFilter !== 'all' && space.floor !== floorFilter) return false;
      
      // Apply search term
      if (term) {
        const name = safeLower(space.name);
        const type = safeLower(space.type);
        const building = safeLower(space.building);
        const floor = safeLower(space.floor);
        const staffName = space.current_assignment?.staff?.user?.full_name || '';
        const staffId = space.current_assignment?.staff?.employee_id || '';
        
        return (
          name.includes(term) ||
          type.includes(term) ||
          building.includes(term) ||
          floor.includes(term) ||
          safeLower(staffName).includes(term) ||
          safeLower(staffId).includes(term)
        );
      }
      
      return true;
    });
  }, [
    normalizedSpaces, 
    searchTerm, 
    occupancyFilter, 
    spaceTypeFilter, 
    buildingFilter, 
    floorFilter
  ]);

  /* ------------------------ Extract Filters Options ------------------------- */

  const spaceTypes = useMemo(() => {
    const types = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.type) types.add(space.type);
    });
    return Array.from(types).sort();
  }, [normalizedSpaces]);

  const buildings = useMemo(() => {
    const buildingsSet = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.building) buildingsSet.add(space.building);
    });
    return Array.from(buildingsSet).sort();
  }, [normalizedSpaces]);

  const floors = useMemo(() => {
    const floorsSet = new Set<string>();
    normalizedSpaces.forEach(space => {
      if (space.floor) floorsSet.add(space.floor);
    });
    return Array.from(floorsSet).sort();
  }, [normalizedSpaces]);

  /* ---------------------------- Mutations --------------------------------- */

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

  /* ------------------------ Cache Update Helpers -------------------------- */

  const updateSpaceInCache = (spaceId: number, updateFn: (space: SpaceWithAssignment) => SpaceWithAssignment) => {
    queryClient.setQueriesData(
      { queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters) },
      (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const data = oldData as { data?: SpaceWithAssignment[] };
        
        if (!data.data || !Array.isArray(data.data)) return oldData;
        
        return {
          ...data,
          data: data.data.map(space => 
            space.id === spaceId ? updateFn(space) : space
          ),
        };
      }
    );
  };

  /* -------------------------- Drawer Handlers ----------------------------- */

  const openAssignDrawer = (space?: SpaceWithAssignment) => {
    if (space) {
      setSelectedSpace(space);
      setAssignFormData(prev => ({
        ...prev,
        space_id: space.id
      }));
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

  /* -------------------------- Form Submission ----------------------------- */

  const handleAssignSubmit = () => {
    const { facility_id, space_id, staff_id } = assignFormData;
    
    if (!facility_id || !space_id || !staff_id) {
      console.error('Missing required fields for assignment');
      return;
    }

    const payload: AssignSpaceRequest = {
      facility_id,
      space_id,
      staff_id,
      note: assignFormData.note.trim() || undefined,
    };

    // Optimistic update
    const targetSpace = normalizedSpaces.find(s => s.id === space_id) || normalizedAvailableSpaces.find(s => s.id === space_id);
    const selectedStaff = normalizedStaff.find(s => s.staff_id === staff_id);
    
    if (targetSpace && selectedStaff) {
      const tempId = Date.now();
      
      const optimisticAssignment = createOptimisticAssignment(
        tempId,
        facility_id,
        space_id,
        staff_id,
        assignFormData.note.trim() || null,
        targetSpace,
        selectedStaff
      );

      updateSpaceInCache(space_id, (space) => ({
        ...space,
        current_assignment: optimisticAssignment,
      }));
    }

    assignMutation.mutate(payload, {
      onError: () => {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters) });
      },
    });
  };

  const handleReleaseSubmit = () => {
    const { facility_id, staff_id, assignment_id } = releaseFormData;
    
    if (!facility_id || !staff_id || !assignment_id || !selectedSpace) {
      console.error('Missing required fields for release');
      return;
    }

    const payload = {
      facility_id,
      staff_id,
    };

    // Optimistic update
    const previousAssignment = selectedSpace.current_assignment;
    
    if (previousAssignment) {
      const optimisticAssignment = createOptimisticReleasedAssignment(
        previousAssignment,
        releaseFormData.note.trim() || null
      );

      updateSpaceInCache(selectedSpace.id, (space) => ({
        ...space,
        current_assignment: optimisticAssignment,
      }));
    }

    releaseMutation.mutate(payload, {
      onError: () => {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.occupancy(occupancyFilters) });
      },
    });
  };

  /* -------------------------- Delete Handler ------------------------------ */

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

  /* ------------------------- Toggle Handlers ------------------------------ */

  const toggleExpand = (id: number) => {
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

  const canAssign = !!assignFormData.facility_id && !!assignFormData.space_id && !!assignFormData.staff_id;
  const canRelease = !!releaseFormData.facility_id && !!releaseFormData.staff_id && !!releaseFormData.assignment_id;
  const isAssigning = assignMutation.isPending;
  const isReleasing = releaseMutation.isPending;

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

  /* --------------------------- Statistics Calculations -------------------- */

  const occupiedCount = normalizedSpaces.filter(s => s.current_assignment).length;
  const availableCount = normalizedSpaces.filter(s => !s.current_assignment).length;
  const totalCapacity = normalizedSpaces.length;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

  /* --------------------------- Guard Clauses ------------------------------ */

  if (!activeFacilityId) {
    return (
      <div className={cn('rounded-xl p-8 text-center', colors.bg.secondary)}>
        <Building2 className={cn('w-12 h-12 mx-auto mb-4', colors.text.tertiary)} />
        <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>No Facility Selected</h3>
        <p className={colors.text.secondary}>
          Please select a facility from the sidebar to manage space allocations.
        </p>
      </div>
    );
  }

  if (isLoadingOccupancy && !occupancyData) {
    return <LoadingSkeleton variant="table" theme={theme} message="Loading space allocations..." />;
  }

  /* ---------------------------- Render Functions -------------------------- */

  const renderSpaceRow = (space: SpaceWithAssignment) => {
    const isExpanded = expandedRows.has(space.id);
    const SpaceIcon = getSpaceTypeIcon(space.type);
    const assignment = space.current_assignment;
    const isOccupied = !!assignment;

    return (
      <div key={space.id} className={cn('border-b last:border-b-0', colors.border.primary)}>
        {/* Main Row */}
        <div
          className={cn(
            'grid grid-cols-12 gap-4 p-4 items-center transition-colors',
            colors.bg.hover,
            !isOccupied && 'cursor-pointer'
          )}
          onClick={() => !isOccupied && toggleExpand(space.id)}
        >
          {/* Name */}
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              {isOccupied && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
              <SpaceIcon className={cn('w-4 h-4', getSpaceTypeColor(space.type))} />
              <span className={cn('font-medium', colors.text.primary)}>{space.name}</span>
              {!space.is_active && (
                <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                  Occupied
                </span>
              )}
            </div>
          </div>

          {/* Type & Location */}
          <div className="col-span-2">
          <div className="space-y-1">
            <span className={cn('text-sm', colors.text.secondary)}>
              {(space.type?.charAt(0)?.toUpperCase() ?? '') + (space.type?.slice(1) ?? '')}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Building className="w-3 h-3" />
              <span className={colors.text.tertiary}>
                {space.building || 'N/A'}{space.floor ? `, ${space.floor}` : ''}
              </span>
            </div>
          </div>
        </div>

          {/* Assigned To */}
          <div className="col-span-3">
            {isOccupied ? (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                <div>
                  <p className={cn('font-medium', colors.text.primary)}>
                    {assignment?.staff?.user?.full_name || 'Unknown Staff'}
                  </p>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {assignment?.staff?.employee_id || ''} • {assignment?.staff?.role_code || ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-green-500" />
                <span className={cn('font-medium text-green-500')}>Available</span>
              </div>
            )}
          </div>

          {/* Assignment Details */}
          <div className="col-span-2">
            {isOccupied && assignment ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="w-3 h-3" />
                  <span className={colors.text.secondary}>
                    {formatDate(assignment.assigned_at)}
                  </span>
                </div>
                {assignment.note && (
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="w-3 h-3" />
                    <span className={cn('truncate', colors.text.tertiary)} title={assignment.note}>
                      {assignment.note}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className={cn('text-sm italic', colors.text.tertiary)}>Unassigned</span>
            )}
          </div>

          {/* Actions */}
          <div className="col-span-2 flex items-center justify-end gap-2">
            {isOccupied ? (
              <>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleRelease(space);
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer',
                    'border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                  )}
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Release</span>
                </button>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    toggleExpand(space.id);
                  }}
                  className={cn(
                    'p-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.hover
                  )}
                  title="Details"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  openAssignDrawer(space);
                }}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
                  colors.accent.primary,
                  colors.accent.hover,
                  colors.accent.text
                )}
              >
                <User className="w-4 h-4" />
                <span>Assign</span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && isOccupied && assignment && (
          <div className={cn('p-4 border-t', colors.bg.secondary, colors.border.primary)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Assigned On</p>
                <p className={colors.text.primary}>{formatDateTime(assignment.assigned_at)}</p>
              </div>
              <div>
                <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Staff Details</p>
                <p className={colors.text.primary}>
                  Staff Number: {assignment.staff?.staff_uuid || 'N/A'}<br/>
                  Role: {formatName(assignment.staff?.role_code) || 'N/A'}
                </p>
              </div>
              <div>
                <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Space Status</p>
                <p className={colors.text.primary}>
                  {space.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </p>
              </div>
              {assignment.note && (
                <div className="col-span-2 md:col-span-4">
                  <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>Assignment Notes</p>
                  <p className={cn('text-sm italic p-2 rounded bg-black/5', colors.text.primary)}>
                    {assignment.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSpaceCard = (space: SpaceWithAssignment) => {
    const SpaceIcon = getSpaceTypeIcon(space.type);
    const assignment = space.current_assignment;
    const isOccupied = !!assignment;

    return (
      <div
        key={space.id}
        className={cn(
          'rounded-xl p-6 border transition-all',
          colors.border.primary,
          colors.bg.elevated,
          'hover:shadow-lg',
          isOccupied ? 'cursor-default' : 'cursor-pointer hover:scale-105'
        )}
        onClick={() => !isOccupied && openAssignDrawer(space)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colors.bg.secondary)}>
              <SpaceIcon className={cn('w-6 h-6', getSpaceTypeColor(space.type))} />
            </div>
            <div>
              <h3 className={cn('font-semibold', colors.text.primary)}>{space.name}</h3>
              <p className={cn('text-sm', colors.text.secondary)}>
                {space.type.charAt(0).toUpperCase() + space.type.slice(1)}
              </p>
            </div>
          </div>

          {isOccupied ? (
            <div className="flex flex-col items-end">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-blue-500 mt-1">Occupied</span>
            </div>
          ) : (
            <DoorOpen className="w-5 h-5 text-green-500" />
          )}
        </div>

        {/* Location */}
        <div className={cn('mb-4 p-3 rounded-lg', colors.bg.secondary)}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className={cn('w-4 h-4', colors.text.tertiary)} />
            <span className={cn('text-sm', colors.text.secondary)}>
              {space.building || 'No building'} {space.floor ? `· ${space.floor}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building className={cn('w-4 h-4', colors.text.tertiary)} />
            <span className={cn('text-sm', colors.text.secondary)}>
              Space ID: {space.id}
            </span>
          </div>
          {!space.is_active && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                Space Inactive
              </span>
            </div>
          )}
        </div>

        {/* Assignment Details */}
        {isOccupied && assignment && (
          <div className={cn('mb-4 p-3 rounded-lg border', colors.border.primary)}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className={cn('font-medium', colors.text.primary)}>
                {assignment.staff?.user?.full_name || 'Unknown Staff'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs')}>
                  {assignment.staff?.employee_id || 'N/A'}
                </span>
                <span className={cn('px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 text-xs')}>
                  {assignment.staff?.role_code || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-3 h-3" />
                <span className={colors.text.secondary}>
                  Assigned: {formatDate(assignment.assigned_at)}
                </span>
              </div>
              {assignment.note && (
                <div className="mt-2 p-2 rounded bg-black/5">
                  <p className={cn('text-xs italic', colors.text.secondary)}>
                    "{assignment.note}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isOccupied ? (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleRelease(space);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                'border border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
              )}
            >
              <DoorOpen className="w-4 h-4" />
              <span>Release Space</span>
            </button>
          ) : (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                openAssignDrawer(space);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                colors.accent.primary,
                colors.accent.hover,
                colors.accent.text
              )}
            >
              <User className="w-4 h-4" />
              <span>Assign Space</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ---------------------------- Render JSX -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>Space Allocation</h1>
            <p className={colors.text.secondary}>
              Manage workspace assignments for staff members across the facility
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchOccupancy()}
              className={cn(
                'p-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.bg.hover
              )}
              title="Refresh"
              type="button"
            >
              <RefreshCw className={cn('w-5 h-5', colors.text.secondary)} />
            </button>

            <button
              onClick={() => openAssignDrawer()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                colors.accent.primary,
                colors.accent.hover,
                colors.accent.text
              )}
              type="button"
            >
              <Plus className="w-5 h-5" />
              <span>Assign Space</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Total Spaces</p>
            <p className={cn('text-2xl font-bold', colors.text.primary)}>{totalCapacity}</p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Occupied</p>
            <p className="text-2xl font-bold text-blue-500">{occupiedCount}</p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Available</p>
            <p className="text-2xl font-bold text-green-500">{availableCount}</p>
          </div>
          <div className={cn('p-4 rounded-lg', colors.bg.secondary)}>
            <p className={cn('text-sm', colors.text.secondary)}>Occupancy Rate</p>
            <p className="text-2xl font-bold text-purple-500">{occupancyRate}%</p>
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
                placeholder="Search spaces by name, type, building, floor, or assigned staff..."
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
            type="button"
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
              type="button"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors cursor-pointer',
                viewMode === 'grid' ? colors.accent.primary + ' text-white' : colors.bg.hover
              )}
              type="button"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div
            className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t"
            style={{ borderColor: colors.border.primary.split(' ')[0].replace('border-', '') }}
          >
            {/* Space Type Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Space Type
              </label>
              <select
                value={spaceTypeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSpaceTypeFilter(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Types</option>
                {spaceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Building Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Building
              </label>
              <select
                value={buildingFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuildingFilter(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Buildings</option>
                {buildings.map(building => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Floor
              </label>
              <select
                value={floorFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFloorFilter(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Floors</option>
                {floors.map(floor => (
                  <option key={floor} value={floor}>
                    {floor}
                  </option>
                ))}
              </select>
            </div>

            {/* Occupancy Filter */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                Occupancy
              </label>
              <select
                value={occupancyFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOccupancyFilter(e.target.value as any)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary
                )}
              >
                <option value="all">All Spaces</option>
                <option value="occupied">Occupied</option>
                <option value="available">Available</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSpaceTypeFilter('all');
                  setBuildingFilter('all');
                  setFloorFilter('all');
                  setOccupancyFilter('all');
                }}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover
                )}
                type="button"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {occupancyError && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-500">Error Loading Space Allocations</p>
              <p className={cn('text-sm', colors.text.secondary)}>{getErrorMessage(occupancyError)}</p>
            </div>
            <button
              onClick={() => refetchOccupancy()}
              className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingOccupancy && filteredSpaces.length === 0 && (
        <div className={cn('rounded-xl p-12 text-center', colors.bg.secondary)}>
          <DoorOpen className={cn('w-16 h-16 mx-auto mb-4', colors.text.tertiary)} />
          <h3 className={cn('text-lg font-medium mb-2', colors.text.primary)}>
            {searchTerm || spaceTypeFilter !== 'all' || occupancyFilter !== 'all' ? 'No Spaces Found' : 'No Spaces Available'}
          </h3>
          <p className={cn('mb-6', colors.text.secondary)}>
            {searchTerm || spaceTypeFilter !== 'all' || occupancyFilter !== 'all'
              ? 'Try adjusting your filters or search criteria'
              : 'All spaces are currently unallocated or no spaces are configured'}
          </p>
          {!searchTerm && spaceTypeFilter === 'all' && occupancyFilter === 'all' && (
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
              <span>Assign First Space</span>
            </button>
          )}
        </div>
      )}

      {/* List View */}
      {!isLoadingOccupancy && filteredSpaces.length > 0 && viewMode === 'list' && (
        <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
          {/* Table Header */}
          <div className={cn('grid grid-cols-12 gap-4 p-4 font-medium border-b', colors.bg.secondary, colors.border.primary)}>
            <div className="col-span-3">Space Name</div>
            <div className="col-span-2">Type & Location</div>
            <div className="col-span-3">Assigned To</div>
            <div className="col-span-2">Assignment Details</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className={colors.bg.elevated}>
            {filteredSpaces.map(renderSpaceRow)}
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoadingOccupancy && filteredSpaces.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map(renderSpaceCard)}
        </div>
      )}

      {/* Assign Space Drawer */}
      {assignDrawerOpen && (
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
                Assign Space to Staff
              </h2>
              <p className={colors.text.secondary}>
                Select a space and staff member to create an assignment
              </p>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Space Selection */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Select Space <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignFormData.space_id || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setAssignFormData(prev => ({ 
                      ...prev, 
                      space_id: e.target.value ? parseInt(e.target.value) : null 
                    }))
                  }
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary
                  )}
                >
                  <option value="">Select a space...</option>
                  {normalizedAvailableSpaces.map(space => (
                    <option key={space.id} value={space.id}>
                      {space.name} - {space.type} ({space.building || 'No building'} {space.floor ? `, ${space.floor}` : ''})
                    </option>
                  ))}
                </select>
                <p className={cn('text-xs mt-1', colors.text.tertiary)}>
                  {normalizedAvailableSpaces.length} available spaces
                </p>
              </div>

              {/* Staff Selection */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Select Staff <span className="text-red-500">*</span>
                </label>
                <select
                  value={assignFormData.staff_id || ''}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setAssignFormData(prev => ({ 
                      ...prev, 
                      staff_id: e.target.value ? parseInt(e.target.value) : null 
                    }))
                  }
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary
                  )}
                  disabled={isLoadingStaff}
                >
                  <option value="">Select a staff member...</option>
                  {normalizedStaff.map(staff => (
                    <option key={staff.staff_id} value={staff.staff_id}>
                      {staff.full_name} - {staff.staff_uuid} ({formatDisplayName(staff.role_code)})
                    </option>
                  ))}
                </select>
                <p className={cn('text-xs mt-1', colors.text.tertiary)}>
                  {isLoadingStaff ? 'Loading staff...' : `${normalizedStaff.length} staff members available`}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignFormData.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAssignFormData(prev => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Add notes about this assignment (e.g., reason, duration, special requirements)..."
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

              {/* Selected Space Preview */}
              {assignFormData.space_id && (() => {
                const selectedSpace = normalizedAvailableSpaces.find(s => s.id === assignFormData.space_id);
                if (!selectedSpace) return null;
                
                return (
                  <div className={cn('p-4 rounded-lg border', colors.border.primary, colors.bg.secondary)}>
                    <h4 className={cn('text-sm font-medium mb-2', colors.text.secondary)}>Selected Space Preview</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={cn('text-xs', colors.text.tertiary)}>Space Name</p>
                        <p className={cn('font-medium', colors.text.primary)}>{selectedSpace.name}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs', colors.text.tertiary)}>Type</p>
                        <p className={cn('font-medium', colors.text.primary)}>
                          {selectedSpace.type.charAt(0).toUpperCase() + selectedSpace.type.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className={cn('text-xs', colors.text.tertiary)}>Building</p>
                        <p className={cn('font-medium', colors.text.primary)}>{selectedSpace.building || 'N/A'}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs', colors.text.tertiary)}>Floor</p>
                        <p className={cn('font-medium', colors.text.primary)}>{selectedSpace.floor || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer */}
            <div className={cn('sticky bottom-0 p-6 border-t flex items-center justify-end gap-3', colors.bg.elevated, colors.border.primary)}>
              <button
                onClick={closeAssignDrawer}
                disabled={isAssigning}
                className={cn(
                  'px-6 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover,
                  isAssigning && 'opacity-50 cursor-not-allowed'
                )}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!canAssign || isAssigning}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                  colors.accent.primary,
                  colors.accent.hover,
                  colors.accent.text,
                  (!canAssign || isAssigning) && 'opacity-50 cursor-not-allowed'
                )}
                type="button"
              >
                {isAssigning ? 'Assigning...' : 'Assign Space'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Space Drawer */}
      {releaseDrawerOpen && selectedSpace && selectedSpace.current_assignment && (
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
                Release Space
              </h2>
              <p className={colors.text.secondary}>
                Confirm release of space from staff member
              </p>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Current Assignment Summary */}
              <div className={cn('p-4 rounded-lg border', 'border-orange-500/30 bg-orange-500/10')}>
                <h4 className={cn('text-sm font-medium mb-3 text-orange-500')}>Current Assignment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={cn('text-xs', colors.text.tertiary)}>Space</p>
                    <p className={cn('font-medium', colors.text.primary)}>{selectedSpace.name}</p>
                  </div>
                  <div>
                    <p className={cn('text-xs', colors.text.tertiary)}>Type</p>
                    <p className={cn('font-medium', colors.text.primary)}>
                      {selectedSpace.type.charAt(0).toUpperCase() + selectedSpace.type.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs', colors.text.tertiary)}>Assigned To</p>
                    <p className={cn('font-medium', colors.text.primary)}>
                      {selectedSpace.current_assignment.staff?.user?.full_name || 'Unknown Staff'}
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs', colors.text.tertiary)}>Assigned On</p>
                    <p className={cn('font-medium', colors.text.primary)}>
                      {formatDateTime(selectedSpace.current_assignment.assigned_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Release Notes */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
                  Release Notes (Optional)
                </label>
                <textarea
                  value={releaseFormData.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReleaseFormData(prev => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Add notes about why this space is being released..."
                  rows={3}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border transition-colors cursor-text',
                    colors.border.primary,
                    colors.bg.primary,
                    colors.text.primary,
                    'focus:outline-none focus:ring-2 focus:ring-orange-500'
                  )}
                />
              </div>

              {/* Warning */}
              <div className={cn('p-4 rounded-lg border', 'border-orange-500/30 bg-orange-500/5')}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={cn('font-medium text-orange-500')}>Important Note</p>
                    <p className={cn('text-sm mt-1', colors.text.secondary)}>
                      Releasing this space will make it available for other staff assignments. 
                      The staff member will no longer have access to this workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={cn('sticky bottom-0 p-6 border-t flex items-center justify-end gap-3', colors.bg.elevated, colors.border.primary)}>
              <button
                onClick={closeReleaseDrawer}
                disabled={isReleasing}
                className={cn(
                  'px-6 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover,
                  isReleasing && 'opacity-50 cursor-not-allowed'
                )}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseSubmit}
                disabled={!canRelease || isReleasing}
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                  'bg-orange-500 hover:bg-orange-600 text-white',
                  (!canRelease || isReleasing) && 'opacity-50 cursor-not-allowed'
                )}
                type="button"
              >
                {isReleasing ? 'Releasing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};