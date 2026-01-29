/**
 * ============================================================================
 * STAFF INVITATION MANAGER COMPONENT
 * ============================================================================
 * 
 * Enhanced staff invitation management with proper hook usage, cursor states,
 * and comprehensive edge case handling.
 * 
 * @component InvitationManager
 * @description Production-grade invitation management with:
 * - Correct single vs batch operation hooks
 * - Proper cursor states for all interactive elements
 * - Disabled states during processing
 * - Status-aware actions with proper validation
 * - Full type safety and error handling
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Mail,
  Send,
  X,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Filter,
  Building2,
  UserPlus,
  Briefcase,
  Package,
  Calendar,
  ChevronDown,
  Key,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../../app/store/rootReducer';
import {
  useGetStaffInvitations,
  useCreateStaffInvitation,
  useResendInvitation,
  useCancelInvitation,
  useDeleteStaffInvitation,
  useBatchResendInvitations,
  useBatchCancelInvitations,
} from '../../api/team-management/queries/useStaffInvitationQueries';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { useGetStaff } from '../../api/team-management/queries/useStaffQueries';
import { useGetFacilityRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import { useGetModules } from '../../api/team-management/queries/useModuleQueries';
import { useGetDepartmentsByFacility } from '../../api/department-managment/useDepartmentQueries';
import { useGetFacilitySpecificRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import type { 
  InvitationStatus, 
  StaffInvitation,
  CreateStaffInvitationRequest 
} from '../../api/team-management/types/staffInvitationTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

/* -------------------------------------------------------------------------- */
/*                            TYPE DEFINITIONS                                */
/* -------------------------------------------------------------------------- */

interface InvitationManagerProps {
  theme: 'light' | 'dark';
  refreshKey?: number;
  facilityId: number;
  onInvitationSent: () => void;
}

interface CreateInvitationFormData {
  staff_id: number | null;
  staff_uuid: string;
  department_id: number | null;
  role_code: string;
  module_codes: string[];
}

interface BatchActionConfig {
  canResend: boolean;
  canCancel: boolean;
  canDelete: boolean;
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/*                         UTILITY FUNCTIONS                                  */
/* -------------------------------------------------------------------------- */

function maskEmail(email?: string | null): string {
  if (!email) return 'Not specified';

  const [name, domain] = email.split('@');
  if (!domain) return 'Not specified';

  const maskedName =
    name.length <= 2
      ? name[0] + '*'
      : name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];

  const domainParts = domain.split('.');
  const maskedDomain =
    domainParts[0][0] + '***.' + domainParts.slice(1).join('.');

