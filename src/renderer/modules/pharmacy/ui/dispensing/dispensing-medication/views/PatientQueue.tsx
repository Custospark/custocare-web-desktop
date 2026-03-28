import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';

import { useGetMyQueue } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import type {
  QueueFilters,
  VisitPhase,
  QueueResponse,
  VisitType,
  VisitStatus,
} from '../../../../api/dispensing/visit-queue/visitTypes';
import { ACUITY_SCORE_DESCRIPTIONS } from '../../../../api/dispensing/visit-queue/visitTypes';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
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
  refetchOnWindowFocus?: boolean;
  theme?: 'light' | 'dark';

  isLoading?: boolean;
  error?: Error | null;

  className?: string;
}

type SortOption =
  | 'wait_time_asc'
  | 'wait_time_desc'
  | 'acuity_desc'
  | 'arrival_asc'
  | 'phase_asc';

type FilterOption = 'all' | 'overdue' | 'isolation' | 'walk_in';

interface FilterState {
  searchTerm: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  showFilters: boolean;
}

interface StatCardProps {
  theme: 'light' | 'dark';
  title: string;
  value: string | number;
  badge: string;
  icon: React.ReactNode;
  tone: 'blue' | 'purple' | 'red' | 'orange';
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

const getTypeDisplayName = (type: VisitType): string =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeQueueVisits = (queueData?: QueueResponse | null): QueueVisitItem[] => {
  if (!queueData?.meta?.queue_visits) return [];
  const visits = queueData.meta.queue_visits;
  return Array.isArray(visits) ? visits : [];
};

const toneStyles = {
  blue: {
    cardDark:
      'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20',
    cardLight:
      'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
    glowDark: 'bg-blue-500/10',
    glowLight: 'bg-blue-500/5',
    iconDark: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
    iconLight: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
  },
  purple: {
    cardDark:
      'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20',
    cardLight:
      'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20',
    glowDark: 'bg-purple-500/10',
    glowLight: 'bg-purple-500/5',
    iconDark: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
    iconLight: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
  },
  red: {
    cardDark:
      'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20',
    cardLight:
      'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/20',
    glowDark: 'bg-red-500/10',
    glowLight: 'bg-red-500/5',
    iconDark: 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30',
    iconLight: 'bg-red-100 text-red-600 group-hover:bg-red-200',
  },
  orange: {
    cardDark:
      'bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20',
    cardLight:
      'bg-gradient-to-br from-white to-orange-50/50 border-orange-200 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/20',
    glowDark: 'bg-orange-500/10',
    glowLight: 'bg-orange-500/5',
    iconDark: 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30',
    iconLight: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
  },
};

const StatCard: React.FC<StatCardProps> = ({ theme, title, value, badge, icon, tone }) => {
  const isDark = theme === 'dark';
  const styles = toneStyles[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border-2 p-5 transition-all duration-300 cursor-pointer transform hover:-translate-y-1',
        isDark ? styles.cardDark : styles.cardLight
      )}
    >
      <div
        className={cn(
          'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-100',
          isDark ? styles.glowDark : styles.glowLight
        )}
      />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div
            className={cn(
              'rounded-xl p-3 transition-all duration-300 group-hover:scale-110',
              isDark ? styles.iconDark : styles.iconLight
            )}
          >
            {icon}
          </div>

          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}
          >
            {badge}
          </span>
        </div>

        <p className={cn('mb-1 text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          {value}
        </p>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {title}
        </p>
      </div>
    </motion.div>
  );
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedVisitUuid, setSelectedVisitUuid] = useState<string | null>(null);
  const [lastRefetchTime, setLastRefetchTime] = useState<Date>(new Date());
  const [isInlineErrorDismissed, setIsInlineErrorDismissed] = useState(false);

  const [filters] = useState<QueueFilters>({
    ...initialFilters,
    include_unassigned: initialFilters.include_unassigned ?? false,
  });

  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    sortBy: 'wait_time_desc',
    filterBy: 'all',
    showFilters: false,
  });

  const {
    data: queueData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useGetMyQueue(filters, {
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    refetchOnWindowFocus,
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefetchTime(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const queueVisits = useMemo(() => normalizeQueueVisits(queueData), [queueData]);

  const hasFetchedQueue = queueData !== undefined && queueData !== null;
  const error = externalError ?? (queryError instanceof Error ? queryError : null);

  const isInitialLoading = !hasFetchedQueue && (externalLoading ?? queryLoading);
  const isRefreshing = !isInitialLoading && (isRefetching || isManualRefreshing);
  const showBlockingError = !!error && !hasFetchedQueue;
  
  // Only show inline error if it hasn't been dismissed by the user
  const showInlineError = !!error && hasFetchedQueue && !isInlineErrorDismissed;
  const showInlineRefreshLoader = isRefreshing && hasFetchedQueue;

  const filteredAndSortedVisits = useMemo((): QueueVisitItem[] => {
    let filtered = [...queueVisits];

    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();

      filtered = filtered.filter((visit) => {
        const patient = visit.patient;

        const searchableText = [
          patient?.name ?? '',
          patient?.patient_number ?? '',
          patient?.date_of_birth ?? '',
          patient?.biological_sex ?? '',
          visit.visit_uuid ?? '',
          getPhaseDisplayName(visit.current_phase),
          getTypeDisplayName(visit.visit_type),
          visit.status ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    switch (filterState.filterBy) {
      case 'overdue':
        filtered = filtered.filter((visit) =>
          isVisitOverdue(visit.acuity_score, visit.waiting_since)
        );
        break;
      case 'isolation':
        filtered = filtered.filter((visit) => visit.patient?.requires_isolation);
        break;
      case 'walk_in':
        filtered = filtered.filter((visit) => visit.is_walk_in);
        break;
      default:
        break;
    }

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
      .map((visit) => calculateWaitTime(visit.waiting_since))
      .filter((value): value is number => value !== null);

    const averageWaitTime =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
        : 0;

    const overdueCount = queueVisits.filter((visit) =>
      isVisitOverdue(visit.acuity_score, visit.waiting_since)
    ).length;

    const isolationCount = queueVisits.filter(
      (visit) => visit.patient?.requires_isolation
    ).length;

    const walkInCount = queueVisits.filter((visit) => visit.is_walk_in).length;
    const highAcuityCount = queueVisits.filter((visit) => visit.acuity_score >= 4).length;

    return {
      totalVisits: queueData?.meta?.total_visits ?? queueVisits.length,
      averageWaitTime,
      overdueCount,
      isolationCount,
      walkInCount,
      highAcuityCount,
    };
  }, [queueVisits, queueData]);

  const handleClearSearch = useCallback(() => {
    setFilterState((prev) => ({ ...prev, searchTerm: '' }));
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
    setFilterState((prev) => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState((prev) => ({
      ...prev,
      sortBy: e.target.value as SortOption,
    }));
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState((prev) => ({
      ...prev,
      filterBy: e.target.value as FilterOption,
    }));
  }, []);

  const toggleFilters = useCallback(() => {
    setFilterState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClearSearch();
      }
    },
    [handleClearSearch]
  );

  const handleVisitSelect = useCallback(
    (visit: QueueVisitItem) => {
      setSelectedVisitUuid(visit.visit_uuid);
      onVisitSelect?.(visit);
    },
    [onVisitSelect]
  );

  const handleTakeActionClick = useCallback(
    (visit: QueueVisitItem, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onTakeAction?.(visit);
    },
    [onTakeAction]
  );

  const handleManualRefresh = useCallback(async () => {
    if (isManualRefreshing || isRefetching) return;

    try {
      setIsManualRefreshing(true);
      await refetch();
      // When manually refreshing, also reset the inline error dismissal so a new error can be shown
      setIsInlineErrorDismissed(false);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isManualRefreshing, isRefetching, refetch]);

  const handleDismissInlineError = useCallback(() => {
    setIsInlineErrorDismissed(true);
  }, []);

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
    const patient = visit.patient;
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
          'group relative w-full overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer',
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVisitSelect(visit);
          }
        }}
      >
        <div
          className={cn(
            'absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-0 transition-opacity group-hover:opacity-100',
            isDark ? 'bg-blue-500/5' : 'bg-blue-500/5'
          )}
        />

        <div className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 min-w-0 items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                  isSelected
                    ? isDark
                      ? 'bg-blue-500/30 scale-110'
                      : 'bg-blue-200 scale-110'
                    : isDark
                      ? 'bg-gray-700 group-hover:bg-gray-600 group-hover:scale-105'
                      : 'bg-gray-100 group-hover:bg-gray-200 group-hover:scale-105'
                )}
              >
                <User
                  className={cn(
                    'h-6 w-6',
                    isSelected
                      ? isDark
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDark
                        ? 'text-gray-300'
                        : 'text-gray-600'
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      'truncate text-base font-semibold lg:text-lg',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {patient?.name || 'Unknown Patient'}
                  </h3>

                  {patient?.requires_isolation && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium',
                        isDark
                          ? 'bg-red-900/30 text-red-300 border-red-800/50'
                          : 'bg-red-100 text-red-800 border-red-200'
                      )}
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Isolation
                    </span>
                  )}

                  {visit.is_walk_in && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium',
                        isDark
                          ? 'bg-green-900/30 text-green-300 border-green-800/50'
                          : 'bg-green-100 text-green-800 border-green-200'
                      )}
                    >
                      Walk-in
                    </span>
                  )}
                </div>

                <div
                  className={cn(
                    'flex flex-wrap gap-x-4 gap-y-1 text-sm',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {patient?.patient_number && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">#{patient.patient_number}</span>
                    </span>
                  )}

                  {patient?.date_of_birth && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 lg:hidden" />
                      <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                    </span>
                  )}

                  {patient?.biological_sex && (
                    <span className="hidden capitalize lg:inline">
                      {patient.biological_sex.toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap',
                    isDark
                      ? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
                      : 'bg-purple-100 text-purple-800 border-purple-200'
                  )}
                >
                  {getPhaseDisplayName(visit.current_phase)}
                </div>

                <div
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: `${acuity.color}20`,
                    color: acuity.color,
                    borderColor: `${acuity.color}40`,
                  }}
                  title={`Acuity: ${acuity.label}`}
                >
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Level {visit.acuity_score}
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                    overdue
                      ? isDark
                        ? 'bg-red-900/30 text-red-300 border-red-800/50'
                        : 'bg-red-100 text-red-800 border-red-200'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 border-gray-600'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {formatWaitTime(waitTime)}
                  {overdue && <AlertCircle className="ml-1 h-3 w-3" />}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleTakeActionClick(visit, e)}
                className={cn(
                  'flex w-full lg:w-auto items-center justify-center gap-2 rounded-lg border px-4 py-2.5 lg:py-2 text-sm font-medium transition-all duration-200',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
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
    <div
      className={cn(
        'min-h-screen p-6',
        isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',
        className
      )}
      aria-busy={isRefreshing}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'group relative overflow-hidden rounded-xl border-2 transition-all duration-300',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
              : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20'
          )}
        >
          <div
            className={cn(
              'absolute top-0 right-0 hidden h-32 w-32 rounded-full blur-2xl opacity-0 transition-opacity sm:block sm:h-48 sm:w-48 md:h-64 md:w-64 sm:blur-3xl group-hover:opacity-100',
              isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
            )}
          />

          <div className="relative p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div
                  className={cn(
                    'flex-shrink-0 rounded-xl p-2 sm:p-2.5 md:p-3 transition-all duration-300',
                    isDark
                      ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-105 sm:group-hover:scale-110'
                      : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-105 sm:group-hover:scale-110'
                  )}
                >
                  <Users
                    className={cn(
                      'h-5 w-5 sm:h-5.5 sm:w-5.5 md:h-6 md:w-6',
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="flex flex-wrap items-center gap-2 truncate text-lg font-bold sm:text-xl md:text-2xl">
                      {title}
                    </h1>

                    {queueStats && (
                      <span
                        className={cn(
                          'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-xs md:text-sm',
                          isDark
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        )}
                      >
                        {queueStats.totalVisits} total
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs sm:mt-1 sm:text-sm',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-3">
                {showNewPatientRegistration && onNewPatientRegistration && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNewPatientRegistration}
                    className={cn(
                      'flex flex-shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-2 font-medium transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5',
                      isDark
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                      'transform hover:-translate-y-0.5 cursor-pointer'
                    )}
                    aria-label={newPatientButtonText}
                    title={newPatientButtonText}
                  >
                    {newPatientButtonIcon}
                    <span className="hidden text-xs font-medium xs:inline sm:text-sm">
                      {newPatientButtonText}
                    </span>
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className={cn(
                    'flex-shrink-0 rounded-lg border-2 p-2 transition-all duration-200 sm:p-2.5',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  )}
                  aria-label="Refresh"
                  title="Refresh queue"
                >
                  <RefreshCw
                    className={cn(
                      'h-4 w-4 sm:h-5 sm:w-5',
                      isRefreshing && 'animate-spin'
                    )}
                  />
                </motion.button>

                <div
                  className={cn(
                    'flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2',
                    isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <Clock className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                  <span className="whitespace-nowrap text-[10px] sm:text-xs">
                    {getLastRefreshDisplay()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inline refresh loading state */}
        <AnimatePresence>
          {showInlineRefreshLoader && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                'overflow-hidden rounded-xl border-2',
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900'
                  : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/50'
              )}
            >
              <div className="p-4">
                <LoadingSkeleton
                  variant="minimal"
                  theme={theme}
                  message="Refreshing patient queue..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline stale-data error with dismiss button */}
        <AnimatePresence>
          {showInlineError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                'rounded-xl border-2 p-4',
                isDark
                  ? 'border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10'
                  : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('rounded-lg p-2', isDark ? 'bg-red-500/20' : 'bg-red-100')}>
                  <AlertCircle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
                </div>

                <div className="flex-1">
                  <p className={cn('text-sm font-medium', isDark ? 'text-red-200' : 'text-red-800')}>
                    Could not refresh queue
                  </p>
                  <p className={cn('mt-1 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                    {error?.message || 'Showing the most recent available queue data.'}
                  </p>
                </div>

                <button
                  onClick={handleDismissInlineError}
                  className={cn(
                    'flex-shrink-0 rounded-lg p-1.5 transition-all duration-200',
                    isDark
                      ? 'hover:bg-red-800/30 text-red-300 hover:text-red-200'
                      : 'hover:bg-red-100 text-red-500 hover:text-red-700',
                    'cursor-pointer'
                  )}
                  aria-label="Dismiss error"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {showStats && queueStats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              theme={theme}
              title="Active Visits"
              value={queueStats.totalVisits}
              badge="Total"
              icon={<Inbox className="h-6 w-6" />}
              tone="blue"
            />

            <StatCard
              theme={theme}
              title="Wait Time"
              value={formatWaitTime(queueStats.averageWaitTime)}
              badge="Average"
              icon={<Clock className="h-6 w-6" />}
              tone="purple"
            />

            <StatCard
              theme={theme}
              title="Overdue Visits"
              value={queueStats.overdueCount}
              badge={queueStats.overdueCount > 0 ? 'Action needed' : 'On track'}
              icon={<AlertCircle className="h-6 w-6" />}
              tone="red"
            />

            <StatCard
              theme={theme}
              title="High Acuity"
              value={queueStats.highAcuityCount}
              badge="Level 4-5"
              icon={<TrendingUp className="h-6 w-6" />}
              tone="orange"
            />
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
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <motion.div
                      className="absolute inset-0 rounded-lg z-0"
                      style={{
                        background:
                          'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
                        backgroundSize: '300% 100%',
                      }}
                      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                      transition={{
                        duration: isSearchFocused ? 2 : 6,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />

                    <div className="relative z-10 m-[2px] overflow-hidden rounded-[6px]">
                      <Search
                        className={cn(
                          'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200',
                          isSearchFocused
                            ? 'text-blue-500'
                            : isDark
                              ? 'text-gray-500'
                              : 'text-gray-400'
                        )}
                      />

                      <input
                        type="text"
                        placeholder="Search patients by patient number, name, DOB, or visit details..."
                        value={filterState.searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className={cn(
                          'w-full border-transparent py-2.5 pl-10 pr-10 text-sm transition-colors placeholder:text-sm focus:outline-none focus:ring-0',
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
                            'absolute right-2.5 top-1/2 rounded-full p-1 -translate-y-1/2 transition-colors cursor-pointer',
                            isDark
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          )}
                          aria-label="Clear search"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFilters}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 font-medium transition-all',
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
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>

                    {hasActiveFilters && (
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isDark ? 'bg-blue-400' : 'bg-blue-600'
                        )}
                      />
                    )}

                    {filterState.showFilters ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
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
                        'inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 font-medium transition-all',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                        'cursor-pointer'
                      )}
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Clear</span>
                    </motion.button>
                  )}
                </div>

                <AnimatePresence>
                  {filterState.showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 gap-3 overflow-hidden border-t-2 pt-3 sm:grid-cols-2"
                      style={{
                        borderColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)',
                      }}
                    >
                      <div>
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          )}
                        >
                          Sort By
                        </label>

                        <select
                          value={filterState.sortBy}
                          onChange={handleSortChange}
                          className={cn(
                            'w-full cursor-pointer appearance-none rounded-lg border-2 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
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
                        <label
                          className={cn(
                            'mb-2 block text-sm font-medium',
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          )}
                        >
                          Filter By
                        </label>

                        <select
                          value={filterState.filterBy}
                          onChange={handleFilterChange}
                          className={cn(
                            'w-full cursor-pointer appearance-none rounded-lg border-2 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
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

                <AnimatePresence>
                  {filterState.searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    >
                      <span>
                        Press ESC to clear • {filteredAndSortedVisits.length} result
                        {filteredAndSortedVisits.length !== 1 ? 's' : ''}
                      </span>

                      <button
                        onClick={handleClearSearch}
                        className={cn(
                          'cursor-pointer rounded-full border-2 px-2 py-0.5 text-xs font-medium transition-all',
                          isDark
                            ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                            : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-600'
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

        {/* Initial blocking loading */}
        {isInitialLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-12 text-center',
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            )}
          >
            <div
              className={cn(
                'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}
            >
              <RefreshCw
                className={cn(
                  'h-10 w-10 animate-spin',
                  isDark ? 'text-gray-600' : 'text-gray-400'
                )}
              />
            </div>

            <p className={cn('text-lg font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
              Loading patient queue...
            </p>
          </motion.div>
        )}

        {/* Blocking error when no queue data exists */}
        {showBlockingError && !isInitialLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-12 text-center',
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30'
                : 'bg-gradient-to-br from-white to-red-50/50 border-red-200'
            )}
          >
            <div
              className={cn(
                'absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-30',
                isDark ? 'bg-red-500/10' : 'bg-red-500/5'
              )}
            />

            <div className="relative">
              <div
                className={cn(
                  'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                  isDark ? 'bg-red-900/20' : 'bg-red-100'
                )}
              >
                <AlertCircle
                  className={cn('h-10 w-10', isDark ? 'text-red-400' : 'text-red-600')}
                />
              </div>

              <h3 className="mb-2 text-lg font-bold">Failed to Load Queue</h3>

              <p
                className={cn(
                  'mx-auto mb-6 max-w-md',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {error?.message || 'Something went wrong while loading the queue.'}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleManualRefresh}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border-2 px-6 py-2.5 font-medium transition-all',
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                  'transform hover:-translate-y-0.5 cursor-pointer'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isInitialLoading && !showBlockingError && filteredAndSortedVisits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-12 text-center',
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
            )}
          >
            <div
              className={cn(
                'absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-30',
                isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
              )}
            />

            <div className="relative">
              <div
                className={cn(
                  'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                )}
              >
                <Users
                  className={cn('h-10 w-10', isDark ? 'text-gray-600' : 'text-gray-400')}
                />
              </div>

              <h3 className="mb-2 text-lg font-bold">
                {hasActiveFilters ? 'No Matching Patients' : 'Queue is Empty'}
              </h3>

              <p
                className={cn(
                  'mx-auto mb-6 max-w-md',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
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
                    'inline-flex items-center gap-2 rounded-xl border-2 px-6 py-2.5 font-medium transition-all',
                    isDark
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                    'transform hover:-translate-y-0.5 cursor-pointer'
                  )}
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </motion.button>
              ) : (
                showNewPatientRegistration &&
                onNewPatientRegistration && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewPatientRegistration}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl border-2 px-6 py-2.5 font-medium transition-all',
                      isDark
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                      'transform hover:-translate-y-0.5 cursor-pointer'
                    )}
                  >
                    {newPatientButtonIcon}
                    {newPatientButtonText}
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Visits */}
        {!isInitialLoading && !showBlockingError && filteredAndSortedVisits.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filteredAndSortedVisits.map(renderVisitRow)}
          </motion.div>
        )}

        {/* Results summary */}
        {!isInitialLoading && !showBlockingError && filteredAndSortedVisits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'rounded-lg border-2 p-4 text-center text-sm',
              isDark
                ? 'bg-gray-800/30 border-gray-700 text-gray-400'
                : 'bg-gray-50/50 border-gray-200 text-gray-600'
            )}
          >
            Showing {filteredAndSortedVisits.length} of {queueVisits.length} patient
            {queueVisits.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;