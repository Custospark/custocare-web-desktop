import type { 
  Visit, 
  VisitTransitionData 
} from '../../features/types/visit';
import  { 
  VisitStatus,  PriorityLevel,

} from '../../features/types/visit';
import { type ValidationError } from '../../features/types/shared';

// Clinical workflow rules
const ALLOWED_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  [VisitStatus.REGISTERED]: [VisitStatus.TRIAGED, VisitStatus.CANCELLED, VisitStatus.EMERGENCY],
  [VisitStatus.TRIAGED]: [
    VisitStatus.VITAL_SIGNS_TAKEN,
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.VITAL_SIGNS_TAKEN]: [
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.PHYSICIAN_ASSESSMENT]: [
    VisitStatus.DIAGNOSTICS_ORDERED,
    VisitStatus.TREATMENT,
    VisitStatus.ADMISSION_ORDERED,
    VisitStatus.DISCHARGE_ORDERED,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.DIAGNOSTICS_ORDERED]: [
    VisitStatus.DIAGNOSTICS_COMPLETED,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.DIAGNOSTICS_COMPLETED]: [
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.TREATMENT]: [
    VisitStatus.DISCHARGE_ORDERED,
    VisitStatus.ADMISSION_ORDERED,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.ADMISSION_ORDERED]: [VisitStatus.DISCHARGED],
  [VisitStatus.DISCHARGE_ORDERED]: [VisitStatus.DISCHARGED],
  [VisitStatus.DISCHARGED]: [],
  [VisitStatus.CANCELLED]: [],
  [VisitStatus.EMERGENCY]: [
    VisitStatus.TRIAGED,
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.CANCELLED,
  ],
};

const REQUIRED_FIELDS_BY_STATUS: Partial<Record<VisitStatus, string[]>> = {
  [VisitStatus.TRIAGED]: ['triageNotes'],
  [VisitStatus.VITAL_SIGNS_TAKEN]: ['vitalSigns'],
  [VisitStatus.PHYSICIAN_ASSESSMENT]: ['physicianNotes'],
  [VisitStatus.DIAGNOSTICS_ORDERED]: ['diagnosticsOrdered'],
  [VisitStatus.TREATMENT]: ['treatmentPlan'],
  [VisitStatus.DISCHARGE_ORDERED]: ['disposition.instructions'],
};

