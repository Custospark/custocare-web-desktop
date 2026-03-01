import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  User,
  Activity,
  Hash,
  Search,
  UserPlus,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Inbox,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import { visitKeys, useGetMyQueue } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import type {
  QueueFilters,
  VisitPhase,
  QueueResponse,
  VisitType,
  VisitStatus,
} from '../../../../api/dispensing/visit-queue/visitTypes';
import { ACUITY_SCORE_DESCRIPTIONS } from '../../../../api/dispensing/visit-queue/visitTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface QueuePatient {
  patient_number: string;
  global_user_uuid?: string;
  name: string | null;
  date_of_birth: string | null;
  biological_sex: string | null;
  blood_type: string | null;
  status: string;
  requires_isolation: boolean;
  created_at: string | null;
}

export interface QueueVisitItem {
  visit_id: number;
  visit_uuid: string;
  facility_id: number;

  patient_id: number;
  patient: QueuePatient | null;

  current_phase: VisitPhase;
  current_department_id: number | null;

  assigned_staff_id: number | null;
  assigned_at: string | null;

  waiting_since: string | null;
  acuity_score: number;
  arrived_at: string | null;

  visit_type: VisitType;
  status: VisitStatus;
  is_walk_in: boolean;
}

export interface PatientQueueProps {
  title?: string;
  description?: string;
  initialFilters?: QueueFilters;

  /** Visit-centric callbacks */
  onVisitSelect?: (visit: QueueVisitItem) => void;
  onTakeAction?: (visit: QueueVisitItem) => void;

  onNewPatientRegistration?: () => void;

  actionButtonText?: string;
  actionButtonIcon?: React.ReactNode;

  newPatientButtonText?: string;
  newPatientButtonIcon?: React.ReactNode;

  showStats?: boolean;
  allowPhaseFilter?: boolean;
  allowDepartmentFilter?: boolean;
  showUnassignedToggle?: boolean;
  showSearch?: boolean;
  showNewPatientRegistration?: boolean;

  refreshInterval?: number;
  /** Enable auto-refresh when window gains focus */
  refetchOnWindowFocus?: boolean;
  theme?: 'light' | 'dark';

  isLoading?: boolean;
  error?: Error | null;

  className?: string;
}

type SortOption = 'wait_time_asc' | 'wait_time_desc' | 'acuity_desc' | 'arrival_asc' | 'phase_asc';
type FilterOption = 'all' | 'overdue' | 'isolation' | 'walk_in';

interface FilterState {
  searchTerm: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  showFilters: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const formatWaitTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const calculateWaitTime = (waitingSince: string | null): number | null => {
  if (!waitingSince) return null;
  try {
    const started = new Date(waitingSince).getTime();
    if (Number.isNaN(started)) return null;
    const mins = Math.floor((Date.now() - started) / 60000);
    return Math.max(0, mins);
  } catch {
    return null;
  }
};

const isVisitOverdue = (acuityScore: number, waitingSince: string | null): boolean => {
  const minutes = calculateWaitTime(waitingSince);
  if (minutes === null) return false;
  const config = ACUITY_SCORE_DESCRIPTIONS[acuityScore];
  const maxWait = config?.maxWaitMinutes ?? 240;
  return minutes > maxWait;
};

const getAcuityDisplay = (acuityScore: number) => {
  return (
    ACUITY_SCORE_DESCRIPTIONS[acuityScore] || {
      label: 'Unknown',
      color: '#6b7280',
      maxWaitMinutes: 240,
    }
  );
};

const getPhaseDisplayName = (phase: VisitPhase): string => 
  phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getTypeDisplayName = (t: VisitType): string => 
  t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeQueueVisits = (queueData?: QueueResponse | null): QueueVisitItem[] => {
  if (!queueData?.meta?.queue_visits) return [];
  const visits = queueData.meta.queue_visits;
  return Array.isArray(visits) ? visits : [];
};

/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

const PatientQueue: React.FC<PatientQueueProps> = ({
  title = 'Patient Queue',
  description = 'Patients waiting for service',
  initialFilters = {},
  onVisitSelect,
  onTakeAction,
  onNewPatientRegistration,
  actionButtonText = 'Take Action',
  actionButtonIcon = <ChevronRight className="w-4 h-4" />,
  newPatientButtonText = 'New Patient',
  newPatientButtonIcon = <UserPlus className="w-4 h-4" />,
  showStats = true,
  showSearch = true,
  showNewPatientRegistration = true,
  refreshInterval = 30000,
  refetchOnWindowFocus = true,
  theme = 'light',
  isLoading: externalLoading,
  error: externalError,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const lastManualRefreshRef = useRef<number>(Date.now());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [filters] = useState<QueueFilters>({
    ...initialFilters,
    include_unassigned: initialFilters.include_unassigned ?? false,
  });

  // Advanced filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    sortBy: 'wait_time_desc',
    filterBy: 'all',
    showFilters: false,
  });

