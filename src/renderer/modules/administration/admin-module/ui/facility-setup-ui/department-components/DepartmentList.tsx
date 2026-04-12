import React from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DoorOpen,
  Edit2,
  MapPin,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Department } from '../../../../../administration/admin-module/api/department-managment/departmentTypes';
import { DepartmentStatus } from '../../../../../administration/admin-module/api/department-managment/departmentTypes';

interface DepartmentListProps {
  theme: 'light' | 'dark';
  filteredDepartments: Department[];
  expandedDepartments: Set<string>;
  isLoading: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  onRetry: () => void | Promise<void>;
  onToggleExpand: (departmentUuid: string) => void;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void | Promise<void>;
  onRestore: (department: Department) => void;
}

const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Unable to load departments. Please try again.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    const maybeError = error as Record<string, unknown>;

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message;
    }

    if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
      return maybeError.error;
    }

    if (typeof maybeError.statusText === 'string' && maybeError.statusText.trim()) {
      return maybeError.statusText;
    }
  }

  return 'Unable to load departments. Please try again.';
};

export const DepartmentList: React.FC<DepartmentListProps> = ({
  theme,
  filteredDepartments,
  expandedDepartments,
  isLoading,
  error,
  hasActiveFilters,
  onRetry,
  onToggleExpand,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const isDark = theme === 'dark';
  const hasError = Boolean(error);
  const errorMessage = getErrorMessage(error);

  const getStatusColor = (status: DepartmentStatus): string => {
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

  const getStatusBgColor = (status: DepartmentStatus): string => {
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

  const handleRetryClick = (): void => {
    void onRetry();
  };

  const handleDeleteClick = (department: Department): void => {
    void onDelete(department);
  };

  return (
    <div
      className={`rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} border ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}
    >
      <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="grid grid-cols-12 gap-4 text-sm font-medium">
          <div className="col-span-4">Department</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Capacity</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div
            className={`w-8 h-8 mx-auto border-2 border-t-transparent rounded-full animate-spin ${
              isDark ? 'border-gray-600' : 'border-gray-400'
            }`}
          />
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading departments...
          </p>
        </div>
      ) : hasError ? (
        <div className="p-8 text-center">
          <AlertCircle className={`w-8 h-8 mx-auto ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Error loading departments: {errorMessage}
          </p>
          <button
            onClick={handleRetryClick}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="p-8 text-center">
          <Building2 className={`w-12 h-12 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="mt-4 text-lg font-medium">No departments found</h3>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first department to get started'}
          </p>
        </div>
      ) : (
        <div>
          {filteredDepartments.map((department) => {
            const isExpanded = expandedDepartments.has(department.department_uuid);

            return (
              <div
                key={department.department_uuid}
                className={`p-4 border-b last:border-b-0 ${
                  isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
                } transition-colors`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleExpand(department.department_uuid)}
                        className={`p-1 ${
                          isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        } cursor-pointer`}
                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <div>
                        <div className="font-medium">{department.department_name}</div>
                        {department.department_code ? (
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {department.department_code}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {department.department_type_label}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(
                        department.status
                      )} ${getStatusColor(department.status)}`}
                    >
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
                        type="button"
                        onClick={() => onEdit(department)}
                        className={`p-2 rounded-lg ${
                          isDark
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                        } cursor-pointer`}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {department.deleted_at ? (
                        <button
                          type="button"
                          onClick={() => onRestore(department)}
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'hover:bg-gray-700 text-green-400 hover:text-green-300'
                              : 'hover:bg-gray-200 text-green-600 hover:text-green-700'
                          } cursor-pointer`}
                          title="Restore"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(department)}
                          className={`p-2 rounded-lg ${
                            isDark
                              ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                              : 'hover:bg-gray-200 text-red-600 hover:text-red-700'
                          } cursor-pointer`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded ? (
                  <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Location</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              {department.building || 'Not specified'}
                              {department.floor ? `, ${department.floor}` : ''}
                              {department.wing_section ? `, ${department.wing_section}` : ''}
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

                          <div className="flex items-center gap-2">
                            {department.requires_appointment ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-red-500" />
                            )}
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                              Requires appointment
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

                    {department.child_departments && department.child_departments.length > 0 ? (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Sub-departments</h4>
                        <div className="flex flex-wrap gap-2">
                          {department.child_departments.map((child) => (
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
                    ) : null}

                    {department.department_head ? (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Department Head</h4>
                        <div
                          className={`flex items-center gap-2 p-2 rounded ${
                            isDark ? 'bg-gray-800' : 'bg-gray-100'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {department.department_head.professional_title || 'Staff'} -{' '}
                            {department.department_head.employee_id}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