export const validateVisitCreation = (visitData: Visit): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!visitData.patientId?.trim()) {
    errors.push({
      field: 'patientId',
      message: 'Patient ID is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!visitData.chiefComplaint?.trim()) {
    errors.push({
      field: 'chiefComplaint',
      message: 'Chief complaint is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!visitData.priority) {
    errors.push({
      field: 'priority',
      message: 'Priority is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!Object.values(PriorityLevel).includes(visitData.priority)) {
    errors.push({
      field: 'priority',
      message: 'Invalid priority level',
      code: 'INVALID_VALUE',
    });
  }
  
  if (!visitData.departmentId?.trim()) {
    errors.push({
      field: 'departmentId',
      message: 'Department is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  // Chief complaint length validation
  if (visitData.chiefComplaint?.length > 500) {
    errors.push({
      field: 'chiefComplaint',
      message: 'Chief complaint must be less than 500 characters',
      code: 'MAX_LENGTH_EXCEEDED',
    });
  }
  
  return errors;
};

export const validateVisitTransition = (
  currentVisit: Visit,
  transitionData: VisitTransitionData
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { newStatus } = transitionData;
  
  // Check if transition is allowed
  const allowedTransitions = ALLOWED_TRANSITIONS[currentVisit.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    errors.push({
      field: 'newStatus',
      message: `Cannot transition from ${currentVisit.status} to ${newStatus}`,
      code: 'INVALID_TRANSITION',
    });
  }
  
  // Check for required fields based on new status
  const requiredFields = REQUIRED_FIELDS_BY_STATUS[newStatus] || [];
  for (const field of requiredFields) {
    // Check if field is present in transition data
    if (!transitionData.metadata) {
      errors.push({
        field: `metadata.${field}`,
        message: `${field} is required for status ${newStatus}`,
        code: 'REQUIRED_FIELD',
      });
    }
  }
  
  // Special validation for discharge
  if (newStatus === VisitStatus.DISCHARGED) {
    if (!currentVisit.disposition?.instructions?.trim()) {
      errors.push({
        field: 'disposition.instructions',
        message: 'Discharge instructions are required',
        code: 'REQUIRED_FIELD',
      });
    }
  }
  
  // Validation for cancellation
  if (newStatus === VisitStatus.CANCELLED && !transitionData.notes?.trim()) {
    errors.push({
      field: 'notes',
      message: 'Cancellation reason is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  return errors;
};

export const validateEmergencyVisit = (visitData: Visit): ValidationError[] => {
  const errors = validateVisitCreation(visitData);
  
  // Additional emergency validations
  if (visitData.priority !== PriorityLevel.CRITICAL && visitData.priority !== PriorityLevel.HIGH) {
    errors.push({
      field: 'priority',
      message: 'Emergency visits must be CRITICAL or HIGH priority',
      code: 'INVALID_PRIORITY',
    });
  }
  
  // Ensure minimal patient data is present
  if (!visitData.patientId) {
    errors.push({
      field: 'patientData',
      message: 'Minimal patient data is required for emergency visits',
      code: 'REQUIRED_FIELD',
    });
  }
  
  return errors;
};

export const validateVisitAssignment = (
  visit: Visit,
  assignTo: string,
  role: 'NURSE' | 'PHYSICIAN'
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check if visit can be assigned in current state
  const assignableStatuses = [
    VisitStatus.TRIAGED,
    VisitStatus.VITAL_SIGNS_TAKEN,
    VisitStatus.PHYSICIAN_ASSESSMENT,
    VisitStatus.DIAGNOSTICS_ORDERED,
    VisitStatus.TREATMENT,
  ];
  
  if (!assignableStatuses.includes(visit.status)) {
    errors.push({
      field: 'status',
      message: `Visit in ${visit.status} cannot be assigned`,
      code: 'INVALID_STATUS_FOR_ASSIGNMENT',
    });
  }
  
  // Check if already assigned
  if (role === 'NURSE' && visit.assignedNurseId) {
    errors.push({
      field: 'assignedNurseId',
      message: 'Visit is already assigned to a nurse',
      code: 'ALREADY_ASSIGNED',
    });
  }
  
  if (role === 'PHYSICIAN' && visit.assignedPhysicianId) {
    errors.push({
      field: 'assignedPhysicianId',
      message: 'Visit is already assigned to a physician',
      code: 'ALREADY_ASSIGNED',
    });
  }
  
  // Validate assignee ID
  if (!assignTo.trim()) {
    errors.push({
      field: 'assignTo',
      message: 'Assignee ID is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  return errors;
};

export const validatePriorityUpdate = (
  currentPriority: PriorityLevel,
  newPriority: PriorityLevel,
): ValidationError[] => {
  const errors: ValidationError[] = [];
    
  // Check if priority is being escalated
  const priorityOrder = {
    [PriorityLevel.ROUTINE]: 1,
    [PriorityLevel.LOW]: 2,
    [PriorityLevel.MEDIUM]: 3,
    [PriorityLevel.HIGH]: 4,
    [PriorityLevel.CRITICAL]: 5,
  };
  
  const isEscalating = priorityOrder[newPriority] > priorityOrder[currentPriority];
  
  if (isEscalating) {
    errors.push({
      field: 'newPriority',
      message: 'Priority escalation requires physician or triage nurse authorization',
      code: 'AUTHORIZATION_REQUIRED',
    });
  }
  
  // Validate priority value
  if (!Object.values(PriorityLevel).includes(newPriority)) {
    errors.push({
      field: 'newPriority',
      message: 'Invalid priority level',
      code: 'INVALID_VALUE',
    });
  }
  
  return errors;
};

export const canTransitionToStatus = (
  currentStatus: VisitStatus,
  targetStatus: VisitStatus
): boolean => {
  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(targetStatus);
};

export const getRequiredFieldsForStatus = (status: VisitStatus): string[] => {
  return REQUIRED_FIELDS_BY_STATUS[status] || [];
};