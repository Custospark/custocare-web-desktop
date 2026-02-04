/**
 * ============================================================================
 * MY SPACE COMPONENT - STAFF SELF-SERVICE ROOM BOOKING
 * ============================================================================
 * 
 * Self-service dropdown for staff to occupy/leave clinical spaces.
 * Features:
 * - Client-side search
 * - Real-time room status (Occupied/Available)
 * - Staff can only leave their own occupied rooms
 * - Blue theme with appropriate status colors
 * - Mobile-responsive design
 * - Type-safe with proper error handling
 * 
 * @module MySpace
 * @description Staff interface for self-managing space assignments
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Layers,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import {
  staffSpaceAssignmentKeys,
  useGetCurrentOccupancy,
  useAssignMySpace,
  useReleaseMySpace,
}  from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';
import type {
  SpaceWithAssignment,
  OccupancyFilters,
} from  '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentTypes';
/* -------------------------------------------------------------------------- */
/*                                COMPONENT PROPS                             */
/* -------------------------------------------------------------------------- */

interface MySpaceProps {
  isDark: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                               UTILITY FUNCTIONS                            */
/* -------------------------------------------------------------------------- */

const safeLower = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return value.toLowerCase();
};

const formatDisplayName = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/* -------------------------------------------------------------------------- */
/*                            SPACE TYPE COLORS                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const MySpace: React.FC<MySpaceProps> = ({ isDark, className }) => {
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------------------------- Local State ------------------------------- */
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /* ---------------------------- Redux State ------------------------------- */
  const activeFacilityId = useAppSelector(state => state.activeContext.activeFacilityId);
  const currentStaffId = useAppSelector(state => state.activeContext.capabilities?.staff?.staff_id);

  /* ---------------------------- API Queries ------------------------------- */
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
    error,
    refetch 
  } = useGetCurrentOccupancy(occupancyFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0 && isOpen,
    staleTime: 1000 * 30,
  });

  /* ---------------------------- Mutations --------------------------------- */
  const assignMutation = useAssignMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      refetch();
    },
  });

  const releaseMutation = useReleaseMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      refetch();
    },
  });

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

  /* ------------------------ Client-Side Filtering ------------------------- */
  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    
    if (!term) return normalizedSpaces;
    
    return normalizedSpaces.filter(space => {
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

  /* ------------------------ Derived State ------------------------- */
  const myCurrentSpace = useMemo(() => {
    return normalizedSpaces.find(
      space => space.current_assignment?.staff_id === currentStaffId
    );
  }, [normalizedSpaces, currentStaffId]);

  const availableCount = normalizedSpaces.filter(s => !s.current_assignment).length;
  const occupiedCount = normalizedSpaces.filter(s => s.current_assignment).length;

  /* ---------------------------- Effects ----------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* -------------------------- Event Handlers ------------------------------ */
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
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
      await releaseMutation.mutateAsync({
        facility_id: activeFacilityId,
      });
    } catch (error) {
      console.error('Failed to leave space:', error);
    }
  };

  /* --------------------------- Guard Clauses ------------------------------ */
  if (!activeFacilityId) {
    return null;
  }

  const isPending = assignMutation.isPending || releaseMutation.isPending;

  /* ---------------------------- Color Tokens ------------------------------ */
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      secondary: isDark ? 'border-gray-600' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
  };

  /* ---------------------------- Render JSX -------------------------------- */
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer',
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          !isPending && 'hover:scale-105 active:scale-95',
          isPending && 'opacity-75 cursor-not-allowed'
        )}
        title="My Space"
        aria-label="Manage my space"
        aria-expanded={isOpen}
      >
        {/* Icon - Visible on both mobile and desktop */}
        <div className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-full',
          'ring-1 ring-offset-1',
          myCurrentSpace
            ? 'ring-blue-500/60 bg-blue-500/15'
            : 'ring-gray-500/50 bg-gray-500/10',
          isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
        )}>
          {myCurrentSpace ? (
            <DoorClosed className="w-4 h-4 text-blue-500" />
          ) : (
            <DoorOpen className="w-4 h-4 text-gray-500" />
          )}
        </div>

        {/* Text - Visible only on large screens */}
        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn(
            'text-xs font-semibold truncate',
            colors.text.primary
          )}>
            {myCurrentSpace ? myCurrentSpace.name : 'No Space'}
          </span>
          <span className={cn('text-xs truncate', colors.text.secondary)}>
            My Space
          </span>
        </div>

        <ChevronDown className={cn(
          'hidden lg:block w-3 h-3 transition-transform duration-200',
          colors.text.secondary,
          isOpen && 'rotate-180'
        )} />

        {isPending && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className={cn(
              'w-3 h-3 animate-spin',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )} />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-xl z-50',
          'animate-in slide-in-from-top-2 fade-in duration-150',
          'ring-1',
          colors.bg.primary,
          colors.border.primary
        )}>
          {/* Header */}
          <div className={cn(
            'px-4 py-3 border-b',
            colors.border.primary
          )}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn('text-sm font-bold', colors.text.primary)}>
                My Space
              </h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  'bg-green-500/10 text-green-500'
                )}>
                  {availableCount} Available
                </span>
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  'bg-blue-500/10 text-blue-500'
                )}>
                  {occupiedCount} Occupied
                </span>
              </div>
            </div>

            {/* Current Space Status */}
            {myCurrentSpace ? (
              <div className={cn(
                'p-2 rounded-lg border flex items-center justify-between',
                'bg-blue-500/10 border-blue-500/30'
              )}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <DoorClosed className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className={cn('text-xs font-medium truncate', colors.text.primary)}>
                      Currently in: {myCurrentSpace.name}
                    </p>
                    <p className={cn('text-xs truncate', colors.text.secondary)}>
                      {formatDisplayName(myCurrentSpace.type)} • {myCurrentSpace.building || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  disabled={isPending}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                    'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
                    'transition-colors cursor-pointer flex-shrink-0',
                    isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <LogOut className="w-3 h-3" />
                  Leave
                </button>
              </div>
            ) : (
              <div className={cn(
                'p-2 rounded-lg border text-center',
                colors.bg.secondary,
                colors.border.primary
              )}>
                <p className={cn('text-xs', colors.text.secondary)}>
                  No space currently assigned
                </p>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className={cn('px-4 py-3 border-b', colors.border.primary)}>
            <div className="relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                colors.text.tertiary
              )} />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-colors',
                  colors.border.primary,
                  colors.bg.secondary,
                  colors.text.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                )}
              />
            </div>
          </div>

          {/* Spaces List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn('w-6 h-6 animate-spin', colors.text.tertiary)} />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className={cn('text-sm', colors.text.secondary)}>
                  Failed to load spaces
                </p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="p-8 text-center">
                <Layers className={cn('w-12 h-12 mx-auto mb-3', colors.text.tertiary)} />
                <p className={cn('text-sm', colors.text.secondary)}>
                  {searchTerm ? 'No spaces found' : 'No spaces available'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSpaces.map((space) => {
                  const isOccupied = !!space.current_assignment;
                  const isMySpace = space.current_assignment?.staff_id === currentStaffId;
                  const canOccupy = !isOccupied && !myCurrentSpace;

                  return (
                    <div
                      key={space.id}
                      className={cn(
                        'p-3 rounded-lg border transition-all',
                        colors.border.primary,
                        isMySpace && 'bg-blue-500/10 border-blue-500/30',
                        !isMySpace && colors.bg.secondary
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Space Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              'text-sm font-semibold truncate',
                              colors.text.primary
                            )}>
                              {space.name}
                            </h4>
                            {isOccupied ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0">
                                <DoorClosed className="w-3 h-3" />
                                Occupied
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                                Available
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-xs',
                                getSpaceTypeColor(space.type)
                              )}>
                                {formatDisplayName(space.type)}
                              </span>
                            </div>
                            
                            {(space.building || space.floor) && (
                              <div className="flex items-center gap-2 text-xs">
                                {space.building && (
                                  <div className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    <span className={colors.text.secondary}>
                                      {space.building}
                                    </span>
                                  </div>
                                )}
                                {space.floor && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className={colors.text.secondary}>
                                      {space.floor}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {isOccupied && !isMySpace && (
                            <p className={cn('text-xs mt-2', colors.text.tertiary)}>
                              In use by: {space.current_assignment?.staff?.user?.full_name|| 'Unknown'}
                            </p>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {canOccupy ? (
                            <button
                              onClick={() => handleOccupy(space)}
                              disabled={isPending}
                              className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                                'bg-blue-600 text-white hover:bg-blue-700',
                                'transition-colors cursor-pointer',
                                isPending && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <LogIn className="w-3 h-3" />
                              Occupy
                            </button>
                          ) : isOccupied && !isMySpace ? (
                            <div className={cn(
                              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs',
                              'bg-gray-500/10 text-gray-500'
                            )}>
                              <XCircle className="w-3 h-3" />
                              Unavailable
                            </div>
                          ) : !canOccupy && !isOccupied ? (
                            <div className={cn(
                              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs',
                              'bg-orange-500/10 text-orange-500'
                            )}>
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

          {/* Footer */}
          <div className={cn(
            'px-4 py-3 border-t text-center',
            colors.border.primary,
            colors.bg.secondary
          )}>
            <p className={cn('text-xs', colors.text.secondary)}>
              Occupy spaces for your work shifts
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MySpace);