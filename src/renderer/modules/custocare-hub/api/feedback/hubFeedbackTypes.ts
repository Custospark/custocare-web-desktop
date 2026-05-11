export type HubFeedbackCategory = 'feedback' | 'feature_request';

export type HubFeedbackStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface HubFeedbackMineDto {
  id: number;
  uuid: string;
  category: HubFeedbackCategory;
  subject: string;
  body: string;
  status: HubFeedbackStatus;
  include_in_roadmap: boolean;
  staff_reply: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HubFeedbackRoadmapItemDto {
  uuid: string;
  subject: string;
  excerpt: string;
  votes_count: number;
  voted_by_you: boolean;
  created_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
