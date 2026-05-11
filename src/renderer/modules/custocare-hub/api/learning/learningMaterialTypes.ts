export interface LearningMaterialDto {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  video_url: string;
  /** Relative path on the public disk (same pattern as profile_photo_path). */
  thumbnail_path: string | null;
  /** Optional external / pasted image URL (not derived from video preview). */
  thumbnail_url: string | null;
  /** When there is no upload and no external URL, YouTube/Vimeo-style preview from video_url. */
  thumbnail_video_preview_url: string | null;
  banner_image_url: string | null;
  category: string;
  sort_order: number;
  is_published: boolean;
  created_by: number | null;
  created_at: string | null;
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

/** Must match backend `LearningMaterial::allowedCategories()` and hub `learning-center` path segments */
export const LEARNING_CENTER_CATEGORIES = [
  { value: 'watch-tutorials', label: 'Watch tutorials' },
  { value: 'start-training', label: 'Start training' },
  { value: 'getting-started', label: 'Getting started' },
  { value: 'track-progress', label: 'Track progress' },
] as const;

export type LearningCenterCategory = (typeof LEARNING_CENTER_CATEGORIES)[number]['value'];
