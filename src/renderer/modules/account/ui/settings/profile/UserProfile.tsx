/**
 * ============================================================================
 * USER PROFILE COMPONENT (ENTRY POINT)
 * ============================================================================
 *
 * Orchestrates the profile display by composing the smaller specialized components.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit3, Save, X, XCircle } from 'lucide-react';

import { type RootState } from '../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import {
  useGetUserProfile,
  useUpdateUserProfile,
  useUploadProfilePhoto,
} from '../../../api/settings/profile/ProfileQueries';
import { type UserProfile, Gender, parsePhone } from '../../../api/settings/profile/ProfileTypes';

import ProfileHeader from './components/ProfileHeader';

import ProfilePersonalInfo from './components/ProfilePersonalInfo';
import { ProfileContactInfo, ProfileAddress } from './components/ProfileContactInfo';
import { type ProfileFormState } from './components/ProfileTypes';

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const profileToFormState = (p: UserProfile): ProfileFormState => ({
  first_name: p.first_name ?? '',
  last_name: p.last_name ?? '',
  display_name: p.display_name ?? '',
  title: p.title ?? '',
  dob: p.dob ?? '',
  gender: p.gender ?? ('' as Gender),
  phone: parsePhone(p.phone) ?? '',
  address_line1: p.address_line1 ?? '',
  address_line2: p.address_line2 ?? '',
  city: p.city ?? '',
  state: p.state ?? '',
  country: p.country ?? '',
  postal_code: p.postal_code ?? '',
  profile_photo_path: p.profile_photo_path ?? '',
});

const buildUpdatePayload = (
  form: ProfileFormState,
  original: UserProfile,
): any => { 
  const payload: any = {};

  const str = (
    key: keyof Omit<ProfileFormState, 'gender' | 'profile_photo_path'>,
    origKey: keyof UserProfile,
  ) => {
    const v = form[key] as string;
    if (v !== (original[origKey] ?? '')) payload[key] = v || null;
  };

  str('first_name', 'first_name');
  str('last_name', 'last_name');
  str('display_name', 'display_name');
  str('title', 'title');
  str('dob', 'dob');
  str('phone', 'phone');
  str('address_line1', 'address_line1');
  str('address_line2', 'address_line2');
  str('city', 'city');
  str('state', 'state');
  str('country', 'country');
  str('postal_code', 'postal_code');

  const g = form.gender as string;
  if (g !== (original.gender ?? '')) {
    payload.gender = (g || null) as Gender | null;
  }

  return payload;
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

interface UserProfileProps {
  userId: number | string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  /* ── Theme from ui slice ───────────────────────────────────────────────── */
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  /* ── Query / mutation hooks ────────────────────────────────────────────── */
  const {
    data: profileResponse,
    isLoading,
    isError,
    error: fetchError,
  } = useGetUserProfile(userId);

  const { mutate: saveProfile, isPending: isSaving } = useUpdateUserProfile({
    onSuccess: () => setEditMode(false),
  });

  const { mutate: uploadPhoto, isPending: isUploading } = useUploadProfilePhoto();

  /* ── Local state ───────────────────────────────────────────────────────── */
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profile = profileResponse?.data ?? null;

  /* ── Sync form when profile loads ──────────────────────────────────────── */
  useEffect(() => {
    if (profile) setForm(profileToFormState(profile));
  }, [profile]);

  /* ── Revoke object URL to avoid memory leaks ───────────────────────────── */
  useEffect(
    () => () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleField = useCallback(
    (key: keyof ProfileFormState, value: string) => {
      setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleCancelEdit = () => {
    if (profile) {
      setForm(profileToFormState(profile));
      setPreviewUrl(null);
      setFieldErrors({});
    }
    setEditMode(false);
  };

  const validate = (f: ProfileFormState): boolean => {
    const errs: Record<string, string> = {};

    if (f.first_name && f.first_name.length > 100) errs.first_name = 'Max 100 characters.';
    if (f.last_name && f.last_name.length > 100) errs.last_name = 'Max 100 characters.';
    if (f.display_name && f.display_name.length > 150) errs.display_name = 'Max 150 characters.';
    if (f.title && f.title.length > 50) errs.title = 'Max 50 characters.';
    if (f.phone && f.phone.length > 30) errs.phone = 'Max 30 characters.';
    if (f.postal_code && f.postal_code.length > 20) errs.postal_code = 'Max 20 characters.';

    if (f.dob) {
      const d = new Date(f.dob);
      if (isNaN(d.getTime())) errs.dob = 'Invalid date.';
      else if (d >= new Date()) errs.dob = 'Date of birth must be a past date.';
    }

    if (f.gender && !['male', 'female', 'other', ''].includes(f.gender)) {
      errs.gender = 'Must be male, female, or other.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!form || !profile) return;
    if (!validate(form)) return;

    const payload = buildUpdatePayload(form, profile);
    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      return;
    }

    saveProfile({ userId, data: payload });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    uploadPhoto(
      { userId, file },
      {
        onError: () => setPreviewUrl(null),
      },
    );

    e.target.value = '';
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  LOADING STATE                                                          */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading your profile…" />;
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  ERROR STATE                                                            */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (isError || !profile || !form) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
        isDark ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <XCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className="text-xl font-bold">Failed to load profile</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {fetchError?.response?.data?.message ?? fetchError?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  MAIN RENDER                                                            */
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">

        {/* Page Header with Controls */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your personal information and settings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving || isUploading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    isSaving || isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-opacity-80'
                  } ${
                    isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                    isSaving || isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-700'
                  } ${isDark ? 'bg-blue-600' : 'bg-blue-600'}`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-blue-700 ${
                  isDark ? 'bg-blue-500' : 'bg-blue-600'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          form={form}
          editMode={editMode}
          isDark={isDark}
          isSaving={isSaving}
          isUploading={isUploading}
          previewUrl={previewUrl}
          fieldErrors={fieldErrors}
          fileInputRef={fileInputRef}
          handleField={handleField}
          handleSave={handleSave}
          handleCancelEdit={handleCancelEdit}
          handleFileChange={handleFileChange}
          setEditMode={setEditMode}
        />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProfilePersonalInfo
              profile={profile}
              form={form}
              editMode={editMode}
              isDark={isDark}
              fieldErrors={fieldErrors}
              handleField={handleField}
            />
            
            <ProfileContactInfo
              profile={profile}
              form={form}
              editMode={editMode}
              isDark={isDark}
              fieldErrors={fieldErrors}
              handleField={handleField}
            />
          </div>

          <div className="space-y-6">
            <ProfileAddress
              profile={profile}
              form={form}
              editMode={editMode}
              isDark={isDark}
              fieldErrors={fieldErrors}
              handleField={handleField}
            />
            
            {/* Account meta section remains here if needed */}
            <section className={`rounded-xl border p-6 ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${
                  isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Account</h3>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

UserProfile.displayName = 'UserProfile';
export default UserProfile;