/**
 * PrescriptionTypes.ts
 * ============================================================================
 * PRESCRIPTION TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for prescription-related
 * operations in the healthcare facility management system.
 * 
 * @module prescriptionTypes
 * @description Comprehensive type definitions for prescriptions, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */
import type  { CreatePrescriptionItemRequest,PrescriptionItem ,UpdatePrescriptionItemRequest} from "../prescription-items/PrescriptionItemsTypes";
/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Prescription status enum.
 * Maps to backend enum values for prescription lifecycle tracking.
 */
export enum PrescriptionStatus {
  DRAFT = 'Draft - Not Yet Finalized',
  ACTIVE = 'Active - Ready for Dispensing',
  PARTIALLY_DISPENSED = 'Partially Dispensed',
  FULLY_DISPENSED = 'Fully Dispensed',
  EXPIRED = 'Expired - Past Valid Date',
  CANCELLED = 'Cancelled - No Longer Valid',
  ON_HOLD = 'On Hold - Pending Review',
}

/**
 * Prescription type enum.
 * Classifies the nature of the prescription.
 */
export enum PrescriptionType {
  NEW = 'New Prescription',
  REFILL = 'Refill Prescription',
  RENEWAL = 'Renewal (New Course)',
  EMERGENCY = 'Emergency Prescription',
  STANDING_ORDER = 'Standing Order',
  DISCHARGE = 'Discharge Prescription',
  TRANSFER = 'Transfer Prescription',
}

/**
 * Prescription priority enum.
 * Determines urgency for dispensing.
 */
export enum PrescriptionPriority {
  ROUTINE = 'Routine - Fill Within 24 Hours',
  URGENT = 'Urgent - Fill Within 4 Hours',
  STAT = 'STAT - Fill Immediately',
  SCHEDULED = 'Scheduled - Fill on Specific Date',
}

/**
 * Allergy check status enum.
 * Tracks allergy verification process.
 */
export enum AllergyCheckStatus {
  NO_KNOWN_ALLERGIES = 'No Known Allergies',
  CHECKED_NO_CONFLICTS = 'Allergies Checked - No Conflicts',
  WARNING_OVERRIDDEN = 'Allergy Warning - Overridden',
  ALERT_CHANGED = 'Allergy Alert - Changed Medication',
}

/**
 * Prescriber type enum.
 * Classifies the type of healthcare provider.
 */
export enum PrescriberType {
  MEDICAL_DOCTOR = 'Medical Doctor (MD)',
  DOCTOR_OF_OSTEOPATHY = 'Doctor of Osteopathy (DO)',
  NURSE_PRACTITIONER = 'Nurse Practitioner (NP)',
  PHYSICIAN_ASSISTANT = 'Physician Assistant (PA)',
  CLINICAL_OFFICER = 'Clinical Officer',
  DENTIST = 'Dentist (DDS/DMD)',
  PODIATRIST = 'Podiatrist (DPM)',
  OPTOMETRIST = 'Optometrist (OD)',
  PHARMACIST = 'Pharmacist (PharmD)',
  MIDWIFE = 'Midwife (CNM/CM)',
}

/**
 * Prescription format enum.
 * How the prescription was created/transmitted.
 */
export enum PrescriptionFormat {
  ELECTRONIC = 'Electronic (e-Prescription)',
  PRINTED = 'Printed Paper Prescription',
  HANDWRITTEN = 'Handwritten Prescription',
  FAXED = 'Faxed Prescription',
  VERBAL = 'Verbal Order (Telephone)',
}

/**
 * Dispensing location enum.
 * Where the prescription was filled.
 */
export enum DispensingLocation {
  NOT_DISPENSED = 'Not Dispensed Yet',
  OUR_FACILITY = 'Dispensed at Our Facility',
  EXTERNAL_PHARMACY = 'Dispensed at External Pharmacy',
  PATIENT_TOOK_ELSEWHERE = 'Patient Took Elsewhere',
}

