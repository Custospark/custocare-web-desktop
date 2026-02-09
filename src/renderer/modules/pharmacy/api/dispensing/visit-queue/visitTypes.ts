/**
 * ============================================================================
 * VISIT TYPE DEFINITIONS
 * ============================================================================
 * 
 * TypeScript type declarations for visit operations in the healthcare
 * facility management system. These types correspond to the backend API
 * specifications and provide type-safe interfaces for visit management.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Visit status enumeration
 * Represents the overall status of a visit
 */
export enum VisitStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  IN_PROGRESS = 'in_progress',
}

/**
 * Visit type enumeration
 * Represents the type/category of visit
 */
export enum VisitType {
  OUTPATIENT = 'outpatient',
  INPATIENT = 'inpatient',
  EMERGENCY = 'emergency',
  URGENT_CARE = 'urgent_care',
  VIRTUAL_TELEHEALTH = 'virtual_telehealth',
  HOME_HEALTH = 'home_health',
  OBSERVATION = 'observation',
  DAY_SURGERY = 'day_surgery',
  CONSULTATION = 'consultation',
  FOLLOWUP = 'followup',
  PREVENTIVE_WELLNESS = 'preventive_wellness',
}

/**
 * Visit subtype enumeration
 * Provides additional categorization within visit types
 */
export enum VisitSubtype {
  NEW_PATIENT = 'new_patient',
  ESTABLISHED_PATIENT = 'established_patient',
  ANNUAL_PHYSICAL = 'annual_physical',
  SICK_VISIT = 'sick_visit',
  INJURY = 'injury',
  PROCEDURE = 'procedure',
  DIAGNOSTIC = 'diagnostic',
  THERAPY_SESSION = 'therapy_session',
}

/**
 * Visit phase enumeration
 * Represents the current stage in the patient journey
 */
export enum VisitPhase {
  REGISTRATION = 'registration',
  WAITING_TRIAGE = 'waiting_triage',
  TRIAGE = 'triage',
  WAITING_PROVIDER = 'waiting_provider',
  CONSULTATION = 'consultation',
  DIAGNOSTIC_TESTS = 'diagnostic_tests',
  AWAITING_RESULTS = 'awaiting_results',
  TREATMENT = 'treatment',
  PROCEDURES = 'procedures',
  OBSERVATION = 'observation',
  ADMISSION_PENDING = 'admission_pending',
  BILLING = 'billing',
  DISCHARGE_PENDING = 'discharge_pending',
  DISCHARGED = 'discharged',
  LEFT_WITHOUT_BEING_SEEN = 'left_without_being_seen',
  LEFT_AGAINST_MEDICAL_ADVICE = 'left_against_medical_advice',
  TRANSFERRED = 'transferred',
  ADMITTED = 'admitted',
  EXPIRED = 'expired',
}

/**
 * Mode of arrival enumeration
 * Describes how the patient arrived at the facility
 */
export enum ModeOfArrival {
  WALK_IN = 'walk_in',
  AMBULANCE = 'ambulance',
  PRIVATE_VEHICLE = 'private_vehicle',
  POLICE_TRANSPORT = 'police_transport',
  AIR_AMBULANCE = 'air_ambulance',
  WHEELCHAIR_TRANSPORT = 'wheelchair_transport',
  TRANSFER_FROM_FACILITY = 'transfer_from_facility',
}

/**
 * Discharge disposition enumeration
 * Describes the patient's disposition upon discharge
 */
export enum DischargeDisposition {
  HOME = 'home',
  ADMITTED_TO_HOSPITAL = 'admitted_to_hospital',
  TRANSFERRED_TO_FACILITY = 'transferred_to_facility',
  LEFT_AMA = 'left_ama',
  LEFT_WITHOUT_SEEN = 'left_without_seen',
  EXPIRED = 'expired',
  HOSPICE = 'hospice',
  SKILLED_NURSING_FACILITY = 'skilled_nursing_facility',
  REHABILITATION_FACILITY = 'rehabilitation_facility',
  PSYCHIATRIC_FACILITY = 'psychiatric_facility',
  LAW_ENFORCEMENT_CUSTODY = 'law_enforcement_custody',
}
/* -------------------------------------------------------------------------- */
/*                              MUTATION CONTEXT TYPES                        */
/* -------------------------------------------------------------------------- */

