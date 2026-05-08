/**
 * Types for GET /patients/{id}/medical-history (continuity of care aggregate).
 */

export interface FacilityAddressSnapshot {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  formatted: string;
}

export interface FacilitySnapshot {
  id: number;
  uuid: string;
  code: string | null;
  name: string;
  legal_name: string | null;
  type: string | null;
  tier: string | null;
  status: string | null;
  phone: string | null;
  email: string | null;
  address: FacilityAddressSnapshot;
}

export interface MedicalHistoryPatientSummary {
  id: number;
  patient_uuid: string;
  full_name: string | null;
  date_of_birth: string | null;
  biological_sex: string | null;
  blood_type: string | null;
  status: string | null;
}

export interface MedicalHistoryVisit {
  id: number;
  visit_uuid: string;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  visit_type: string | null;
  status: string | null;
  current_phase: string | null;
  arrived_at: string | null;
  discharged_at: string | null;
  occurred_at: string | null;
}

export interface MedicalHistoryAllergy {
  id: number;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  allergen: string;
  reaction: string | null;
  severity: string | null;
  clinical_notes: string | null;
  is_active: boolean;
  diagnosed_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  occurred_at: string | null;
  recorded_by: { id: number; name: string | null } | null;
}

export interface MedicalHistoryPrescriptionItem {
  id: number;
  medication_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string;
  dosage_quantity: number | null;
  dosage_unit: string | null;
  frequency: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  route: string | null;
  instructions: string | null;
  refills: string | null;
}

export interface MedicalHistoryPrescription {
  id: number;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  prescription_number: string;
  prescription_date: string | null;
  status: string | null;
  prescription_type: string | null;
  priority: string | null;
  diagnosis: string | null;
  clinical_notes: string | null;
  special_instructions: string | null;
  created_at: string | null;
  occurred_at: string | null;
  items: MedicalHistoryPrescriptionItem[];
}

export interface MedicalHistoryClinicalNote {
  id: number;
  uuid: string;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  note_type: string | null;
  note_status: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  noted_at: string | null;
  created_at: string | null;
  occurred_at: string | null;
}

export interface MedicalHistoryVital {
  id: number;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  temperature: number | null;
  temperature_unit: string | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  oxygen_saturation: number | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  pain_score: number | null;
  measured_at: string | null;
  created_at: string | null;
  occurred_at: string | null;
}

export interface MedicalHistoryDiagnosis {
  id: number;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  diagnosis_code: string | null;
  diagnosis_description: string | null;
  diagnosis_type: string | null;
  clinical_status: string | null;
  clinical_notes: string | null;
  onset_date: string | null;
  created_at: string | null;
  occurred_at: string | null;
}

export interface MedicalHistoryConsultation {
  id: number;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  consultation_type: string | null;
  priority: string | null;
  specialty_required: string | null;
  clinical_question: string | null;
  findings: string | null;
  recommendations: string | null;
  request_status: string | null;
  requested_at: string | null;
  completed_at: string | null;
  occurred_at: string | null;
  requesting_staff: { id: number; name: string | null } | null;
  consultant_staff: { id: number; name: string | null } | null;
}

export interface MedicalHistoryLabItem {
  id: number;
  status: string | null;
  sample_type: string | null;
  test_name: string | null;
  notes: string | null;
}

export interface MedicalHistoryLabRequest {
  id: number;
  request_uuid: string;
  visit_id: number | null;
  facility_id: number | null;
  facility: FacilitySnapshot | null;
  status: string | null;
  priority: string | null;
  clinical_notes: string | null;
  requested_at: string | null;
  completed_at: string | null;
  occurred_at: string | null;
  items: MedicalHistoryLabItem[];
}

export interface PatientMedicalHistoryPayload {
  patient: MedicalHistoryPatientSummary;
  facilities: Record<string, FacilitySnapshot>;
  visits: MedicalHistoryVisit[];
  allergies: MedicalHistoryAllergy[];
  prescriptions: MedicalHistoryPrescription[];
  clinical_notes: MedicalHistoryClinicalNote[];
  vitals: MedicalHistoryVital[];
  diagnoses: MedicalHistoryDiagnosis[];
  consultations: MedicalHistoryConsultation[];
  lab_requests: MedicalHistoryLabRequest[];
  generated_at: string;
}

export interface PatientMedicalHistoryApiResponse {
  success: boolean;
  message?: string;
  data: PatientMedicalHistoryPayload;
}
