export type HubCommunityChannel = 'discussion' | 'feature_idea' | 'product_update';

export interface HubCommunityAuthorDto {
  id: number | null;
  display_name: string;
}

export interface HubCommunityPostSummaryDto {
  uuid: string;
  channel: HubCommunityChannel;
  title: string;
  excerpt: string;
  comments_count: number;
  author: HubCommunityAuthorDto;
  created_at: string | null;
  updated_at: string | null;
}

export interface HubCommunityPostDetailDto {
  uuid: string;
  channel: HubCommunityChannel;
  title: string;
  body: string;
  comments_count: number;
  author: HubCommunityAuthorDto;
  created_at: string | null;
  updated_at: string | null;
}

export interface HubCommunityCommentDto {
  uuid: string;
  body: string;
  author: HubCommunityAuthorDto;
  created_at: string | null;
}

export interface HubCommunityPostsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: HubCommunityPostsMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface HubCommunityPostDetailResponse {
  post: HubCommunityPostDetailDto;
  comments: HubCommunityCommentDto[];
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
