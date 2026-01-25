import React, { useState, useMemo } from 'react';
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
  Hash
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { visitKeys, useGetMyQueue } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import { type QueueFilters } from '../../../../api/dispensing/visit-queue/visitTypes';
import type { QueuePatient, QueueVisit, VisitPhase } from '../../../../api/dispensing/visit-queue/visitTypes';
import { calculateWaitTime, isVisitOverdue, getPhaseDisplayName, getTypeDisplayName } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import { ACUITY_SCORE_DESCRIPTIONS } from '../../../../api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

export interface PatientQueueProps {
  /** Title to display for the queue */
  title?: string;
  /** Subtitle or description for the queue */
  description?: string;
  /** Initial queue filters */
  initialFilters?: QueueFilters;
  /** Callback when a patient is selected */
  onPatientSelect?: (patient: QueuePatient, queueVisit?: QueueVisit) => void;
  /** Callback for Take Action button */
  onTakeAction?: (patient: QueuePatient, queueVisit?: QueueVisit) => void;
  /** Custom action button text */
  actionButtonText?: string;
  /** Custom action button icon */
  actionButtonIcon?: React.ReactNode;
  /** Whether to show queue statistics */
  showStats?: boolean;
  /** Whether to allow filtering by phase */
  allowPhaseFilter?: boolean;
  /** Whether to allow filtering by department */
  allowDepartmentFilter?: boolean;
  /** Whether to show unassigned patients */
  showUnassignedToggle?: boolean;
  /** Custom render function for patient row */
  renderPatientRow?: (patient: QueuePatient, queueVisit?: QueueVisit) => React.ReactNode;
  /** Theme settings */
  theme?: 'light' | 'dark';
  /** Loading state override */
  isLoading?: boolean;
  /** Error state override */
  error?: Error | null;
  /** Additional CSS classes */
  className?: string;
}

export interface QueueStats {
  totalPatients: number;
  averageWaitTime: number;
  overdueCount: number;
  byPhase: Record<VisitPhase, number>;
}

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Formats wait time for display
 */
const formatWaitTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

/**
 * Gets acuity score display configuration
 */
