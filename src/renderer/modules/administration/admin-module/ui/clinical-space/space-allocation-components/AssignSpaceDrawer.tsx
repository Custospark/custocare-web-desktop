import React, { useEffect, useMemo, useRef } from 'react';
import {
  DoorOpen,
  FileText,
  RefreshCw,
  User,
  Users,
  X,
} from 'lucide-react';

import { getRoleDisplayName } from '../../../../../../shared/utils/facilityRoleFormator';
import { cn } from '../../../../../../shared/types/cn';

import type {
  AvailableSpace,
} from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import type { AssignSpaceDrawerProps } from './space-allocation.types';
import { formatSpaceTypeLabel } from './space-allocation.utils';
import { formatText } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

export const AssignSpaceDrawer: React.FC<AssignSpaceDrawerProps> = ({
  theme,
  open,
  formData,
  availableSpaces,
  staff,
  preselectedSpace,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  isLoadingStaff,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const didAutoFocusRef = useRef(false);
  const spaceSelectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (open && !didAutoFocusRef.current) {
      didAutoFocusRef.current = true;
      requestAnimationFrame(() => {
        spaceSelectRef.current?.focus();
      });
    }
  }, [open]);

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!isSubmitting && canSubmit) {
        onSubmit();
      }
    }
  };

  const set = (patch: Partial<AssignSpaceDrawerProps['formData']>) => {
    onChange({ ...formData, ...patch });
  };

  const selectedSpace = useMemo(() => {
    return (
      availableSpaces.find(space => space.id === formData.space_id) ||
      (preselectedSpace && preselectedSpace.id === formData.space_id
        ? (preselectedSpace as unknown as AvailableSpace)
        : null)
    );
  }, [availableSpaces, formData.space_id, preselectedSpace]);

  const selectedStaff = useMemo(() => {
    return staff.find(member => member.staff_id === formData.staff_id) || null;
  }, [staff, formData.staff_id]);

  const title = 'Assign Room to Staff';
  const helperText =
    'Select an available space and a staff member to create a new workspace assignment.';

  const inputBase =
    'w-full px-3 py-2 rounded-lg border outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';
  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';
  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';
  const sectionCard = isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full sm:w-[720px] overflow-y-auto border-l',
          isDark
            ? 'bg-gray-950 border-gray-800 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className={cn('p-5 border-b flex items-start justify-between gap-4', subtleDivider)}>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {helperText}
            </p>
            <p className={cn('text-xs mt-1', hintTheme)}>
              Tip: Press <span className="font-medium">Ctrl/⌘ + Enter</span> to save.
            </p>
          </div>

          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg border transition cursor-pointer',
              isDark
                ? 'border-gray-800 hover:bg-gray-900'
                : 'border-gray-200 hover:bg-gray-100'
            )}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Assignment setup */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Assignment Setup</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Choose the space and staff member for this allocation.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                  Select Room <span className="text-red-500">*</span>
                </label>

                {availableSpaces.length === 0 ? (
                  <div
                    className={cn(
                      'w-full px-4 py-3 rounded-lg border',
                      isDark
                        ? 'bg-blue-950/30 border-blue-900 text-blue-300'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" />
                      <span className="font-medium">No rooms available for assignment</span>
                    </div>
                    <p className="text-xs mt-2 opacity-80">
                      All rooms are currently occupied. Release a room first to continue.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <DoorOpen
                        className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )}
                      />
                      <select
                        ref={spaceSelectRef}
                        value={formData.space_id ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          set({
                            space_id: e.target.value ? parseInt(e.target.value, 10) : null,
                          })
                        }
                        className={cn(inputBase, inputTheme, 'pl-10 cursor-pointer')}
                      >
                        <option value="">Select a room...</option>
                        {availableSpaces.map(space => (
                          <option key={space.id} value={space.id}>
                            {space.name} - {formatSpaceTypeLabel(space.type)}
                            {space.building ? ` • ${space.building}` : ''}
                            {space.floor ? ` • ${space.floor}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            availableSpaces.length > 5
                              ? 'bg-green-500'
                              : availableSpaces.length > 0
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          )}
                        />
                        <p className={cn('text-xs', hintTheme)}>
                          {availableSpaces.length} room
                          {availableSpaces.length === 1 ? '' : 's'} available
                        </p>
                      </div>

                      {formData.space_id && (
                        <span className="text-xs text-green-500 font-medium">
                          Ready to assign
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                  Select Staff <span className="text-red-500">*</span>
                </label>

                {isLoadingStaff ? (
                  <div
                    className={cn(
                      'w-full px-4 py-3 rounded-lg border animate-pulse',
                      isDark
                        ? 'bg-gray-900 border-gray-800'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <div className="space-y-1">
                        <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                        <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                    </div>
                  </div>
                ) : staff.length === 0 ? (
                  <div
                    className={cn(
                      'w-full px-4 py-4 rounded-lg border text-center',
                      isDark
                        ? 'bg-blue-950/30 border-blue-900 text-blue-300'
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    )}
                  >
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium mb-1">No staff available</p>
                    <p className="text-xs opacity-80">
                      All staff members may already have room assignments.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <User
                        className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )}
                      />
                      <select
                        value={formData.staff_id ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          set({
                            staff_id: e.target.value ? parseInt(e.target.value, 10) : null,
                          })
                        }
                        className={cn(inputBase, inputTheme, 'pl-10 cursor-pointer')}
                        disabled={isLoadingStaff}
                      >
                        <option value="">Choose a staff member...</option>
                        {staff.map(member => (
                          <option key={member.staff_id} value={member.staff_id}>
                            {member.full_name} • {getRoleDisplayName(member.role_code)} •{' '}
                            {member.staff_uuid}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className={cn('text-xs', hintTheme)}>
                        {staff.length} staff member{staff.length === 1 ? '' : 's'} available
                      </p>

                      {formData.staff_id && (
                        <span className="text-xs text-green-500 font-medium">
                          Staff selected
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Assignment Notes</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Add optional context for this workspace assignment.
              </p>
            </div>

            <div className="p-4">
              <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                Notes
              </label>
              <div className="relative">
                <FileText
                  className={cn(
                    'absolute left-3 top-3 w-4 h-4',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )}
                />
                <textarea
                  value={formData.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    set({ note: e.target.value })
                  }
                  rows={4}
                  className={cn(inputBase, inputTheme, 'pl-10 resize-none')}
                  placeholder="Add notes about this assignment..."
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {(selectedSpace || selectedStaff) && (
            <div className={cn('rounded-xl border', sectionCard)}>
              <div className={cn('px-4 py-3 border-b', subtleDivider)}>
                <h4 className="text-sm font-semibold">Selection Preview</h4>
                <p className={cn('text-xs mt-1', hintTheme)}>
                  Review the selected room and staff member before saving.
                </p>
              </div>

              <div className="p-4 space-y-4">
                {selectedSpace && (
                  <div className={cn('p-3 rounded-lg', colorsForPreview(theme).bg)}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Room Name</p>
                        <p className="font-medium">{selectedSpace.name}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Type</p>
                        <p className="font-medium">
                          {formatSpaceTypeLabel(selectedSpace.type)}
                        </p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Building</p>
                        <p className="font-medium">{selectedSpace.building || 'N/A'}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Floor</p>
                        <p className="font-medium">{selectedSpace.floor || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStaff && (
                  <div className={cn('p-3 rounded-lg', colorsForPreview(theme).bg)}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Staff Name</p>
                        <p className="font-medium">{selectedStaff.full_name}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Role</p>
                        <p className="font-medium">
                          {getRoleDisplayName(selectedStaff.role_code) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Staff Number</p>
                        <p className="font-medium">{selectedStaff.staff_uuid || 'N/A'}</p>
                      </div>
                      <div>
                        <p className={cn('text-xs mb-1', hintTheme)}>Status</p>
                        <p className="font-medium">{formatText(selectedStaff.assignment_status) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'sticky bottom-0 p-5 border-t backdrop-blur',
            subtleDivider,
            isDark ? 'bg-gray-950/90' : 'bg-white/90'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={cn('text-xs', hintTheme)}>
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors border',
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                )}
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={onSubmit}
                disabled={isSubmitting || !canSubmit}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors text-white',
                  'bg-blue-600 hover:bg-blue-700',
                  isSubmitting || !canSubmit
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                )}
                type="button"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  'Assign Space'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const colorsForPreview = (theme: 'light' | 'dark') => ({
  bg: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
});

export default AssignSpaceDrawer;
