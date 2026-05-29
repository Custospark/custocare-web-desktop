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

export interface StaffReference {
  id: number;
  staff_name: string | null;
}

export interface DischargeMedication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  duration_days: number | null;
}

export interface DischargeData {
  id: number;
  visit_uuid: string;
  patient_id: number;
  discharged_at: string | null;
  discharge_disposition: string | null;
  discharge_diagnosis: string | null;
  discharge_instructions: string | null;
  discharge_medications: DischargeMedication[];
  followup_scheduled_at: string | null;
  followup_provider: StaffReference | null;
  discharged_by: StaffReference | null;
  is_discharged: boolean;
}

export interface DischargeRequest {
  discharged_at?: string;
  discharge_disposition: string;
  discharge_diagnosis?: string | null;
  discharge_instructions?: string | null;
  discharge_medications?: DischargeMedication[];
  followup_scheduled_at?: string | null;
  followup_provider_staff_id?: number | null;
}

export interface UpdateDischargeRequest {
  discharged_at?: string;
  discharge_disposition?: string;
  discharge_diagnosis?: string | null;
  discharge_instructions?: string | null;
  discharge_medications?: DischargeMedication[];
  followup_scheduled_at?: string | null;
  followup_provider_staff_id?: number | null;
}

export interface CreateDischargeParams {
  visitId: string;
  data: DischargeRequest;
}

export interface UpdateDischargeParams {
  visitId: string;
  data: UpdateDischargeRequest;
}

export interface DischargeSingleSuccessResponse {
  success: true;
  message: string;
  data: DischargeData;
  errors: null;
}

export interface DischargeNotFoundResponse {
  success: false;
  message: string;
  errors: {
    discharge: string[];
  };
  data: null;
}

export interface DischargeValidationErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]>;
}

export interface DischargeSystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

export type DischargeApiResponse =
  | DischargeSingleSuccessResponse
  | DischargeNotFoundResponse
  | DischargeValidationErrorResponse
  | DischargeSystemErrorResponse;
