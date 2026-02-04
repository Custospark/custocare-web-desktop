import React, { useMemo, useRef, useState } from 'react';
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
  // ClipboardList,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { visitKeys, useGetMyQueue } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import type {
  QueueFilters,
  VisitPhase,
  QueueResponse,
  VisitType,
  VisitStatus,
} from '../../../../api/dispensing/visit-queue/visitTypes';
import { ACUITY_SCORE_DESCRIPTIONS } from '../../../../api/dispensing/visit-queue/visitTypes';

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
  theme?: 'light' | 'dark';

  isLoading?: boolean;
  error?: Error | null;

  className?: string;
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

const searchVisits = (visits: QueueVisitItem[], query: string): QueueVisitItem[] => {
  const q = query.trim().toLowerCase();
  if (!q) return visits;

  return visits.filter((v) => {
    const p = v.patient;
    const hay = [
      p?.name ?? '',
      p?.patient_number ?? '',
      p?.date_of_birth ?? '',
      p?.biological_sex ?? '',
      v.visit_uuid ?? '',
      v.current_phase ?? '',
      v.visit_type ?? '',
      v.status ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return hay.includes(q);
  });
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
  theme = 'light',
  isLoading: externalLoading,
  error: externalError,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const lastManualRefreshRef = useRef<number>(Date.now());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [filters] = useState<QueueFilters>({
    ...initialFilters,
    include_unassigned: initialFilters.include_unassigned ?? false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitUuid, setSelectedVisitUuid] = useState<string | null>(null);

  const {
    data: queueData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
    isRefetching,
  } = useGetMyQueue(filters, {
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });

  const isLoading = (externalLoading ?? queryLoading) || isManualRefreshing;
  const error = externalError ?? (queryError instanceof Error ? queryError : null);
  const isActuallyRefreshing = isRefetching || isManualRefreshing;

  const queueVisits = useMemo(() => normalizeQueueVisits(queueData), [queueData]);
  const filteredVisits = useMemo(() => searchVisits(queueVisits, searchQuery), [queueVisits, searchQuery]);



  const queueStats = useMemo(() => {
    if (queueVisits.length === 0) return null;

    const waitTimes = queueVisits
      .map((v) => calculateWaitTime(v.waiting_since))
      .filter((x): x is number => x !== null);

    const averageWaitTime =
      waitTimes.length > 0 ? Math.round(waitTimes.reduce((s, n) => s + n, 0) / waitTimes.length) : 0;

    const overdueCount = queueVisits.filter((v) => isVisitOverdue(v.acuity_score, v.waiting_since)).length;

    const byPhase = queueVisits.reduce((acc, v) => {
      acc[v.current_phase] = (acc[v.current_phase] || 0) + 1;
      return acc;
    }, {} as Record<VisitPhase, number>);

    return {
      totalVisits: queueData?.meta?.total_visits ?? queueVisits.length,
      averageWaitTime,
      overdueCount,
      byPhase,
    };
  }, [queueVisits, queueData]);



  const handleClearSearch = () => setSearchQuery('');

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

  const renderVisitRow = (visit: QueueVisitItem) => {
    const p = visit.patient;
    const isSelected = selectedVisitUuid === visit.visit_uuid;
    const waitTime = calculateWaitTime(visit.waiting_since);
    const overdue = isVisitOverdue(visit.acuity_score, visit.waiting_since);
    const acuity = getAcuityDisplay(visit.acuity_score);

    return (
      <div
        key={visit.visit_uuid}
        className={`rounded-lg border p-4 transition-all cursor-pointer ${
          isSelected
            ? isDark
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-blue-500 bg-blue-50'
            : isDark
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => handleVisitSelect(visit)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-default ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <User className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <h3 className="font-semibold truncate">{p?.name || 'Unknown Patient'}</h3>

                {p?.requires_isolation && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default ${
                      isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Isolation
                  </span>
                )}
              </div>

              <div className={`text-sm flex flex-wrap gap-x-4 gap-y-1 cursor-default ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {p?.patient_number ? (
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                   Patient Number: {p.patient_number}
                  </span>
                ) : null}

                {p?.date_of_birth ? <span>DOB: {new Date(p.date_of_birth).toLocaleDateString()}</span> : null}
                {p?.biological_sex ? <span>Sex: {p.biological_sex}</span> : null}

                {/* <span className="flex items-center gap-1" title="Visit UUID">
                  <ClipboardList className="w-3 h-3" />
                 Visit Number: {visit.visit_uuid}
                </span> */}
              </div>
            </div>

            <div className="flex-shrink-0 ml-4 text-right">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium cursor-default ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                  {getTypeDisplayName(visit.visit_type)}
                </span>

                <span className={`px-2 py-1 rounded text-xs font-medium cursor-default ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                  {getPhaseDisplayName(visit.current_phase)}
                </span>

                <div
                  className="px-2 py-1 rounded text-xs font-medium cursor-default"
                  style={{ backgroundColor: `${acuity.color}20`, color: acuity.color }}
                  title={`Acuity: ${acuity.label}`}
                >
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {visit.acuity_score}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-default ${
                    overdue
                      ? isDark
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-red-100 text-red-800'
                      : isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  title={waitTime === null ? 'No waiting time' : `Waiting: ${waitTime} minutes`}
                >
                  <Clock className="w-3 h-3" />
                  {formatWaitTime(waitTime)}
                  {overdue && <AlertCircle className="w-3 h-3 ml-1" />}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => handleTakeActionClick(visit, e)}
            className={`ml-4 flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {actionButtonText}
            {actionButtonIcon}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {showNewPatientRegistration && onNewPatientRegistration && (
                <button
                  onClick={onNewPatientRegistration}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {newPatientButtonIcon}
                  <span className="hidden sm:inline">{newPatientButtonText}</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={isActuallyRefreshing}
                  className={`p-2.5 rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100 shadow border border-gray-700 hover:border-gray-600 disabled:opacity-40'
                      : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm border border-gray-200 hover:border-gray-300 disabled:opacity-40'
                  }`}
                  title={isActuallyRefreshing ? 'Refreshing...' : 'Refresh queue now'}
                  aria-label="Refresh queue"
                >
                  <RefreshCw className={`w-5 h-5 transition-transform duration-300 ${isActuallyRefreshing ? 'animate-spin' : ''}`} />
                </button>
                {isActuallyRefreshing && <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Refreshing...</span>}
              </div>

              {showStats && queueStats && (
                <div
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-default transition-colors ${
                    isDark ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className={`font-bold text-lg ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      {queueStats.totalVisits}
                    </span>
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>visits</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {showSearch && (
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search Patients in the queue by patient number, name,DOB, phase, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 lg:py-2.5 rounded-lg border-2 transition-all duration-200 outline-none ${
                      isDark
                        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 hover:border-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors cursor-pointer ${
                        isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className={`text-sm mt-2 px-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Found <span className="font-semibold">{filteredVisits.length}</span> visit{filteredVisits.length !== 1 ? 's' : ''} matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}

         
          </div>

          {showStats && queueStats && (
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className={`p-4 rounded-lg cursor-default ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-sm font-medium mb-1">Total Visits</div>
                <div className="text-2xl font-bold">{queueStats.totalVisits}</div>
              </div>

              <div className={`p-4 rounded-lg cursor-default ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-sm font-medium mb-1">Avg Wait Time</div>
                <div className="text-2xl font-bold">{formatWaitTime(queueStats.averageWaitTime)}</div>
              </div>

              <div className={`p-4 rounded-lg cursor-default ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-sm font-medium mb-1">Overdue Visits</div>
                <div className={`text-2xl font-bold ${queueStats.overdueCount > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {queueStats.overdueCount}
                </div>
              </div>

              <div className={`p-4 rounded-lg cursor-default ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="text-sm font-medium mb-1">Active Phases</div>
                <div className="text-2xl font-bold">{Object.keys(queueStats.byPhase).length}</div>
              </div>
            </div>
          )}
        </div>

        {isLoading && !queueData && (
          <div className="py-12">
            <LoadingSkeleton theme={theme} variant="default" message="Loading queue data..." />
          </div>
        )}

        {error && !isLoading && (
          <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 cursor-default" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Queue</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600 mb-4'}>{error.message || 'An error occurred while loading the queue'}</p>
            <button
              onClick={handleManualRefresh}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {filteredVisits.length > 0 ? (
              <div className="space-y-3">{filteredVisits.map(renderVisitRow)}</div>
            ) : queueData ? (
              <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {searchQuery ? (
                  <>
                    <Search className={`w-16 h-16 mx-auto mb-4 cursor-default ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-semibold mb-2">No Matching Visits</h3>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600 mb-4'}>No Patients found matching "{searchQuery}"</p>
                    <button
                      onClick={handleClearSearch}
                      className={`px-4 py-2 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500/20 ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <Users className={`w-16 h-16 mx-auto mb-4 cursor-default ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No visits in the queue matching current filters</p>
                    {showNewPatientRegistration && onNewPatientRegistration && (
                      <button
                        onClick={onNewPatientRegistration}
                        className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isDark ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {newPatientButtonIcon}
                        {newPatientButtonText}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;