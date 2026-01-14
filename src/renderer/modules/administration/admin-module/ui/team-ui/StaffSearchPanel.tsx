/**
 * ============================================================================
 * STAFF SEARCH PANEL COMPONENT
 * ============================================================================
 * 
 * Advanced search interface for finding existing staff members with filters.
 * Supports search by name, email, employee ID, and professional details.
 * 
 * @component StaffSearchPanel
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  User,
  Mail,
  Phone,
  Badge,
  Briefcase,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGetStaff } from '../../api/team-management/queries/useStaffQueries';

import type { StaffFilters, EmploymentStatus, GlobalRoleLevel } from  '../../api/team-management/types/staffTypes';

interface StaffSearchPanelProps {
  theme: 'light' | 'dark';
  facilityId: number;
  onStaffSelect: (staffId: number) => void;
  onCreateNew: () => void;
}

export const StaffSearchPanel: React.FC<StaffSearchPanelProps> = ({
  theme,
  facilityId,
  onStaffSelect,
  onCreateNew,
}) => {
  const isDark = theme === 'dark';
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StaffFilters>({
    facility_id: facilityId,
    employment_status: 'employed' as EmploymentStatus,
  });
  
  // Fetch staff with filters
  const { data: staffResponse, isLoading, error } = useGetStaff(filters, {
    enabled: true,
    staleTime: 1000 * 30, // 30 seconds
  });
  
  const staff = staffResponse?.data || [];
  
  // Filter by search term (client-side for instant feedback)
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staff;
    
    const term = searchTerm.toLowerCase();
    return staff.filter(s => {
      const fullName = `${s.user?.first_name} ${s.user?.last_name}`.toLowerCase();
      const email = s.user?.email?.toLowerCase() || '';
      const phone = s.user?.phone?.toLowerCase() || '';
      const employeeId = s.employee_id.toLowerCase();
      const title = s.professional_title?.toLowerCase() || '';
      
      return (
        fullName.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        employeeId.includes(term) ||
        title.includes(term)
      );
    });
  }, [staff, searchTerm]);
  
  // Handle filter changes
  const handleFilterChange = (key: keyof StaffFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      facility_id: facilityId,
      employment_status: 'employed' as EmploymentStatus,
    });
    setSearchTerm('');
  };
  
  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              showFilters
                ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {/* Clear Filters */}
          {(searchTerm || Object.keys(filters).length > 2) && (
            <button
              onClick={handleClearFilters}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className={`mt-4 pt-4 border-t ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Employment Status Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Employment Status
                </label>
                <select
                  value={filters.employment_status || ''}
                  onChange={(e) => handleFilterChange('employment_status', e.target.value as EmploymentStatus)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">All Status</option>
                  <option value="employed">Employed</option>
                  <option value="suspended">Suspended</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="terminated">Terminated</option>
                  <option value="retired">Retired</option>
                  <option value="credentialing_pending">Credentialing Pending</option>
                </select>
              </div>
              
              {/* Role Level Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role Level
                </label>
                <select
                  value={filters.global_role_level || ''}
                  onChange={(e) => handleFilterChange('global_role_level', e.target.value as GlobalRoleLevel)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">All Roles</option>
                  <option value="attending_physician">Attending Physician</option>
                  <option value="fellow">Fellow</option>
                  <option value="resident">Resident</option>
                  <option value="nurse_practitioner">Nurse Practitioner</option>
                  <option value="physician_assistant">Physician Assistant</option>
                  <option value="registered_nurse">Registered Nurse</option>
                  <option value="licensed_practical_nurse">Licensed Practical Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="therapist">Therapist</option>
                  <option value="technician">Technician</option>
                  <option value="support_staff">Support Staff</option>
                </select>
              </div>
              
              {/* Accepting Patients Filter */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Patient Acceptance
                </label>
                <select
                  value={filters.accepts_new_patients?.toString() || ''}
                  onChange={(e) => handleFilterChange('accepts_new_patients', e.target.value === 'true')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">All</option>
                  <option value="true">Accepting New Patients</option>
                  <option value="false">Not Accepting</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Results Section */}
      <div className={`rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Results Header */}
        <div className={`p-4 border-b ${
          isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({filteredStaff.length})
            </h3>
            {filteredStaff.length === 0 && !isLoading && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                Create New Staff
              </button>
            )}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center">
            <div className={`inline-flex items-center gap-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Searching staff...
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="p-12 text-center">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
            <h3 className="text-lg font-medium mb-2">Search Error</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {error.message || 'Failed to search staff members'}
            </p>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && filteredStaff.length === 0 && (
          <div className="p-12 text-center">
            <Search className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium mb-2">No Staff Found</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchTerm
                ? `No results found for "${searchTerm}". Try adjusting your search.`
                : 'No staff members match your filters.'}
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              Create New Staff Member
            </button>
          </div>
        )}
        
        {/* Results List */}
        {!isLoading && !error && filteredStaff.length > 0 && (
          <div className="divide-y divide-gray-800">
            {filteredStaff.map((staffMember) => (
              <button
                key={staffMember.id}
                onClick={() => onStaffSelect(staffMember.id)}
                className={`w-full p-4 text-left transition-colors ${
                  isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name and Title */}
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {staffMember.professional_title && `${staffMember.professional_title} `}
                        {staffMember.user?.full_name}
                      </h4>
                      {staffMember.is_active && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                        }`}>
                          Active
                        </span>
                      )}
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                      {staffMember.employee_id && (
                        <div className={`flex items-center gap-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Badge className="w-4 h-4" />
                          <span>{staffMember.employee_id}</span>
                        </div>
                      )}
                      
                      {staffMember.user?.email && (
                        <div className={`flex items-center gap-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{staffMember.user.email}</span>
                        </div>
                      )}
                      
                      {staffMember.user?.phone && (
                        <div className={`flex items-center gap-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Phone className="w-4 h-4" />
                          <span>{staffMember.user.phone}</span>
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-2 text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Briefcase className="w-4 h-4" />
                        <span className="truncate capitalize">
                          {staffMember.global_role_level.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {staffMember.accepts_new_patients && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Accepting Patients
                        </span>
                      )}
                      
                      {staffMember.has_expired_license && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          License Expired
                        </span>
                      )}
                      
                      {staffMember.can_supervise_trainees && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                        }`}>
                          Supervisor
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Indicator */}
                  <div className="flex-shrink-0">
                    <ChevronDown className={`w-5 h-5 transform -rotate-90 ${
                      isDark ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSearchPanel;