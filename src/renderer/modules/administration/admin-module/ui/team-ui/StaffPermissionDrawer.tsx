/**
 * ============================================================================
 * STAFF PERMISSION DRAWER COMPONENT
 * ============================================================================
 * 
 * Premium drawer interface for editing staff permissions and role assignments.
 * Provides comprehensive form for updating assignment status, role, departments,
 * modules, shift schedule, and employment details.
 * 
 * @component StaffPermissionDrawer
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  X,
  RefreshCw,
  Shield,
  Briefcase,
  Package,
  Clock,
  AlertCircle,
  UserCheck,
  Building2,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { useUpdateFacilityStaffRole } from '../../api/team-management/queries/facilityStaffRoleQueries';
import { useGetDepartmentsByFacility } from '../../api/department-managment/useDepartmentQueries';
import { useGetFacilityRoles, useGetFacilitySpecificRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import { useGetFacilityAssignableModules } from '../../api/team-management/queries/useModuleQueries';
import type {
  AssignmentStatus,
  ShiftType,
  UpdateFacilityStaffRoleRequest,
} from '../../api/team-management/types/facilityStaffRoleTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface StaffInfoForDrawer {
  staff_id: number;
  staff_name: string;
  staff_uuid: string;
  employee_number: string;
  current_role_code: string;
  current_assignment_status: string;
}


interface StaffPermissionDrawerProps {
  theme: 'light' | 'dark';
  open: boolean;
  staffInfo: StaffInfoForDrawer;
  facilityId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  assignment_status: AssignmentStatus | '';
  role_code: string;
  department_ids: number[];
  module_code: string[];
  shift_schedule: Record<string, string> | null;
  shift_type: ShiftType | null;
  employment_status: string;
  employment_type: string;
  effective_from: string; // ISO date string
}

export const StaffPermissionDrawer: React.FC<StaffPermissionDrawerProps> = ({
  theme,
  open,
  staffInfo,
  facilityId,
  onClose,
  onSuccess,
}) => {
  const isDark = theme === 'dark';

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Initialize form state with current staff info
  const getInitialFormData = useCallback((): FormData => ({
    assignment_status: '',
    role_code: '',
    department_ids: [],
    module_code: [],
    shift_schedule: null,
    shift_type: null,
    employment_status: '',
    employment_type: '',
    effective_from: getCurrentDate(),
  }), []);

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Track if at least one field has been filled
  const [, setHasAtLeastOneField] = useState<boolean>(false);

  // Focus management
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Fetch departments
  const { data: departmentsResponse, isLoading: departmentsLoading } = useGetDepartmentsByFacility(
    facilityId!,
    {},
    { enabled: open && !!facilityId }
  );

  // Fetch roles
  const { data: rolesResponse, isLoading: rolesLoading } = useGetFacilityRoles(
    {},
    { enabled: open }
  );

  // Fetch facility-specific roles
  const { data: facilityRolesResponse, isLoading: facilityRolesLoading } = useGetFacilitySpecificRoles(
    facilityId!,
    { enabled: open && !!facilityId }
  );

  const { data: assignableModulesResponse, isLoading: modulesLoading } =
    useGetFacilityAssignableModules(facilityId, { enabled: open && !!facilityId });

  // Combine roles (facility-specific roles first, then system roles)
  const roles = useMemo(() => {
    const facilityRoles = facilityRolesResponse?.data || [];
    const systemRoles = rolesResponse?.data || [];

    // Deduplicate by code
    const roleMap = new Map();
    [...facilityRoles, ...systemRoles].forEach(role => {
      if (!roleMap.has(role.code)) {
        roleMap.set(role.code, role);
      }
    });

    return Array.from(roleMap.values());
  }, [facilityRolesResponse, rolesResponse]);

  const departments = useMemo(() => departmentsResponse?.data || [], [departmentsResponse]);
  const assignablePayload = assignableModulesResponse?.data;
  const selectableModules = assignablePayload?.modules ?? [];
  const allowedModuleCodes = assignablePayload?.allowed_module_codes ?? [];
  const assignablePlanName = assignablePayload?.plan?.name ?? null;
  const editorIsFacilityOwner = assignablePayload?.editor_is_facility_owner ?? false;

  // Update mutation
  const updateMutation = useUpdateFacilityStaffRole({
    onSuccess: () => {
      onSuccess();
    },
  });

  const isFormLoading = departmentsLoading || rolesLoading || facilityRolesLoading || modulesLoading;

  // Create a stable key for tracking staffInfo changes
  const staffKey = useMemo(() =>
    `${staffInfo.staff_id}-${staffInfo.staff_uuid}`,
    [staffInfo]
  );

  // Reset form when staffInfo changes or drawer opens - Fixed useEffect
  useEffect(() => {
    if (open && staffInfo) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        const initialData = getInitialFormData();
        setFormData(initialData);
        setFormErrors({});
        setHasAtLeastOneField(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, staffKey, getInitialFormData, staffInfo]);

const hasAtLeastOneField =
  formData.assignment_status !== '' ||
  formData.role_code !== '' ||
  formData.department_ids.length > 0 ||
  formData.module_code.length > 0 ||
  formData.shift_type !== null ||
  formData.employment_status !== '' ||
  formData.employment_type !== '' ||
  (formData.effective_from !== '' && formData.effective_from !== getCurrentDate());


  // Auto-focus on first field when drawer opens
  useEffect(() => {
    if (open && firstFieldRef.current) {
      const timer = setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Set partial form data with type safety
  const set = useCallback((patch: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
  }, []);

  // Validation - All fields are now optional, but we need to validate data types when provided
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validate assignment_status if provided
    if (formData.assignment_status !== '' && formData.assignment_status.trim() === '') {
      errors.assignment_status = 'Assignment status cannot be empty if provided';
    }

    // Validate role_code if provided
    if (formData.role_code !== '' && formData.role_code.trim() === '') {
      errors.role_code = 'Role cannot be empty if provided';
    }

    // Validate employment_status if provided
    if (formData.employment_status !== '' && formData.employment_status.trim() === '') {
      errors.employment_status = 'Employment status cannot be empty if provided';
    }

    // Validate employment_type if provided
    if (formData.employment_type !== '' && formData.employment_type.trim() === '') {
      errors.employment_type = 'Employment type cannot be empty if provided';
    }

    // Validate effective_from is a valid date if provided and not empty
    if (formData.effective_from && formData.effective_from.trim() !== '' && !Date.parse(formData.effective_from)) {
      errors.effective_from = 'Valid effective date is required if provided';
    }

    // Validate department_ids are valid integers if provided
    if (Array.isArray(formData.department_ids) && formData.department_ids.length > 0) {
      const invalidDepts = formData.department_ids.filter(id =>
        typeof id !== 'number' || !Number.isInteger(id) || id <= 0
      );
      if (invalidDepts.length > 0) {
        errors.department_ids = 'Invalid department IDs detected';
      }
    }

    // Validate module_code if provided
    if (Array.isArray(formData.module_code) && formData.module_code.length > 0) {
      const invalidModules = formData.module_code.filter(code =>
        typeof code !== 'string' || code.trim() === ''
      );
      if (invalidModules.length > 0) {
        errors.module_code = 'Invalid module codes detected';
      } else {
        const notOnPlan = formData.module_code.filter(
          (code) => code !== 'account' && !allowedModuleCodes.includes(code),
        );
        if (notOnPlan.length > 0) {
          errors.module_code =
            'One or more selected modules are not included in your subscription plan.';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, allowedModuleCodes]);

  // Handle submit with precise data structure
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    if (!facilityId) {
      console.error('Facility ID is required');
      return;
    }

    if (!hasAtLeastOneField) {
      console.error('At least one field must be filled');
      return;
    }
const baseModuleCodes = formData.module_code ?? [];

const moduleCodesWithAccount =
  baseModuleCodes.length > 0
    ? Array.from(new Set([...baseModuleCodes, 'account']))
    : [];

const updateData: UpdateFacilityStaffRoleRequest = {
  facility_id: facilityId,
  staff_id: staffInfo.staff_id,

  ...(formData.assignment_status
    ? { assignment_status: formData.assignment_status as AssignmentStatus }
    : {}),

  ...(formData.role_code
    ? { role_code: formData.role_code }
    : {}),

  ...(formData.department_ids.length > 0
    ? { department_ids: formData.department_ids }
    : {}),

  ...(moduleCodesWithAccount.length > 0
    ? { module_code: moduleCodesWithAccount }
    : {}),

  ...(formData.shift_schedule !== null
    ? { shift_schedule: formData.shift_schedule }
    : {}),

  ...(formData.shift_type !== null
    ? { shift_type: formData.shift_type }
    : {}),

  ...(formData.employment_status
    ? {
        employment_status:
          formData.employment_status as UpdateFacilityStaffRoleRequest['employment_status'],
      }
    : {}),

  ...(formData.employment_type
    ? {
        employment_type:
          formData.employment_type as UpdateFacilityStaffRoleRequest['employment_type'],
      }
    : {}),

  ...(formData.effective_from
    ? { effective_from: formData.effective_from }
    : {}),
};




    updateMutation.mutate({
      id: staffInfo.staff_id,
      data: updateData,
    });
  }, [validateForm, formData, facilityId, staffInfo.staff_id, updateMutation, hasAtLeastOneField]);

  // Handle module toggle with array integrity
  const handleToggleModule = useCallback((moduleCode: string) => {
    setFormData(prev => {
      const currentModules = prev.module_code;
      const isCurrentlySelected = currentModules.includes(moduleCode);

      const updatedModules = isCurrentlySelected
        ? currentModules.filter(code => code !== moduleCode)
        : [...currentModules, moduleCode];

      return {
        ...prev,
        module_code: updatedModules,
      };
    });

    // Clear error when user makes a selection
    setFormErrors(prev => {
      if (!prev.module_code) return prev;
      const newErrors = { ...prev };
      delete newErrors.module_code;
      return newErrors;
    });
  }, []);

  // Handle department toggle with precise integer handling
  const handleToggleDepartment = useCallback((departmentId: number) => {
    setFormData(prev => {
      const currentDepartments = prev.department_ids;
      const isCurrentlySelected = currentDepartments.includes(departmentId);

      const updatedDepartments = isCurrentlySelected
        ? currentDepartments.filter(id => id !== departmentId)
        : [...currentDepartments, departmentId];

      return {
        ...prev,
        department_ids: updatedDepartments,
      };
    });

    // Clear error if exists
    setFormErrors(prev => {
      if (!prev.department_ids) return prev;
      const newErrors = { ...prev };
      delete newErrors.department_ids;
      return newErrors;
    });
  }, []);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !updateMutation.isPending) {
      onClose();
    }
  }, [onClose, updateMutation.isPending]);

  // Handle drawer key events
  const handleDrawerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !updateMutation.isPending) {
      e.preventDefault();
      onClose();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!updateMutation.isPending && hasAtLeastOneField) {
        handleSubmit();
      }
    }
  }, [onClose, updateMutation.isPending, handleSubmit, hasAtLeastOneField]);

  // Styling helpers
  const inputBase = `w-full px-3 py-2 rounded-lg border outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent`;
  const inputTheme = isDark
    ? 'bg-gray-900 border-gray-800 text-white placeholder:text-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';
  const labelTheme = isDark ? 'text-gray-300' : 'text-gray-700';
  const hintTheme = isDark ? 'text-gray-500' : 'text-gray-600';
  const sectionCard = isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200';
  const subtleDivider = isDark ? 'border-gray-800' : 'border-gray-200';

  // Don't render if not open
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onKeyDown={handleDrawerKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop with animation */}
      <div
        onClick={handleBackdropClick}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          open ? 'opacity-50' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Panel - Slide in from right */}
      <div
        ref={drawerRef}
        className={`relative h-full w-full sm:w-[640px] max-w-full overflow-y-auto border-l transform transition-transform duration-300 ease-out shadow-2xl ${
          open ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDark ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header - Sticky */}
        <div className={`sticky top-0 z-20 p-4 sm:p-5 border-b ${subtleDivider} backdrop-blur-md ${
          isDark ? 'bg-gray-950/95' : 'bg-white/95'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 id="drawer-title" className="text-base sm:text-lg font-semibold leading-6 flex items-center gap-2">
                <Shield className="w-5 h-5 flex-shrink-0" />
                Edit Staff Permissions
              </h3>
              {/* <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Update role, P, and employment details
              </p> */}
              <p className={`text-xs mt-1 ${hintTheme}`}>
                Tip: Press <kbd className={`px-1 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>Ctrl/⌘ + Enter</kbd> to save
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={updateMutation.isPending}
              className={`p-2 rounded-lg border transition-colors flex-shrink-0 ${
                isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Close drawer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {isFormLoading ? (
          <div className="p-5">
            <LoadingSkeleton variant='form' theme={theme} message='Loading permissions...' />
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Staff Info Display */}
            <div className={`rounded-xl border p-4 ${
              isDark ? 'bg-blue-900/10 border-blue-800' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <h4 className="font-medium text-sm sm:text-base">Current Staff Information</h4>
              </div>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Name</div>
                  <div className="font-medium truncate">
                    {staffInfo.staff_name || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Staff Number</div>
                  <div className="font-medium font-mono text-xs truncate">
                    {staffInfo.staff_uuid || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Current Role</div>
                  <div className="font-medium capitalize truncate">
                    {staffInfo.current_role_code?.replace(/_/g, ' ') || 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Current Status</div>
                  <div className="font-medium capitalize">
                    {staffInfo.current_assignment_status?.replace(/_/g, ' ') || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Effective Date */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Effective Date
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>When should these changes take effect?</p>
              </div>

              <div className="p-4">
                <input
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => {
                    set({ effective_from: e.target.value });
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.effective_from;
                      return newErrors;
                    });
                  }}
                  className={`${inputBase} ${inputTheme} ${
                    formErrors.effective_from ? 'border-red-500' : ''
                  }`}
                  disabled={updateMutation.isPending}
                />
                {formErrors.effective_from && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.effective_from}
                  </p>
                )}
                <p className={`mt-2 text-xs ${hintTheme}`}>
                  If not provided, defaults to today's date
                </p>
              </div>
            </div>

            {/* Section: Assignment Status & Role */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Assignment Status & Role
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>Core assignment configuration</p>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Assignment Status */}
                  <div>
                    <label htmlFor="assignment-status" className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Assignment Status
                    </label>
                    <div className="relative">
                      <select
                        id="assignment-status"
                        ref={firstFieldRef}
                        value={formData.assignment_status}
                        onChange={(e) => {
                          set({ assignment_status: e.target.value as AssignmentStatus | '' });
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.assignment_status;
                            return newErrors;
                          });
                        }}
                        className={`${inputBase} ${inputTheme} ${
                          formErrors.assignment_status ? 'border-red-500' : ''
                        } appearance-none pr-10`}
                        disabled={updateMutation.isPending}
                      >
                        <option value="">Select status...</option>
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    {formErrors.assignment_status && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.assignment_status}
                      </p>
                    )}
                  </div>

                  {/* Facility Role */}
                  <div>
                    <label htmlFor="facility-role" className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Facility Role
                    </label>
                    <div className="relative">
                      <select
                        id="facility-role"
                        value={formData.role_code}
                        onChange={(e) => {
                          set({ role_code: e.target.value });
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.role_code;
                            return newErrors;
                          });
                        }}
                        className={`${inputBase} ${inputTheme} ${
                          formErrors.role_code ? 'border-red-500' : ''
                        } appearance-none pr-10`}
                        disabled={updateMutation.isPending}
                      >
                        <option value="">Select a role...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.code}>
                            {role.name} {role.is_system_role ? '(System)' : '(Custom)'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    {formErrors.role_code && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.role_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Employment Details */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Employment Details
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>Employment status and type</p>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employment Status */}
                  <div>
                    <label htmlFor="employment-status" className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Employment Status
                    </label>
                    <div className="relative">
                      <select
                        id="employment-status"
                        value={formData.employment_status}
                        onChange={(e) => {
                          set({ employment_status: e.target.value });
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.employment_status;
                            return newErrors;
                          });
                        }}
                        className={`${inputBase} ${inputTheme} ${
                          formErrors.employment_status ? 'border-red-500' : ''
                        } appearance-none pr-10`}
                        disabled={updateMutation.isPending}
                      >
                        <option value="">Select status...</option>
                        <option value="employed">Employed</option>
                        <option value="suspended">Suspended</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="terminated">Terminated</option>
                        <option value="retired">Retired</option>
                        <option value="credentialing_pending">Credentialing Pending</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    {formErrors.employment_status && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.employment_status}
                      </p>
                    )}
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label htmlFor="employment-type" className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                      Employment Type
                    </label>
                    <div className="relative">
                      <select
                        id="employment-type"
                        value={formData.employment_type}
                        onChange={(e) => {
                          set({ employment_type: e.target.value });
                          setFormErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.employment_type;
                            return newErrors;
                          });
                        }}
                        className={`${inputBase} ${inputTheme} ${
                          formErrors.employment_type ? 'border-red-500' : ''
                        } appearance-none pr-10`}
                        disabled={updateMutation.isPending}
                      >
                        <option value="">Select type...</option>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="locum_tenens">Locum Tenens</option>
                        <option value="volunteer">Volunteer</option>
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    {formErrors.employment_type && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.employment_type}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Shift Details */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Shift Details
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>Shift type and schedule</p>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="shift-type" className={`block text-sm font-medium mb-1 ${labelTheme}`}>
                    Shift Type
                  </label>
                  <div className="relative">
                    <select
                      id="shift-type"
                      value={formData.shift_type || ''}
                      onChange={(e) => set({ shift_type: (e.target.value as ShiftType) || null })}
                      className={`${inputBase} ${inputTheme} appearance-none pr-10`}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">No specific shift</option>
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="rotating">Rotating Shift</option>
                      <option value="on_call">On Call</option>
                      <option value="flexible">Flexible</option>
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <p className={`mt-1 text-xs ${hintTheme}`}>
                    Select the primary shift type for this staff member.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Departments */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department Access
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>
                  Select departments this staff member can access
                </p>
              </div>

              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                {departments.length === 0 ? (
                  <div
                    className={`p-4 rounded-lg text-center text-sm ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    No departments available
                  </div>
                ) : (
                  departments.map((dept) => {
                    const deptId = dept.id;
                    const isChecked = formData.department_ids.includes(deptId);

                    return (
                      <label
                        key={deptId}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? isDark
                              ? 'bg-blue-900/20 border-blue-700'
                              : 'bg-blue-50 border-blue-300'
                            : isDark
                            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                        } ${updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDepartment(deptId)}
                          disabled={updateMutation.isPending}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                          aria-label={`Toggle ${dept.department_name}`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{dept.department_name}</span>

                            {dept.department_code && (
                              <code
                                className={`px-2 py-0.5 rounded text-xs ${
                                  isDark
                                    ? 'bg-gray-900 text-gray-400'
                                    : 'bg-white text-gray-600'
                                }`}
                              >
                                {dept.department_code}
                              </code>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className={`px-4 pb-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formData.department_ids.length > 0
                  ? `${formData.department_ids.length} department${
                      formData.department_ids.length !== 1 ? 's' : ''
                    } selected`
                  : 'No departments selected'}
              </div>

              {formErrors.department_ids && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.department_ids}
                  </p>
                </div>
              )}
            </div>

            {/* Section: Module Access */}
            <div className={`rounded-xl border ${sectionCard}`}>
              <div className={`px-4 py-3 border-b ${subtleDivider}`}>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Grant Access
                </h4>
                <p className={`text-xs mt-1 ${hintTheme}`}>
                  {assignablePlanName
                    ? `Modules included in your ${assignablePlanName} plan. Granting Administration does not make someone a facility owner.`
                    : 'Modules are scoped to your facility subscription plan.'}
                </p>
              </div>

              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {editorIsFacilityOwner && allowedModuleCodes.includes('administration') && (
                  <p className={`text-xs mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    As facility owner, you may grant Administration access to staff for billing and
                    team management without transferring ownership.
                  </p>
                )}
                {selectableModules.length === 0 ? (
                  <div className={`p-4 rounded-lg text-center text-sm ${
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
                  }`}>
                    No modules available on your current subscription plan
                    {assignablePlanName ? ` (${assignablePlanName})` : ''}
                  </div>
                ) : (
                  selectableModules.map((module) => {
                    const isChecked = formData.module_code.includes(module.code);

                    return (
                      <label
                        key={module.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? (isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300')
                            : (isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-300 hover:border-gray-400')
                        } ${updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(module.code)}
                          disabled={updateMutation.isPending}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                          aria-label={`Toggle ${module.name}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-sm">{module.name}</div>
                            <code className={`px-2 py-0.5 rounded text-xs ${
                              isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600'
                            }`}>
                              {module.code}
                            </code>
                          </div>
                          {module.description && (
                            <div className={`text-xs mt-1 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {module.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {formErrors.module_code && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.module_code}
                  </p>
                </div>
              )}

              {formData.module_code.length > 0 && (
                <div className={`px-4 pb-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formData.module_code.length} module{formData.module_code.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer - Sticky */}
        <div className={`sticky bottom-0 p-4 sm:p-5 border-t ${subtleDivider} backdrop-blur-md ${
          isDark ? 'bg-gray-950/95' : 'bg-white/95'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <p className={`text-xs ${hintTheme}`}>
              At least one field must be filled to enable save.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={updateMutation.isPending}
                type="button"
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer ${
                  isDark
                    ? 'bg-gray-950 hover:bg-gray-900 text-gray-300 border-gray-800'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !hasAtLeastOneField}
                type="button"
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${!(updateMutation.isPending || !hasAtLeastOneField) ? 'cursor-pointer' : ''}`}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

StaffPermissionDrawer.displayName = 'StaffPermissionDrawer';

export default StaffPermissionDrawer;