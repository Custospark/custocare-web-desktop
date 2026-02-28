/**
 * ============================================================================
 * INVITATION LIST COMPONENT
 * ============================================================================
 * 
 * Main container component for displaying and managing staff invitations.
 * Handles loading states, empty states, filtering, and real-time updates.
 * 
 * @component InvitationList
 * @description Enterprise-grade invitation management interface
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Mail, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Inbox,
  Filter,
  X,
  Building2,
  Calendar,
} from 'lucide-react';
import { useGetMyPendingInvitations } from '../../../administration/admin-module/api/team-management/queries/useStaffInvitationQueries';
import { InvitationCard } from './InvitationCard';
import { InvitationActions } from './InvitationActions';
import type { StaffInvitation } from '../../../administration/admin-module/api/team-management/types/staffInvitationTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InvitationListProps {
  theme: 'light' | 'dark';
  onInvitationSelect?: (invitation: StaffInvitation) => void;
}

type SortOption = 'date_desc' | 'date_asc' | 'facility_asc' | 'expiry_asc';
type FilterOption = 'all' | 'expiring_soon' | 'urgent';

interface FilterState {
  searchTerm: string;
  sortBy: SortOption;
  filterBy: FilterOption;
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const InvitationList: React.FC<InvitationListProps> = ({
  theme,
  onInvitationSelect,
}) => {
  const isDark = theme === 'dark';

  /* -------------------------------- State --------------------------------- */

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sortBy: 'date_desc',
    filterBy: 'all',
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);

  /* ------------------------------- Data Fetching -------------------------- */

  const { 
    data: response, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
  } = useGetMyPendingInvitations({
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  const invitations = response?.data || [];
  const totalCount = response?.meta?.total || 0;

  /* --------------------------- Filtering & Sorting ------------------------ */

  const filteredAndSortedInvitations = useMemo((): StaffInvitation[] => {
    let filtered = [...invitations];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();

      filtered = filtered.filter(inv => {
        const facilityName = inv.facility?.facility_name?.toLowerCase() || '';
        const facilityCode = inv.facility?.facility_code?.toLowerCase() || '';
        const roleName = inv.role?.name?.toLowerCase() || '';
        const roleCode = inv.role_code?.toLowerCase() || '';
        const deptName = inv.department?.department_name?.toLowerCase() || '';

        return (
          facilityName.includes(searchLower) ||
          facilityCode.includes(searchLower) ||
          roleName.includes(searchLower) ||
          roleCode.includes(searchLower) ||
          deptName.includes(searchLower)
        );
      });
    }

    // Status filter
    if (filters.filterBy === 'expiring_soon') {
      filtered = filtered.filter(inv => 
        inv.days_until_expiry !== null && inv.days_until_expiry !== undefined && inv.days_until_expiry <= 7
      );
    } else if (filters.filterBy === 'urgent') {
      filtered = filtered.filter(inv => 
        inv.days_until_expiry !== null && inv.days_until_expiry !== undefined && inv.days_until_expiry <= 3
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_asc': {
          const dateA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
          const dateB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
          return dateA - dateB;
        }
        case 'date_desc': {
          const dateA = a.sent_at ? new Date(a.sent_at).getTime() : 0;
          const dateB = b.sent_at ? new Date(b.sent_at).getTime() : 0;
          return dateB - dateA;
        }
        case 'facility_asc': {
          const nameA = a.facility?.facility_name || '';
          const nameB = b.facility?.facility_name || '';
          return nameA.localeCompare(nameB);
        }
        case 'expiry_asc': {
          const aExpiry = a.days_until_expiry ?? Infinity;
          const bExpiry = b.days_until_expiry ?? Infinity;
          return aExpiry - bExpiry;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [invitations, filters]);

  /* --------------------------- Summary Statistics ------------------------- */

  const stats = useMemo(() => {
    const urgentCount = invitations.filter(inv => 
      inv.days_until_expiry !== null && inv.days_until_expiry !== undefined && inv.days_until_expiry <= 3
    ).length;
    
    const expiringSoonCount = invitations.filter(inv => 
      inv.days_until_expiry !== null && inv.days_until_expiry !== undefined && inv.days_until_expiry <= 7
    ).length;

    return {
      total: totalCount,
      urgent: urgentCount,
      expiring_soon: expiringSoonCount,
    };
  }, [invitations, totalCount]);

  /* ----------------------------- Event Handlers --------------------------- */

  const handleRefresh = useCallback((): void => {
    refetch();
  }, [refetch]);

  const handleClearFilters = useCallback((): void => {
    setFilters({
      searchTerm: '',
      sortBy: 'date_desc',
      filterBy: 'all',
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as SortOption }));
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilters(prev => ({ ...prev, filterBy: e.target.value as FilterOption }));
  }, []);

  const toggleFilters = useCallback((): void => {
    setShowFilters(prev => !prev);
  }, []);

  const hasActiveFilters = 
    filters.searchTerm !== '' || 
    filters.sortBy !== 'date_desc' || 
    filters.filterBy !== 'all';

  /* ------------------------------- Render --------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Mail className="w-7 h-7" />
            My Invitations
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Review and respond to facility invitations
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefetching}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Invitations</p>
              <p className="text-2xl font-semibold mt-1">{stats.total}</p>
            </div>
            <Inbox className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
        
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Expiring Soon</p>
              <p className="text-2xl font-semibold mt-1">{stats.expiring_soon}</p>
            </div>
            <Calendar className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
        </div>
        
        <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Urgent</p>
              <p className="text-2xl font-semibold mt-1">{stats.urgent}</p>
            </div>
            <AlertCircle className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by facility, role, or department..."
                value={filters.searchTerm}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <button
              onClick={toggleFilters}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? (isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300')
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300')
              } border`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t" style={{
              borderColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
            }}>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="facility_asc">Facility A-Z</option>
                  <option value="expiry_asc">Expiring Soonest</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Filter By Status
                </label>
                <select
                  value={filters.filterBy}
                  onChange={handleFilterChange}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="all">All Invitations</option>
                  <option value="expiring_soon">Expiring Within 7 Days</option>
                  <option value="urgent">Urgent (≤3 Days)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <RefreshCw className={`w-12 h-12 animate-spin mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading invitations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <h3 className="mt-4 text-lg font-semibold">Error Loading Invitations</h3>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
          </p>
          <button
            onClick={handleRefresh}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedInvitations.length === 0 && (
        <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <Building2 className={`w-16 h-16 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="mt-4 text-lg font-semibold">
            {hasActiveFilters ? 'No Matching Invitations' : 'No Pending Invitations'}
          </h3>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {hasActiveFilters 
              ? 'Try adjusting your search or filter criteria'
              : 'You have no pending invitations at this time'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Invitations List */}
      {!isLoading && !error && filteredAndSortedInvitations.length > 0 && (
        <div className="space-y-4">
          {filteredAndSortedInvitations.map((invitation) => (
            <InvitationCard
              key={invitation.invitation_uuid}
              invitation={invitation}
              theme={theme}
              actionSlot={
                <InvitationActions
                  invitation={invitation}
                  theme={theme}
                  onViewDetails={onInvitationSelect}
                  layout="horizontal"
                />
              }
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && !error && filteredAndSortedInvitations.length > 0 && (
        <div className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {filteredAndSortedInvitations.length} of {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </div>
      )}
    </div>
  );
};

export default InvitationList;
