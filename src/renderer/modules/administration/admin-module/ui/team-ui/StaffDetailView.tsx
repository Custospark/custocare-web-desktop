/**
 * ============================================================================
 * STAFF DETAIL VIEW COMPONENT
 * ============================================================================
 * 
 * Comprehensive detail view for individual staff members with edit capabilities.
 * 
 * @component StaffDetailView
 */

import React from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Badge,
  Briefcase,
  Calendar,
  Shield,
  Award,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useGetStaffById } from '../../api/team-management/queries/useStaffQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface StaffDetailViewProps {
  theme: 'light' | 'dark';
  staffId:number;
  facilityId: number;
  onBack?: () => void;
  onEdit?: () => void;
  refreshKey?:number;
  onStaffSelect?:number;

}

export const StaffDetailView: React.FC<StaffDetailViewProps> = ({
  theme,
  staffId,
  onBack,
  onEdit,
}) => {
  const isDark = theme === 'dark';
  
  const { data: staffResponse, isLoading } = useGetStaffById(staffId, {
    enabled: !!staffId,
  });
  
  const staff = staffResponse;
  
  if (isLoading) {
    return (
      <LoadingSkeleton variant='table' theme={theme} message='Loading staff details..' />);
  }
  
  if (!staff) {
    return (
      <div className={`rounded-xl p-12 text-center border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${
          isDark ? 'text-yellow-400' : 'text-yellow-600'
        }`} />
        <h3 className="text-lg font-medium mb-2">Staff Member Not Found</h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          The requested staff member could not be loaded.
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <button
            onClick={onBack}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600'
              }`}
              title="Delete staff"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
            isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            {staff.user?.first_name?.[0]}{staff.user?.last_name?.[0]}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {staff.professional_title && `${staff.professional_title} `}
              {staff.user?.full_name}
            </h2>
            <p className={`mt-1 capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {staff.global_role_level.replace(/_/g, ' ')}
            </p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                staff.is_active
                  ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                  : (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
              }`}>
                {staff.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
              
              {staff.accepts_new_patients && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  Accepting Patients
                </span>
              )}
              
              {staff.can_supervise_trainees && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                }`}>
                  Supervisor
                </span>
              )}
              
              {staff.has_expired_license && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                  License Expired
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</div>
                <div>{staff.user?.email || 'Not provided'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</div>
                <div>{staff.user?.phone || 'Not provided'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Professional Number</div>
                <code className={`px-2 py-1 rounded text-sm ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {staff.staff_uuid}
                </code>
              </div>
            </div>
          </div>
        </div>
        
        {/* Employment Details */}
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Employment Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Employment Status</div>
                <div className="capitalize">{staff.employment_status.replace(/_/g, ' ')}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Hire Date</div>
                <div>{staff.hire_date ? new Date(staff.hire_date).toLocaleDateString() : 'Not specified'}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Employment Type</div>
                <div className="capitalize">{staff.employment_type.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Professional Info */}
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Information
          </h3>
          
          <div className="space-y-3">
            {staff.specialization_codes && staff.specialization_codes.length > 0 && (
              <div>
                <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Specializations
                </div>
                <div className="flex flex-wrap gap-2">
                  {staff.specialization_codes.map((spec, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-sm ${
                        isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {staff.board_certifications && staff.board_certifications.length > 0 && (
              <div>
                <div className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Board Certifications
                </div>
                <div className="flex flex-wrap gap-2">
                  {staff.board_certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-sm ${
                        isDark ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {staff.npi_number && (
              <div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>NPI Number</div>
                <code className={`px-2 py-1 rounded text-sm ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {staff.npi_number}
                </code>
              </div>
            )}
          </div>
        </div>
        
        {/* Clinical Capabilities */}
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-4">Clinical Capabilities</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Can Supervise Trainees</span>
              {staff.can_supervise_trainees ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Can Order Controlled Substances</span>
              {staff.can_order_controlled_substances ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Can Sign Death Certificates</span>
              {staff.can_sign_death_certificates ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Accepts New Patients</span>
              {staff.accepts_new_patients ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailView;