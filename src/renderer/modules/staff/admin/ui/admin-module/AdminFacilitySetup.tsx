/**
 * ============================================================================
 * ADMIN FACILITY SETUP COMPONENT
 * ============================================================================
 * 
 * Comprehensive department management interface for facility administrators.
 * Provides real-time CRUD operations with intuitive UI and responsive design.
 * 
 * @component AdminFacilitySetup
 * @description Single-page component for managing all aspects of facility
 * departments including creation, editing, deletion, and restoration.
 * 
 * Features:
 * - Real-time department list with filtering
 * - Inline department creation with form validation
 * - Quick edit modal for existing departments
 * - Soft delete with restore functionality
 * - Responsive grid layout with search and filters
 * - Department type badges and status indicators
 * - Capacity and resource tracking
 * - Parent-child department relationships
 */

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Save,
  Bed,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useActiveContext } from '../../../../../app/store/hooks/useActiveContext';
import {
  useGetDepartmentsByFacility,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useRestoreDepartment,
  departmentKeys,
}  from '../../api/useDepartmentQueries';
import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentType,
  DepartmentStatus,
} from '../../api/departmentTypes';

/* -------------------------------------------------------------------------- */
/*                                INTERFACES                                  */
/* -------------------------------------------------------------------------- */

interface AdminFacilitySetupProps {
  theme: 'light' | 'dark';
}

interface DepartmentFormData {
  department_name: string;
  department_type: DepartmentType | '';
  department_code: string;
  status: DepartmentStatus;
  bed_count: string;
  treatment_room_count: string;
  max_concurrent_capacity: string;
  building: string;
  floor: string;
  wing_section: string;
  accepts_walk_ins: boolean;
  requires_appointment: boolean;
  average_wait_time_minutes: string;
}

/* -------------------------------------------------------------------------- */
/*                                CONSTANTS                                   */
/* -------------------------------------------------------------------------- */

const DEPARTMENT_TYPE_OPTIONS: { value: DepartmentType; label: string; icon: string }[] = [
  { value: 'emergency' as DepartmentType, label: 'Emergency', icon: '🚑' },
  { value: 'intensive_care' as DepartmentType, label: 'Intensive Care', icon: '🏥' },
  { value: 'surgery' as DepartmentType, label: 'Surgery', icon: '⚕️' },
  { value: 'outpatient' as DepartmentType, label: 'Outpatient', icon: '👨‍⚕️' },
  { value: 'inpatient' as DepartmentType, label: 'Inpatient', icon: '🛏️' },
  { value: 'radiology' as DepartmentType, label: 'Radiology', icon: '📡' },
  { value: 'laboratory' as DepartmentType, label: 'Laboratory', icon: '🔬' },
  { value: 'pharmacy' as DepartmentType, label: 'Pharmacy', icon: '💊' },
  { value: 'physical_therapy' as DepartmentType, label: 'Physical Therapy', icon: '🏃' },
  { value: 'cardiology' as DepartmentType, label: 'Cardiology', icon: '❤️' },
  { value: 'oncology' as DepartmentType, label: 'Oncology', icon: '🎗️' },
  { value: 'pediatrics' as DepartmentType, label: 'Pediatrics', icon: '👶' },
  { value: 'obstetrics' as DepartmentType, label: 'Obstetrics', icon: '🤰' },
  { value: 'psychiatry' as DepartmentType, label: 'Psychiatry', icon: '🧠' },
  { value: 'administration' as DepartmentType, label: 'Administration', icon: '📋' },
  { value: 'support_services' as DepartmentType, label: 'Support Services', icon: '🔧' },
];

const STATUS_OPTIONS: { value: DepartmentStatus; label: string }[] = [
  { value: 'active' as DepartmentStatus, label: 'Active' },
  { value: 'inactive' as DepartmentStatus, label: 'Inactive' },
  { value: 'temporarily_closed' as DepartmentStatus, label: 'Temporarily Closed' },
];

