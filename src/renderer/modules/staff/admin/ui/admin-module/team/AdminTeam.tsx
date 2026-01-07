import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import {
  Users,
  UserPlus,
  Mail,
  Search,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building2,
  Briefcase,
  Shield,
} from 'lucide-react';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// API Hooks
import {
  useGetStaff,
  useCreateStaff,
  staffKeys,
} from  '../../../api/team/queries/useStaffQueries';
import {
  useGetStaffInvitations,
  useCreateStaffInvitation,
  useResendInvitation,
  useCancelInvitation,
  useBatchResendInvitations,
  useBatchCancelInvitations,
  staffInvitationKeys,
}  from '../../../api/team/queries/useStaffInvitationQueries';
import { useGetFacilityRoles } from '../../../api/team/queries/useFacilityRoleQueries';
import { useGetModules } from '../../../api/team/queries/useModuleQueries';
import { useGetDepartmentsByFacility } from '../../../api/department/useDepartmentQueries'; 
// Types
import type {
  Staff,
  CreateStaffRequest,
  StaffFilters,
} from '../../../../admin/api/team/types/staffTypes';

import {
  EmploymentType,
  EmploymentStatus,
  GlobalRoleLevel,
} from '../../../../admin/api/team/types/staffTypes';
import type {
  CreateStaffInvitationRequest,
  InvitationStatus,
} from '../../../../admin/api/team/types/staffInvitationTypes';


interface AdminTeamProps {
  theme: 'light' | 'dark';
}

/* ============================================================================
   COMPONENT 1: INVITATION STATS DASHBOARD
   Overview statistics for invitations
============================================================================ */

interface InvitationStatsDashboardProps {
  theme: 'light' | 'dark';
  facilityId: number;
}