/**
 * Context for update visit mutation
 */
export interface UpdateVisitMutationContext {
  previousVisit?: VisitResponse;
}

/**
 * Context for create visit mutation
 */
export interface CreateVisitMutationContext {
  previousVisits?: VisitListResponse;
}

/**
 * Context for update visit phase mutation
 */
export interface UpdateVisitPhaseMutationContext {
  previousVisit?: VisitResponse;
}

/**
 * Insurance verification status
 */
export enum InsuranceVerificationStatus {
  NOT_VERIFIED = 'not_verified',
  VERIFIED = 'verified',
  PENDING = 'pending',
  DENIED = 'denied',
  NOT_APPLICABLE = 'not_applicable',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  NOT_BILLED = 'not_billed',
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID_IN_FULL = 'paid_in_full',
  INSURANCE_PENDING = 'insurance_pending',
  DENIED = 'denied',
  BAD_DEBT = 'bad_debt',
  CHARITY_CARE = 'charity_care',
}


export interface AssignStaffToVisitRequest {
  visit_id: number;
  assigned_staff_id: number;
}

export type AssignStaffToVisitResponse = VisitResponse;

export interface AssignStaffToVisitParams {
  data: AssignStaffToVisitRequest;
}


/* -------------------------------------------------------------------------- */
/*                              CORE DATA TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Patient information from queue response
 * Lean representation for queue display
 */


  // export interface QueueVisitItem {
  //   visit_id: number;
  //   visit_uuid: string;
  //   facility_id: number;

  //   patient_id: number;
  //   patient: QueuePatient | null; // 👈 embedded patient snapshot for THIS visit row

  //   current_phase: VisitPhase;
  //   current_department_id: number | null;

  //   assigned_staff_id: number | null;
  //   assigned_at: string | null;

  //   waiting_since: string | null;
  //   acuity_score: number;
  //   arrived_at: string | null;

  //   visit_type: VisitType;
  //   status: VisitStatus;
  //   is_walk_in: boolean;
  // }

  export interface QueueMeta {
  facility_id: number;
  staff_id: number;
  role_code: string | null;
  filters: {
    current_phase: VisitPhase | null;
    department_id: number | null;
    include_unassigned: boolean;
  };
  allowed_department_ids: number[] | null;

  queue: QueueVisit[];           
  queue_visits?: QueueVisitItem[];  

  total_visits: number;
  total_patients: number;
}



/**
 * Complete visit entity as returned by API
 */
export interface Visit {
  // Primary identifiers
  id: number;
  visit_uuid: string;
  facility_id: number;
  patient_id: number;

  // Visit classification
  visit_type: VisitType;
  visit_subtype: VisitSubtype | null;
  
  // Clinical information
  acuity_score: number;
  chief_complaints: string[];
  symptoms_on_arrival: string[] | null;
  patient_reported_history: string | null;
  
  // Timeline
  arrived_at: string;
  registered_at: string | null;
  waiting_since: string | null;
  clinical_care_started_at: string | null;
  clinical_care_ended_at: string | null;
  scheduled_time: string | null;
  expected_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  
  // Arrival information
  mode_of_arrival: ModeOfArrival | null;
  accompanying_person: string | null;
  is_walk_in: boolean;
  
  // Referral information
  referring_facility_id: number | null;
  referring_provider_staff_id: number | null;
  external_referral_id: string | null;
  referral_reason: string | null;
  
  // Current state
  current_department_id: number | null;
  current_phase: VisitPhase;
  status: VisitStatus;
  
  // Staff assignment
  assigned_staff_id: number | null;
  assigned_at: string | null;
  
