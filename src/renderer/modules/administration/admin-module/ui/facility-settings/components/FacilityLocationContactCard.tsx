import React, { useMemo } from 'react';
import { MapPin, Phone } from 'lucide-react';

import type { FacilitySettingsFormState, FacilitySettingsOnField } from '../FacilitySettings';

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1">{msg}</p>
);

const Label: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <label
    className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}
  >
    {children}
  </label>
);

const inputBase = (isDark: boolean) =>
  `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors focus:ring-2 ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

interface FacilityLocationContactCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: FacilitySettingsOnField;
}

const FacilityLocationContactCard: React.FC<FacilityLocationContactCardProps> = ({
  cardBase,
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
}) => {
  const divider = useMemo(() => `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`, [isDark]);

  return (
    <section className={cardBase}>
      <div className="flex items-center gap-2">
        <span
          className={`p-1.5 rounded-lg ${
            isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
          }`}
        >
          <MapPin className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Location & Contact</h3>
      </div>

      <div className={`mt-4 ${divider}`}>
        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Address Line 1</Label>
              <input
                className={inputBase(isDark)}
                value={form.address_line1}
                maxLength={200}
                onChange={(e) => onField('address_line1', e.target.value)}
              />
              {fieldErrors.address_line1 && <FieldError msg={fieldErrors.address_line1} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Address Line 2 (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.address_line2}
                maxLength={200}
                onChange={(e) => onField('address_line2', e.target.value)}
              />
              {fieldErrors.address_line2 && <FieldError msg={fieldErrors.address_line2} />}
            </div>

            <div>
              <Label isDark={isDark}>City</Label>
              <input
                className={inputBase(isDark)}
                value={form.city}
                maxLength={100}
                onChange={(e) => onField('city', e.target.value)}
              />
              {fieldErrors.city && <FieldError msg={fieldErrors.city} />}
            </div>

            <div>
              <Label isDark={isDark}>State / Province</Label>
              <input
                className={inputBase(isDark)}
                value={form.state_province}
                maxLength={100}
                onChange={(e) => onField('state_province', e.target.value)}
              />
              {fieldErrors.state_province && <FieldError msg={fieldErrors.state_province} />}
            </div>

            <div>
              <Label isDark={isDark}>Postal Code</Label>
              <input
                className={inputBase(isDark)}
                value={form.postal_code}
                maxLength={20}
                onChange={(e) => onField('postal_code', e.target.value)}
              />
              {fieldErrors.postal_code && <FieldError msg={fieldErrors.postal_code} />}
            </div>

            <div>
              <Label isDark={isDark}>Country Code (ISO2)</Label>
              <input
                className={inputBase(isDark)}
                value={form.country_code}
                maxLength={2}
                onChange={(e) => onField('country_code', e.target.value.toUpperCase())}
              />
              {fieldErrors.country_code && <FieldError msg={fieldErrors.country_code} />}
            </div>

            <div>
              <Label isDark={isDark}>Latitude (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.latitude}
                inputMode="decimal"
                placeholder="-90 .. 90"
                onChange={(e) => onField('latitude', e.target.value)}
              />
              {fieldErrors.latitude && <FieldError msg={fieldErrors.latitude} />}
            </div>

            <div>
              <Label isDark={isDark}>Longitude (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.longitude}
                inputMode="decimal"
                placeholder="-180 .. 180"
                onChange={(e) => onField('longitude', e.target.value)}
              />
              {fieldErrors.longitude && <FieldError msg={fieldErrors.longitude} />}
            </div>

            <div className="sm:col-span-2 mt-2 flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg ${
                  isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Phone className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-semibold uppercase tracking-wider">Contact Information</h4>
            </div>

            <div>
              <Label isDark={isDark}>Main Phone</Label>
              <input
                className={inputBase(isDark)}
                value={form.main_phone}
                maxLength={50}
                onChange={(e) => onField('main_phone', e.target.value)}
              />
              {fieldErrors.main_phone && <FieldError msg={fieldErrors.main_phone} />}
            </div>

            <div>
              <Label isDark={isDark}>Emergency Phone (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.emergency_phone}
                maxLength={50}
                onChange={(e) => onField('emergency_phone', e.target.value)}
              />
              {fieldErrors.emergency_phone && <FieldError msg={fieldErrors.emergency_phone} />}
            </div>

            <div>
              <Label isDark={isDark}>Fax (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.fax}
                maxLength={50}
                onChange={(e) => onField('fax', e.target.value)}
              />
              {fieldErrors.fax && <FieldError msg={fieldErrors.fax} />}
            </div>

            <div>
              <Label isDark={isDark}>Email (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.email}
                maxLength={200}
                onChange={(e) => onField('email', e.target.value)}
                placeholder="name@domain.com"
              />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Website (optional)</Label>
              <input
                className={inputBase(isDark)}
                value={form.website}
                maxLength={255}
                onChange={(e) => onField('website', e.target.value)}
                placeholder="https://example.com"
              />
              {fieldErrors.website && <FieldError msg={fieldErrors.website} />}
            </div>
          </div>
        ) : (
          <div className="pt-4 text-sm space-y-2">
            <div className={`${isDark ? 'text-gray-200' : 'text-gray-800'} space-y-1`}>
              <div>
                <span className="font-semibold">Address:</span>{' '}
                {[form.address_line1, form.address_line2, form.city, form.state_province, form.postal_code, form.country_code]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </div>
              <div>
                <span className="font-semibold">Coordinates:</span>{' '}
                {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : '—'}
              </div>
              <div>
                <span className="font-semibold">Main Phone:</span> {form.main_phone || '—'}
              </div>
              <div>
                <span className="font-semibold">Emergency Phone:</span> {form.emergency_phone || '—'}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {form.email || '—'}
              </div>
              <div>
                <span className="font-semibold">Website:</span> {form.website || '—'}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FacilityLocationContactCard;
