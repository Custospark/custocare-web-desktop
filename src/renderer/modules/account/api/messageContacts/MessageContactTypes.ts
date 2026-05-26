export interface MessageContactLinkedUser {
  id: number;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface MessageContact {
  id: number;
  display_name: string;
  linked_user_id: number | null;
  can_message: boolean;
  custocare_user_name?: string | null;
  email: string | null;
  phone: string | null;
  last_used_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  linked_user: MessageContactLinkedUser | null;
}

export interface MessageContactListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface MessageContactListResponse {
  success: boolean;
  message: string;
  data: MessageContact[];
  meta: MessageContactListMeta;
}

export interface MessageContactResponse {
  success: boolean;
  message: string;
  data: MessageContact;
}

export interface StoreMessageContactRequest {
  display_name: string;
  email?: string | null;
  phone?: string | null;
}

export type UpdateMessageContactRequest = Partial<StoreMessageContactRequest>;

export interface ResolveMessageContactRequest {
  email?: string | null;
  phone?: string | null;
}

export interface ResolveMessageContactResult {
  linked_user_id: number | null;
  can_message: boolean;
  display_name: string | null;
}

export interface ResolveMessageContactResponse {
  success: boolean;
  message: string;
  data: ResolveMessageContactResult;
}

export interface MessageContactFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}