  // Insurance and billing
  insurance_preauth_id: string | null;
  insurance_verification_status: InsuranceVerificationStatus;
  insurance_verified_at: string | null;
  estimated_total_charges: number | null;
  patient_estimated_responsibility: number | null;
  payment_status: PaymentStatus;
  
  // Clinical data
  vital_signs_summary: Record<string, unknown> | null;
  diagnosis_codes: string[] | null;
  procedure_codes: string[] | null;
  medications_administered: Array<Record<string, unknown>> | null;
  
  // Discharge information
  discharged_at: string | null;
  discharged_by_staff_id: number | null;
  discharge_disposition: DischargeDisposition | null;
  discharge_instructions: string | null;
  discharge_medications: Array<Record<string, unknown>> | null;
  
  // Follow-up
  followup_scheduled_at: string | null;
  followup_provider_staff_id: number | null;
  
  // Safety and special needs
  sentinel_event_flagged: boolean;
  safety_alerts: Array<Record<string, unknown>> | null;
  requires_interpreter: boolean;
  interpreter_language: string | null;
  isolation_required: boolean;
  isolation_type: string | null;
  
  // Cancellation
  cancellation_reason: string | null;
  cancelled_at: string | null;
  
  // Metadata and audit
  scheduled_appointment_id: number | null;
  metadata: Record<string, unknown> | null;
  created_by_staff_id: number | null;
  updated_by_staff_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relations (when included)
  patient?: QueuePatient;
  facility?: {
    id: number;
    name: string;
    facility_uuid: string;
  };
  currentDepartment?: {
    id: number;
    name: string;
    department_uuid: string;
  };
  assignedStaff?: {
    id: number;
    name: string;
    professional_title: string;
  };
}

/**
 * Simplified visit for lists
 */
export interface VisitListItem {
  visit_uuid: string;
  patient_name: string;
  patient_id: number;
  visit_type: VisitType;
  current_phase: VisitPhase;
  status: VisitStatus;
  acuity_score: number;
  arrived_at: string;
  waiting_since: string | null;
  current_department: string | null;
  assigned_staff: string | null;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Query parameters for filtering visits
 */
export interface VisitFilters {
  facility_id?: number;
  patient_id?: number;
  status?: VisitStatus;
  visit_type?: VisitType;
  current_phase?: VisitPhase;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}

/**
 * Queue filters for staff-specific visit queue
 */
export interface QueueFilters {
  current_phase?: VisitPhase;
  department_id?: number;
  include_unassigned?: boolean;
  limit?: number;
  facility_id?:number;
  staff_id?:number;
}

/**
 * Request payload for creating a visit
 */
export interface CreateVisitRequest {
  // Required fields
  facility_id: number;
  patient_id: number;
  visit_type: VisitType;
  chief_complaints: string[];
  arrived_at: string;
  
  // Optional fields with defaults
  visit_subtype?: VisitSubtype | null;
  acuity_score?: number;
  symptoms_on_arrival?: string[] | null;
  patient_reported_history?: string | null;
  registered_at?: string | null;
  mode_of_arrival?: ModeOfArrival | null;
  accompanying_person?: string | null;
  referring_facility_id?: number | null;
  referring_provider_staff_id?: number | null;
  external_referral_id?: string | null;
  referral_reason?: string | null;
  current_department_id?: number | null;
  current_phase?: VisitPhase;
  waiting_since?: string | null;
  clinical_care_started_at?: string | null;
  clinical_care_ended_at?: string | null;
  expected_duration_minutes?: number | null;
  actual_duration_minutes?: number | null;
  scheduled_appointment_id?: number | null;
  is_walk_in?: boolean;
  scheduled_time?: string | null;
  insurance_preauth_id?: string | null;
  insurance_verification_status?: InsuranceVerificationStatus;
  insurance_verified_at?: string | null;
  vital_signs_summary?: Record<string, unknown> | null;
  diagnosis_codes?: string[] | null;
  procedure_codes?: string[] | null;
  medications_administered?: Array<Record<string, unknown>> | null;
  requires_interpreter?: boolean;
  interpreter_language?: string | null;
  isolation_required?: boolean;
  isolation_type?: string | null;
  estimated_total_charges?: number | null;
  patient_estimated_responsibility?: number | null;
  payment_status?: PaymentStatus;
  status?: VisitStatus;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  created_by_staff_id?: number | null;
  updated_by_staff_id?: number | null;
  metadata?: Record<string, unknown> | null;
}


export interface QueueVisitCardProps {
  theme: 'light' | 'dark';
  isSelected: boolean;
  visit: QueueVisitItem;
  onSelect: (visit: QueueVisitItem) => void;
  onTakeAction: (visit: QueueVisitItem, e: React.MouseEvent<HTMLButtonElement>) => void;

