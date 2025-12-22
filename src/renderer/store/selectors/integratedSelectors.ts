import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { 
  selectAllPatients, 
  selectPatientById,
  selectSelectedPatient 
} from '../slices/patientSlice';
import { 
  selectAllVisits,
  selectCurrentVisit,
  selectActiveVisits,
  selectVisitsForPatient 
} from '../slices/visitSlice';
import { selectRoleQueues, selectActiveQueue } from '../slices/queueSlice';
import { VisitStatus } from '../../types/visit.types';
import { PatientStatus } from '../../types/patient.types';

// Combined patient-visit selectors
export const selectPatientWithCurrentVisit = createSelector(
  [selectSelectedPatient, selectAllVisits],
  (patient, visits) => {
    if (!patient) return null;
    
    const currentVisit = visits.find(v => 
      v.patientId === patient.id && 
      v.status !== VisitStatus.DISCHARGED && 
      v.status !== VisitStatus.CANCELLED
    );
    
    return {
      patient,
      currentVisit,
    };
  }
);

export const selectPatientsWithActiveVisits = createSelector(
  [selectAllPatients, selectActiveVisits],
  (patients, activeVisits) => {
    const patientMap = new Map(patients.map(p => [p.id, p]));
    
    return activeVisits
      .map(visit => ({
        visit,
        patient: patientMap.get(visit.patientId),
      }))
      .filter(item => item.patient)
      .sort((a, b) => {
        // Sort by visit priority then wait time
        const priorityOrder = {
          'CRITICAL': 5,
          'HIGH': 4,
          'MEDIUM': 3,
          'LOW': 2,
          'ROUTINE': 1,
        };
        
        const priorityDiff = priorityOrder[b.visit.priority] - priorityOrder[a.visit.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        const waitTimeA = Date.now() - new Date(a.visit.registrationTime).getTime();
        const waitTimeB = Date.now() - new Date(b.visit.registrationTime).getTime();
        return waitTimeB - waitTimeA;
      });
  }
);

export const selectQueueWithPatientDetails = createSelector(
  [selectActiveQueue, selectAllPatients],
  (queue, patients) => {
    if (!queue) return null;
    
    const patientMap = new Map(patients.map(p => [p.id, p]));
    
    return {
      ...queue,
      items: queue.items.map(item => ({
        ...item,
        patient: patientMap.get(item.patientId),
      })).filter(item => item.patient),
    };
  }
);

// Cross-entity state synchronization selectors
export const selectVisitCompletionImpact = createSelector(
  [selectCurrentVisit],
  (visit) => {
    if (!visit || visit.status !== VisitStatus.DISCHARGE_ORDERED) {
      return null;
    }
    
    // Determine if visit completion should update patient status
    const impact = {
      updatePatientStatus: false,
      newPatientStatus: null as PatientStatus | null,
      requiresFollowUp: false,
      billingActions: [] as string[],
    };
    
    // Example logic - in real system, this would be based on diagnosis, treatment, etc.
    if (visit.chiefComplaint?.toLowerCase().includes('deceased')) {
      impact.updatePatientStatus = true;
      impact.newPatientStatus = PatientStatus.DECEASED;
    } else if (visit.disposition?.type === 'ADMIT') {
      // Patient admitted to hospital - no status change needed
    } else {
      // Regular discharge
      impact.requiresFollowUp = !!visit.disposition?.followUpDate;
      impact.billingActions = ['Generate Invoice', 'Submit Insurance Claim'];
    }
    
    return impact;
  }
);

// Role-based integrated selectors
export const selectRoleBasedPatientAccess = (roleId: string) => createSelector(
  [selectAllPatients],
  (patients) => {
    // This would integrate with role permissions from roleSlice
    // For now, return all patients - in production, filter based on role permissions
    return patients;
  }
);

export const selectRoleBasedQueueView = (
  roleId: string, 
  visibleStatuses: VisitStatus[]
) => createSelector(
  [selectAllVisits, selectAllPatients],
  (visits, patients) => {
    const patientMap = new Map(patients.map(p => [p.id, p]));
    
    // Filter visits by visible statuses for this role
    const filteredVisits = visits.filter(v => visibleStatuses.includes(v.status));
    
    // Enrich with patient data
    return filteredVisits.map(visit => ({
      ...visit,
      patient: patientMap.get(visit.patientId),
      waitTime: Math.floor((Date.now() - new Date(visit.registrationTime).getTime()) / (1000 * 60)),
    })).filter(item => item.patient);
  }
);

// Emergency workflow selectors
export const selectEmergencyWorkflowData = createSelector(
  [selectAllVisits, selectAllPatients],
  (visits, patients) => {
    const emergencyVisits = visits.filter(v => v.isEmergency);
    const emergencyPatients = patients.filter(p => p.isEmergency);
    
    const incompletePatients = emergencyPatients.filter(p => p.requiresDataCompletion);
    const activeEmergencyVisits = emergencyVisits.filter(v => 
      v.status !== VisitStatus.DISCHARGED && 
      v.status !== VisitStatus.CANCELLED
    );
    
    return {
      totalEmergencyVisits: emergencyVisits.length,
      activeEmergencyVisits: activeEmergencyVisits.length,
      incompletePatientRecords: incompletePatients.length,
      recentEmergencyVisits: emergencyVisits
        .sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime())
        .slice(0, 10),
    };
  }
);

