import type { Ward } from '../../../administration/admin-module/api/wards/wardTypes';
import type { VisitStatus } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

export type NursingMedicationDoseStatus = 'pending' | 'administered' | 'missed' | 'skipped';

export interface NursingUserBrief {
  id: number;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface NursingPatientBrief {
  id: number;
  user_id: number;
  user?: NursingUserBrief | null;
}

export interface NursingVisitBrief {
  id: number;
  visit_uuid: string;
  patient_id: number;
  status?: VisitStatus | string;
}

export interface NursingPrescriptionBrief {
  id: number;
  prescription_number?: string | null;
}

export interface NursingPrescriptionItemBrief {
  id: number;
  medication_name?: string | null;
  strength?: string | null;
  dosage_quantity?: string | number | null;
  dosage_unit?: string | null;
  route?: string | null;
}

export interface NursingMedicationDose {
  id: number;
  facility_id: number;
  visit_id: number;
  patient_id: number;
  prescription_id: number;
  prescription_item_id: number;
  scheduled_for: string;
  status: NursingMedicationDoseStatus;
  ward_id: number | null;
  schedule_notes: string | null;
  created_at: string;
  updated_at: string;
  visit?: NursingVisitBrief | null;
  patient?: NursingPatientBrief | null;
  prescription?: NursingPrescriptionBrief | null;
  prescriptionItem?: NursingPrescriptionItemBrief | null;
  ward?: Ward | null;
}

export interface NursingMedicationDoseListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface NursingMedicationDoseListResponse {
  data: NursingMedicationDose[];
  meta: NursingMedicationDoseListMeta;
}

export interface NursingMedicationScheduleQueryParams {
  facilityId: number;
  visit_id?: number;
  ward_id?: number;
  patient_id?: number;
  status?: NursingMedicationDoseStatus | '';
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export type NursingMedicationAdministrationOutcome = 'given' | 'partial' | 'refused' | 'held' | 'omitted';

export interface NursingMedicationAdministration {
  id: number;
  nursing_medication_dose_id: number | null;
  facility_id: number;
  visit_id: number;
  prescription_item_id: number;
  administered_by_user_id: number;
  administered_at: string;
  outcome: NursingMedicationAdministrationOutcome;
  quantity_given: string | number | null;
  quantity_unit: string | null;
  notes: string | null;
  refusal_or_omission_reason: string | null;
  created_at: string;
  updated_at: string;
  visit?: NursingVisitBrief | null;
  prescriptionItem?: NursingPrescriptionItemBrief | null;
  administeredBy?: NursingUserBrief | null;
  dose?: Pick<NursingMedicationDose, 'id' | 'scheduled_for' | 'status'> | null;
}

export interface NursingMedicationAdministrationListResponse {
  data: NursingMedicationAdministration[];
  meta: NursingMedicationDoseListMeta;
}

export interface NursingMedicationAdministrationQueryParams {
  facilityId: number;
  visit_id?: number;
  outcome?: NursingMedicationAdministrationOutcome | '';
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export interface CreateNursingMedicationAdministrationPayload {
  facility_id: number;
  visit_id: number;
  prescription_item_id: number;
  nursing_medication_dose_id?: number | null;
  administered_at: string;
  outcome: NursingMedicationAdministrationOutcome;
  quantity_given?: number | null;
  quantity_unit?: string | null;
  notes?: string | null;
  refusal_or_omission_reason?: string | null;
}

export interface CreateNursingMedicationAdministrationApiResponse {
  message: string;
  data: NursingMedicationAdministration;
}
