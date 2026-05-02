/**
 * clinicalNoteTypes.ts
 * ============================================================================
 * CLINICAL NOTES TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for clinical note operations.
 * Exactly matches the response structure from ClinicalNoteController.
 * 
 * @module clinicalNoteTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Note type enum - matches database note_type column
 */
export enum ClinicalNoteType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  PROGRESS = 'progress',
  DISCHARGE = 'discharge',
  CONSULTATION = 'consultation',
}

/**
 * Note status enum - matches database note_status column
 */
export enum ClinicalNoteStatus {
  DRAFT = 'draft',
  FINAL = 'final',
  AMENDED = 'amended',
  CANCELLED = 'cancelled',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Facility reference structure
 */
export interface NoteFacility {
  id: number;
  name: string;
  code: string;
}

/**
 * Visit reference structure
 */
export interface NoteVisit {
  id: number;
  visit_date_time: string | null;
}

/**
 * Patient reference structure
 */
export interface NotePatient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

/**
 * Staff reference structure
 */
export interface NoteStaff {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

/**
 * Parent note reference (for amendments)
 */
export interface ParentNoteReference {
  id: number;
  noted_at: string;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST INTERFACES                                */
/* -------------------------------------------------------------------------- */

/**
 * Create clinical note request DTO
 * Matches StoreClinicalNoteRequest validation rules
 */
export interface CreateClinicalNoteRequest {
  facility_id: number;
  visit_id: number;
  patient_id: number;
  staff_id?: number;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  review_of_systems?: string | null;
  past_medical_history?: string | null;
  note_type?: ClinicalNoteType;
  note_status?: ClinicalNoteStatus;
  noted_at?: string;
  signature?: string | null;
  custom_fields?: Record<string, unknown> | null;
  structured_data?: Record<string, unknown> | null;
  parent_note_id?: number | null;
}

/**
 * Update clinical note request DTO
 * Matches UpdateClinicalNoteRequest validation rules
 */
export interface UpdateClinicalNoteRequest {
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  review_of_systems?: string | null;
  past_medical_history?: string | null;
  note_type?: ClinicalNoteType;
  note_status?: ClinicalNoteStatus;
  noted_at?: string;
  signature?: string | null;
  custom_fields?: Record<string, unknown> | null;
  structured_data?: Record<string, unknown> | null;
}

/**
 * Clinical note filters for list endpoints
 */
export interface ClinicalNoteFilters {
  facility_id?: number;
  patient_id?: number;
  visit_id?: number;
  staff_id?: number;
  note_type?: ClinicalNoteType;
  note_status?: ClinicalNoteStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Amend note request DTO
 */
export interface AmendNoteRequest {
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  review_of_systems?: string | null;
  past_medical_history?: string | null;
  custom_fields?: Record<string, unknown> | null;
  structured_data?: Record<string, unknown> | null;
}

/**
 * Cancel note request DTO
 */
export interface CancelNoteRequest {
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/*                          RESPONSE INTERFACES                               */
/* -------------------------------------------------------------------------- */

/**
 * Clinical note response structure
 * Exactly matches ClinicalNoteResource toArray()
 */
export interface ClinicalNoteResponse {
  id: number;
  uuid: string | null;
  facility_id: number;
  visit_id: number;
  patient_id: number;
  patient_number?: number;
  patient_name?: string;
  //Staff information
  staff_name?: string;
  staff_id: number;
  
  // Clinical Content
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  review_of_systems: string | null;
  past_medical_history: string | null;
  
  // Metadata
  note_type: ClinicalNoteType;
  note_status: ClinicalNoteStatus;
  noted_at: string | null;
  signature: string | null;
  
  // JSON Fields
  custom_fields: Record<string, unknown> | null;
  structured_data: Record<string, unknown> | null;
  
  // Revision Tracking
  parent_note_id: number | null;
  is_amendment: boolean;
  is_draft: boolean;
  is_final: boolean;
  is_cancelled: boolean;
  
  // Full Text
  full_note_text: string;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  
  // Relationships (when loaded)
  facility?: NoteFacility;
  visit?: NoteVisit;
  patient?: NotePatient;
  staff?: NoteStaff;
  parent_note?: ParentNoteReference;
  child_notes?: ClinicalNoteResponse[];
}

/**
 * Paginated clinical notes response
 */
export interface PaginatedClinicalNotesResponse {
  data: ClinicalNoteResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * Success response for single note
 */
export interface ClinicalNoteSingleSuccessResponse {
  success: true;
  message: string;
  data: ClinicalNoteResponse;
  errors: null;
}

/**
 * Success response for list/collection
 */
export interface ClinicalNoteListSuccessResponse {
  success: true;
  message: string;
  data: ClinicalNoteResponse[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

/**
 * Success response for paginated list
 */
export interface ClinicalNotePaginatedSuccessResponse {
  success: true;
  message: string;
  data: PaginatedClinicalNotesResponse;
}

/**
 * Success response for delete
 */
export interface ClinicalNoteDeleteSuccessResponse {
  success: true;
  message: string;
  data: null;
  errors: null;
}

/**
 * Statistics response
 */
export interface ClinicalNoteStatisticsResponse {
  success: true;
  message: string;
  data: {
    draft: number;
    final: number;
    amended: number;
    cancelled: number;
    total: number;
  };
  errors: null;
}

/**
 * Error response for validation failures (422)
 */
export interface ClinicalNoteValidationErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]>;
}

/**
 * Error response for not found (404)
 */
export interface ClinicalNoteNotFoundResponse {
  success: false;
  message: string;
  errors: {
    note: string[];
  };
  data: null;
}

/**
 * Error response for system errors (500)
 */
export interface ClinicalNoteSystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

/**
 * Union type for all possible single note responses
 */
export type ClinicalNoteApiResponse =
  | ClinicalNoteSingleSuccessResponse
  | ClinicalNoteNotFoundResponse
  | ClinicalNoteValidationErrorResponse
  | ClinicalNoteSystemErrorResponse;

/**
 * Union type for list responses
 */
export type ClinicalNoteListApiResponse =
  | ClinicalNoteListSuccessResponse
  | ClinicalNotePaginatedSuccessResponse
  | ClinicalNoteSystemErrorResponse;

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Type guard to check if a value is a valid ClinicalNoteType
 */
export function isClinicalNoteType(value: string): value is ClinicalNoteType {
  return Object.values(ClinicalNoteType).includes(value as ClinicalNoteType);
}

/**
 * Type guard to check if a value is a valid ClinicalNoteStatus
 */
export function isClinicalNoteStatus(value: string): value is ClinicalNoteStatus {
  return Object.values(ClinicalNoteStatus).includes(value as ClinicalNoteStatus);
}

/**
 * Type guard to check if response is a success response
 */
export function isClinicalNoteSuccessResponse(
  response: ClinicalNoteApiResponse
): response is ClinicalNoteSingleSuccessResponse {
  return response.success === true;
}

/**
 * Type guard to check if list response is success
 */
export function isClinicalNoteListSuccess(
  response: ClinicalNoteListApiResponse
): response is ClinicalNoteListSuccessResponse {
  return response.success === true && 'data' in response && Array.isArray(response.data);
}

/**
 * Type guard to check if response is paginated
 */
export function isPaginatedResponse(
  response: ClinicalNoteListApiResponse
): response is ClinicalNotePaginatedSuccessResponse {
  return response.success === true && 'data' in response && 'current_page' in (response.data as object);
}

/* -------------------------------------------------------------------------- */
/*                              DISPLAY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Labels for note types
 */
export const CLINICAL_NOTE_TYPE_LABELS: Record<ClinicalNoteType, string> = {
  [ClinicalNoteType.INITIAL]: 'Initial Note',
  [ClinicalNoteType.FOLLOW_UP]: 'Follow-up',
  [ClinicalNoteType.PROGRESS]: 'Progress Note',
  [ClinicalNoteType.DISCHARGE]: 'Discharge Summary',
  [ClinicalNoteType.CONSULTATION]: 'Consultation Note',
};

/**
 * Labels for note statuses
 */
export const CLINICAL_NOTE_STATUS_LABELS: Record<ClinicalNoteStatus, string> = {
  [ClinicalNoteStatus.DRAFT]: 'Draft',
  [ClinicalNoteStatus.FINAL]: 'Final',
  [ClinicalNoteStatus.AMENDED]: 'Amended',
  [ClinicalNoteStatus.CANCELLED]: 'Cancelled',
};

/**
 * Color schemes for note statuses (for UI badges)
 */
export const CLINICAL_NOTE_STATUS_COLORS: Record<ClinicalNoteStatus, { bg: string; text: string; dot: string }> = {
  [ClinicalNoteStatus.DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  [ClinicalNoteStatus.FINAL]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  [ClinicalNoteStatus.AMENDED]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  [ClinicalNoteStatus.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

/**
 * Color schemes for note types
 */
export const CLINICAL_NOTE_TYPE_COLORS: Record<ClinicalNoteType, { bg: string; text: string }> = {
  [ClinicalNoteType.INITIAL]: { bg: 'bg-blue-100', text: 'text-blue-800' },
  [ClinicalNoteType.FOLLOW_UP]: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  [ClinicalNoteType.PROGRESS]: { bg: 'bg-purple-100', text: 'text-purple-800' },
  [ClinicalNoteType.DISCHARGE]: { bg: 'bg-teal-100', text: 'text-teal-800' },
  [ClinicalNoteType.CONSULTATION]: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

/**
 * Get display name for note type
 */
export function getClinicalNoteTypeDisplayName(type: ClinicalNoteType): string {
  return CLINICAL_NOTE_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get display name for note status
 */
export function getClinicalNoteStatusDisplayName(status: ClinicalNoteStatus): string {
  return CLINICAL_NOTE_STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get color scheme for note status
 */
export function getClinicalNoteStatusColor(status: ClinicalNoteStatus) {
  return CLINICAL_NOTE_STATUS_COLORS[status];
}

/**
 * Get color scheme for note type
 */
export function getClinicalNoteTypeColor(type: ClinicalNoteType) {
  return CLINICAL_NOTE_TYPE_COLORS[type];
}

/**
 * Format SOAP note for display
 */
export function formatSoapNote(note: ClinicalNoteResponse): string {
  const sections = [];
  
  if (note.subjective) {
    sections.push(`**SUBJECTIVE**\n${note.subjective}`);
  }
  if (note.objective) {
    sections.push(`**OBJECTIVE**\n${note.objective}`);
  }
  if (note.assessment) {
    sections.push(`**ASSESSMENT**\n${note.assessment}`);
  }
  if (note.plan) {
    sections.push(`**PLAN**\n${note.plan}`);
  }
  
  return sections.join('\n\n');
}

/**
 * Get note summary (first 200 characters of assessment or plan)
 */
export function getNoteSummary(note: ClinicalNoteResponse, maxLength: number = 200): string {
  const content = note.assessment || note.plan || note.subjective || '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_NOTE_TYPE = ClinicalNoteType.PROGRESS;
export const DEFAULT_NOTE_STATUS = ClinicalNoteStatus.DRAFT;

export const NOTE_TYPE_OPTIONS = Object.values(ClinicalNoteType).map(type => ({
  value: type,
  label: getClinicalNoteTypeDisplayName(type),
}));

export const NOTE_STATUS_OPTIONS = Object.values(ClinicalNoteStatus).map(status => ({
  value: status,
  label: getClinicalNoteStatusDisplayName(status),
}));

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type ClinicalNoteId = number;
export type ClinicalNoteUuid = string;

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL TYPES                                */
/* -------------------------------------------------------------------------- */

export default {
  // Enums
  ClinicalNoteType,
  ClinicalNoteStatus,
  
  // Type Guards
  isClinicalNoteType,
  isClinicalNoteStatus,
  isClinicalNoteSuccessResponse,
  isClinicalNoteListSuccess,
  isPaginatedResponse,
  
  // Display Functions
  getClinicalNoteTypeDisplayName,
  getClinicalNoteStatusDisplayName,
  getClinicalNoteStatusColor,
  getClinicalNoteTypeColor,
  formatSoapNote,
  getNoteSummary,
  
  // Constants
  DEFAULT_NOTE_TYPE,
  DEFAULT_NOTE_STATUS,
  NOTE_TYPE_OPTIONS,
  NOTE_STATUS_OPTIONS,
  CLINICAL_NOTE_TYPE_LABELS,
  CLINICAL_NOTE_STATUS_LABELS,
  CLINICAL_NOTE_STATUS_COLORS,
  CLINICAL_NOTE_TYPE_COLORS,
};