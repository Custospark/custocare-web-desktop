/**
 * ============================================================================
 * PROFILE HEADER COMPONENT
 * ============================================================================
 *
 * Displays the profile header with avatar, display name, title, and edit controls.
 */

import React from 'react';
import { Camera, CheckCircle, User } from 'lucide-react';
import { type UserProfile, type ProfileFormState } from './ProfileTypes';

/* -------------------------------------------------------------------------- */
/*                               SUB-COMPONENTS                               */
/* -------------------------------------------------------------------------- */

const PhotoHeader: React.FC<{
  profile: UserProfile;
  previewUrl: string | null;
  isUploading: boolean;
  isEditing: boolean;
  isDark: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  profile,
  previewUrl,
  isUploading,
  isEditing,
  isDark,
  fileInputRef,
  onFileChange,
}) => {
  const resolvePhotoUrl = (path: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('blob:') || path.startsWith('http')) return path;
    const base = (import.meta as Record<string, unknown> & {
      env: Record<string, string>;
    }).env?.VITE_STORAGE_BASE_URL ?? '';
    return `${base}/storage/${path}`;
  };

  const photoUrl = previewUrl ?? resolvePhotoUrl(profile.profile_photo_path);
  const initials = `${profile.first_name?.[0] ?? ''}${
    profile.last_name?.[0] ?? ''
  }`.toUpperCase();

  return (
    <div className="relative group w-28 h-28 shrink-0">
      <div
        className={`w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold shadow-xl border-4 ${
          isDark
            ? 'border-gray-800 bg-linear-to-br from-cyan-600 to-blue-700 text-white'
            : 'border-white bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200'
        }`}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials || <User className="w-12 h-12" />}</span>
        )}
      </div>

      {isEditing && (
        <>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1
              text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
              ${
                isDark
                  ? 'bg-black/60 text-cyan-300'
                  : 'bg-black/50 text-white'
              }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <Camera className="w-6 h-6" />
                <span>Change</span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onFileChange}
          />
        </>
      )}

      {isEditing && !isUploading && (
        <span
          className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-2 shadow ${
            isDark
              ? 'bg-cyan-600 border-gray-900 text-white'
              : 'bg-blue-600 border-white text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
};

const EditModeFields: React.FC<{
  form: ProfileFormState;
  fieldErrors: Record<string, string>;
  isDark: boolean;
  handleField: (key: keyof ProfileFormState, value: string) => void;
}> = ({ form, fieldErrors, isDark, handleField }) => {
  const inputBase = `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors
    focus:ring-2 ${
      isDark
        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

  return (
    <div className="space-y-3">
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Display Name
        </label>
        <input
          type="text"
          maxLength={150}
          value={form.display_name}
          onChange={(e) => handleField('display_name', e.target.value)}
          className={inputBase}
          placeholder="How should we address you?"
        />
        {fieldErrors.display_name && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.display_name}</p>
        )}
      </div>

      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Job Title
        </label>
        <input
          type="text"
          maxLength={50}
          value={form.title}
          onChange={(e) => handleField('title', e.target.value)}
          className={inputBase}
          placeholder="e.g. Senior Software Engineer"
        />
        {fieldErrors.title && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>
        )}
      </div>
    </div>
  );
};

const ViewModeFields: React.FC<{
  profile: UserProfile;
  isDark: boolean;
}> = ({ profile, isDark }) => (
  <>
    <h2 className="text-2xl font-bold truncate">{profile.display_name}</h2>
    {profile.title && (
      <p className={`text-sm font-medium ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
        {profile.title}
      </p>
    )}
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {profile.gender && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          {profile.gender}
        </span>
      )}
      {profile.dob && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          {new Date(profile.dob).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  </>
);

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

interface ProfileHeaderProps {
  profile: UserProfile;
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

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  form,
  editMode,
  isDark,
  isUploading,
  previewUrl,
  fieldErrors,
  fileInputRef,
  handleField,
  handleFileChange,
}) => {
  const cardBase = `rounded-xl border p-6 ${
    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
  }`;

  return (
    <div className={cardBase}>
      <div className="flex items-center gap-6 flex-wrap">
        <PhotoHeader
          profile={profile}
          previewUrl={previewUrl}
          isUploading={isUploading}
          isEditing={editMode}
          isDark={isDark}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

        <div className="flex-1 min-w-0 space-y-1">
          {editMode && form ? (
            <EditModeFields
              form={form}
              fieldErrors={fieldErrors}
              isDark={isDark}
              handleField={handleField}
            />
          ) : (
            <ViewModeFields profile={profile} isDark={isDark} />
          )}
        </div>

        {!editMode && (
          <CheckCircle
            className={`w-6 h-6 flex-shrink-0 ${
              isDark ? 'text-cyan-500' : 'text-blue-500'
            }`}
            title="Profile complete"
          />
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;