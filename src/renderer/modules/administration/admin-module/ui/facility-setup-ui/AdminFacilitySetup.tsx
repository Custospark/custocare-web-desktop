import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import {
  useCreateDepartment,
  useDeleteDepartment,
  useGetDepartmentsByFacility,
  useRestoreDepartment,
  useUpdateDepartment,
  departmentKeys,
} from '../../../../administration/admin-module/api/department-managment/useDepartmentQueries';
import type {
  CreateDepartmentRequest,
  Department,
  UpdateDepartmentRequest,
} from '../../../../administration/admin-module/api/department-managment/departmentTypes';
import {
  DepartmentStatus,
  DepartmentType,
} from '../../../../administration/admin-module/api/department-managment/departmentTypes';

import DepartmentPageHeader from './department-components/DepartmentPageHeader';
import DepartmentStatsOverview from './department-components/DepartmentStatsOverview';
import DepartmentFiltersBar from './department-components/DepartmentFiltersBar';
import DepartmentFormDrawer, {
  type DepartmentFormData,
} from './department-components/DepartmentFormDrawer';
import DepartmentList from './department-components/DepartmentList';
import { usePlanEntitlements } from '../../../../../shared/entitlements/usePlanEntitlements';

interface AdminFacilitySetupProps {
  theme: 'light' | 'dark';
}

/**
 * Generate a unique department code
 * Format: DPT-XXXX where XXXX is a random 4-digit number
 * Example: DPT-1234, DPT-5678, DPT-9012
 */
const generateDepartmentCode = (): string => {
  // Generate random number between 1 and 9999
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  // Pad with leading zeros to 4 digits
  const paddedNum = randomNum.toString().padStart(4, '0');
  return `DPT-${paddedNum}`;
};
const getInitialFormData = (): DepartmentFormData => ({
  department_name: "",
  department_type: DepartmentType.OUTPATIENT,
  department_code: generateDepartmentCode(),
  bed_count: null,
  treatment_room_count: null,
  building: '',
  floor: '',
  wing_section: '',
  accepts_walk_ins: true,
  requires_appointment: false,
  status: DepartmentStatus.ACTIVE,
});

export const AdminFacilitySetup: React.FC<AdminFacilitySetupProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const activeContext = useAppSelector((state) => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DepartmentType | 'all'>('all');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState<DepartmentFormData>(getInitialFormData());
  const [isRefreshAnimating, setIsRefreshAnimating] = useState(false);

  const {
    departmentLimitReached,
    usage: facilityUsage,
    limits: facilityLimits,
  } = usePlanEntitlements();

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

  const {
    data: departmentsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetDepartmentsByFacility(
    activeFacilityId || 0,
    {
      status: showDeleted ? undefined : DepartmentStatus.ACTIVE,
    },
    {
      enabled: !!activeFacilityId,
      staleTime: 1000 * 60,
    }
  );

  const departments = departmentsResponse?.data || [];

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const name = dept.department_name?.toLowerCase() || '';
      const code = dept.department_code?.toLowerCase() || '';
      const normalizedSearch = searchTerm.toLowerCase();

      const matchesSearch =
        name.includes(normalizedSearch) || code.includes(normalizedSearch);
      const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
      const matchesType = typeFilter === 'all' || dept.department_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [departments, searchTerm, statusFilter, typeFilter]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    showDeleted;

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDepartment(null);
    resetForm();
  };

  const createMutation = useCreateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      closeDrawer();
    },
  });

  const updateMutation = useUpdateDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      closeDrawer();
    },
  });

  const deleteMutation = useDeleteDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      setSelectedDepartment(null);
    },
  });

  const restoreMutation = useRestoreDepartment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });

  const handleCreate = () => {
    setDrawerMode('create');
    setSelectedDepartment(null);
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleEdit = (department: Department) => {
    setDrawerMode('edit');
    setSelectedDepartment(department);
    setFormData({
      department_name: department.department_name,
      department_type: department.department_type,
      department_code: department.department_code || '',
      bed_count: department.bed_count,
      treatment_room_count: department.treatment_room_count,
      building: department.building || '',
      floor: department.floor || '',
      wing_section: department.wing_section || '',
      accepts_walk_ins: department.accepts_walk_ins,
      requires_appointment: department.requires_appointment,
      status: department.status,
    });
    setIsDrawerOpen(true);
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

    if (drawerMode === 'edit' && selectedDepartment) {
      updateMutation.mutate({
        uuid: selectedDepartment.department_uuid,
        data: requestData as UpdateDepartmentRequest,
      });
      return;
    }

    createMutation.mutate(requestData as CreateDepartmentRequest);
  };

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
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentUuid)) {
        next.delete(departmentUuid);
      } else {
        next.add(departmentUuid);
      }
      return next;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshAnimating(true);
    try {
      await refetch();
    } finally {
      window.setTimeout(() => {
        setIsRefreshAnimating(false);
      }, 600);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setShowDeleted(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isCreating = drawerMode === 'create';
  const canSubmit = Boolean(formData.department_name.trim()) && (!isCreating || !departmentLimitReached);

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
    <>
      <div className="space-y-6">
        <DepartmentPageHeader
          theme={theme}
          isRefreshing={isFetching || isRefreshAnimating}
          onRefresh={handleRefresh}
          onCreate={handleCreate}
        />

        <DepartmentStatsOverview theme={theme} departments={departments} />

        <DepartmentFiltersBar
          theme={theme}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          showDeleted={showDeleted}
          filteredCount={filteredDepartments.length}
          departmentTypeOptions={departmentTypeOptions}
          onSearchTermChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
          onToggleShowDeleted={() => setShowDeleted((prev) => !prev)}
          onClearFilters={handleClearFilters}
        />

        <DepartmentList
          theme={theme}
          filteredDepartments={filteredDepartments}
          expandedDepartments={expandedDepartments}
          isLoading={isLoading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          onRetry={handleRefresh}
          onToggleExpand={toggleExpand}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />

        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredDepartments.length} of {departments.length} departments
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      <DepartmentFormDrawer
        theme={theme}
        mode={drawerMode}
        open={isDrawerOpen}
        formData={formData}
        departmentTypeOptions={departmentTypeOptions}
        onChange={setFormData}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        departmentLimitReached={isCreating ? departmentLimitReached : false}
        departmentLimit={facilityLimits?.max_departments ?? null}
        departmentCount={facilityUsage?.departments ?? 0}
      />
    </>
  );
};

export default AdminFacilitySetup;
