import React from 'react';
import {
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  FileText,
  MoreVertical,
  User,
} from 'lucide-react';

import { getRoleDisplayName } from '../../../../../../shared/utils/facilityRoleFormator';
import { cn } from '../../../../../../shared/types/cn';

import type { SpaceWithAssignment } from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import type { SpaceAllocationColors } from './space-allocation.types';
import {
  formatDate,
  formatDateTime,
  formatSpaceTypeLabel,
  getOccupancyStatusMeta,
  getSpaceActiveStatusMeta,
  getSpaceTypeColor,
  getSpaceTypeIcon,
} from './space-allocation.utils';

interface SpaceAllocationListViewProps {
  colors: SpaceAllocationColors;
  spaces: SpaceWithAssignment[];
  expandedRows: Set<number>;
  onToggleExpand: (id: number) => void;
  onAssign: (space: SpaceWithAssignment) => void;
  onRelease: (space: SpaceWithAssignment) => void | Promise<void>;
}

export const SpaceAllocationListView: React.FC<SpaceAllocationListViewProps> = ({
  colors,
  spaces,
  expandedRows,
  onToggleExpand,
  onAssign,
  onRelease,
}) => {
  return (
    <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
      {/* Header - Hidden on mobile, visible on desktop */}
      <div
        className={cn(
          'hidden md:grid md:grid-cols-12 gap-4 p-4 font-medium border-b',
          colors.bg.secondary,
          colors.border.primary
        )}
      >
        <div className="col-span-3">Space Name</div>
        <div className="col-span-2">Type & Location</div>
        <div className="col-span-3">Assigned To</div>
        <div className="col-span-2">Assignment Details</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className={colors.bg.elevated}>
        {spaces.map(space => {
          const isExpanded = expandedRows.has(space.id);
          const assignment = space.current_assignment;
          const isOccupied = !!assignment;

          const SpaceIcon = getSpaceTypeIcon(space.type);
          const occupancyMeta = getOccupancyStatusMeta(isOccupied);
          const ActiveStatusIcon = getSpaceActiveStatusMeta(space.is_active).icon;
          const activeMeta = getSpaceActiveStatusMeta(space.is_active);

          return (
            <div
              key={space.id}
              className={cn('border-b last:border-b-0', colors.border.primary)}
            >
              {/* Main Card - Stacked vertically on mobile, grid on desktop */}
              <div
                className={cn(
                  'p-4 transition-colors',
                  colors.bg.hover,
                  isOccupied && 'cursor-pointer'
                )}
                onClick={() => {
                  if (isOccupied) onToggleExpand(space.id);
                }}
              >
                {/* Mobile/Tablet Layout (stacked) */}
                <div className="block md:hidden space-y-3">
                  {/* Row 1: Space Name and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {isOccupied ? (
                        isExpanded ? (
                          <ChevronUp className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        )
                      ) : null}

                      <SpaceIcon className={cn('w-4 h-4 shrink-0', getSpaceTypeColor(space.type))} />

                      <span className={cn('font-medium', colors.text.primary)}>
                        {space.name}
                      </span>
                    </div>

                    <span className={cn('text-xs px-2 py-1 rounded-full shrink-0', occupancyMeta.className)}>
                      {occupancyMeta.label}
                    </span>
                  </div>

                  {/* Row 2: Type and Location */}
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', colors.text.secondary)}>
                      {formatSpaceTypeLabel(space.type)}
                    </span>

                    <div className="flex items-center gap-1 text-xs">
                      <Building className="w-3 h-3" />
                      <span className={colors.text.tertiary}>
                        {space.building || 'N/A'}
                        {space.floor ? `, ${space.floor}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Assignment Info */}
                  <div className="border-t pt-2" className={cn('pt-2', colors.border.primary)}>
                    {isOccupied && assignment ? (
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className={cn('font-medium', colors.text.primary)}>
                            {assignment.staff?.user?.full_name || 'Unknown Staff'}
                          </p>
                          <p className={cn('text-sm', colors.text.secondary)}>
                            {assignment.staff?.staff_uuid || 'N/A'} •{' '}
                            {getRoleDisplayName(assignment.staff?.role_code) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="font-medium text-green-500">Available</span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Assignment Details */}
                  {isOccupied && assignment && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className={colors.text.secondary}>
                          {formatDate(assignment.assigned_at)}
                        </span>
                      </div>

                      {assignment.note && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                          <span
                            className={cn('flex-1', colors.text.tertiary)}
                            title={assignment.note}
                          >
                            {assignment.note}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 5: Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t" className={cn('pt-2', colors.border.primary)}>
                    {isOccupied ? (
                      <>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            void onRelease(space);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                          type="button"
                        >
                          <DoorOpen className="w-4 h-4" />
                          <span>Release</span>
                        </button>

                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onToggleExpand(space.id);
                          }}
                          className={cn(
                            'p-2 rounded-lg border transition-colors cursor-pointer',
                            colors.border.primary,
                            colors.bg.hover
                          )}
                          title="Details"
                          type="button"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          onAssign(space);
                        }}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer w-full justify-center',
                          colors.accent.primary,
                          colors.accent.hover,
                          colors.accent.text
                        )}
                        type="button"
                      >
                        <User className="w-4 h-4" />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout (grid) */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {isOccupied ? (
                        isExpanded ? (
                          <ChevronUp className="w-4 h-4 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        )
                      ) : null}

                      <SpaceIcon className={cn('w-4 h-4 shrink-0', getSpaceTypeColor(space.type))} />

                      <span className={cn('font-medium', colors.text.primary)}>
                        {space.name}
                      </span>

                      <span className={cn('text-xs px-2 py-1 rounded-full shrink-0', occupancyMeta.className)}>
                        {occupancyMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="space-y-1">
                      <span className={cn('text-sm', colors.text.secondary)}>
                        {formatSpaceTypeLabel(space.type)}
                      </span>

                      <div className="flex items-center gap-1 text-xs">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className={colors.text.tertiary}>
                          {space.building || 'N/A'}
                          {space.floor ? `, ${space.floor}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    {isOccupied && assignment ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                          <p className={cn('font-medium', colors.text.primary)}>
                            {assignment.staff?.user?.full_name || 'Unknown Staff'}
                          </p>
                          <p className={cn('text-sm', colors.text.secondary)}>
                            {assignment.staff?.staff_uuid || 'N/A'} •{' '}
                            {getRoleDisplayName(assignment.staff?.role_code) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="font-medium text-green-500">Available</span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    {isOccupied && assignment ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className={colors.text.secondary}>
                            {formatDate(assignment.assigned_at)}
                          </span>
                        </div>

                        {assignment.note && (
                          <div className="flex items-center gap-1 text-sm">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span
                              className={cn('truncate', colors.text.tertiary)}
                              title={assignment.note}
                            >
                              {assignment.note}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={cn('text-sm italic', colors.text.tertiary)}>
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {isOccupied ? (
                      <>
                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            void onRelease(space);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer border-orange-500/30 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                          type="button"
                        >
                          <DoorOpen className="w-4 h-4" />
                          <span>Release</span>
                        </button>

                        <button
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onToggleExpand(space.id);
                          }}
                          className={cn(
                            'p-2 rounded-lg border transition-colors cursor-pointer',
                            colors.border.primary,
                            colors.bg.hover
                          )}
                          title="Details"
                          type="button"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          onAssign(space);
                        }}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer',
                          colors.accent.primary,
                          colors.accent.hover,
                          colors.accent.text
                        )}
                        type="button"
                      >
                        <User className="w-4 h-4" />
                        <span>Assign</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && isOccupied && assignment && (
                <div className={cn('p-4 border-t', colors.bg.secondary, colors.border.primary)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Assigned On
                      </p>
                      <p className={colors.text.primary}>{formatDateTime(assignment.assigned_at)}</p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Staff Details
                      </p>
                      <p className={colors.text.primary}>
                        Staff Number: {assignment.staff?.staff_uuid || 'N/A'}
                        <br />
                        Role: {getRoleDisplayName(assignment.staff?.role_code) || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Space Status
                      </p>
                      <p className={cn('inline-flex items-center gap-1', activeMeta.className)}>
                        <ActiveStatusIcon className="w-3 h-3" />
                        {activeMeta.label}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Location
                      </p>
                      <p className={colors.text.primary}>
                        {space.building || 'N/A'}
                        <br />
                        {space.floor || 'No floor set'}
                      </p>
                    </div>

                    {assignment.note && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                        <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                          Assignment Notes
                        </p>
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
        })}
      </div>
    </div>
  );
};

export default SpaceAllocationListView;