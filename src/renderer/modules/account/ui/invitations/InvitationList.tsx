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
  Search, 
  RefreshCw, 
  AlertCircle,
  Inbox,
  Filter,
  X,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DoorOpen,
} from 'lucide-react';
import { useGetMyPendingInvitations } from '../../../administration/admin-module/api/team-management/queries/useStaffInvitationQueries';
import { InvitationCard } from './InvitationCard';
import { InvitationActions } from './InvitationActions';
import type { StaffInvitation } from '../../../administration/admin-module/api/team-management/types/staffInvitationTypes';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isFocused, setIsFocused] = useState(false);

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

  const handleClearSearch = useCallback((): void => {
    setFilters(prev => ({ ...prev, searchTerm: '' }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  }, [handleClearSearch]);

  const hasActiveFilters = 
    filters.searchTerm !== '' || 
    filters.sortBy !== 'date_desc' || 
    filters.filterBy !== 'all';

  /* ------------------------------- Render --------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
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
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />

        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                  : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
              )}>
                <DoorOpen className={cn(
                  'w-6 h-6',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  My Invitations
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  )}>
                    {stats.total} total
                  </span>
                </h1>
                <p className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Review and respond to facility invitations
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefetching}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'border-2 transition-all',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                'disabled:opacity-50',
                isRefetching ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invitations Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
            'border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
            'group cursor-pointer transform hover:-translate-y-1'
          )}
        >
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            )}>
              <Inbox className={cn(
                'w-6 h-6',
                isDark ? 'text-blue-400' : 'text-blue-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              Total
            </span>
          </div>
          
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {stats.total}
          </p>
          
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Total Invitations
          </p>
          
          <div className="absolute bottom-3 right-3">
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )}>
              <span>Pending</span>
            </div>
          </div>
        </motion.div>

        {/* Expiring Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
            'border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/20' 
              : 'bg-gradient-to-br from-white to-yellow-50/50 border-yellow-200 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20',
            'group cursor-pointer transform hover:-translate-y-1'
          )}
        >
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-yellow-500/10 group-hover:opacity-100' : 'bg-yellow-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30 group-hover:scale-110' 
                : 'bg-yellow-100 group-hover:bg-yellow-200 group-hover:scale-110'
            )}>
              <Calendar className={cn(
                'w-6 h-6',
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              {stats.expiring_soon > 0 ? 'Action needed' : 'All good'}
            </span>
          </div>
          
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {stats.expiring_soon}
          </p>
          
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Expiring Soon (≤7 days)
          </p>
          
          {stats.expiring_soon > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            </div>
          )}
        </motion.div>

        {/* Urgent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
            'border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20' 
              : 'bg-gradient-to-br from-white to-orange-50/50 border-orange-200 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/20',
            'group cursor-pointer transform hover:-translate-y-1'
          )}
        >
          <div className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-orange-500/10 group-hover:opacity-100' : 'bg-orange-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />
          
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark 
                ? 'bg-orange-500/20 group-hover:bg-orange-500/30 group-hover:scale-110' 
                : 'bg-orange-100 group-hover:bg-orange-200 group-hover:scale-110'
            )}>
              <AlertCircle className={cn(
                'w-6 h-6',
                isDark ? 'text-orange-400' : 'text-orange-600'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              stats.urgent > 0
                ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30'
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}>
              {stats.urgent > 0 ? 'Urgent' : 'Normal'}
            </span>
          </div>
          
          <p className={cn(
            'text-3xl font-bold mb-1',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {stats.urgent}
          </p>
          
          <p className={cn(
            'text-sm font-medium',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            Urgent (≤3 days)
          </p>
          
          {stats.urgent > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-500 animate-pulse" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
        )}
      >
        <div className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <motion.div
                  className="absolute inset-0 rounded-lg z-0"
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
                <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
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
                    placeholder="Search by facility, role, or department..."
                    value={filters.searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 text-sm border-transparent',
                      'focus:outline-none focus:ring-0',
                      'transition-colors placeholder:text-sm',
                      isDark
                        ? 'bg-gray-900 text-white placeholder-gray-500'
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {filters.searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
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
                    </motion.button>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFilters}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium',
                  'border-2 transition-all',
                  showFilters || hasActiveFilters
                    ? isDark
                      ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                      : 'bg-blue-50 border-blue-300 text-blue-700'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                  'cursor-pointer'
                )}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    isDark ? 'bg-blue-400' : 'bg-blue-600'
                  )} />
                )}
                {showFilters ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </motion.button>

              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearFilters}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium',
                    'border-2 transition-all',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                    'cursor-pointer'
                  )}
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </motion.button>
              )}
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t-2 overflow-hidden"
                  style={{
                    borderColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
                  }}
                >
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Sort By
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={handleSortChange}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <option value="date_desc">Newest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="facility_asc">Facility A-Z</option>
                      <option value="expiry_asc">Expiring Soonest</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Filter By Status
                    </label>
                    <select
                      value={filters.filterBy}
                      onChange={handleFilterChange}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm appearance-none',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'transition-all cursor-pointer',
                        isDark 
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <option value="all">All Invitations</option>
                      <option value="expiring_soon">Expiring Within 7 Days</option>
                      <option value="urgent">Urgent (≤3 Days)</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search hint */}
            <AnimatePresence>
              {filters.searchTerm && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    'text-xs flex items-center gap-2',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  <span>Press ESC to clear • {filteredAndSortedInvitations.length} result{filteredAndSortedInvitations.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={handleClearSearch}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      'border-2 transition-all',
                      isDark
                        ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                        : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-600',
                      'cursor-pointer'
                    )}
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-12 text-center border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          <div className={cn(
            'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          )}>
            <RefreshCw className={cn(
              'w-10 h-10 animate-spin',
              isDark ? 'text-gray-600' : 'text-gray-400'
            )} />
          </div>
          <p className={cn(
            'text-lg font-medium',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            Loading invitations...
          </p>
        </motion.div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-12 text-center border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30' 
              : 'bg-gradient-to-br from-white to-red-50/50 border-red-200'
          )}
        >
          <div className={cn(
            'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30',
            isDark ? 'bg-red-500/10' : 'bg-red-500/5'
          )} />
          <div className="relative">
            <div className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              isDark ? 'bg-red-900/20' : 'bg-red-100'
            )}>
              <AlertCircle className={cn(
                'w-10 h-10',
                isDark ? 'text-red-400' : 'text-red-600'
              )} />
            </div>
            <h3 className="text-lg font-bold mb-2">Error Loading Invitations</h3>
            <p className={cn(
              'mb-6 max-w-md mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium',
                'border-2 transition-all',
                isDark
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                'transform hover:-translate-y-0.5 cursor-pointer'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedInvitations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'relative overflow-hidden rounded-xl p-12 text-center border-2',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          <div className={cn(
            'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30',
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
          )} />
          <div className="relative">
            <div className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              <Building2 className={cn(
                'w-10 h-10',
                isDark ? 'text-gray-600' : 'text-gray-400'
              )} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {hasActiveFilters ? 'No Matching Invitations' : 'No Pending Invitations'}
            </h3>
            <p className={cn(
              'mb-6 max-w-md mx-auto',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {hasActiveFilters 
                ? 'Try adjusting your search or filter criteria'
                : 'You have no pending invitations at this time'}
            </p>
            {hasActiveFilters && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearFilters}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5 cursor-pointer'
                )}
              >
                <X className="w-4 h-4" />
                Clear Filters
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Invitations List */}
      {!isLoading && !error && filteredAndSortedInvitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
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
        </motion.div>
      )}

      {/* Results Summary */}
      {!isLoading && !error && filteredAndSortedInvitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'text-sm text-center p-4 rounded-lg border-2',
            isDark 
              ? 'bg-gray-800/30 border-gray-700 text-gray-400' 
              : 'bg-gray-50/50 border-gray-200 text-gray-600'
          )}
        >
          Showing {filteredAndSortedInvitations.length} of {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </motion.div>
      )}
    </div>
  );
};

export default InvitationList;