  const [selectedVisitUuid, setSelectedVisitUuid] = useState<string | null>(null);
  const [lastRefetchTime, setLastRefetchTime] = useState<Date>(new Date());

  const {
    data: queueData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useGetMyQueue(filters, {
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    refetchOnWindowFocus: refetchOnWindowFocus,
  });

  // Update last refetch time when data is updated
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefetchTime(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const isLoading = (externalLoading ?? queryLoading) || isManualRefreshing;
  const error = externalError ?? (queryError instanceof Error ? queryError : null);
  const isActuallyRefreshing = isRefetching || isManualRefreshing;

  const queueVisits = useMemo(() => normalizeQueueVisits(queueData), [queueData]);

  // Advanced filtering and sorting
  const filteredAndSortedVisits = useMemo((): QueueVisitItem[] => {
    let filtered = [...queueVisits];

    // Search filter
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const p = v.patient;
        const searchableText = [
          p?.name ?? '',
          p?.patient_number ?? '',
          p?.date_of_birth ?? '',
          p?.biological_sex ?? '',
          v.visit_uuid ?? '',
          getPhaseDisplayName(v.current_phase),
          getTypeDisplayName(v.visit_type),
          v.status ?? '',
        ].join(' ').toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    // Status filter
    switch (filterState.filterBy) {
      case 'overdue':
        filtered = filtered.filter(v => isVisitOverdue(v.acuity_score, v.waiting_since));
        break;
      case 'isolation':
        filtered = filtered.filter(v => v.patient?.requires_isolation);
        break;
      case 'walk_in':
        filtered = filtered.filter(v => v.is_walk_in);
        break;
      // 'all' - no filtering
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'wait_time_asc': {
          const timeA = calculateWaitTime(a.waiting_since) ?? 0;
          const timeB = calculateWaitTime(b.waiting_since) ?? 0;
          return timeA - timeB;
        }
        case 'wait_time_desc': {
          const timeA = calculateWaitTime(a.waiting_since) ?? 0;
          const timeB = calculateWaitTime(b.waiting_since) ?? 0;
          return timeB - timeA;
        }
        case 'acuity_desc':
          return b.acuity_score - a.acuity_score;
        case 'arrival_asc': {
          const dateA = a.arrived_at ? new Date(a.arrived_at).getTime() : 0;
          const dateB = b.arrived_at ? new Date(b.arrived_at).getTime() : 0;
          return dateA - dateB;
        }
        case 'phase_asc':
          return a.current_phase.localeCompare(b.current_phase);
        default:
          return 0;
      }
    });

    return filtered;
  }, [queueVisits, filterState]);

  const queueStats = useMemo(() => {
    if (queueVisits.length === 0) return null;

    const waitTimes = queueVisits
      .map((v) => calculateWaitTime(v.waiting_since))
      .filter((x): x is number => x !== null);

    const averageWaitTime =
      waitTimes.length > 0 ? Math.round(waitTimes.reduce((s, n) => s + n, 0) / waitTimes.length) : 0;

    const overdueCount = queueVisits.filter((v) => isVisitOverdue(v.acuity_score, v.waiting_since)).length;
    const isolationCount = queueVisits.filter((v) => v.patient?.requires_isolation).length;
    const walkInCount = queueVisits.filter((v) => v.is_walk_in).length;

    const byPhase = queueVisits.reduce((acc, v) => {
      acc[v.current_phase] = (acc[v.current_phase] || 0) + 1;
      return acc;
    }, {} as Record<VisitPhase, number>);

    const highAcuityCount = queueVisits.filter((v) => v.acuity_score >= 4).length;

    return {
      totalVisits: queueData?.meta?.total_visits ?? queueVisits.length,
      averageWaitTime,
      overdueCount,
      isolationCount,
      walkInCount,
      highAcuityCount,
      byPhase,
    };
  }, [queueVisits, queueData]);

