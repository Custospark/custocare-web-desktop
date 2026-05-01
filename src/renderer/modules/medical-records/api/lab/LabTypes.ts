/**
 * LabTypes.ts
 * ============================================================================
 * LAB MODULE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for lab operations
 * in the healthcare facility management system.
 * 
 * @module labTypes
 * @description Comprehensive type definitions for lab templates, tests, 
 * requests, items, and results.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Template structure types
 */
export enum LabTemplateStructureType {
  STANDARD = 'standard',   // field-based (most lab tests)
  SIMPLE = 'simple',       // single value tests
  PANEL = 'panel',         // grouped tests
}

/**
 * Lab request priority levels
 */
export enum LabRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
}

/**
 * Lab request status
 */
export enum LabRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  CANCELLED = 'cancelled',
}

/**
 * Lab request item status
 */
export enum LabRequestItemStatus {
  PENDING = 'pending',
  SAMPLE_COLLECTED = 'sample_collected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled',
}

/**
 * Result flags for lab results
 */
export enum LabResultFlag {
  NORMAL = 'normal',
  LOW = 'low',
  HIGH = 'high',
  CRITICAL = 'critical',
  ABNORMAL = 'abnormal',
  PENDING = 'pending',
}

/**
 * Template field data types
 */
export enum TemplateFieldDataType {
  NUMBER = 'number',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Diagnosis context (ICD codes or suspected conditions)
 */
export interface DiagnosisContext {
  icd_codes?: string[];
  suspected_conditions?: string[];
  notes?: string;
}

/**
 * Template field reference range
 */
export interface ReferenceRange {
  min?: number | null;
  max?: number | null;
  unit?: string | null;
}

/**
 * Patient basic information
 */
export interface LabPatientInfo {
  id: number;
  patient_uuid: string;
  full_name: string | null;
  medical_record_number?: string | null;
}

/**
 * Facility basic information
 */
export interface LabFacilityInfo {
  id: number;
  facility_uuid: string;
  facility_name: string;
}

/**
 * Staff basic information
 */
export interface LabStaffInfo {
  id: number;
  staff_uuid: string;
  name: string | null;
  professional_title?: string | null;
}

/**
 * Visit basic information
 */
export interface LabVisitInfo {
  id: number;
  visit_uuid: string;
  visit_type?: string;
  visit_phase?: string;
}

/* -------------------------------------------------------------------------- */
/*                            CORE LAB TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Lab Template Entity
 */
export interface LabTemplate {
  id: number;
  template_uuid: string;
  name: string;
  description: string | null;
  facility_id: number | null;
  is_shared: boolean;
  structure_type: LabTemplateStructureType;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships
  facility?: LabFacilityInfo | null;
  tests?: LabTest[];
  fields?: LabTemplateField[];
  
  // Statistics
  tests_count?: number;
  fields_count?: number;
  
  // Helper attributes
  is_standard: boolean;
  is_simple: boolean;
  is_panel: boolean;
  structure_type_label: string;
  status: 'active' | 'inactive';
  
  // URLs
  urls?: {
    self: string;
    tests: string;
    fields: string;
  };
}

export type ActiveTemplatesResponse = {
  templates: LabTemplate[];
};

/**
 * Lab Test Entity (FULL version with all relationships)
 */
export interface LabTest {
  id: number;
  test_uuid: string;
  name: string;
  code: string | null;
  template_id?: number | null | undefined;
  facility_id: number | null;
  is_shared: boolean;
  category: string | null;
  description: string | null;
  is_active: boolean;
  requires_fasting: boolean;
  turnaround_time_hours: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships - FULL (when loaded)
  template?: {
    id: number;
    template_uuid: string;
    name: string;
    description: string | null;
    structure_type: LabTemplateStructureType;
    is_active: boolean;
    fields?: LabTemplateField[];
  };
  facility?: LabFacilityInfo | null;
  
  // Statistics
  request_count?: number;
  
  // Helper attributes
  status: 'active' | 'inactive';
  formatted_turnaround_time: string | null;
  fasting_required: boolean;
  fasting_instruction: string;
  
  // URLs
  urls?: {
    self: string;
    template: string;
  };
}

/**
 * Lab Template Field Entity
 */
export interface LabTemplateField {
  id: number;
  field_uuid: string;
  template_id: number;
  name: string;
  code: string | null;
  data_type: TemplateFieldDataType;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
  is_critical: boolean;
  clinical_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships
  template?: LabTemplate;
  
  // Helper attributes
  data_type_label: string;
  status: 'active' | 'inactive';
  is_number_type: boolean;
  is_text_type: boolean;
  is_boolean_type: boolean;
  is_select_type: boolean;
  formatted_reference_range: string | null;
  has_reference_range: boolean;
  
  // URLs
  urls?: {
    self: string;
    template: string;
  };
}

/**
 * Lab Result Entity
 */
export interface LabResult {
  id: number;
  result_uuid: string;
  lab_request_item_id: number;
  template_field_id?: number | null;
  value: string | null;
  unit: string | null;
  numeric_value: number | null;
  flag: LabResultFlag;
  reference_min: number | null;
  reference_max: number | null;
  interpretation: string | null;
  comments: string | null;
  recorded_by_staff_id: number | null;
  verified_by_staff_id: number | null;
  verified_at: string | null;
  recorded_at: string;
  updated_at_value: string | null;
  is_abnormal_flagged: boolean;
  is_critical_alert_sent: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships
  lab_request_item?: LabRequestItem;
  template_field?: LabTemplateField;
  recorded_by?: LabStaffInfo | null;
  verified_by?: LabStaffInfo | null;
  
  // Helper attributes
  formatted_value: string;
  reference_range: string | null;
  flag_label: string;
  flag_badge_color: string;
  flag_icon: string;
  is_pending: boolean;
  is_normal: boolean;
  is_low: boolean;
  is_high: boolean;
  is_critical: boolean;
  is_abnormal: boolean;
  is_verified: boolean;
  needs_verification: boolean;
  age_in_hours: number | null;
  verification_delay_hours: number | null;
  is_within_reference_range: boolean | null;
  
  // URLs
  urls?: {
    self: string;
    item: string;
    field: string;
  };
}

/**
 * Lab Request Item Entity (FULL version with nested lab_test)
 * Used when items are loaded with their lab_test relationship
 */
export interface LabRequestItem {
  id: number;
  item_uuid: string;
  lab_request_id: number;
  lab_test_id: number;
  status: LabRequestItemStatus;
  sample_type: string | null;
  sample_identifier: string | null;
  collected_at: string | null;
  collected_by_staff_id: number | null;
  started_at: string | null;
  completed_at: string | null;
  verified_by_staff_id: number | null;
  verified_at: string | null;
  result_flag: LabResultFlag;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  lab_test?: LabTest;  // This is the key relationship for accessing test details
  collected_by?: LabStaffInfo | null;
  verified_by?: LabStaffInfo | null;
  results?: LabResult[];
  primary_result?: LabResult | null;
  
  // Statistics
  results_count?: number;
  turnaround_time_minutes: number | null;
  collection_to_completion_minutes: number | null;
  
  // Helper attributes
  status_label: string;
  result_flag_label: string;
  status_badge_color: string;
  result_flag_badge_color: string;
  is_pending: boolean;
  is_sample_collected: boolean;
  is_in_progress: boolean;
  is_completed: boolean;
  is_verified: boolean;
  is_cancelled: boolean;
  is_result_normal: boolean;
  is_result_abnormal: boolean;
  is_result_critical: boolean;
  all_results_verified: boolean;
  
  // URLs
  urls?: {
    self: string;
    request: string;
    test: string;
    results: string;
  };
}

/**
 * Lab Request Entity (FULL version with nested items)
 * Used for the response from /with-items endpoint
 */
export interface LabRequest {
  id: number;
  request_uuid: string;
  visit_id: number;
  patient_id: number;
  facility_id: number;
  requested_by_staff_id: number | null;
  priority: LabRequestPriority;
  status: LabRequestStatus;
  clinical_notes: string | null;
  diagnosis_context: DiagnosisContext | null;
  requested_at: string;
  collected_at: string | null;
  completed_at: string | null;
  reviewed_at: string | null;
  reviewed_by_staff_id: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships - FULL (when loaded from with-items endpoint)
  visit?: LabVisitInfo;
  patient?: LabPatientInfo;
  facility?: LabFacilityInfo;
  requested_by?: LabStaffInfo | null;
  reviewed_by?: LabStaffInfo | null;
  items?: LabRequestItem[];  // This contains the nested items with their lab_test data
  
