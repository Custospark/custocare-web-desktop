/**
 * Facility Onboarding & Configuration Types
 * 
 * Enterprise-grade type definitions for healthcare facility management
 */

export interface FacilityRegistrationData {
  name: string;
  type: FacilityType;
  licenseNumber: string;
  address: Address;
  contact: ContactInfo;
  organizationId?: string;
  referralNetwork: boolean;
}

export type FacilityType = 'Hospital' | 'Clinic' | 'Pharmacy' | 'Lab' | 'Other';

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  emergencyContact: string;
}

export interface DepartmentConfig {
  predefinedDepartments: string[];
  customDepartments: CustomDepartment[];
  routingRules: RoutingRule[];
}

export interface CustomDepartment {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface RoutingRule {
  fromDepartmentId: string;
  toDepartmentId: string;
  condition?: string;
  priority: number;
}

export interface StaffOnboardingData {
  staff: StaffMember[];
  assignments: StaffAssignment[];
  credentials: StaffCredentials[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  licenseNumber: string;
  email: string;
  phone: string;
}

export interface StaffAssignment {
  staffId: string;
  primaryDepartmentId: string;
  secondaryDepartmentIds: string[];
  roleId: string;
  permissions: string[];
}

export interface StaffCredentials {
  staffId: string;
  username: string;
  temporaryPassword: string;
  requirePasswordChange: boolean;
}

export interface WorkflowConfig {
  patientJourneys: PatientJourney[];
  billingRules: BillingRule[];
  approvalHierarchies: ApprovalHierarchy[];
}

export interface PatientJourney {
  id: string;
  name: string;
  departments: string[];
  conditions: string[];
  estimatedDuration: number;
}

export interface BillingRule {
  id: string;
  service: string;
  departmentId: string;
  basePrice: number;
  modifiers: PriceModifier[];
  conditions: string[];
}

export interface PriceModifier {
  type: 'percentage' | 'fixed';
  value: number;
  condition: string;
}

export interface ApprovalHierarchy {
  id: string;
  name: string;
  threshold: number;
  approvers: string[];
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  timeout: number; // hours
  escalateTo: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface FacilityResponse extends FacilityRegistrationData {
  id: string;
  facilityId: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: string;
  updatedAt: string;
}

// Mock Data Types
export interface MockDataStore {
  facilities: FacilityResponse[];
  departments: PredefinedDepartment[];
  roles: RoleDefinition[];
  workflows: WorkflowTemplate[];
}

export interface PredefinedDepartment {
  id: string;
  name: string;
  category: DepartmentCategory;
  required: boolean;
  defaultRouting: string[];
}

export type DepartmentCategory = 
  | 'Emergency'
  | 'Outpatient'
  | 'Inpatient'
  | 'Pharmacy'
  | 'Diagnostic'
  | 'Clinical'
  | 'Administrative';

export interface RoleDefinition {
  id: string;
  name: string;
  category: RoleCategory;
  permissions: Permission[];
  accessLevel: number;
}

export type RoleCategory = 'Clinical' | 'Administrative' | 'Technical' | 'Support';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  type: WorkflowType;
  template: Record<string, any>;
  description: string;
}

export type WorkflowType = 'Patient Journey' | 'Billing' | 'Approval' | 'Clinical';

// State Management Types
export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  isDraft: boolean;
  lastSaved?: string;
  errors: Record<string, string[]>;
}

export interface FacilityState {
  currentFacility: FacilityResponse | null;
  selectedOrganization: string;
  onboardingProgress: Record<string, OnboardingProgress>;
  config: FacilityConfig;
}

export interface FacilityConfig {
  departments: DepartmentConfig;
  staff: StaffOnboardingData;
  workflows: WorkflowConfig;
}