  return `${maskedName}@${maskedDomain}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return 'Not specified';

  const visibleDigits = 3;
  const cleaned = phone.replace(/\s+/g, '');

  if (cleaned.length <= visibleDigits) return cleaned;

  const maskedPart = '*'.repeat(cleaned.length - visibleDigits);
  const visiblePart = cleaned.slice(-visibleDigits);

  return maskedPart + visiblePart;
}

function getBatchActionConfig(
  selectedInvitations: StaffInvitation[]
): BatchActionConfig {
  if (selectedInvitations.length === 0) {
    return { canResend: false, canCancel: false, canDelete: false };
  }

  const statuses = new Set(selectedInvitations.map((inv) => inv.status));
  const hasMultipleStatuses = statuses.size > 1;

  if (hasMultipleStatuses) {
    return {
      canResend: false,
      canCancel: false,
      canDelete: false,
      reason: 'Cannot perform batch operations on invitations with different statuses',
    };
  }

  const singleStatus = Array.from(statuses)[0];

  switch (singleStatus) {
    case 'pending':
      return {
        canResend: true,
        canCancel: true,
        canDelete: false,
      };
    case 'declined':
      return {
        canResend: false,
        canCancel: false,
        canDelete: true,
      };
    case 'expired':
      return {
        canResend: true,
        canCancel: false,
        canDelete: true,
      };
    case 'accepted':
      return {
        canResend: false,
        canCancel: false,
        canDelete: false,
        reason: 'Accepted invitations cannot be modified',
      };
    default:
      return {
        canResend: false,
        canCancel: false,
        canDelete: false,
      };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* -------------------------------------------------------------------------- */
/*                        MAIN COMPONENT                                      */
/* -------------------------------------------------------------------------- */

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';

  const activeFacilityId = useSelector(
    (state: RootState) => state.activeContext.activeFacilityId
  );

  // State management
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvitationIds, setSelectedInvitationIds] = useState<number[]>([]);

  const [formData, setFormData] = useState<CreateInvitationFormData>({
    staff_id: null,
    staff_uuid: '',
    department_id: null,
    role_code: '',
    module_codes: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [staffLookupError, setStaffLookupError] = useState<string>('');
  const [staffLookupMode, setStaffLookupMode] = useState<'search' | 'select'>('search');
  const [filteredStaff, setFilteredStaff] = useState<any[]>([]);
  const [showStaffDetails, setShowStaffDetails] = useState(false);

  const { confirm } = useConfirm();

  /* -------------------------------------------------------------------------- */
  /*                              DATA FETCHING                                 */
  /* -------------------------------------------------------------------------- */

  const {
    data: invitationsResponse,
    isLoading: invitationsLoading,
    refetch,
  } = useGetStaffInvitations(
    {
      facility_id: activeFacilityId || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: !!activeFacilityId,
    }
  );

  const { data: staffResponse, isLoading: staffLoading } = useGetStaff(
    {
      limit: 100,
      include_minimal: true,
    },
    { enabled: true }
  );

  const { data: rolesResponse, isLoading: rolesLoading } = useGetFacilityRoles(
    {},
    { enabled: showCreateModal }
  );

  const { data: modulesResponse, isLoading: modulesLoading } = useGetModules(
    { is_active: true },
    { enabled: showCreateModal }
  );

  const { data: departmentsResponse, isLoading: departmentsLoading } =
    useGetDepartmentsByFacility(
      activeFacilityId || 0,
      {},
      { enabled: showCreateModal && !!activeFacilityId }
    );

  const { data: facilityRolesResponse } = useGetFacilitySpecificRoles(
    activeFacilityId!,
    { enabled: !!activeFacilityId }
  );

  const facilityRoles = facilityRolesResponse?.data || [];
  const invitations = invitationsResponse?.data || [];

  const roles = useMemo(() => {
    return [...facilityRoles, ...(rolesResponse?.data || [])];
  }, [facilityRoles, rolesResponse?.data]);

  const allStaff = staffResponse?.data || [];
  const modules = modulesResponse?.data || [];
  const departments = departmentsResponse?.data || [];

  /* -------------------------------------------------------------------------- */
  /*                              MUTATIONS                                     */
  /* -------------------------------------------------------------------------- */

  const createMutation = useCreateStaffInvitation({
    onSuccess: () => {
      setShowCreateModal(false);
      resetForm();
      refetch();
    },
  });

  // SINGLE OPERATION MUTATIONS (use correct hooks with { id } parameter)
  const resendMutation = useResendInvitation({
    onSuccess: () => refetch(),
  });

  const cancelMutation = useCancelInvitation({
    onSuccess: () => {
      refetch();
      setSelectedInvitationIds([]);
    },
  });

  const deleteMutation = useDeleteStaffInvitation({
    onSuccess: () => {
      refetch();
      setSelectedInvitationIds([]);
    },
  });

  // BATCH OPERATION MUTATIONS (use correct hooks with { invitation_ids } parameter)
  const batchResendMutation = useBatchResendInvitations({
    onSuccess: () => {
      refetch();
      setSelectedInvitationIds([]);
    },
  });

  const batchCancelMutation = useBatchCancelInvitations({
    onSuccess: () => {
      refetch();
      setSelectedInvitationIds([]);
    },
  });

  // Track batch delete processing state
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                         COMPUTED VALUES                                    */
  /* -------------------------------------------------------------------------- */

  const filteredInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      const matchesSearch =
        searchTerm === '' ||
        invitation.staff?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.staff?.professional_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.role?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [invitations, searchTerm]);

  const selectedInvitations = useMemo(() => {
    return filteredInvitations.filter((inv) => selectedInvitationIds.includes(inv.id));
  }, [filteredInvitations, selectedInvitationIds]);

  const batchActionConfig = useMemo(() => {
    return getBatchActionConfig(selectedInvitations);
  }, [selectedInvitations]);

  const statusStats = useMemo(() => {
    return invitations.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<InvitationStatus, number>
    );
  }, [invitations]);

  const selectedStaff = useMemo(() => {
    if (!formData.staff_id) return null;
    return allStaff.find((staff) => staff.id === formData.staff_id);
  }, [formData.staff_id, allStaff]);

  // Check if any mutation is in progress
  const isAnyMutationPending =
    resendMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending ||
    batchResendMutation.isPending ||
    batchCancelMutation.isPending ||
    isBatchDeleting;

  /* -------------------------------------------------------------------------- */
  /*                         EVENT HANDLERS                                     */
  /* -------------------------------------------------------------------------- */

  const handleStaffUUIDLookup = useCallback(() => {
    setStaffLookupError('');

    if (!formData.staff_uuid.trim()) {
      setStaffLookupError('Please enter a staff number/UUID');
      return;
    }

    const searchTerm = formData.staff_uuid.trim().toLowerCase();

    const results = allStaff.filter((staff) => {
      const uuidMatch = staff.staff_uuid?.toLowerCase().includes(searchTerm);
      const employeeIdMatch = staff.employee_id?.toLowerCase().includes(searchTerm);
      const nameMatch = staff.professional_title?.toLowerCase().includes(searchTerm);

      return uuidMatch || employeeIdMatch || nameMatch;
    });

    if (results.length === 0) {
      setStaffLookupError(
        'No staff member found with that identifier. Please check the staff number and try again.'
      );
      setFilteredStaff([]);
      setFormData((prev) => ({ ...prev, staff_id: null }));
    } else if (results.length === 1) {
      setFormData((prev) => ({
        ...prev,
        staff_id: results[0].id,
        staff_uuid: results[0].staff_uuid,
      }));
      setStaffLookupMode('select');
      setFilteredStaff([results[0]]);
      setShowStaffDetails(true);
    } else {
      setFilteredStaff(results);
      setStaffLookupMode('select');
      setFormData((prev) => ({ ...prev, staff_id: null }));
    }
  }, [formData.staff_uuid, allStaff]);

  const handleStaffSelect = useCallback((staffId: number, staffUUID: string) => {
    setFormData((prev) => ({
      ...prev,
      staff_id: staffId,
      staff_uuid: staffUUID,
    }));
    setStaffLookupError('');
    setShowStaffDetails(true);
  }, []);

  const resetStaffSearch = useCallback(() => {
    setStaffLookupMode('search');
    setFormData((prev) => ({ ...prev, staff_id: null, staff_uuid: '' }));
    setFilteredStaff([]);
    setStaffLookupError('');
    setShowStaffDetails(false);
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.staff_id) {
      errors.staff_id = 'Please select a staff member';
    }

    if (!formData.role_code) {
      errors.role_code = 'Please select a role';
    }

    if (formData.module_codes.length === 0) {
      errors.module_codes = 'Please select at least one module';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateInvitation = () => {
    if (!validateForm() || !activeFacilityId) return;

    const payload: CreateStaffInvitationRequest = {
      staff_id: formData.staff_id!,
      facility_id: activeFacilityId,
      role_code: formData.role_code,
      module_code: formData.module_codes,
    };

    if (formData.department_id) {
      payload.department_id = formData.department_id;
    }

    createMutation.mutate(payload);
  };

  const resetForm = () => {
    setFormData({
      staff_id: null,
      staff_uuid: '',
      department_id: null,
      role_code: '',
      module_codes: [],
    });
    setFormErrors({});
    resetStaffSearch();
  };

  // SINGLE OPERATION HANDLERS (use correct parameter format)
  const handleResend = async (id: number) => {
    const confirmed = await confirm({
      title: 'Resend Invitation',
      message:
        'This will resend the existing invitation to the staff member using the current details.',
      confirmText: 'Resend Invitation',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!confirmed) return;

    resendMutation.mutate({ id });
  };

  const handleCancel = async (id: number) => {
    const confirmed = await confirm({
      title: 'Cancel Invitation',
      message:
        'This will revoke the pending invitation. The staff member will no longer be able to accept it.',
      confirmText: 'Cancel Invitation',
      cancelText: 'Keep Invitation',
      variant: 'warning',
      theme,
    });

    if (!confirmed) return;

    cancelMutation.mutate({ id });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Invitation',
      message:
        'This will permanently delete this declined invitation. This action cannot be undone.',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    deleteMutation.mutate({ id });
  };

  // BATCH OPERATION HANDLERS (use correct parameter format)
  const handleBatchResend = async () => {
    if (!batchActionConfig.canResend) return;

    const confirmed = await confirm({
      title: `Resend ${selectedInvitations.length} Invitations`,
      message: `This will resend ${selectedInvitations.length} invitation(s) to the staff members.`,
      confirmText: 'Resend All',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!confirmed) return;

    batchResendMutation.mutate({ invitation_ids: selectedInvitationIds });
  };

  const handleBatchCancel = async () => {
    if (!batchActionConfig.canCancel) return;

    const confirmed = await confirm({
      title: `Cancel ${selectedInvitations.length} Invitations`,
      message: `This will cancel ${selectedInvitations.length} pending invitation(s).`,
      confirmText: 'Cancel All',
      cancelText: 'Keep Invitations',
      variant: 'warning',
      theme,
    });

    if (!confirmed) return;

    batchCancelMutation.mutate({ invitation_ids: selectedInvitationIds });
  };

  const handleBatchDelete = async () => {
    if (!batchActionConfig.canDelete) return;

    const confirmed = await confirm({
      title: `Delete ${selectedInvitations.length} Invitations`,
      message: `This will permanently delete ${selectedInvitations.length} invitation(s). This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    setIsBatchDeleting(true);

