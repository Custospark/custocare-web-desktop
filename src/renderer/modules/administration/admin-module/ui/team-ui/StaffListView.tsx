/**
 * ============================================================================
 * STAFF LIST VIEW COMPONENT
 * ============================================================================
 * 
 * Display comprehensive list of all staff members with sorting and filtering.
 * Integrates with StaffPermissionDrawer for permission management.
 * 
 * @component StaffListView
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  AlertTriangle,
  Eye,
  MoreVertical,
  Shield,
  X,
  UserCheck,
  UserX,
  Mail,
  Hash,
  Briefcase,
} from 'lucide-react';
import { useGetStaffForGivenFacility } from '../../api/team-management/queries/useStaffQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { StaffPermissionDrawer } from './StaffPermissionDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';

interface StaffListViewProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number;
  onStaffSelect: (staffId: number) => void;
  onCreateNew: () => void;
}

interface StaffInfoForDrawer {
  staff_id: number;
  staff_name: string;
  staff_uuid: string;
  employee_number: string;
  current_role_code: string;
  current_assignment_status: string;
}

export const StaffListView: React.FC<StaffListViewProps> = ({
  theme,
  facilityId,
  onStaffSelect,
}) => {
  const isDark = theme === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy] = useState<'name' | 'employee_id' | 'role'>('name');
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<StaffInfoForDrawer | null>(null);
  
  const { data: staffResponse, isLoading, refetch } = useGetStaffForGivenFacility(
    {
      facility_id: facilityId,
    },
    {
      enabled: !!facilityId,
    }
  );
  
  const staff = staffResponse?.data || [];
  
  // Client-side search and sort on loaded data
  const filteredAndSortedStaff = useMemo(() => {
    let result = [...staff];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => {
        const fullName = `${s.user?.profile.first_name} ${s.user?.profile.last_name}`.toLowerCase();
        return (
          fullName.includes(term) ||
          s.employee_id.toLowerCase().includes(term) ||
          s.user?.contact.email?.toLowerCase().includes(term) ||
          s.staff_uuid?.toLowerCase().includes(term)
        );
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.user?.profile.full_name || '').localeCompare(b.user?.profile.full_name || '');
      } else if (sortBy === 'employee_id') {
        return a.employee_id.localeCompare(b.employee_id);
      } else {
        return a.global_role_level.localeCompare(b.global_role_level);
      }
    });
    
    return result;
  }, [staff, searchTerm, sortBy]);
  
  // Handle clearing search
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  // Handle key down events for search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  };
  
  // Handle opening permissions drawer
  const handleOpenPermissions = (staffMember: any) => {
    // Extract current staff information
    const staffInfo: StaffInfoForDrawer = {
      staff_id: staffMember.id,
      staff_name: staffMember.staff_name || staffMember.user?.profile?.full_name || 'Staff Member',
      staff_uuid: staffMember.staff_uuid || '',
      employee_number: staffMember.employee_id || '',
      current_role_code: staffMember.facility_role_summary?.role_at_facility || '',
      current_assignment_status: staffMember.facility_role_summary?.assignment_status || '',
    };
    
    setSelectedStaffInfo(staffInfo);
    setIsDrawerOpen(true);
  };
  
  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Delay clearing selected staff to allow drawer animation to complete
    setTimeout(() => {
      setSelectedStaffInfo(null);
    }, 300);
  };
  
  // Handle successful update
  const handleDrawerSuccess = () => {
    handleDrawerClose();
    refetch();
  };
  
  // Calculate active filters count
  const activeFiltersCount = searchTerm ? 1 : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
            'group'
          )}
        >
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />

          <div className="relative p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Icon with background */}
                <div className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isDark 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                    : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
                )}>
                  <Users className={cn(
                    'w-6 h-6 sm:w-7 sm:h-7',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    Staff Members
                    <span className={cn(
                      'text-sm font-medium px-2.5 py-1 rounded-full',
                      isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    )}>
                      {filteredAndSortedStaff.length} total
                    </span>
                  </h2>
                  <p className={cn(
                    'text-sm mt-1',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Manage and configure staff permissions
                  </p>
                </div>
              </div>

              {/* Active filters indicator */}
              {activeFiltersCount > 0 && (
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                )}>
                  <span className="font-medium">{activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}</span>
                  <button
                    onClick={handleClearSearch}
                    className={cn(
                      'p-0.5 rounded-full transition-colors cursor-pointer',
                      isDark ? 'hover:bg-blue-800/50' : 'hover:bg-blue-100'
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Enhanced Search Bar with Clear Button - Animated gradient design */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Animated border search container */}
          <div className="relative flex-1 min-w-0">
            {/* gradient border track */}
            <motion.div
              className="absolute inset-0 rounded-xl z-0"
              style={{
                background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{
                duration: isFocused ? 2 : 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* inner surface with 2-px gap to reveal gradient */}
            <div className="relative z-10 m-[2px] rounded-[10px] overflow-hidden">
              <Search
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                  isFocused 
                    ? 'text-blue-500' 
                    : isDark 
                      ? 'text-gray-500' 
                      : 'text-gray-400'
                )}
              />
              <input
                type="text"
                placeholder="Search staff by staff number, name, email or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  'w-full pl-10 pr-10 py-3 text-sm border-transparent',
                  'focus:outline-none focus:ring-0',
                  'transition-colors placeholder:text-sm',
                  isDark
                    ? 'bg-gray-900 text-white placeholder-gray-500'
                    : 'bg-white text-gray-900 placeholder-gray-400'
                )}
              />
              
              {/* Clear Search Button (Cross Icon) */}
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className={cn(
                    'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full',
                    'transition-colors cursor-pointer',
                    isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Search Hint (only visible when there's a search term) */}
            <AnimatePresence>
              {searchTerm && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    'absolute -bottom-5 left-2 text-[10px]',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  Press ESC to clear • {filteredAndSortedStaff.length} result{filteredAndSortedStaff.length !== 1 ? 's' : ''}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Results Summary - Only shown when there's a search term */}
          <AnimatePresence>
            {searchTerm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl',
                  'border-2 transition-all',
                  isDark 
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 text-blue-300' 
                    : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 text-blue-700',
                  'group cursor-pointer transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20'
                )}
              >
                {/* Icon with background */}
                <div className={cn(
                  'p-1.5 rounded-lg transition-all duration-300',
                  isDark 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                    : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
                )}>
                  <Search className={cn(
                    'w-3.5 h-3.5',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                
                {/* Results text */}
                <span className="text-sm font-medium">
                  Found {filteredAndSortedStaff.length} result{filteredAndSortedStaff.length !== 1 ? 's' : ''}
                </span>
                
                {/* Clear button */}
                <button
                  onClick={handleClearSearch}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                    'transition-all cursor-pointer border',
                    isDark 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50' 
                      : 'bg-blue-100 border-blue-200 text-blue-600 hover:bg-blue-200 hover:border-blue-300'
                  )}
                  type="button"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Staff Table with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
          )}
        >
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton variant='table' theme={theme}/>
            </div>
          ) : filteredAndSortedStaff.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 sm:p-12 text-center"
            >
              <div className={cn(
                'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                <Users className={cn(
                  'w-10 h-10',
                  isDark ? 'text-gray-600' : 'text-gray-400'
                )} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                {searchTerm ? 'No matching staff found' : 'No Staff Found'}
              </h3>
              <p className={cn(
                'text-sm mb-6 max-w-md mx-auto',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {searchTerm ? (
                  <>
                    No staff members match "<span className="font-semibold">{searchTerm}</span>"
                  </>
                ) : 'No staff members to display. Invite staff to your facility and they will appear here.'}
              </p>
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    'border-2 transition-all cursor-pointer',
                    isDark 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 text-blue-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20' 
                      : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 text-blue-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20',
                    'transform hover:-translate-y-0.5'
                  )}
                  type="button"
                >
                  <X className="w-4 h-4" />
                  Clear search and show all staff
                </button>
              )}
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className={cn(
                    'border-b-2',
                    isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                  )}>
                    <th className={cn(
                      'px-4 py-4 text-left text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Staff Name
                      </div>
                    </th>
                    <th className={cn(
                      'px-4 py-4 text-center text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <div className="flex items-center justify-center gap-2">
                        <Hash className="w-4 h-4" />
                        Staff Number
                      </div>
                    </th>
                    <th className={cn(
                      'px-4 py-4 text-center text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </th>
                    <th className={cn(
                      'px-4 py-4 text-center text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <div className="flex items-center justify-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Title
                      </div>
                    </th>
                    <th className={cn(
                      'px-4 py-4 text-center text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Status
                    </th>
                    <th className={cn(
                      'px-4 py-4 text-center text-xs sm:text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className={cn(
                  'divide-y',
                  isDark ? 'divide-gray-800' : 'divide-gray-200'
                )}>
                  {filteredAndSortedStaff.map((staffMember, index) => {
                    const name = staffMember.staff_name || staffMember.user?.profile?.full_name || 'Staff Member';
                    const staffNo = staffMember.staff_uuid || '';
                    const email = staffMember.user?.contact?.email || null;
                    const roleLabel = staffMember.facility_role_summary?.role_at_facility;
                    const employmentStatus = (staffMember.facility_role_summary?.assignment_status)?.toUpperCase() || '';
                    const hasExpired = !!staffMember.has_expired_license;

                    return (
                      <motion.tr
                        key={staffMember.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'transition-all duration-200',
                          isDark 
                            ? 'hover:bg-gray-800/60 hover:shadow-inner' 
                            : 'hover:bg-gray-50/80 hover:shadow-sm',
                          'group/row'
                        )}
                      >
                        {/* Staff Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-9 w-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0',
                              'border-2 transition-all duration-300 group-hover/row:scale-110',
                              isDark 
                                ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-blue-500/30 text-gray-200 group-hover/row:border-blue-500/50' 
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 border-blue-200 text-gray-700 group-hover/row:border-blue-400'
                            )}>
                              {(name?.[0] || 'S').toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className={cn(
                                'text-sm font-semibold truncate',
                                isDark ? 'text-gray-100' : 'text-gray-900'
                              )}>
                                {name}
                              </div>
                              {staffMember.professional_title && (
                                <div className={cn(
                                  'text-xs truncate',
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                )}>
                                  {staffMember.professional_title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Staff Number */}
                        <td className="px-4 py-3 text-center">
                          <code className={cn(
                            'inline-flex px-2 py-1 rounded-lg text-xs font-mono',
                            'border transition-all',
                            isDark 
                              ? 'bg-gray-800/80 border-gray-700 text-gray-300 group-hover/row:border-blue-500/30' 
                              : 'bg-gray-100 border-gray-200 text-gray-700 group-hover/row:border-blue-300'
                          )}>
                            {staffNo}
                          </code>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'text-xs sm:text-sm truncate block max-w-[200px] mx-auto',
                            isDark ? 'text-gray-300' : 'text-gray-700',
                            !email && (isDark ? 'text-gray-500' : 'text-gray-400')
                          )}>
                            {email || 'Not specified'}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                            'border transition-all',
                            isDark 
                              ? 'bg-blue-900/20 border-blue-500/30 text-blue-300 group-hover/row:bg-blue-900/30 group-hover/row:border-blue-500/50' 
                              : 'bg-blue-50 border-blue-200 text-blue-700 group-hover/row:bg-blue-100 group-hover/row:border-blue-300'
                          )}>
                            {roleLabel}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                              'border transition-all',
                              employmentStatus === 'ACTIVE'
                                ? isDark
                                  ? 'bg-green-900/20 border-green-500/30 text-green-300'
                                  : 'bg-green-50 border-green-200 text-green-700'
                                : isDark
                                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                                  : 'bg-gray-100 border-gray-200 text-gray-700'
                            )}>
                              {employmentStatus === 'ACTIVE' ? (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3 mr-1" />
                                  {employmentStatus.replace(/_/g, ' ')}
                                </>
                              )}
                            </span>

                            {hasExpired && (
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                                'border transition-all',
                                isDark 
                                  ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300' 
                                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                              )}>
                                <AlertTriangle className="w-3 h-3" />
                                License expired
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* View details */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onStaffSelect(staffMember.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium',
                                'border-2 transition-all cursor-pointer',
                                isDark
                                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 text-blue-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20' 
                                  : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 text-blue-700 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20',
                                'transform hover:-translate-y-0.5'
                              )}
                              title="View details"
                              type="button"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </motion.button>

                            {/* Modify permissions */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleOpenPermissions(staffMember)}
                              className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium',
                                'border-2 transition-all cursor-pointer',
                                isDark
                                  ? 'bg-gradient-to-br from-purple-900/30 to-gray-900 border-purple-500/30 text-purple-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20' 
                                  : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 text-purple-700 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20',
                                'transform hover:-translate-y-0.5'
                              )}
                              title="Modify permissions"
                              type="button"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="hidden sm:inline">Permissions</span>
                            </motion.button>

                            {/* More options */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                'p-2 rounded-lg transition-all cursor-pointer',
                                'border-2',
                                isDark
                                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-gray-300 hover:border-gray-600 hover:shadow-lg hover:shadow-gray-500/20' 
                                  : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-500/10',
                                'transform hover:-translate-y-0.5'
                              )}
                              title="More options"
                              type="button"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>

                {/* Table footer with summary */}
                <tfoot className={cn(
                  'border-t-2',
                  isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'
                )}>
                  <tr>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          Showing {filteredAndSortedStaff.length} of {staff.length} staff members
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                            Active: {filteredAndSortedStaff.filter(s => s.facility_role_summary?.assignment_status === 'active').length}
                          </span>
                          <span className={cn(
                            'w-1 h-1 rounded-full',
                            isDark ? 'bg-gray-600' : 'bg-gray-300'
                          )} />
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                            Inactive: {filteredAndSortedStaff.filter(s => s.facility_role_summary?.assignment_status !== 'active').length}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Permissions Drawer - Render when selectedStaffInfo exists */}
      <AnimatePresence>
        {selectedStaffInfo && (
          <StaffPermissionDrawer
            theme={theme}
            open={isDrawerOpen}
            staffInfo={selectedStaffInfo}
            facilityId={facilityId}
            onClose={handleDrawerClose}
            onSuccess={handleDrawerSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default StaffListView;