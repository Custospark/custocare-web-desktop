/**
 * ============================================================================
 * PROFILE TYPES
 * ============================================================================
 */

import { type UserProfile, type UpdateUserProfileRequest, Gender } from '../../../../api/settings/profile/ProfileTypes';

/** Local form state – mirrors UpdateUserProfileRequest plus a guard flag. */
export type ProfileFormState = Required<
  Omit<UpdateUserProfileRequest, 'profile_photo_path'>
> & {
  profile_photo_path: string;
};

export interface ProfileContextValue {
  profile: UserProfile | null;
  form: ProfileFormState | null;
  editMode: boolean;
  isDark: boolean;
  isSaving: boolean;
  isUploading: boolean;
  previewUrl: string | null;
  fieldErrors: Record<string, string>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleField: (key: keyof ProfileFormState, value: string) => void;
  handleSave: () => void;
  handleCancelEdit: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setEditMode: (mode: boolean) => void;
}

export * from '../../../../api/settings/profile/ProfileTypes';
export { Gender };