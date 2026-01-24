/**
 * ============================================================================
 * DISPENSING QUEUE COMPONENT
 * ============================================================================
 * 
 * Specialized patient queue component for pharmacy/dispensing operations.
 * Displays patients waiting for medication dispensing with prescription
 * tracking, priority handling, and dispensing workflow integration.
 */

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
  Hash,
  Pill,
  Package,
  AlertTriangle,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { visitKeys, useGetMyQueue } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import { type QueueFilters } from '../../../../api/dispensing/visit-queue/visitTypes';
import type { QueuePatient, QueueVisit } from '../../../../api/dispensing/visit-queue/visitTypes';
import { calculateWaitTime, isVisitOverdue, getTypeDisplayName } from '../../../../api/dispensing/visit-queue/useVisitQueries';
import { ACUITY_SCORE_DESCRIPTIONS }  from '../../../../api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

export interface DispensingQueueProps {
  /** Title to display for the queue */
  title?: string;
  /** Subtitle or description for the queue */
  description?: string;
  /** Initial queue filters - defaults to pharmacy phases */
  initialFilters?: QueueFilters;
  /** Callback when a patient is selected for dispensing */
  onDispenseClick?: (patient: QueuePatient, queueVisit?: QueueVisit) => void;
  /** Callback when viewing prescription details */
  onViewPrescription?: (patient: QueuePatient, queueVisit?: QueueVisit) => void;
  /** Whether to show queue statistics */
  showStats?: boolean;
  /** Theme settings */
  theme?: 'light' | 'dark';
  /** Additional CSS classes */
  className?: string;
}

export interface DispensingStats {
  totalPatients: number;
  averageWaitTime: number;
  overdueCount: number;
  urgentCount: number;
  readyToDispense: number;
}

