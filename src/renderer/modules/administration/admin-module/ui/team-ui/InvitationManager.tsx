/**
 * ============================================================================
 * INVITATION MANAGER COMPONENT (ENHANCED)
 * ============================================================================
 * 
 * Enhanced staff invitation management with secure staff lookup system.
 * Users enter staff number/UUID first, then select from filtered results.
 * 
 * @component InvitationManager
 * @description Manages staff invitations with secure staff lookup to prevent data exposure
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
  Users,
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
} from 'lucide-react';
import { useSelector } from 'react-redux';
import {type  RootState } from '../../../../../app/store/rootReducer';
import {
  useGetStaffInvitations,
  useCreateStaffInvitation,
  useResendInvitation,
  useCancelInvitation,
} from '../../api/team-management/queries/useStaffInvitationQueries';
import { useGetStaff } from '../../api/team-management/queries/useStaffQueries';
import { useGetFacilityRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import { useGetModules } from '../../api/team-management/queries/useModuleQueries';
import { useGetDepartmentsByFacility } from '../../api/department-managment/useDepartmentQueries';
import { useGetFacilitySpecificRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import type { InvitationStatus } from '../../api/team-management/types/staffInvitationTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

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

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  theme,
}) => {
  const isDark = theme === 'dark';
  
  // Get active facility from Redux store
  const activeFacilityId = useSelector(
    (state: RootState) => state.activeContext.activeFacilityId
  );
  
  // State management
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<number[]>([]);
  
  // Enhanced form state for secure staff lookup
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

    // Keep country code and last 2–3 digits
    const visibleDigits = 3;
    const cleaned = phone.replace(/\s+/g, '');

    if (cleaned.length <= visibleDigits) return cleaned;

    const maskedPart = '*'.repeat(cleaned.length - visibleDigits);
    const visiblePart = cleaned.slice(-visibleDigits);

    return maskedPart + visiblePart;
  }

  
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
  
  // Fetch staff (limited data for privacy)
  const { data: staffResponse, isLoading: staffLoading } = useGetStaff(
    { 
      limit: 100, // Increased limit for better search
      include_minimal: true // Request minimal data for privacy
    },
    { enabled: true } // Keep enabled for search functionality
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
  const { data: departmentsResponse, isLoading: departmentsLoading } = useGetDepartmentsByFacility(
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
  
  // Mutations
  const createMutation = useCreateStaffInvitation();
  const resendMutation = useResendInvitation();
  const cancelMutation = useCancelInvitation();
  
  // Enhanced staff lookup function
  const handleStaffUUIDLookup = useCallback(() => {
    setStaffLookupError('');
    
    if (!formData.staff_uuid.trim()) {
      setStaffLookupError('Please enter a staff number/UUID');
      return;
    }
    
    const searchTerm = formData.staff_uuid.trim().toLowerCase();
    
    // Search for staff by UUID, employee ID, or name
    const results = allStaff.filter(staff => {
      const uuidMatch = staff.staff_uuid?.toLowerCase().includes(searchTerm);
      const employeeIdMatch = staff.employee_id?.toLowerCase().includes(searchTerm);
      const nameMatch = staff.professional_title?.toLowerCase().includes(searchTerm);
      
      return uuidMatch || employeeIdMatch || nameMatch;
    });
    
    if (results.length === 0) {
      setStaffLookupError('No staff member found with that identifier. Please check the staff number and try again.');
      setFilteredStaff([]);
      setFormData(prev => ({ ...prev, staff_id: null }));
    } else if (results.length === 1) {
      // Auto-select if only one match
      setFormData(prev => ({ 
        ...prev, 
        staff_id: results[0].id,
        staff_uuid: results[0].staff_uuid // Update with correct UUID
      }));
      setStaffLookupMode('select');
      setFilteredStaff([results[0]]);
      setShowStaffDetails(true);
    } else {
      // Show selection list for multiple matches
      setFilteredStaff(results);
      setStaffLookupMode('select');
      setFormData(prev => ({ ...prev, staff_id: null }));
    }
  }, [formData.staff_uuid, allStaff]);
  
  // Handle staff selection from filtered results
  const handleStaffSelect = useCallback((staffId: number, staffUUID: string) => {
    setFormData(prev => ({ 
      ...prev, 
      staff_id: staffId,
      staff_uuid: staffUUID
    }));
    setStaffLookupError('');
    setShowStaffDetails(true);
  }, []);
  
  // Reset staff search
  const resetStaffSearch = useCallback(() => {
    setStaffLookupMode('search');
    setFormData(prev => ({ ...prev, staff_id: null, staff_uuid: '' }));
    setFilteredStaff([]);
    setStaffLookupError('');
    setShowStaffDetails(false);
  }, []);
  
  // Get selected staff details
  const selectedStaff = useMemo(() => {
    if (!formData.staff_id) return null;
    return allStaff.find(staff => staff.id === formData.staff_id);
  }, [formData.staff_id, allStaff]);
  
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
      staff_uuid: '',
      department_id: null,
      role_code: '',
      module_codes: [],
    });
    setFormErrors({});
    resetStaffSearch();
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
              <Shield className="w-6 h-6" />
              Secure Staff Invitations
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Privacy-focused invitation management system
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
          <LoadingSkeleton theme={theme} message='Loading staff invitations...' variant='default'></LoadingSkeleton>
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

                      {/* Secondary identity line (small, optional) */}
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {invitation.staff?.professional_title ? (
                          <span className="truncate">{invitation.staff.professional_title}</span>
                        ) : (
                          <span>Professional title not set</span>
                        )}
                        {invitation.staff?.staff_uuid ? (
                          <span className="mx-2">•</span>
                        ) : null}
                        {invitation.staff?.staff_uuid ? (
                          <span className="truncate">Staff No: {invitation.staff.staff_uuid}</span>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        invitation.status
                      )}`}
                    >
                      {getStatusIcon(invitation.status)}
                      {invitation.status
                        ? `Status: ${invitation.status.charAt(0).toUpperCase()}${invitation.status.slice(1)}`
                        : 'Status: Unknown'}
                    </span>
                  </div>

                  {/* Row 2: Context (Facility / Department / Role / Modules) */}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {/* Facility */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Facility: {invitation.facility?.facility_name || 'Not specified'}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Department: {invitation.department?.department_name || 'Not specified'}
                      </span>
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-2 min-w-0">
                      <UserPlus className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Role: {invitation.role?.name || 'Not specified'}
                      </span>
                    </div>

                    {/* Modules */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Modules:{' '}
                        {Array.isArray(invitation.module_code) && invitation.module_code.length > 0
                          ? `${invitation.module_code.length} module${
                              invitation.module_code.length !== 1 ? 's' : ''
                            }`
                          : 'Not specified'}
                      </span>
                    </div>

                    {/* Sent */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Sent: {formatDate(invitation.sent_at || invitation.created_at)}
                      </span>
                    </div>

                    {/* Expires */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        Expires: {invitation.expires_at ? formatDate(invitation.expires_at) : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>

                  {/* RIGHT: Actions (only when pending) */}
                  {invitation.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                <LoadingSkeleton variant='form' theme={theme} message='Loading form data...'/>
              ) : (
                <>
                  {/* Staff Lookup Section */}
                  <div className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Key className="w-5 h-5 text-blue-500" />
                      Staff Lookup
                    </h4>
                    
                    {staffLookupMode === 'search' ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Enter Staff Number(e.g ST-023...) *
                              <span className={`ml-2 text-xs ${
                                isDark ? 'text-gray-500' : 'text-gray-600'
                              }`}>
                                (Can also search by name or employee ID)
                              </span>
                            </label>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <Key className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                }`} />
                                <input
                                  type="text"
                                  value={formData.staff_uuid}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, staff_uuid: e.target.value }));
                                    setStaffLookupError('');
                                  }}
                                  placeholder="e.g., STF-12345 or staff name..."
                                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                                    staffLookupError
                                      ? 'border-red-500 focus:ring-red-500'
                                      : isDark 
                                      ? 'bg-gray-800 border-gray-700 text-white' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-2 focus:border-transparent`}
                                  onKeyDown={(e) => e.key === 'Enter' && handleStaffUUIDLookup()}
                                />
                              </div>
                              <button
                                onClick={handleStaffUUIDLookup}
                                disabled={!formData.staff_uuid.trim()}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
                            <p className={`mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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
                              {filteredStaff.length} Staff Member{filteredStaff.length !== 1 ? 's' : ''} Found
                            </h5>
                            <button
                              onClick={resetStaffSearch}
                              className={`text-sm flex items-center gap-1 ${
                                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3" />
                              New Search
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {filteredStaff.map((staff) => (
                              <div
                                key={staff.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  formData.staff_id === staff.id
                                    ? (isDark ? 'bg-blue-900/20 border-blue-700 ring-2 ring-blue-500/20' : 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20')
                                    : (isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-300 hover:border-gray-400')
                                }`}
                                onClick={() => handleStaffSelect(staff.id, staff.staff_uuid)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{staff.professional_title || 'Medical Staff'}</div>
                                    <div className={`text-sm mt-1 flex items-center gap-2 ${
                                      isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      <span className="inline-flex items-center gap-1">
                                        <Key className="w-3 h-3" />
                                      Staff Number:  {staff.staff_uuid}
                                      </span>
                                      {staff.employee_id && (
                                        <span className="inline-flex items-center gap-1">
                                          <Users className="w-3 h-3" />
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
                    <div className={`p-4 rounded-lg border ${
                      isDark ? 'bg-green-900/10 border-green-800' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-green-500" />
                          Selected Staff Member
                        </h5>
                        <button
                          onClick={() => setShowStaffDetails(!showStaffDetails)}
                          className={`p-1 rounded ${
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                          }`}
                        >
                          {showStaffDetails ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      
                      {showStaffDetails && (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <div className="space-y-2">
                            <div>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Name</div>
                              <div className="font-medium">{selectedStaff.user?.profile.full_name || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Staff Number</div>
                              <div className="font-mono font-medium">{selectedStaff.staff_uuid}</div>
                            </div>
                          </div>
                      <div className="space-y-2">
                          <div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Email</div>
                            <div>
                              {selectedStaff?.user?.contact?.email
                                ? maskEmail(selectedStaff.user.contact.email)
                                : 'Not specified'}
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Phone</div>
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
                disabled={createMutation.isPending || isFormLoading || !formData.staff_id}
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