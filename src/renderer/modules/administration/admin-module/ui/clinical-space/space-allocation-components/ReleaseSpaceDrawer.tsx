import React, { useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  DoorOpen,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react';

import { getRoleDisplayName } from '../../../../../../shared/utils/facilityRoleFormator';
import { cn } from '../../../../../../shared/types/cn';

import type { ReleaseSpaceDrawerProps } from './space-allocation.types';
import { formatDateTime, formatSpaceTypeLabel } from './space-allocation.utils';

export const ReleaseSpaceDrawer: React.FC<ReleaseSpaceDrawerProps> = ({
  theme,
  open,
  formData,
  selectedSpace,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const didAutoFocusRef = useRef(false);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (open && !didAutoFocusRef.current) {
      didAutoFocusRef.current = true;
      requestAnimationFrame(() => {
        noteRef.current?.focus();
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

  const set = (patch: Partial<ReleaseSpaceDrawerProps['formData']>) => {
    onChange({ ...formData, ...patch });
  };

  const title = 'Release Space';

  const helperText = useMemo(() => {
    if (!selectedSpace?.current_assignment) {
      return 'Confirm release of the current staff space assignment.';
    }

    const staffName =
      selectedSpace.current_assignment.staff?.user?.full_name || 'the assigned staff member';

    return `Confirm release of ${selectedSpace.name} from ${staffName}.`;
  }, [selectedSpace]);

  const inputBase =
    'w-full px-3 py-2 rounded-lg border outline-none transition focus:ring-2 focus:ring-orange-500 focus:border-transparent';
  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';
  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';
  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';
  const sectionCard = isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';

  if (!open || !selectedSpace || !selectedSpace.current_assignment) return null;

  const assignment = selectedSpace.current_assignment;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full sm:w-[680px] overflow-y-auto border-l',
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
              Tip: Press <span className="font-medium">Ctrl/⌘ + Enter</span> to confirm.
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
          {/* Current assignment */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Current Assignment</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Review the current room allocation before releasing it.
              </p>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Space</p>
                  <p className="font-medium">{selectedSpace.name}</p>
                </div>

                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Type</p>
                  <p className="font-medium">{formatSpaceTypeLabel(selectedSpace.type)}</p>
                </div>

                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Assigned To</p>
                  <p className="font-medium">
                    {assignment.staff?.user?.full_name || 'Unknown Staff'}
                  </p>
                </div>

                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Role</p>
                  <p className="font-medium">
                    {getRoleDisplayName(assignment.staff?.role_code) || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Assigned On</p>
                  <p className="font-medium">{formatDateTime(assignment.assigned_at)}</p>
                </div>

                <div>
                  <p className={cn('text-xs mb-1', hintTheme)}>Location</p>
                  <p className="font-medium">
                    {selectedSpace.building || 'N/A'}
                    {selectedSpace.floor ? ` • ${selectedSpace.floor}` : ''}
                  </p>
                </div>
              </div>

              {assignment.note && (
                <div className={cn('mt-4 p-3 rounded-lg', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                  <p className={cn('text-xs mb-1', hintTheme)}>Existing Assignment Note</p>
                  <p className="text-sm italic">{assignment.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Release note */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Release Notes</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Add optional notes explaining why this space is being released.
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
                  ref={noteRef}
                  value={formData.note}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    set({ note: e.target.value })
                  }
                  rows={4}
                  className={cn(inputBase, inputTheme, 'pl-10 resize-none')}
                  placeholder="Add notes about this release..."
                />
              </div>
            </div>
          </div>

          {/* Warning */}
          <div
            className={cn(
              'rounded-xl border p-4',
              isDark
                ? 'border-orange-900 bg-orange-950/20'
                : 'border-orange-200 bg-orange-50'
            )}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-500">Important Note</p>
                <p className={cn('text-sm mt-1', hintTheme)}>
                  Releasing this space will make it available for other staff assignments.
                  The current staff member will no longer have this workspace allocation.
                </p>
              </div>
            </div>
          </div>

          {/* Action summary */}
          <div
            className={cn(
              'rounded-xl border p-4',
              isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
            )}
          >
            <div className="flex items-center gap-3">
              <DoorOpen className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">This action will release the selected room</p>
                <p className={cn('text-sm', hintTheme)}>
                  You can reassign the room after the release is completed.
                </p>
              </div>
            </div>
          </div>
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
              This action affects current room occupancy.
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
                  'bg-orange-500 hover:bg-orange-600',
                  isSubmitting || !canSubmit
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                )}
                type="button"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Releasing...
                  </span>
                ) : (
                  'Confirm Release'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseSpaceDrawer;
