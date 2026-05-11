export type HubSupportTicketCategory = 'account_issue' | 'facility_issue' | 'general';

export type HubSupportTicketPriority = 'low' | 'medium' | 'high';

export type HubSupportTicketStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface HubSupportTicketTimelineItemDto {
  uuid?: string;
  status: HubSupportTicketStatus | string;
  note?: string | null;
  created_at?: string | null;
}

export interface HubSupportTicketDto {
  id?: number;
  uuid: string;
  category: HubSupportTicketCategory | string;
  priority?: HubSupportTicketPriority | string;
  subject: string;
  body: string;
  status: HubSupportTicketStatus | string;
  staff_reply?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  timeline?: HubSupportTicketTimelineItemDto[] | null;
}

export interface CreateHubSupportTicketPayload {
  category: HubSupportTicketCategory;
  subject: string;
  body: string;
  priority?: HubSupportTicketPriority;
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