  actionButtonText: string;
  actionButtonIcon?: React.ReactNode;

  // your helpers
  getTypeDisplayName: (t: VisitType) => string;
  getPhaseDisplayName: (p: VisitPhase) => string;
  formatWaitTime: (minutes: number) => string;
  getAcuityDisplay?: (score: number) => { label: string; color: string } | null;
}


/**
 * Request payload for updating a visit
 */
export type UpdateVisitRequest = Partial<CreateVisitRequest>;

/**
 * Request payload for updating visit phase
 */
export interface UpdateVisitPhaseRequest {
  phase: VisitPhase;
  additional_data?: Record<string, unknown>;
}

/**
 * Request payload for updating visit status
 */
export interface UpdateVisitStatusRequest {
  status: VisitStatus;
  additional_data?: Record<string, unknown>;
}
/* -------------------------------------------------------------------------- */
/*                              CORE DATA TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Patient information from queue response
 * Lean representation for queue display
 */
export interface QueuePatient {
  patient_number: string;
  global_user_uuid?: string;
  name: string | null;
  date_of_birth: string | null;
  biological_sex: string | null;
  blood_type: string | null;
  status: string;
  requires_isolation: boolean;
  created_at: string | null;
}

/**
 * Legacy queue visit information (visit-level but NOT visit-centric in UI)
 * NOTE: legacy `meta.queue` stays for backward compatibility.
 */
export interface QueueVisit {
  visit_uuid: string;
  patient_id: number;

  current_phase: VisitPhase;
  current_department_id: number | null;

  assigned_staff_id: number | null;
  assigned_at: string | null;

  waiting_since: string | null;
  acuity_score: number;
  arrived_at: string | null;

  visit_type: VisitType;
  status: VisitStatus;
}

/**
 * ✅ New: Visit-centric queue item.
 * Each row represents a VISIT (even if patient repeats).
 * This is what you use to "unpack" guest visits.
 */
export interface QueueVisitItem {
  visit_id: number;
  visit_uuid: string;
  facility_id: number;

  patient_id: number;
  patient: QueuePatient | null;

  current_phase: VisitPhase;
  current_department_id: number | null;

  assigned_staff_id: number | null;
  assigned_at: string | null;

  waiting_since: string | null;
  acuity_score: number;
  arrived_at: string | null;

  visit_type: VisitType;
  status: VisitStatus;
  is_walk_in: boolean;
}


/**
 * Queue response metadata
 * - `queue` remains legacy
 * - `queue_visits` is NEW and visit-centric
 */
export interface QueueMeta {
  facility_id: number;
  staff_id: number;
  role_code: string | null;

  filters: {
    current_phase: VisitPhase | null;
    department_id: number | null;
    include_unassigned: boolean;
  };

  allowed_department_ids: number[] | null;

  queue: QueueVisit[];                 // ✅ legacy
  queue_visits?: QueueVisitItem[];     // ✅ new (optional)