/**
 * Cancellation reason enum.
 * Reasons for prescription cancellation.
 */
export enum CancellationReason {
  PATIENT_REQUEST = 'Patient Requested Cancellation',
  MEDICATION_ERROR_DRUG = 'Medication Error - Wrong Drug',
  MEDICATION_ERROR_DOSE = 'Medication Error - Wrong Dose',
  ALLERGY_DISCOVERED = 'Allergy Discovered',
  ADVERSE_REACTION = 'Adverse Reaction Reported',
  DUPLICATE = 'Duplicate Prescription',
  EXPIRED = 'Prescription Expired',
  BETTER_ALTERNATIVE = 'Better Alternative Available',
  PATIENT_DECEASED = 'Patient Deceased',
  INSURANCE_DENIED = 'Insurance Denied (Patient Canceled)',
  OUT_OF_STOCK = 'Out of Stock (Patient Canceled)',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified patient reference for nested responses.
 */
export interface PatientReference {
  id: number;
  name: string;
  number: string;
  patient_number?: string;
}

/**
 * Simplified user reference for prescriber/creator.
 */
export interface UserReference {
  id: number;
  name: string;
  email?: string;
}

/**
 * Simplified visit reference for nested responses.
 */
export interface VisitReference {
  id: number;
  visit_date: string | null;
  facility_name: string | null;
}

/**
 * Simplified template reference.
 */
export interface TemplateReference {
  id: number;
  name: string;
  category: string;
}

/**
 * Dispensing information for tracking.
 */
export interface DispensingInfo {
  dispensed_at: string | null;
  dispensed_by_name: string | null;
  dispensed_pharmacy: string | null;
  dispensing_location: DispensingLocation;
}

/**
 * Cancellation information for tracking.
 */
export interface CancellationInfo {
  cancelled_at: string;
  reason: CancellationReason;
  notes: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            CORE PRESCRIPTION TYPE                          */
/* -------------------------------------------------------------------------- */

/**
 * Complete prescription entity as returned by the API.
 * Includes all fields, computed properties, and optional relationships.
 */
export interface Prescription {
  // Primary identifiers
  id: number;
  facility_id: number;
  patient_id: number;
  visit_id: number | null;
  clinical_template_id: number | null;

  // Prescription identification
  prescription_number: string;
  prescription_date: string;
  valid_until: string | null;

  // Status and classification
  status: PrescriptionStatus;
  prescription_type: PrescriptionType;
  priority: PrescriptionPriority;

  // Clinical content
  diagnosis: string | null;
  clinical_notes: string | null;
  special_instructions: string | null;

  // Allergy tracking
  allergy_check: AllergyCheckStatus | null;
  allergy_notes: string | null;

  // Prescriber information
  prescribed_by: PrescribedByReference;
  prescriber_type: PrescriberType;
  prescriber_license: string | null;
  prescriber_contact: string | null;
  prescription_format: PrescriptionFormat;

  // Dispensing information
  dispensed_at: string | null;
  dispensed_by_name: string | null;
  dispensed_pharmacy: string | null;
  dispensing_location: DispensingLocation;

  // Cancellation information
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancellation_reason: CancellationReason | null;
  cancellation_notes: string | null;

  // Additional clinical notes
  patient_education_notes: string | null;
  follow_up_instructions: string | null;
  follow_up_date: string | null;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relationships (loaded conditionally)
  patient?: PatientReference;
  prescribed_by_user?: UserReference;
  clinical_template?: TemplateReference;
  visit?: VisitReference;
  items?: PrescriptionItem[];

