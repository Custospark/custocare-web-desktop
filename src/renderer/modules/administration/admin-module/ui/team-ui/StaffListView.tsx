/**
 * ============================================================================
 * STAFF LIST VIEW COMPONENT
 * ============================================================================
 * 
 * Display comprehensive list of all staff members with sorting and filtering.
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
} from 'lucide-react';
import { useGetStaffForGivenFacility } from '../../api/team-management/queries/useStaffQueries';
import type { EmploymentStatus } from '../../api/team-management/types/staffTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

interface StaffListViewProps {
  theme: 'light' | 'dark';
  facilityId: number;
  refreshKey: number;
  staffId:number;
  onStaffSelect: (staffId: number) => void;
  onCreateNew: () => void;
}

export const StaffListView: React.FC<StaffListViewProps> = ({
  theme,
  facilityId,
  onStaffSelect,
  onCreateNew,
}) => {
  const isDark = theme === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'employee_id' | 'role'>('name');
  
  const { data: staffResponse, isLoading } = useGetStaffForGivenFacility(
    {
      facility_id: facilityId,
      employment_status: statusFilter === 'all' ? undefined : statusFilter,
    },
    {
      enabled: !!facilityId,
    }
  );
  
  const staff = staffResponse?.data || [];
  
  const filteredAndSortedStaff = useMemo(() => {
    let result = [...staff];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => {
        const fullName = `${s.user?.first_name} ${s.user?.last_name}`.toLowerCase();
        return (
          fullName.includes(term) ||
          s.employee_id.toLowerCase().includes(term) ||
          s.user?.email?.toLowerCase().includes(term)
        );
      });
    }
    
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.user?.full_name || '').localeCompare(b.user?.full_name || '');
      } else if (sortBy === 'employee_id') {
        return a.employee_id.localeCompare(b.employee_id);
      } else {
        return a.global_role_level.localeCompare(b.global_role_level);
      }
    });
    
    return result;
  }, [staff, searchTerm, sortBy]);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Staff Members ({filteredAndSortedStaff.length})
          </h2>
          
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Staff Member
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search staff..."
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
            onChange={(e) => setStatusFilter(e.target.value as EmploymentStatus | 'all')}
            className={`px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="all">All Status</option>
            <option value="employed">Employed</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'employee_id' | 'role')}
            className={`px-3 py-2 rounded-lg border ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-gray-50 border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="name">Sort by Name</option>
            <option value="employee_id">Sort by ID</option>
            <option value="role">Sort by Role</option>
          </select>
        </div>
      </div>
      
      {/* Staff Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {isLoading ? (
          <LoadingSkeleton variant='table' theme={theme}/>
        ) : filteredAndSortedStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium mb-2">No Staff Found</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm ? 'No staff match your search.' : 'No staff members to display.'}
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Professional Number
                  </th>

                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Title
                  </th>

                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </th>

                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {filteredAndSortedStaff.map((staffMember) => (
                    <tr
                      key={staffMember.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Professional Number */}
                      <td className="px-4 py-3">
                        <code className={`px-2 py-1 rounded text-sm ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {staffMember.staff_uuid}
                        </code>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">
                          {staffMember.global_role_level.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {staffMember.has_expired_license ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isDark
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            License Expired
                          </span>
                        ) : (
                          <span className={`text-xs ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onStaffSelect(staffMember.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-200 text-gray-600'
                            }`}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400'
                                : 'hover:bg-gray-200 text-gray-600'
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

          </div>
        )}
      </div>
    </div>
  );
};

export default StaffListView;