import React, { useEffect, useMemo, useRef } from 'react';
import {
  Bed,
  Building2,
  DoorOpen,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  DepartmentStatus,
  DepartmentType,
} from '../../../../../administration/admin-module/api/department-managment/departmentTypes';

export interface DepartmentFormData {
  department_name: string;
  department_type: DepartmentType;
  department_code: string;
  bed_count: number | null;
  treatment_room_count: number | null;
  building: string;
  floor: string;
  wing_section: string;
  accepts_walk_ins: boolean;
  requires_appointment: boolean;
  status: DepartmentStatus;
}

interface DepartmentTypeOption {
  value: DepartmentType;
  label: string;
}

interface DepartmentFormDrawerProps {
  theme: 'light' | 'dark';
  mode: 'create' | 'edit';
  open: boolean;
  formData: DepartmentFormData;
  departmentTypeOptions: DepartmentTypeOption[];
  onChange: (next: DepartmentFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export const DepartmentFormDrawer: React.FC<DepartmentFormDrawerProps> = ({
  theme,
  mode,
  open,
  formData,
  departmentTypeOptions,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  const isDark = theme === 'dark';
  const title = mode === 'edit' ? 'Edit Department' : 'Create New Department';

  const helperText = useMemo(() => {
    return mode === 'edit'
      ? 'Update operational settings, location, and capacity.'
      : 'Add a new clinical department for this facility.';
  }, [mode]);

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

  const set = (patch: Partial<DepartmentFormData>) => {
    onChange({ ...formData, ...patch });
  };

  const handleDrawerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (!isSubmitting && canSubmit) onSubmit();
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
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[620px] overflow-y-auto border-l ${
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
              <h4 className="text-sm font-semibold">Department Identity</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Core naming, classification, and operational status.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Department Code
                </label>
                <div className="relative">
                    <input
                    type="text"
                    value={formData.department_code}
                    onChange={(e) => set({ department_code: e.target.value })}
                    className={`${inputBase} ${inputTheme} pr-10 ${
                        isDark 
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed border-gray-700' 
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                    }`}
                    readOnly
                    disabled
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Auto-generated
                    </span>
                    </div>
                </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.department_name}
                    onChange={(e) => set({ department_name: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., Emergency Department"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Department Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department_type}
                    onChange={(e) => set({ department_type: e.target.value as DepartmentType })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    {departmentTypeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => set({ status: e.target.value as DepartmentStatus })}
                    className={`${inputBase} ${inputTheme} cursor-pointer`}
                  >
                    <option value={DepartmentStatus.ACTIVE}>Active</option>
                    <option value={DepartmentStatus.INACTIVE}>Inactive</option>
                    <option value={DepartmentStatus.TEMPORARILY_CLOSED}>Temporarily Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Capacity & Location</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Define bed capacity, treatment rooms, and physical placement.
              </p>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Bed Count
                  </label>
                  <div className="relative">
                    <Bed className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      min={0}
                      value={formData.bed_count ?? ''}
                      onChange={(e) =>
                        set({
                          bed_count: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      className={`${inputBase} ${inputTheme} pl-10`}
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Treatment Rooms
                  </label>
                  <div className="relative">
                    <DoorOpen className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="number"
                      min={0}
                      value={formData.treatment_room_count ?? ''}
                      onChange={(e) =>
                        set({
                          treatment_room_count: e.target.value ? parseInt(e.target.value, 10) : null,
                        })
                      }
                      className={`${inputBase} ${inputTheme} pl-10`}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Building
                  </label>
                  <div className="relative">
                    <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => set({ building: e.target.value })}
                      className={`${inputBase} ${inputTheme} pl-10`}
                      placeholder="e.g., Main Building"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Floor
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => set({ floor: e.target.value })}
                    className={`${inputBase} ${inputTheme}`}
                    placeholder="e.g., 3rd Floor"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                  Wing / Section
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={formData.wing_section}
                    onChange={(e) => set({ wing_section: e.target.value })}
                    className={`${inputBase} ${inputTheme} pl-10`}
                    placeholder="e.g., East Wing"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border ${sectionCard}`}>
            <div className={`px-4 py-3 border-b ${subtleDivider}`}>
              <h4 className="text-sm font-semibold">Workflow Rules</h4>
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Control how patients can access this department.
              </p>
            </div>

            <div className="p-4 space-y-3">
              <label
                className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                  isDark
                    ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.accepts_walk_ins}
                  onChange={(e) => set({ accepts_walk_ins: e.target.checked })}
                  className={`mt-0.5 rounded cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Accepts Walk-ins
                  </div>
                  <div className={`text-xs mt-0.5 ${hintTheme}`}>
                    Patients can access this department without a scheduled appointment.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-lg border p-3 transition cursor-pointer ${
                  isDark
                    ? 'border-gray-800 bg-gray-950/30 hover:bg-gray-900/30'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.requires_appointment}
                  onChange={(e) => set({ requires_appointment: e.target.checked })}
                  className={`mt-0.5 rounded cursor-pointer ${
                    isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Requires Appointment
                  </div>
                  <div className={`text-xs mt-0.5 ${hintTheme}`}>
                    Patients must have an appointment before being seen.
                  </div>
                </div>
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
                ) : mode === 'edit' ? (
                  'Update Department'
                ) : (
                  'Create Department'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentFormDrawer;