const getAcuityDisplay = (acuityScore: number) => {
  return ACUITY_SCORE_DESCRIPTIONS[acuityScore] || {
    label: 'Unknown',
    color: '#6b7280',
    maxWaitMinutes: 240
  };
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const PatientQueue: React.FC<PatientQueueProps> = ({
  title = 'Patient Queue',
  description = 'Patients waiting for service',
  initialFilters = {},
  onPatientSelect,
  onTakeAction,
  actionButtonText = 'Take Action',
  actionButtonIcon = <ChevronRight className="w-4 h-4" />,
  showStats = true,
  allowPhaseFilter = true,
  allowDepartmentFilter = true,
  showUnassignedToggle = true,
  renderPatientRow,
  theme = 'light',
  isLoading: externalLoading,
  error: externalError,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  // State for filters
  const [filters, setFilters] = useState<QueueFilters>({
    ...initialFilters,
    include_unassigned: initialFilters.include_unassigned ?? false,
  });

  // State for selected patient
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Fetch queue data
  const {
    data: queueData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useGetMyQueue(filters, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const isLoading = externalLoading ?? queryLoading;
  const error = externalError ?? queryError;

  // Calculate queue statistics
  const queueStats = useMemo<QueueStats | null>(() => {
    if (!queueData?.meta?.queue) return null;

    const queue = queueData.meta.queue;

    // Calculate average wait time
    const waitTimes = queue
      .map(visit => calculateWaitTime(visit.waiting_since))
      .filter((time): time is number => time !== null);

    const averageWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length)
      : 0;

    // Count overdue patients
    const overdueCount = queue.filter(visit => 
      isVisitOverdue(visit.acuity_score, visit.waiting_since)
    ).length;

    // Count by phase
    const byPhase = queue.reduce((acc, visit) => {
      acc[visit.current_phase] = (acc[visit.current_phase] || 0) + 1;
      return acc;
    }, {} as Record<VisitPhase, number>);

    return {
      totalPatients: queueData.meta.total_patients,
      averageWaitTime,
      overdueCount,
      byPhase,
    };
  }, [queueData]);

  // Handle filter changes
  const handlePhaseFilterChange = (phase: VisitPhase | 'all') => {
    setFilters(prev => ({
      ...prev,
      current_phase: phase === 'all' ? undefined : phase,
    }));
  };

  const handleDepartmentFilterChange = (departmentId: number | 'all') => {
    setFilters(prev => ({
      ...prev,
      department_id: departmentId === 'all' ? undefined : departmentId,
    }));
  };

  const handleUnassignedToggle = () => {
    setFilters(prev => ({
      ...prev,
      include_unassigned: !prev.include_unassigned,
    }));
  };

  // Handle patient selection
  const handlePatientSelect = (patient: QueuePatient) => {
    const queueVisit = queueData?.meta?.queue.find(
      visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
    );
    
    setSelectedPatientId(patient.patient_number);
    onPatientSelect?.(patient, queueVisit);
  };

  // Handle Take Action
  const handleTakeAction = (patient: QueuePatient, e: React.MouseEvent) => {
    e.stopPropagation();
    const queueVisit = queueData?.meta?.queue.find(
      visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
    );
    onTakeAction?.(patient, queueVisit);
  };

  // Manual refresh with optimistic invalidation
  const handleManualRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: visitKeys.queue(filters) });
    await refetch();
  };

  // Get all unique phases from current queue
  const availablePhases = useMemo(() => {
    if (!queueData?.meta?.queue) return [];
    return Array.from(
      new Set(queueData.meta.queue.map(visit => visit.current_phase))
    ).sort();
  }, [queueData]);

  // Get all unique department IDs from current queue
  const availableDepartments = useMemo(() => {
    if (!queueData?.meta?.allowed_department_ids) return [];
    return queueData.meta.allowed_department_ids;
  }, [queueData]);

  /* -------------------------------------------------------------------------- */
  /*                               RENDER FUNCTIONS                             */
  /* -------------------------------------------------------------------------- */

  // Default patient row renderer
  const defaultRenderPatientRow = (patient: QueuePatient, queueVisit?: QueueVisit) => {
    const waitTime = queueVisit?.waiting_since 
      ? calculateWaitTime(queueVisit.waiting_since)
      : null;
    const isOverdue = queueVisit 
      ? isVisitOverdue(queueVisit.acuity_score, queueVisit.waiting_since)
      : false;
    const acuityDisplay = queueVisit ? getAcuityDisplay(queueVisit.acuity_score) : null;
    const isSelected = selectedPatientId === patient.patient_number;

    return (
      <div
        className={`rounded-lg border p-4 transition-all cursor-pointer ${
          isSelected
            ? isDark
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-blue-500 bg-blue-50'
            : isDark
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        onClick={() => handlePatientSelect(patient)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Patient Avatar/Initial */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-default ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <User className="w-5 h-5" />
            </div>

            {/* Patient Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate cursor-pointer">{patient.name || 'Unknown Patient'}</h3>
                {patient.requires_isolation && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default ${
                    isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Isolation
                  </span>
                )}
              </div>
              
              <div className={`text-sm flex flex-wrap gap-x-4 gap-y-1 cursor-default ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {patient.patient_number}
                </span>
                {patient.date_of_birth && (
                  <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                )}
                {patient.biological_sex && (
                  <span>Sex: {patient.biological_sex}</span>
                )}
              </div>
            </div>

            {/* Queue Information */}
            {queueVisit && (
              <div className="flex-shrink-0 ml-4 text-right">
                <div className="flex items-center gap-3">
                  {/* Visit Type */}
                  <span className={`px-2 py-1 rounded text-xs font-medium cursor-default ${
                    isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getTypeDisplayName(queueVisit.visit_type)}
                  </span>

                  {/* Phase */}
                  <span className={`px-2 py-1 rounded text-xs font-medium cursor-default ${
                    isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {getPhaseDisplayName(queueVisit.current_phase)}
                  </span>

                  {/* Acuity Score */}
                  {acuityDisplay && (
                    <div
                      className="px-2 py-1 rounded text-xs font-medium cursor-default"
                      style={{ 
                        backgroundColor: `${acuityDisplay.color}20`,
                        color: acuityDisplay.color
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
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-default ${
                    isOverdue
                      ? isDark
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-red-100 text-red-800'
                      : isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {formatWaitTime(waitTime)}
                    {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Take Action Button */}
          <button
            onClick={(e) => handleTakeAction(patient, e)}
            className={`ml-4 flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {actionButtonText}
            {actionButtonIcon}
          </button>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               MAIN RENDER                                  */
  /* -------------------------------------------------------------------------- */

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
            
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50'
                    : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'
                }`}
                title="Refresh queue"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Queue Stats */}
              {showStats && queueStats && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-default ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {queueStats.totalPatients} in Queue
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className={`flex flex-wrap gap-3 p-4 rounded-lg mb-6 ${
            isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 cursor-default" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Phase Filter */}
            {allowPhaseFilter && availablePhases.length > 0 && (
              <select
                value={filters.current_phase || 'all'}
                onChange={(e) => handlePhaseFilterChange(e.target.value as VisitPhase | 'all')}
                className={`px-3 py-1.5 rounded border text-sm cursor-pointer ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="all">All Phases</option>
                {availablePhases.map(phase => (
                  <option key={phase} value={phase}>
                    {getPhaseDisplayName(phase)}
                  </option>
                ))}
              </select>
            )}

            {/* Department Filter */}
            {allowDepartmentFilter && availableDepartments.length > 0 && (
              <select
                value={filters.department_id || 'all'}
                onChange={(e) => handleDepartmentFilterChange(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )}
                className={`px-3 py-1.5 rounded border text-sm cursor-pointer ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="all">All Departments</option>
                {availableDepartments.map(deptId => (
                  <option key={deptId} value={deptId}>
                    Department {deptId}
                  </option>
                ))}
              </select>
            )}

            {/* Unassigned Toggle */}
            {showUnassignedToggle && (
              <button
                onClick={handleUnassignedToggle}
                className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 cursor-pointer ${
                  filters.include_unassigned
                    ? isDark
                      ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                      : 'bg-blue-100 border-blue-300 text-blue-700'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filters.include_unassigned ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                {filters.include_unassigned ? 'Show Assigned Only' : 'Include Unassigned'}
              </button>
            )}
          </div>

          {/* Statistics */}
          {showStats && queueStats && (
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div className={`p-4 rounded-lg cursor-default ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="text-sm font-medium mb-1">Total Patients</div>
                <div className="text-2xl font-bold">{queueStats.totalPatients}</div>
              </div>
              
              <div className={`p-4 rounded-lg cursor-default ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="text-sm font-medium mb-1">Avg Wait Time</div>
                <div className="text-2xl font-bold">{formatWaitTime(queueStats.averageWaitTime)}</div>
              </div>
              
              <div className={`p-4 rounded-lg cursor-default ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="text-sm font-medium mb-1">Overdue Patients</div>
                <div className={`text-2xl font-bold ${
                  queueStats.overdueCount > 0
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {queueStats.overdueCount}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg cursor-default ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="text-sm font-medium mb-1">Active Phases</div>
                <div className="text-2xl font-bold">
                  {Object.keys(queueStats.byPhase).length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500 cursor-default" />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Loading queue data...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 cursor-default" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Queue</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600 mb-4'}>
              {error.message || 'An error occurred while loading the queue'}
            </p>
            <button
              onClick={handleManualRefresh}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer ${
                isDark
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Queue Content */}
        {!isLoading && !error && queueData && (
          <>
            {queueData.data.length > 0 ? (
              <div className="space-y-3">
                {queueData.data.map((patient) => {
                  const queueVisit = queueData.meta.queue.find(
                    visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
                  );
                  
                  return renderPatientRow
                    ? renderPatientRow(patient, queueVisit)
                    : defaultRenderPatientRow(patient, queueVisit);
                })}
              </div>
            ) : (
              <div className={`rounded-xl border p-12 text-center ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <Users className={`w-16 h-16 mx-auto mb-4 cursor-default ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No patients in the queue matching current filters
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientQueue;