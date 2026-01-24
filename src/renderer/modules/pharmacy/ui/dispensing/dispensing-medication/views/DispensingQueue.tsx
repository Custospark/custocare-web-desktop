/**
 * ============================================================================
 * DISPENSING QUEUE COMPONENT
 * ============================================================================
 * 
 * Production-grade patient queue component specifically for pharmacy dispensing.
 * Handles patient selection, queue management, and navigation with robust
 * error handling and edge case coverage.
 * 
 * @module DispensingQueue
 * @description Displays patients waiting for dispensing with filtering,
 * real-time updates, and proper state management.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  Clock,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  Activity,
  Hash,
  Pill,
  UserPlus,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { cn } from '../../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

import {
  visitKeys,
  useGetMyQueue,
  calculateWaitTime,
  isVisitOverdue,
  getPhaseDisplayName,
  getTypeDisplayName,
} from '../../../../api/dispensing/visit-queue/useVisitQueries';
import type {
  QueueFilters,
  QueuePatient,
  QueueVisit,
  VisitPhase,
} from '../../../../api/dispensing/visit-queue/visitTypes';
import {ACUITY_SCORE_DESCRIPTIONS } from '../../../../api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface DispensingQueueProps {
  /** Theme for styling */
  theme: Theme;
  /** Custom CSS classes */
  className?: string;
}

interface QueueStats {
  totalPatients: number;
  averageWaitTime: number;
  overdueCount: number;
  byPhase: Partial<Record<VisitPhase, number>>;
}

interface AcuityDisplay {
  label: string;
  color: string;
  maxWaitMinutes: number;
}

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Formats wait time for display with proper null handling
 */
const formatWaitTime = (minutes: number | null): string => {
  if (minutes === null || isNaN(minutes)) return 'N/A';
  
  if (minutes < 0) return 'N/A';
  
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Gets acuity score display configuration with fallback
 */
const getAcuityDisplay = (acuityScore: number): AcuityDisplay => {
  const display = ACUITY_SCORE_DESCRIPTIONS[acuityScore];
  
  if (!display) {
    return {
      label: 'Unknown',
      color: '#6b7280',
      maxWaitMinutes: 240,
    };
  }
  
  return display;
};

/**
 * Safely formats patient name with fallbacks
 */
const formatPatientName = (patient: QueuePatient): string => {
  if (patient.name && patient.name.trim().length > 0) {
    return patient.name.trim();
  }
  
  return `Patient ${patient.patient_number}`;
};

/**
 * Validates patient number format
 */
const isValidPatientNumber = (patientNumber: string | null | undefined): boolean => {
  return !!(
    patientNumber &&
    typeof patientNumber === 'string' &&
    patientNumber.trim().length > 0
  );
};

/**
 * Extracts patient ID from patient number (handles various formats)
 */
const extractPatientId = (patientNumber: string): number | null => {
  try {
    // Handle formats like "PAT-123" or "123"
    const parts = patientNumber.split('-');
    const idString = parts[parts.length - 1];
    const id = parseInt(idString, 10);
    
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const DispensingQueue: React.FC<DispensingQueueProps> = ({ theme, className = '' }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  /* ----------------------------- STATE MANAGEMENT ----------------------------- */

  // Filter state with proper typing
  const [filters, setFilters] = useState<QueueFilters>({
    current_phase: undefined,
    department_id: undefined,
    include_unassigned: false,
    limit: 50,
  });

  // Selected patient state - using patient_number as unique identifier
  const [selectedPatientNumber, setSelectedPatientNumber] = useState<string | null>(null);

  // Search query for client-side filtering
  const [searchQuery, setSearchQuery] = useState<string>('');

  /* ----------------------------- DATA FETCHING ----------------------------- */

  const {
    data: queueData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetMyQueue(filters, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  /* ----------------------------- MEMOIZED VALUES ----------------------------- */

  /**
   * Filtered patients based on search query
   * Memoized to prevent unnecessary recalculations
   */
  const filteredPatients = useMemo<QueuePatient[]>(() => {
    if (!queueData?.data) return [];

    const patients = queueData.data;

    if (!searchQuery.trim()) return patients;

    const query = searchQuery.toLowerCase().trim();

    return patients.filter((patient) => {
      const name = patient.name?.toLowerCase() || '';
      const patientNumber = patient.patient_number?.toLowerCase() || '';
      const dob = patient.date_of_birth?.toLowerCase() || '';

      return (
        name.includes(query) ||
        patientNumber.includes(query) ||
        dob.includes(query)
      );
    });
  }, [queueData?.data, searchQuery]);

  /**
   * Queue statistics calculation with proper null/undefined handling
   * Memoized to prevent unnecessary recalculations
   */
  const queueStats = useMemo<QueueStats | null>(() => {
    if (!queueData?.meta?.queue || !Array.isArray(queueData.meta.queue)) {
      return null;
    }

    const queue = queueData.meta.queue;

    if (queue.length === 0) {
      return {
        totalPatients: 0,
        averageWaitTime: 0,
        overdueCount: 0,
        byPhase: {},
      };
    }

    // Calculate average wait time with null safety
    const waitTimes = queue
      .map((visit) => calculateWaitTime(visit.waiting_since))
      .filter((time): time is number => time !== null && !isNaN(time) && time >= 0);

    const averageWaitTime =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
        : 0;

    // Count overdue patients with proper error handling
    const overdueCount = queue.filter((visit) => {
      try {
        return isVisitOverdue(visit.acuity_score, visit.waiting_since);
      } catch {
        return false;
      }
    }).length;

    // Count by phase with type safety
    const byPhase = queue.reduce<Partial<Record<VisitPhase, number>>>((acc, visit) => {
      if (visit.current_phase) {
        acc[visit.current_phase] = (acc[visit.current_phase] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalPatients: queueData.meta.total_patients || queue.length,
      averageWaitTime,
      overdueCount,
      byPhase,
    };
  }, [queueData]);

const queue = queueData?.meta?.queue;

  const availablePhases: VisitPhase[] = (() => {
    if (!Array.isArray(queue)) return [];

    const phases = new Set<VisitPhase>();
    for (const visit of queue) {
      if (visit?.current_phase) phases.add(visit.current_phase);
    }

    return Array.from(phases).sort();
  })();


  /**
   * Color scheme configuration
   * Memoized to prevent object recreation
   */
  const colors = useMemo(
    () => ({
      textPrimary: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
      cardBg: isDark ? 'bg-gray-800' : 'bg-white',
      cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-700' : 'bg-white',
      inputBorder: isDark ? 'border-gray-600' : 'border-gray-300',
      inputText: isDark ? 'text-gray-300' : 'text-gray-700',
      hoverBg: isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50',
    }),
    [isDark]
  );

  /* ----------------------------- EVENT HANDLERS ----------------------------- */

  /**
   * Handles patient selection with validation
   * Uses useCallback to prevent recreation on every render
   */
  const handlePatientSelect = useCallback(
    async (patient: QueuePatient, queueVisit?: QueueVisit) => {
      // Validate patient number
      if (!isValidPatientNumber(patient.patient_number)) {
        showToast('error', 'Invalid patient number', 3000);
        return;
      }

      // Check if patient requires isolation
      if (patient.requires_isolation) {
        const confirmed = await confirm({
          title: 'Isolation Required',
          message: `This patient requires isolation. Please ensure proper safety protocols are followed.\n\nPatient: ${formatPatientName(patient)}\n\nContinue to dispensing?`,
          confirmText: 'Continue',
          cancelText: 'Cancel',
          variant: 'warning',
          theme,
        });

        if (!confirmed) return;
      }

      // Check if visit is overdue and warn
      if (queueVisit && isVisitOverdue(queueVisit.acuity_score, queueVisit.waiting_since)) {
        const waitTime = calculateWaitTime(queueVisit.waiting_since);
        const acuityDisplay = getAcuityDisplay(queueVisit.acuity_score);

        showToast(
          'warning',
          `Patient has been waiting ${formatWaitTime(waitTime)} (exceeds ${acuityDisplay.label} max wait time)`,
          5000
        );
      }

      // Set selected patient
      setSelectedPatientNumber(patient.patient_number);

      // Navigate to prescription search with patient ID
      try {
        navigate(
          `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${encodeURIComponent(patient.patient_number)}`
        );
      } catch (error) {
        console.error('Navigation error:', error);
        showToast('error', 'Failed to navigate to dispensing page', 3000);
      }
    },
    [confirm, navigate, showToast, theme]
  );

  /**
   * Handles manual queue refresh with user feedback
   * Uses useCallback to prevent recreation on every render
   */
  const handleManualRefresh = useCallback(async () => {
    try {
      // Invalidate queries first
      await queryClient.invalidateQueries({ queryKey: visitKeys.queue(filters) });
      
      // Then refetch
      await refetch();
      
      showToast('success', 'Queue refreshed', 2000);
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('error', 'Failed to refresh queue', 3000);
    }
  }, [filters, queryClient, refetch, showToast]);

  /**
   * Handles phase filter change
   * Uses useCallback to prevent recreation on every render
   */
  const handlePhaseFilterChange = useCallback((phase: VisitPhase | 'all') => {
    setFilters((prev) => ({
      ...prev,
      current_phase: phase === 'all' ? undefined : phase,
    }));
    
    // Reset selected patient when filters change
    setSelectedPatientNumber(null);
  }, []);

  /**
   * Handles unassigned toggle
   * Uses useCallback to prevent recreation on every render
   */
  const handleUnassignedToggle = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      include_unassigned: !prev.include_unassigned,
    }));
    
    // Reset selected patient when filters change
    setSelectedPatientNumber(null);
  }, []);

  /**
   * Handles search query change
   * Uses useCallback to prevent recreation on every render
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // Reset selected patient when searching
    setSelectedPatientNumber(null);
  }, []);

  /**
   * Navigates to patient creation page
   * Uses useCallback to prevent recreation on every render
   */
  const handleCreateNewPatient = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_QUICK_CREATE);
  }, [navigate]);

  /* ----------------------------- RENDER HELPERS ----------------------------- */

  /**
   * Renders individual patient row
   * Memoized component to prevent unnecessary rerenders
   */
  const PatientRow = React.memo<{ patient: QueuePatient; queueVisit: QueueVisit | undefined }>(
    ({ patient, queueVisit }) => {
      const waitTime = queueVisit?.waiting_since ? calculateWaitTime(queueVisit.waiting_since) : null;
      const isOverdue = queueVisit ? isVisitOverdue(queueVisit.acuity_score, queueVisit.waiting_since) : false;
      const acuityDisplay = queueVisit ? getAcuityDisplay(queueVisit.acuity_score) : null;
      const isSelected = selectedPatientNumber === patient.patient_number;

      return (
        <div
          className={cn(
            'rounded-lg border p-4 transition-all cursor-pointer',
            isSelected
              ? isDark
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-blue-500 bg-blue-50'
              : isDark
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                : 'bg-white border-gray-200 hover:bg-gray-50'
          )}
          onClick={() => handlePatientSelect(patient, queueVisit)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePatientSelect(patient, queueVisit);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Patient Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                )}
              >
                <User className="w-5 h-5" />
              </div>

              {/* Patient Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn('font-semibold truncate', colors.textPrimary)}>
                    {formatPatientName(patient)}
                  </h3>
                  {patient.requires_isolation && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                      )}
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Isolation
                    </span>
                  )}
                </div>

                <div className={cn('text-sm flex flex-wrap gap-x-4 gap-y-1', colors.textSecondary)}>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {patient.patient_number}
                  </span>
                  {patient.date_of_birth && (
                    <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                  )}
                  {patient.biological_sex && <span>Sex: {patient.biological_sex}</span>}
                </div>
              </div>

              {/* Queue Information */}
              {queueVisit && (
                <div className="flex-shrink-0 ml-4 text-right">
                  <div className="flex items-center gap-3">
                    {/* Visit Type */}
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {getTypeDisplayName(queueVisit.visit_type)}
                    </span>

                    {/* Phase */}
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                      )}
                    >
                      {getPhaseDisplayName(queueVisit.current_phase)}
                    </span>

                    {/* Acuity Score */}
                    {acuityDisplay && (
                      <div
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${acuityDisplay.color}20`,
                          color: acuityDisplay.color,
                        }}
                        title={`Acuity: ${acuityDisplay.label}`}
                      >
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {queueVisit.acuity_score}
                        </div>
                      </div>
                    )}

                    {/* Wait Time */}
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                        isOverdue
                          ? isDark
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-red-100 text-red-800'
                          : isDark
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {formatWaitTime(waitTime)}
                      {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePatientSelect(patient, queueVisit);
              }}
              className={cn(
                'ml-4 flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              <Pill className="w-4 h-4" />
              Dispense
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }
  );

  PatientRow.displayName = 'PatientRow';

  /* ----------------------------- MAIN RENDER ----------------------------- */

  return (
    <div className={cn('p-6', colors.bg, className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>
                Dispensing Queue
              </h2>
              <p className={colors.textSecondary}>Patients waiting for medication dispensing</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Create New Patient Button */}
              <button
                onClick={handleCreateNewPatient}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                )}
              >
                <UserPlus className="w-5 h-5" />
                New Patient
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isFetching}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50'
                    : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50 border border-gray-300'
                )}
                title="Refresh queue"
              >
                <RefreshCw className={cn('w-5 h-5', isFetching && 'animate-spin')} />
              </button>

              {/* Queue Stats Badge */}
              {queueStats && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  )}
                >
                  <Users className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                  <span
                    className={cn('font-semibold', isDark ? 'text-blue-400' : 'text-blue-600')}
                  >
                    {queueStats.totalPatients} in Queue
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div
            className={cn('flex flex-wrap gap-3 p-4 rounded-lg mb-6', colors.cardBg, colors.cardBorder, 'border')}
          >
            {/* Search Input */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search
                  className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    colors.textSecondary
                  )}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, patient number, or DOB..."
                  className={cn(
                    'w-full pl-10 pr-3 py-2 rounded-lg border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
              </div>
            </div>

            {/* Filter Label */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Phase Filter */}
            {availablePhases.length > 0 && (
              <select
                value={filters.current_phase || 'all'}
                onChange={(e) => handlePhaseFilterChange(e.target.value as VisitPhase | 'all')}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  colors.inputBg,
                  colors.inputBorder,
                  colors.inputText
                )}
              >
                <option value="all">All Phases</option>
                {availablePhases.map((phase) => (
                  <option key={phase} value={phase}>
                    {getPhaseDisplayName(phase)}
                  </option>
                ))}
              </select>
            )}

            {/* Unassigned Toggle */}
            <button
              onClick={handleUnassignedToggle}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                filters.include_unassigned
                  ? isDark
                    ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                    : 'bg-blue-100 border-blue-300 text-blue-700'
                  : isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {filters.include_unassigned ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {filters.include_unassigned ? 'Show Assigned Only' : 'Include Unassigned'}
            </button>
          </div>

          {/* Statistics */}
          {queueStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={cn('p-4 rounded-lg', colors.cardBg, colors.cardBorder, 'border')}>
                <div className={cn('text-sm font-medium mb-1', colors.textSecondary)}>
                  Total Patients
                </div>
                <div className={cn('text-2xl font-bold', colors.textPrimary)}>
                  {queueStats.totalPatients}
                </div>
              </div>

              <div className={cn('p-4 rounded-lg', colors.cardBg, colors.cardBorder, 'border')}>
                <div className={cn('text-sm font-medium mb-1', colors.textSecondary)}>
                  Avg Wait Time
                </div>
                <div className={cn('text-2xl font-bold', colors.textPrimary)}>
                  {formatWaitTime(queueStats.averageWaitTime)}
                </div>
              </div>

              <div className={cn('p-4 rounded-lg', colors.cardBg, colors.cardBorder, 'border')}>
                <div className={cn('text-sm font-medium mb-1', colors.textSecondary)}>
                  Overdue Patients
                </div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    queueStats.overdueCount > 0
                      ? isDark
                        ? 'text-red-400'
                        : 'text-red-600'
                      : isDark
                        ? 'text-green-400'
                        : 'text-green-600'
                  )}
                >
                  {queueStats.overdueCount}
                </div>
              </div>

              <div className={cn('p-4 rounded-lg', colors.cardBg, colors.cardBorder, 'border')}>
                <div className={cn('text-sm font-medium mb-1', colors.textSecondary)}>
                  Active Phases
                </div>
                <div className={cn('text-2xl font-bold', colors.textPrimary)}>
                  {Object.keys(queueStats.byPhase).length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSkeleton variant="list" theme={theme} message="Loading queue data..." />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div
            className={cn(
              'rounded-xl border p-8 text-center',
              isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
            )}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className={cn('text-lg font-semibold mb-2', colors.textPrimary)}>
              Failed to Load Queue
            </h3>
            <p className={cn('mb-4', colors.textSecondary)}>
              {error.message || 'An error occurred while loading the queue'}
            </p>
            <button
              onClick={handleManualRefresh}
              className={cn(
                'px-4 py-2 rounded-lg font-medium',
                'bg-red-600 hover:bg-red-700 text-white'
              )}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Queue Content */}
        {!isLoading && !error && queueData && (
          <>
            {filteredPatients.length > 0 ? (
              <div className="space-y-3">
                {filteredPatients.map((patient) => {
                  const patientId = extractPatientId(patient.patient_number);
                  const queueVisit = queueData.meta.queue.find(
                    (visit) => visit.patient_id === patientId
                  );

                  return (
                    <PatientRow
                      key={patient.patient_number}
                      patient={patient}
                      queueVisit={queueVisit}
                    />
                  );
                })}
              </div>
            ) : (
              <div
                className={cn(
                  'rounded-xl border p-12 text-center',
                  colors.cardBg,
                  colors.cardBorder
                )}
              >
                <Users
                  className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-400')}
                />
                <h3 className={cn('text-lg font-semibold mb-2', colors.textPrimary)}>
                  {searchQuery ? 'No Matching Patients' : 'Queue is Empty'}
                </h3>
                <p className={colors.textSecondary}>
                  {searchQuery
                    ? 'No patients found matching your search criteria'
                    : 'No patients in the queue matching current filters'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={cn(
                      'mt-4 px-4 py-2 rounded-lg font-medium',
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    )}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

DispensingQueue.displayName = 'DispensingQueue';

export default DispensingQueue;