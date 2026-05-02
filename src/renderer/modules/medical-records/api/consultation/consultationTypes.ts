/**
 * consultationTypes.ts
 * ============================================================================
 * CONSULTATION TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for consultation operations.
 * Exactly matches the response structure from ConsultationController.
 * 
 * @module consultationTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Consultation type enum - matches database consultation_type column
 */
export enum ConsultationType {
  IN_PERSON = 'in_person',
  TELEMEDICINE = 'telemedicine',
  URGENT = 'urgent',
  ELECTIVE = 'elective',
  EMERGENCY = 'emergency',
}

/**
 * Priority enum - matches database priority column
 */
export enum ConsultationPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENT = 'emergent',
}

/**
 * Request status enum - matches database request_status column
 */
export enum ConsultationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

export interface ConsultationFacility {
  id: number;
  name: string;
  code: string;
}

export interface ConsultationVisit {
  id: number;
  visit_date_time: string | null;
}

export interface ConsultationPatient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface ConsultationStaff {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface RecommendedOrders {
  labs?: string[];
  imaging?: string[];
  medications?: string[];
  procedures?: string[];
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST INTERFACES                                */
/* -------------------------------------------------------------------------- */

export interface CreateConsultationRequest {
  facility_id: number;
  visit_id: number;
  patient_id: number;
  requesting_staff_id?: number;
  specialty_required: string;
  consultation_type?: ConsultationType;
  priority?: ConsultationPriority;
  clinical_question: string;
  background_information?: string | null;
  attached_documents?: string[] | null;
  scheduled_for?: string | null;
  duration_minutes?: number;
  location?: string | null;
  requires_followup?: boolean;
  followup_by?: string | null;
  followup_instructions?: string | null;
  custom_fields?: Record<string, unknown> | null;
}

export interface UpdateConsultationRequest {
  specialty_required?: string;
  consultation_type?: ConsultationType;
  priority?: ConsultationPriority;
  clinical_question?: string;
  background_information?: string | null;
  attached_documents?: string[] | null;
  scheduled_for?: string | null;
  duration_minutes?: number;
  location?: string | null;
  requires_followup?: boolean;
  followup_by?: string | null;
  followup_instructions?: string | null;
  custom_fields?: Record<string, unknown> | null;
}

export interface ConsultationFilters {
  facility_id?: number;
  patient_id?: number;
  visit_id?: number;
  request_status?: ConsultationStatus;
  priority?: ConsultationPriority;
  consultation_type?: ConsultationType;
  specialty_required?: string;
  consultant_staff_id?: number;
  requesting_staff_id?: number;
  date_from?: string;
  date_to?: string;
  scheduled_from?: string;
  scheduled_to?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

export interface AcceptConsultationRequest {
  consultant_staff_id: number;
}

export interface DeclineConsultationRequest {
  reason?: string;
}

export interface CompleteConsultationRequest {
  findings?: string;
  recommendations?: string;
  recommended_orders?: RecommendedOrders;
}

export interface CancelConsultationRequest {
  reason?: string;
}

export interface ScheduleConsultationRequest {
  scheduled_for: string;
  location?: string;
  duration_minutes?: number;
}

/* -------------------------------------------------------------------------- */
/*                          RESPONSE INTERFACES                               */
/* -------------------------------------------------------------------------- */

export interface ConsultationResponse {
  id: number;
  facility_id: number;
  visit_id: number;
  patient_id: number;
  requesting_staff_id: number;
  consultant_staff_id: number | null;
  
  // Consultation Details
  specialty_required: string;
  consultation_type: ConsultationType;
  consultation_type_text: string;
  priority: ConsultationPriority;
  priority_text: string;
  priority_color: string;
  clinical_question: string;
  background_information: string | null;
  attached_documents: string[] | null;
  
  // Consultation Response
  findings: string | null;
  recommendations: string | null;
  recommended_orders: RecommendedOrders | null;
  consultant_notes: string | null;
  
