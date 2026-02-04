// MySpace.tsx
/**
 * ============================================================================
 * MY SPACE - STAFF SELF-BOOKING COMPONENT
 * ============================================================================
 * 
 * Dropdown component for staff to self-book clinical spaces/rooms
 * Features:
 * - Room search at the top
 * - Current room status display
 * - Staff can only "Leave" rooms they occupy (not "Release" like admins)
 * - Occupied rooms show "Occupied" status
 * - Blue-themed color palette
 * - Mobile-friendly with responsive design
 * - Uses same design patterns as StaffPresence.tsx
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  DoorOpen,
  DoorClosed,
  MapPin,
  Building,
  ChevronDown,
  Home,
  Monitor,
  Briefcase,
  PillBottle,
  Bed,
  Activity,
  FlaskConical,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { useConfirm } from '../../Feedback/ConfirmDialog/ConfirmContext';

import {
  staffSpaceAssignmentKeys,
  useGetCurrentSpace,
  useGetAvailableSpaces,
  useAssignMySpace,
  useReleaseMySpace,
} from  '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';

import  type { AvailableSpace } from '../../../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentTypes';

/* -------------------------------------------------------------------------- */
/*                               COMPONENT PROPS                              */
/* -------------------------------------------------------------------------- */

interface MySpaceProps {
  isDark: boolean;
  className?: string;
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
  meeting: DoorOpen,
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

const getSpaceTypeIcon = (type: string | null | undefined): React.ElementType => {
  return SPACE_TYPE_ICONS[type?.toLowerCase() ?? ''] || SPACE_TYPE_ICONS.default;
};

const getSpaceTypeColor = (type: string | null | undefined): string => {
  return SPACE_TYPE_COLORS[type?.toLowerCase() ?? ''] || SPACE_TYPE_COLORS.default;
};

const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-US', {
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

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export const MySpace: React.FC<MySpaceProps> = ({ isDark, className }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  // Redux state
  const activeFacilityId = useAppSelector(state => state.activeContext.activeFacilityId);

  /* ---------------------------- API Queries ------------------------------- */

  // Current space query
  const { 
    data: currentSpaceData, 
    isLoading: isLoadingCurrentSpace,
    error: currentSpaceError,
    refetch: refetchCurrentSpace,
  } = useGetCurrentSpace(
    { facility_id: activeFacilityId || 0 },
    { 
      enabled: !!activeFacilityId && activeFacilityId > 0,
      staleTime: 1000 * 30,
    }
  );

  // Available spaces query
  const { 
    data: availableSpacesData, 
    isLoading: isLoadingAvailableSpaces,
    refetch: refetchAvailableSpaces,
  } = useGetAvailableSpaces(
    { 
      facility_id: activeFacilityId || 0,
      per_page: 50,
    },
    { 
      enabled: !!activeFacilityId && activeFacilityId > 0,
      staleTime: 1000 * 30,
    }
  );

  // Mutations
  const assignMutation = useAssignMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      refetchCurrentSpace();
      refetchAvailableSpaces();
      setIsAssigning(false);
    },
    onError: () => {
      setIsAssigning(false);
    },
  });

  const releaseMutation = useReleaseMySpace({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.all });
      refetchCurrentSpace();
      refetchAvailableSpaces();
    },
  });

  /* ---------------------------- Data Normalization ------------------------- */

  const currentAssignment = useMemo(() => {
    return currentSpaceData?.data || null;
  }, [currentSpaceData]);

  const availableSpaces = useMemo(() => {
    if (!availableSpacesData?.data || !Array.isArray(availableSpacesData.data)) return [];
    return availableSpacesData.data.filter((space): space is AvailableSpace => 
      space && 
      typeof space === 'object' && 
      'id' in space && 
      typeof space.id === 'number'
    );
  }, [availableSpacesData]);

  /* ---------------------------- Filter Available Spaces -------------------- */

  const filteredSpaces = useMemo(() => {
    const term = safeLower(searchTerm).trim();
    
    return availableSpaces.filter(space => {
      if (term) {
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
      }
      
      return true;
    });
  }, [availableSpaces, searchTerm]);

  /* ---------------------------- Event Handlers ----------------------------- */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    if (isLoadingCurrentSpace || isLoadingAvailableSpaces) return;
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchTerm('');
    }
  };

  const handleAssignSpace = async (spaceId: number) => {
    if (!activeFacilityId) return;

    const confirmed = await confirm({
      title: 'Occupy Space',
      message: 'Are you sure you want to occupy this space?',
      confirmText: 'Occupy',
      cancelText: 'Cancel',
      variant: 'info',
      theme: isDark ? 'dark' : 'light',
    });

    if (!confirmed) return;

    setIsAssigning(true);
    
    assignMutation.mutate({
      facility_id: activeFacilityId,
      space_id: spaceId,
    });
  };

  const handleReleaseSpace = async () => {
    if (!activeFacilityId || !currentAssignment) return;

    const confirmed = await confirm({
      title: 'Leave Space',
      message: 'Are you sure you want to leave this space?',
      confirmText: 'Leave',
      cancelText: 'Cancel',
      variant: 'warning',
      theme: isDark ? 'dark' : 'light',
    });

    if (!confirmed) return;

    releaseMutation.mutate({
      facility_id: activeFacilityId,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  /* ---------------------------- Status Helpers ----------------------------- */

  const getCurrentStatusConfig = () => {
    if (currentAssignment) {
      return {
        text: 'Occupied',
        icon: DoorClosed,
        color: 'text-blue-500',
        bgColor: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
        ringColor: isDark ? 'ring-blue-500/30' : 'ring-blue-500/20',
      };
    }
    
    return {
      text: 'Available',
      icon: DoorOpen,
      color: 'text-green-500',
      bgColor: isDark ? 'bg-green-500/10' : 'bg-green-50',
      ringColor: isDark ? 'ring-green-500/30' : 'ring-green-500/20',
    };
  };

  const currentStatus = getCurrentStatusConfig();
  const StatusIcon = currentStatus.icon;

  const isLoading = isLoadingCurrentSpace || isLoadingAvailableSpaces;
  const isPending = assignMutation.isPending || releaseMutation.isPending;

  /* ---------------------------- Color Tokens ------------------------------ */

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
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
      primary: 'bg-blue-500 hover:bg-blue-600',
      text: 'text-white',
    },
  };

  /* ---------------------------- Render Functions -------------------------- */

  const renderCurrentSpace = () => {
    if (!currentAssignment) return null;

    const SpaceIcon = getSpaceTypeIcon(currentAssignment.space?.type);

    return (
      <div className={cn(
        'mb-4 p-3 rounded-lg border',
        isDark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SpaceIcon className={cn('w-4 h-4', getSpaceTypeColor(currentAssignment.space?.type))} />
            <span className={cn('font-medium', colors.text.primary)}>
              {currentAssignment.space?.name || 'My Space'}
            </span>
          </div>
          <span className={cn(
            'text-xs px-2 py-1 rounded-full',
            isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
          )}>
            Occupied
          </span>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className={cn('w-3 h-3', colors.text.secondary)} />
            <span className={colors.text.secondary}>
              {currentAssignment.space?.building || 'Building'} • {currentAssignment.space?.floor || 'Floor'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className={cn('w-3 h-3', colors.text.secondary)} />
            <span className={colors.text.secondary}>
              Occupied since {formatTime(currentAssignment.assigned_at)}
            </span>
          </div>

          {currentAssignment.note && (
            <div className="mt-2 pt-2 border-t border-gray-200/50">
              <p className={cn('text-xs italic', colors.text.secondary)}>
                "{currentAssignment.note}"
              </p>
            </div>
          )}

          <button
            onClick={handleReleaseSpace}
            disabled={isPending}
            className={cn(
              'w-full mt-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              'border border-orange-500/30 bg-orange-500/10 text-orange-500',
              'hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {releaseMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Leaving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <DoorOpen className="w-4 h-4" />
                Leave Space
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSpaceItem = (space: AvailableSpace) => {
    const SpaceIcon = getSpaceTypeIcon(space.type);

    return (
      <div
        key={space.id}
        className={cn(
          'p-3 rounded-lg border transition-all cursor-pointer',
          colors.border.primary,
          colors.bg.secondary,
          'hover:border-blue-500/50 hover:shadow-sm'
        )}
        onClick={() => handleAssignSpace(space.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SpaceIcon className={cn('w-4 h-4', getSpaceTypeColor(space.type))} />
            <span className={cn('font-medium', colors.text.primary)}>{space.name}</span>
          </div>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded',
            isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
          )}>
            Available
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Building className={cn('w-3 h-3', colors.text.secondary)} />
            <span className={colors.text.secondary}>
              {space.type.charAt(0).toUpperCase() + space.type.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className={cn('w-3 h-3', colors.text.secondary)} />
            <span className={colors.text.secondary}>
              {space.building || 'Building'} • {space.floor || 'Floor'}
            </span>
          </div>

          <button
            disabled={isAssigning}
            className={cn(
              'w-full mt-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer',
              colors.accent.primary,
              colors.accent.text,
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isAssigning ? 'Occupying...' : 'Occupy'}
          </button>
        </div>
      </div>
    );
  };

  /* ---------------------------- Render JSX -------------------------------- */

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={handleDropdownToggle}
        disabled={isLoading}
        aria-label="My Space"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          currentStatus.ringColor,
          isDark 
            ? 'bg-gray-800/40 hover:bg-gray-800/70' 
            : 'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          !isLoading && 'hover:scale-[1.02] active:scale-[0.98]',
          isLoading && 'opacity-75 cursor-not-allowed'
        )}
      >
        {/* Status Indicator */}
        <div className={cn(
          'relative flex items-center justify-center w-7 h-7 rounded-full',
          'ring-1 ring-offset-1',
          currentStatus.ringColor,
          currentStatus.bgColor,
          isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
        )}>
          <StatusIcon className={cn('w-3.5 h-3.5', currentStatus.color)} />
        </div>

        {/* Status Text - Desktop Only */}
        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn(
            'text-xs font-semibold truncate',
            colors.text.primary
          )}>
            {isLoading ? 'Loading...' : 'My Space'}
          </span>
          <span className={cn(
            'text-xs truncate',
            currentStatus.color
          )}>
            {isLoading ? 'Checking...' : currentStatus.text}
          </span>
        </div>

        {/* Chevron Indicator */}
        <ChevronDown className={cn(
          'hidden lg:block w-3 h-3 ml-auto transition-transform duration-200',
          colors.text.secondary,
          isDropdownOpen && 'rotate-180'
        )} />

        {/* Loading Spinner */}
        {isLoading && (
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
          {/* Header */}
          <div className={cn(
            'px-4 py-3 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}>
            <h3 className={cn(
              'text-sm font-bold mb-1',
              colors.text.primary
            )}>
              My Space
            </h3>
            <p className={cn('text-xs', colors.text.secondary)}>
              {currentAssignment 
                ? 'Manage your current space or find a new one' 
                : 'Find and occupy an available space'
              }
            </p>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                colors.text.tertiary
              )} />
              <input
                type="text"
                placeholder="Search rooms by name, type, or building..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
                  colors.border.primary,
                  colors.bg.primary,
                  colors.text.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 py-2 max-h-96 overflow-y-auto">
            {/* Current Space */}
            {renderCurrentSpace()}

            {/* Available Spaces */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className={cn('text-xs font-semibold', colors.text.primary)}>
                  Available Spaces
                </h4>
                <span className={cn('text-xs', colors.text.secondary)}>
                  {filteredSpaces.length} found
                </span>
              </div>

              {isLoadingAvailableSpaces ? (
                <div className="text-center py-6">
                  <Loader2 className={cn(
                    'w-6 h-6 animate-spin mx-auto mb-2',
                    colors.text.secondary
                  )} />
                  <p className={cn('text-sm', colors.text.secondary)}>
                    Loading available spaces...
                  </p>
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="text-center py-6">
                  <DoorOpen className={cn(
                    'w-8 h-8 mx-auto mb-2',
                    colors.text.tertiary
                  )} />
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {searchTerm 
                      ? 'No spaces match your search'
                      : 'No available spaces at the moment'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSpaces.map(renderSpaceItem)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            'px-4 py-3 border-t',
            isDark ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50/50'
          )}>
            <p className={cn('text-xs text-center', colors.text.secondary)}>
              {currentAssignment 
                ? 'You can only leave spaces you occupy'
                : 'Click "Occupy" to book a space for yourself'
              }
            </p>
          </div>
        </div>
      )}

      {/* Error Indicator */}
      {currentSpaceError && (
        <div 
          className="absolute -top-1 -right-1 z-10 cursor-help" 
          title="Failed to load space information"
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

export default MySpace;