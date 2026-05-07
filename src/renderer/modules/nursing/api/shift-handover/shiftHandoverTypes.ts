/**
 * Types aligned with Laravel `facility_shift_handovers` (or equivalent) API.
 */

import type { FacilityTaskUserBrief, FacilityTaskWardBrief } from '../facility-tasks/facilityTaskTypes';

export interface FacilityShiftHandover {
  id: number;
  facility_id: number;
  summary: string;
  ward_id: number | null;
  handed_over_to_user_id: number | null;
  handed_over_by_user_id: number | null;
  visit_uuid: string | null;
  created_at: string;
  updated_at: string;
  handed_over_by?: FacilityTaskUserBrief | null;
  handed_over_to?: FacilityTaskUserBrief | null;
  ward?: FacilityTaskWardBrief | null;
}

export interface FacilityShiftHandoversListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FacilityShiftHandoversListResponse {
  data: FacilityShiftHandover[];
  meta: FacilityShiftHandoversListMeta;
}

/** POST /facility-shift-handovers */
export interface CreateFacilityShiftHandoverPayload {
  facility_id: number;
  summary: string;
  ward_id?: number | null;
  handed_over_to_user_id?: number | null;
  visit_uuid?: string | null;
}

export interface CreateFacilityShiftHandoverApiResponse {
  message: string;
  data: FacilityShiftHandover;
}