// Dashboard statistics selectors
export const selectDashboardStatistics = createSelector(
  [selectAllPatients, selectAllVisits],
  (patients, visits) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayVisits = visits.filter(v => 
      new Date(v.registrationTime) >= todayStart
    );
    
    const weekVisits = visits.filter(v => 
      new Date(v.registrationTime) >= weekStart
    );
    
    const activeVisits = visits.filter(v => 
      v.status !== VisitStatus.DISCHARGED && 
      v.status !== VisitStatus.CANCELLED
    );
    
    const newPatientsThisWeek = patients.filter(p => 
      new Date(p.createdAt) >= weekStart
    );
    
    // Calculate average wait time for active visits
    const totalWaitTime = activeVisits.reduce((sum, visit) => {
      return sum + (Date.now() - new Date(visit.registrationTime).getTime());
    }, 0);
    
    const averageWaitTime = activeVisits.length > 0 
      ? Math.floor(totalWaitTime / activeVisits.length / (1000 * 60))
      : 0;
    
    return {
      totalPatients: patients.length,
      activeVisits: activeVisits.length,
      todayVisits: todayVisits.length,
      weekVisits: weekVisits.length,
      newPatientsThisWeek: newPatientsThisWeek.length,
      averageWaitTime,
      byDepartment: {}, // Would need department data
      byPriority: {}, // Would aggregate by priority
    };
  }
);

// Audit trail compilation
export const selectPatientVisitAuditTrail = (patientId: string) => createSelector(
  [selectPatientById(patientId), selectVisitsForPatient(patientId)],
  (patient, patientVisits) => {
    if (!patient) return [];
    
    const auditTrail = [];
    
    // Patient creation/updates
    auditTrail.push({
      timestamp: patient.createdAt,
      action: 'PATIENT_CREATED',
      entity: 'Patient',
      entityId: patient.id,
      details: `Patient record created by ${patient.createdBy}`,
    });
    
    if (patient.updatedAt !== patient.createdAt) {
      auditTrail.push({
        timestamp: patient.updatedAt,
        action: 'PATIENT_UPDATED',
        entity: 'Patient',
        entityId: patient.id,
        details: `Patient record updated by ${patient.updatedBy}`,
      });
    }
    
    // Visit events
    patientVisits.forEach(visit => {
      auditTrail.push({
        timestamp: visit.registrationTime,
        action: 'VISIT_CREATED',
        entity: 'Visit',
        entityId: visit.id,
        details: `Visit ${visit.visitNumber} registered for ${visit.chiefComplaint}`,
      });
      
      // Add status transitions from audit trail
      visit.auditTrail.forEach((auditEntry, index) => {
        // Parse audit entry - in production, this would be structured data
        auditTrail.push({
          timestamp: visit.updatedAt, // Approximate - would need actual timestamps
          action: 'VISIT_STATUS_CHANGE',
          entity: 'Visit',
          entityId: visit.id,
          details: auditEntry,
        });
      });
      
      if (visit.dischargeTime) {
        auditTrail.push({
          timestamp: visit.dischargeTime,
          action: 'VISIT_COMPLETED',
          entity: 'Visit',
          entityId: visit.id,
          details: `Visit ${visit.visitNumber} discharged`,
        });
      }
    });
    
    // Sort by timestamp
    return auditTrail.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
);