  total_visits: number;
  total_patients: number;
}

/**
 * Queue response structure
 */
export interface QueueResponse {
  success: boolean;
  data: QueuePatient[]; // legacy patient list (optional for UI)
  meta: QueueMeta;
}

/**
 * Request payload for discharging a visit
 */
export interface DischargeVisitRequest {
  discharge_disposition: DischargeDisposition;
  discharge_instructions?: string | null;
  discharge_medications?: Array<Record<string, unknown>> | null;
  followup_scheduled_at?: string | null;
  followup_provider_staff_id?: number | null;
  discharged_at?: string | null;
}

/**
 * Request payload for registering a visit
 */
export interface RegisterVisitRequest {
  registered_at?: string | null;
  mode_of_arrival?: ModeOfArrival | null;
  accompanying_person?: string | null;
  insurance_preauth_id?: string | null;
}

/**
 * Request payload for cancelling a visit
 */
export interface CancelVisitRequest {
  cancellation_reason: string;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Single visit response
 */
export type VisitResponse = ApiResponse<Visit>;

/**
 * Visit list response
 */
export type VisitListResponse = PaginatedResponse<Visit[]>;


/**
 * Statistics response
 */
export interface VisitStatisticsResponse {
  total_visits: number;
  active_visits: number;
  completed_today: number;
  average_wait_time: number;
  by_phase: Record<VisitPhase, number>;
  by_type: Record<VisitType, number>;
}

/* -------------------------------------------------------------------------- */
/*                    Staff Forwarding Related Types                          */
/* -------------------------------------------------------------------------- */

/**
 * Staff presence status enumeration
 */
export enum StaffPresenceStatus {
  OFF_DUTY = 'off_duty',
  ON_DUTY = 'on_duty',
  ON_BREAK = 'on_break',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
}

/**
 * Facility space type enumeration
 */
export enum FacilitySpaceType {
  CONSULTATION = 'consultation',
  TRIAGE = 'triage',
  LAB = 'lab',
  THEATRE = 'theatre',
  WARD = 'ward',
  PHARMACY = 'pharmacy',
}

/**
 * Staff assignment filters for forwarding
 */
export interface StaffForwardingFilters {
  role_code?: string;
  department_id?: number;
  presence_status?: StaffPresenceStatus;
  search?: string;
  limit?: number;
  exclude_current_staff?: boolean;
}

/**
 * Staff space information
 */
export interface StaffSpaceInfo {
  name: string;
  type: FacilitySpaceType;
  floor: string | null;
}

/**
 * Staff availability information
 */
export interface StaffAvailability {
  is_available: boolean;
  reason: string;
}

/**
 * Individual staff member for forwarding
 */
export interface ForwardingStaff {
  staff_id: number;
  staff_uuid: string;
  employee_id: string;
  professional_title: string | null;
  global_role_level: string;
  
  // User information
  first_name: string;
  last_name: string;
  display_name: string | null;
  full_name: string;
  
  // Facility role information
  role_code: string;
  module_code: string[] | null;
  department_ids: number[] | null;
  
  // Presence information
  presence_status: StaffPresenceStatus;
  presence_started_at: string;
  is_available: boolean;
  availability_reason: string;
  
  // Space information
  current_space: StaffSpaceInfo | null;
  