  // Computed properties (from backend)
  total_items?: number;
  total_quantity?: number;
}
export interface PrescribedByReference {
  id: number;
  name: string;
  type: PrescriberType;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new prescription.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreatePrescriptionRequest {
  // Required fields
  facility_id: number;
  patient_id: number;
  prescription_date: string;
  prescribed_by: number;
  prescriber_type: PrescriberType;
  prescription_format: PrescriptionFormat;
  status: PrescriptionStatus;
  prescription_type: PrescriptionType;
  priority: PrescriptionPriority;

  // Optional fields
  visit_id?: number | null;
  clinical_template_id?: number | null;
  valid_until?: string | null;
  diagnosis?: string | null;
  clinical_notes?: string | null;
  special_instructions?: string | null;
  allergy_check?: AllergyCheckStatus | null;
  allergy_notes?: string | null;
  prescriber_license?: string | null;
  prescriber_contact?: string | null;
  patient_education_notes?: string | null;
  follow_up_instructions?: string | null;
  follow_up_date?: string | null;

  // Items (medications)
  items: CreatePrescriptionItemRequest[];
}

/**
 * Request payload for updating an existing prescription.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdatePrescriptionRequest {
  visit_id?: number | null;
  status?: PrescriptionStatus;
  diagnosis?: string | null;
  clinical_notes?: string | null;
  special_instructions?: string | null;
  patient_education_notes?: string | null;
  follow_up_instructions?: string | null;
  follow_up_date?: string | null;
  allergy_check?: AllergyCheckStatus | null;
  allergy_notes?: string | null;
  
  // Optional items update (if provided, replaces all existing items)
  items?: UpdatePrescriptionItemRequest[];
}

/**
 * Request payload for cancelling a prescription.
 */
export interface CancelPrescriptionRequest {
  cancellation_reason: CancellationReason;
  cancellation_notes?: string | null;
}

/**
 * Request payload for marking prescription as dispensed.
 */
export interface MarkDispensedRequest {
  pharmacy_name?: string | null;
  dispensed_by_name?: string | null;
}

/**
 * Request payload for applying template to prescription.
 */
export interface ApplyTemplateRequest {
  template_id: number;
}

/**
 * Query parameters for filtering prescription list.
 */
export interface PrescriptionFilters {
  facility_id?: number;
  patient_id?: number;
  status?: PrescriptionStatus;
  date_from?: string;
  date_to?: string;
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard success response structure.
 * Generic type parameter T represents the data payload.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard error response structure.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null | [];
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Response for prescription list endpoint.
 */
export type GetPrescriptionsResponse = ApiSuccessResponse<Prescription[]> & {
  meta: {
    total: number;
    filters: PrescriptionFilters;
  };
};

/**
 * Response for paginated prescriptions endpoint.
 */
export interface GetPrescriptionsPaginatedResponse extends ApiSuccessResponse<Prescription[]> {
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Response for patient prescriptions endpoint.
 */
export interface GetPatientPrescriptionsResponse extends ApiSuccessResponse<Prescription[]> {
  meta: {
    patient_id: number;
    total: number;
  };
}

/**
 * Response for single prescription operations (GET, POST, PUT).
 */
export type PrescriptionResponse = ApiSuccessResponse<Prescription>;

/**
 * Response for delete operation.
 */
export type DeletePrescriptionResponse = ApiSuccessResponse<null>;

/**
 * Response for cancel operation.
 */
export type CancelPrescriptionResponse = ApiSuccessResponse<Prescription>;

/**
 * Response for dispense operation.
 */
export type DispensePrescriptionResponse = ApiSuccessResponse<Prescription>;

/**
 * Response for apply template operation.
 */
export type ApplyTemplateResponse = ApiSuccessResponse<Prescription>;

/**
 * Response for get for billing operation.
 */
export type GetForBillingResponse = ApiSuccessResponse<{
  prescription: Prescription;
  billing_items: BillingItem[];
  total_items: number;
  total_quantity: number;
}>;
/* -------------------------------------------------------------------------- */
/*                              BILLING TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Billing item extracted from prescription.
 * This is what the billing module imports.
 */
export interface BillingItem {
  prescription_item_id: number;
  medication_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string;
  total_quantity: number;
  dosage_quantity: number;
  dosage_unit: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  route: string;
}

/**
 * Prescription data formatted for billing import.
 */
export interface PrescriptionForBilling {
  prescription_id: number;
  prescription_number: string;
  prescription_date: string;
  valid_until: string | null;
  doctor_name: string;
  patient_id: number;
  items: BillingItem[];
  total_quantity: number;
  total_items: number;
}

/**
 * Response for billing import endpoints.
 */
export type GetPrescriptionsForBillingResponse = ApiSuccessResponse<PrescriptionForBilling[]>;

export type GetSinglePrescriptionForBillingResponse = ApiSuccessResponse<PrescriptionForBilling>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for prescription ID parameter in API calls.
 */
export type PrescriptionId = number;

/**
 * Type for patient ID parameter in API calls.
 */
export type PatientId = number | string;

/**
 * Union type of all possible API responses.
 */
export type PrescriptionApiResponse =
  | GetPrescriptionsResponse
  | GetPrescriptionsPaginatedResponse
  | GetPatientPrescriptionsResponse
  | PrescriptionResponse
  | DeletePrescriptionResponse
  | CancelPrescriptionResponse
  | DispensePrescriptionResponse
  | ApplyTemplateResponse
  | GetForBillingResponse
  | GetPrescriptionsForBillingResponse
  | GetSinglePrescriptionForBillingResponse;

/**
 * Type guard to check if response is an error.
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Options for mutation callbacks.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update mutations.
 */
export interface UpdatePrescriptionParams {
  id: PrescriptionId;
  data: UpdatePrescriptionRequest;
}

/**
 * Parameters for cancel mutation.
 */
export interface CancelPrescriptionParams {
  id: PrescriptionId;
  data: CancelPrescriptionRequest;
}

/**
 * Parameters for dispense mutation.
 */
export interface DispensePrescriptionParams {
  id: PrescriptionId;
  data: MarkDispensedRequest;
}

/**
 * Parameters for apply template mutation.
 */
export interface ApplyTemplateParams {
  id: PrescriptionId;
  data: ApplyTemplateRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeletePrescriptionParams {
  id: PrescriptionId;
}

/**
 * Helper function to get status badge color.
 */
export const getStatusColor = (status: PrescriptionStatus): string => {
  switch (status) {
    case PrescriptionStatus.DRAFT:
      return 'text-gray-600 bg-gray-100';
    case PrescriptionStatus.ACTIVE:
      return 'text-green-600 bg-green-100';
    case PrescriptionStatus.PARTIALLY_DISPENSED:
      return 'text-blue-600 bg-blue-100';
    case PrescriptionStatus.FULLY_DISPENSED:
      return 'text-purple-600 bg-purple-100';
    case PrescriptionStatus.EXPIRED:
      return 'text-red-600 bg-red-100';
    case PrescriptionStatus.CANCELLED:
      return 'text-gray-500 bg-gray-100';
    case PrescriptionStatus.ON_HOLD:
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Helper function to get status label.
 */
export const getStatusLabel = (status: PrescriptionStatus): string => {
  return status.replace(' - ', ' ');
};

/**
 * Helper function to get priority color.
 */
export const getPriorityColor = (priority: PrescriptionPriority): string => {
  switch (priority) {
    case PrescriptionPriority.STAT:
      return 'text-red-600 bg-red-100';
    case PrescriptionPriority.URGENT:
      return 'text-orange-600 bg-orange-100';
    case PrescriptionPriority.ROUTINE:
      return 'text-blue-600 bg-blue-100';
    case PrescriptionPriority.SCHEDULED:
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Helper function to check if prescription is expired.
 */
export const isPrescriptionExpired = (prescription: Prescription): boolean => {
  if (!prescription.valid_until) return false;
  return new Date(prescription.valid_until) < new Date();
};

/**
 * Helper function to check if prescription can be dispensed.
 */
export const canBeDispensed = (prescription: Prescription): boolean => {
  return (
    prescription.status === PrescriptionStatus.ACTIVE &&
    !isPrescriptionExpired(prescription)
  );
};