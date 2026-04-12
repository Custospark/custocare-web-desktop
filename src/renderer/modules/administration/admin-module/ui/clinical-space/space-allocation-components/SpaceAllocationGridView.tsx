import React from 'react';
import {
  Clock,
  DoorOpen,
  MapPin,
  User,
} from 'lucide-react';

import { getRoleDisplayName } from '../../../../../../shared/utils/facilityRoleFormator';
import { cn } from '../../../../../../shared/types/cn';

import type { SpaceWithAssignment } from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import type { SpaceAllocationColors } from './space-allocation.types';
import {
  formatDate,
  formatSpaceTypeLabel,
  getOccupancyStatusMeta,
  getSpaceActiveStatusMeta,
  getSpaceTypeColor,
  getSpaceTypeIcon,
} from './space-allocation.utils';

interface SpaceAllocationGridViewProps {
  colors: SpaceAllocationColors;
  spaces: SpaceWithAssignment[];
  onAssign: (space: SpaceWithAssignment) => void;
  onRelease: (space: SpaceWithAssignment) => void | Promise<void>;
}

export const SpaceAllocationGridView: React.FC<SpaceAllocationGridViewProps> = ({
  colors,
  spaces,
  onAssign,
  onRelease,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spaces.map(space => {
        const SpaceIcon = getSpaceTypeIcon(space.type);
        const assignment = space.current_assignment;
        const isOccupied = !!assignment;
        const occupancyMeta = getOccupancyStatusMeta(isOccupied);
        const activeMeta = getSpaceActiveStatusMeta(space.is_active);
        const ActiveIcon = activeMeta.icon;

        return (
          <div
            key={space.id}
            className={cn(
              'rounded-xl p-6 border transition-all',
              colors.border.primary,
              colors.bg.elevated,
              'hover:shadow-lg',
              isOccupied ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02]'
            )}
            onClick={() => {
              if (!isOccupied) onAssign(space);
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg', colors.bg.secondary)}>
                  <SpaceIcon className={cn('w-6 h-6', getSpaceTypeColor(space.type))} />
                </div>

                <div className="min-w-0">
                  <h3 className={cn('font-semibold truncate', colors.text.primary)}>
                    {space.name}
                  </h3>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {formatSpaceTypeLabel(space.type)}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap',
                  occupancyMeta.className
                )}
              >
                {occupancyMeta.label}
              </span>
            </div>

            {/* Location / meta */}
            <div className={cn('mb-4 p-3 rounded-lg', colors.bg.secondary)}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={cn('w-4 h-4', colors.text.tertiary)} />
                <span className={cn('text-sm', colors.text.secondary)}>
                  {space.building || 'No building'}
                  {space.floor ? ` · ${space.floor}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ActiveIcon className={cn('w-4 h-4', activeMeta.className)} />
                <span className={cn('text-sm', colors.text.secondary)}>
                  {activeMeta.label}
                </span>
              </div>
            </div>

            {/* Assignment details */}
            {isOccupied && assignment ? (
              <div className={cn('mb-4 p-3 rounded-lg border', colors.border.primary)}>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span className={cn('font-medium', colors.text.primary)}>
                    {assignment.staff?.user?.full_name || 'Unknown Staff'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs">
                      {assignment.staff?.employee_id || 'N/A'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 text-xs">
                      {getRoleDisplayName(assignment.staff?.role_code) || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
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
            ) : (
              <div className={cn('mb-4 p-3 rounded-lg border', colors.border.primary)}>
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-green-500" />
                  <span className={cn('font-medium text-green-500')}>
                    Available for assignment
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOccupied ? (
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    void onRelease(space);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer border border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                  type="button"
                >
                  <DoorOpen className="w-4 h-4" />
                  <span>Release Space</span>
                </button>
              ) : (
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onAssign(space);
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                    colors.accent.primary,
                    colors.accent.hover,
                    colors.accent.text
                  )}
                  type="button"
                >
                  <User className="w-4 h-4" />
                  <span>Assign Room</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpaceAllocationGridView;
