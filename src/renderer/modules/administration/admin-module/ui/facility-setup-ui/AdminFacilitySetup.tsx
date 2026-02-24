import React, { useState, useRef} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Users,
  DoorOpen,
  Clock,
  MapPin,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { 
  useGetDepartmentsByFacility,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useRestoreDepartment,
  departmentKeys
} from '../../../../administration/admin-module/api/department-managment/useDepartmentQueries';
import type { 
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from  '../../../../administration/admin-module/api/department-managment/departmentTypes';
import  { 
  DepartmentType,
  DepartmentStatus,
} from  '../../../../administration/admin-module/api/department-managment/departmentTypes';

interface AdminFacilitySetupProps {
  theme: 'light' | 'dark';
}

interface DepartmentFormData {
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

export const AdminFacilitySetup: React.FC<AdminFacilitySetupProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  
  // Get active facility from context
  const activeContext = useAppSelector(state => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;
  
  // State
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DepartmentType | 'all'>('all');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [showDeleted, setShowDeleted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<DepartmentFormData>({
    department_name: '',
    department_type: DepartmentType.OUTPATIENT,
    department_code: '',
    bed_count: null,
    treatment_room_count: null,
    building: '',
    floor: '',
    wing_section: '',
    accepts_walk_ins: true,
    requires_appointment: false,
    status: DepartmentStatus.ACTIVE
  });
  
  // Fetch departments
  const { 
    data: departmentsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetDepartmentsByFacility(
    activeFacilityId || 0,
    { 
      status: showDeleted ? undefined : DepartmentStatus.ACTIVE 
    },
    { 
      enabled: !!activeFacilityId,
      staleTime: 1000 * 60 // 1 minute
    }
  );
  
  const departments = departmentsResponse?.data || [];
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dept.department_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
    const matchesType = typeFilter === 'all' || dept.department_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Mutations
  const createMutation = useCreateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      setIsCreating(false);
      resetForm();
    }
  });
  
  const updateMutation = useUpdateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      setIsEditing(false);
      setSelectedDepartment(null);
      resetForm();
    }
  });
  
  const deleteMutation = useDeleteDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      setSelectedDepartment(null);
    }
  });
  
  const restoreMutation = useRestoreDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    }
  });
  
  // Department type options
  const departmentTypeOptions: { value: DepartmentType; label: string }[] = [
    { value: DepartmentType.EMERGENCY, label: 'Emergency' },
    { value: DepartmentType.INTENSIVE_CARE, label: 'Intensive Care' },
    { value: DepartmentType.SURGERY, label: 'Surgery' },
    { value: DepartmentType.OUTPATIENT, label: 'Outpatient' },
    { value: DepartmentType.INPATIENT, label: 'Inpatient' },
    { value: DepartmentType.RADIOLOGY, label: 'Radiology' },
    { value: DepartmentType.LABORATORY, label: 'Laboratory' },
    { value: DepartmentType.PHARMACY, label: 'Pharmacy' },
    { value: DepartmentType.PHYSICAL_THERAPY, label: 'Physical Therapy' },
    { value: DepartmentType.CARDIOLOGY, label: 'Cardiology' },
    { value: DepartmentType.ONCOLOGY, label: 'Oncology' },
    { value: DepartmentType.PEDIATRICS, label: 'Pediatrics' },
    { value: DepartmentType.OBSTETRICS, label: 'Obstetrics' },
    { value: DepartmentType.PSYCHIATRY, label: 'Psychiatry' },
    { value: DepartmentType.ADMINISTRATION, label: 'Administration' },
    { value: DepartmentType.SUPPORT_SERVICES, label: 'Support Services' },
  ];
  
  // Helper functions
  const resetForm = () => {
    setFormData({
      department_name: '',
      department_type: DepartmentType.OUTPATIENT,
      department_code: '',
      bed_count: null,
      treatment_room_count: null,
      building: '',
      floor: '',
      wing_section: '',
      accepts_walk_ins: true,
      requires_appointment: false,
      status: DepartmentStatus.ACTIVE
    });
  };
  
  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      department_name: department.department_name,
      department_type: department.department_type,
      department_code: department.department_code,
      bed_count: department.bed_count,
      treatment_room_count: department.treatment_room_count,
      building: department.building || '',
      floor: department.floor || '',
      wing_section: department.wing_section || '',
      accepts_walk_ins: department.accepts_walk_ins,
      requires_appointment: department.requires_appointment,
      status: department.status
    });
    setIsEditing(true);
    setIsCreating(false);
  };
  
  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedDepartment(null);
    resetForm();
  };
  
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedDepartment(null);
    resetForm();
  };
  
  const handleSubmit = () => {
    if (!activeFacilityId) return;
    
    const requestData: CreateDepartmentRequest | UpdateDepartmentRequest = {
      facility_id: activeFacilityId,
      department_name: formData.department_name,
      department_type: formData.department_type,
      department_code: formData.department_code || undefined,
      bed_count: formData.bed_count,
      treatment_room_count: formData.treatment_room_count,
      building: formData.building || null,
      floor: formData.floor || null,
      wing_section: formData.wing_section || null,
      accepts_walk_ins: formData.accepts_walk_ins,
      requires_appointment: formData.requires_appointment,
      status: formData.status,
    };
    
    if (isEditing && selectedDepartment) {
      updateMutation.mutate({
        uuid: selectedDepartment.department_uuid,
        data: requestData as UpdateDepartmentRequest
      });
    } else {
      createMutation.mutate(requestData as CreateDepartmentRequest);
    }
  };
  
  const { confirm } = useConfirm();

  const handleDelete = async (department: Department) => {
    const confirmed = await confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete "${department.department_name}"? This action can be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    deleteMutation.mutate({ uuid: department.department_uuid });
  };
  
  const handleRestore = (department: Department) => {
    restoreMutation.mutate({ uuid: department.department_uuid });
  };
  
  const toggleExpand = (departmentUuid: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentUuid)) {
      newExpanded.delete(departmentUuid);
    } else {
      newExpanded.add(departmentUuid);
    }
    setExpandedDepartments(newExpanded);
  };
  
  const getStatusColor = (status: DepartmentStatus) => {
    switch (status) {
      case DepartmentStatus.ACTIVE:
        return isDark ? 'text-green-400' : 'text-green-600';
      case DepartmentStatus.INACTIVE:
        return isDark ? 'text-red-400' : 'text-red-600';
      case DepartmentStatus.TEMPORARILY_CLOSED:
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  const getStatusBgColor = (status: DepartmentStatus) => {
    switch (status) {
      case DepartmentStatus.ACTIVE:
        return isDark ? 'bg-green-900/30' : 'bg-green-50';
      case DepartmentStatus.INACTIVE:
        return isDark ? 'bg-red-900/30' : 'bg-red-50';
      case DepartmentStatus.TEMPORARILY_CLOSED:
        return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
      default:
        return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
    }
  };
  
  if (!activeFacilityId) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
        <Building2 className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className="text-lg font-medium mb-2">No Facility Selected</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility from the sidebar to manage departments.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clinical Departments</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure the internal structure of your healthcare facility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Department
          </button>
        </div>
      </div>
      
      {/* Stats Overview - Enhanced with gradients, icons, and better visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Departments Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                'text-sm font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>Total Departments</p>
              <p className={cn(
                'text-3xl font-bold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>{departments.length}</p>
              
              <div className="flex items-center gap-1 mt-2">
                <ChevronUp className={cn(
                  'w-4 h-4',
                  isDark ? 'text-green-400' : 'text-green-600'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  +{departments.length > 0 ? Math.floor(departments.length * 0.15) : 0}% this month
                </span>
              </div>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            )}>
              <Building2 className={cn(
                'w-8 h-8',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-300'
            )}>
              Out Patient: {departments.filter(d => d.department_type === DepartmentType.OUTPATIENT).length}
            </span>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-300'
            )}>
              Support Services: {departments.filter(d => d.department_type === DepartmentType.SUPPORT_SERVICES).length}
            </span>
          </div>
        </div>

        {/* Active Departments Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20' 
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                'text-sm font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>Active Departments</p>
              <p className={cn(
                'text-3xl font-bold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {departments.filter(d => d.status === DepartmentStatus.ACTIVE).length}
              </p>
              
              <div className="mt-2">
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                  isDark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-300'
                )}>
                  <CheckCircle2 className="w-3 h-3" />
                  Operational
                </span>
              </div>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110' 
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            )}>
              <Users className={cn(
                'w-8 h-8',
                isDark ? 'text-green-400' : 'text-green-600'
              )} />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Activation Rate</span>
              <span className={cn(
                'font-medium',
                isDark ? 'text-green-400' : 'text-green-600'
              )}>
                {departments.length > 0 
                  ? Math.round((departments.filter(d => d.status === DepartmentStatus.ACTIVE).length / departments.length) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${departments.length > 0 
                    ? (departments.filter(d => d.status === DepartmentStatus.ACTIVE).length / departments.length) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Total Beds Card */}
        <div className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
          'border-2',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20' 
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
          'group cursor-pointer transform hover:-translate-y-1'
        )}>
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                'text-sm font-medium mb-1',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>Total Beds</p>
              <p className={cn(
                'text-3xl font-bold',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {departments.reduce((sum, d) => sum + (d.bed_count || 0), 0)}
              </p>
              
              <p className={cn(
                'text-xs mt-2',
                isDark ? 'text-gray-500' : 'text-gray-500'
              )}>
                Avg. {departments.length > 0 
                  ? Math.round(departments.reduce((sum, d) => sum + (d.bed_count || 0), 0) / departments.length) 
                  : 0} beds/dept
              </p>
            </div>
            
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110' 
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            )}>
              <DoorOpen className={cn(
                'w-8 h-8',
                isDark ? 'text-purple-400' : 'text-purple-600'
              )} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Max Capacity</span>
                <span className={cn(
                  'font-medium',
                  isDark ? 'text-purple-400' : 'text-purple-600'
                )}>
                  {departments.reduce((sum, d) => sum + (d.bed_count || 0), 0)} beds
                </span>
              </div>
              <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
                <div className="h-full w-full bg-purple-500 rounded-full" />
              </div>
            </div>
            
            {departments.length > 0 && (
              <div className={cn(
                'text-xs px-2 py-1 rounded-full',
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              )}>
                Top: {Math.max(...departments.map(d => d.bed_count || 0))} beds
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Filters and Search - Redesigned with animated search bar */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
          {/* Search bar with animated gradient border */}
          <div className="relative flex-1 min-w-0">
            <motion.div
              className="absolute inset-0 rounded-lg z-0"
              style={{
                background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                duration: isFocused ? 2 : 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                isFocused 
                  ? 'text-blue-500' 
                  : isDark 
                    ? 'text-gray-500' 
                    : 'text-gray-400'
              }`} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search departments by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full pl-10 pr-10 py-2.5 text-sm border-transparent focus:outline-none focus:ring-0 transition-colors placeholder:text-sm ${
                  isDark 
                    ? 'bg-gray-900 text-white placeholder-gray-500' 
                    : 'bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DepartmentType | 'all')}
              className={`px-3 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Types</option>
              {departmentTypeOptions.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DepartmentStatus | 'all')}
              className={`px-3 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Status</option>
              <option value={DepartmentStatus.ACTIVE}>Active</option>
              <option value={DepartmentStatus.INACTIVE}>Inactive</option>
              <option value={DepartmentStatus.TEMPORARILY_CLOSED}>Temporarily Closed</option>
            </select>

            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                showDeleted
                  ? isDark 
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                    : 'bg-blue-50 text-blue-700 border border-blue-300'
                  : isDark 
                    ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {showDeleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </button>
          </div>
        </div>

        {/* Filter stats */}
        <div className={`px-3 sm:px-4 pb-3 flex flex-wrap items-center gap-2 ${
          isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'
        }`}>
          <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {filteredDepartments.length} departments found
          </span>
          {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || showDeleted) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setStatusFilter('all');
                setShowDeleted(false);
              }}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${
                isDark 
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      
      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">
            {isEditing ? 'Edit Department' : 'Create New Department'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department Name *
              </label>
              <input
                type="text"
                value={formData.department_name}
                onChange={(e) => setFormData({...formData, department_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Emergency Department"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department Code
              </label>
              <input
                type="text"
                value={formData.department_code}
                onChange={(e) => setFormData({...formData, department_code: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., EMERG"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Department Type *
              </label>
              <select
                value={formData.department_type}
                onChange={(e) => setFormData({...formData, department_type: e.target.value as DepartmentType})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {departmentTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as DepartmentStatus})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value={DepartmentStatus.ACTIVE}>Active</option>
                <option value={DepartmentStatus.INACTIVE}>Inactive</option>
                <option value={DepartmentStatus.TEMPORARILY_CLOSED}>Temporarily Closed</option>
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Bed Count
              </label>
              <input
                type="number"
                value={formData.bed_count || ''}
                onChange={(e) => setFormData({...formData, bed_count: e.target.value ? parseInt(e.target.value) : null})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., 50"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Treatment Rooms
              </label>
              <input
                type="number"
                value={formData.treatment_room_count || ''}
                onChange={(e) => setFormData({...formData, treatment_room_count: e.target.value ? parseInt(e.target.value) : null})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., 10"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Building
              </label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => setFormData({...formData, building: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., Main Building"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Floor
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({...formData, floor: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., 3rd Floor"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.accepts_walk_ins}
                  onChange={(e) => setFormData({...formData, accepts_walk_ins: e.target.checked})}
                  className={`rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Accepts Walk-ins
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_appointment}
                  onChange={(e) => setFormData({...formData, requires_appointment: e.target.checked})}
                  className={`rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  Requires Appointment
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.department_name}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : isEditing ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </div>
      )}
      
      {/* Departments List */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Table Header */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="grid grid-cols-12 gap-4 text-sm font-medium">
            <div className="col-span-4">Department</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Capacity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center">
            <RefreshCw className={`w-8 h-8 animate-spin mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading departments...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="p-8 text-center">
            <AlertCircle className={`w-8 h-8 mx-auto ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Error loading departments: {error.message}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && filteredDepartments.length === 0 && (
          <div className="p-8 text-center">
            <Building2 className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="mt-4 text-lg font-medium">No departments found</h3>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first department to get started'}
            </p>
          </div>
        )}
        
        {/* Departments List */}
        {!isLoading && !error && filteredDepartments.length > 0 && (
          <div>
            {filteredDepartments.map((department) => (
              <div
                key={department.department_uuid}
                className={`p-4 border-b last:border-b-0 ${
                  isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                } transition-colors`}
              >
                {/* Main Row */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(department.department_uuid)}
                        className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {expandedDepartments.has(department.department_uuid) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="font-medium">{department.department_name}</div>
                        {department.department_code && (
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {department.department_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {department.department_type_label}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(department.status)} ${getStatusColor(department.status)}`}>
                      {department.status_label}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" />
                      <span>{department.bed_count || 0} beds</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(department)}
                        className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {department.deleted_at ? (
                        <button
                          onClick={() => handleRestore(department)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-green-400 hover:text-green-300' : 'hover:bg-gray-200 text-green-600 hover:text-green-700'}`}
                          title="Restore"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(department)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-600 hover:text-red-700'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedDepartments.has(department.department_uuid) && (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Location</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              {department.building || 'Not specified'}
                              {department.floor && `, ${department.floor}`}
                              {department.wing_section && `, ${department.wing_section}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Operations</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              {department.formatted_operating_hours || '24/7'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {department.accepts_walk_ins ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Accepts walk-ins
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Capacity Details</h4>
                        <div className="space-y-1">
                          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Beds: {department.bed_count || 0}
                          </div>
                          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Treatment Rooms: {department.treatment_room_count || 0}
                          </div>
                          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Max Capacity: {department.max_concurrent_capacity || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {department.child_departments && department.child_departments.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Sub-departments</h4>
                        <div className="flex flex-wrap gap-2">
                          {department.child_departments.map(child => (
                            <span
                              key={child.department_uuid}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {child.department_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {department.department_head && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Department Head</h4>
                        <div className={`flex items-center gap-2 p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <Users className="w-4 h-4" />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {department.department_head.professional_title || 'Staff'} - {department.department_head.employee_id}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Showing {filteredDepartments.length} of {departments.length} departments
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
    </div>
  );
};

export default AdminFacilitySetup;