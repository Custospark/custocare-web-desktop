import { 
  VisitStatus, 
  PriorityLevel,
  Gender,
  BaseEntity,
  BaseFilterParams,
  DateRangeFilter,
  ApiResponse as SharedApiResponse,
  PaginatedResponse as SharedPaginatedResponse
} from './shared';
import { PatientDemographics } from './patient';
export { PriorityLevel };


// Enhanced disposition types
export type DispositionType = 'DISCHARGE' | 'ADMIT' | 'TRANSFER' | 'OBSERVATION' | 'REFERRAL' | 'FOLLOW_UP';

export interface Disposition {
  type: DispositionType;
  instructions?: string;
  followUpDate?: string;
  referredTo?: string;
  admissionType?: 'INPATIENT' | 'OUTPATIENT' | 'EMERGENCY';
  transferFacility?: string;
  reason?: string;
  dischargeTime?: string;
}

// Clinical data types
export interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number; // 0-10
  height?: number; // cm
  weight?: number; // kg
  bmi?: number;
  recordedAt: string;
  recordedBy: string;
}

export interface Diagnosis {
  code: string;
  description: string;
  type: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL';
  confirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface Treatment {
  id: string;
  description: string;
  type: 'MEDICATION' | 'PROCEDURE' | 'THERAPY' | 'EDUCATION';
  instructions: string;
  administeredAt?: string;
  administeredBy?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// Visit types
export interface Visit extends BaseEntity {
  id: string;
  patientId: string;
  visitNumber: string;
  status: VisitStatus;
  priority: PriorityLevel;
  facilityId: string;
  departmentId: string;
  
  // Clinical data
  chiefComplaint: string;
  symptoms: string[];
  initialAssessment?: string;
  triageNotes?: string;
  physicianNotes?: string;
  nursingNotes?: string[];
  diagnosis: Diagnosis[];
  treatmentPlan?: Treatment[];
  vitalSigns: VitalSigns[];
  
  // Timing
  registrationTime: string;
  triageTime?: string;
  physicianSeenTime?: string;
  treatmentStartTime?: string;
  dischargeTime?: string;
  estimatedWaitTime?: number; // minutes
  actualWaitTime?: number; // minutes
  
  // Assignment
  assignedNurseId?: string;
  assignedPhysicianId?: string;
  assignedRoom?: string;
  bedNumber?: string;
  assignedAt?: string;
  
  // Disposition
  disposition?: Disposition;
  
  // Billing
  billingStatus: 'PENDING' | 'GENERATED' | 'BILLED' | 'PAID' | 'INSURANCE_PENDING' | 'WRITTEN_OFF';
  isEmergency: boolean;
  requiresInsuranceVerification: boolean;
  insuranceVerified: boolean;
  insuranceVerifiedAt?: string;
  insuranceVerifiedBy?: string;
  
  // Audit trail
  auditTrail: string[]; // References to audit log entries
  
  // Metadata
  tags?: string[];
  urgencyScore: number; // 1-10
  complexityScore: number; // 1-5
  isReadmitted: boolean;
  previousVisitId?: string;
}

export interface VisitCreateData {
  patientId: string;
  chiefComplaint: string;
  priority: PriorityLevel;
  departmentId: string;
  symptoms?: string[];
  isEmergency?: boolean;
  initialAssessment?: string;
  assignedPhysicianId?: string;
  assignedNurseId?: string;
}

export interface EmergencyVisitData {
  patientData: {
    demographics?: {
      firstName?: string;
      lastName?: string;
      gender?: Gender;
      approximateAge?: number;
    };
    identifyingInfo?: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    vitalSigns?: Partial<VitalSigns>;
  };
  chiefComplaint: string;
  priority: PriorityLevel;
  departmentId: string;
  symptoms?: string[];
  initialAssessment?: string;
}

export interface VisitTransitionData {
  visitId: string;
  newStatus: VisitStatus;
  notes?: string;
  userId: string;
  metadata?: {
    vitalSigns?: Partial<VitalSigns>;
    diagnosis?: Partial<Diagnosis>;
    treatment?: Partial<Treatment>;
    disposition?: Partial<Disposition>;
    assignedTo?: string;
    room?: string;
  };
}

export interface VisitFilterParams extends BaseFilterParams {
  patientId?: string;
  status?: VisitStatus[];
  departmentId?: string;
  priority?: PriorityLevel[];
  isEmergency?: boolean;
  assignedTo?: string;
  registrationDateRange?: DateRangeFilter;
  dischargeDateRange?: DateRangeFilter;
  billingStatus?: string[];
  minUrgencyScore?: number;
  maxWaitTime?: number;
  searchTerm?: string;
  pageSize?:number;
}

// Visit statistics types
export interface VisitStatistics {
  total: number;
  active: number;
  averageWaitTime: number;
  medianWaitTime: number;
  ninetyPercentileWaitTime: number;
  byStatus: Record<VisitStatus, number>;
  byPriority: Record<PriorityLevel, number>;
  byDepartment: Record<string, number>;
  byHour: Record<string, number>; // Key format: "HH:00"
  byDay: Record<string, number>; // Key format: "YYYY-MM-DD"
  avgLengthOfStay: number; // in minutes
  readmissionRate: number;
  satisfactionScores?: {
    average: number;
    distribution: Record<number, number>; // 1-5 scale
  };
  throughput: {
    registrationsPerHour: number;
    dischargesPerHour: number;
    conversionRate: number; // Discharges / Registrations
  };
  waitTimeDistribution: {
    lessThan15: number;
    fifteenTo30: number;
    thirtyTo60: number;
    sixtyTo120: number;
    moreThan120: number;
  };
}

export interface DateRangeParams {
  start?: string;
  end?: string;
  facilityId?: string;
  departmentId?: string;
}

export interface VisitStatsResponse extends SharedApiResponse<VisitStatistics> {
  dateRange: {
    start: string;
    end: string;
  };
  facilityId?: string;
  departmentId?: string;
}

export interface TransitionVisitOptimisticContext {
  previousVisit?: ApiResponse<Visit>;
}


export interface VisitQueueItem {
  visitId: string;
  patientId: string;
  visitNumber: string;
  status: VisitStatus;
  priority: PriorityLevel;
  patient: PatientDemographics & {
    medicalRecordNumber: string;
    age: number;
  };
  waitTime: number; // minutes
  clinicalUrgencyScore: number; // 1-10
  complexityScore: number; // 1-5
  assignedTo?: string;
  departmentId: string;
  chiefComplaint: string;
  registrationTime: string;
  lastUpdated: string;
}

// Enhanced visit with patient details
export interface VisitWithPatient extends Visit {
  patient: {
    demographics: PatientDemographics;
    medicalRecordNumber: string;
    contactInfo: {
      phone: string;
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    };
  };
}

// Visit metrics and analytics
export interface VisitMetrics {
  visitId: string;
  timeInStatus: Record<VisitStatus, number>; // minutes in each status
  totalDuration: number; // minutes
  resourceUtilization: {
    physicianTime: number;
    nursingTime: number;
    roomTime: number;
  };
  costEstimate?: number;
  outcome: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
}

// Visit search result
export interface VisitSearchResult {
  visits: Visit[];
  total: number;
  filters: VisitFilterParams;
  stats: Partial<VisitStatistics>;
}

// Visit export data
export interface VisitExportData {
  visits: VisitWithPatient[];
  includeAuditTrail: boolean;
  includeClinicalData: boolean;
  format: 'CSV' | 'JSON' | 'PDF';
}

// Re-export shared types with specific naming for clarity
export type ApiResponse<T> = SharedApiResponse<T>;
export type PaginatedResponse<T> = SharedPaginatedResponse<T>;