import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
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
  UserPlus,
  X,
} from 'lucide-react';

import { 
  selectActiveVisitId, 
  selectActiveVisit,
  clearActiveVisit
} from '../../../../app/store/slices/visitSlice';
import { useAssignStaffToVisit, useGetStaffForForwarding } from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';
import { 
  type AssignStaffToVisitRequest,
  type StaffForwardingFilters,
  type ForwardingStaff,
  StaffPresenceStatus
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { getRoleDisplayName as formatRole } from '../../../../shared/utils/facilityRoleFormator';

const forwardPatientSchema = z.object({
  assigned_staff_id: z.number().min(1, 'Please select a staff member'),
  note: z.string().max(500).optional(),
});

type ForwardPatientFormData = z.infer<typeof forwardPatientSchema>;

interface ForwardPatientProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  theme?: 'light' | 'dark';
  currentStaffId?: number;
}

export const ForwardPatient: React.FC<ForwardPatientProps> = ({
  onSuccess,
  onCancel,
  theme = 'light',
  currentStaffId,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSideSearchTerm, setClientSideSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'busy' | 'on_duty' | 'available'>('available');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  const initialFilters: StaffForwardingFilters = useMemo(() => ({
    exclude_current_staff: !!currentStaffId,
    limit: 100,
  }), [currentStaffId]);
  
  const { 
    data: staffData, 
    isLoading: isLoadingStaff, 
    isError: isStaffError,
    error: staffError,
    refetch: refetchStaff 
  } = useGetStaffForForwarding(initialFilters);
  
  const assignMutation = useAssignStaffToVisit({
    onSuccess: (data) => {
      console.log('Staff assigned successfully:', data);
      dispatch(clearActiveVisit());
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Failed to assign staff:', error);
    },
  });
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ForwardPatientFormData>({
    resolver: zodResolver(forwardPatientSchema),
    mode: 'onChange',
    defaultValues: {
      assigned_staff_id: 0,
      note: '',
    },
  });
  
  const selectedStaffId = watch('assigned_staff_id');
  
  const staffMembers: ForwardingStaff[] = useMemo(() => {
    if (!staffData?.data?.staff || !Array.isArray(staffData.data.staff)) return [];
    return staffData.data.staff;
  }, [staffData]);
  
  useEffect(() => {
    if (staffMembers.length > 0 && !hasLoadedInitialData) {
      setHasLoadedInitialData(true);
    }
  }, [staffMembers, hasLoadedInitialData]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setClientSideSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const clearSearch = () => {
    setSearchTerm('');
    setClientSideSearchTerm('');
  };
  
  const filteredStaff = useMemo(() => {
    let staff = staffMembers;
    
    if (clientSideSearchTerm.trim()) {
      const searchLower = clientSideSearchTerm.toLowerCase().trim();
      staff = staff.filter(staff => 
        staff.full_name?.toLowerCase().includes(searchLower) ||
        staff.employee_id?.toLowerCase().includes(searchLower) ||
        staff.role_code?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterStatus === 'available') {
      staff = staff.filter(staff => staff.is_available);
    } else if (filterStatus === 'on_duty') {
      staff = staff.filter(staff => staff.presence_status === StaffPresenceStatus.ON_DUTY);
    } else if (filterStatus === 'busy') {
      staff = staff.filter(staff => staff.presence_status === StaffPresenceStatus.BUSY);
    }
    
    return staff.sort((a, b) => {
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1;
      }
      
      const statusOrder = { 
        [StaffPresenceStatus.ON_DUTY]: 0, 
        [StaffPresenceStatus.BUSY]: 1, 
        [StaffPresenceStatus.ON_BREAK]: 2, 
        [StaffPresenceStatus.UNAVAILABLE]: 3, 
        [StaffPresenceStatus.OFF_DUTY]: 4 
      };
      const aOrder = statusOrder[a.presence_status] ?? 5;
      const bOrder = statusOrder[b.presence_status] ?? 5;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      return a.workload_percentage - b.workload_percentage;
    });
  }, [staffMembers, clientSideSearchTerm, filterStatus]);
  
  const selectedStaff = useMemo(() => {
    return filteredStaff.find(staff => staff.staff_id === selectedStaffId);
  }, [filteredStaff, selectedStaffId]);
  
  const summaryData = useMemo(() => {
    if (staffMembers.length === 0) return null;
    
    const available = staffMembers.filter(staff => staff.is_available).length;
    const busy = staffMembers.filter(staff => staff.presence_status === StaffPresenceStatus.BUSY).length;
    const total = staffMembers.length;
    
    return { available, busy, total };
  }, [staffMembers]);
  
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
      console.error('Failed to assign staff:', error);
    }
  };
  
  useEffect(() => {
    reset({
      assigned_staff_id: 0,
      note: '',
    });
  }, [visitId, reset]);
  
  const handleFilterChange = (status: typeof filterStatus) => {
    setFilterStatus(status);
    setValue('assigned_staff_id', 0, { shouldValidate: true });
  };
  
  const handleStaffSelect = (staffId: number, canReceive: boolean) => {
    if (canReceive) {
      setValue('assigned_staff_id', staffId, { shouldValidate: true });
    }
  };
  
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
      accent: isDark ? 'bg-blue-600' : 'bg-blue-600',
      accentHover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
      accent: isDark ? 'border-blue-500' : 'border-blue-500',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: 'text-white',
    },
    status: {
      on_duty: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'On Duty' },
      busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Busy' },
      on_break: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'On Break' },
      unavailable: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Unavailable' },
      off_duty: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Off Duty' },
    },
  };
  
  const getStatusInfo = (status: StaffPresenceStatus) => {
    const statusInfo = colors.status[status] || colors.status.off_duty;
    const icon = {
      [StaffPresenceStatus.ON_DUTY]: <CheckCircle2 className="w-4 h-4" />,
      [StaffPresenceStatus.BUSY]: <Activity className="w-4 h-4" />,
      [StaffPresenceStatus.ON_BREAK]: <Clock className="w-4 h-4" />,
      [StaffPresenceStatus.UNAVAILABLE]: <XCircle className="w-4 h-4" />,
      [StaffPresenceStatus.OFF_DUTY]: <XCircle className="w-4 h-4" />,
    }[status] || <XCircle className="w-4 h-4" />;
    
    return { ...statusInfo, icon };
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
          <UserPlus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>Forward Patient</h2>
            <p className={colors.text.secondary}>
              Assign patient to another staff member
            </p>
          </div>
          {hasLoadedInitialData && (
            <div className={`text-xs px-2 py-1 rounded cursor-default ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'}`}>
           ✓ Staff directory updated • {staffMembers.length} active members
            </div>
          )}
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
                placeholder={hasLoadedInitialData 
                  ? "Search staff by name, staff number, or role..." 
                  : "Search staff by name, staff number, or role..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
              />
              {hasLoadedInitialData && clientSideSearchTerm && (
                <>
                  <div className={`absolute right-12 top-1/2 -translate-y-1/2 text-xs ${colors.text.tertiary} cursor-default`}>
                    {filteredStaff.length} results
                  </div>
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${colors.bg.hover} transition-colors cursor-pointer`}
                    title="Clear search"
                    aria-label="Clear search results"
                  >
                    <X className={`w-4 h-4 ${colors.text.tertiary} hover:${colors.text.primary}`} />
                  </button>
                </>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${colors.text.secondary} cursor-default`}>Filter by status:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'available' as const, label: 'Available' },
                  { value: 'on_duty' as const, label: 'On Duty' },
                  { value: 'busy' as const, label: 'Busy' },
                  { value: 'all' as const, label: 'All Staff' },
                ].map(({ value, label }) => {
                  const isActive = filterStatus === value;
                  
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleFilterChange(value)}
                      disabled={!hasLoadedInitialData}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? `${
                              value === 'available' ? 'bg-green-500/10 text-green-600' :
                              value === 'on_duty' ? 'bg-green-500/10 text-green-600' :
                              value === 'busy' ? 'bg-yellow-500/10 text-yellow-600' :
                              'bg-gray-500/10 text-gray-600'
                            } border ${isDark ? 'border-gray-600' : 'border-gray-300'}`
                          : `${colors.bg.hover} ${colors.text.secondary} border ${colors.border.primary}`
                      } ${!hasLoadedInitialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {value !== 'all' && (
                        value === 'available' ? <CheckCircle2 className="w-4 h-4" /> :
                        value === 'on_duty' ? <CheckCircle2 className="w-4 h-4" /> :
                        value === 'busy' ? <Activity className="w-4 h-4" /> :
                        <Users className="w-4 h-4" />
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Staff Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${colors.text.secondary} cursor-default`}>
              Select Staff Member to Forward To <span className="text-red-500">*</span>
              <span className={`block text-xs mt-1 ${colors.text.tertiary} cursor-default`}>
                Staff must be available to receive patients (On Duty or Busy with capacity)
              </span>
            </label>
            
            {isLoadingStaff ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className="ml-3 text-gray-500 cursor-default">Loading staff...</span>
              </div>
            ) : isStaffError ? (
              <div className={`py-8 text-center rounded-lg border ${colors.border.primary}`}>
                <AlertCircle className={`w-12 h-12 mx-auto mb-4 text-red-500`} />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary} cursor-default`}>
                  Failed to Load Staff
                </h3>
                <p className={colors.text.secondary}>
                  Unable to load staff list. Please try again.
                </p>
                
                {process.env.NODE_ENV === 'development' && staffError && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-default">
                      Debug Information (Development Only):
                    </p>
                    <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      {staffError.response?.data?.message && (
                        <p className="break-words cursor-default">
                          <span className="font-medium">Message:</span> {staffError.response.data.message}
                        </p>
                      )}
                      {staffError.response?.data?.errors && (
                        <div>
                          <p className="font-medium mt-1 cursor-default">Validation Errors:</p>
                          <ul className="list-disc list-inside ml-2">
                            {Object.entries(staffError.response.data.errors).map(([field, messages]) => (
                              <li key={field} className="break-words cursor-default">
                                <span className="font-medium">{field}:</span>{" "}
                                {Array.isArray(messages) ? messages.join(', ') : messages}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!staffError.response?.data?.message && !staffError.response?.data?.errors && staffError.message && (
                        <p className="break-words cursor-default">
                          <span className="font-medium">Error:</span> {staffError.message}
                        </p>
                      )}
                      {staffError.response?.status && (
                        <p className="text-gray-600 dark:text-gray-400 cursor-default">
                          Status: {staffError.response.status}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => refetchStaff()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
                <Users className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary} cursor-default`}>
                  {searchTerm ? 'No Matching Staff Found' : 'No Staff Available'}
                </h3>
                <p className={colors.text.secondary}>
                  {searchTerm
                    ? 'No loaded staff match your search criteria'
                    : 'No staff are available to receive patients'}
                </p>
                {searchTerm && hasLoadedInitialData && (
                  <>
                    <p className={`mt-2 text-sm ${colors.text.tertiary} cursor-default`}>
                      Showing {filteredStaff.length} of {staffMembers.length} loaded staff members
                    </p>
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                {filteredStaff.map((staff) => {
                  const statusInfo = getStatusInfo(staff.presence_status);
                  const isSelected = selectedStaffId === staff.staff_id;
                  const canReceive = staff.is_available;
                  
                  return (
                    <div
                      key={staff.staff_id}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? `${isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`
                          : `${colors.border.primary} ${colors.bg.hover}`
                      } ${!canReceive ? 'opacity-50' : 'cursor-pointer'}`}
                      onClick={() => handleStaffSelect(staff.staff_id, canReceive)}
                      role="button"
                      tabIndex={canReceive ? 0 : -1}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStaffSelect(staff.staff_id, canReceive);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className={`w-4 h-4 ${colors.text.tertiary}`} />
                            <h4 className={`font-semibold truncate ${colors.text.primary} cursor-pointer`}>
                              {staff.full_name}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text} cursor-default`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`${colors.text.secondary} cursor-default`}>Staff Number: {staff.staff_uuid}</span>
                              <span className={`${colors.text.secondary} cursor-default`}>Role: {formatRole(staff.role_code)}</span>
                            </div>
                            
                            {staff.current_space && (
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <DoorClosed className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={`${colors.text.secondary} cursor-default`}>
                                    {staff.current_space.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building className={`w-4 h-4 ${colors.text.tertiary}`} />
                                  <span className={`${colors.text.secondary} cursor-default`}>
                                    {staff.current_space.type}
                                    {staff.current_space.floor && `, Floor ${staff.current_space.floor}`}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Activity className={`w-4 h-4 ${colors.text.tertiary}`} />
                                <span className={`${colors.text.secondary} cursor-default`}>
                                  Workload: {staff.current_patient_count}/{staff.max_concurrent_patients}
                                </span>
                              </div>
                              <div className={`${colors.text.secondary} cursor-default`}>
                                Capacity: {staff.workload_percentage}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          ) : (
                            <div className={`w-6 h-6 rounded-full border ${colors.border.primary} cursor-pointer`} />
                          )}
                        </div>
                      </div>
                      
                      {!canReceive && (
                        <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-default">
                            <AlertCircle className="w-3 h-3" />
                            {staff.availability_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {summaryData && (
              <div className="mt-4 flex gap-3 text-sm">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded cursor-default">
                  Available: {summaryData.available}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded cursor-default">
                  Busy: {summaryData.busy}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded cursor-default">
                  Total: {summaryData.total}
                </span>
                {clientSideSearchTerm && filteredStaff.length !== summaryData.total && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded cursor-default">
                    Filtered: {filteredStaff.length}
                  </span>
                )}
              </div>
            )}
            
            {errors.assigned_staff_id && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1 cursor-default">
                <AlertCircle className="w-4 h-4" />
                {errors.assigned_staff_id.message}
              </p>
            )}
          </div>
          
          {selectedStaff && (
            <div className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
              <h4 className={`text-sm font-medium mb-3 ${colors.text.secondary} cursor-default`}>
                Forwarding to:
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${colors.text.tertiary} cursor-default`}>Staff Member</p>
                  <p className={`font-medium ${colors.text.primary} cursor-default`}>{selectedStaff.full_name}</p>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary} cursor-default`}>Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusInfo(selectedStaff.presence_status).icon}
                    <span className={`font-medium ${colors.text.primary} cursor-default`}>
                      {getStatusInfo(selectedStaff.presence_status).label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary} cursor-default`}>Location</p>
                  <p className={`font-medium ${colors.text.primary} cursor-default`}>
                    {selectedStaff.current_space?.name || 'No room assigned'}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${colors.text.tertiary} cursor-default`}>Workload</p>
                  <p className={`font-medium ${colors.text.primary} cursor-default`}>
                    {selectedStaff.current_patient_count}/{selectedStaff.max_concurrent_patients} patients
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${colors.text.secondary} cursor-default`}>
              Forwarding Notes (Optional)
            </label>
            <textarea
              {...register('note')}
              placeholder="Add any notes about why you're forwarding this patient..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text`}
            />
            {errors.note && (
              <p className="mt-2 text-sm text-red-500 cursor-default">{errors.note.message}</p>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              disabled={assignMutation.isPending}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${
                colors.border.primary
              } ${colors.bg.hover} ${
                colors.text.secondary
              } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || assignMutation.isPending || !selectedStaffId || isSubmitting}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                !isValid || assignMutation.isPending || !selectedStaffId || isSubmitting
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.bg.accent} ${colors.bg.accentHover} ${colors.text.accent} cursor-pointer`
              }`}
            >
              {assignMutation.isPending || isSubmitting ? (
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