  // Workload metrics
  max_concurrent_patients: number;
  current_patient_count: number;
  total_patients_treated: number;
  workload_percentage: number;
}

/**
 * Grouped staff lists
 */
export interface GroupedStaff {
  available: ForwardingStaff[];
  busy: ForwardingStaff[];
  other: ForwardingStaff[];
}

/**
 * Staff forwarding summary
 */
export interface StaffForwardingSummary {
  total: number;
  available: number;
  busy: number;
  other: number;
}

/**
 * Staff forwarding response data
 */
export interface StaffForwardingData {
  staff: ForwardingStaff[];
  grouped: GroupedStaff;
  summary: StaffForwardingSummary;
}

/**
 * Staff forwarding response metadata
 */
export interface StaffForwardingMeta {
  facility_id: number;
  filters_applied: Partial<StaffForwardingFilters>;
  excluded_current_staff: number | null;
}

/**
 * Complete staff forwarding API response
 */
export interface StaffForwardingResponse {
  success: boolean;
  data: StaffForwardingData;
  meta: StaffForwardingMeta;
  message: string;
}
/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Visit UUID type alias
 */
export type VisitUUID = string;

/**
 * Patient UUID type alias
 */
export type PatientUUID = string;

/**
 * Phase parameter type
 */
export type PhaseParam = VisitPhase;

/**
 * Status parameter type
 */
export type StatusParam = VisitStatus;

/**
 * Mutation callback options
 */
export interface MutationCallbacks<TData, TError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: () => void;
}

/**
 * Parameters for update mutation
 */
export interface UpdateVisitParams {
  uuid: VisitUUID;
  data: UpdateVisitRequest;
  previousVisit?:Visit;
}

/**
 * Parameters for phase update mutation
 */
export interface UpdateVisitPhaseParams {
  uuid: VisitUUID;
  data: UpdateVisitPhaseRequest;
}

/**
 * Parameters for status update mutation
 */
export interface UpdateVisitStatusParams {
  uuid: VisitUUID;
  data: UpdateVisitStatusRequest;
}

/**
 * Parameters for discharge mutation
 */
export interface DischargeVisitParams {
  uuid: VisitUUID;
  data: DischargeVisitRequest;
}

/**
 * Parameters for register mutation
 */
export interface RegisterVisitParams {
  uuid: VisitUUID;
  data: RegisterVisitRequest;
}

/**
 * Parameters for cancel mutation
 */
export interface CancelVisitParams {
  uuid: VisitUUID;
  data: CancelVisitRequest;
}

/**
 * Parameters for clinical care start mutation
 */
export interface StartClinicalCareParams {
  uuid: VisitUUID;
}

/**
 * Parameters for clinical care end mutation
 */
export interface EndClinicalCareParams {
  uuid: VisitUUID;
}

/**
 * Parameters for delete mutation
 */
export interface DeleteVisitParams {
  uuid: VisitUUID;
}

/**
 * Parameters for restore mutation
 */
export interface RestoreVisitParams {
  uuid: VisitUUID;
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  data: never[];
}

/**
 * Phase transition configuration
 */
export interface PhaseTransition {
  from: VisitPhase[];
  to: VisitPhase;
  allowedRoles?: string[];
  requiresNote?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                             CONSTANTS                                      */
/* -------------------------------------------------------------------------- */

/**
 * Default visit filters
 */
export const DEFAULT_VISIT_FILTERS: VisitFilters = {
  per_page: 15,
  page: 1,
};

/**
 * Default queue filters
 */
export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  include_unassigned: false,
  limit: 50,
};

/**
 * Allowed phase transitions for UI validation
 */
export const ALLOWED_PHASE_TRANSITIONS: PhaseTransition[] = [
  {
    from: [VisitPhase.REGISTRATION],
    to: VisitPhase.WAITING_TRIAGE,
    allowedRoles: ['registration_clerk', 'nurse', 'doctor'],
  },
  {
    from: [VisitPhase.WAITING_TRIAGE],
    to: VisitPhase.TRIAGE,
    allowedRoles: ['nurse', 'doctor'],
  },
  {
    from: [VisitPhase.TRIAGE],
    to: VisitPhase.WAITING_PROVIDER,
    allowedRoles: ['nurse', 'doctor'],
    requiresNote: true,
  },
  {
    from: [VisitPhase.WAITING_PROVIDER, VisitPhase.TRIAGE],
    to: VisitPhase.CONSULTATION,
    allowedRoles: ['doctor', 'nurse_practitioner', 'physician_assistant'],
  },
  // Add more transitions as needed
];

/**
 * Acuity score descriptions
 */
export const ACUITY_SCORE_DESCRIPTIONS: Record<number, { label: string; color: string; maxWaitMinutes: number }> = {
  1: { label: 'Resuscitation', color: '#dc2626', maxWaitMinutes: 0 },
  2: { label: 'Emergent', color: '#ea580c', maxWaitMinutes: 15 },
  3: { label: 'Urgent', color: '#ca8a04', maxWaitMinutes: 60 },
  4: { label: 'Semi-urgent', color: '#16a34a', maxWaitMinutes: 120 },
  5: { label: 'Non-urgent', color: '#2563eb', maxWaitMinutes: 240 },
};