  // Statistics
  items_count?: number;
  progress_percentage: number;
  completed_items_count: number;
  verified_items_count: number;
  
  // Helper attributes
  priority_label: string;
  status_label: string;
  priority_badge_color: string;
  status_badge_color: string;
  is_pending: boolean;
  is_in_progress: boolean;
  is_completed: boolean;
  is_reviewed: boolean;
  is_cancelled: boolean;
  is_stat: boolean;
  is_urgent: boolean;
  is_routine: boolean;
  all_items_completed: boolean;
  
  // URLs
  urls?: {
    self: string;
    items: string;
    patient: string;
    visit: string;
  };
}

// Helper type for accessing lab test from an item
export type LabRequestItemWithTest = LabRequestItem & {
  lab_test: LabTest;  // Ensure lab_test is present
  results?: LabResult[];
};

// Helper type for accessing items from a request
export type LabRequestWithItems = LabRequest & {
  items: LabRequestItemWithTest[];  // Ensure items are present with tests
};

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Create Lab Template Request
 */
export interface CreateLabTemplateRequest {
  name: string;
  description?: string | null;
  facility_id?: number | null;
  is_shared?: boolean;
  structure_type: LabTemplateStructureType;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Template Request
 */
export interface UpdateLabTemplateRequest {
  name?: string;
  description?: string | null;
  facility_id?: number | null;
  is_shared?: boolean;
  structure_type?: LabTemplateStructureType;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Test Request
 */
export interface CreateLabTestRequest {
  name: string;
  code?: string | null;
  template_id: number;
  facility_id?: number | null;
  is_shared?: boolean;
  category?: string | null;
  description?: string | null;
  is_active?: boolean;
  requires_fasting?: boolean;
  turnaround_time_hours?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Test Request
 */
export interface UpdateLabTestRequest {
  name?: string;
  code?: string | null;
  template_id?: number;
  facility_id?: number | null;
  is_shared?: boolean;
  category?: string | null;
  description?: string | null;
  is_active?: boolean;
  requires_fasting?: boolean;
  turnaround_time_hours?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Template Field Request
 */
export interface CreateLabTemplateFieldRequest {
  name: string;
  code?: string | null;
  template_id: number;
  data_type: TemplateFieldDataType;
  unit?: string | null;
  reference_min?: number | null;
  reference_max?: number | null;
  display_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  is_critical?: boolean;
  clinical_notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Template Field Request
 */
export interface UpdateLabTemplateFieldRequest {
  name?: string;
  code?: string | null;
  data_type?: TemplateFieldDataType;
  unit?: string | null;
  reference_min?: number | null;
  reference_max?: number | null;
  display_order?: number;
  is_required?: boolean;
  is_active?: boolean;
  is_critical?: boolean;
  clinical_notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Request Request
 */
export interface CreateLabRequestRequest {
  visit_id: number;
  patient_id: number;
  facility_id: number;
  requested_by_staff_id?: number | null;
  priority: LabRequestPriority;
  status?: LabRequestStatus;
  clinical_notes?: string | null;
  diagnosis_context?: DiagnosisContext | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Request Request
 */
export interface UpdateLabRequestRequest {
  visit_id?: number;
  patient_id?: number;
  facility_id?: number;
  requested_by_staff_id?: number | null;
  priority?: LabRequestPriority;
  status?: LabRequestStatus;
  clinical_notes?: string | null;
  diagnosis_context?: DiagnosisContext | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Request Item Request
 */
export interface CreateLabRequestItemRequest {
  lab_request_id: number;
  lab_test_id: number;
  status?: LabRequestItemStatus;
  sample_type?: string | null;
  sample_identifier?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Request Item Request
 */
export interface UpdateLabRequestItemRequest {
  lab_request_id?: number;
  lab_test_id?: number;
  status?: LabRequestItemStatus;
  sample_type?: string | null;
  sample_identifier?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Result Request
 */
export interface CreateLabResultRequest {
  lab_request_item_id: number;
  template_field_id?: number | null;
  value?: string | null;
  unit?: string | null;
  numeric_value?: number | null;
  flag?: LabResultFlag;
  reference_min?: number | null;
  reference_max?: number | null;
  interpretation?: string | null;
  comments?: string | null;
  recorded_by_staff_id?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Update Lab Result Request
 */
export interface UpdateLabResultRequest {
  value?: string | null;
  unit?: string | null;
  numeric_value?: number | null;
  flag?: LabResultFlag;
  reference_min?: number | null;
  reference_max?: number | null;
  interpretation?: string | null;
  comments?: string | null;
  recorded_by_staff_id?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Create Lab Request With Items Request
 */
export interface CreateLabRequestWithItemsRequest {
  // Request data
  visit_id: number;
  patient_id: number;
  facility_id: number;
  requested_by_staff_id?: number | null;
  priority: LabRequestPriority;
  clinical_notes?: string | null;
  diagnosis_context?: DiagnosisContext | null;
  metadata?: Record<string, unknown> | null;
  
  // Items data
  items: Array<{
    lab_test_id: number;
    sample_type?: string | null;
    notes?: string | null;
  }>;
}

/**
 * Add Items To Lab Request Request
 */
export interface AddItemsToLabRequestRequest {
  items: Array<{
    lab_test_id: number;
    sample_type?: string | null;
    notes?: string | null;
  }>;
}

/**
 * Bulk Create Lab Results Request
 */
export interface BulkCreateLabResultsRequest {
  results: Array<{
    template_field_id?: number | null;
    value?: string | null;
    unit?: string | null;
    numeric_value?: number | null;
    flag?: LabResultFlag;
    reference_min?: number | null;
    reference_max?: number | null;
    interpretation?: string | null;
    comments?: string | null;
    recorded_by_staff_id?: number | null;
    metadata?: Record<string, unknown> | null;
  }>;
}

/**
 * Bulk Update Display Orders Request
 */
export interface BulkUpdateDisplayOrdersRequest {
  orders: Array<{
    field_uuid: string;
    display_order: number;
  }>;
}

/**
 * Duplicate Fields Request
 */
export interface DuplicateFieldsRequest {
  source_template_uuid: string;
  target_template_uuid: string;
}

/* -------------------------------------------------------------------------- */
/*                            FILTERS & PARAMS                                */
/* -------------------------------------------------------------------------- */

/**
 * Lab Template Filters
 */
export interface LabTemplateFilters {
  facility_id?: number;
  structure_type?: LabTemplateStructureType;
  is_active?: boolean;
  is_shared?: boolean;
  search?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Lab Test Filters
 */
export interface LabTestFilters {
  facility_id?: number;
  template_id?: number;
  category?: string;
  is_active?: boolean;
  requires_fasting?: boolean;
  search?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Lab Template Field Filters
 */
export interface LabTemplateFieldFilters {
  template_id?: number;
  data_type?: TemplateFieldDataType;
  is_active?: boolean;
  is_required?: boolean;
  is_critical?: boolean;
  search?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Lab Request Filters
 */
export interface LabRequestFilters {
  facility_id?: number;
  patient_id?: number;
  visit_id?: number;
  status?: LabRequestStatus;
  priority?: LabRequestPriority;
  requested_by_staff_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Lab Request Item Filters
 */
export interface LabRequestItemFilters {
  lab_request_id?: number;
  lab_test_id?: number;
  status?: LabRequestItemStatus;
  result_flag?: LabResultFlag;
  has_abnormal_results?: boolean;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Lab Result Filters
 */
export interface LabResultFilters {
  lab_request_item_id?: number;
  template_field_id?: number | null;
  flag?: LabResultFlag;
  is_abnormal_flagged?: boolean;
  is_verified?: boolean;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

/**
 * With Items API Response
 * Matches the structure from your backend controller
 */
export interface WithItemsApiResponse {
  success: boolean;
  message: string;
  data: {
    request: LabRequest;  // This will have items with nested lab_test
  };
  error?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Lab Template Statistics
 */
export interface LabTemplateStatistics {
  total_templates: number;
  active_templates: number;
  shared_templates: number;
  templates_by_type: Record<LabTemplateStructureType, number>;
}

/**
 * Lab Test Statistics
 */
export interface LabTestStatistics {
  total_requests: number;
  completed_requests: number;
  completion_rate: number;
  abnormal_results_count: number;
  abnormal_rate: number;
}

/**
 * Lab Request Statistics
 */
export interface LabRequestStatistics {
  total_requests: number;
  by_status: Record<LabRequestStatus, number>;
  by_priority: Record<LabRequestPriority, number>;
  completion_rate: number;
  cancellation_rate: number;
}

/**
 * Lab Result Statistics
 */
export interface LabResultStatistics {
  total_results: number;
  normal_count: number;
  abnormal_count: number;
  critical_count: number;
  verified_count: number;
  normal_rate: number;
  abnormal_rate: number;
  critical_rate: number;
  verification_rate: number;
}

/**
 * Turnaround Time Statistics
 */
export interface TurnaroundTimeStatistics {
  average_minutes: number;
  min_minutes: number;
  max_minutes: number;
  total_samples: number;
}

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Get priority badge color
 */
export const getPriorityBadgeColor = (priority: LabRequestPriority): string => {
  const colorMap: Record<LabRequestPriority, string> = {
    [LabRequestPriority.ROUTINE]: 'bg-blue-100 text-blue-800',
    [LabRequestPriority.URGENT]: 'bg-yellow-100 text-yellow-800',
    [LabRequestPriority.STAT]: 'bg-red-100 text-red-800',
  };
  return colorMap[priority];
};

/**
 * Get status badge color for lab request
 */
export const getRequestStatusBadgeColor = (status: LabRequestStatus): string => {
  const colorMap: Record<LabRequestStatus, string> = {
    [LabRequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [LabRequestStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [LabRequestStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [LabRequestStatus.REVIEWED]: 'bg-purple-100 text-purple-800',
    [LabRequestStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status];
};

/**
 * Get status badge color for lab request item
 */
export const getItemStatusBadgeColor = (status: LabRequestItemStatus): string => {
  const colorMap: Record<LabRequestItemStatus, string> = {
    [LabRequestItemStatus.PENDING]: 'bg-gray-100 text-gray-800',
    [LabRequestItemStatus.SAMPLE_COLLECTED]: 'bg-blue-100 text-blue-800',
    [LabRequestItemStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [LabRequestItemStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [LabRequestItemStatus.VERIFIED]: 'bg-purple-100 text-purple-800',
    [LabRequestItemStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };
  return colorMap[status];
};

/**
 * Get result flag badge color
 */
export const getResultFlagBadgeColor = (flag: LabResultFlag): string => {
  const colorMap: Record<LabResultFlag, string> = {
    [LabResultFlag.NORMAL]: 'bg-green-100 text-green-800',
    [LabResultFlag.LOW]: 'bg-blue-100 text-blue-800',
    [LabResultFlag.HIGH]: 'bg-orange-100 text-orange-800',
    [LabResultFlag.ABNORMAL]: 'bg-orange-100 text-orange-800',
    [LabResultFlag.CRITICAL]: 'bg-red-100 text-red-800',
    [LabResultFlag.PENDING]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[flag];
};

/**
 * Get result flag icon
 */
export const getResultFlagIcon = (flag: LabResultFlag): string => {
  const iconMap: Record<LabResultFlag, string> = {
    [LabResultFlag.NORMAL]: 'check-circle',
    [LabResultFlag.LOW]: 'arrow-down-circle',
    [LabResultFlag.HIGH]: 'arrow-up-circle',
    [LabResultFlag.ABNORMAL]: 'alert-circle',
    [LabResultFlag.CRITICAL]: 'alert-triangle',
    [LabResultFlag.PENDING]: 'clock',
  };
  return iconMap[flag];
};

/**
 * Format turnaround time for display
 */
export const formatTurnaroundTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Format date for display
 */
export const formatLabDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

/**
 * Check if value is within reference range
 */
export const isWithinReferenceRange = (
  value: number | null,
  referenceMin: number | null,
  referenceMax: number | null
): boolean | null => {
  if (value === null) return null;
  
  const minCheck = referenceMin === null || value >= referenceMin;
  const maxCheck = referenceMax === null || value <= referenceMax;
  
  return minCheck && maxCheck;
};