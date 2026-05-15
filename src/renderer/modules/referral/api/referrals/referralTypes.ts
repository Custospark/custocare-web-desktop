export type ReferralType = 'internal' | 'external';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type ReferralPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ReferralFacility {
  id: number;
  facility_uuid?: string;
  facility_name: string;
  facility_code?: string;
}

export interface ReferralStaff {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
}

export interface ReferralPatient {
  id: number;
  patient_uuid?: string;
  medical_record_number_hash?: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth?: string | null;
  gender_identity?: string | null;
}

export interface Referral {
  id: number;
  referral_uuid: string;
  patient_id: number;
  facility_id: number;
  receiving_facility_id: number | null;
  referring_staff_id: number | null;
  receiving_staff_id: number | null;
  referral_type: ReferralType;
  referral_type_text?: string;
  referral_reason: string | null;
  clinical_notes: string | null;
  external_referral_id: string | null;
  status: ReferralStatus;
  status_text?: string;
  priority: ReferralPriority;
  priority_text?: string;
  referral_date: string | null;
  response_date: string | null;
  completed_date: string | null;
  expiry_date: string | null;
  metadata?: Record<string, unknown> | null;
  patient?: ReferralPatient;
  referring_facility?: ReferralFacility;
  receiving_facility?: ReferralFacility | null;
  referring_staff?: ReferralStaff | null;
  receiving_staff?: ReferralStaff | null;
}

export interface ReferralCollectionMeta {
  count: number;
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface ReferralCollection {
  data: Referral[];
  meta: ReferralCollectionMeta;
}

export interface CreateReferralRequest {
  patient_id: number;
  facility_id: number;
  receiving_facility_id?: number | null;
  referring_staff_id?: number | null;
  receiving_staff_id?: number | null;
  referral_type: ReferralType;
  referral_reason?: string | null;
  clinical_notes?: string | null;
  external_referral_id?: string | null;
  priority?: ReferralPriority;
  expiry_date?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateReferralRequest {
  receiving_facility_id?: number | null;
  referring_staff_id?: number | null;
  receiving_staff_id?: number | null;
  referral_type?: ReferralType;
  referral_reason?: string | null;
  clinical_notes?: string | null;
  external_referral_id?: string | null;
  priority?: ReferralPriority;
  expiry_date?: string | null;
  metadata?: Record<string, unknown> | null;
}
