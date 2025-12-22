import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { 
  selectAllVisits, 
  selectVisitById,
  selectTotalVisits 
} from '../slices/visitSlice';
import { VisitStatus, PriorityLevel } from '../../types/visit.types';
import { selectPatientById } from '../slices/patientSlice';

// Basic selectors
export const selectVisitState = (state: RootState) => state.visits;
export const selectCurrentVisit = (state: RootState) => state.visits.currentVisit;
export const selectPatientVisits = (state: RootState) => state.visits.patientVisits;
export const selectQueueItems = (state: RootState) => state.visits.queueItems;
export const selectFilterParams = (state: RootState) => state.visits.filterParams;
export const selectVisitLoading = (state: RootState) => state.visits.isLoading;
export const selectVisitError = (state: RootState) => state.visits.error;

// Memoized selectors
export const selectActiveVisits = createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => 
    v.status !== VisitStatus.DISCHARGED && 
    v.status !== VisitStatus.CANCELLED
  )
);

export const selectEmergencyVisits = createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => v.isEmergency)
);

export const selectVisitByStatus = (status: VisitStatus) => createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => v.status === status)
);

export const selectVisitByPriority = (priority: PriorityLevel) => createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => v.priority === priority)
);

export const selectVisitWaitTime = createSelector(
  [selectCurrentVisit],
  (visit) => {
    if (!visit?.registrationTime) return 0;
    const registrationTime = new Date(visit.registrationTime).getTime();
    const now = Date.now();
    return Math.floor((now - registrationTime) / (1000 * 60)); // minutes
  }
);

// Patient-visit relationship selectors
export const selectVisitsForPatient = (patientId: string) => createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => v.patientId === patientId)
);

export const selectActiveVisitForPatient = (patientId: string) => createSelector(
  [selectAllVisits],
  (visits) => visits.find(v => 
    v.patientId === patientId && 
    v.status !== VisitStatus.DISCHARGED && 
    v.status !== VisitStatus.CANCELLED
  )
);

export const selectVisitWithPatient = (visitId: string) => createSelector(
  [selectVisitById(visitId), (state: RootState) => state],
  (visit, state) => {
    if (!visit) return null;
    const patient = selectPatientById(state, visit.patientId);
    return {
      visit,
      patient,
    };
  }
);

export const selectCurrentVisitWithPatient = createSelector(
  [selectCurrentVisit, (state: RootState) => state],
  (visit, state) => {
    if (!visit) return null;
    const patient = selectPatientById(state, visit.patientId);
    return {
      visit,
      patient,
    };
  }
);

// Queue-related selectors
export const selectQueueVisitsByPriority = createSelector(
  [selectQueueItems],
  (queueItems) => {
    const priorityOrder = {
      [PriorityLevel.CRITICAL]: 5,
      [PriorityLevel.HIGH]: 4,
      [PriorityLevel.MEDIUM]: 3,
      [PriorityLevel.LOW]: 2,
      [PriorityLevel.ROUTINE]: 1,
    };
    
    return [...queueItems].sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }
);

export const selectQueueVisitsByWaitTime = createSelector(
  [selectQueueItems],
  (queueItems) => {
    return [...queueItems].sort((a, b) => {
      const waitTimeA = new Date(a.registrationTime).getTime();
      const waitTimeB = new Date(b.registrationTime).getTime();
      return waitTimeA - waitTimeB;
    });
  }
);

export const selectMyAssignedVisits = (userId: string) => createSelector(
  [selectAllVisits],
  (visits) => visits.filter(v => 
    (v.assignedNurseId === userId || v.assignedPhysicianId === userId) &&
    v.status !== VisitStatus.DISCHARGED &&
    v.status !== VisitStatus.CANCELLED
  )
);

// Statistics selectors
export const selectVisitStatistics = createSelector(
  [selectAllVisits],
  (visits) => {
    const stats = {
      total: visits.length,
      active: visits.filter(v => 
        v.status !== VisitStatus.DISCHARGED && 
        v.status !== VisitStatus.CANCELLED
      ).length,
      byStatus: {} as Record<VisitStatus, number>,
      byPriority: {} as Record<PriorityLevel, number>,
      averageWaitTime: 0,
      longestWaitTime: 0,
      today: visits.filter(v => 
        new Date(v.registrationTime).toDateString() === new Date().toDateString()
      ).length,
    };
    
    // Initialize status counts
    Object.values(VisitStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });
    
    // Initialize priority counts
    Object.values(PriorityLevel).forEach(priority => {
      stats.byPriority[priority] = 0;
    });
    
    // Calculate counts
    let totalWaitTime = 0;
    let maxWaitTime = 0;
    
    visits.forEach(visit => {
      stats.byStatus[visit.status]++;
      stats.byPriority[visit.priority]++;
      
      if (visit.status !== VisitStatus.DISCHARGED) {
        const waitTime = Date.now() - new Date(visit.registrationTime).getTime();
        totalWaitTime += waitTime;
        maxWaitTime = Math.max(maxWaitTime, waitTime);
      }
    });
    
    stats.averageWaitTime = visits.length > 0 
      ? totalWaitTime / visits.length 
      : 0;
    stats.longestWaitTime = maxWaitTime;
    
    return stats;
  }
);

