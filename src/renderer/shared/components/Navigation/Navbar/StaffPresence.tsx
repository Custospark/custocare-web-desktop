/**
 * ============================================================================
 * MY SPACE COMPONENT - STAFF SELF-SERVICE ROOM BOOKING
 * ============================================================================
 * 
 * Premium staff space booking with status management
 * Features:
 * - Blue-themed color palette (consistent with StaffPresence)
 * - Space rings for visual clarity
 * - Enhanced contrast for accessibility
 * - Mobile-responsive design
 * - Real-time status updates
 * - Enterprise-grade UX with clear affordances
 * - Improved cursor feedback
 * - Compact layout for better space utilization
 * - Client-side search functionality
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
} from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';
import type {
  SpaceWithAssignment,
  OccupancyFilters,
} from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentTypes';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    isError,
    isRefetching,
    refetch 
  } = useGetCurrentOccupancy(occupancyFilters, {
    enabled: !!activeFacilityId && activeFacilityId > 0 && isDropdownOpen,
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

  const currentSpaceLabel = myCurrentSpace?.name || 'No Space';
  const availableCount = normalizedSpaces.filter(s => !s.current_assignment).length;
  const occupiedCount = normalizedSpaces.filter(s => s.current_assignment).length;

  /* ---------------------------- Effects ----------------------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* -------------------------- Event Handlers ------------------------------ */
  const handleSpaceClick = () => {
    if (isLoading || assignMutation.isPending || releaseMutation.isPending) return;
    setIsDropdownOpen(!isDropdownOpen);
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

  const isPending = isLoading || isRefetching || assignMutation.isPending || releaseMutation.isPending;

  /* ---------------------------- Render JSX -------------------------------- */
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Space Button with Ring */}
      <button
        onClick={handleSpaceClick}
        disabled={isPending}
        aria-label="Manage my space"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          myCurrentSpace
            ? (isDark ? 'ring-blue-500/60' : 'ring-blue-600/70')
            : (isDark ? 'ring-gray-500/50' : 'ring-gray-400/60'),
          isDark 
            ? 'bg-gray-800/40 hover:bg-gray-800/70' 
            : 'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          !isPending && 'hover:scale-[1.02] active:scale-[0.98]',
          isPending && 'opacity-75 cursor-not-allowed'
        )}
      >
        {/* Space Indicator with Ring */}
        <div className={cn(
          'relative flex items-center justify-center w-7 h-7 rounded-full',
          'ring-1 ring-offset-1',
          myCurrentSpace
            ? (isDark ? 'ring-blue-500/60 bg-blue-500/15' : 'ring-blue-600/70 bg-blue-50')
            : (isDark ? 'ring-gray-500/50 bg-gray-500/10' : 'ring-gray-400/60 bg-gray-100'),
          isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
        )}>
          <div className={myCurrentSpace ? 'text-blue-500' : (isDark ? 'text-gray-400' : 'text-gray-600')}>
            {myCurrentSpace ? (
              <DoorClosed className="w-3.5 h-3.5" />
            ) : (
              <DoorOpen className="w-3.5 h-3.5" />
            )}
          </div>
          
          {/* Pulse Animation for Occupied Space */}
          {myCurrentSpace && (
            <span className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-25',
              isDark ? 'bg-blue-500/15' : 'bg-blue-50'
            )} />
          )}
        </div>
        
        {/* Space Text - Desktop Only */}
        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn(
            'text-xs font-semibold truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            {isLoading ? 'Loading...' : currentSpaceLabel}
          </span>
          <span className={cn(
            'text-xs truncate',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            {isPending ? 'Syncing...' : 'My Space'}
          </span>
        </div>
        
        {/* Chevron Indicator */}
        <ChevronDown className={cn(
          'hidden lg:block w-3 h-3 ml-auto transition-transform duration-200',
          isDark ? 'text-gray-400' : 'text-gray-500',
          isDropdownOpen && 'rotate-180'
        )} />
        
        {/* Loading Spinner */}
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
      {isDropdownOpen && (
        <div className={cn(
          'absolute right-0 mt-1.5 w-80 rounded-lg shadow-xl z-50',
          'animate-in slide-in-from-top-2 fade-in duration-150',
          'ring-1',
          isDark 
            ? 'bg-gray-900 ring-gray-700' 
            : 'bg-white ring-gray-200'
        )}>
          {/* Header - Compact */}
          <div className={cn(
            'px-3 py-2 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}>
            <h3 className={cn(
              'text-xs font-bold mb-0.5',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}>
              My Space
            </h3>
            <div className="flex items-center justify-between">
              <p className={cn(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {isLoading ? 'Loading...' : `Current: ${currentSpaceLabel}`}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  'bg-green-500/10 text-green-500'
                )}>
                  {availableCount}
                </span>
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  'bg-blue-500/10 text-blue-500'
                )}>
                  {occupiedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Current Space Status - Compact */}
          {myCurrentSpace && (
            <div className={cn(
              'px-3 py-2 border-b',
              isDark ? 'border-gray-800' : 'border-gray-200'
            )}>
              <div className={cn(
                'flex items-center justify-between gap-2 p-2 rounded-md',
                isDark 
                  ? 'bg-blue-500/10 ring-1 ring-blue-500/30' 
                  : 'bg-blue-50 ring-1 ring-blue-200/50'
              )}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0',
                    'ring-1',
                    isDark ? 'ring-blue-500/60 bg-blue-500/15' : 'ring-blue-600/70 bg-blue-50'
                  )}>
                    <DoorClosed className="w-3 h-3 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-xs font-semibold truncate',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      {myCurrentSpace.name}
                    </p>
                    <p className={cn(
                      'text-xs truncate',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      {formatDisplayName(myCurrentSpace.type)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  disabled={isPending}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium flex-shrink-0',
                    'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
                    'transition-colors cursor-pointer',
                    'focus:outline-none focus:ring-1 focus:ring-inset',
                    isDark ? 'focus:ring-orange-500/40' : 'focus:ring-orange-500/30',
                    isPending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <LogOut className="w-3 h-3" />
                  Leave
                </button>
              </div>
            </div>
          )}

          {/* Search Bar - Compact */}
          <div className={cn(
            'px-3 py-2 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}>
            <div className="relative">
              <Search className={cn(
                'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )} />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 rounded-md border text-xs transition-colors',
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-1 focus:ring-inset',
                  isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30'
                )}
              />
            </div>
          </div>
          
          {/* Spaces List - Compact */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className={cn(
                  'w-5 h-5 animate-spin',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )} />
              </div>
            ) : isError ? (
              <div className="p-4 text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Failed to load spaces
                </p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="p-6 text-center">
                <Layers className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )} />
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {searchTerm ? 'No spaces found' : 'No spaces available'}
                </p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {filteredSpaces.map((space) => {
                  const isOccupied = !!space.current_assignment;
                  const isMySpace = space.current_assignment?.staff_id === currentStaffId;
                  const canOccupy = !isOccupied && !myCurrentSpace;
                  const isUpdatingThis = (assignMutation.isPending && assignMutation.variables?.space_id === space.id) ||
                                        (releaseMutation.isPending && isMySpace);

                  return (
                    <button
                      key={space.id}
                      onClick={() => canOccupy && handleOccupy(space)}
                      disabled={!canOccupy || isPending}
                      className={cn(
                        'group/item w-full flex items-center gap-2.5 p-2 rounded-md',
                        'transition-all duration-150',
                        canOccupy && 'cursor-pointer',
                        'focus:outline-none focus:ring-1 focus:ring-inset',
                        isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30',
                        canOccupy && (isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70'),
                        !canOccupy && !isMySpace && (isDark ? 'hover:bg-gray-500/5' : 'hover:bg-gray-200/70'),
                        !canOccupy && 'cursor-default',
                        canOccupy && !isPending && 'hover:scale-[1.01] active:scale-[0.99]',
                        isMySpace && (isDark 
                          ? 'bg-blue-500/10 ring-1 ring-blue-500/30' 
                          : 'bg-blue-50 ring-1 ring-blue-200/50'),
                        isPending && !isUpdatingThis && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {/* Space Icon with Ring */}
                      <div className={cn(
                        'relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0',
                        'ring-1',
                        isOccupied
                          ? (isDark ? 'ring-blue-500/60 bg-blue-500/15' : 'ring-blue-600/70 bg-blue-50')
                          : (isDark ? 'ring-green-500/60 bg-green-500/15' : 'ring-green-600/70 bg-green-50'),
                        'transition-all duration-150',
                        canOccupy && 'group-hover/item:scale-105'
                      )}>
                        <div className={isOccupied ? 'text-blue-500' : 'text-green-500'}>
                          {isOccupied ? (
                            <DoorClosed className="w-3.5 h-3.5" />
                          ) : (
                            <DoorOpen className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                      
                      {/* Space Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={cn(
                            'text-xs font-semibold truncate',
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          )}>
                            {space.name}
                          </span>
                          {isMySpace && (
                            <CheckCircle2 className={cn(
                              'w-3 h-3 flex-shrink-0',
                              isDark ? 'text-blue-400' : 'text-blue-600'
                            )} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs truncate',
                            getSpaceTypeColor(space.type)
                          )}>
                            {formatDisplayName(space.type)}
                          </span>
                          {(space.building || space.floor) && (
                            <span className={cn(
                              'text-xs truncate',
                              isDark ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {space.building && `${space.building}`}
                              {space.building && space.floor && ' • '}
                              {space.floor}
                            </span>
                          )}
                        </div>
                        {isOccupied && !isMySpace && space.current_assignment?.staff?.user?.full_name && (
                          <p className={cn(
                            'text-xs mt-0.5 truncate',
                            isDark ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            By: {space.current_assignment.staff.user.full_name}
                          </p>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {isUpdatingThis ? (
                          <Loader2 className={cn(
                            'w-3 h-3 animate-spin',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        ) : canOccupy ? (
                          <LogIn className={cn(
                            'w-3.5 h-3.5',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        ) : isOccupied && !isMySpace ? (
                          <XCircle className={cn(
                            'w-3.5 h-3.5',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )} />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer - Compact */}
          <div className={cn(
            'px-3 py-2 border-t',
            isDark ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50/50'
          )}>
            <p className={cn(
              'text-xs text-center leading-relaxed',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Occupy spaces for your work shifts
            </p>
          </div>
        </div>
      )}
      
      {/* Error Indicator */}
      {isError && (
        <div 
          className="absolute -top-1 -right-1 z-10 cursor-help" 
          title="Failed to load spaces"
        >
          <div className={cn(
            'p-0.5 rounded-full',
            isDark ? 'bg-gray-900' : 'bg-white'
          )}>
            <AlertCircle className="w-3 h-3 text-red-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MySpace);