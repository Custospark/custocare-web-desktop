/**
 * ============================================================================
 * PROFILE CONTACT INFORMATION COMPONENT
 * ============================================================================
 */

import React from 'react';
import { Phone, Mail, Lock, MapPin } from 'lucide-react';
import { type ProfileFormState } from './ProfileTypes';
import { FieldGroup, ViewRow, FieldError, SectionHeading } from './ProfileUIHelpers';

interface ProfileContactInfoProps {
  profile: any; // UserProfile
  form: ProfileFormState | null;
  editMode: boolean;
  isDark: boolean;
  fieldErrors: Record<string, string>;
  handleField: (key: keyof ProfileFormState, value: string) => void;
}

export const ProfileContactInfo: React.FC<ProfileContactInfoProps> = ({
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

  const parsePhone = (phone: string | null | undefined): string | null => {
    if (!phone) return null;
    return phone;
  };

  return (
    <section className={cardBase}>
      <SectionHeading icon={<Phone className="w-4 h-4" />} title="Contact Information" isDark={isDark} />

      <div className={`mt-4 ${divider}`}>
        {editMode && form ? (
          <div className="grid grid-cols-1 gap-4 pt-4">
            <FieldGroup label="Phone Number" isDark={isDark}>
              <input
                type="tel"
                maxLength={30}
                value={form.phone}
                onChange={(e) => handleField('phone', e.target.value)}
                className={inputBase}
                placeholder="+1 234 567 8900"
              />
              <p className={`text-xs mt-1 flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Lock className="w-3 h-3" />
                Encrypted at rest
              </p>
              {fieldErrors.phone && <FieldError msg={fieldErrors.phone} />}
            </FieldGroup>
          </div>
        ) : (
          <div className={`divide-y pt-2 ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
            <ViewRow label="Phone" value={parsePhone(profile.phone)} isDark={isDark} icon={<Phone className="w-4 h-4" />} />
            <ViewRow label="Display Name" value={profile.display_name} isDark={isDark} icon={<Mail className="w-4 h-4" />} />
          </div>
        )}
      </div>
    </section>
  );
};

interface ProfileAddressProps {
  profile: any; // UserProfile
  form: ProfileFormState | null;
  editMode: boolean;
  isDark: boolean;
  fieldErrors: Record<string, string>;
  handleField: (key: keyof ProfileFormState, value: string) => void;
}

export const ProfileAddress: React.FC<ProfileAddressProps> = ({
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

  const addressFields = [
    { key: 'address_line1' as const, label: 'Address Line 1', placeholder: '123 Main Street', max: 200 },
    { key: 'address_line2' as const, label: 'Address Line 2', placeholder: 'Apt 4B (optional)', max: 200 },
    { key: 'city' as const, label: 'City', placeholder: 'New York', max: 100 },
    { key: 'state' as const, label: 'State / Province', placeholder: 'NY', max: 100 },
    { key: 'country' as const, label: 'Country', placeholder: 'USA', max: 100 },
    { key: 'postal_code' as const, label: 'Postal Code', placeholder: '10001', max: 20 },
  ];

  const viewAddressFields = [
    { label: 'Line 1', value: profile.address_line1 },
    { label: 'Line 2', value: profile.address_line2 },
    { label: 'City', value: profile.city },
    { label: 'State', value: profile.state },
    { label: 'Country', value: profile.country },
    { label: 'Postal Code', value: profile.postal_code },
  ];

  return (
    <section className={cardBase}>
      <SectionHeading icon={<MapPin className="w-4 h-4" />} title="Address" isDark={isDark} />

      <div className={`mt-4 ${divider}`}>
        {editMode && form ? (
          <div className="space-y-3 pt-4">
            {addressFields.map(({ key, label, placeholder, max }) => (
              <FieldGroup key={key} label={label} isDark={isDark}>
                <input
                  type="text"
                  maxLength={max}
                  value={form[key]}
                  onChange={(e) => handleField(key, e.target.value)}
                  className={inputBase}
                  placeholder={placeholder}
                />
                {fieldErrors[key] && <FieldError msg={fieldErrors[key]} />}
              </FieldGroup>
            ))}
          </div>
        ) : (
          <div className={`divide-y pt-2 ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
            {viewAddressFields.map(({ label, value }) => (
              <ViewRow key={label} label={label} value={value} isDark={isDark} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};