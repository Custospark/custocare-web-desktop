// Core enums and shared types
export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECEASED = 'DECEASED',
  TRANSFERRED = 'TRANSFERRED',
  ARCHIVED = 'ARCHIVED'
}

export enum VisitStatus {
  REGISTERED = 'REGISTERED',
  TRIAGED = 'TRIAGED',
  VITAL_SIGNS_TAKEN = 'VITAL_SIGNS_TAKEN',
  PHYSICIAN_ASSESSMENT = 'PHYSICIAN_ASSESSMENT',
  DIAGNOSTICS_ORDERED = 'DIAGNOSTICS_ORDERED',
  DIAGNOSTICS_COMPLETED = 'DIAGNOSTICS_COMPLETED',
  TREATMENT = 'TREATMENT',
  ADMISSION_ORDERED = 'ADMISSION_ORDERED',
  DISCHARGE_ORDERED = 'DISCHARGE_ORDERED',
  DISCHARGED = 'DISCHARGED',
  CANCELLED = 'CANCELLED',
  EMERGENCY = 'EMERGENCY'
}

export enum RoleType {
  ADMIN = 'ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  TRIAGE_NURSE = 'TRIAGE_NURSE',
  PHYSICIAN = 'PHYSICIAN',
  NURSE = 'NURSE',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  RADIOLOGY_TECH = 'RADIOLOGY_TECH',
  PHARMACIST = 'PHARMACIST',
  BILLING_CLERK = 'BILLING_CLERK'
}

export enum PriorityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  ROUTINE = 'ROUTINE'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}

export enum InsuranceType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SELF_PAY = 'SELF_PAY',
  CHARITY = 'CHARITY',
  OTHER = 'OTHER'
}

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic API response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    
  };
}

// Enhanced Audit Trail with strict typing
export type AuditEntityType = 'PATIENT' | 'VISIT' | 'BILLING' | 'QUEUE' | 'ROLE';
export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' 
  | 'STATUS_CHANGE' | 'TRANSITION' 
  | 'ASSIGN' | 'MERGE' | 'ARCHIVE';

export interface AuditTrail<T = unknown> {
  id: string;
  entityId: string;
  entityType: AuditEntityType;
  action: AuditAction;
  previousState?: T;
  newState?: T;
  changes?: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Facility and department types
export interface Facility {
  id: string;
  name: string;
  code: string;
  address: Address;
  phone: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  facilityId: string;
  code: string;
  description?: string;
  isActive: boolean;
}

// User types (simplified for context)
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  facilityId: string;
}

// Common filter types
export interface DateRangeFilter {
  start: string;
  end: string;
}

export interface BaseFilterParams {
  facilityId?: string;
  dateRange?: DateRangeFilter;
  page: number;
  limit: number;
}

// Generic state types for audit trails
export type EntityState = Record<string, unknown>;