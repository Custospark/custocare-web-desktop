export interface SupportFaqDto {
  uuid: string;
  question: string;
  answer: string;
  sort_order: number;
  updated_at: string | null;
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
