/**
 * ============================================================================
 * PROFILE PERSONAL INFORMATION COMPONENT
 * ============================================================================
 */

import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { type ProfileFormState, Gender } from './ProfileTypes';
import { FieldGroup, ViewRow, FieldError, SectionHeading } from './ProfileUIHelpers';

interface ProfilePersonalInfoProps {
  profile: any; // UserProfile
  form: ProfileFormState | null;
  editMode: boolean;
  isDark: boolean;
  fieldErrors: Record<string, string>;
  handleField: (key: keyof ProfileFormState, value: string) => void;
}

const ProfilePersonalInfo: React.FC<ProfilePersonalInfoProps> = ({
  profile,
  form,
  editMode,
  isDark,
  fieldErrors,
  handleField,
}) => {
  const cardBase = `rounded-xl border p-6 ${
    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
  }`;
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;
  const inputBase = `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors
    focus:ring-2 ${
      isDark
        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

  return (
    <section className={cardBase}>
      <SectionHeading icon={<User className="w-4 h-4" />} title="Personal Information" isDark={isDark} />

      <div className={`mt-4 ${divider}`}>
        {editMode && form ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <FieldGroup label="First Name" isDark={isDark}>
              <input
                type="text"
                maxLength={100}
                value={form.first_name}
                onChange={(e) => handleField('first_name', e.target.value)}
                className={inputBase}
                placeholder="First name"
              />
              {fieldErrors.first_name && <FieldError msg={fieldErrors.first_name} />}
            </FieldGroup>

            <FieldGroup label="Last Name" isDark={isDark}>
              <input
                type="text"
                maxLength={100}
                value={form.last_name}
                onChange={(e) => handleField('last_name', e.target.value)}
                className={inputBase}
                placeholder="Last name"
              />
              {fieldErrors.last_name && <FieldError msg={fieldErrors.last_name} />}
            </FieldGroup>

            <FieldGroup label="Date of Birth" isDark={isDark}>
              <input
                type="date"
                value={form.dob}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleField('dob', e.target.value)}
                className={inputBase}
              />
              {fieldErrors.dob && <FieldError msg={fieldErrors.dob} />}
            </FieldGroup>

            <FieldGroup label="Gender" isDark={isDark}>
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={(e) => handleField('gender', e.target.value)}
                  className={`${inputBase} appearance-none pr-8`}
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
              {fieldErrors.gender && <FieldError msg={fieldErrors.gender} />}
            </FieldGroup>
          </div>
        ) : (
          <div className="divide-y divide-inherit pt-2">
            <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
              <ViewRow label="First Name" value={profile.first_name} isDark={isDark} />
              <ViewRow label="Last Name" value={profile.last_name} isDark={isDark} />
              <ViewRow
                label="Date of Birth"
                value={
                  profile.dob
                    ? new Date(profile.dob).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : null
                }
                isDark={isDark}
              />
              <ViewRow
                label="Gender"
                value={
                  profile.gender
                    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                    : null
                }
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfilePersonalInfo;