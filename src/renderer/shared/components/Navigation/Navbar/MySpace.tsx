/**
 * ============================================================================
 * MY SPACE COMPONENT - STAFF SELF-SERVICE ROOM BOOKING
 * ============================================================================
 *
 * Key behavior changes from StaffPresence:
 * - ✅ Auto-refresh data via React Query (no manual refetch calls)
 * - ✅ Uses query invalidation for mutations instead of manual refetch
 * - ✅ No refetch() calls - relies on query cache and invalidation
 * - ✅ Consistent loading/error states
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  DoorOpen,
  DoorClosed,
  MapPin,
  Building,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  LogIn,
  LogOut,
  DoorClosedLocked,
  Plus,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import {
  staffSpaceAssignmentKeys,
  useGetCurrentOccupancy,
  useAssignMySpace,
  useReleaseMySpace,
} from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';
import type {
  SpaceWithAssignment,
  OccupancyFilters,
} from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentTypes';
import { useSpaceReminder } from '../../../../app/hooks/useSpaceReminder';
import { useCreateFacilitySpace, facilitySpaceKeys } from '../../../../modules/administration/admin-module/api/facility-space/FacilitySpaceQueries';
import type { CreateFacilitySpaceRequest } from '../../../../modules/administration/admin-module/api/facility-space/FacilitySpaceTypes';

interface MySpaceProps {
  isDark: boolean;
  isMobile: boolean;
  className?: string;
}

const safeLower = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return value.toLowerCase();
};

const formatDisplayName = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  return value.charAt(0).toUpperCase() + value.slice(1);
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

const getSpaceTypeColor = (type: string | null | undefined): string => {
  return SPACE_TYPE_COLORS[type?.toLowerCase() ?? ''] || SPACE_TYPE_COLORS.default;
};

export const MySpace: React.FC<MySpaceProps> = ({ isDark, isMobile, className }) => {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ 
    name: '', 
    type: 'consultation', 
    floor: '', 
    building: '' 
  });

  const handleSetRoom = useCallback(() => {
    setIsDropdownOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 150);
  }, []);

  useSpaceReminder(handleSetRoom);

  const activeFacilityId = useAppSelector((state) => state.activeContext.activeFacilityId);
  const currentStaffId = useAppSelector((state) => state.activeContext.capabilities?.staff?.staff_id);

  const occupancyFilters: OccupancyFilters = useMemo(
    () => ({
      facility_id: activeFacilityId || 0,
      per_page: 100,
    }),
    [activeFacilityId]
  );

  const {
    data: occupancyData,
    isLoading,
    isError,
    isRefetching,
  } = useGetCurrentOccupancy(occupancyFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0,
  });

  const assignMutation = useAssignMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
    },
  });

  const releaseMutation = useReleaseMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
    },
  });

  const createSpaceMutation = useCreateFacilitySpace({
    onSuccess: () => {
      setShowAddRoom(false);
      setNewRoom({ name: '', type: 'consultation', floor: '', building: '' });
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      queryClient.invalidateQueries({ queryKey: facilitySpaceKeys.all });
    },
  });

  const normalizedSpaces: SpaceWithAssignment[] = useMemo(() => {
    if (!occupancyData?.data || !Array.isArray(occupancyData.data)) return [];
    return occupancyData.data.filter(
      (space): space is SpaceWithAssignment =>
        space && typeof space === 'object' && 'id' in space && typeof space.id === 'number'
    );
  }, [occupancyData]);

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    if (!term) return normalizedSpaces;

    return normalizedSpaces.filter((space) => {
      const name = safeLower(space.name);
      const type = safeLower(space.type);
      const building = safeLower(space.building);
      const floor = safeLower(space.floor);

      return (
        name.includes(term) ||
        type.includes(term) ||
        building.includes(term) ||
        floor.includes(term)
      );
    });
  }, [normalizedSpaces, searchTerm]);

  const myCurrentSpace = useMemo(() => {
    return normalizedSpaces.find((space) => space.current_assignment?.staff_id === currentStaffId);
  }, [normalizedSpaces, currentStaffId]);

  const availableCount = normalizedSpaces.filter((s) => !s.current_assignment).length;
  const occupiedCount = normalizedSpaces.filter((s) => s.current_assignment).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowAddRoom(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchTerm('');
      setShowAddRoom(false);
    }
  };

  const handleOccupy = async (space: SpaceWithAssignment) => {
    if (!activeFacilityId) return;
    try {
      await assignMutation.mutateAsync({
        facility_id: activeFacilityId,
        space_id: space.id,
        note: 'Self-assigned via MySpace',
      });
    } catch (error) {
      console.error('Failed to occupy space:', error);
    }
  };

  const handleLeave = async () => {
    if (!activeFacilityId || !myCurrentSpace) return;
    try {
      await releaseMutation.mutateAsync({ facility_id: activeFacilityId });
    } catch (error) {
      console.error('Failed to leave space:', error);
    }
  };

  const handleCreateRoom = () => {
    if (!newRoom.name.trim() || !activeFacilityId) return;
    createSpaceMutation.mutate({
      facility_id: activeFacilityId,
      name: newRoom.name.trim(),
      type: newRoom.type,
      floor: newRoom.floor || null,
      building: newRoom.building || null,
    } as CreateFacilitySpaceRequest);
  };

  if (!activeFacilityId) return null;

  const isInitialLoading = isLoading;
  const isSyncing = isRefetching || assignMutation.isPending || releaseMutation.isPending;
  const currentSpaceName = myCurrentSpace?.name || 'No Room';
  const topLineText = isInitialLoading ? 'Loading...' : currentSpaceName;
  const bottomLineText = isSyncing ? 'Syncing...' : 'My Room';

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Dropdown Button */}
      <button
        onClick={handleToggle}
        disabled={isSyncing}
        aria-label="Occupy or Leave Room"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          myCurrentSpace
            ? isDark
              ? 'ring-blue-500/60'
              : 'ring-blue-600/70'
            : isDark
              ? 'ring-gray-500/50'
              : 'ring-gray-400/60',
          isDark ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          !isSyncing && 'hover:scale-[1.02] active:scale-[0.98]',
          isSyncing && 'opacity-75 cursor-not-allowed'
        )}
      >
        <div
          className={cn(
            'relative flex items-center justify-center w-7 h-7 rounded-full',
            'ring-1 ring-offset-1',
            myCurrentSpace
              ? isDark
                ? 'ring-blue-500/60'
                : 'ring-blue-600/70'
              : isDark
                ? 'ring-gray-500/50'
                : 'ring-gray-400/60',
            myCurrentSpace 
              ? isDark 
                ? 'bg-blue-500/15' 
                : 'bg-blue-50' 
              : isDark 
                ? 'bg-gray-500/10' 
                : 'bg-gray-100',
            isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
          )}
        >
          <div
            className={
              myCurrentSpace
                ? isDark
                  ? 'text-blue-400'
                  : 'text-blue-700'
                : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
            }
          >
            {myCurrentSpace ? <DoorClosed className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {topLineText}
          </span>
          <span className={cn('text-xs truncate', isDark ? 'text-gray-100' : 'text-gray-900')}>
            {bottomLineText}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'hidden lg:block w-3 h-3 ml-auto transition-transform duration-200',
            isDark ? 'text-gray-400' : 'text-gray-500',
            isDropdownOpen && 'rotate-180'
          )}
        />

        {isSyncing && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className={cn('w-3 h-3 animate-spin', isDark ? 'text-blue-400' : 'text-blue-600')} />
          </div>
        )}
      </button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div
          className={cn(
            'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
            isMobile
              ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md'
              : 'absolute right-0 mt-2 w-80 sm:w-96',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}
        >
          {/* Header */}
          <div className={cn('px-3 py-2 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className={cn('text-xs font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>
                My Workspace
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAddRoom(true)}
                  className={cn(
                    'cursor-pointer px-1.5 py-0.5 text-xs rounded-full transition-all',
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                  title="Add a new room"
                >
                  <Plus className="w-3 h-3 inline mr-0.5" />
                  Add room
                </button>
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500">
                  {availableCount} Available
                </span>
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500">
                  {occupiedCount} Occupied
                </span>
              </div>
            </div>

            {myCurrentSpace ? (
              <div
                className={cn(
                  'p-2 rounded-md border flex items-center justify-between',
                  isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50/70 border-blue-200/50'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <DoorClosed className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className={cn('text-xs font-medium truncate', isDark ? 'text-gray-200' : 'text-gray-900')}>
                      Currently in: {myCurrentSpace.name}
                    </p>
                    <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {formatDisplayName(myCurrentSpace.type)} • {myCurrentSpace.building || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  disabled={isSyncing}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                    'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
                    'transition-colors cursor-pointer flex-shrink-0',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    isSyncing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <LogOut className="w-3 h-3" />
                  Leave
                </button>
              </div>
            ) : (
              <div className={cn('p-2 rounded-md border text-center', isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-gray-50/70 border-gray-200')}>
                <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  No room currently occupied
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className={cn('px-3 py-2 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <div className="relative">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )}
              />
              <input
                type="text"
                placeholder="Search rooms..."
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-1.5 rounded-md border text-sm transition-colors',
                  isDark
                    ? 'bg-gray-800/40 border-gray-700 text-gray-200 placeholder-gray-500'
                    : 'bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-1 focus:ring-inset',
                  isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30'
                )}
              />
            </div>
          </div>

          {/* Spaces List */}
          <div className={cn('overflow-y-auto', isMobile ? 'max-h-[60vh]' : 'max-h-80')}>
            {isInitialLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-gray-500' : 'text-gray-400')} />
              </div>
            ) : isError ? (
              <div className="p-4 text-center">
                <AlertCircle className={cn('w-6 h-6 mx-auto mb-2', isDark ? 'text-red-400' : 'text-red-500')} />
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Failed to load spaces
                </p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="p-6 text-center">
                <DoorClosedLocked className={cn('w-8 h-8 mx-auto mb-2', isDark ? 'text-gray-500' : 'text-gray-400')} />
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {searchTerm ? 'No rooms found' : 'No rooms available'}
                </p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {filteredSpaces.map((space) => {
                  const isOccupied = !!space.current_assignment;
                  const isMySpace = space.current_assignment?.staff_id === currentStaffId;
                  const canOccupy = !isOccupied && !myCurrentSpace;
                  const isUpdating = assignMutation.isPending && assignMutation.variables?.space_id === space.id;

                  return (
                    <div
                      key={space.id}
                      className={cn(
                        'group/item p-2 rounded-md border transition-all',
                        isDark ? 'border-gray-800' : 'border-gray-200',
                        isMySpace &&
                          (isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50/70 border-blue-200/50'),
                        !isMySpace &&
                          (isDark ? 'bg-gray-800/40 hover:bg-gray-800/70' : 'bg-gray-50/70 hover:bg-gray-100/70'),
                        'hover:scale-[1.01] active:scale-[0.99]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className={cn('text-xs font-semibold truncate', isDark ? 'text-gray-200' : 'text-gray-900')}>
                              {space.name}
                            </h4>
                            {isOccupied ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0">
                                <DoorClosed className="w-3 h-3" />
                                Occupied
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                Available
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-xs', getSpaceTypeColor(space.type))}>
                                {formatDisplayName(space.type)}
                              </span>
                            </div>

                            {(space.building || space.floor) && (
                              <div className="flex items-center gap-2 text-xs">
                                {space.building && (
                                  <div className="flex items-center gap-1">
                                    <Building className={cn('w-3 h-3', isDark ? 'text-gray-500' : 'text-gray-400')} />
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                      {space.building}
                                    </span>
                                  </div>
                                )}
                                {space.floor && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className={cn('w-3 h-3', isDark ? 'text-gray-500' : 'text-gray-400')} />
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                      {space.floor}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {isOccupied && !isMySpace && (
                            <p className={cn('text-xs mt-1.5', 'text-gray-500')}>
                              In use by: {space.current_assignment?.staff?.user?.full_name || 'Unknown'}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {canOccupy ? (
                            <button
                              onClick={() => handleOccupy(space)}
                              disabled={assignMutation.isPending}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                                'bg-blue-600 text-white hover:bg-blue-700',
                                'transition-colors cursor-pointer',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                assignMutation.isPending && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <LogIn className="w-3 h-3" />
                                  Occupy
                                </>
                              )}
                            </button>
                          ) : isOccupied && !isMySpace ? (
                            <div
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                                isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-200/70 text-gray-500'
                              )}
                            >
                              <XCircle className="w-3 h-3" />
                              Unavailable
                            </div>
                          ) : !canOccupy && !isOccupied ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-orange-500/10 text-orange-500">
                              <AlertCircle className="w-3 h-3" />
                              Leave current
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Room Form */}
          {showAddRoom && (
            <div className={cn('p-3 border-t space-y-2', isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50')}>
              <h4 className={cn('text-xs font-semibold', isDark ? 'text-gray-200' : 'text-gray-700')}>
                Add a new room
              </h4>
              <input
                className={cn(
                  'w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none',
                  isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
                )}
                placeholder="Room name"
                value={newRoom.name}
                onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs outline-none',
                    isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
                  )}
                  value={newRoom.type}
                  onChange={(e) => setNewRoom((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="consultation">Consultation</option>
                  <option value="triage">Triage</option>
                  <option value="lab">Lab</option>
                  <option value="office">Office</option>
                  <option value="ward">Ward</option>
                </select>
                <input
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs outline-none',
                    isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
                  )}
                  placeholder="Floor"
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom((p) => ({ ...p, floor: e.target.value }))}
                />
                <input
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs outline-none',
                    isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
                  )}
                  placeholder="Building"
                  value={newRoom.building}
                  onChange={(e) => setNewRoom((p) => ({ ...p, building: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddRoom(false)}
                  className={cn(
                    'cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-medium',
                    isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={createSpaceMutation.isPending || !newRoom.name.trim()}
                  className={cn(
                    'cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all',
                    !newRoom.name.trim() 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {createSpaceMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Indicator */}
      {isError && (
        <div className="absolute -top-1 -right-1 z-10 cursor-help" title="Failed to load space data">
          <div className={cn('p-0.5 rounded-full', isDark ? 'bg-gray-900' : 'bg-white')}>
            <AlertCircle className="w-3 h-3 text-red-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MySpace);