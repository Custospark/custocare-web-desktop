/**
 * International phone input with dial-code picker (same pattern as SignUp / patient create).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, Globe, Phone, Search } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import {
  type CountryCode,
  countryCodes,
} from '../../../modules/administration/onboarding/ui/auth/countryCodes';
import { normalizePhoneInput, stripPhoneDigits } from '../../utils/phoneNumber';

export interface PhoneInputWithCountryCodeProps {
  theme: 'light' | 'dark';
  value: string;
  onChange: (fullNumber: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Compact single-line layout for compose recipient rows. */
  compact?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showPreview?: boolean;
  /** When true, disables browser autofill on the tel input (compose recipients). */
  disableBrowserAutocomplete?: boolean;
}

export const PhoneInputWithCountryCode: React.FC<PhoneInputWithCountryCodeProps> = ({
  theme,
  value,
  onChange,
  label,
  error,
  disabled = false,
  touched = false,
  required = false,
  placeholder = 'e.g. 701234567',
  compact = false,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  showPreview = !compact,
  disableBrowserAutocomplete = false,
}) => {
  const isDark = theme === 'dark';
  const inputId = React.useId();
  const hasError = !!error && touched;

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const defaultCountry =
    countryCodes.find((country) => country.code === 'UG') ?? countryCodes[0];

  /** User-picked dial code when `value` is empty or has no recognizable prefix. */
  const [dialCountryOverride, setDialCountryOverride] = useState<CountryCode | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const findCountryForValue = useCallback((phoneValue: string): CountryCode | null => {
    if (!phoneValue) return null;
    const sorted = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length);
    for (const country of sorted) {
      if (phoneValue.startsWith(country.dial_code)) return country;
    }
    return null;
  }, []);

  const activeCountry = useMemo(() => {
    return findCountryForValue(value) ?? dialCountryOverride ?? defaultCountry;
  }, [value, dialCountryOverride, defaultCountry, findCountryForValue]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      const eastAfricanCountries = ['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'ET', 'ER', 'DJ', 'SO'];
      const eastAfrica = countryCodes.filter((c) => eastAfricanCountries.includes(c.code));
      const otherCountries = countryCodes.filter((c) => !eastAfricanCountries.includes(c.code));
      return [...eastAfrica, ...otherCountries];
    }

    const query = searchQuery.toLowerCase();
    return countryCodes.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.dial_code.includes(query) ||
        country.code.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const parsePhoneNumber = useCallback(
    (phoneValue: string): { countryCode: string; number: string } => {
      if (!phoneValue) return { countryCode: '', number: '' };

      const sorted = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length);
      for (const country of sorted) {
        if (phoneValue.startsWith(country.dial_code)) {
          return {
            countryCode: country.dial_code,
            number: phoneValue.slice(country.dial_code.length),
          };
        }
      }

      return {
        countryCode: activeCountry.dial_code,
        number: phoneValue,
      };
    },
    [activeCountry],
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

      const sorted = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length);
      for (const country of sorted) {
        if (cleaned.startsWith(country.dial_code)) {
          setDialCountryOverride(country);
          onChange(normalizePhoneInput(cleaned));
          return;
        }
      }

      onChange(normalizePhoneInput(`${activeCountry.dial_code}${stripPhoneDigits(cleaned)}`));
    },
    [onChange, activeCountry],
  );

  const handleCountrySelect = useCallback(
    (country: CountryCode) => {
      setDialCountryOverride(country);
      setShowCountryDropdown(false);
      setSearchQuery('');

      const parsed = parsePhoneNumber(value);
      const newNumber = parsed.number
        ? normalizePhoneInput(`${country.dial_code}${stripPhoneDigits(parsed.number)}`)
        : '';
      onChange(newNumber);
    },
    [onChange, parsePhoneNumber, value],
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

  const countryButtonClass = cn(
    'flex items-center gap-1.5 rounded-lg border-2 transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50',
    compact ? 'px-2 py-1 text-xs' : 'px-3 py-2.5',
    isDark
      ? 'border-gray-700 bg-gray-800 text-white hover:border-gray-600'
      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400',
    hasError && (isDark ? 'border-red-500' : 'border-red-300'),
  );

  const telInputClass = cn(
    'w-full rounded-lg border-2 outline-none transition-all duration-200',
    compact ? 'py-1 pl-8 pr-2 text-sm' : 'py-2.5 pl-10 pr-4 text-sm',
    isDark
      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500',
    hasError && (isDark ? 'border-red-500' : 'border-red-300'),
    disabled && 'cursor-not-allowed opacity-50',
  );

  return (
    <div className={cn('min-w-0 flex-1', className)}>
      {label && !compact && (
        <label
          htmlFor={inputId}
          className={cn('mb-1.5 block text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className={cn('flex gap-2', compact ? 'items-center' : 'flex-col sm:flex-row')}>
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCountryDropdown((prev) => !prev)}
            disabled={disabled}
            className={countryButtonClass}
            aria-label="Select country code"
          >
            <span className={compact ? 'text-base' : 'text-lg'}>{activeCountry.flag}</span>
            <span className="font-medium font-mono">{activeCountry.dial_code}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                showCountryDropdown && 'rotate-180',
                compact && 'ml-0.5',
              )}
            />
          </button>

          <AnimatePresence>
            {showCountryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn(
                  'absolute left-0 top-full z-[60] mt-1 max-h-80 w-72 overflow-hidden rounded-xl border-2 shadow-xl',
                  isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white',
                )}
              >
                <div className={cn('border-b p-2', isDark ? 'border-gray-700' : 'border-gray-200')}>
                  <div className="relative">
                    <Search
                      className={cn(
                        'absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
                        isDark ? 'text-gray-400' : 'text-gray-500',
                      )}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search country"
                      className={cn(
                        'w-full rounded-lg border py-1.5 pl-8 pr-2 text-xs outline-none',
                        isDark
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-gray-50 text-gray-900',
                      )}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100',
                        activeCountry.code === country.code && (isDark ? 'bg-gray-700' : 'bg-gray-100'),
                      )}
                    >
                      <span>{country.flag}</span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className={cn('font-mono text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {country.dial_code}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative min-w-0 flex-1">
          <Phone
            className={cn(
              'absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
              hasError ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          />
          <input
            id={inputId}
            type="tel"
            value={displayValue}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={telInputClass}
            aria-invalid={hasError ? true : undefined}
            autoComplete={disableBrowserAutocomplete ? 'off' : undefined}
            autoCorrect={disableBrowserAutocomplete ? 'off' : undefined}
            spellCheck={disableBrowserAutocomplete ? false : undefined}
            data-form-type={disableBrowserAutocomplete ? 'other' : undefined}
            data-lpignore={disableBrowserAutocomplete ? 'true' : undefined}
            data-1p-ignore={disableBrowserAutocomplete ? 'true' : undefined}
          />
        </div>
      </div>

      {showPreview && value && (
        <p className={cn('mt-1 flex items-center gap-1 text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
          <Globe className="h-3 w-3 shrink-0" />
          <span className="font-mono break-all">{value}</span>
        </p>
      )}

      {hasError && (
        <p className={cn('mt-1 flex items-center gap-1 text-xs', isDark ? 'text-red-300' : 'text-red-600')}>
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInputWithCountryCode;
