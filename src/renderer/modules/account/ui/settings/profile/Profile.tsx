import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Camera,
  Save,
  X,
  Edit2,
  ChevronRight,
  Loader2,
  Home,
  Building,
  Map,
  Flag,
  Hash,
  Users,
} from 'lucide-react';
import { type RootState } from '../../../../../app/store/rootReducer';
import { useGetProfile, useUpdateProfile, useProfilePhotoUpload } from '../../../api/settings/profile/ProfileQueries';
import type { UserProfile, UpdateProfileRequest } from '../../../api/settings/profile/ProfileTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

/* -------------------------------------------------------------------------- */
/*                              TYPES & INTERFACES                            */
/* -------------------------------------------------------------------------- */

interface ProfileProps {
  userId?: number | string; // Optional, defaults to 'me'
}

interface ProfileFormData extends UpdateProfileRequest {
  // No additional fields needed, uses UpdateProfileRequest
  meta:string;
}

interface EditableFieldProps {
  label: string;
  value: string | null;
  fieldName: keyof UpdateProfileRequest;
  icon?: React.ReactNode;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  isEditing: boolean;
  formData: ProfileFormData;
  onChange: (field: keyof UpdateProfileRequest, value: any) => void;
  theme: 'dark' | 'light';
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                            UTILITY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

const formatDisplayValue = (value: string | null): string => {
  if (value === null || value === undefined || value === '') return '—';
  return value;
};

const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    return dateString; // API returns YYYY-MM-DD format
  } catch {
    return '';
  }
};

const formatDateForDisplay = (dateString: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const getGenderLabel = (gender: string | null): string => {
  if (!gender) return '—';
  const labels: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
  };
  return labels[gender] || gender;
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

/* -------------------------------------------------------------------------- */
/*                           EDITABLE FIELD COMPONENT                         */
/* -------------------------------------------------------------------------- */

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  fieldName,
  icon,
  type = 'text',
  options,
  placeholder,
  isEditing,
  formData,
  onChange,
  theme,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const fieldValue = formData[fieldName] !== undefined ? formData[fieldName] : value;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className={`text-xs font-medium flex items-center gap-1.5 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {icon}
        <span>{label}</span>
      </div>
      
      {isEditing ? (
        type === 'select' ? (
          <select
            value={fieldValue || ''}
            onChange={(e) => onChange(fieldName, e.target.value || null)}
            className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } border outline-none`}
          >
            <option value="">Select {label}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={fieldValue || ''}
            onChange={(e) => onChange(fieldName, e.target.value || null)}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } border outline-none`}
          />
        )
      ) : (
        <div className={`text-sm font-medium ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {type === 'date' 
            ? formatDateForDisplay(value)
            : type === 'select'
            ? getGenderLabel(value)
            : formatDisplayValue(value)}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           PROFILE PHOTO COMPONENT                          */
/* -------------------------------------------------------------------------- */

interface ProfilePhotoProps {
  photoPath: string | null;
  fullName: string;
  isEditing: boolean;
  onPhotoChange: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  theme: 'dark' | 'light';
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  photoPath,
  fullName,
  isEditing,
  onPhotoChange,
  isUploading,
  uploadProgress,
  theme,
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get the full URL for the profile photo
  const photoUrl = photoPath 
    ? `${import.meta.env.VITE_API_URL || ''}/storage/${photoPath}`
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Call parent handler
    onPhotoChange(file);
  };

  const handlePhotoClick = () => {
    if (isEditing && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || photoUrl;

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      <div
        onClick={handlePhotoClick}
        className={`relative w-24 h-24 rounded-xl overflow-hidden group cursor-${
          isEditing && !isUploading ? 'pointer' : 'default'
        } transition-all duration-200 ${
          isDark 
            ? 'bg-gray-800 border-2 border-gray-700' 
            : 'bg-gray-100 border-2 border-gray-200'
        }`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className={`w-10 h-10 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
          </div>
        )}

        {/* Upload overlay */}
        {isEditing && !isUploading && (
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 ${
            isDark ? 'bg-gray-900/70' : 'bg-black/50'
          }`}>
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
            <span className="text-xs text-white font-medium">{uploadProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           SECTION HEADER COMPONENT                         */
/* -------------------------------------------------------------------------- */

interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  theme: 'dark' | 'light';
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  theme,
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <div className={`p-1.5 rounded-lg ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        {icon}
      </div>
      <h3 className={`text-sm font-semibold uppercase tracking-wide ${
        isDark ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {title}
      </h3>
      <div className={`flex-1 h-px ml-2 ${
        isDark ? 'bg-gray-800' : 'bg-gray-200'
      }`} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                           MAIN PROFILE COMPONENT                           */
/* -------------------------------------------------------------------------- */

const Profile: React.FC<ProfileProps> = ({ userId = 60 }) => {
  // Get theme from Redux UI slice
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queries and mutations
  const { 
    data: profileData, 
    isLoading, 
    error,
    refetch 
  } = useGetProfile({ user: userId });

  const updateProfile = useUpdateProfile({
    onSuccess: () => {
      setIsEditing(false);
      setHasChanges(false);
      setFormData({});
    },
  });

  const uploadPhoto = useProfilePhotoUpload({
    onProgress: (percentage) => setUploadProgress(percentage),
    onSuccess: () => {
      setPhotoFile(null);
      setUploadProgress(0);
      // Refetch profile to get updated photo path
      refetch();
    },
  });

  // Set form data when profile loads
  useEffect(() => {
    if (profileData?.data) {
      setFormData(profileData.data);
    }
  }, [profileData]);

  // Track changes
  useEffect(() => {
    if (!profileData?.data || !isEditing) {
      setHasChanges(false);
      return;
    }

    const hasUnsavedChanges = Object.keys(formData).some((key) => {
      const fieldKey = key as keyof UpdateProfileRequest;
      return formData[fieldKey] !== profileData.data[fieldKey as keyof UserProfile];
    });

    setHasChanges(hasUnsavedChanges);
  }, [formData, profileData, isEditing]);

  // Handle form field changes
  const handleFieldChange = (field: keyof UpdateProfileRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle photo change
  const handlePhotoChange = (file: File) => {
    setPhotoFile(file);
    uploadPhoto.mutate({ 
      photo: file,
      onProgress: setUploadProgress,
    });
  };

  // Handle save
  const handleSave = () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    updateProfile.mutate({
      user: userId,
      data: formData,
    });
  };

  // Handle cancel
  const handleCancel = () => {
    if (profileData?.data) {
      setFormData(profileData.data);
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Handle error
  if (error) {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            isDark ? 'bg-red-500/20' : 'bg-red-100'
          }`}>
            <X className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Failed to Load Profile
          </h3>
          <p className={`text-sm mb-4 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {error.response?.data?.message || error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => refetch()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
            }`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading skeleton
  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading profile..." />;
  }

  const profile = profileData?.data;
  if (!profile) return null;

  const fullName = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

  const isPending = updateProfile.isPending || uploadPhoto.isPending;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDark ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <User className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Profile
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your personal information
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 disabled:opacity-50'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isPending}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isDark
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Profile Header with Photo */}
          <div className={`p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-start gap-6">
              <ProfilePhoto
                photoPath={profile.profile_photo_path}
                fullName={fullName}
                isEditing={isEditing}
                onPhotoChange={handlePhotoChange}
                isUploading={uploadPhoto.isPending}
                uploadProgress={uploadProgress}
                theme={theme}
              />

              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fullName}
                </h2>
                <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {profile.title || 'No title specified'}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    isDark
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    ID: {profile.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Personal Information */}
            <SectionHeader
              title="Personal Information"
              icon={<User className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />}
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <EditableField
                label="First Name"
                value={profile.first_name}
                fieldName="first_name"
                icon={<User className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="Last Name"
                value={profile.last_name}
                fieldName="last_name"
                icon={<User className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="Display Name"
                value={profile.display_name}
                fieldName="display_name"
                icon={<Users className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
                className="md:col-span-2"
              />

              <EditableField
                label="Professional Title"
                value={profile.title}
                fieldName="title"
                icon={<Briefcase className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
                placeholder="e.g., Senior Software Engineer"
              />

              <EditableField
                label="Date of Birth"
                value={profile.dob}
                fieldName="dob"
                icon={<Calendar className="w-3.5 h-3.5" />}
                type="date"
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="Gender"
                value={profile.gender}
                fieldName="gender"
                icon={<Users className="w-3.5 h-3.5" />}
                type="select"
                options={GENDER_OPTIONS}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />
            </div>

            {/* Contact Information */}
            <SectionHeader
              title="Contact Information"
              icon={<Phone className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />}
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <EditableField
                label="Phone Number"
                value={profile.phone}
                fieldName="phone"
                icon={<Phone className="w-3.5 h-3.5" />}
                type="tel"
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
                placeholder="+1234567890"
              />
            </div>

            {/* Address Information */}
            <SectionHeader
              title="Address"
              icon={<MapPin className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />}
              theme={theme}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField
                label="Address Line 1"
                value={profile.address_line1}
                fieldName="address_line1"
                icon={<Home className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
                placeholder="Street address"
              />

              <EditableField
                label="Address Line 2"
                value={profile.address_line2}
                fieldName="address_line2"
                icon={<Building className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
                placeholder="Apt, suite, etc."
              />

              <EditableField
                label="City"
                value={profile.city}
                fieldName="city"
                icon={<Building className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="State/Province"
                value={profile.state}
                fieldName="state"
                icon={<Map className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="Country"
                value={profile.country}
                fieldName="country"
                icon={<Flag className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />

              <EditableField
                label="Postal Code"
                value={profile.postal_code}
                fieldName="postal_code"
                icon={<Hash className="w-3.5 h-3.5" />}
                isEditing={isEditing}
                formData={formData}
                onChange={handleFieldChange}
                theme={theme}
              />
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t text-xs ${
            isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center gap-2">
              <span>Profile last updated: {new Date().toLocaleString()}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;