  const handleClearSearch = useCallback(() => {
    setFilterState(prev => ({ ...prev, searchTerm: '' }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchTerm: '',
      sortBy: 'wait_time_desc',
      filterBy: 'all',
      showFilters: false,
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterState(prev => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState(prev => ({ ...prev, sortBy: e.target.value as SortOption }));
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState(prev => ({ ...prev, filterBy: e.target.value as FilterOption }));
  }, []);

  const toggleFilters = useCallback(() => {
    setFilterState(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  }, [handleClearSearch]);

  const handleVisitSelect = (visit: QueueVisitItem) => {
    setSelectedVisitUuid(visit.visit_uuid);
    onVisitSelect?.(visit);
  };

  const handleTakeActionClick = (visit: QueueVisitItem, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onTakeAction?.(visit);
  };

  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      lastManualRefreshRef.current = Date.now();
      await queryClient.invalidateQueries({ queryKey: visitKeys.queue(filters) });
      await refetch();
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  const getLastRefreshDisplay = (): string => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastRefetchTime.getTime()) / 1000);
    
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    return lastRefetchTime.toLocaleTimeString();
  };

  const hasActiveFilters = 
    filterState.searchTerm !== '' || 
    filterState.sortBy !== 'wait_time_desc' || 
    filterState.filterBy !== 'all';
const renderVisitRow = (visit: QueueVisitItem) => {
  const p = visit.patient;
  const isSelected = selectedVisitUuid === visit.visit_uuid;
  const waitTime = calculateWaitTime(visit.waiting_since);
  const overdue = isVisitOverdue(visit.acuity_score, visit.waiting_since);
  const acuity = getAcuityDisplay(visit.acuity_score);

  return (
    <motion.div
      key={visit.visit_uuid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer',
        'w-full p-4',
        isSelected
          ? isDark
            ? 'border-blue-500 bg-gradient-to-br from-blue-900/20 to-gray-800'
            : 'border-blue-500 bg-gradient-to-br from-blue-50 to-white'
          : isDark
            ? 'border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-gray-600 hover:shadow-2xl hover:shadow-blue-500/10'
            : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-gray-300 hover:shadow-2xl hover:shadow-blue-500/10',
        'transform hover:-translate-y-0.5'
      )}
      onClick={() => handleVisitSelect(visit)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleVisitSelect(visit);
        }
      }}
    >
      {/* Background decoration */}
      <div className={cn(
        'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-opacity',
        isDark ? 'bg-blue-500/5' : 'bg-blue-500/5',
        'opacity-0 group-hover:opacity-100'
      )} />

      <div className="relative">
        {/* Desktop: Row Layout | Mobile: Column Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left Section: Avatar + Basic Info - Always visible */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Patient Avatar */}
            <div className={cn(
              'flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300',
              'w-12 h-12',
              isSelected
                ? isDark
                  ? 'bg-blue-500/30 scale-110'
                  : 'bg-blue-200 scale-110'
                : isDark
                  ? 'bg-gray-700 group-hover:bg-gray-600 group-hover:scale-105'
                  : 'bg-gray-100 group-hover:bg-gray-200 group-hover:scale-105'
            )}>
              <User className={cn(
                'w-6 h-6',
                isSelected
                  ? isDark ? 'text-blue-300' : 'text-blue-700'
                  : isDark ? 'text-gray-300' : 'text-gray-600'
              )} />
            </div>

            {/* Patient Name and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className={cn(
                  'font-semibold truncate',
                  'text-base lg:text-lg',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  {p?.name || 'Unknown Patient'}
                </h3>

                {/* Tags - Visible on all screens */}
                {p?.requires_isolation && (
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium',
                    'border',
                    isDark 
                      ? 'bg-red-900/30 text-red-300 border-red-800/50' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  )}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Isolation
                  </span>
                )}

                {visit.is_walk_in && (
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium',
                    'border',
                    isDark 
                      ? 'bg-green-900/30 text-green-300 border-green-800/50' 
                      : 'bg-green-100 text-green-800 border-green-200'
                  )}>
                    Walk-in
                  </span>
                )}
              </div>

              {/* Patient Details - Responsive grid */}
              <div className={cn(
                'text-sm flex flex-wrap gap-x-4 gap-y-1',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {p?.patient_number && (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">#{p.patient_number}</span>
                  </span>
                )}

                {p?.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 lg:hidden" />
                    <span>DOB: {new Date(p.date_of_birth).toLocaleDateString()}</span>
                  </span>
                )}
                
                {p?.biological_sex && (
                  <span className="capitalize hidden lg:inline">{p.biological_sex.toLowerCase()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Badges and Action Button */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 flex-shrink-0">
            {/* Badges - Row on mobile, kept together on desktop */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Phase Badge */}
              <div className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                'border transition-all',
                isDark
                  ? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
                  : 'bg-purple-100 text-purple-800 border-purple-200'
              )}>
                {getPhaseDisplayName(visit.current_phase)}
              </div>

              {/* Acuity Badge */}
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap"
                style={{ 
                  backgroundColor: `${acuity.color}20`,
                  color: acuity.color,
                  borderColor: `${acuity.color}40`
                }}
                title={`Acuity: ${acuity.label}`}
              >
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Level {visit.acuity_score}
                </div>
              </div>

              {/* Wait Time Badge */}
              <div className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap',
                'border transition-all',
                overdue
                  ? isDark
                    ? 'bg-red-900/30 text-red-300 border-red-800/50'
                    : 'bg-red-100 text-red-800 border-red-200'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 border-gray-600'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
              )}>
                <Clock className="w-3 h-3" />
                {formatWaitTime(waitTime)}
                {overdue && <AlertCircle className="w-3 h-3 ml-1" />}
              </div>
            </div>

            {/* Action Button - Full width on mobile, auto on desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleTakeActionClick(visit, e)}
              className={cn(
                'rounded-lg font-medium transition-all duration-200',
                'flex items-center justify-center gap-2',
                'w-full lg:w-auto px-4 py-2.5 lg:py-2',
                'text-sm',
                isDark
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                'transform hover:-translate-y-0.5 cursor-pointer'
              )}
            >
              <span>{actionButtonText}</span>
              {actionButtonIcon}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

  return (
    <div className={cn(
      'min-h-screen p-6',
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',
      className
    )}>
      <div className="max-w-7xl mx-auto space-y-6">
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
                  <Users className={cn(
                    'w-6 h-6',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {title}
                    {queueStats && (
                      <span className={cn(
                        'text-sm font-medium px-2.5 py-1 rounded-full',
                        isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                      )}>
                        {queueStats.totalVisits} total
                      </span>
                    )}
                  </h1>
                  <p className={cn(
                    'mt-1 text-sm',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {showNewPatientRegistration && onNewPatientRegistration && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewPatientRegistration}
                    className={cn(
                      'px-4 py-2.5 rounded-lg font-medium transition-all duration-200',
                      'flex items-center gap-2 border-2',
                      isDark
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                      'transform hover:-translate-y-0.5 cursor-pointer'
                    )}
                  >
                    {newPatientButtonIcon}
                    <span className="hidden sm:inline">{newPatientButtonText}</span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleManualRefresh}
                  disabled={isActuallyRefreshing}
                  className={cn(
                    'p-2.5 rounded-lg transition-all duration-200',
                    'border-2',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  )}
                >
                  <RefreshCw className={`w-5 h-5 ${isActuallyRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>

                <div className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg',
                  isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs whitespace-nowrap">
                    {getLastRefreshDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {showStats && queueStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Visits Card */}
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
                {queueStats.totalVisits}
              </p>
              
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Active Visits
              </p>
            </motion.div>

            {/* Average Wait Time Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
                'border-2',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20' 
                  : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
                'group cursor-pointer transform hover:-translate-y-1'
              )}
            >
              <div className={cn(
                'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
                isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
                'opacity-0'
              )} />
              
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isDark 
                    ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110' 
                    : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
                )}>
                  <Clock className={cn(
                    'w-6 h-6',
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  Average
                </span>
              </div>
              
              <p className={cn(
                'text-3xl font-bold mb-1',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {formatWaitTime(queueStats.averageWaitTime)}
              </p>
              
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Wait Time
              </p>
            </motion.div>

            {/* Overdue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                'relative overflow-hidden rounded-xl p-5 transition-all duration-300',
                'border-2',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20' 
                  : 'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/20',
                'group cursor-pointer transform hover:-translate-y-1'
              )}
            >
              <div className={cn(
                'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity',
                isDark ? 'bg-red-500/10 group-hover:opacity-100' : 'bg-red-500/5 group-hover:opacity-100',
                'opacity-0'
              )} />
              
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isDark 
                    ? 'bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110' 
                    : 'bg-red-100 group-hover:bg-red-200 group-hover:scale-110'
                )}>
                  <AlertCircle className={cn(
                    'w-6 h-6',
                    isDark ? 'text-red-400' : 'text-red-600'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  queueStats.overdueCount > 0
                    ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  {queueStats.overdueCount > 0 ? 'Action needed' : 'On track'}
                </span>
              </div>
              
              <p className={cn(
                'text-3xl font-bold mb-1',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {queueStats.overdueCount}
              </p>
              
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Overdue Visits
              </p>
            </motion.div>

            {/* High Acuity Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
                  <TrendingUp className={cn(
                    'w-6 h-6',
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  Level 4-5
                </span>
              </div>
              
              <p className={cn(
                'text-3xl font-bold mb-1',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {queueStats.highAcuityCount}
              </p>
              
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                High Acuity
              </p>
            </motion.div>
          </div>
        )}

        {/* Search and Filters */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
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
                        duration: isSearchFocused ? 2 : 6,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
                      <Search
                        className={cn(
                          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                          isSearchFocused 
                            ? 'text-blue-500' 
                            : isDark 
                              ? 'text-gray-500' 
                              : 'text-gray-400'
                        )}
                      />
                      <input
                        type="text"
                        placeholder="Search patients by patient number,name, DOB, or visit details..."
                        value={filterState.searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className={cn(
                          'w-full pl-10 pr-10 py-2.5 text-sm border-transparent',
                          'focus:outline-none focus:ring-0',
                          'transition-colors placeholder:text-sm',
                          isDark
                            ? 'bg-gray-900 text-white placeholder-gray-500'
                            : 'bg-white text-gray-900 placeholder-gray-400'
                        )}
                      />
                      {filterState.searchTerm && (
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
                      filterState.showFilters || hasActiveFilters
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
                    {filterState.showFilters ? (
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
                  {filterState.showFilters && (
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
                          value={filterState.sortBy}
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
                          <option value="wait_time_desc">Longest Wait First</option>
                          <option value="wait_time_asc">Shortest Wait First</option>
                          <option value="acuity_desc">Highest Acuity First</option>
                          <option value="arrival_asc">Earliest Arrival</option>
                          <option value="phase_asc">Phase (A-Z)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Filter By
                        </label>
                        <select
                          value={filterState.filterBy}
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
                          <option value="all">All Patients</option>
                          <option value="overdue">Overdue Only</option>
                          <option value="isolation">Isolation Required</option>
                          <option value="walk_in">Walk-ins Only</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search hint */}
                <AnimatePresence>
                  {filterState.searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        'text-xs flex items-center gap-2',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    >
                      <span>Press ESC to clear • {filteredAndSortedVisits.length} result{filteredAndSortedVisits.length !== 1 ? 's' : ''}</span>
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
        )}

        {/* Loading State */}
        {isLoading && !queueData && (
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
              Loading patient queue...
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
              <h3 className="text-lg font-bold mb-2">Failed to Load Queue</h3>
              <p className={cn(
                'mb-6 max-w-md mx-auto',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {error.message || 'Something went wrong while loading the queue.'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualRefresh}
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
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAndSortedVisits.length === 0 && (
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
                <Users className={cn(
                  'w-10 h-10',
                  isDark ? 'text-gray-600' : 'text-gray-400'
                )} />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {hasActiveFilters ? 'No Matching Patients' : 'Queue is Empty'}
              </h3>
              <p className={cn(
                'mb-6 max-w-md mx-auto',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {hasActiveFilters 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No patients are currently in the queue'}
              </p>
              {hasActiveFilters ? (
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
              ) : showNewPatientRegistration && onNewPatientRegistration && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNewPatientRegistration}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium',
                    'border-2 transition-all',
                    isDark
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                    'transform hover:-translate-y-0.5 cursor-pointer'
                  )}
                >
                  {newPatientButtonIcon}
                  {newPatientButtonText}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Visits List */}
        {!isLoading && !error && filteredAndSortedVisits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredAndSortedVisits.map(renderVisitRow)}
          </motion.div>
        )}

        {/* Results Summary */}
        {!isLoading && !error && filteredAndSortedVisits.length > 0 && (
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
            Showing {filteredAndSortedVisits.length} of {queueVisits.length} patient{queueVisits.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;