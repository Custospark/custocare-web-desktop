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
  Briefcase,
  User,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import type { StaffInvitation } from '../../../administration/admin-module/api/team-management/types/staffInvitationTypes';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

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

  const expiryStatus = useMemo((): ExpiryStatus => {
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

  const statusConfig = useMemo(() => {
    switch (invitation.status) {
      case 'pending':
        return {
          label: 'Pending',
          classes: isDark
            ? 'bg-amber-900/30 text-amber-300 border border-amber-800'
            : 'bg-amber-100 text-amber-800 border border-amber-200',
          icon: <Clock className="w-3 h-3" />
        };
      case 'accepted':
        return {
          label: 'Accepted',
          classes: isDark
            ? 'bg-green-900/30 text-green-300 border border-green-800'
            : 'bg-green-100 text-green-800 border border-green-200',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'declined':
        return {
          label: 'Declined',
          classes: isDark
            ? 'bg-red-900/30 text-red-300 border border-red-800'
            : 'bg-red-100 text-red-800 border border-red-200',
          icon: <XCircle className="w-3 h-3" />
        };
      case 'expired':
        return {
          label: 'Expired',
          classes: isDark
            ? 'bg-gray-800 text-gray-300 border border-gray-700'
            : 'bg-gray-200 text-gray-700 border border-gray-300',
          icon: <AlertCircle className="w-3 h-3" />
        };
      default:
        return {
          label: 'Unknown',
          classes: isDark
            ? 'bg-gray-800 text-gray-300 border border-gray-700'
            : 'bg-gray-100 text-gray-700 border border-gray-300',
          icon: <AlertCircle className="w-3 h-3" />
        };
    }
  }, [invitation.status, isDark]);

  const getRoleDisplayName = useCallback((roleCode?: string | null): string => {
    if (!roleCode) return '—';
    return roleCode
      .replace(/[_-]+/g, ' ')
      .toUpperCase();
  }, []);

  const toggleExpanded = useCallback((): void => {
    setIsExpanded(prev => !prev);
  }, []);

  /* ------------------------------- Render --------------------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
        isDark 
          ? 'bg-linear-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
          : 'bg-linear-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300',
        expiryStatus.urgent && (isDark ? 'ring-2 ring-orange-500/20' : 'ring-2 ring-orange-500/20')
      )}
    >
      {/* Background decoration */}
      <div className={cn(
        'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100',
        isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
      )} />

      <div className="relative p-5">
        {/* Top Row: Facility + Status */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              'p-2 rounded-lg transition-all',
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            )}>
              <Building2 className={cn(
                'w-5 h-5',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
            </div>

            <div className="min-w-0">
              <div className={cn(
                'text-xs mb-1',
                isDark ? 'text-gray-500' : 'text-gray-500'
              )}>
                Inviting Facility
              </div>

              <h3 className="text-lg font-bold truncate">
                {invitation.facility?.facility_name || 'Unknown Facility'}
              </h3>

              {/* Invited as */}
              {invitation.role_code && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    'text-xs',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Invited as
                  </span>

                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      isDark
                        ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800'
                        : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    )}
                  >
                    {getRoleDisplayName(invitation.role_code)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2',
              statusConfig.classes
            )}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        {/* Timestamp Info */}
        <div className={cn(
          'flex flex-wrap items-center gap-4 py-3 px-4 rounded-lg',
          isDark ? 'bg-gray-800/50' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-1.5">
            <Calendar className={cn(
              'w-4 h-4',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )} />
            <span className={cn(
              'text-sm',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              {formatDate(invitation.sent_at)}
            </span>
          </div>

          {/* {invitation.expires_at && (
            <>
              <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className={cn(
                  'w-4 h-4',
                  expiryStatus.urgent
                    ? isDark ? 'text-orange-400' : 'text-orange-600'
                    : isDark ? 'text-gray-500' : 'text-gray-400'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  expiryStatus.color
                )}>
                  {expiryStatus.text}
                </span>
              </div>
            </>
          )} */}
        </div>

        {/* Action Buttons Slot */}
        {actionSlot && (
          <div className="mt-4 flex justify-end">
            {actionSlot}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={toggleExpanded}
          className={cn(
            'mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all',
            'border-2',
            isDark
              ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
            'cursor-pointer'
          )}
          aria-expanded={isExpanded}
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Show Less Details' : 'View Full Details'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'border-t-2 overflow-hidden',
              isDark ? 'border-gray-700' : 'border-gray-200'
            )}
          >
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invitation Details */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    )}>
                      <Mail className={cn(
                        'w-4 h-4',
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      )} />
                    </div>
                    Invitation Details
                  </h4>
                  <div className={cn(
                    'space-y-3 p-4 rounded-lg border-2',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                  )}>
                    <div className="flex justify-between">
                      <span className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        Status
                      </span>
                      <span className={cn(
                        'text-sm font-medium flex items-center gap-1',
                        statusConfig.classes.split(' ').slice(0, 2).join(' ')
                      )}>
                        {statusConfig.icon}
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        Sent At
                      </span>
                      <span className={cn(
                        'text-sm',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {formatDateTime(invitation.sent_at)}
                      </span>
                    </div>
                    {invitation.reminder_sent_at && (
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Last Reminder
                        </span>
                        <span className={cn(
                          'text-sm',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {formatDateTime(invitation.reminder_sent_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invited By */}
                {invitation.invited_by && (
                  <div>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-lg',
                        isDark ? 'bg-green-500/20' : 'bg-green-100'
                      )}>
                        <User className={cn(
                          'w-4 h-4',
                          isDark ? 'text-green-400' : 'text-green-600'
                        )} />
                      </div>
                      Invited By
                    </h4>
                    <div className={cn(
                      'space-y-3 p-4 rounded-lg border-2',
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                    )}>
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Professional Title
                        </span>
                        <span className={cn(
                          'text-sm',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {invitation.invited_by.professional_title || 'Staff Member'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Staff Number
                        </span>
                        <span className={cn(
                          'text-sm font-mono',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {invitation.invited_by.staff_uuid}
                        </span>
                      </div>
                      {invitation.role_code && (
                        <div className="flex justify-between">
                          <span className={cn(
                            'text-xs',
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            Role
                          </span>
                          <span className={cn(
                            'text-sm',
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            {getRoleDisplayName(invitation.role_code)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Role Details */}
                {invitation.role && (
                  <div>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded-lg',
                        isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                      )}>
                        <Briefcase className={cn(
                          'w-4 h-4',
                          isDark ? 'text-purple-400' : 'text-purple-600'
                        )} />
                      </div>
                      Role Details
                    </h4>
                    <div className={cn(
                      'space-y-3 p-4 rounded-lg border-2',
                      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                    )}>
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Role Name
                        </span>
                        <span className={cn(
                          'text-sm font-medium',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {invitation.role.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Role Code
                        </span>
                        <code className={cn(
                          'text-sm font-mono px-2 py-0.5 rounded',
                          isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
                        )}>
                          {invitation.role.code}
                        </code>
                      </div>
                      {invitation.role.description && (
                        <div>
                          <span className={cn(
                            'text-xs block mb-1',
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            Description
                          </span>
                          <span className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {invitation.role.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Facility Information */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                    )}>
                      <Phone className={cn(
                        'w-4 h-4',
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      )} />
                    </div>
                    Facility Information
                  </h4>
                  <div className={cn(
                    'space-y-3 p-4 rounded-lg border-2',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                  )}>
                    <div className="flex justify-between">
                      <span className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        Facility Name
                      </span>
                      <span className={cn(
                        'text-sm font-medium',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {invitation.facility?.facility_name || 'Unknown Facility'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        Facility Number
                      </span>
                      <code className={cn(
                        'text-sm font-mono',
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {invitation.facility?.facility_code || 'N/A'}
                      </code>
                    </div>
                    {invitation.department && (
                      <div className="flex justify-between">
                        <span className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          Department
                        </span>
                        <span className={cn(
                          'text-sm',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {invitation.department.department_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Module Tags (if any) */}
              {invitation.module_code && Array.isArray(invitation.module_code) && invitation.module_code.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    )}>
                      <Shield className={cn(
                        'w-4 h-4',
                        isDark ? 'text-indigo-400' : 'text-indigo-600'
                      )} />
                    </div>
                    Access Permissions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {invitation.module_code.map((code) => (
                      <span
                        key={code}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                        )}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InvitationCard;