    try {
      // Delete one by one since no batch delete endpoint exists
      for (const id of selectedInvitationIds) {
        await deleteMutation.mutateAsync({ id });
      }

      refetch();
      setSelectedInvitationIds([]);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleToggleModule = (moduleCode: string) => {
    setFormData((prev) => ({
      ...prev,
      module_codes: prev.module_codes.includes(moduleCode)
        ? prev.module_codes.filter((c) => c !== moduleCode)
        : [...prev.module_codes, moduleCode],
    }));

    if (formErrors.module_codes) {
      setFormErrors((prev) => ({ ...prev, module_codes: '' }));
    }
  };

  const handleSelectAll = () => {
    if (selectedInvitationIds.length === filteredInvitations.length) {
      setSelectedInvitationIds([]);
    } else {
      setSelectedInvitationIds(filteredInvitations.map((inv) => inv.id));
    }
  };

  const handleToggleSelection = (id: number) => {
    setSelectedInvitationIds((prev) =>
      prev.includes(id) ? prev.filter((invId) => invId !== id) : [...prev, id]
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                         STYLING HELPERS                                    */
  /* -------------------------------------------------------------------------- */

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return isDark
          ? 'text-yellow-400 bg-yellow-900/30'
          : 'text-yellow-700 bg-yellow-100';
      case 'accepted':
        return isDark ? 'text-green-400 bg-green-900/30' : 'text-green-700 bg-green-100';
      case 'declined':
        return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-100';
      case 'expired':
        return isDark ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-200';
    }
  };

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                         LOADING STATES                                     */
  /* -------------------------------------------------------------------------- */

  const isLoading = invitationsLoading;
  const isFormLoading =
    staffLoading || rolesLoading || modulesLoading || departmentsLoading;

  /* -------------------------------------------------------------------------- */
  /*                         EARLY RETURNS                                      */
  /* -------------------------------------------------------------------------- */

  if (!activeFacilityId) {
    return (
      <div
        className={`rounded-xl p-12 text-center border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <Building2
          className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`}
        />
        <h3 className="text-xl font-semibold mb-2">No Active Facility</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility to manage staff invitations.
        </p>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                         RENDER                                             */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Secure Staff Invitations
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Privacy-focused staff invitation management.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isAnyMutationPending}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'disabled:opacity-50',
              isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <Send className="w-4 h-4" />
            Send Invitation
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['pending', 'accepted', 'declined', 'expired'] as InvitationStatus[]).map(
            (status) => (
              <div
                key={status}
                className={`p-3 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium capitalize ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {status}
                  </span>
                  {getStatusIcon(status)}
                </div>
                <div className="text-2xl font-bold">{statusStats[status] || 0}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className={`rounded-xl p-4 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              placeholder="Search by employee ID, title, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAnyMutationPending}
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:opacity-50',
                isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-text'
              )}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'all')}
            disabled={isAnyMutationPending}
            className={cn(
              'px-3 py-2 rounded-lg border',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:opacity-50',
              isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            disabled={isAnyMutationPending}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors',
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
              'disabled:opacity-50',
              isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isAnyMutationPending}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors',
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
              'disabled:opacity-50',
              isLoading || isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div
        className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {/* Table Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                selectedInvitationIds.length === filteredInvitations.length &&
                filteredInvitations.length > 0
              }
              onChange={handleSelectAll}
              disabled={filteredInvitations.length === 0 || isAnyMutationPending}
              className={cn(
                'w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                filteredInvitations.length === 0 || isAnyMutationPending
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              )}
            />
            <h3 className="font-semibold">
              {filteredInvitations.length} Invitation
              {filteredInvitations.length !== 1 ? 's' : ''}
              {selectedInvitationIds.length > 0 &&
                ` (${selectedInvitationIds.length} selected)`}
            </h3>
          </div>

          {/* Batch Actions */}
          {selectedInvitationIds.length > 0 && (
            <div className="flex items-center gap-2">
              {batchActionConfig.reason && (
                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${
                    isDark
                      ? 'bg-yellow-900/20 text-yellow-300'
                      : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {batchActionConfig.reason}
                </div>
              )}

              {batchActionConfig.canResend && (
                <button
                  onClick={handleBatchResend}
                  disabled={batchResendMutation.isPending || isAnyMutationPending}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isDark
                      ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-300'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
                    'disabled:opacity-50',
                    batchResendMutation.isPending || isAnyMutationPending
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  )}
                >
                  {batchResendMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Selected'
                  )}
                </button>
              )}

              {batchActionConfig.canCancel && (
                <button
                  onClick={handleBatchCancel}
                  disabled={batchCancelMutation.isPending || isAnyMutationPending}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isDark
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300'
                      : 'bg-red-100 hover:bg-red-200 text-red-700',
                    'disabled:opacity-50',
                    batchCancelMutation.isPending || isAnyMutationPending
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  )}
                >
                  {batchCancelMutation.isPending ? (
                    <>
                      <X className="w-3 h-3 inline mr-1" />
                      Canceling...
                    </>
                  ) : (
                    'Cancel Selected'
                  )}
                </button>
              )}

              {batchActionConfig.canDelete && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isBatchDeleting || isAnyMutationPending}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isDark
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300'
                      : 'bg-red-100 hover:bg-red-200 text-red-700',
                    'disabled:opacity-50',
                    isBatchDeleting || isAnyMutationPending
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  )}
                >
                  {isBatchDeleting ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Content */}
        {isLoading ? (
          <LoadingSkeleton
            theme={theme}
            message="Loading staff invitations..."
            variant="default"
          />
        ) : filteredInvitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail
              className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}
            />
            <h3 className="text-lg font-medium mb-2">No Invitations Found</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} invitations to display.`
                : searchTerm
                ? 'No invitations match your search.'
                : 'Send your first staff invitation to get started.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={isAnyMutationPending}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'disabled:opacity-50',
                  isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                <Plus className="w-4 h-4" />
                Send First Invitation
              </button>
            )}
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`p-4 transition-colors ${
                  selectedInvitationIds.includes(invitation.id)
                    ? isDark
                      ? 'bg-blue-900/10'
                      : 'bg-blue-50'
                    : isDark
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedInvitationIds.includes(invitation.id)}
                    onChange={() => handleToggleSelection(invitation.id)}
                    disabled={isAnyMutationPending}
                    className={cn(
                      'mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                      isAnyMutationPending ? 'cursor-not-allowed' : 'cursor-pointer'
                    )}
                  />

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {/* LEFT: Identity + Context + Timeline */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Identity + Status */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-lg truncate">
                              {invitation.staff?.staff_name ||
                                invitation.staff?.user?.profile?.full_name ||
                                'Staff Member'}
                            </h4>

                            <div
                              className={`text-xs ${
                                isDark ? 'text-gray-500' : 'text-gray-500'
                              }`}
                            >
                              {invitation.staff?.professional_title ? (
                                <span className="truncate">
                                  {invitation.staff.professional_title}
                                </span>
                              ) : (
                                <span>Professional title not set</span>
                              )}
                              {invitation.staff?.staff_uuid && (
                                <span className="mx-2">•</span>
                              )}
                              {invitation.staff?.staff_uuid && (
                                <span className="truncate">
                                  Staff No: {invitation.staff.staff_uuid}
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              invitation.status
                            )}`}
                          >
                            {getStatusIcon(invitation.status)}
                            {invitation.status
                              ? `Status: ${
                                  invitation.status.charAt(0).toUpperCase() +
                                  invitation.status.slice(1)
                                }`
                              : 'Status: Unknown'}
                          </span>
                        </div>

                        {/* Row 2: Context */}
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Facility:{' '}
                              {invitation.facility?.facility_name || 'Not specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Department:{' '}
                              {invitation.department?.department_name || 'Not specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <UserPlus className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Role: {invitation.role?.code || 'Not specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Access Rights:{' '}
                              {Array.isArray(invitation.module_code) &&
                              invitation.module_code.length > 0
                                ? `${invitation.module_code.length} Permission${
                                    invitation.module_code.length !== 1 ? 's' : ''
                                  }`
                                : 'Not specified'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Sent:{' '}
                              {formatDate(invitation.sent_at || invitation.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Expires:{' '}
                              {invitation.expires_at
                                ? formatDate(invitation.expires_at)
                                : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Status-Based Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Pending: Resend + Cancel */}
                        {invitation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendMutation.isPending || isAnyMutationPending}
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                isDark
                                  ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300'
                                  : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700',
                                'disabled:opacity-50',
                                resendMutation.isPending || isAnyMutationPending
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                              )}
                              title="Resend invitation"
                            >
                              <RefreshCw
                                className={cn(
                                  'w-3.5 h-3.5',
                                  resendMutation.isPending && 'animate-spin'
                                )}
                              />
                              <span>Resend</span>
                            </button>

                            <button
                              onClick={() => handleCancel(invitation.id)}
                              disabled={cancelMutation.isPending || isAnyMutationPending}
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                isDark
                                  ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-600 hover:text-red-700',
                                'disabled:opacity-50',
                                cancelMutation.isPending || isAnyMutationPending
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                              )}
                              title="Cancel invitation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {/* Declined: Delete */}
                        {invitation.status === 'declined' && (
                          <button
                            onClick={() => handleDelete(invitation.id)}
                            disabled={deleteMutation.isPending || isAnyMutationPending}
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                              isDark
                                ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                                : 'hover:bg-red-50 text-red-600 hover:text-red-700',
                              'disabled:opacity-50',
                              deleteMutation.isPending || isAnyMutationPending
                                ? 'cursor-not-allowed'
                                : 'cursor-pointer'
                            )}
                            title="Delete declined invitation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}

                        {/* Expired: Resend + Delete */}
                        {invitation.status === 'expired' && (
                          <>
                            <button
                              onClick={() => handleResend(invitation.id)}
                              disabled={resendMutation.isPending || isAnyMutationPending}
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                isDark
                                  ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300'
                                  : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700',
                                'disabled:opacity-50',
                                resendMutation.isPending || isAnyMutationPending
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                              )}
                              title="Resend expired invitation"
                            >
                              <RefreshCw
                                className={cn(
                                  'w-3.5 h-3.5',
                                  resendMutation.isPending && 'animate-spin'
                                )}
                              />
                              <span>Resend</span>
                            </button>

                            <button
                              onClick={() => handleDelete(invitation.id)}
                              disabled={deleteMutation.isPending || isAnyMutationPending}
                              type="button"
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                isDark
                                  ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                                  : 'hover:bg-red-50 text-red-600 hover:text-red-700',
                                'disabled:opacity-50',
                                deleteMutation.isPending || isAnyMutationPending
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer'
                              )}
                              title="Delete expired invitation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}

                        {/* Accepted: No actions */}
                        {invitation.status === 'accepted' && (
                          <span
                            className={`text-xs italic ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            }`}
                          >
                            No actions available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Module Tags */}
                    {invitation.module_code &&
                      Array.isArray(invitation.module_code) &&
                      invitation.module_code.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {invitation.module_code.map((code) => (
                            <span
                              key={code}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                isDark
                                  ? 'bg-gray-800 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className={`rounded-xl max-w-2xl w-full my-8 ${
              isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-6 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Send Secure Staff Invitation
                  </h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Privacy-first staff invitation system
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isDark
                      ? 'hover:bg-gray-800 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600',
                    'disabled:opacity-50',
                    createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {isFormLoading ? (
                <LoadingSkeleton
                  variant="form"
                  theme={theme}
                  message="Loading form data..."
                />
              ) : (
                <>
                  {/* Staff Lookup Section */}
                  <div
                    className={`p-4 rounded-lg border ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Key className="w-5 h-5 text-blue-500" />
                      Staff Lookup
                    </h4>

                    {staffLookupMode === 'search' ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <label
                              className={`block text-sm font-medium mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              Enter Staff Number (e.g ST-023...) *
                              <span
                                className={`ml-2 text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                (Can also search by name or employee ID)
                              </span>
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <Key
                                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                    isDark ? 'text-gray-500' : 'text-gray-400'
                                  }`}
                                />
                                <input
                                  type="text"
                                  value={formData.staff_uuid}
                                  onChange={(e) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      staff_uuid: e.target.value,
                                    }));
                                    setStaffLookupError('');
                                  }}
                                  disabled={createMutation.isPending}
                                  placeholder="e.g., STF-12345 or staff name..."
                                  className={cn(
                                    'w-full pl-10 pr-4 py-2.5 rounded-lg border',
                                    staffLookupError
                                      ? 'border-red-500 focus:ring-red-500'
                                      : isDark
                                      ? 'bg-gray-800 border-gray-700 text-white'
                                      : 'bg-white border-gray-300 text-gray-900',
                                    'focus:outline-none focus:ring-2 focus:border-transparent',
                                    'disabled:opacity-50',
                                    createMutation.isPending ? 'cursor-not-allowed' : 'cursor-text'
                                  )}
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' && handleStaffUUIDLookup()
                                  }
                                />
                              </div>
                              <button
                                onClick={handleStaffUUIDLookup}
                                disabled={!formData.staff_uuid.trim() || createMutation.isPending}
                                className={cn(
                                  'px-4 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2',
                                  'bg-blue-600 hover:bg-blue-700 text-white',
                                  'disabled:opacity-50',
                                  !formData.staff_uuid.trim() || createMutation.isPending
                                    ? 'cursor-not-allowed'
                                    : 'cursor-pointer'
                                )}
                              >
                                <Search className="w-4 h-4" />
                                Search
                              </button>
                            </div>
                            {staffLookupError && (
                              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {staffLookupError}
                              </p>
                            )}
                            <p
                              className={`mt-2 text-xs ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                              }`}
                            >
                              🔒 Only matching staff members will be shown to protect privacy
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Staff Selection Interface */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">
                              {filteredStaff.length} Staff Member
                              {filteredStaff.length !== 1 ? 's' : ''} Found
                            </h5>
                            <button
                              onClick={resetStaffSearch}
                              disabled={createMutation.isPending}
                              className={cn(
                                'text-sm flex items-center gap-1',
                                isDark
                                  ? 'text-gray-400 hover:text-gray-300'
                                  : 'text-gray-600 hover:text-gray-900',
                                'disabled:opacity-50',
                                createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                              )}
                            >
                              <RefreshCw className="w-3 h-3" />
                              New Search
                            </button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredStaff.map((staff) => (
                              <div
                                key={staff.id}
                                className={cn(
                                  'p-3 rounded-lg border transition-all',
                                  formData.staff_id === staff.id
                                    ? isDark
                                      ? 'bg-blue-900/20 border-blue-700 ring-2 ring-blue-500/20'
                                      : 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                                    : isDark
                                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                    : 'bg-gray-50 border-gray-300 hover:border-gray-400',
                                  createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                                )}
                                onClick={() => {
                                  if (!createMutation.isPending) {
                                    handleStaffSelect(staff.id, staff.staff_uuid);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {staff.professional_title || 'Medical Staff'}
                                    </div>
                                    <div
                                      className={`text-sm mt-1 flex items-center gap-2 ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        <Key className="w-3 h-3" />
                                        Staff Number: {staff.staff_uuid}
                                      </span>
                                      {staff.employee_id && (
                                        <span className="inline-flex items-center gap-1">
                                          ({staff.user?.profile.full_name})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {formData.staff_id === staff.id && (
                                    <UserCheck className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Selected Staff Details */}
                  {selectedStaff && showStaffDetails && (
                    <div
                      className={`p-4 rounded-lg border ${
                        isDark
                          ? 'bg-green-900/10 border-green-800'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-green-500" />
                          Selected Staff Member
                        </h5>
                        <button
                          onClick={() => setShowStaffDetails(!showStaffDetails)}
                          disabled={createMutation.isPending}
                          className={cn(
                            'p-1 rounded',
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200',
                            'disabled:opacity-50',
                            createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          {showStaffDetails ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {showStaffDetails && (
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          <div className="space-y-2">
                            <div>
                              <div
                                className={`text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                Name
                              </div>
                              <div className="font-medium">
                                {selectedStaff.user?.profile.full_name || 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div
                                className={`text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                Staff Number
                              </div>
                              <div className="font-mono font-medium">
                                {selectedStaff.staff_uuid}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div
                                className={`text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                Email
                              </div>
                              <div>
                                {selectedStaff?.user?.contact?.email
                                  ? maskEmail(selectedStaff.user.contact.email)
                                  : 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div
                                className={`text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                Phone
                              </div>
                              <div>
                                {selectedStaff?.user?.contact?.phone
                                  ? maskPhone(selectedStaff.user.contact.phone)
                                  : 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {formErrors.staff_id && (
                        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.staff_id}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Department Selection (Optional) */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Department (Optional)
                    </label>
                    <div className="relative">
                      <Briefcase
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      />
                      <select
                        value={formData.department_id || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            department_id: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        disabled={createMutation.isPending}
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 rounded-lg border appearance-none',
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          'disabled:opacity-50',
                          createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                        )}
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Facility Role *
                    </label>
                    <div className="relative">
                      <UserPlus
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      />
                      <select
                        value={formData.role_code}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, role_code: e.target.value }));
                          setFormErrors((prev) => ({ ...prev, role_code: '' }));
                        }}
                        disabled={createMutation.isPending}
                        className={cn(
                          'w-full pl-10 pr-4 py-2.5 rounded-lg border appearance-none',
                          formErrors.role_code
                            ? 'border-red-500 focus:ring-red-500'
                            : isDark
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900',
                          'focus:outline-none focus:ring-2 focus:border-transparent',
                          'disabled:opacity-50',
                          createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                        )}
                      >
                        <option value="">Select a role...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.code}>
                            {role.name} {role.is_system_role ? '(System)' : '(Custom)'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      />
                    </div>
                    {formErrors.role_code && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.role_code}
                      </p>
                    )}
                  </div>

                  {/* Module Selection */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Permission Access *
                    </label>
                    <p className={`text-xs mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Grant permissions this staff can have.
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {modules.length === 0 ? (
                        <div
                          className={`p-4 rounded-lg text-center ${
                            isDark
                              ? 'bg-gray-800 text-gray-400'
                              : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          No access available
                        </div>
                      ) : (
                        modules.map((module) => (
                          <label
                            key={module.id}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                              formData.module_codes.includes(module.code)
                                ? isDark
                                  ? 'bg-blue-900/20 border-blue-700'
                                  : 'bg-blue-50 border-blue-300'
                                : isDark
                                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                : 'bg-gray-50 border-gray-300 hover:border-gray-400',
                              createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={formData.module_codes.includes(module.code)}
                              onChange={() => handleToggleModule(module.code)}
                              disabled={createMutation.isPending}
                              className={cn(
                                'mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                                createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{module.name}</div>
                                <code
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    isDark
                                      ? 'bg-gray-900 text-gray-400'
                                      : 'bg-white text-gray-600'
                                  }`}
                                >
                                  {module.code}
                                </code>
                              </div>
                              {module.description && (
                                <div
                                  className={`text-sm mt-1 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  {module.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    {formErrors.module_codes && (
                      <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.module_codes}
                      </p>
                    )}

                    {formData.module_codes.length > 0 && (
                      <div
                        className={`mt-2 text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {formData.module_codes.length} module
                        {formData.module_codes.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-6 border-t flex items-center justify-end gap-3 ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={createMutation.isPending}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                  'disabled:opacity-50',
                  createMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvitation}
                disabled={
                  createMutation.isPending || isFormLoading || !formData.staff_id
                }
                className={cn(
                  'px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'disabled:opacity-50',
                  createMutation.isPending || isFormLoading || !formData.staff_id
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer'
                )}
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationManager;
