
export interface Department {
  id: string;
  facilityId: string;
  name: string;
  departmentCode: string;
  type: DepartmentType;
  specialties: string[];
  description: string;
  
  capacity: DepartmentCapacity;
  equipment: EquipmentItem[];
  
  staffing: DepartmentStaffing;
  services: DepartmentService[];
  operatingHours: OperatingHours;
  
  financial: DepartmentFinancial;
  compliance: DepartmentCompliance;
  
  status: DepartmentStatus;
  activationDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  
  // Metadata
  version: number;
  isActive: boolean;
  notes?: string;
  tags?: string[];
}

export type DepartmentType = 'Inpatient' | 'Outpatient' | 'Emergency' | 'Diagnostic' | 'Surgical' | 'Administrative' | 'Support';
export type DepartmentStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Closed' | 'Pending' | 'Suspended';

export interface DepartmentCapacity {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  bedTypes: BedType[];
  operatingRooms: number;
  availableOperatingRooms: number;
  consultationRooms: number;
  waitingCapacity: number;
  maxCapacity: number;
  currentUtilization: number;
  totalStaff: number;
}

export interface BedType {
  type: string;
  label: string;
  count: number;
  available: number;
  isSpecialized: boolean;
  specializedFor?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  available: number;
  status: EquipmentStatus;
  lastMaintenance: string;
  nextMaintenance: string;
  manufacturer?: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  departmentId: string;
}

export type EquipmentStatus = 'Operational' | 'Maintenance' | 'Out of Service' | 'Retired';

export interface DepartmentStaffing {
  headOfDepartment: string;
  headId?: string;
  totalStaff: number;
  doctors: number;
  nurses: number;
  technicians: number;
  supportStaff: number;
  administrative: number;
  residents?: number;
  interns?: number;
  vacancies: {
    doctors: number;
    nurses: number;
    technicians: number;
  };
  shiftSchedule?: ShiftSchedule;
}

export interface ShiftSchedule {
  morning: number;
  afternoon: number;
  night: number;
  rotating: number;
}

export interface DepartmentService {
  id: string;
  name: string;
  code?: string;
  available: boolean;
  description: string;
  category: ServiceCategory;
  subCategory?: string;
  duration?: number; // in minutes
  requiresSpecialEquipment: boolean;
  equipmentRequired?: string[];
  requiresSpecialTraining: boolean;
  price?: number;
  insuranceCovered: boolean;
  externalReferral: boolean;
}

export type ServiceCategory = 'Consultation' | 'Diagnostic' | 'Therapeutic' | 'Surgical' | 'Emergency' | 'Preventive' | 'Rehabilitation';

export interface OperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  emergencyCoverage: string;
  holidays?: string;
  specialHours?: Record<string, string>;
}

export interface DepartmentFinancial {
  billingCodes: string[];
  insuranceAccepted: string[];
  pricingModel?: PricingModel;
  costCenter?: string;
  revenueTarget?: number;
  monthlyRevenue?: number[];
  expenses?: DepartmentExpense[];
  budget?: DepartmentBudget;
}

export interface PricingModel {
  type: 'Fixed' | 'Variable' | 'Tiered' | 'InsuranceBased';
  rates?: Record<string, number>;
  discounts?: Record<string, number>;
}

export interface DepartmentExpense {
  id: string;
  category: string;
  amount: number;
  month: string;
  description?: string;
  approved: boolean;
}

export interface DepartmentBudget {
  year: number;
  allocated: number;
  spent: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  category: string;
  allocated: number;
  spent: number;
}

export interface DepartmentCompliance {
  accredited: boolean;
  accreditationBody?: string;
  accreditationId?: string;
  expiryDate: string;
  hipaaCompliant: boolean;
  infectionControlCertified: boolean;
  safetyStandards: string[];
  lastInspection?: string;
  inspectionResults?: InspectionResult[];
  licenses: DepartmentLicense[];
  certifications: Certification[];
}

export interface InspectionResult {
  date: string;
  inspector: string;
  score: number;
  passed: boolean;
  findings?: string[];
  recommendations?: string[];
}

export interface DepartmentLicense {
  type: string;
  number: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
}

export interface Certification {
  name: string;
  certifyingBody: string;
  issueDate: string;
  expiryDate: string;
  certifiedBy?: string;
}

// ==================== SLICE STATE ====================

export interface DepartmentOnboardingState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  draft: Partial<DepartmentFormData> | null;
  validationErrors: Record<string, string>;
}

export interface DepartmentFormData extends Omit<Department, 
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy' | 'version' | 'isActive'
> {
  autoActivate: boolean;
  agreeToTerms: boolean;
  verificationNotes?: string;
}

export interface DepartmentState {
  departments: Department[];
  selectedDepartment: Department | null;
  loading: boolean;
  error: string | null;
  onboarding: DepartmentOnboardingState;
  filters: DepartmentFilters;
  pagination: DepartmentPagination;
}

export interface DepartmentFilters {
  status?: DepartmentStatus[];
  type?: DepartmentType[];
  specialty?: string[];
  facilityId?: string;
  searchQuery?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface DepartmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== INITIAL STATE ====================

export const initialOnboardingState: DepartmentOnboardingState = {
  currentStep: 0,
  totalSteps: 5,
  isSubmitting: false,
  error: null,
  success: false,
  draft: null,
  validationErrors: {},
};

export const initialState: DepartmentState = {
  departments: [],
  selectedDepartment: null,
  loading: false,
  error: null,
  onboarding: initialOnboardingState,
  filters: {
    status: ['Active'],
    type: [],
    specialty: [],
    searchQuery: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};
