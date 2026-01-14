/**
 * ============================================================================
 * INVITATION CARD COMPONENT
 * ============================================================================
 * 
 * Displays a single invitation with complete details including facility info,
 * role assignment, modules, and metadata. Supports expanded/collapsed states.
 * 
 * @component InvitationCard
 * @description Enterprise-grade invitation card with theme support
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Briefcase,
  Grid,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
} from 'lucide-react';

import type { StaffInvitation } from '../../administration/admin-module/api/team-management/types/staffInvitationTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InvitationCardProps {
  invitation: StaffInvitation;
  theme: 'light' | 'dark';
  actionSlot?: React.ReactNode;
}

interface ExpiryStatus {
  text: string;
  color: string;
  bgColor: string;
  urgent: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  theme,
  actionSlot,
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /* --------------------------- Helper Functions --------------------------- */

  const formatDate = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const formatDateTime = useCallback((dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const getExpiryStatus = useCallback((): ExpiryStatus => {
    if (!invitation.expires_at) {
      return { 
        text: 'No Expiry', 
        color: isDark ? 'text-gray-400' : 'text-gray-600',
        bgColor: isDark ? 'bg-gray-900/30' : 'bg-gray-50',
        urgent: false
      };
    }

    const daysUntilExpiry = invitation.days_until_expiry;

    if (daysUntilExpiry === null || daysUntilExpiry === undefined || daysUntilExpiry < 0) {
      return { 
        text: 'Expired', 
        color: isDark ? 'text-red-400' : 'text-red-600',
        bgColor: isDark ? 'bg-red-900/30' : 'bg-red-50',
        urgent: true
      };
    }

    if (daysUntilExpiry <= 3) {
      return { 
        text: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`, 
        color: isDark ? 'text-orange-400' : 'text-orange-600',
        bgColor: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
        urgent: true
      };
    }

    if (daysUntilExpiry <= 7) {
      return { 
        text: `Expires in ${daysUntilExpiry} days`, 
        color: isDark ? 'text-yellow-400' : 'text-yellow-600',
        bgColor: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50',
        urgent: false
      };
    }

    return { 
      text: `Expires in ${daysUntilExpiry} days`, 
      color: isDark ? 'text-green-400' : 'text-green-600',
      bgColor: isDark ? 'bg-green-900/30' : 'bg-green-50',
      urgent: false
    };
  }, [invitation.expires_at, invitation.days_until_expiry, isDark]);

  const getRoleDisplayName = useCallback((roleCode?: string | null): string => {
    if (!roleCode) return '—';

    return roleCode
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  const toggleExpanded = useCallback((): void => {
    setIsExpanded(prev => !prev);
  }, []);

  const expiryStatus = useMemo(() => getExpiryStatus(), [getExpiryStatus]);

  /* ------------------------------- Render --------------------------------- */

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
        isDark 
          ? 'bg-gray-900 border-gray-800 hover:border-gray-700' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      } ${expiryStatus.urgent ? 'ring-2 ring-opacity-50 ' + (isDark ? 'ring-orange-400/20' : 'ring-orange-500/20') : ''}`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Facility Name */}
            <div className="flex items-center gap-2 mb-2">
              <Building2 className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className="text-lg font-semibold truncate">
                {invitation.facility?.facility_name || 'Unknown Facility'}
              </h3>
            </div>

            {/* Facility Code & Department */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {invitation.facility?.facility_code || 'N/A'}
              </span>
              {invitation.department && (
                <>
                  <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>•</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {invitation.department.department_name}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4" />
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
              }`}>
                {invitation.role?.name || getRoleDisplayName(invitation.role_code)}
              </span>
            </div>

            {/* Modules */}
            {invitation.modules && invitation.modules.length > 0 && (
              <div className="flex items-start gap-2">
                <Grid className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className="flex flex-wrap gap-1.5">
                  {invitation.modules.map((module) => (
                    <span
                      key={module.code}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {module.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expiry Status Badge */}
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${expiryStatus.bgColor} ${expiryStatus.color}`}>
              {expiryStatus.urgent ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {expiryStatus.text}
            </span>
          </div>
        </div>

        {/* Timestamp Info */}
        <div className={`flex flex-wrap items-center gap-4 mt-4 pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-1.5">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Sent: {formatDate(invitation.sent_at)}
            </span>
          </div>
          {invitation.expires_at && (
            <>
              <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Expires: {formatDate(invitation.expires_at)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons Slot */}
        {actionSlot && (
          <div className="mt-4">
            {actionSlot}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={toggleExpanded}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Show less details' : 'View more details'}
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Show Less' : 'View Details'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={`border-t px-5 py-4 ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invitation Details */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Invitation Details
              </h4>
              <dl className="space-y-2">
                <div>
                  <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Invitation ID
                  </dt>
                  <dd className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {invitation.invitation_uuid.slice(0, 8)}...
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Status
                  </dt>
                  <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Sent At
                  </dt>
                  <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatDateTime(invitation.sent_at)}
                  </dd>
                </div>
                {invitation.reminder_sent_at && (
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Last Reminder
                    </dt>
                    <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatDateTime(invitation.reminder_sent_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Invited By */}
            {invitation.invited_by && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Invited By
                </h4>
                <dl className="space-y-2">
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Professional Title
                    </dt>
                    <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {invitation.invited_by.professional_title || 'Staff Member'}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Professional Number
                    </dt>
                    <dd className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {invitation.invited_by.staff_uuid}
                    </dd>
                  </div>
                  {invitation.invited_by.global_role_level && (
                    <div>
                      <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Role
                      </dt>
                      <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {getRoleDisplayName(invitation.invited_by.global_role_level)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Role Details */}
            {invitation.role && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Role Details
                </h4>
                <dl className="space-y-2">
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Role Name
                    </dt>
                    <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {invitation.role.name}
                    </dd>
                  </div>
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Role Code
                    </dt>
                    <dd className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {invitation.role.code}
                    </dd>
                  </div>
                  {invitation.role.description && (
                    <div>
                      <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Description
                      </dt>
                      <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {invitation.role.description}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Facility Information */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Facility Information
              </h4>
              <dl className="space-y-2">
                <div>
                  <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Facility Name
                  </dt>
                  <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {invitation.facility?.facility_name || 'Unknown Facility'}
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Facility Code
                  </dt>
                  <dd className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {invitation.facility?.facility_code || 'N/A'}
                  </dd>
                </div>
                {invitation.department && (
                  <div>
                    <dt className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Department
                    </dt>
                    <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {invitation.department.department_name}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvitationCard;
