// patientTypes.ts
import { 
  Gender, 
  InsuranceType, 
  BaseEntity,
  BaseFilterParams,
  DateRangeFilter
} from './shared';

// Define shared types that might be missing
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  type?: 'HOME' | 'WORK' | 'OTHER';
}

export interface ContactInfo {
  phone: string;
  email?: string;
  alternativePhone?: string;
  preferredContactMethod?: 'PHONE' | 'EMAIL' | 'SMS' | 'MAIL';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Patient Status Enum
export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DECEASED = 'DECEASED',
  TRANSFERRED = 'TRANSFERRED'
}

export interface PatientInsurance {
  provider: string;
  type: InsuranceType;
  policyNumber: string;
  groupNumber?: string;
  effectiveDate: string;
  expirationDate?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface PatientMedicalInfo {
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  knownAllergies: string[];
  surgicalHistory?: string[];
  familyHistory?: string[];
  socialHistory?: {
    smoking: boolean;
    alcohol: boolean;
    drugs: boolean;
    occupation?: string;
  };
}

export interface PatientDemographics {
  id?: number | string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  ethnicity?: string;
  language?: string;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  religion?: string;
}

export interface Patient extends BaseEntity {
  id: string;
  medicalRecordNumber: string;
  demographics: PatientDemographics;
  status: PatientStatus;
  dateOfDeath?: string;
  
  // Demographics
  address?: Address;
  contactInfo: ContactInfo;
  
  // Medical Information
  medicalInfo: PatientMedicalInfo;
  
  // Insurance
  primaryInsurance?: PatientInsurance;
  secondaryInsurance?: PatientInsurance;
  
  // System
  isEmergency: boolean;
  requiresDataCompletion: boolean;
  completionPercentage: number; // 0-100
  facilityId: string;
  
  // Cross-facility
  linkedPatientIds: string[]; // For patients with records in multiple facilities
  masterPatientId?: string; // Master record ID if merged
  isMasterRecord: boolean;
  
  // Additional info
  notes?: string;
  preferences?: {
    preferredLanguage?: string;
    communicationPreferences?: string[];
    specialNeeds?: string[];
  };
}

export interface PatientSearchParams extends BaseFilterParams {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  medicalRecordNumber?: string;
  phone?: string;
  email?: string;
  status?: PatientStatus[];
  gender?: Gender;
  isEmergency?: boolean;
  requiresDataCompletion?: boolean;
  includeArchived?: boolean;
  ageRange?: {
    min?: number;
    max?: number;
  };
  createdDateRange?: DateRangeFilter;
  updatedDateRange?: DateRangeFilter;
}

export interface PatientCreateData {
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    middleName?: string;
  };
  contactInfo: ContactInfo;
  address?: Address;
  medicalInfo?: Partial<PatientMedicalInfo>;
  emergencyContact?: ContactInfo['emergencyContact'];
  insurance?: Partial<PatientInsurance>;
}

export interface EmergencyPatientData {
  demographics?: {
    firstName?: string;
    lastName?: string;
    gender?: Gender;
    approximateAge?: number;
  };
  identifyingInfo?: string;
  emergencyContact: ContactInfo['emergencyContact'];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
}

export interface PatientDuplicateCheck {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  address?: Partial<Address>;
}

export interface PotentialDuplicate {
  patientId: string;
  matchScore: number; // 0-100
  matchingFields: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  patient: Patient;
  differences: Record<string, { source: unknown; duplicate: unknown }>;
}

export interface PatientMergeData {
  masterPatientId: string;
  duplicatePatientId: string;
  mergeFields: {
    demographics: boolean;
    contactInfo: boolean;
    medicalInfo: boolean;
    insurance: boolean;
    notes: boolean;
  };
  conflictResolution?: Record<string, 'MASTER' | 'DUPLICATE' | 'COMBINE'>;
  notes?: string;
  mergeReason: 'DUPLICATE' | 'CORRECTION' | 'SYSTEM';
}

export interface PatientStats {
  total: number;
  active: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  emergencyPatients: number;
  incompleteRecords: number;
  byGender: Record<Gender, number>;
  byAgeGroup: {
    '0-12': number;
    '13-18': number;
    '19-40': number;
    '41-60': number;
    '61+': number;
  };
  byStatus: Record<PatientStatus, number>;
  trends: {
    dailyAverage: number;
    weeklyChange: number;
    monthlyChange: number;
  };
}

export interface PatientActivity {
  patientId: string;
  activityType: 'VISIT' | 'UPDATE' | 'STATUS_CHANGE' | 'MERGE' | 'INSURANCE_UPDATE';
  timestamp: string;
  details: string;
  userId: string;
  userName: string;
  entityId?: string;
  entityType?: string;
}

export interface PatientUpdateData {
  demographics?: Partial<PatientDemographics>;
  contactInfo?: Partial<ContactInfo>;
  address?: Partial<Address>;
  medicalInfo?: Partial<PatientMedicalInfo>;
  insurance?: Partial<PatientInsurance>;
  status?: PatientStatus;
  notes?: string;
  isEmergency?: boolean;
  requiresDataCompletion?: boolean;
}

export interface PatientValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
    severity: 'ERROR' | 'WARNING';
  }>;
  warnings: string[];
  suggestions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;        // total number of items
  page: number;         // current page
  pageSize: number;     // items per page
  totalPages: number;   // total pages available
}

// Export type guard for Patient
export function isPatient(obj: Patient) {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.medicalRecordNumber === 'string' &&
    obj.demographics &&
    typeof obj.demographics.firstName === 'string' &&
    typeof obj.demographics.lastName === 'string' &&
    obj.status in PatientStatus
  );
}