/**
 * Types aligned with Laravel `facility_tasks` API responses.
 */

export type FacilityTaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type FacilityTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type FacilityTaskCategory =
  | 'patient_care'
  | 'ward_ops'
  | 'medication'
  | 'documentation'
  | 'clinical_escalation'
  | 'other';

export interface FacilityTaskUserBrief {
  id: number;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface FacilityTaskWardBrief {
  id: number;
  name: string;
  code?: string | null;
}

export interface FacilityTask {
  id: number;
  facility_id: number;
  title: string;
  description: string | null;
  category: FacilityTaskCategory;
  priority: FacilityTaskPriority;
  status: FacilityTaskStatus;
  due_at: string | null;
  assigned_to_user_id: number | null;
  assigned_by_user_id: number | null;
  ward_id: number | null;
  visit_uuid: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_to?: FacilityTaskUserBrief | null;
  assigned_by?: FacilityTaskUserBrief | null;
  ward?: FacilityTaskWardBrief | null;
}

export interface FacilityTasksListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FacilityTasksListResponse {
  data: FacilityTask[];
  meta: FacilityTasksListMeta;
}

export interface MyFacilityTasksQueryParams {
  facilityId: number;
  status?: string;
  priority?: FacilityTaskPriority;
  page?: number;
  per_page?: number;
}

/** GET /facility-tasks — facility-wide task list (e.g. history / oversight). */
export interface FacilityTasksListQueryParams {
  facilityId: number;
  status?: FacilityTaskStatus | '';
  priority?: FacilityTaskPriority | '';
  page?: number;
  per_page?: number;
}

export interface UpdateFacilityTaskPayload {
  facility_id: number;
  title?: string;
  description?: string | null;
  category?: FacilityTaskCategory;
  priority?: FacilityTaskPriority;
  status?: FacilityTaskStatus;
  due_at?: string | null;
  assigned_to_user_id?: number | null;
  ward_id?: number | null;
  visit_uuid?: string | null;
  cancellation_reason?: string | null;
  completion_notes?: string | null;
}

export interface UpdateFacilityTaskApiResponse {
  message: string;
  data: FacilityTask;
}

/** POST /facility-tasks — aligns with Laravel StoreFacilityTaskRequest */
export interface CreateFacilityTaskPayload {
  facility_id: number;
  title: string;
  description?: string | null;
  category?: FacilityTaskCategory;
  priority?: FacilityTaskPriority;
  status?: FacilityTaskStatus;
  due_at?: string | null;
  assigned_to_user_id?: number | null;
  ward_id?: number | null;
  visit_uuid?: string | null;
}

export interface CreateFacilityTaskApiResponse {
  message: string;
  data: FacilityTask;
}
