/**
 * ============================================================================
 * STAFF DETAIL VIEW COMPONENT
 * ============================================================================
 * 
 * Comprehensive detail view for individual staff members with edit capabilities.
 * 
 * @component StaffDetailView
 */

import React, { JSX } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Badge,
  Briefcase,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PauseCircle,
  Ban,
  HelpCircle,
  Users,
  Stethoscope,
  FileText,
  Pill,
  Building,
} from 'lucide-react';
import { useGetStaffById } from '../../api/team-management/queries/useStaffQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface StaffDetailViewProps {
  theme: 'light' | 'dark';
  staffId: number;
  facilityId: number;
  onBack?: () => void;
  refreshKey?: number;
  onStaffSelect?: number;
}

export const StaffDetailView: React.FC<StaffDetailViewProps> = ({
  theme,
  staffId,
  onBack,
}) => {
  const isDark = theme === 'dark';
  
  const { data: staffResponse, isLoading } = useGetStaffById(staffId, {
    enabled: !!staffId,
  });
  
  const staff = staffResponse;
  
  if (isLoading) {
    return (
      <LoadingSkeleton variant='table' theme={theme} message='Loading staff details...' />
    );
  }

  const assignmentStatus = staff?.facility_role_summary?.assignment_status ?? 'unknown';

  const statusConfig: Record<string, { label: string; icon: JSX.Element; classes: string }> = {
    active: {
      label: 'Active',
      icon: <CheckCircle className="w-4 h-4" />,
      classes: isDark
        ? 'bg-green-900/30 text-green-300 border border-green-700/30'
        : 'bg-green-100 text-green-800 border border-green-200',
    },
    inactive: {
      label: 'Inactive',
      icon: <XCircle className="w-4 h-4" />,
      classes: isDark
        ? 'bg-gray-900/30 text-gray-300 border border-gray-700/30'
        : 'bg-gray-100 text-gray-800 border border-gray-200',
    },
    suspended: {
      label: 'Suspended',
      icon: <PauseCircle className="w-4 h-4" />,
      classes: isDark
        ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    },
    terminated: {
      label: 'Terminated',
      icon: <Ban className="w-4 h-4" />,
      classes: isDark
        ? 'bg-red-900/30 text-red-300 border border-red-700/30'
        : 'bg-red-100 text-red-800 border border-red-200',
    },
    pending: {
      label: 'Pending',
      icon: <Clock className="w-4 h-4" />,
      classes: isDark
        ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30'
        : 'bg-blue-100 text-blue-800 border border-blue-200',
    },
  };

  const formatJoinedOn = (value?: string | null) => {
    if (!value) return 'Not specified';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Not specified';

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  const status =
    assignmentStatus && statusConfig[assignmentStatus]
      ? statusConfig[assignmentStatus]
      : {
          label: 'Unknown',
          icon: <HelpCircle className="w-4 h-4" />,
          classes: isDark
            ? 'bg-gray-900/30 text-gray-400 border border-gray-700/30'
            : 'bg-gray-100 text-gray-600 border border-gray-200',
        };
  
  if (!staff) {
    return (
      <div className={`rounded-xl p-12 text-center border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
          <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Staff Member Not Found</h3>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          The requested staff member could not be loaded.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to List
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        {onBack && (
          <div className="mb-6">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff List
        </button>
      </div>
        )}
        
        {/* Profile Overview */}
        <div className="flex items-start gap-5">
          {/* Profile Avatar */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
            isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            {staff.user?.profile.first_name?.[0]}{staff.user?.profile.last_name?.[0]}
          </div>
          
          {/* Profile Details */}
          <div className="flex-1">
            <div className="mb-3">
              <h2 className="text-2xl font-bold">
                {staff.professional_title && `${staff.professional_title} `}
                {staff.user?.profile.full_name}
              </h2>
              <p className={`mt-1 text-sm font-medium capitalize ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {staff.facility_role_summary?.role_at_facility.replace(/_/g, ' ')}
              </p>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {/* Assignment Status */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.classes}`}>
                {status.icon}
                {status.label}
              </span>

              {/* Supervisor */}
              {staff.can_supervise_trainees && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isDark 
                    ? 'bg-purple-900/20 text-purple-300 border border-purple-700/20' 
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  Supervisor
                </span>
              )}

              {/* License Expired */}
              {staff.has_expired_license && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isDark 
                    ? 'bg-red-900/20 text-red-300 border border-red-700/20' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  License Expired
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className={`rounded-xl p-5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <User className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Email</div>
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {staff.user?.contact.email || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Phone</div>
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {staff.user?.contact.phone || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Staff ID</div>
                <code className={`px-3 py-1.5 rounded-md text-sm font-mono ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  {staff.staff_uuid}
                </code>
              </div>
            </div>
          </div>
        </div>
        
        {/* Employment Details */}
        <div className={`rounded-xl p-5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Briefcase className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            Employment Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Employment Status</div>
                <div className={`font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {staff.employment_status.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Joined On</div>
                <div className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {formatJoinedOn(staff.facility_role_summary?.created_at)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Employment Type</div>
                <div className={`font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {staff.employment_type.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Department Assignments */}
        <div className={`rounded-xl p-5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Building className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            Department Assignments
          </h3>
          
          <div>
            <div className={`text-xs font-medium uppercase tracking-wide mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Assigned Departments
            </div>
            {(staff.facility_role_summary?.departments?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.facility_role_summary?.departments?.map((dept) => (
                  <span
                    key={dept.department_uuid}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isDark
                        ? 'bg-blue-900/20 text-blue-300 border border-blue-700/20'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                    title={`${dept.department_name} (${dept.department_code})`}
                  >
                    {dept.department_name}
                  </span>
                ))}
              </div>
            ) : (
              <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                No departments assigned
              </span>
            )}
          </div>
        </div>
        
        {/* Clinical Capabilities */}
        <div className={`rounded-xl p-5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-teal-900/30' : 'bg-teal-100'}`}>
              <Stethoscope className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
            </div>
            Clinical Capabilities
          </h3>
          
            <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark 
                ? 'bg-gray-800/60 text-gray-200 border border-gray-700/50' 
                : 'bg-gray-50 text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className="font-medium">Supervise Trainees</span>
              </div>
              {staff.can_supervise_trainees ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark 
                ? 'bg-gray-800/60 text-gray-200 border border-gray-700/50' 
                : 'bg-gray-50 text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <Pill className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className="font-medium">Order Controlled Substances</span>
              </div>
              {staff.can_order_controlled_substances ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark 
                ? 'bg-gray-800/60 text-gray-200 border border-gray-700/50' 
                : 'bg-gray-50 text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span className="font-medium">Sign Death Certificates</span>
              </div>
              {staff.can_sign_death_certificates ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              isDark 
                ? 'bg-gray-800/60 text-gray-200 border border-gray-700/50' 
                : 'bg-gray-50 text-gray-800 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <User className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className="font-medium">Accept New Patients</span>
              </div>
              {staff.accepts_new_patients ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailView;