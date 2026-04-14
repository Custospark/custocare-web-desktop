/**
 * ============================================================================
 * PLATFORM ADMIN CONTROL TYPES
 * ============================================================================
 * 
 * Type definitions for platform-wide management of facilities, users, and patients.
 */

// ==================== COMMON TYPES ====================

export interface DateRange {
  from: string | null; // ISO date string
  to: string | null;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== FACILITY TYPES ====================

export interface FacilityOwner {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface FacilityStaffMember {
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export interface FacilityBilling {
  total_paid: number;
  balance: number;
}

export interface FacilityLocation {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
}

export interface Facility {
  id: number;
  facility_uuid: string;
  facility_code: string;
  name: string;
  location: FacilityLocation;
  phone: string;
  email: string | null;
  status: 'active' | 'suspended' | 'banned';
  operational_status: 
    | 'fully_operational'
    | 'limited_services'
    | 'emergency_only'
    | 'temporarily_closed'
    | 'permanently_closed'
    | 'under_construction';
  status_reason: string | null;
  status_set_at: string | null;
  created_at: string | null;
  owner: FacilityOwner | null;
  staff: FacilityStaffMember[];
  staff_count: number;
  billing: FacilityBilling;
}

export interface FacilityCounts {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  active: number;
  suspended: number;
  banned: number;
}

export interface StaffCounts {
  total: number;
  assigned: number;
  unassigned: number;
}

export interface FacilitiesResponse {
  data: Facility[];
  meta: PaginationMeta & {
    staff_counts: StaffCounts;
    facility_counts: FacilityCounts;
  };
}

// ==================== USER TYPES ====================

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: number;
  global_user_uuid: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  status_reason: string | null;
  status_set_at: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
}

export interface UserCounts {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  active: number;
  suspended: number;
  banned: number;
}

export interface UsersResponse {
  data: User[];
  meta: PaginationMeta & {
    user_counts: UserCounts;
  };
}

// ==================== PATIENT TYPES ====================

export type PatientStatus = 
  | 'active'
  | 'inactive'
  | 'deceased'
  | 'merged'
  | 'test_patient'
  | 'system_patient';

export interface Patient {
  id: number;
  patient_uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // YYYY-MM-DD
  biological_sex: 'male' | 'female' | 'intersex' | 'unknown';
  status: PatientStatus;
  primary_insurance_provider: string | null;
  created_at: string | null;
}

export interface PatientCounts {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  active: number;
  inactive: number;
  deceased: number;
}

export interface PatientsResponse {
  data: Patient[];
  meta: PaginationMeta & {
    counts: PatientCounts;
  };
}

// ==================== REQUEST PARAMS / FILTERS ====================

export type PeriodFilter = 'today' | 'this_week' | 'this_month';

export interface BaseFilters {
  date_from?: string;      // YYYY-MM-DD
  date_to?: string;        // YYYY-MM-DD
  date?: string;           // YYYY-MM-DD (single date)
  period?: PeriodFilter;
  per_page?: number;
  page?: number;
  search?: string;
}

export interface FacilityFilters extends BaseFilters {
  status?: Facility['status'];
  operational_status?: Facility['operational_status'];
}

export interface UserFilters extends BaseFilters {
  status?: UserStatus;
}

export interface PatientFilters extends BaseFilters {
  status?: PatientStatus;
}

// ==================== STATUS UPDATE TYPES ====================

export interface UpdateStatusRequest {
  status: string;
  status_reason?: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
}