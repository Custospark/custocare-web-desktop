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
} from 'lucide-react';
import { useGetStaffForGivenFacility } from '../../api/team-management/queries/useStaffQueries';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { StaffPermissionDrawer } from './StaffPermissionDrawer';

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
  
  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className={`rounded-xl p-4 sm:p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              Staff Members ({filteredAndSortedStaff.length})
            </h2>
          </div>
          
          {/* Enhanced Search Bar with Clear Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search staff by staf number,name, email or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              
              {/* Clear Search Button (Cross Icon) */}
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                  }`}
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Search Hint (only visible when there's a search term) */}
              {searchTerm && (
                <div className={`absolute -bottom-6 left-0 text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Press ESC to clear search
                </div>
              )}
            </div>
            
            {/* Results Summary */}
            {searchTerm && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                <span>Found {filteredAndSortedStaff.length} result{filteredAndSortedStaff.length !== 1 ? 's' : ''}</span>
             <button
                onClick={handleClearSearch}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer ${
                  isDark 
                    ? 'hover:bg-blue-800/30 text-blue-200' 
                    : 'hover:bg-blue-100 text-blue-600'
                } transition-colors`}
                type="button"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Staff Table */}
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {isLoading ? (
            <LoadingSkeleton variant='table' theme={theme}/>
          ) : filteredAndSortedStaff.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Users className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {searchTerm ? 'No matching staff found' : 'No Staff Found'}
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm ? (
                  <>
                    No staff members match "<span className="font-semibold">{searchTerm}</span>"
                    <button
                      onClick={handleClearSearch}
                      className={`ml-2 px-2 py-1 rounded text-sm cursor-pointer ${
                        isDark 
                          ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' 
                          : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'
                      } transition-colors`}
                      type="button"
                    >
                      Clear search and show all staff
                    </button>
                  </>
                ) : 'No staff members to display. Invite staff to your facility and they will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Staff Name
                    </th>
                    <th className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Staff Number
                    </th>
                    <th className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </th>
                    <th className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Title
                    </th>
                    <th className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </th>
                    <th className={`px-4 py-3 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {filteredAndSortedStaff.map((staffMember) => {
                    const name = staffMember.staff_name || staffMember.user?.profile?.full_name || 'Staff Member';
                    const staffNo = staffMember.staff_uuid || '';
                    const email = staffMember.user?.contact?.email || null;
                    const roleLabel = staffMember.facility_role_summary?.role_at_facility;
                    const employmentStatus = (staffMember.facility_role_summary?.assignment_status)?.toUpperCase() || '';
                    const hasExpired = !!staffMember.has_expired_license;

                    return (
                      <tr
                        key={staffMember.id}
                        className={`transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
                      >
                        {/* Staff Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 ${
                              isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {(name?.[0] || 'S').toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className={`text-xs sm:text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {name}
                              </div>
                              {staffMember.professional_title && (
                                <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {staffMember.professional_title}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Staff Number */}
                        <td className="px-4 py-3 text-center">
                          <code className={`inline-flex px-2 py-1 rounded text-xs ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {staffNo}
                          </code>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs sm:text-sm truncate block max-w-[200px] mx-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {email || <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Not specified</span>}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {roleLabel}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {employmentStatus.replace(/_/g, ' ')}
                            </span>

                            {hasExpired && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              }`}>
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
                            <button
                              onClick={() => onStaffSelect(staffMember.id)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                              }`}
                              title="View details"
                              type="button"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>

                            {/* Modify permissions */}
                            <button
                              onClick={() => handleOpenPermissions(staffMember)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                              title="Modify permissions"
                              type="button"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="hidden sm:inline">Permissions</span>
                            </button>

                            {/* More options */}
                            <button
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'hover:bg-blue-900/30 text-blue-300'
                                  : 'hover:bg-blue-100 text-blue-600'
                              }`}
                              title="More options"
                              type="button"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Drawer - Render when selectedStaffInfo exists */}
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
    </>
  );
};

export default StaffListView;