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
  CheckCircle,
} from 'lucide-react';
import { useUpdateFacilityStaffRole } from '../../api/team-management/queries/facilityStaffRoleQueries';
import { useGetDepartmentsByFacility } from '../../api/department-managment/useDepartmentQueries';
import { useGetFacilityRoles, useGetFacilitySpecificRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import { useGetModules } from '../../api/team-management/queries/useModuleQueries';
import type {
  AssignmentStatus,
  ShiftType,
  UpdateFacilityStaffRoleRequest,
} from '../../api/team-management/types/facilityStaffRoleTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Fetch modules
  const { data: modulesResponse, isLoading: modulesLoading } = useGetModules(
    { is_active: true },
    { enabled: open }
  );

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
  const allModules = useMemo(() => modulesResponse?.data || [], [modulesResponse]);

  // Filter out "account" module
  const selectableModules = useMemo(() => {
    return allModules.filter(module => {
      const codeNormalized = module.code.toLowerCase();
      return codeNormalized !== 'account' && codeNormalized !== 'accounts';
    });
  }, [allModules]);

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
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Panel - Slide in from right */}
      <motion.div
        ref={drawerRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className={cn(
          'relative h-full w-full sm:w-[640px] max-w-full overflow-y-auto',
          'border-l-2 shadow-2xl',
          isDark 
            ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-500/30' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none',
          isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
        )} />

        {/* Header - Sticky */}
        <div className={cn(
          'sticky top-0 z-20 p-5 border-b-2 backdrop-blur-md',
          isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className={cn(
                  'p-2 rounded-xl',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <Shield className={cn(
                    'w-5 h-5',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <h3 id="drawer-title" className="text-lg font-bold">
                  Edit Staff Permissions
                </h3>
              </div>
              <p className={cn(
                'text-xs flex items-center gap-2',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                <span>Update role, permissions, and employment details</span>
                <span className="w-1 h-1 rounded-full bg-gray-400" />
                <kbd className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono border',
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                )}>
                  ⌘/Ctrl + Enter
                </kbd>
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              disabled={updateMutation.isPending}
              className={cn(
                'p-2 rounded-lg border-2 transition-colors flex-shrink-0',
                isDark 
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-400' 
                  : 'border-gray-200 hover:bg-gray-100 text-gray-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !updateMutation.isPending && 'cursor-pointer'
              )}
              aria-label="Close drawer"
              type="button"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        {isFormLoading ? (
          <div className="p-6">
            <LoadingSkeleton variant='form' theme={theme} message='Loading permissions...' />
          </div>
        ) : (
          <div className="relative p-5 space-y-5">
            {/* Staff Info Display - Enhanced Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-blue-900/20 to-gray-900 border-blue-500/30' 
                  : 'bg-gradient-to-br from-blue-50/80 to-white border-blue-200'
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-blue-500" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  )}>
                    <UserCheck className={cn(
                      'w-4 h-4',
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    )} />
                  </div>
                  <h4 className="font-semibold text-sm">Current Staff Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={cn(
                    'p-3 rounded-lg border',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                  )}>
                    <div className={cn(
                      'text-xs mb-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Name
                    </div>
                    <div className="font-semibold truncate">
                      {staffInfo.staff_name || 'Not specified'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-3 rounded-lg border',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                  )}>
                    <div className={cn(
                      'text-xs mb-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Staff Number
                    </div>
                    <div className="font-mono text-sm truncate">
                      {staffInfo.staff_uuid || 'Not specified'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-3 rounded-lg border',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                  )}>
                    <div className={cn(
                      'text-xs mb-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Current Role
                    </div>
                    <div className="font-medium capitalize truncate">
                      {staffInfo.current_role_code?.replace(/_/g, ' ') || 'Not specified'}
                    </div>
                  </div>

                  <div className={cn(
                    'p-3 rounded-lg border',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
                  )}>
                    <div className={cn(
                      'text-xs mb-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Current Status
                    </div>
                    <div className="font-medium capitalize">
                      {staffInfo.current_assignment_status?.replace(/_/g, ' ') || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Effective Date */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                )}>
                  <Calendar className={cn(
                    'w-4 h-4',
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Effective Date</h4>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full ml-auto',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  Optional
                </span>
              </div>

              <div className="relative">
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
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border-2',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'transition-all',
                    formErrors.effective_from ? 'border-red-500' : '',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900',
                    updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={updateMutation.isPending}
                />
                {formErrors.effective_from && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.effective_from}
                  </motion.p>
                )}
                <p className={cn(
                  'mt-2 text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  If not provided, defaults to today's date
                </p>
              </div>
            </motion.div>

            {/* Section: Assignment Status & Role */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <Shield className={cn(
                    'w-4 h-4',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Assignment Status & Role</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assignment Status */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Assignment Status
                  </label>
                  <div className="relative">
                    <select
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
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg border-2 appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        formErrors.assignment_status ? 'border-red-500' : '',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
                        updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">Select status...</option>
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="suspended">Suspended</option>
                      <option value="terminated">Terminated</option>
                    </select>
                    <ChevronDown className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
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
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Facility Role
                  </label>
                  <div className="relative">
                    <select
                      value={formData.role_code}
                      onChange={(e) => {
                        set({ role_code: e.target.value });
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.role_code;
                          return newErrors;
                        });
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg border-2 appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        formErrors.role_code ? 'border-red-500' : '',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
                        updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">Select a role...</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.code}>
                          {role.name} {role.is_system_role ? '(System)' : '(Custom)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                  </div>
                  {formErrors.role_code && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.role_code}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Section: Employment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                )}>
                  <Briefcase className={cn(
                    'w-4 h-4',
                    isDark ? 'text-green-400' : 'text-green-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Employment Details</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employment Status */}
                <div>
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Employment Status
                  </label>
                  <div className="relative">
                    <select
                      value={formData.employment_status}
                      onChange={(e) => {
                        set({ employment_status: e.target.value });
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.employment_status;
                          return newErrors;
                        });
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg border-2 appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        formErrors.employment_status ? 'border-red-500' : '',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
                        updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}
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
                    <ChevronDown className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
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
                  <label className={cn(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Employment Type
                  </label>
                  <div className="relative">
                    <select
                      value={formData.employment_type}
                      onChange={(e) => {
                        set({ employment_type: e.target.value });
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.employment_type;
                          return newErrors;
                        });
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg border-2 appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        formErrors.employment_type ? 'border-red-500' : '',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
                        updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                      )}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">Select type...</option>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="locum_tenens">Locum Tenens</option>
                      <option value="volunteer">Volunteer</option>
                    </select>
                    <ChevronDown className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                  </div>
                  {formErrors.employment_type && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.employment_type}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Section: Shift Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                )}>
                  <Clock className={cn(
                    'w-4 h-4',
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Shift Details</h4>
              </div>

              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Shift Type
                </label>
                <div className="relative">
                  <select
                    value={formData.shift_type || ''}
                    onChange={(e) => set({ shift_type: (e.target.value as ShiftType) || null })}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg border-2 appearance-none',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'transition-all cursor-pointer',
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
                      updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={updateMutation.isPending}
                  >
                    <option value="">No specific shift</option>
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="rotating">Rotating Shift</option>
                    <option value="on_call">On Call</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  <ChevronDown className={cn(
                    'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )} />
                </div>
                <p className={cn(
                  'mt-2 text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  Select the primary shift type for this staff member.
                </p>
              </div>
            </motion.div>

            {/* Section: Departments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <Building2 className={cn(
                    'w-4 h-4',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Department Access</h4>
                {formData.department_ids.length > 0 && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full ml-auto',
                    isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                  )}>
                    {formData.department_ids.length} selected
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {departments.length === 0 ? (
                  <div className={cn(
                    'p-6 rounded-lg text-center border-2',
                    isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                  )}>
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No departments available</p>
                  </div>
                ) : (
                  departments.map((dept) => {
                    const deptId = dept.id;
                    const isChecked = formData.department_ids.includes(deptId);

                    return (
                      <motion.label
                        key={deptId}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          isChecked
                            ? isDark
                              ? 'bg-blue-900/20 border-blue-700'
                              : 'bg-blue-50 border-blue-300'
                            : isDark
                              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                              : 'bg-gray-50 border-gray-300 hover:border-gray-400',
                          updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDepartment(deptId)}
                          disabled={updateMutation.isPending}
                          className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                          aria-label={`Toggle ${dept.department_name}`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{dept.department_name}</span>

                            {dept.department_code && (
                              <code
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs border',
                                  isDark
                                    ? 'bg-gray-900 text-gray-400 border-gray-700'
                                    : 'bg-white text-gray-600 border-gray-200'
                                )}
                              >
                                {dept.department_code}
                              </code>
                            )}
                          </div>
                        </div>

                        {isChecked && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </motion.label>
                    );
                  })
                )}
              </div>

              {formErrors.department_ids && (
                <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.department_ids}
                </p>
              )}
            </motion.div>

            {/* Section: Module Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                )}>
                  <Package className={cn(
                    'w-4 h-4',
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  )} />
                </div>
                <h4 className="font-semibold text-sm">Permissions</h4>
                {formData.module_code.length > 0 && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full ml-auto',
                    isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                  )}>
                    {formData.module_code.length} selected
                  </span>
                )}
              </div>

              <p className={cn(
                'text-xs mb-4',
                isDark ? 'text-gray-500' : 'text-gray-500'
              )}>
                Select the access level this staff member should have
              </p>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {selectableModules.length === 0 ? (
                  <div className={cn(
                    'p-6 rounded-lg text-center border-2',
                    isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                  )}>
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No modules available</p>
                  </div>
                ) : (
                  selectableModules.map((module) => {
                    const isChecked = formData.module_code.includes(module.code);

                    return (
                      <motion.label
                        key={module.id}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          isChecked
                            ? isDark
                              ? 'bg-indigo-900/20 border-indigo-700'
                              : 'bg-indigo-50 border-indigo-300'
                            : isDark
                              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                              : 'bg-gray-50 border-gray-300 hover:border-gray-400',
                          updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(module.code)}
                          disabled={updateMutation.isPending}
                          className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                          aria-label={`Toggle ${module.name}`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium text-sm">{module.name}</div>
                            <code
                              className={cn(
                                'px-2 py-0.5 rounded text-xs border',
                                isDark
                                  ? 'bg-gray-900 text-gray-400 border-gray-700'
                                  : 'bg-white text-gray-600 border-gray-200'
                              )}
                            >
                              {module.code}
                            </code>
                          </div>
                          {module.description && (
                            <div className={cn(
                              'text-xs mt-1',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {module.description}
                            </div>
                          )}
                        </div>

                        {isChecked && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </motion.label>
                    );
                  })
                )}
              </div>

              {formErrors.module_code && (
                <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.module_code}
                </p>
              )}
            </motion.div>
          </div>
        )}

        {/* Footer - Sticky */}
        <div className={cn(
          'sticky bottom-0 p-5 border-t-2 backdrop-blur-md',
          isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-200 bg-white/95'
        )}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                hasAtLeastOneField ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <p className={cn(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {hasAtLeastOneField
                  ? 'Ready to save changes'
                  : 'At least one field must be filled'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={updateMutation.isPending}
                type="button"
                className={cn(
                  'flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  !updateMutation.isPending && 'cursor-pointer'
                )}
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !hasAtLeastOneField}
                type="button"
                className={cn(
                  'flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium',
                  'border-2 transition-all',
                  updateMutation.isPending || !hasAtLeastOneField
                    ? isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : isDark
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5',
                  !(updateMutation.isPending || !hasAtLeastOneField) && 'cursor-pointer'
                )}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

StaffPermissionDrawer.displayName = 'StaffPermissionDrawer';

export default StaffPermissionDrawer;