import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  DoorClosed,
  Loader2,
  Search,
  AlertCircle,
} from 'lucide-react';

import { RootState } from '../../../../app/store/rootReducer';
import { selectActiveVisitId, selectActiveVisit } from '../../../../app/store/slices/visitSlice';
import { useAssignStaffToVisit } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { AssignStaffToVisitRequest } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
// Import or define these types based on your project structure
interface StaffMember {
  id: number;
  staff_id: number;
  staff_uuid: string;
  employee_id: string;
  full_name: string;
  role_code: string;
  current_assignment?: {
    space: {
      name: string;
      type: string;
      building: string;
      floor: string;
    } | null;
  };
  presence_status?: string;
}

// Assuming you have a hook to fetch staff members
// If not, you'll need to create one
import { useGetStaffForAssignment } from '../../../administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';

// Form validation schema
const forwardPatientSchema = z.object({
  assigned_staff_id: z.number().min(1, 'Please select a staff member'),
  note: z.string().max(500).optional(),
});

type ForwardPatientFormData = z.infer<typeof forwardPatientSchema>;

interface ForwardPatientProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
}

export const ForwardPatient: React.FC<ForwardPatientProps> = ({
  onSuccess,
  onCancel,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  
  // Get current visit from Redux
  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'busy' | 'on_duty'>('all');
  
  // Fetch staff members
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const { data: staffData, isLoading: isLoadingStaff } = useGetStaffForAssignment(
    activeFacilityId || 0,
    { per_page: 100 },
    { enabled: !!activeFacilityId && activeFacilityId > 0 }
  );
  
  // Mutation for assigning staff to visit
  const assignMutation = useAssignStaffToVisit({
    onSuccess: (data) => {
      console.log(data);
      onSuccess?.();

    },
  });
  
  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ForwardPatientFormData>({
    resolver: zodResolver(forwardPatientSchema),
    mode: 'onChange',
    defaultValues: {
      assigned_staff_id: 0,
      note: '',
    },
  });
  
  const selectedStaffId = watch('assigned_staff_id');
  
  // Process and filter staff members
  const staffMembers: StaffMember[] = useMemo(() => {
    if (!staffData?.data || !Array.isArray(staffData.data)) return [];
    
    return staffData.data
      .filter((staff): staff is any => 
        staff && 
        typeof staff === 'object' && 
        'staff_id' in staff
      )
      .map(staff => ({
        id: staff.staff_id,
        staff_id: staff.staff_id,
        staff_uuid: staff.staff_uuid || '',
        employee_id: staff.employee_id || '',
        full_name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unknown Staff',
        role_code: staff.role_code || '',
        current_assignment: staff.current_assignment || undefined,
        presence_status: staff.presence_status || 'off_duty',
      }));
  }, [staffData]);
  
  // Filter staff based on search term and status
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(staff => {
      // Filter by status
      if (filterStatus === 'busy' && staff.presence_status !== 'busy') return false;
      if (filterStatus === 'on_duty' && staff.presence_status !== 'on_duty') return false;
      
      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          staff.full_name.toLowerCase().includes(term) ||
          staff.employee_id.toLowerCase().includes(term) ||
          staff.role_code.toLowerCase().includes(term) ||
          staff.current_assignment?.space?.name?.toLowerCase().includes(term) ||
          staff.current_assignment?.space?.building?.toLowerCase().includes(term)
        );
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by presence status: busy -> on_duty -> others
      const statusOrder = { busy: 0, on_duty: 1, on_break: 2, unavailable: 3, off_duty: 4 };
      const aOrder = statusOrder[a.presence_status as keyof typeof statusOrder] ?? 5;
      const bOrder = statusOrder[b.presence_status as keyof typeof statusOrder] ?? 5;
      return aOrder - bOrder;
    });
  }, [staffMembers, searchTerm, filterStatus]);
  
  // Get selected staff details
  const selectedStaff = useMemo(() => {
    return filteredStaff.find(staff => staff.id === selectedStaffId);
  }, [filteredStaff, selectedStaffId]);
  
  // Handle form submission
  const onSubmit = async (data: ForwardPatientFormData) => {
    if (!visitId) {
      console.error('No visit selected');
      return;
    }
    
    const request: AssignStaffToVisitRequest = {
      visit_id: visitId,
      assigned_staff_id: data.assigned_staff_id,
    };
    
    try {
      await assignMutation.mutateAsync({
        data: request,
      });
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to assign staff:', error);
    }
  };
  
  // Color tokens based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };
  
  // Get status display and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'busy':
        return { label: 'Busy', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <Activity className="w-4 h-4" /> };
      case 'on_duty':
        return { label: 'On Duty', color: 'text-green-500', bg: 'bg-green-500/10', icon: <CheckCircle2 className="w-4 h-4" /> };
      case 'on_break':
        return { label: 'On Break', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <Clock className="w-4 h-4" /> };
      case 'unavailable':
        return { label: 'Unavailable', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: <XCircle className="w-4 h-4" /> };
      default:
        return { label: 'Off Duty', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: <XCircle className="w-4 h-4" /> };
    }
  };
  
  if (!visitId || !activeVisit) {
    return (
      <div className={`rounded-xl p-8 text-center ${colors.bg.secondary}`}>
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
        <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>No Patient Selected</h3>
        <p className={colors.text.secondary}>
          Please select a patient to forward to another staff member.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center gap-3 mb-4">
          <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>Forward Patient</h2>
            <p className={colors.text.secondary}>
              Assign patient to another staff member
            </p>
          </div>
        </div>
        
        {/* Current Patient Info */}
        <div className={`p-4 rounded-lg ${colors.bg.secondary}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${colors.text.secondary}`}>Patient</p>
              <p className={`font-medium ${colors.text.primary}`}>
                {activeVisit.patient?.name || 'Unknown Patient'}
              </p>
            </div>
            <div>
              <p className={`text-sm ${colors.text.secondary}`}>Visit ID</p>
              <p className={`font-mono text-sm ${colors.text.primary}`}>
                {activeVisit.visit_uuid || 'N/A'}
              </p>
            </div>
            <div>
              <p className={`text-sm ${colors.text.secondary}`}>Current Phase</p>
              <p className={`font-medium ${colors.text.primary}`}>
                {activeVisit.current_phase?.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className={`text-sm ${colors.text.secondary}`}>Acuity</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  activeVisit.acuity_score <= 2 ? 'bg-red-500' :
                  activeVisit.acuity_score <= 3 ? 'bg-orange-500' :
                  activeVisit.acuity_score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className={`font-medium ${colors.text.primary}`}>
                  Level {activeVisit.acuity_score}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Search staff by name, ID, role, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${colors.text.secondary}`}>Filter by status:</span>
              <div className="flex flex-wrap gap-2">
                {['all', 'busy', 'on_duty'].map((status) => {
                  const isActive = filterStatus === status;
                  const statusInfo = getStatusInfo(status);
                  
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status as any)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? `${statusInfo.bg} ${statusInfo.color} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                          : `${colors.bg.hover} ${colors.text.secondary} border ${colors.border.primary}`
                      }`}
                    >
                      {status !== 'all' && statusInfo.icon}
                      <span>
                        {status === 'all' ? 'All Staff' : statusInfo.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Staff Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${colors.text.secondary}`}>
              Select Staff Member to Forward To <span className="text-red-500">*</span>
              <span className={`block text-xs mt-1 ${colors.text.tertiary}`}>
                Only staff with "Busy" or "On Duty" status can receive patients
              </span>
            </label>
            
            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
                <Users className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>
                  No Staff Available
                </h3>
                <p className={colors.text.secondary}>
                  {searchTerm
                    ? 'No staff match your search criteria'
                    : 'No staff are available to receive patients'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                {filteredStaff.map((staff) => {
                  const statusInfo = getStatusInfo(staff.presence_status || 'off_duty');
                  const isSelected = selectedStaffId === staff.id;
                  const canReceive = ['busy', 'on_duty'].includes(staff.presence_status || '');
                  
                  return (
                    <div
                      key={staff.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? `${isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`
                          : `${colors.border.primary} ${colors.bg.hover}`
                      } ${!canReceive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (canReceive) {
                          setValue('assigned_staff_id', staff.id, { shouldValidate: true });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Staff Name and Role */}
                          <div className="flex items-center gap-2 mb-2">
                            <User className={`w-4 h-4 ${colors.text.tertiary}`} />
                            <h4 className={`font-semibold truncate ${colors.text.primary}`}>
                              {staff.full_name}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          {/* Staff Details */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className={colors.text.secondary}>ID: {staff.employee_id}</span>
                              <span className={colors.text.secondary}>Role: {staff.role_code}</span>
                            </div>
                            
                            {/* Room Information */}
                            {staff.current_assignment?.space && (
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <DoorClosed className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={colors.text.secondary}>
                                    Room: {staff.current_assignment.space.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={colors.text.secondary}>
                                    {staff.current_assignment.space.building}
                                    {staff.current_assignment.space.floor && `, Floor ${staff.current_assignment.space.floor}`}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Work Status */}
                            <div className="flex items-center gap-2">
                              <Activity className={`w-4 h-4 ${colors.text.tertiary}`} />
                              <span className={`text-sm ${colors.text.secondary}`}>
                                {!staff.current_assignment?.space
                                  ? 'No room assigned'
                                  : `Available in ${staff.current_assignment.space.type}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          ) : (
                            <div className={`w-6 h-6 rounded-full border ${colors.border.primary}`} />
                          )}
                        </div>
                      </div>
                      
                      {/* Warning for unavailable staff */}
                      {!canReceive && (
                        <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            This staff member cannot receive patients in their current status
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {errors.assigned_staff_id && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.assigned_staff_id.message}
              </p>
            )}
          </div>
          
          {/* Selected Staff Preview */}
          {selectedStaff && (
            <div className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
              <h4 className={`text-sm font-medium mb-3 ${colors.text.secondary}`}>
                Forwarding to:
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Staff Member</p>
                  <p className={`font-medium ${colors.text.primary}`}>{selectedStaff.full_name}</p>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusInfo(selectedStaff.presence_status || '').icon}
                    <span className={`font-medium ${colors.text.primary}`}>
                      {getStatusInfo(selectedStaff.presence_status || '').label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Room</p>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {selectedStaff.current_assignment?.space?.name || 'No room assigned'}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary}`}>Location</p>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {selectedStaff.current_assignment?.space?.building || 'N/A'}
                    {selectedStaff.current_assignment?.space?.floor && `, Floor ${selectedStaff.current_assignment.space.floor}`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Additional Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
              Forwarding Notes (Optional)
            </label>
            <textarea
              {...register('note')}
              placeholder="Add any notes about why you're forwarding this patient..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.note && (
              <p className="mt-2 text-sm text-red-500">{errors.note.message}</p>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={assignMutation.isPending}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${
                colors.border.primary
              } ${colors.bg.hover} ${
                colors.text.secondary
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || assignMutation.isPending || !selectedStaffId}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                !isValid || assignMutation.isPending || !selectedStaffId
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
              }`}
            >
              {assignMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Forwarding...
                </span>
              ) : (
                'Forward Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForwardPatient;