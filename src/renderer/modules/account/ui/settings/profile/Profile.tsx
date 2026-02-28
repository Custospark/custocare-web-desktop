/**
 * ============================================================================
 * USER PROFILE COMPONENT
 * ============================================================================
 *
 * Fetches and displays the authenticated user's profile while providing
 * a full in-place edit experience, including profile-photo upload with
 * live preview.
 *
 * Architecture
 * ─────────────
 *  • Theme is read directly from the Redux `ui` slice (dark / light).
 *  • All data-fetching is delegated to the hooks in ProfileQueries.ts.
 *  • `useQueryClient` cache invalidation is handled inside the hooks.
 *  • Loading states are covered by `<LoadingSkeleton variant="detail" />`.
 *  • Toast notifications are emitted by the query hooks; the component
 *    only needs to handle UI transitions (edit ↔ view mode).
 *
 * Props
 * ─────
 *  userId  – The numeric / string user-ID used in the API route
 *            `/{user}/profile`.  Typically sourced from your auth slice.
 *
 * @example
 * <UserProfile userId={authUser.id} />
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import {
  Camera,
  CheckCircle,
  ChevronDown,
  Edit3,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  X,
  XCircle,
} from 'lucide-react';

import { type RootState } from '../../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import {
  useGetUserProfile,
  useUpdateUserProfile,
  useUploadProfilePhoto,
} from '../../../api/settings/profile/ProfileQueries';
import {
  type UpdateUserProfileRequest,
  type UserProfile,
  Gender,
  parsePhone,
} from '../../../api/settings/profile/ProfileTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface UserProfileProps {
  /** Route param `{user}` – typically the logged-in user's numeric ID. */
  userId: number | string;
}

/** Local form state – mirrors UpdateUserProfileRequest plus a guard flag. */
type ProfileFormState = Required<
  Omit<UpdateUserProfileRequest, 'profile_photo_path'>
> & {
  profile_photo_path: string;
};

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

/** Derive a full avatar URL from a storage-relative path or a blob: URL. */
const resolvePhotoUrl = (path: string | null): string | null => {
  if (!path) return null;
  // Blob preview URLs come through as-is
  if (path.startsWith('blob:') || path.startsWith('http')) return path;
  // Adjust this base to match your Laravel storage URL
  const base = (import.meta as Record<string, unknown> & {
    env: Record<string, string>;
  }).env?.VITE_STORAGE_BASE_URL ?? '';
  return `${base}/storage/${path}`;
};

/** Map a UserProfile into a clean form state, hoisting the phone value. */
const profileToFormState = (p: UserProfile): ProfileFormState => ({
  first_name:          p.first_name        ?? '',
  last_name:           p.last_name         ?? '',
  display_name:        p.display_name      ?? '',
  title:               p.title             ?? '',
  dob:                 p.dob               ?? '',
  gender:              p.gender            ?? ('' as Gender),
  phone:               parsePhone(p.phone) ?? '',
  address_line1:       p.address_line1     ?? '',
  address_line2:       p.address_line2     ?? '',
  city:                p.city              ?? '',
  state:               p.state             ?? '',
  country:             p.country           ?? '',
  postal_code:         p.postal_code       ?? '',
  profile_photo_path:  p.profile_photo_path ?? '',
});

/** Convert the form state back to a diff-only update request. */
const buildUpdatePayload = (
  form: ProfileFormState,
  original: UserProfile,
): UpdateUserProfileRequest => {
  const payload: UpdateUserProfileRequest = {};

  const str = (
    key: keyof Omit<ProfileFormState, 'gender' | 'profile_photo_path'>,
    origKey: keyof UserProfile,
  ) => {
    const v = form[key] as string;
    if (v !== (original[origKey] ?? '')) payload[key] = v || null;
  };

  str('first_name',    'first_name');
  str('last_name',     'last_name');
  str('display_name',  'display_name');
  str('title',         'title');
  str('dob',           'dob');
  str('phone',         'phone');          // backend encrypts plain text
  str('address_line1', 'address_line1');
  str('address_line2', 'address_line2');
  str('city',          'city');
  str('state',         'state');
  str('country',       'country');
  str('postal_code',   'postal_code');

  const g = form.gender as string;
  if (g !== (original.gender ?? '')) {
    payload.gender = (g || null) as Gender | null;
  }

  return payload;
};

/* -------------------------------------------------------------------------- */
/*                        SUB-COMPONENTS (declared above parent)              */
/* -------------------------------------------------------------------------- */

/** ---------- Field wrapper ---------- */
const FieldGroup: React.FC<{
  label:    string;
  children: React.ReactNode;
  isDark:   boolean;
  fullWidth?: boolean;
}> = ({ label, children, isDark, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label
      className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      {label}
    </label>
    {children}
  </div>
);

/** ---------- Read-only value row ---------- */
const ViewRow: React.FC<{
  label:   string;
  value:   string | null | undefined;
  isDark:  boolean;
  icon?:   React.ReactNode;
}> = ({ label, value, isDark, icon }) => (
  <div className="flex items-start gap-3 py-2">
    {icon && (
      <span
        className={`mt-0.5 flex-shrink-0 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        {icon}
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p
        className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-medium break-words ${
          value
            ? isDark
              ? 'text-gray-100'
              : 'text-gray-900'
            : isDark
            ? 'text-gray-600'
            : 'text-gray-400'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  </div>
);

/* ─────── Shared input / select classes ─────── */
const inputBase = (isDark: boolean) =>
  `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors
   focus:ring-2 ${
     isDark
       ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
       : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
   }`;

/* -------------------------------------------------------------------------- */
/*                            SECTION COMPONENTS                              */
/* -------------------------------------------------------------------------- */

/** ── Photo Header ── */
const PhotoHeader: React.FC<{
  profile:     UserProfile;
  previewUrl:  string | null;
  isUploading: boolean;
  isEditing:   boolean;
  isDark:      boolean;
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
  const photoUrl = previewUrl ?? resolvePhotoUrl(profile.profile_photo_path);
  const initials = `${profile.first_name?.[0] ?? ''}${
    profile.last_name?.[0] ?? ''
  }`.toUpperCase();

  return (
    <div className="relative group w-28 h-28 shrink-0">
      {/* Avatar */}
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

      {/* Upload overlay – visible only in edit mode */}
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
                <svg
                  className="animate-spin w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
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

      {/* Subtle camera badge – visible always in edit mode */}
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

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  /* ── Theme from ui slice ───────────────────────────────────────────────── */
  const theme  = useSelector((state: RootState) => state.ui.theme);
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

  const { mutate: uploadPhoto, isPending: isUploading } =
    useUploadProfilePhoto();

  /* ── Local state ───────────────────────────────────────────────────────── */
  const [editMode,    setEditMode]    = useState(false);
  const [form,        setForm]        = useState<ProfileFormState | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profile      = profileResponse?.data ?? null;

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

  /** Client-side validation – mirrors the Laravel rules. */
  const validate = (f: ProfileFormState): boolean => {
    const errs: Record<string, string> = {};

    if (f.first_name   && f.first_name.length   > 100) errs.first_name   = 'Max 100 characters.';
    if (f.last_name    && f.last_name.length    > 100) errs.last_name    = 'Max 100 characters.';
    if (f.display_name && f.display_name.length > 150) errs.display_name = 'Max 150 characters.';
    if (f.title        && f.title.length        >  50) errs.title        = 'Max 50 characters.';
    if (f.phone        && f.phone.length        >  30) errs.phone        = 'Max 30 characters.';
    if (f.postal_code  && f.postal_code.length  >  20) errs.postal_code  = 'Max 20 characters.';

    if (f.dob) {
      const d = new Date(f.dob);
      if (isNaN(d.getTime()))       errs.dob = 'Invalid date.';
      else if (d >= new Date())     errs.dob = 'Date of birth must be a past date.';
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

    // Live preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload immediately; on success the cache is invalidated → profile refetches
    uploadPhoto(
      { userId, file },
      {
        onError: () => setPreviewUrl(null), // roll back preview on failure
      },
    );

    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  /* ── Derived values ────────────────────────────────────────────────────── */
  const cardBase = `rounded-xl border p-6 ${
    isDark
      ? 'bg-gray-900 border-gray-800'
      : 'bg-white border-gray-200 shadow-sm'
  }`;

  const divider = `border-t ${
    isDark ? 'border-gray-800' : 'border-gray-100'
  }`;

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  LOADING STATE                                                          */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (isLoading) {
    return (
      <LoadingSkeleton
        variant="detail"
        theme={theme}
        message="Loading your profile…"
      />
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  ERROR STATE                                                            */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (isError || !profile || !form) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}
      >
        <XCircle
          className={`w-16 h-16 ${
            isDark ? 'text-red-400' : 'text-red-500'
          }`}
        />
        <h2 className="text-xl font-bold">Failed to load profile</h2>
        <p
          className={`text-sm text-center max-w-md ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {fetchError?.response?.data?.message ??
            fetchError?.message ??
            'An unexpected error occurred. Please try refreshing the page.'}
        </p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  MAIN RENDER                                                            */
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p
              className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Manage your personal information and settings.
            </p>
          </div>

          {/* Edit / Save / Cancel controls */}
          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving || isUploading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50 ${
                    isDark
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                    isDark
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-blue-500 hover:bg-blue-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Hero Card (Avatar + display name + title) ────────────────────── */}
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
              {editMode ? (
                <div className="space-y-3">
                  {/* Display name */}
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Display Name
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={form.display_name}
                      onChange={(e) =>
                        handleField('display_name', e.target.value)
                      }
                      className={inputBase(isDark)}
                      placeholder="How should we address you?"
                    />
                    {fieldErrors.display_name && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors.display_name}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label
                      className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Job Title
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={form.title}
                      onChange={(e) => handleField('title', e.target.value)}
                      className={inputBase(isDark)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {fieldErrors.title && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors.title}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold truncate">
                    {profile.display_name}
                  </h2>
                  {profile.title && (
                    <p
                      className={`text-sm font-medium ${
                        isDark ? 'text-cyan-400' : 'text-blue-600'
                      }`}
                    >
                      {profile.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {profile.gender && (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          isDark
                            ? 'bg-gray-800 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {profile.gender}
                      </span>
                    )}
                    {profile.dob && (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          isDark
                            ? 'bg-gray-800 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {new Date(profile.dob).toLocaleDateString(undefined, {
                          year:  'numeric',
                          month: 'long',
                          day:   'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Always-visible success badge in view mode */}
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

        {/* ════════════════════════════════════════════════════════════════ */}
        {/*  CONTENT GRID  (2/3 main | 1/3 sidebar)                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left / main (2 cols) ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <section className={cardBase}>
              <SectionHeading
                icon={<User className="w-4 h-4" />}
                title="Personal Information"
                isDark={isDark}
              />

              <div className={`mt-4 ${divider}`}>
                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <FieldGroup label="First Name" isDark={isDark}>
                      <input
                        type="text"
                        maxLength={100}
                        value={form.first_name}
                        onChange={(e) =>
                          handleField('first_name', e.target.value)
                        }
                        className={inputBase(isDark)}
                        placeholder="First name"
                      />
                      {fieldErrors.first_name && (
                        <FieldError msg={fieldErrors.first_name} />
                      )}
                    </FieldGroup>

                    <FieldGroup label="Last Name" isDark={isDark}>
                      <input
                        type="text"
                        maxLength={100}
                        value={form.last_name}
                        onChange={(e) =>
                          handleField('last_name', e.target.value)
                        }
                        className={inputBase(isDark)}
                        placeholder="Last name"
                      />
                      {fieldErrors.last_name && (
                        <FieldError msg={fieldErrors.last_name} />
                      )}
                    </FieldGroup>

                    <FieldGroup label="Date of Birth" isDark={isDark}>
                      <input
                        type="date"
                        value={form.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleField('dob', e.target.value)}
                        className={inputBase(isDark)}
                      />
                      {fieldErrors.dob && (
                        <FieldError msg={fieldErrors.dob} />
                      )}
                    </FieldGroup>

                    <FieldGroup label="Gender" isDark={isDark}>
                      <div className="relative">
                        <select
                          value={form.gender}
                          onChange={(e) =>
                            handleField('gender', e.target.value)
                          }
                          className={`${inputBase(isDark)} appearance-none pr-8`}
                        >
                          <option value="">— Select —</option>
                          <option value={Gender.MALE}>Male</option>
                          <option value={Gender.FEMALE}>Female</option>
                          <option value={Gender.OTHER}>Other</option>
                        </select>
                        <ChevronDown
                          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        />
                      </div>
                      {fieldErrors.gender && (
                        <FieldError msg={fieldErrors.gender} />
                      )}
                    </FieldGroup>
                  </div>
                ) : (
                  <div className="divide-y divide-inherit pt-2">
                    <div
                      className={`divide-y ${
                        isDark ? 'divide-gray-800' : 'divide-gray-100'
                      }`}
                    >
                      <ViewRow
                        label="First Name"
                        value={profile.first_name}
                        isDark={isDark}
                      />
                      <ViewRow
                        label="Last Name"
                        value={profile.last_name}
                        isDark={isDark}
                      />
                      <ViewRow
                        label="Date of Birth"
                        value={
                          profile.dob
                            ? new Date(profile.dob).toLocaleDateString(
                                undefined,
                                {
                                  year:  'numeric',
                                  month: 'long',
                                  day:   'numeric',
                                },
                              )
                            : null
                        }
                        isDark={isDark}
                      />
                      <ViewRow
                        label="Gender"
                        value={
                          profile.gender
                            ? profile.gender.charAt(0).toUpperCase() +
                              profile.gender.slice(1)
                            : null
                        }
                        isDark={isDark}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Contact Information */}
            <section className={cardBase}>
              <SectionHeading
                icon={<Phone className="w-4 h-4" />}
                title="Contact Information"
                isDark={isDark}
              />

              <div className={`mt-4 ${divider}`}>
                {editMode ? (
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <FieldGroup label="Phone Number" isDark={isDark}>
                      <input
                        type="tel"
                        maxLength={30}
                        value={form.phone}
                        onChange={(e) => handleField('phone', e.target.value)}
                        className={inputBase(isDark)}
                        placeholder="+1 234 567 8900"
                      />
                      <p
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        Encrypted at rest
                      </p>
                      {fieldErrors.phone && (
                        <FieldError msg={fieldErrors.phone} />
                      )}
                    </FieldGroup>
                  </div>
                ) : (
                  <div
                    className={`divide-y pt-2 ${
                      isDark ? 'divide-gray-800' : 'divide-gray-100'
                    }`}
                  >
                    <ViewRow
                      label="Phone"
                      value={parsePhone(profile.phone)}
                      isDark={isDark}
                      icon={<Phone className="w-4 h-4" />}
                    />
                    <ViewRow
                      label="Display Name"
                      value={profile.display_name}
                      isDark={isDark}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Right / sidebar (1 col) ─────────────────────────────────── */}
          <div className="space-y-6">

            {/* Address */}
            <section className={cardBase}>
              <SectionHeading
                icon={<MapPin className="w-4 h-4" />}
                title="Address"
                isDark={isDark}
              />

              <div className={`mt-4 ${divider}`}>
                {editMode ? (
                  <div className="space-y-3 pt-4">
                    {(
                      [
                        {
                          key: 'address_line1' as const,
                          label: 'Address Line 1',
                          placeholder: '123 Main Street',
                          max: 200,
                        },
                        {
                          key: 'address_line2' as const,
                          label: 'Address Line 2',
                          placeholder: 'Apt 4B (optional)',
                          max: 200,
                        },
                        {
                          key: 'city' as const,
                          label: 'City',
                          placeholder: 'New York',
                          max: 100,
                        },
                        {
                          key: 'state' as const,
                          label: 'State / Province',
                          placeholder: 'NY',
                          max: 100,
                        },
                        {
                          key: 'country' as const,
                          label: 'Country',
                          placeholder: 'USA',
                          max: 100,
                        },
                        {
                          key: 'postal_code' as const,
                          label: 'Postal Code',
                          placeholder: '10001',
                          max: 20,
                        },
                      ] as const
                    ).map(({ key, label, placeholder, max }) => (
                      <FieldGroup key={key} label={label} isDark={isDark}>
                        <input
                          type="text"
                          maxLength={max}
                          value={form[key]}
                          onChange={(e) => handleField(key, e.target.value)}
                          className={inputBase(isDark)}
                          placeholder={placeholder}
                        />
                        {fieldErrors[key] && (
                          <FieldError msg={fieldErrors[key]} />
                        )}
                      </FieldGroup>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`divide-y pt-2 ${
                      isDark ? 'divide-gray-800' : 'divide-gray-100'
                    }`}
                  >
                    {[
                      {
                        label: 'Line 1',
                        value: profile.address_line1,
                      },
                      {
                        label: 'Line 2',
                        value: profile.address_line2,
                      },
                      { label: 'City',        value: profile.city },
                      { label: 'State',       value: profile.state },
                      { label: 'Country',     value: profile.country },
                      { label: 'Postal Code', value: profile.postal_code },
                    ].map(({ label, value }) => (
                      <ViewRow
                        key={label}
                        label={label}
                        value={value}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Account meta (read-only) */}
            <section className={cardBase}>
              <SectionHeading
                icon={<Lock className="w-4 h-4" />}
                title="Account"
                isDark={isDark}
              />
              <div
                className={`mt-4 divide-y pt-2 ${
                  isDark ? 'divide-gray-800' : 'divide-gray-100'
                }`}
              >
                <ViewRow
                  label="User ID"
                  value={String(profile.id)}
                  isDark={isDark}
                />
              </div>
            </section>
          </div>
        </div>
        {/* End content grid */}

      </div>
      {/* End container */}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       SMALL REUSABLE UI HELPERS                            */
/* -------------------------------------------------------------------------- */

const SectionHeading: React.FC<{
  icon:   React.ReactNode;
  title:  string;
  isDark: boolean;
}> = ({ icon, title, isDark }) => (
  <div className="flex items-center gap-2">
    <span
      className={`p-1.5 rounded-lg ${
        isDark
          ? 'bg-cyan-500/15 text-cyan-400'
          : 'bg-blue-50 text-blue-600'
      }`}
    >
      {icon}
    </span>
    <h3 className="text-sm font-semibold uppercase tracking-wider">
      {title}
    </h3>
  </div>
);

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <XCircle className="w-3 h-3 flex-shrink-0" />
    {msg}
  </p>
);

/* -------------------------------------------------------------------------- */

UserProfile.displayName = 'UserProfile';
export default UserProfile;