const InvitationStatsDashboard: React.FC<InvitationStatsDashboardProps> = ({
  theme,
  facilityId,
}) => {
  const isDark = theme === 'dark';

  const { data: invitationsData } = useGetStaffInvitations(
    { facility_id: facilityId },
    { staleTime: 1000 * 30 }
  );

  const invitations = invitationsData?.data || [];

  const stats = {
    total: invitations.length,
    pending: invitations.filter((inv) => inv.status === 'pending').length,
    accepted: invitations.filter((inv) => inv.status === 'accepted').length,
    declined: invitations.filter((inv) => inv.status === 'declined').length,
    expired: invitations.filter((inv) => inv.status === 'expired').length,
  };

  const statCards = [
    {
      label: 'Total Invitations',
      value: stats.total,
      icon: Mail,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: isDark ? 'text-yellow-400' : 'text-yellow-600',
      bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      icon: CheckCircle,
      color: isDark ? 'text-green-400' : 'text-green-600',
      bg: isDark ? 'bg-green-900/30' : 'bg-green-50',
    },
    {
      label: 'Declined',
      value: stats.declined,
      icon: XCircle,
      color: isDark ? 'text-red-400' : 'text-red-600',
      bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`rounded-xl p-4 border ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================================
   COMPONENT 2: STAFF SEARCH PANEL
   Search and filter existing staff members
============================================================================ */

interface StaffSearchPanelProps {
  theme: 'light' | 'dark';
  facilityId: number;
  onSelectStaff: (staff: Staff) => void;
  onCreateNew: () => void;
}

const StaffSearchPanel: React.FC<StaffSearchPanelProps> = ({
  theme,
  facilityId,
  onSelectStaff,
  onCreateNew,
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>('all');

  const filters: StaffFilters = {
    facility_id: facilityId,
    search: searchTerm || undefined,
    employment_status: statusFilter !== 'all' ? statusFilter : undefined,
    per_page: 50,
  };

  const { data: staffData, isLoading, error } = useGetStaff(filters);
  const staff = staffData?.data || [];

 const term = searchTerm.toLowerCase();

    const filteredStaff = staff.filter((s) => {
      const fullName = s.user?.full_name?.toLowerCase() ?? '';
      const employeeId = s.employee_id?.toLowerCase() ?? '';

      return (
        fullName.includes(term) ||
        employeeId.includes(term)
      );
    });


  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Staff
        </h3>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create New Staff
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmploymentStatus | 'all')}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="employed">Employed</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <RefreshCw
              className={`w-8 h-8 animate-spin mx-auto ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            />
            <p
              className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Loading staff...
            </p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <AlertCircle
              className={`w-8 h-8 mx-auto ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}
            />
            <p
              className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Error loading staff
            </p>
          </div>
        )}

        {!isLoading && !error && filteredStaff.length === 0 && (
          <div className="py-8 text-center">
            <Users
              className={`w-12 h-12 mx-auto ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            />
            <h3 className="mt-4 text-lg font-medium">No staff found</h3>
            <p
              className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {searchTerm
                ? 'Try adjusting your search'
                : 'Create your first staff member to get started'}
            </p>
          </div>
        )}

        {!isLoading && !error && filteredStaff.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStaff.map((staffMember) => (
              <button
                key={staffMember.id}
                onClick={() => onSelectStaff(staffMember)}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                        }`}
                      >
                        <Users
                          className={`w-4 h-4 ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">
                          {staffMember.professional_title}{' '}
                          {staffMember.user?.full_name}
                        </p>
                        <p
                          className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {staffMember.employee_id} •{' '}
                          {staffMember.global_role_level.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staffMember.employment_status === 'employed'
                        ? isDark
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-green-100 text-green-800'
                        : isDark
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {staffMember.employment_status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   COMPONENT 3: STAFF CREATION FORM
   Create new staff accounts
============================================================================ */

interface StaffCreationFormProps {
  theme: 'light' | 'dark';
  facilityId: number;
  onSuccess: (staff: Staff) => void;
  onCancel: () => void;
}

interface StaffFormData {
  user_id: number;
  employee_id: string;
  global_role_level: GlobalRoleLevel;
  professional_title: string;
  employment_type: EmploymentType;
}

const StaffCreationForm: React.FC<StaffCreationFormProps> = ({
  theme,
  facilityId,
  onSuccess,
  onCancel,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<StaffFormData>({
    user_id: 0,
    employee_id: '',
    global_role_level: GlobalRoleLevel.REGISTERED_NURSE,
    professional_title: '',
    employment_type: EmploymentType.FULL_TIME,
  });

  const createMutation = useCreateStaff({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      onSuccess(data.data);
    },
  });

  const handleSubmit = () => {
    const requestData: CreateStaffRequest = {
      user_id: formData.user_id,
      employee_id: formData.employee_id,
      global_role_level: formData.global_role_level,
      professional_title: formData.professional_title || undefined,
      employment_type: formData.employment_type,
      employment_status: EmploymentStatus.EMPLOYED,
      accessible_facility_ids: [facilityId],
    };

    createMutation.mutate(requestData);
  };

  const globalRoleLevels = [
    { value: GlobalRoleLevel.ATTENDING_PHYSICIAN, label: 'Attending Physician' },
    { value: GlobalRoleLevel.FELLOW, label: 'Fellow' },
    { value: GlobalRoleLevel.RESIDENT, label: 'Resident' },
    { value: GlobalRoleLevel.NURSE_PRACTITIONER, label: 'Nurse Practitioner' },
    { value: GlobalRoleLevel.PHYSICIAN_ASSISTANT, label: 'Physician Assistant' },
    { value: GlobalRoleLevel.REGISTERED_NURSE, label: 'Registered Nurse' },
    { value: GlobalRoleLevel.LICENSED_PRACTICAL_NURSE, label: 'Licensed Practical Nurse' },
    { value: GlobalRoleLevel.PHARMACIST, label: 'Pharmacist' },
    { value: GlobalRoleLevel.THERAPIST, label: 'Therapist' },
    { value: GlobalRoleLevel.TECHNICIAN, label: 'Technician' },
    { value: GlobalRoleLevel.SUPPORT_STAFF, label: 'Support Staff' },
  ];

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Create New Staff Account
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              User ID *
            </label>
            <input
              type="number"
              value={formData.user_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, user_id: parseInt(e.target.value) || 0 })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Employee ID *
            </label>
            <input
              type="text"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="e.g., EMP001"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Global Role Level *
            </label>
            <select
              value={formData.global_role_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  global_role_level: e.target.value as GlobalRoleLevel,
                })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {globalRoleLevels.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Professional Title
            </label>
            <input
              type="text"
              value={formData.professional_title}
              onChange={(e) =>
                setFormData({ ...formData, professional_title: e.target.value })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="e.g., Dr., RN"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Employment Type *
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employment_type: e.target.value as EmploymentType,
                })
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value={EmploymentType.FULL_TIME}>Full Time</option>
              <option value={EmploymentType.PART_TIME}>Part Time</option>
              <option value={EmploymentType.CONTRACT}>Contract</option>
              <option value={EmploymentType.LOCUM_TENENS}>Locum Tenens</option>
              <option value={EmploymentType.VOLUNTEER}>Volunteer</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}">
          <button
            onClick={onCancel}
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
            disabled={
              createMutation.isPending ||
              !formData.user_id ||
              !formData.employee_id
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Staff'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   COMPONENT 4: INVITATION CREATION WIZARD
   Multi-step wizard for creating staff invitations
============================================================================ */

interface InvitationCreationWizardProps {
  theme: 'light' | 'dark';
  facilityId: number;
  preselectedStaff?: Staff | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const InvitationCreationWizard: React.FC<InvitationCreationWizardProps> = ({
  theme,
  facilityId,
  preselectedStaff,
  onSuccess,
  onCancel,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(
    preselectedStaff || null
  );
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('');
  const [selectedModuleCodes, setSelectedModuleCodes] = useState<string[]>([]);

  const { data: departmentsData } = useGetDepartmentsByFacility(facilityId);
  const { data: rolesData } = useGetFacilityRoles();
  const { data: modulesData } = useGetModules();

  const departments = departmentsData?.data || [];
  const roles = rolesData?.data || [];
  const modules = modulesData?.data || [];

  const createMutation = useCreateStaffInvitation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      onSuccess();
    },
  });

  const handleSubmit = () => {
    if (!selectedStaff || !selectedRoleCode) return;

    const requestData: CreateStaffInvitationRequest = {
      staff_id: selectedStaff.id,
      facility_id: facilityId,
      role_code: selectedRoleCode,
      department_id: selectedDepartmentId,
      module_code: selectedModuleCodes.length > 0 ? selectedModuleCodes : undefined,
    };

    createMutation.mutate(requestData);
  };

  const toggleModule = (moduleCode: string) => {
    setSelectedModuleCodes((prev) =>
      prev.includes(moduleCode)
        ? prev.filter((code) => code !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  const canProceed = () => {
    if (step === 1) return selectedStaff !== null;
    if (step === 2) return true; // Department is optional
    if (step === 3) return selectedRoleCode !== '';
    return false;
  };

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Create Staff Invitation
        </h3>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? isDark
                      ? 'bg-green-900/30 text-green-300'
                      : 'bg-green-100 text-green-800'
                    : isDark
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded ${
                    s < step
                      ? 'bg-blue-600'
                      : isDark
                      ? 'bg-gray-800'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {step === 1 && (
          <div>
            <h4 className="font-medium mb-3">Step 1: Select Staff Member</h4>
            {selectedStaff ? (
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedStaff.professional_title}{' '}
                      {selectedStaff.user?.full_name}
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {selectedStaff.employee_id}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className={`p-2 rounded-lg ${
                      isDark
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Use the search panel to select a staff member
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 className="font-medium mb-3">
              Step 2: Select Department (Optional)
            </h4>
            <select
              value={selectedDepartmentId || ''}
              onChange={(e) =>
                setSelectedDepartmentId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className={`w-full px-3 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">No Department (Facility-wide)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 3 && (
          <div>
            <h4 className="font-medium mb-3">Step 3: Assign Role & Modules</h4>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Facility Role *
                </label>
                <select
                  value={selectedRoleCode}
                  onChange={(e) => setSelectedRoleCode(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Module Access (Optional)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {modules
                    .filter((m) => m.is_active)
                    .map((module) => (
                      <label
                        key={module.code}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedModuleCodes.includes(module.code)
                            ? isDark
                              ? 'bg-blue-900/30 border-blue-700'
                              : 'bg-blue-50 border-blue-300'
                            : isDark
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModuleCodes.includes(module.code)}
                          onChange={() => toggleModule(module.code)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{module.name}</p>
                          {module.description && (
                            <p
                              className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              {module.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`flex justify-between mt-6 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={() => {
            if (step === 1) {
              onCancel();
            } else {
              setStep(step - 1);
            }
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || !canProceed()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Invitation'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   COMPONENT 5: INVITATION MANAGEMENT LIST
   View, filter, resend, and cancel invitations
============================================================================ */

interface InvitationManagementListProps {
  theme: 'light' | 'dark';
  facilityId: number;
}

const InvitationManagementList: React.FC<InvitationManagementListProps> = ({
  theme,
  facilityId,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: invitationsData, isLoading, refetch } = useGetStaffInvitations({
    facility_id: facilityId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const invitations = invitationsData?.data || [];

  const resendMutation = useResendInvitation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
    },
  });

  const cancelMutation = useCancelInvitation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
    },
  });

  const batchResendMutation = useBatchResendInvitations({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      setSelectedIds([]);
    },
  });

  const batchCancelMutation = useBatchCancelInvitations({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffInvitationKeys.all });
      setSelectedIds([]);
    },
  });

  const handleResend = async (id: number) => {
    const confirmed = await confirm({
      title: 'Resend Invitation',
      message: 'Are you sure you want to resend this invitation?',
      confirmText: 'Resend',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (confirmed) {
      resendMutation.mutate({ id });
    }
  };

  const handleCancel = async (id: number) => {
    const confirmed = await confirm({
      title: 'Cancel Invitation',
      message: 'Are you sure you want to cancel this invitation?',
      confirmText: 'Cancel Invitation',
      cancelText: 'Keep Invitation',
      variant: 'danger',
      theme,
    });

    if (confirmed) {
      cancelMutation.mutate({ id });
    }
  };

  const handleBatchResend = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: 'Batch Resend',
      message: `Resend ${selectedIds.length} invitation(s)?`,
      confirmText: 'Resend All',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (confirmed) {
      batchResendMutation.mutate({ invitation_ids: selectedIds });
    }
  };

  const handleBatchCancel = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirm({
      title: 'Batch Cancel',
      message: `Cancel ${selectedIds.length} invitation(s)?`,
      confirmText: 'Cancel All',
      cancelText: 'Keep',
      variant: 'danger',
      theme,
    });

    if (confirmed) {
      batchCancelMutation.mutate({ invitation_ids: selectedIds });
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === invitations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invitations.map((inv) => inv.id));
    }
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return isDark
          ? 'bg-yellow-900/30 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return isDark
          ? 'bg-green-900/30 text-green-300'
          : 'bg-green-100 text-green-800';
      case 'declined':
        return isDark
          ? 'bg-red-900/30 text-red-300'
          : 'bg-red-100 text-red-800';
      case 'expired':
        return isDark
          ? 'bg-gray-800 text-gray-400'
          : 'bg-gray-200 text-gray-600';
      default:
        return '';
    }
  };

  return (
    <div
      className={`rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitation Management
          </h3>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'all')}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleBatchResend}
                disabled={batchResendMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                Resend
              </button>
              <button
                onClick={handleBatchCancel}
                disabled={batchCancelMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="p-8 text-center">
          <RefreshCw
            className={`w-8 h-8 animate-spin mx-auto ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}
          />
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading invitations...
          </p>
        </div>
      )}

      {!isLoading && invitations.length === 0 && (
        <div className="p-8 text-center">
          <Mail
            className={`w-12 h-12 mx-auto ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}
          />
          <h3 className="mt-4 text-lg font-medium">No invitations found</h3>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first invitation to get started'}
          </p>
        </div>
      )}

      {!isLoading && invitations.length > 0 && (
        <div>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === invitations.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Select All</span>
            </label>
          </div>

          <div>
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`p-4 border-b last:border-b-0 ${
                  isDark ? 'border-gray-800' : 'border-gray-200'
                } ${
                  selectedIds.includes(invitation.id)
                    ? isDark
                      ? 'bg-gray-800/50'
                      : 'bg-gray-50'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(invitation.id)}
                    onChange={() => toggleSelection(invitation.id)}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {invitation.staff?.professional_title || ''}{' '}
                            {invitation.staff?.employee_id}
                          </p>
                          <p
                            className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {invitation.facility?.facility_name}
                            {invitation.department && ` • ${invitation.department.department_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            invitation.status
                          )}`}
                        >
                          {invitation.status}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === invitation.id ? null : invitation.id)
                          }
                          className={`p-1 rounded ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {expandedId === invitation.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedId === invitation.id && (
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Role</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {invitation.role?.name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Modules</p>
                            <div className="flex flex-wrap gap-1">
                              {invitation.modules && invitation.modules.length > 0 ? (
                                invitation.modules.map((mod) => (
                                  <span
                                    key={mod.code}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                      isDark
                                        ? 'bg-gray-800 text-gray-300'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {mod.name}
                                  </span>
                                ))
                              ) : (
                                <span
                                  className={`text-sm ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  No modules assigned
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Sent At</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {invitation.sent_at
                                ? new Date(invitation.sent_at).toLocaleString()
                                : 'Not sent'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Expires</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {invitation.expires_at
                                ? new Date(invitation.expires_at).toLocaleString()
                                : 'No expiry'}
                            </p>
                          </div>
                        </div>

                        {invitation.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendMutation.isPending}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                              Resend
                            </button>
                            <button
                              onClick={() => handleCancel(invitation.id)}
                              disabled={cancelMutation.isPending}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isDark
                                  ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              } disabled:opacity-50`}
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   COMPONENT 6: STAFF ASSIGNMENT CARD
   Quick view of staff member's current assignments
============================================================================ */

interface StaffAssignmentCardProps {
  theme: 'light' | 'dark';
  staff: Staff | null;
  onClose: () => void;
}

const StaffAssignmentCard: React.FC<StaffAssignmentCardProps> = ({
  theme,
  staff,
  onClose,
}) => {
  const isDark = theme === 'dark';

  if (!staff) return null;

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Staff Details
        </h3>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg ${
            isDark
              ? 'hover:bg-gray-800 text-gray-400'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <p className="font-medium text-lg">
                {staff.professional_title} {staff.user?.full_name}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {staff.employee_id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Global Role
              </p>
              <p className="font-medium">
                {staff.global_role_level.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Employment
              </p>
              <p className="font-medium">
                {staff.employment_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="font-medium mb-2">Employment Status</p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              staff.employment_status === 'employed'
                ? isDark
                  ? 'bg-green-900/30 text-green-300'
                  : 'bg-green-100 text-green-800'
                : isDark
                ? 'bg-red-900/30 text-red-300'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {staff.employment_status}
          </span>
        </div>

        {staff.accessible_facility_ids && staff.accessible_facility_ids.length > 0 && (
          <div>
            <p className="font-medium mb-2">Accessible Facilities</p>
            <div className="flex flex-wrap gap-2">
              {staff.accessible_facility_ids.map((facilityId) => (
                <span
                  key={facilityId}
                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                    isDark
                      ? 'bg-gray-800 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  Facility {facilityId}
                </span>
              ))}
            </div>
          </div>
        )}

        {staff.accessible_department_ids && staff.accessible_department_ids.length > 0 && (
          <div>
            <p className="font-medium mb-2">Accessible Departments</p>
            <div className="flex flex-wrap gap-2">
              {staff.accessible_department_ids.map((deptId) => (
                <span
                  key={deptId}
                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                    isDark
                      ? 'bg-gray-800 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  Department {deptId}
                </span>
              ))}
            </div>
          </div>
        )}

        {staff.can_prescribe && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <Shield className="w-4 h-4" />
              Authorized to prescribe medication
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   MAIN ADMIN TEAM COMPONENT
   Orchestrates all six sub-components
============================================================================ */

export const AdminTeam: React.FC<AdminTeamProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const activeContext = useAppSelector((state) => state.activeContext);
  const activeFacilityId = activeContext.activeFacilityId;

  // View state
  const [activeView, setActiveView] = useState<'overview' | 'create-staff' | 'create-invitation'>('overview');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const handleSelectStaff = (staff: Staff) => {
    setSelectedStaff(staff);
  };

  const handleCreateStaffSuccess = (staff: Staff) => {
    setSelectedStaff(staff);
    setActiveView('create-invitation');
  };

  const handleInvitationSuccess = () => {
    setActiveView('overview');
    setSelectedStaff(null);
  };

  if (!activeFacilityId) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Team Management</h1>
        <div
          className={`rounded-xl p-8 text-center ${
            isDark ? 'bg-gray-900/50' : 'bg-gray-50'
          }`}
        >
          <Building2
            className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}
          />
          <h3 className="text-lg font-medium mb-2">No Facility Selected</h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Please select a facility from the sidebar to manage staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Team Management</h1>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage staff accounts, invitations, and access roles.
        </p>
      </div>

      {/* Stats Dashboard */}
      <InvitationStatsDashboard theme={theme} facilityId={activeFacilityId} />

      {/* Main Content Area */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Search & Assignment */}
          <div className="lg:col-span-2 space-y-6">
            <StaffSearchPanel
              theme={theme}
              facilityId={activeFacilityId}
              onSelectStaff={handleSelectStaff}
              onCreateNew={() => setActiveView('create-staff')}
            />

            {selectedStaff && (
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveView('create-invitation')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Create Invitation for Selected Staff
                </button>
              </div>
            )}
          </div>

          {/* Right: Staff Details */}
          <div>
            <StaffAssignmentCard
              theme={theme}
              staff={selectedStaff}
              onClose={() => setSelectedStaff(null)}
            />
          </div>
        </div>
      )}

      {activeView === 'create-staff' && (
        <StaffCreationForm
          theme={theme}
          facilityId={activeFacilityId}
          onSuccess={handleCreateStaffSuccess}
          onCancel={() => setActiveView('overview')}
        />
      )}

      {activeView === 'create-invitation' && (
        <InvitationCreationWizard
          theme={theme}
          facilityId={activeFacilityId}
          preselectedStaff={selectedStaff}
          onSuccess={handleInvitationSuccess}
          onCancel={() => setActiveView('overview')}
        />
      )}

      {/* Invitation Management List - Always visible */}
      <InvitationManagementList theme={theme} facilityId={activeFacilityId} />
    </div>
  );
};

export default AdminTeam;