  // Workflow Status
  request_status: ConsultationStatus;
  status_text: string;
  status_color: string;
  requested_at: string | null;
  responded_at: string | null;
  completed_at: string | null;
  decline_reason: string | null;
  cancellation_reason: string | null;
  
  // Scheduling
  scheduled_for: string | null;
  duration_minutes: number;
  location: string | null;
  
  // Follow-up
  requires_followup: boolean;
  followup_by: string | null;
  followup_instructions: string | null;
  
  // Custom Fields
  custom_fields: Record<string, unknown> | null;
  satisfaction_metrics: Record<string, unknown> | null;
  
  // Calculated Fields
  is_pending: boolean;
  is_accepted: boolean;
  is_declined: boolean;
  is_completed: boolean;
  is_cancelled: boolean;
  is_urgent: boolean;
  is_overdue: boolean;
  requires_followup_flag: boolean;
  response_time_hours: number | null;
  completion_time_hours: number | null;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  
  // Relationships
  facility?: ConsultationFacility;
  visit?: ConsultationVisit;
  patient?: ConsultationPatient;
  requesting_staff?: ConsultationStaff;
  consultant_staff?: ConsultationStaff;
}

export interface PaginatedConsultationsResponse {
  data: ConsultationResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ConsultationSingleSuccessResponse {
  success: true;
  message: string;
  data: ConsultationResponse;
  errors: null;
}

export interface ConsultationListSuccessResponse {
  success: true;
  message: string;
  data: ConsultationResponse[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface ConsultationStatisticsResponse {
  success: true;
  message: string;
  data: {
    total_requests: number;
    pending_count: number;
    accepted_count: number;
    declined_count: number;
    completed_count: number;
    cancelled_count: number;
    urgent_count: number;
    routine_count: number;
    average_response_time: number | null;
    completion_rate: number;
  };
  errors: null;
}

export interface ConsultationCountByStatusResponse {
  success: true;
  message: string;
  data: {
    pending: number;
    accepted: number;
    declined: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  errors: null;
}

export interface ConsultationDeleteSuccessResponse {
  success: true;
  message: string;
  data: null;
  errors: null;
}

export interface ConsultationValidationErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]>;
}

export interface ConsultationNotFoundResponse {
  success: false;
  message: string;
  errors: {
    consultation: string[];
  };
  data: null;
}

export interface ConsultationSystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

export function isConsultationType(value: string): value is ConsultationType {
  return Object.values(ConsultationType).includes(value as ConsultationType);
}

export function isConsultationPriority(value: string): value is ConsultationPriority {
  return Object.values(ConsultationPriority).includes(value as ConsultationPriority);
}

export function isConsultationStatus(value: string): value is ConsultationStatus {
  return Object.values(ConsultationStatus).includes(value as ConsultationStatus);
}

export function isConsultationSuccessResponse(
  response: ConsultationSingleSuccessResponse | ConsultationValidationErrorResponse | ConsultationNotFoundResponse | ConsultationSystemErrorResponse
): response is ConsultationSingleSuccessResponse {
  return response.success === true;
}

/* -------------------------------------------------------------------------- */
/*                              DISPLAY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  [ConsultationType.IN_PERSON]: 'In Person',
  [ConsultationType.TELEMEDICINE]: 'Telemedicine',
  [ConsultationType.URGENT]: 'Urgent Consultation',
  [ConsultationType.ELECTIVE]: 'Elective Consultation',
  [ConsultationType.EMERGENCY]: 'Emergency Consultation',
};

export const CONSULTATION_PRIORITY_LABELS: Record<ConsultationPriority, string> = {
  [ConsultationPriority.ROUTINE]: 'Routine',
  [ConsultationPriority.URGENT]: 'Urgent',
  [ConsultationPriority.EMERGENT]: 'Emergent',
};

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  [ConsultationStatus.PENDING]: 'Pending',
  [ConsultationStatus.ACCEPTED]: 'Accepted',
  [ConsultationStatus.DECLINED]: 'Declined',
  [ConsultationStatus.COMPLETED]: 'Completed',
  [ConsultationStatus.CANCELLED]: 'Cancelled',
};

export const CONSULTATION_PRIORITY_COLORS: Record<ConsultationPriority, { bg: string; text: string; dot: string }> = {
  [ConsultationPriority.ROUTINE]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  [ConsultationPriority.URGENT]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  [ConsultationPriority.EMERGENT]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export const CONSULTATION_STATUS_COLORS: Record<ConsultationStatus, { bg: string; text: string; dot: string }> = {
  [ConsultationStatus.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  [ConsultationStatus.ACCEPTED]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  [ConsultationStatus.DECLINED]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  [ConsultationStatus.COMPLETED]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  [ConsultationStatus.CANCELLED]: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function getConsultationTypeDisplayName(type: ConsultationType): string {
  return CONSULTATION_TYPE_LABELS[type];
}

export function getConsultationPriorityDisplayName(priority: ConsultationPriority): string {
  return CONSULTATION_PRIORITY_LABELS[priority];
}

export function getConsultationStatusDisplayName(status: ConsultationStatus): string {
  return CONSULTATION_STATUS_LABELS[status];
}

export function getConsultationPriorityColor(priority: ConsultationPriority) {
  return CONSULTATION_PRIORITY_COLORS[priority];
}

export function getConsultationStatusColor(status: ConsultationStatus) {
  return CONSULTATION_STATUS_COLORS[status];
}

export function getConsultationRouteColor(status: ConsultationStatus): string {
  switch (status) {
    case ConsultationStatus.PENDING: return 'warning';
    case ConsultationStatus.ACCEPTED: return 'info';
    case ConsultationStatus.DECLINED: return 'error';
    case ConsultationStatus.COMPLETED: return 'success';
    case ConsultationStatus.CANCELLED: return 'default';
    default: return 'default';
  }
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CONSULTATION_TYPE = ConsultationType.IN_PERSON;
export const DEFAULT_CONSULTATION_PRIORITY = ConsultationPriority.ROUTINE;
export const DEFAULT_DURATION_MINUTES = 30;

export const CONSULTATION_TYPE_OPTIONS = Object.values(ConsultationType).map(type => ({
  value: type,
  label: getConsultationTypeDisplayName(type),
}));

export const CONSULTATION_PRIORITY_OPTIONS = Object.values(ConsultationPriority).map(priority => ({
  value: priority,
  label: getConsultationPriorityDisplayName(priority),
}));

export const CONSULTATION_STATUS_OPTIONS = Object.values(ConsultationStatus).map(status => ({
  value: status,
  label: getConsultationStatusDisplayName(status),
}));

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type ConsultationId = number;

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL TYPES                                */
/* -------------------------------------------------------------------------- */

export default {
  // Enums
  ConsultationType,
  ConsultationPriority,
  ConsultationStatus,
  
  // Type Guards
  isConsultationType,
  isConsultationPriority,
  isConsultationStatus,
  isConsultationSuccessResponse,
  
  // Display Functions
  getConsultationTypeDisplayName,
  getConsultationPriorityDisplayName,
  getConsultationStatusDisplayName,
  getConsultationPriorityColor,
  getConsultationStatusColor,
  getConsultationRouteColor,
  
  // Constants
  DEFAULT_CONSULTATION_TYPE,
  DEFAULT_CONSULTATION_PRIORITY,
  DEFAULT_DURATION_MINUTES,
  CONSULTATION_TYPE_OPTIONS,
  CONSULTATION_PRIORITY_OPTIONS,
  CONSULTATION_STATUS_OPTIONS,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_PRIORITY_LABELS,
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_PRIORITY_COLORS,
  CONSULTATION_STATUS_COLORS,
};