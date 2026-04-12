import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Globe, Navigation,
  Search, X, ChevronDown, CheckCircle2, AlertCircle
} from 'lucide-react';

import type { FacilitySettingsFormState } from './FacilitySettingsHelpers';
import { Label, FieldError, InfoRow } from './FacilitySettingsSharedUI';
import { inputBase } from './styleHelpers';
import { countryCodes } from '../../../../onboarding/ui/auth/countryCodes';

/* ── Country select for address ───────────────────────────────────── */
const CountrySelect: React.FC<{
  isDark: boolean;
  value: string;
  onChange: (code: string) => void;
}> = ({ isDark, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? countryCodes.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      : countryCodes;
  }, [query]);

  const selected = countryCodes.find((c) => c.code === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-gray-100 hover:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
        }`}
      >
        {selected ? (
          <>
            <span className="text-base">{selected.flag}</span>
            <span className="flex-1 text-left">{selected.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              {selected.code}
            </span>
          </>
        ) : (
          <span className={`flex-1 text-left ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            — Select country —
          </span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border-2 shadow-xl overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {selected && (
              <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs border-b transition-colors ${
                  isDark ? 'border-gray-700 text-red-400 hover:bg-gray-700' : 'border-gray-100 text-red-500 hover:bg-red-50'
                }`}>
                <X className="w-3.5 h-3.5" /> Clear selection
              </button>
            )}
            {filtered.map((c) => (
              <button
                key={c.code} type="button"
                onClick={() => { onChange(c.code); setOpen(false); setQuery(''); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left ${
                  value === c.code
                    ? isDark ? 'bg-cyan-900/30 text-cyan-200' : 'bg-blue-50 text-blue-800'
                    : isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                {value === c.code && <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Phone country code selector (new component) ─────────────────── */
const PhoneCountrySelect: React.FC<{
  isDark: boolean;
  value: string;
  onChange: (dialCode: string) => void;
}> = ({ isDark, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return countryCodes;
    const q = search.toLowerCase();
    return countryCodes.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.code.toLowerCase().includes(q) ||
      c.dial_code.includes(q)
    );
  }, [search]);

  const selected = countryCodes.find(c => c.dial_code === value) || countryCodes.find(c => c.code === 'UG');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-gray-100 hover:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-base">{selected?.flag}</span>
          <span className="font-medium">{selected?.dial_code}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-72 mt-1 rounded-xl border-2 shadow-xl overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.dial_code); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${
                  value === c.dial_code
                    ? isDark ? 'bg-cyan-900/30 text-cyan-200' : 'bg-blue-50 text-blue-800'
                    : isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {c.dial_code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────── */
interface FacilityLocationContactCardProps {
  cardBase: string;
  isDark: boolean;
  editMode: boolean;
  form: FacilitySettingsFormState;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof FacilitySettingsFormState>(key: K, value: FacilitySettingsFormState[K]) => void;
}

const FacilityLocationContactCard: React.FC<FacilityLocationContactCardProps> = ({
  cardBase, isDark, editMode, form, fieldErrors, onField,
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [phoneCountryCode, setPhoneCountryCode] = useState('+256'); // Default to Uganda
  const [userEnteredPhone, setUserEnteredPhone] = useState('');

  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;
  const selectedCountry = countryCodes.find((c) => c.code === form.country_code);

  const formattedAddress = [
    form.address_line1, form.address_line2, form.city,
    form.state_province, form.postal_code,
    selectedCountry ? selectedCountry.name : form.country_code,
  ].filter(Boolean).join(', ') || '—';

  // Initialize userEnteredPhone from form.main_phone when component mounts or form changes
  useEffect(() => {
    if (form.main_phone && phoneCountryCode && form.main_phone.startsWith(phoneCountryCode)) {
      const withoutDialCode = form.main_phone.replace(phoneCountryCode, '');
      setUserEnteredPhone(withoutDialCode);
    } else if (!form.main_phone) {
      setUserEnteredPhone('');
    }
  }, [form.main_phone, phoneCountryCode]);

  // Phone validation (validates the user-entered number without dial code)
  const validatePhone = (phone: string) => {
    if (!phone) return { isValid: true, error: '' }; // Phone is optional
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 6) return { isValid: false, error: 'Phone number too short' };
    if (digitsOnly.length > 12) return { isValid: false, error: 'Phone number too long' };
    return { isValid: true, error: '' };
  };

  const phoneValidation = validatePhone(userEnteredPhone);

  // Handlers
  const handlePhoneCountrySelect = (dial_code: string) => {
    setPhoneCountryCode(dial_code);
    // Update the main_phone field with new dial code + existing user number (no space)
    if (userEnteredPhone) {
      const digitsOnly = userEnteredPhone.replace(/\D/g, '');
      const fullNumber = `${dial_code}${digitsOnly}`;
      onField('main_phone', fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setUserEnteredPhone(value);
    // Concatenate dial code with user-entered number (no space, digits only)
    const fullNumber = `${phoneCountryCode}${value}`;
    onField('main_phone', fullNumber);
    if (touched.phone) {
      setTouched(prev => ({ ...prev, phone: false }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Format display number for preview (with spaces for readability)
  const formatDisplayNumber = (digits: string) => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  return (
    <section className={cardBase}>
      {/* ── header ── */}
      <div className="flex items-center gap-2">
        <span className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}>
          <MapPin className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Location & Contact</h3>
      </div>

      <div className={`mt-4 ${divider}`}>

        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">

            {/* Address */}
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Street Address</Label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input className={inputBase(isDark, 'pl-9')} value={form.address_line1} maxLength={200}
                  onChange={(e) => onField('address_line1', e.target.value)} placeholder="Street / Plot number" />
              </div>
              {fieldErrors.address_line1 && <FieldError msg={fieldErrors.address_line1} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Address Line 2 (optional)</Label>
              <input className={inputBase(isDark)} value={form.address_line2} maxLength={200}
                onChange={(e) => onField('address_line2', e.target.value)} placeholder="Building, floor, suite…" />
            </div>

            <div>
              <Label isDark={isDark}>City</Label>
              <input className={inputBase(isDark)} value={form.city} maxLength={100}
                onChange={(e) => onField('city', e.target.value)} placeholder="e.g. Kampala" />
              {fieldErrors.city && <FieldError msg={fieldErrors.city} />}
            </div>

            <div>
              <Label isDark={isDark}>District / Province</Label>
              <input className={inputBase(isDark)} value={form.state_province} maxLength={100}
                onChange={(e) => onField('state_province', e.target.value)} placeholder="e.g. Central Region" />
              {fieldErrors.state_province && <FieldError msg={fieldErrors.state_province} />}
            </div>

            <div>
              <Label isDark={isDark}>Postal Code</Label>
              <input className={inputBase(isDark)} value={form.postal_code} maxLength={20}
                onChange={(e) => onField('postal_code', e.target.value)} placeholder="e.g. 256" />
              {fieldErrors.postal_code && <FieldError msg={fieldErrors.postal_code} />}
            </div>

            <div>
              <Label isDark={isDark}>Country</Label>
              <CountrySelect isDark={isDark} value={form.country_code}
                onChange={(code) => onField('country_code', code)} />
              {fieldErrors.country_code && <FieldError msg={fieldErrors.country_code} />}
            </div>

            {/* Coordinates */}
            <div>
              <Label isDark={isDark}>
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Latitude (optional)
                </span>
              </Label>
              <input className={inputBase(isDark)} value={form.latitude}
                onChange={(e) => onField('latitude', e.target.value)}
                inputMode="decimal" placeholder="-90 to 90" />
              {fieldErrors.latitude && <FieldError msg={fieldErrors.latitude} />}
            </div>

            <div>
              <Label isDark={isDark}>
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Longitude (optional)
                </span>
              </Label>
              <input className={inputBase(isDark)} value={form.longitude}
                onChange={(e) => onField('longitude', e.target.value)}
                inputMode="decimal" placeholder="-180 to 180" />
              {fieldErrors.longitude && <FieldError msg={fieldErrors.longitude} />}
            </div>

            {/* Contact divider */}
            <div className={`sm:col-span-2 flex items-center gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Contact Information
              </span>
            </div>

            {/* Phone with country code */}
            <div className="sm:col-span-2">
              <Label isDark={isDark}>Main Phone</Label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative shrink-0 w-36">
                  <PhoneCountrySelect 
                    isDark={isDark} 
                    value={phoneCountryCode}
                    onChange={handlePhoneCountrySelect}
                  />
                </div>

                {/* Phone Input */}
                <div className="relative flex-1">
                  <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="tel"
                    value={userEnteredPhone}
                    onChange={handlePhoneChange}
                    onBlur={handleBlur('phone')}
                    placeholder="e.g., 712345678"
                    className={`${inputBase(isDark, 'pl-9')} ${
                      touched.phone && !phoneValidation.isValid && userEnteredPhone
                        ? isDark ? 'border-red-500' : 'border-red-400'
                        : phoneValidation.isValid && userEnteredPhone
                          ? isDark ? 'border-emerald-500' : 'border-emerald-400'
                          : ''
                    }`}
                  />
                  {phoneValidation.isValid && userEnteredPhone && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Show full number with country code (formatted for display only) */}
              {userEnteredPhone && (
                <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Full number: <span className="font-mono text-cyan-600 dark:text-cyan-400">
                    {phoneCountryCode} {formatDisplayNumber(userEnteredPhone)}
                  </span>
                </p>
              )}

              {/* Validation Error */}
              {touched.phone && !phoneValidation.isValid && userEnteredPhone && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneValidation.error}
                </p>
              )}
            </div>

            {/* Emergency Phone (keeping original for now) */}
            <div>
              <Label isDark={isDark}>Emergency Phone (optional)</Label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input className={inputBase(isDark, 'pl-9')} value={form.emergency_phone} maxLength={50}
                  onChange={(e) => onField('emergency_phone', e.target.value)} placeholder="+256800000000" />
              </div>
              {fieldErrors.emergency_phone && <FieldError msg={fieldErrors.emergency_phone} />}
            </div>

            <div>
              <Label isDark={isDark}>Fax (optional)</Label>
              <input className={inputBase(isDark)} value={form.fax} maxLength={50}
                onChange={(e) => onField('fax', e.target.value)} placeholder="Fax number" />
              {fieldErrors.fax && <FieldError msg={fieldErrors.fax} />}
            </div>

            <div>
              <Label isDark={isDark}>Email (optional)</Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input className={inputBase(isDark, 'pl-9')} value={form.email} maxLength={200} type="email"
                  onChange={(e) => onField('email', e.target.value)} placeholder="info@facility.org" />
              </div>
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
            </div>

            <div className="sm:col-span-2">
              <Label isDark={isDark}>Website (optional)</Label>
              <div className="relative">
                <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input className={inputBase(isDark, 'pl-9')} value={form.website} maxLength={255}
                  onChange={(e) => onField('website', e.target.value)} placeholder="https://www.facility.org" />
              </div>
              {fieldErrors.website && <FieldError msg={fieldErrors.website} />}
            </div>
          </div>

        ) : (
          /* ── view mode ── */
          <div className="pt-4 space-y-0.5">
            <InfoRow isDark={isDark} label="Address" value={formattedAddress} />
            {(form.latitude && form.longitude) && (
              <InfoRow isDark={isDark} label="Coordinates"
                value={`${form.latitude}°, ${form.longitude}°`} />
            )}
            <div className={`border-t pt-3 mt-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {form.main_phone && (
                <InfoRow isDark={isDark} label="Main Phone"
                  value={<a href={`tel:${form.main_phone}`} className="hover:underline">{form.main_phone}</a>} />
              )}
              {form.emergency_phone && (
                <InfoRow isDark={isDark} label="Emergency"
                  value={<a href={`tel:${form.emergency_phone}`} className={`${isDark ? 'text-red-400' : 'text-red-600'} hover:underline font-semibold`}>{form.emergency_phone}</a>} />
              )}
              {form.fax && <InfoRow isDark={isDark} label="Fax" value={form.fax} />}
              {form.email && (
                <InfoRow isDark={isDark} label="Email"
                  value={<a href={`mailto:${form.email}`} className="hover:underline">{form.email}</a>} />
              )}
              {form.website && (
                <InfoRow isDark={isDark} label="Website"
                  value={
                    <a href={form.website} target="_blank" rel="noopener noreferrer"
                      className={`hover:underline ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      {form.website}
                    </a>
                  } />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FacilityLocationContactCard;