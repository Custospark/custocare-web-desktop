import React, { useEffect, useMemo, useRef } from 'react';
import {
  Building,
  CheckCircle2,
  Layers,
  RefreshCw,
  Shapes,
  X,
} from 'lucide-react';
import type {
  FacilitySpaceType,
} from '../../../api/facility-space/FacilitySpaceTypes';

export interface FacilitySpaceFormData {
  facility_id: number | null;
  name: string;
  type: FacilitySpaceType | '';
  floor: string;
  building: string;
  is_active: boolean;
}

interface SpaceTypeOption {
  value: FacilitySpaceType;
  label: string;
}

interface FacilitySpaceFormDrawerProps {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;
  formData: FacilitySpaceFormData;
  spaceTypeOptions: SpaceTypeOption[];
  onChange: (next: FacilitySpaceFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  selectedSpaceName?: string;
}

export const FacilitySpaceFormDrawer: React.FC<FacilitySpaceFormDrawerProps> = ({
  theme,
  mode,
  open,
  formData,
  spaceTypeOptions,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
  selectedSpaceName,
}) => {
  const isDark = theme === 'dark';
  const title = mode === 'create' ? 'Create New Space' : 'Edit Space';

  const helperText = useMemo(() => {
    return mode === 'create'
      ? 'Add a new facility space with its type, building, and floor details.'
      : `Update details for ${selectedSpaceName || 'this space'}.`;
  }, [mode, selectedSpaceName]);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (open && !didAutoFocusRef.current) {
      didAutoFocusRef.current = true;
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [open]);

  const set = (patch: Partial<FacilitySpaceFormData>) => {
    onChange({ ...formData, ...patch });
  };

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting && canSubmit) {
      onSubmit();
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleDrawerKeyDown}>
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[560px] overflow-y-auto border-l ${
          isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={`p-5 border-b ${subtleDivider} flex items-start justify-between gap-4`}>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {helperText}
            </p>
            <p className={`text-xs mt-1 ${hintTheme}`}>
              Tip: Press <span className="font-medium">Ctrl/⌘ + Enter</span> to save.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100'
            }`}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Space Identity</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Basic information used to identify and categorize the space.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Space Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g., Consultation Room 101"
                  className={`${inputBase} ${inputTheme}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Space Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shapes className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={formData.type}
                    onChange={(e) => set({ type: e.target.value as FacilitySpaceType | '' })}
                    className={`${inputBase} ${inputTheme} pl-10 cursor-pointer`}
                  >
                    <option value="">Select type...</option>
                    {spaceTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Location Details</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Assign the space to a building and floor within the facility.
              </p>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Building
                </label>
                <div className="relative">
                  <Building className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => set({ building: e.target.value })}
                    placeholder="e.g., Main Building"
                    className={`${inputBase} ${inputTheme} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Floor
                </label>
                <div className="relative">
                  <Layers className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => set({ floor: e.target.value })}
                    placeholder="e.g., 1st Floor"
                    className={`${inputBase} ${inputTheme} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Availability</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Control whether this facility space is currently active.
              </p>
            </div>

            <div className="p-4">
              <label
                className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                  isDark
                    ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => set({ is_active: e.target.checked })}
                  className={`mt-0.5 rounded cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Active Space
                  </div>
                  <div className={`text-xs mt-0.5 ${hintTheme}`}>
                    Active spaces are available for use and appear as operational.
                  </div>
                </div>
                <CheckCircle2 className={`w-4 h-4 mt-0.5 ${formData.is_active ? 'text-green-500' : isDark ? 'text-gray-600' : 'text-gray-300'}`} />
              </label>
            </div>
          </div>
        </div>

        <div
          className={`sticky bottom-0 p-5 border-t ${subtleDivider} backdrop-blur ${
            isDark ? 'bg-gray-950/90' : 'bg-white/90'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs ${hintTheme}`}>
              Fields marked with <span className="text-red-500">*</span> are required.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || !canSubmit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${isSubmitting || !canSubmit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : mode === 'create' ? (
                  'Create Space'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilitySpaceFormDrawer;
