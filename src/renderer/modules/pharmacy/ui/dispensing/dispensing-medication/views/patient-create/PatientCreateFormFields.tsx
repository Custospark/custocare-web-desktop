import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Globe,
  Mail,
  Phone,
  Search,
  User,
  Users,
} from 'lucide-react';

import { cn } from '../../../../../../../shared/utils/classNameUtils';

import type {
  CreatePatientRequest,
  ValidationResult,
} from '../../../../../api/dispensing/patient-search/usePatientTypes';
import { BiologicalSex } from '../../../../../api/dispensing/patient-search/usePatientTypes';

import {
  type CountryCode,
  countryCodes,
} from '../../../../../../administration/onboarding/ui/auth/countryCodes';

interface FormInputProps {
  theme: 'light' | 'dark';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
  touched?: boolean;
  icon?: React.ReactNode;
}

interface PhoneInputProps {
  theme: 'light' | 'dark';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  touched?: boolean;
  required?: boolean;
}

export interface PatientCreateFormFieldsProps {
  theme: 'light' | 'dark';
  form: Partial<CreatePatientRequest>;
  validation: ValidationResult;
  touchedFields: Set<string>;
  isSubmitting: boolean;
  onFieldChange: <K extends keyof CreatePatientRequest>(
    key: K,
    value: CreatePatientRequest[K] | undefined
  ) => void;
}

const FormInput = React.memo<FormInputProps>(
  ({
    theme,
    label,
    value,
    onChange,
    error,
    disabled,
    type = 'text',
    required = false,
    placeholder,
    touched = false,
    icon,
  }) => {
    const isDark = theme === 'dark';
    const inputId = React.useId();
    const hasError = !!error && touched;

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <label
          htmlFor={inputId}
          className={cn(
            'mb-1.5 block text-sm font-medium',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <div className="group relative">
          {icon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
                hasError
                  ? 'text-red-500'
                  : isDark
                    ? 'text-gray-500 group-focus-within:text-blue-400'
                    : 'text-gray-400 group-focus-within:text-blue-500'
              )}
            >
              {icon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-xl border-2 py-2.5 text-sm outline-none transition-all duration-200',
              icon ? 'pl-10 pr-4' : 'px-4',
              isDark
                ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
              hasError &&
                (isDark
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500/10'),
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
          />
        </div>

        <AnimatePresence>
          {hasError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              id={`${inputId}-error`}
              className={cn(
                'mt-1.5 flex items-center gap-1 text-xs',
                isDark ? 'text-red-300' : 'text-red-600'
              )}
              role="alert"
            >
              <AlertCircle className="h-3 w-3" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

FormInput.displayName = 'FormInput';

const PhoneInputWithCountryCode: React.FC<PhoneInputProps> = ({
  theme,
  label,
  value,
  onChange,
  error,
  disabled,
  touched = false,
  required = false,
}) => {
  const isDark = theme === 'dark';
  const inputId = React.useId();
  const hasError = !!error && touched;

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => {
    return countryCodes.find((country) => country.code === 'UG') || countryCodes[0];
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      const eastAfricanCountries = ['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'ET', 'ER', 'DJ', 'SO'];
      const eastAfrica = countryCodes.filter((country) => eastAfricanCountries.includes(country.code));
      const otherCountries = countryCodes.filter((country) => !eastAfricanCountries.includes(country.code));
      return [...eastAfrica, ...otherCountries];
    }

    const query = searchQuery.toLowerCase();
    return countryCodes.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.dial_code.includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const parsePhoneNumber = useCallback(
    (phoneValue: string): { countryCode: string; number: string } => {
      if (!phoneValue) return { countryCode: '', number: '' };

      for (const country of countryCodes) {
        if (phoneValue.startsWith(country.dial_code)) {
          return {
            countryCode: country.dial_code,
            number: phoneValue.slice(country.dial_code.length),
          };
        }
      }

      return {
        countryCode: selectedCountry.dial_code,
        number: phoneValue,
      };
    },
    [selectedCountry]
  );

  const displayValue = useMemo(() => {
    const parsed = parsePhoneNumber(value);
    if (!parsed.number) return '';
    return value.startsWith(parsed.countryCode) ? parsed.number : value;
  }, [parsePhoneNumber, value]);

  const handlePhoneChange = useCallback(
    (phoneNumber: string) => {
      const cleaned = phoneNumber.replace(/[^\d+]/g, '');

      if (!cleaned) {
        onChange('');
        return;
      }

      for (const country of countryCodes) {
        if (cleaned.startsWith(country.dial_code)) {
          setSelectedCountry(country);
          onChange(cleaned);
          return;
        }
      }

      onChange(`${selectedCountry.dial_code}${cleaned}`);
    },
    [onChange, selectedCountry]
  );

  const handleCountrySelect = useCallback(
    (country: CountryCode) => {
      setSelectedCountry(country);
      setShowCountryDropdown(false);
      setSearchQuery('');

      const parsed = parsePhoneNumber(value);
      const newNumber = parsed.number ? `${country.dial_code}${parsed.number}` : '';
      onChange(newNumber);
    },
    [onChange, parsePhoneNumber, value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <label
        htmlFor={inputId}
        className={cn(
          'mb-1.5 block text-sm font-medium',
          isDark ? 'text-gray-300' : 'text-gray-700'
        )}
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:w-auto" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => setShowCountryDropdown((prev) => !prev)}
            disabled={disabled}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all duration-200 sm:min-w-[120px]',
              'focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50',
              isDark
                ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
                : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
              hasError &&
                (isDark
                  ? 'border-red-500 focus:ring-red-500/10'
                  : 'border-red-300 focus:ring-red-500/10')
            )}
            aria-label="Select country code"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dial_code}</span>
            <ChevronDown
              className={cn('ml-auto h-4 w-4 transition-transform duration-200', showCountryDropdown && 'rotate-180')}
            />
          </motion.button>

          <AnimatePresence>
            {showCountryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={cn(
                  'absolute left-0 top-full z-50 mt-1 max-h-96 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-2 shadow-2xl sm:w-80',
                  isDark
                    ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900'
                    : 'border-gray-200 bg-gradient-to-br from-white to-gray-50'
                )}
              >
                <div className={cn('border-b-2 p-3', isDark ? 'border-gray-700' : 'border-gray-200')}>
                  <div className="group relative">
                    <Search
                      className={cn(
                        'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
                        isDark
                          ? 'text-gray-400 group-focus-within:text-blue-400'
                          : 'text-gray-500 group-focus-within:text-blue-500'
                      )}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search country"
                      className={cn(
                        'w-full rounded-lg border-2 py-2 pl-9 pr-3 text-sm outline-none transition-all',
                        isDark
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                          : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                      )}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto py-1">
                  {filteredCountries.map((country) => (
                    <motion.button
                      key={country.code}
                      whileHover={{ x: 2 }}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                        isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100',
                        selectedCountry.code === country.code && (isDark ? 'bg-gray-700' : 'bg-gray-100')
                      )}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 text-left font-medium">{country.name}</span>
                      <span className={cn('font-mono text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {country.dial_code}
                      </span>
                    </motion.button>
                  ))}

                  {filteredCountries.length === 0 && (
                    <div className={cn('px-3 py-4 text-center text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      No countries found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="group relative flex-1">
          <Phone
            className={cn(
              'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors',
              hasError
                ? 'text-red-500'
                : isDark
                  ? 'text-gray-500 group-focus-within:text-blue-400'
                  : 'text-gray-400 group-focus-within:text-blue-500'
            )}
          />
          <input
            id={inputId}
            type="tel"
            value={displayValue}
            onChange={(e) => handlePhoneChange(e.target.value)}
            disabled={disabled}
            placeholder="e.g. 701234567"
            className={cn(
              'w-full rounded-xl border-2 py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200',
              isDark
                ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
              hasError &&
                (isDark
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500/10'),
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
          />
        </div>
      </div>

      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'mt-1.5 flex items-center gap-1 text-xs',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            <Globe className="h-3 w-3" />
            Full number: <span className="font-mono font-medium break-all">{value}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id={`${inputId}-error`}
            className={cn(
              'mt-1.5 flex items-center gap-1 text-xs',
              isDark ? 'text-red-300' : 'text-red-600'
            )}
            role="alert"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

PhoneInputWithCountryCode.displayName = 'PhoneInputWithCountryCode';

const PatientCreateFormFields: React.FC<PatientCreateFormFieldsProps> = ({
  theme,
  form,
  validation,
  touchedFields,
  isSubmitting,
  onFieldChange,
}) => {
  const isDark = theme === 'dark';
  const biologicalSexHasError =
    !!validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex');

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <FormInput
          theme={theme}
          label="First Name"
          value={form.first_name ?? ''}
          onChange={(value) => onFieldChange('first_name', value)}
          error={validation.errors.first_name?.[0]}
          disabled={isSubmitting}
          required
          placeholder="Enter first name"
          touched={touchedFields.has('first_name')}
          icon={<User className="h-4 w-4" />}
        />

        <FormInput
          theme={theme}
          label="Last Name"
          value={form.last_name ?? ''}
          onChange={(value) => onFieldChange('last_name', value)}
          error={validation.errors.last_name?.[0]}
          disabled={isSubmitting}
          required
          placeholder="Enter last name"
          touched={touchedFields.has('last_name')}
          icon={<User className="h-4 w-4" />}
        />

        <FormInput
          theme={theme}
          label="Email (optional if phone is provided)"
          value={form.email ?? ''}
          onChange={(value) => onFieldChange('email', value)}
          error={validation.errors.email?.[0]}
          disabled={isSubmitting}
          type="email"
          placeholder="patient@example.com"
          touched={touchedFields.has('email')}
          icon={<Mail className="h-4 w-4" />}
        />

        <PhoneInputWithCountryCode
          theme={theme}
          label="Phone (optional if email is provided)"
          value={form.phone ?? ''}
          onChange={(value) => onFieldChange('phone', value)}
          error={validation.errors.phone?.[0]}
          disabled={isSubmitting}
          touched={touchedFields.has('phone')}
        />

        <FormInput
          theme={theme}
          label="Date of Birth"
          value={form.date_of_birth ?? ''}
          onChange={(value) => onFieldChange('date_of_birth', value)}
          error={validation.errors.date_of_birth?.[0]}
          disabled={isSubmitting}
          type="date"
          required
          touched={touchedFields.has('date_of_birth')}
          icon={<Calendar className="h-4 w-4" />}
        />

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <label
            className={cn(
              'mb-1.5 block text-sm font-medium',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            Biological Sex <span className="text-red-500">*</span>
          </label>

          <div className="group relative">
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
                biologicalSexHasError
                  ? 'text-red-500'
                  : isDark
                    ? 'text-gray-500 group-focus-within:text-blue-400'
                    : 'text-gray-400 group-focus-within:text-blue-500'
              )}
            >
              <Users className="h-4 w-4" />
            </div>

            <select
              value={form.biological_sex ?? ''}
              onChange={(e) =>
                onFieldChange(
                  'biological_sex',
                  e.target.value ? (e.target.value as BiologicalSex) : undefined
                )
              }
              disabled={isSubmitting}
              className={cn(
                'w-full appearance-none rounded-xl border-2 py-2.5 pl-10 pr-10 text-sm outline-none transition-all duration-200',
                isDark
                  ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10',
                biologicalSexHasError &&
                  (isDark
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-red-300 focus:border-red-500 focus:ring-red-500/10'),
                isSubmitting && 'cursor-not-allowed opacity-50'
              )}
              aria-invalid={biologicalSexHasError}
            >
              <option value="">Select biological sex</option>
              <option value={BiologicalSex.MALE}>Male</option>
              <option value={BiologicalSex.FEMALE}>Female</option>
              <option value={BiologicalSex.INTERSEX}>Intersex</option>
            </select>

            <ChevronDown
              className={cn(
                'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}
            />
          </div>

          <AnimatePresence>
            {biologicalSexHasError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'mt-1.5 flex items-center gap-1 text-xs',
                  isDark ? 'text-red-300' : 'text-red-600'
                )}
              >
                <AlertCircle className="h-3 w-3" />
                {validation.errors.biological_sex?.[0]}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {validation.errors.contact?.[0] &&
          (touchedFields.has('email') || touchedFields.has('phone')) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'mb-5 flex items-start gap-2 rounded-xl p-3 text-sm',
                isDark ? 'bg-amber-900/20 text-amber-300' : 'bg-amber-50 text-amber-700'
              )}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{validation.errors.contact[0]}</span>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  );
};

PatientCreateFormFields.displayName = 'PatientCreateFormFields';

export default PatientCreateFormFields;