// Workflow state transition selectors
export const selectAllowedTransitions = createSelector(
  [selectCurrentVisit],
  (visit) => {
    if (!visit) return [];
    
    const transitions: Record<VisitStatus, VisitStatus[]> = {
      [VisitStatus.REGISTERED]: [VisitStatus.TRIAGED, VisitStatus.CANCELLED],
      [VisitStatus.TRIAGED]: [VisitStatus.VITAL_SIGNS_TAKEN, VisitStatus.PHYSICIAN_ASSESSMENT],
      [VisitStatus.VITAL_SIGNS_TAKEN]: [VisitStatus.PHYSICIAN_ASSESSMENT],
      [VisitStatus.PHYSICIAN_ASSESSMENT]: [
        VisitStatus.DIAGNOSTICS_ORDERED,
        VisitStatus.TREATMENT,
        VisitStatus.ADMISSION_ORDERED,
        VisitStatus.DISCHARGE_ORDERED,
      ],
      [VisitStatus.DIAGNOSTICS_ORDERED]: [VisitStatus.DIAGNOSTICS_COMPLETED],
      [VisitStatus.DIAGNOSTICS_COMPLETED]: [VisitStatus.PHYSICIAN_ASSESSMENT],
      [VisitStatus.TREATMENT]: [VisitStatus.DISCHARGE_ORDERED, VisitStatus.ADMISSION_ORDERED],
      [VisitStatus.ADMISSION_ORDERED]: [VisitStatus.DISCHARGED],
      [VisitStatus.DISCHARGE_ORDERED]: [VisitStatus.DISCHARGED],
      [VisitStatus.DISCHARGED]: [],
      [VisitStatus.CANCELLED]: [],
      [VisitStatus.EMERGENCY]: [VisitStatus.TRIAGED, VisitStatus.PHYSICIAN_ASSESSMENT],
    };
    
    return transitions[visit.status] || [];
  }
);

export const selectCanTransition = (newStatus: VisitStatus) => createSelector(
  [selectAllowedTransitions],
  (allowedTransitions) => allowedTransitions.includes(newStatus)
);

// Billing-related selectors
export const selectVisitBillingStatus = createSelector(
  [selectCurrentVisit],
  (visit) => visit?.billingStatus || 'PENDING'
);

export const selectVisitRequiresInsuranceVerification = createSelector(
  [selectCurrentVisit],
  (visit) => visit?.requiresInsuranceVerification || false
);

// Audit trail selectors
export const selectVisitAuditTrail = createSelector(
  [selectCurrentVisit],
  (visit) => visit?.auditTrail || []
);

// Filtered visits selectors
export const selectFilteredVisits = createSelector(
  [selectAllVisits, selectFilterParams],
  (visits, filterParams) => {
    let filtered = [...visits];
    
    // Filter by status
    if (filterParams.status?.length) {
      filtered = filtered.filter(v => filterParams.status!.includes(v.status));
    }
    
    // Filter by priority
    if (filterParams.priority?.length) {
      filtered = filtered.filter(v => filterParams.priority!.includes(v.priority));
    }
    
    // Filter by department
    if (filterParams.departmentId) {
      filtered = filtered.filter(v => v.departmentId === filterParams.departmentId);
    }
    
    // Filter by date range
    if (filterParams.dateRange) {
      const start = new Date(filterParams.dateRange.start).getTime();
      const end = new Date(filterParams.dateRange.end).getTime();
      filtered = filtered.filter(v => {
        const visitTime = new Date(v.registrationTime).getTime();
        return visitTime >= start && visitTime <= end;
      });
    }
    
    // Filter by patient ID
    if (filterParams.patientId) {
      filtered = filtered.filter(v => v.patientId === filterParams.patientId);
    }
    
    // Apply pagination
    const startIndex = (filterParams.page - 1) * filterParams.limit;
    const endIndex = startIndex + filterParams.limit;
    
    return {
      data: filtered.slice(startIndex, endIndex),
      pagination: {
        total: filtered.length,
        page: filterParams.page,
        limit: filterParams.limit,
        totalPages: Math.ceil(filtered.length / filterParams.limit),
      },
    };
  }
);