const INITIAL_FORM_DATA: DepartmentFormData = {
  department_name: '',
  department_type: '',
  department_code: '',
  status: 'active' as DepartmentStatus,
  bed_count: '',
  treatment_room_count: '',
  max_concurrent_capacity: '',
  building: '',
  floor: '',
  wing_section: '',
  accepts_walk_ins: false,
  requires_appointment: false,
  average_wait_time_minutes: '',
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export const AdminFacilitySetup: React.FC<AdminFacilitySetupProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { activeFacilityId } = useActiveContext();

  /* ---------------------------- Local State ----------------------------- */
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DepartmentType | 'all'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(INITIAL_FORM_DATA);

  /* ---------------------------- API Hooks ------------------------------- */
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useGetDepartmentsByFacility(
    activeFacilityId || 0,
    { status: statusFilter === 'all' ? undefined : statusFilter },
    { enabled: !!activeFacilityId }
  );

  const { mutate: createDepartment, isPending: isCreating } = useCreateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.byFacility(activeFacilityId || 0) });
      setShowCreateForm(false);
      setFormData(INITIAL_FORM_DATA);
    },
  });

  const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.byFacility(activeFacilityId || 0) });
      setEditingDepartment(null);
      setFormData(INITIAL_FORM_DATA);
    },
  });

  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.byFacility(activeFacilityId || 0) });
    },
  });

  const { mutate: restoreDepartment, isPending: isRestoring } = useRestoreDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.byFacility(activeFacilityId || 0) });
    },
  });

  /* --------------------------- Computed Data ---------------------------- */
  const departments = departmentsResponse?.data || [];

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch =
        dept.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.department_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || dept.department_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [departments, searchTerm, typeFilter, statusFilter]);

  /* --------------------------- Event Handlers --------------------------- */
  const handleCreateClick = () => {
    setShowCreateForm(true);
    setEditingDepartment(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department);
    setShowCreateForm(false);
    setFormData({
      department_name: department.department_name,
      department_type: department.department_type,
      department_code: department.department_code || '',
      status: department.status,
      bed_count: department.bed_count?.toString() || '',
      treatment_room_count: department.treatment_room_count?.toString() || '',
      max_concurrent_capacity: department.max_concurrent_capacity?.toString() || '',
      building: department.building || '',
      floor: department.floor || '',
      wing_section: department.wing_section || '',
      accepts_walk_ins: department.accepts_walk_ins,
      requires_appointment: department.requires_appointment,
      average_wait_time_minutes: department.average_wait_time_minutes?.toString() || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingDepartment(null);
    setShowCreateForm(false);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleFormChange = (field: keyof DepartmentFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeFacilityId || !formData.department_name || !formData.department_type) {
      return;
    }

    const requestData: CreateDepartmentRequest = {
      facility_id: activeFacilityId,
      department_name: formData.department_name,
      department_type: formData.department_type as DepartmentType,
      department_code: formData.department_code || undefined,
      status: formData.status,
      bed_count: formData.bed_count ? parseInt(formData.bed_count, 10) : undefined,
      treatment_room_count: formData.treatment_room_count ? parseInt(formData.treatment_room_count, 10) : undefined,
      max_concurrent_capacity: formData.max_concurrent_capacity ? parseInt(formData.max_concurrent_capacity, 10) : undefined,
      building: formData.building || undefined,
      floor: formData.floor || undefined,
      wing_section: formData.wing_section || undefined,
      accepts_walk_ins: formData.accepts_walk_ins,
      requires_appointment: formData.requires_appointment,
      average_wait_time_minutes: formData.average_wait_time_minutes ? parseInt(formData.average_wait_time_minutes, 10) : undefined,
    };

    createDepartment(requestData);
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDepartment) return;

    const requestData: UpdateDepartmentRequest = {
      department_name: formData.department_name,
      department_type: formData.department_type as DepartmentType,
      department_code: formData.department_code || undefined,
      status: formData.status,
      bed_count: formData.bed_count ? parseInt(formData.bed_count, 10) : null,
      treatment_room_count: formData.treatment_room_count ? parseInt(formData.treatment_room_count, 10) : null,
      max_concurrent_capacity: formData.max_concurrent_capacity ? parseInt(formData.max_concurrent_capacity, 10) : null,
      building: formData.building || null,
      floor: formData.floor || null,
      wing_section: formData.wing_section || null,
      accepts_walk_ins: formData.accepts_walk_ins,
      requires_appointment: formData.requires_appointment,
      average_wait_time_minutes: formData.average_wait_time_minutes ? parseInt(formData.average_wait_time_minutes, 10) : null,
    };

    updateDepartment({
      uuid: editingDepartment.department_uuid,
      data: requestData,
    });
  };

  const handleDelete = (uuid: string) => {
    if (window.confirm('Are you sure you want to delete this department? It can be restored later.')) {
      deleteDepartment({ uuid });
    }
  };

  const handleRestore = (uuid: string) => {
    restoreDepartment({ uuid });
  };

  /* ---------------------------- Render Helpers -------------------------- */
  const getStatusBadge = (status: DepartmentStatus, isDeleted: boolean) => {
    if (isDeleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400">
          <XCircle size={14} />
          Deleted
        </span>
      );
    }

    const statusConfig = {
      active: { icon: CheckCircle2, color: 'text-green-400 bg-green-500/10' },
      inactive: { icon: XCircle, color: 'text-gray-400 bg-gray-500/10' },
      temporarily_closed: { icon: AlertCircle, color: 'text-yellow-400 bg-yellow-500/10' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getDepartmentTypeEmoji = (type: DepartmentType): string => {
    return DEPARTMENT_TYPE_OPTIONS.find((opt) => opt.value === type)?.icon || '🏥';
  };

  /* ---------------------------- Loading State --------------------------- */
  if (!activeFacilityId) {
    return (
      <div className="space-y-6">
        <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <AlertCircle className={`mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={48} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No active facility selected. Please select a facility to manage departments.</p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   RENDER                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Facility Setup</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure departments and internal structure of your healthcare facility
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          disabled={showCreateForm}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400'
          }`}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingDepartment) && (
        <div className={`rounded-xl p-6 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingDepartment ? 'Edit Department' : 'Create New Department'}
            </h2>
            <button onClick={handleCancelEdit} className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          <form onSubmit={editingDepartment ? handleSubmitUpdate : handleSubmitCreate} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department_name}
                  onChange={(e) => handleFormChange('department_name', e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Emergency Department"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department Code
                </label>
                <input
                  type="text"
                  value={formData.department_code}
                  onChange={(e) => handleFormChange('department_code', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., EMRG-01"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department_type}
                  onChange={(e) => handleFormChange('department_type', e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select type...</option>
                  {DEPARTMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Bed Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bed_count}
                  onChange={(e) => handleFormChange('bed_count', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Treatment Rooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.treatment_room_count}
                  onChange={(e) => handleFormChange('treatment_room_count', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Max Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_concurrent_capacity}
                  onChange={(e) => handleFormChange('max_concurrent_capacity', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Building</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => handleFormChange('building', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., Building A"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Floor</label>
                <input
                  type="text"
                  value={formData.floor}
                  onChange={(e) => handleFormChange('floor', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., 2nd Floor"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Wing/Section</label>
                <input
                  type="text"
                  value={formData.wing_section}
                  onChange={(e) => handleFormChange('wing_section', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="e.g., East Wing"
                />
              </div>
            </div>

            {/* Operational Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="accepts_walk_ins"
                  checked={formData.accepts_walk_ins}
                  onChange={(e) => handleFormChange('accepts_walk_ins', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="accepts_walk_ins" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Accepts Walk-ins
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requires_appointment"
                  checked={formData.requires_appointment}
                  onChange={(e) => handleFormChange('requires_appointment', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="requires_appointment" className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Requires Appointment
                </label>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Average Wait Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.average_wait_time_minutes}
                  onChange={(e) => handleFormChange('average_wait_time_minutes', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                {(isCreating || isUpdating) ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {editingDepartment ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className={`rounded-xl p-4 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search departments..."
              className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DepartmentType | 'all')}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              {DEPARTMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DepartmentStatus | 'all')}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Department List */}
      {isLoadingDepartments ? (
        <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <Loader2 className={`mx-auto mb-4 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={48} />
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <Building2 className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
          <p className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No departments found</p>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first department'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <div
              key={department.id}
              className={`rounded-xl p-5 border transition-all hover:shadow-lg ${
                isDark ? 'border-gray-800 bg-gray-900 hover:border-gray-700' : 'border-gray-200 bg-white hover:border-gray-300'
              } ${department.deleted_at ? 'opacity-60' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getDepartmentTypeEmoji(department.department_type)}</div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{department.department_name}</h3>
                    {department.department_code && (
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{department.department_code}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(department.status, !!department.deleted_at)}
              </div>

              {/* Info Grid */}
              <div className="space-y-2 mb-4">
                <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Building2 size={16} />
                  <span className="capitalize">{department.department_type_label}</span>
                </div>

                {(department.building || department.floor) && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <MapPin size={16} />
                    <span>
                      {[department.building, department.floor, department.wing_section].filter(Boolean).join(', ') || 'Location not set'}
                    </span>
                  </div>
                )}

                {department.bed_count !== null && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Bed size={16} />
                    <span>{department.bed_count} beds</span>
                  </div>
                )}

                {department.max_concurrent_capacity && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Users size={16} />
                    <span>Capacity: {department.max_concurrent_capacity}</span>
                  </div>
                )}

                {department.average_wait_time_minutes !== null && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={16} />
                    <span>~{department.average_wait_time_minutes} min wait</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                {department.deleted_at ? (
                  <button
                    onClick={() => handleRestore(department.department_uuid)}
                    disabled={isRestoring}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50`}
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(department)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(department.department_uuid)}
                      disabled={isDeleting}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'
                      } disabled:opacity-50`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredDepartments.length > 0 && (
        <div className={`rounded-xl p-4 border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Showing {filteredDepartments.length} of {departments.length} departments
            </span>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {departments.filter((d) => d.status === 'active' && !d.deleted_at).length} active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFacilitySetup;