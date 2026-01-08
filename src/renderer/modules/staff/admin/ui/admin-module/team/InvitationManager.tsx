/**
 * ============================================================================
 * INVITATION MANAGER COMPONENT
 * ============================================================================
 * 
 * Professional staff invitation management system with full CRUD operations,
 * batch actions, filtering, and real-time status tracking.
 * 
 * @component InvitationManager
 * @description Manages staff invitations - create, resend, cancel, and track status
 */

import React, { useState, useMemo } from 'react';
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
  Users,
  Building2,
  UserPlus,
  Briefcase,
  Package,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import {type  RootState } from '../../../../../../app/store/rootReducer';
import {
  useGetStaffInvitations,
  useCreateStaffInvitation,
  useResendInvitation,
  useCancelInvitation,
} from '../../../api/team/queries/useStaffInvitationQueries';
import { useGetStaff } from '../../../api/team/queries/useStaffQueries';
import { useGetFacilityRoles } from '../../../api/team/queries/useFacilityRoleQueries';
import { useGetModules } from '../../../api/team/queries/useModuleQueries';
import { useGetDepartments } from '../../../api/department/useDepartmentQueries';
import type { InvitationStatus } from '../../../api/team/types/staffInvitationTypes';
import { EmploymentStatus } from '../../../api/team/types/staffTypes';

interface InvitationManagerProps {
  theme: 'light' | 'dark';
  refreshKey?: number;
  facilityId: number;
  onInvitationSent: () => void;


}

interface CreateInvitationFormData {
  staff_id: number | null;
  department_id: number | null;
  role_code: string;
  module_codes: string[];
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';
  
  // Get active facility from Redux store
  const activeFacilityId = useSelector(
    (state: RootState) => state.activeContext.activeFacilityId
  );
  
  // const invitedByStaffId = useSelector(
  //   (state: RootState) => state.activeContext.capabilities.staff?.staff_id
  // );
  
  // State management
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<number[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<CreateInvitationFormData>({
    staff_id: null,
    department_id: null,
    role_code: '',
    module_codes: [],
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch invitations
  const { data: invitationsResponse, isLoading: invitationsLoading, refetch } = useGetStaffInvitations(
    {
      facility_id: activeFacilityId || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: !!activeFacilityId,
    }
  );
  
  // Fetch staff (for invitation targets)
  const { data: staffResponse, isLoading: staffLoading } = useGetStaff(
    { employment_status: EmploymentStatus.EMPLOYED},
    { enabled: showCreateModal }
  );
  
  // Fetch roles
  const { data: rolesResponse, isLoading: rolesLoading } = useGetFacilityRoles(
    {},
    { enabled: showCreateModal }
  );
  
  // Fetch modules
  const { data: modulesResponse, isLoading: modulesLoading } = useGetModules(
    { is_active: true },
    { enabled: showCreateModal }
  );
  
  // Fetch departments
  const { data: departmentsResponse, isLoading: departmentsLoading } = useGetDepartments(
    { facility_id: activeFacilityId || undefined },
    { enabled: showCreateModal && !!activeFacilityId }
  );
  
  const invitations = invitationsResponse?.data || [];
  const staff = staffResponse?.data || [];
  const roles = rolesResponse?.data || [];
  const modules = modulesResponse?.data || [];
  const departments = departmentsResponse?.data || [];
  
  // Mutations
  const createMutation = useCreateStaffInvitation();
  const resendMutation = useResendInvitation();
  const cancelMutation = useCancelInvitation();
  
  // Filter and search invitations
  const filteredInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      const matchesSearch = searchTerm === '' || 
        invitation.staff?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.staff?.professional_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.role?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [invitations, searchTerm]);
  
  // Status statistics
  const statusStats = useMemo(() => {
    return invitations.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<InvitationStatus, number>);
  }, [invitations]);
  
  // Form validation
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
  
  // Handle form submission
  const handleCreateInvitation = () => {
    if (!validateForm() || !activeFacilityId) return;
    
    createMutation.mutate(
      {
        staff_id: formData.staff_id!,
        facility_id: activeFacilityId,
        department_id: formData.department_id || undefined,
        role_code: formData.role_code,
        module_code: formData.module_codes,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          resetForm();
          refetch();
        },
      }
    );
  };
  
  const resetForm = () => {
    setFormData({
      staff_id: null,
      department_id: null,
      role_code: '',
      module_codes: [],
    });
    setFormErrors({});
  };
  
  const handleResend = (id: number) => {
    resendMutation.mutate({ id }, {
      onSuccess: () => refetch(),
    });
  };
  
  const handleCancel = (id: number) => {
    cancelMutation.mutate({ id }, {
      onSuccess: () => {
        refetch();
        setSelectedInvitations(prev => prev.filter(invId => invId !== id));
      },
    });
  };
  
  const handleToggleModule = (moduleCode: string) => {
    setFormData(prev => ({
      ...prev,
      module_codes: prev.module_codes.includes(moduleCode)
        ? prev.module_codes.filter(c => c !== moduleCode)
        : [...prev.module_codes, moduleCode],
    }));
    // Clear error when user makes a selection
    if (formErrors.module_codes) {
      setFormErrors(prev => ({ ...prev, module_codes: '' }));
    }
  };
  
  const handleSelectAll = () => {
    if (selectedInvitations.length === filteredInvitations.length) {
      setSelectedInvitations([]);
    } else {
      setSelectedInvitations(filteredInvitations.map(inv => inv.id));
    }
  };
  
  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return isDark ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-100';
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const isLoading = invitationsLoading;
  const isFormLoading = staffLoading || rolesLoading || modulesLoading || departmentsLoading;
  
  if (!activeFacilityId) {
    return (
      <div className={`rounded-xl p-12 text-center border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <Building2 className={`w-16 h-16 mx-auto mb-4 ${
          isDark ? 'text-gray-600' : 'text-gray-400'
        }`} />
        <h3 className="text-xl font-semibold mb-2">No Active Facility</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Please select a facility to manage staff invitations.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Staff Invitations
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage pending and sent invitations for facility staff
            </p>
            <div className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded text-xs ${
              isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
            }`}>
              <Building2 className="w-3 h-3" />
              Facility ID: {activeFacilityId}
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['pending', 'accepted', 'declined', 'expired'] as InvitationStatus[]).map((status) => (
            <div
              key={status}
              className={`p-3 rounded-lg border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium capitalize ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {status}
                </span>
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold">
                {statusStats[status] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Filters Bar */}
      <div className={`rounded-xl p-4 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search by employee ID, title, or role..."
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
            onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'all')}
            className={`px-3 py-2 rounded-lg border ${
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
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Invitations List */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Table Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedInvitations.length === filteredInvitations.length && filteredInvitations.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <h3 className="font-semibold">
              {filteredInvitations.length} Invitation{filteredInvitations.length !== 1 ? 's' : ''}
              {selectedInvitations.length > 0 && ` (${selectedInvitations.length} selected)`}
            </h3>
          </div>
          
          {selectedInvitations.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* Batch resend */}}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-300' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
              >
                Resend Selected
              </button>
              <button
                onClick={() => {/* Batch cancel */}}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300' 
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                Cancel Selected
              </button>
            </div>
          )}
        </div>
        
        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className={`inline-flex items-center gap-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading invitations...
            </div>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
                  selectedInvitations.includes(invitation.id)
                    ? (isDark ? 'bg-blue-900/10' : 'bg-blue-50')
                    : (isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50')
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedInvitations.includes(invitation.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvitations(prev => [...prev, invitation.id]);
                      } else {
                        setSelectedInvitations(prev => prev.filter(id => id !== invitation.id));
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">
                            {invitation.staff?.professional_title || 'Staff Member'}
                          </h4>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            getStatusColor(invitation.status)
                          }`}>
                            {getStatusIcon(invitation.status)}
                            {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {invitation.staff?.employee_id && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span>ID: {invitation.staff.employee_id}</span>
                            </div>
                          )}
                          
                          {invitation.facility && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{invitation.facility.facility_name}</span>
                            </div>
                          )}
                          
                          {invitation.department && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{invitation.department.department_name}</span>
                            </div>
                          )}
                          
                          {invitation.role && (
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{invitation.role.name}</span>
                            </div>
                          )}
                          
                          {invitation.module_code && Array.isArray(invitation.module_code) && invitation.module_code.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 flex-shrink-0" />
                              <span>{invitation.module_code.length} module{invitation.module_code.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Sent: {formatDate(invitation.sent_at || invitation.created_at)}</span>
                          </div>
                          
                          {invitation.expires_at && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>Expires: {formatDate(invitation.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {invitation.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResend(invitation.id)}
                            disabled={resendMutation.isPending}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark 
                                ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300' 
                                : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
                            } disabled:opacity-50`}
                            title="Resend invitation"
                          >
                            <RefreshCw className={`w-4 h-4 ${resendMutation.isPending ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleCancel(invitation.id)}
                            disabled={cancelMutation.isPending}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark 
                                ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' 
                                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                            } disabled:opacity-50`}
                            title="Cancel invitation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Module Tags */}
                    {invitation.module_code && Array.isArray(invitation.module_code) && invitation.module_code.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {invitation.module_code.map((code) => (
                          <span
                            key={code}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
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
          <div className={`rounded-xl max-w-2xl w-full my-8 ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send Staff Invitation
                  </h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Invite a staff member to join this facility with specific role and module access
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {isFormLoading ? (
                <div className="py-12 text-center">
                  <div className={`inline-flex items-center gap-3 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading form data...
                  </div>
                </div>
              ) : (
                <>
                  {/* Staff Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Staff Member *
                    </label>
                    <div className="relative">
                      <Users className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <select
                        value={formData.staff_id || ''}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, staff_id: e.target.value ? Number(e.target.value) : null }));
                          setFormErrors(prev => ({ ...prev, staff_id: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                          formErrors.staff_id
                            ? 'border-red-500 focus:ring-red-500'
                            : isDark 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:border-transparent appearance-none`}
                      >
                        <option value="">Select a staff member...</option>
                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.employee_id} - {member.professional_title || 'Staff Member'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                    {formErrors.staff_id && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.staff_id}
                      </p>
                    )}
                  </div>
                  
                  {/* Department Selection (Optional) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Department (Optional)
                    </label>
                    <div className="relative">
                      <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <select
                        value={formData.department_id || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          department_id: e.target.value ? Number(e.target.value) : null 
                        }))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
                      >
                        <option value="">No specific department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  
                  {/* Role Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Facility Role *
                    </label>
                    <div className="relative">
                      <UserPlus className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <select
                        value={formData.role_code}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, role_code: e.target.value }));
                          setFormErrors(prev => ({ ...prev, role_code: '' }));
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                          formErrors.role_code
                            ? 'border-red-500 focus:ring-red-500'
                            : isDark 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:border-transparent appearance-none`}
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
                  
                  {/* Module Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Module Access *
                    </label>
                    <p className={`text-xs mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Select the modules this staff member can access
                    </p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {modules.length === 0 ? (
                        <div className={`p-4 rounded-lg text-center ${
                          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
                        }`}>
                          No modules available
                        </div>
                      ) : (
                        modules.map((module) => (
                          <label
                            key={module.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.module_codes.includes(module.code)
                                ? (isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300')
                                : (isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-300 hover:border-gray-400')
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.module_codes.includes(module.code)}
                              onChange={() => handleToggleModule(module.code)}
                              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{module.name}</div>
                                <code className={`px-2 py-0.5 rounded text-xs ${
                                  isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600'
                                }`}>
                                  {module.code}
                                </code>
                              </div>
                              {module.description && (
                                <div className={`text-sm mt-1 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
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
                      <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formData.module_codes.length} module{formData.module_codes.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className={`p-6 border-t flex items-center justify-end gap-3 ${
              isDark ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={createMutation.isPending}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvitation}
                disabled={createMutation.isPending || isFormLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
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
