import React, { useEffect, useMemo, useRef } from 'react';
import {
  Bed,
  Building2,
  FileText,
  RefreshCw,
  Shield,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import {
  AgeGroup,
  SexRestriction,
  WardStatus,
  WardType,
} from '../../../api/wards/wardTypes';

import {
  AGE_GROUP_OPTIONS,
  SEX_RESTRICTION_OPTIONS,
  STATUS_OPTIONS,
  WARD_TYPE_OPTIONS,
} from './ward.constants';
import type { FacilityWardFormData } from './ward.types';

interface WardFormDrawerProps {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;
  formData: FacilityWardFormData;
  selectedWardName?: string;
  onChange: (next: FacilityWardFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export const WardFormDrawer: React.FC<WardFormDrawerProps> = ({
  theme,
  mode,
  open,
  formData,
  selectedWardName,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  const title = mode === 'edit' ? 'Edit Ward' : 'Create New Ward';

  const helperText = useMemo(() => {
    if (mode === 'edit') {
      return selectedWardName
        ? `Update configuration, capacity, and restrictions for ${selectedWardName}.`
        : 'Update configuration, capacity, and restrictions for this ward.';
    }

    return 'Add a new ward to this facility with location, capacity, and admission restrictions.';
  }, [mode, selectedWardName]);

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (open && !didAutoFocusRef.current) {
      didAutoFocusRef.current = true;
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    }
  }, [open]);

  const set = (patch: Partial<FacilityWardFormData>) => {
    onChange({ ...formData, ...patch });
  };

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!isSubmitting && canSubmit) {
        onSubmit();
      }
    }
  };

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
          {/* Identity */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Ward Identity</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Define the ward name, code, type, and status.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
            <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                Ward Code
            </label>
            <div className="relative">
                <input
                type="text"
                value={formData.code}
                onChange={(e) => set({ code: e.target.value })}
                className={cn(
                    inputBase, 
                    inputTheme,
                    isDark 
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed border-gray-700' 
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200',
                    'pr-24'
                )}
                readOnly
                disabled
                placeholder="Auto-generated code"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className={cn(
                    'text-xs',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                )}>
                    Auto-generated
                </span>
                </div>
            </div>
            </div>
                 <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Ward Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.name}
                    onChange={(e) => set({ name: e.target.value })}
                    className={cn(inputBase, inputTheme)}
                    placeholder="e.g., ICU A, Medical Ward B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Ward Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Stethoscope
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <select
                      value={formData.ward_type}
                      onChange={(e) => set({ ward_type: e.target.value as WardType })}
                      className={cn(inputBase, inputTheme, 'pl-10 cursor-pointer')}
                    >
                      <option value="">Select ward type...</option>
                      {WARD_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => set({ status: e.target.value as WardStatus })}
                    className={cn(inputBase, inputTheme, 'cursor-pointer')}
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & Location */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Capacity & Location</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Set where the ward is located and how many patients it can support.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Building
                  </label>
                  <div className="relative">
                    <Building2
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => set({ building: e.target.value })}
                      className={cn(inputBase, inputTheme, 'pl-10')}
                      placeholder="e.g., Main Building"
                    />
                  </div>
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => set({ floor: e.target.value })}
                    className={cn(inputBase, inputTheme)}
                    placeholder="e.g., 2nd Floor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Declared Capacity
                  </label>
                  <div className="relative">
                    <Bed
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <input
                      type="number"
                      min={0}
                      value={formData.capacity_declared}
                      onChange={(e) => set({ capacity_declared: e.target.value })}
                      className={cn(inputBase, inputTheme, 'pl-10')}
                      placeholder="e.g., 40"
                    />
                  </div>
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Operational Capacity
                  </label>
                  <div className="relative">
                    <Users
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <input
                      type="number"
                      min={0}
                      value={formData.capacity_operational}
                      onChange={(e) => set({ capacity_operational: e.target.value })}
                      className={cn(inputBase, inputTheme, 'pl-10')}
                      placeholder="e.g., 32"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Admission Restrictions</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Configure patient eligibility by sex and age group.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Sex Restriction
                  </label>
                  <div className="relative">
                    <Shield
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    />
                    <select
                      value={formData.sex_restriction}
                      onChange={(e) =>
                        set({ sex_restriction: e.target.value as SexRestriction })
                      }
                      className={cn(inputBase, inputTheme, 'pl-10 cursor-pointer')}
                    >
                      {SEX_RESTRICTION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-1', labelTheme)}>
                    Age Group
                  </label>
                  <select
                    value={formData.age_group}
                    onChange={(e) => set({ age_group: e.target.value as AgeGroup })}
                    className={cn(inputBase, inputTheme, 'cursor-pointer')}
                  >
                    {AGE_GROUP_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className={cn('rounded-xl border', sectionCard)}>
            <div className={cn('px-4 py-3 border-b', subtleDivider)}>
              <h4 className="text-sm font-semibold">Additional Notes</h4>
              <p className={cn('text-xs mt-1', hintTheme)}>
                Capture any extra context for staff or operations.
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
                  onChange={(e) => set({ note: e.target.value })}
                  rows={4}
                  className={cn(inputBase, inputTheme, 'pl-10 resize-none')}
                  placeholder="Additional notes about the ward..."
                />
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
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : mode === 'edit' ? (
                  'Save Changes'
                ) : (
                  'Create Ward'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardFormDrawer;
