/**
 * ============================================================================
 * INVITATION MANAGER COMPONENT
 * ============================================================================
 * 
 * Manage staff invitations - create, resend, cancel, and track status.
 * 
 * @component InvitationManager
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  useGetStaffInvitations,
  useResendInvitation,
  useCancelInvitation,
} from '../../../api/team/queries/useStaffInvitationQueries';

import type { InvitationStatus } from '../../../api/team/types/staffInvitationTypes';

interface InvitationManagerProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number;
  onInvitationSent: () => void;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  theme,
  facilityId,
}) => {
  const isDark = theme === 'dark';
  
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [setShowCreateModal] = useState(false);
  
  // Fetch invitations
  const { data: invitationsResponse, isLoading, refetch } = useGetStaffInvitations(
    {
      facility_id: facilityId,
      status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: !!facilityId,
    }
  );
  
  const invitations = invitationsResponse?.data || [];
  
  // Mutations
  const resendMutation = useResendInvitation();
  const cancelMutation = useCancelInvitation();
  
  const handleResend = (id: number) => {
    resendMutation.mutate({ id }, {
      onSuccess: () => refetch(),
    });
  };
  
  const handleCancel = (id: number) => {
    cancelMutation.mutate({ id }, {
      onSuccess: () => refetch(),
    });
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
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Staff Invitations
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage pending and sent invitations for facility staff
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Invitation
          </button>
        </div>
        
        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search invitations..."
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
            onClick={() => refetch()}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Invitations List */}
      <div className={`rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className={`inline-flex items-center gap-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading invitations...
            </div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium mb-2">No Invitations Found</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} invitations to display.`
                : 'Send your first staff invitation to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`p-4 transition-colors ${
                  isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">
                        {invitation.staff?.professional_title} {invitation.staff?.employee_id}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(invitation.status)
                      }`}>
                        {getStatusIcon(invitation.status)}
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className={`text-sm space-y-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <div>Facility: {invitation.facility?.facility_name}</div>
                      {invitation.department && (
                        <div>Department: {invitation.department.department_name}</div>
                      )}
                      <div>Role: {invitation.role?.name}</div>
                      <div>Sent: {new Date(invitation.sent_at || invitation.created_at).toLocaleDateString()}</div>
                      {invitation.expires_at && (
                        <div>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  
                  {invitation.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResend(invitation.id)}
                        disabled={resendMutation.isPending}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Resend invitation"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        disabled={cancelMutation.isPending}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-200 text-red-600'
                        }`}
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;