export interface PrescriptionStatus {
  status: 'pending' | 'verified' | 'ready' | 'partial' | 'completed';
  itemCount: number;
  verifiedCount: number;
  dispensedCount: number;
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

/**
 * Mock function to get prescription status
 * In production, this would fetch from actual prescription API
 */
const getPrescriptionStatus = (): PrescriptionStatus => {
  // Mock implementation - replace with actual API call
  const random = Math.random();
  if (random > 0.7) {
    return { status: 'ready', itemCount: 3, verifiedCount: 3, dispensedCount: 0 };
  } else if (random > 0.4) {
    return { status: 'verified', itemCount: 5, verifiedCount: 5, dispensedCount: 0 };
  } else if (random > 0.2) {
    return { status: 'partial', itemCount: 4, verifiedCount: 4, dispensedCount: 2 };
  } else {
    return { status: 'pending', itemCount: 2, verifiedCount: 0, dispensedCount: 0 };
  }
};

/**
 * Gets prescription status color
 */
const getPrescriptionStatusColor = (status: PrescriptionStatus['status'], isDark: boolean) => {
  const colors = {
    pending: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
    verified: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800',
    ready: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800',
    partial: isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-800',
    completed: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
  };
  return colors[status];
};

/**
 * Gets prescription status label
 */
const getPrescriptionStatusLabel = (status: PrescriptionStatus['status']) => {
  const labels = {
    pending: 'Pending Verification',
    verified: 'Verified',
    ready: 'Ready to Dispense',
    partial: 'Partially Dispensed',
    completed: 'Completed',
  };
  return labels[status];
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const DispensingQueue: React.FC<DispensingQueueProps> = ({
  title = 'Dispensing Queue',
  description = 'Patients waiting for medication dispensing',
  initialFilters = {},
  onDispenseClick,
  onViewPrescription,
  showStats = true,
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  // State for filters - default to pharmacy-related phases
  const [filters, setFilters] = useState<QueueFilters>({
    ...initialFilters,
    include_unassigned: initialFilters.include_unassigned ?? false,
  });

  // State for selected patient
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // State for prescription status filter
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState<'all' | PrescriptionStatus['status']>('all');

  // Fetch queue data
  const {
    data: queueData,
    isLoading,
    error,
    refetch,
  } = useGetMyQueue(filters, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Calculate dispensing statistics
  const dispensingStats = useMemo<DispensingStats | null>(() => {
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

    // Count urgent patients (acuity score 1-2)
    const urgentCount = queue.filter(visit => visit.acuity_score <= 2).length;

    // Mock ready to dispense count
    const readyToDispense = queue.filter(() => Math.random() > 0.6).length;

    return {
      totalPatients: queueData.meta.total_patients,
      averageWaitTime,
      overdueCount,
      urgentCount,
      readyToDispense,
    };
  }, [queueData]);

  // Filter queue by prescription status
  const filteredQueue = useMemo(() => {
    if (!queueData?.data) return [];
    
    if (prescriptionStatusFilter === 'all') return queueData.data;

    return queueData.data.filter(patient => {
      const queueVisit = queueData.meta.queue.find(
        visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
      );
      if (!queueVisit) return false;
      
      const rxStatus = getPrescriptionStatus();
      return rxStatus.status === prescriptionStatusFilter;
    });
  }, [queueData, prescriptionStatusFilter]);

  // Handle patient selection
  const handlePatientSelect = (patient: QueuePatient) => {
    const queueVisit = queueData?.meta?.queue.find(
      visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
    );
    
    setSelectedPatientId(patient.patient_number);
    onDispenseClick?.(patient, queueVisit);
  };

  // Handle view prescription
  const handleViewPrescription = (patient: QueuePatient, e: React.MouseEvent) => {
    e.stopPropagation();
    const queueVisit = queueData?.meta?.queue.find(
      visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
    );
    
    onViewPrescription?.(patient, queueVisit);
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: visitKeys.queue(filters) });
    await refetch();
  };

  /* -------------------------------------------------------------------------- */
  /*                          PATIENT ROW RENDERER                              */
  /* -------------------------------------------------------------------------- */

  const renderPatientRow = (patient: QueuePatient) => {
    const queueVisit = queueData?.meta.queue.find(
      visit => visit.patient_id === parseInt(patient.patient_number.split('-').pop() || '0')
    );

    const waitTime = queueVisit?.waiting_since 
      ? calculateWaitTime(queueVisit.waiting_since)
      : null;
    const isOverdue = queueVisit 
      ? isVisitOverdue(queueVisit.acuity_score, queueVisit.waiting_since)
      : false;
    const acuityDisplay = queueVisit ? getAcuityDisplay(queueVisit.acuity_score) : null;
    const isSelected = selectedPatientId === patient.patient_number;
    const prescriptionStatus = queueVisit ? getPrescriptionStatus() : null;

    return (
      <div
        key={patient.patient_number}
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
        <div className="flex items-start justify-between gap-4">
          {/* Left Section - Patient Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Patient Avatar */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <User className="w-6 h-6" />
            </div>

            {/* Patient Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate text-lg">
                  {patient.name || 'Unknown Patient'}
                </h3>
                {patient.requires_isolation && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Isolation
                  </span>
                )}
              </div>
              
              <div className={`text-sm flex flex-wrap gap-x-4 gap-y-1 mb-2 ${
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

              {/* Prescription Status */}
              {prescriptionStatus && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    getPrescriptionStatusColor(prescriptionStatus.status, isDark)
                  }`}>
                    <Pill className="w-3 h-3 mr-1" />
                    {getPrescriptionStatusLabel(prescriptionStatus.status)}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {prescriptionStatus.dispensedCount > 0
                      ? `${prescriptionStatus.dispensedCount}/${prescriptionStatus.itemCount} dispensed`
                      : `${prescriptionStatus.itemCount} items`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Queue Info & Actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Queue Information Badges */}
            {queueVisit && (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {/* Visit Type */}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {getTypeDisplayName(queueVisit.visit_type)}
                </span>

                {/* Acuity Score */}
                {acuityDisplay && (
                  <div
                    className="px-2 py-1 rounded text-xs font-medium"
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
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
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
                  {isOverdue && <AlertTriangle className="w-3 h-3 ml-1" />}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleViewPrescription(patient, e)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                View Rx
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePatientSelect(patient);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  prescriptionStatus?.status === 'ready'
                    ? isDark
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Dispense
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               MAIN RENDER                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <Package className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{title}</h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className={`p-3 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50'
                    : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50 border border-gray-200'
                }`}
                title="Refresh queue"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Total Queue Count */}
              {showStats && dispensingStats && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {dispensingStats.totalPatients}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      in Queue
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          {showStats && dispensingStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Wait Time
                </div>
                <div className="text-2xl font-bold">{formatWaitTime(dispensingStats.averageWaitTime)}</div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ready to Dispense
                </div>
                <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {dispensingStats.readyToDispense}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Urgent Cases
                </div>
                <div className={`text-2xl font-bold ${
                  dispensingStats.urgentCount > 0
                    ? isDark ? 'text-orange-400' : 'text-orange-600'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {dispensingStats.urgentCount}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Overdue
                </div>
                <div className={`text-2xl font-bold ${
                  dispensingStats.overdueCount > 0
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {dispensingStats.overdueCount}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={`flex flex-wrap gap-3 p-4 rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Prescription Status Filter */}
            <select
              value={prescriptionStatusFilter}
              onChange={(e) => setPrescriptionStatusFilter(e.target.value as typeof prescriptionStatusFilter)}
              className={`px-3 py-1.5 rounded border text-sm ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value="all">All Prescriptions</option>
              <option value="pending">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="ready">Ready to Dispense</option>
              <option value="partial">Partially Dispensed</option>
            </select>

            {/* Unassigned Toggle */}
            <button
              onClick={() => setFilters(prev => ({ ...prev, include_unassigned: !prev.include_unassigned }))}
              className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 ${
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
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Loading dispensing queue...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Queue</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error.message || 'An error occurred while loading the queue'}
            </p>
            <button
              onClick={handleManualRefresh}
              className={`px-4 py-2 rounded-lg font-medium ${
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
        {!isLoading && !error && (
          <>
            {filteredQueue.length > 0 ? (
              <div className="space-y-3">
                {filteredQueue.map(renderPatientRow)}
              </div>
            ) : (
              <div className={`rounded-xl border p-12 text-center ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <Package className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-semibold mb-2">Queue is Empty</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {prescriptionStatusFilter !== 'all' 
                    ? `No patients with ${prescriptionStatusFilter} prescriptions`
                    : 'No patients in the dispensing queue'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DispensingQueue;