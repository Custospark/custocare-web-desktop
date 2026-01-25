import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { UserPlus, AlertCircle, CheckCircle, Copy, Download, X, Info, UserCheck, Search, ChevronDown } from 'lucide-react';
import type { AxiosError } from 'axios';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  CreatePatientRequest,
  PatientSearchResult,
  PatientCreateResponse,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import {
  BiologicalSex,
  validatePatientFormData,
  isPatientCreateConflictResponse,
  isPossibleDuplicateResponse,
  isExistingUserResponse,
  isPatientCreateSuccessResponse,
  isNewPatientCreatedResponse,
  DuplicateAction,
  ExistingUserAction,
  formatPatientName,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { useCreatePatientByStaff } from '../../../../api/dispensing/patient-search/usePatientQueries';

// Import country codes
import { type CountryCode, countryCodes } from '../../../../../administration/onboarding/ui/auth/countryCodes';

type Theme = 'light' | 'dark';

export interface PatientCreateProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  initialValues?: Partial<CreatePatientRequest>;
  onSuccess?: (patient: PatientSearchResult) => void | Promise<void>;
  onProceed?: (patient: PatientSearchResult) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

// Utility function to extract error messages with proper type safety
function errorToMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  
  if (typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const apiMsg = axiosErr.response?.data?.message;
    
    if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) {
      return apiMsg;
    }
    
    const validationErrors = axiosErr.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstError = Array.isArray(validationErrors[firstErrorKey]) 
        ? validationErrors[firstErrorKey][0]
        : undefined;
      
      if (firstError && typeof firstError === 'string') {
        return firstError;
      }
    }
    
    if (axiosErr.response?.status === 409) {
      return 'A patient or user with similar information already exists.';
    }
    
    if (axiosErr.response?.status === 422) {
      return 'Please check your input and try again.';
    }
    
    if (axiosErr.response?.status === 500) {
      return 'Server error occurred. Please try again.';
    }
  }
  
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  
  return 'Failed to create patient. Please try again.';
}

interface PatientSuccessModalProps {
  theme: Theme;
  patientNumber: string;
  patientName: string;
  onProceed?: () => void;
  onClose?: () => void;
  isNewPatient?: boolean;
}

const PatientSuccessModal: React.FC<PatientSuccessModalProps> = ({ 
  theme, 
  patientNumber, 
  patientName, 
  onProceed,
  onClose,
  isNewPatient = true
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (!patientNumber) {
        showToast('error', 'No patient number to copy', 3000);
        return;
      }

      await navigator.clipboard.writeText(patientNumber);
      setCopied(true);
      showToast('success', 'Patient number copied to clipboard', 3000);
      
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = patientNumber;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (success) {
          setCopied(true);
          showToast('success', 'Patient number copied to clipboard', 3000);
          
          if (copyTimerRef.current !== null) {
            window.clearTimeout(copyTimerRef.current);
          }
          copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
        } else {
          showToast('error', 'Failed to copy patient number', 3000);
        }
      } catch (fallbackErr) {
        console.error(fallbackErr);
        showToast('error', 'Failed to copy patient number', 3000);
      }
    }
  }, [patientNumber, showToast]);

  const handleDownload = useCallback(() => {
    try {
      const content = `Patient Name: ${patientName}\nPatient Number: ${patientNumber}\nGenerated: ${new Date().toLocaleString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Patient_${patientNumber}_${Date.now()}.txt`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('success', 'Patient details downloaded', 3000);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to download patient details', 3000);
    }
  }, [patientName, patientNumber, showToast]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  const handleProceedClick = useCallback(() => {
    if (onProceed) {
      onProceed();
    }
  }, [onProceed]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-success-modal-title"
    >
      <div className={cn('relative w-full max-w-md rounded-2xl shadow-2xl', isDark ? 'bg-gray-800' : 'bg-white')}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer',
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            )}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center p-8">
          <div 
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4',
              isNewPatient 
                ? (isDark ? 'bg-green-900/30' : 'bg-green-100')
                : (isDark ? 'bg-blue-900/30' : 'bg-blue-100')
            )}
            role="img"
            aria-label={isNewPatient ? "Success" : "Information"}
          >
            {isNewPatient ? (
              <CheckCircle className={cn('w-12 h-12', isDark ? 'text-green-400' : 'text-green-600')} />
            ) : (
              <UserCheck className={cn('w-12 h-12', isDark ? 'text-blue-400' : 'text-blue-600')} />
            )}
          </div>

          <h2 
            id="patient-success-modal-title"
            className={cn('text-2xl font-bold mb-2 text-center', isDark ? 'text-white' : 'text-gray-900')}
          >
            {isNewPatient ? 'Patient Created Successfully' : 'Patient Record Found'}
          </h2>
          <p className={cn('text-center mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {isNewPatient 
              ? 'The patient record has been successfully created in the system.' 
              : 'An existing patient record has been found and linked.'}
          </p>

          <div className={cn(
            'w-full rounded-xl border p-6 mb-6', 
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          )}>
            <div className="text-center mb-4">
              <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Patient Name
              </div>
              <div 
                className={cn('text-lg font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}
                title={patientName}
              >
                {patientName}
              </div>
            </div>

            <div className="text-center">
              <div className={cn('text-sm font-medium mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Patient Number
              </div>
              <div
                className={cn(
                  'font-mono text-sm p-4 rounded-lg break-all select-text cursor-text',
                  isDark 
                    ? 'bg-gray-800 text-blue-300 border border-gray-700' 
                    : 'bg-white text-blue-600 border border-gray-300'
                )}
                role="textbox"
                aria-label="Patient number"
              >
                {patientNumber}
              </div>
            </div>

            {!isNewPatient && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={cn('text-sm text-center', isDark ? 'text-blue-300' : 'text-blue-600')}>
                  <Info className="w-4 h-4 inline mr-1" />
                  Existing patient record linked successfully
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!patientNumber}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                  copied
                    ? isDark
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
                aria-label={copied ? 'Copied to clipboard' : 'Copy patient number to clipboard'}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!patientNumber}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
                aria-label="Download patient details"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>

            {onProceed && (
              <button
                type="button"
                onClick={handleProceedClick}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                aria-label="Continue with patient"
              >
                Continue
              </button>
            )}
          </div>

          <p className={cn('text-xs text-center mt-4', isDark ? 'text-gray-500' : 'text-gray-500')}>
            ⚠️ Important: Ensure the patient receives their patient number for future visits.
          </p>
        </div>
      </div>
    </div>
  );
};

PatientSuccessModal.displayName = 'PatientSuccessModal';

type ConflictType = 'duplicate' | 'existing_user' | null;

interface ConflictState {
  type: ConflictType;
  data: {
    duplicatePatient?: PatientSearchResult;
    existingUserGlobalId?: string;
  };
  originalData: CreatePatientRequest;
}

interface FormInputProps {
  theme: Theme;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
  touched?: boolean;
}

const FormInput = React.memo<FormInputProps>(({
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
}) => {
  const isDark = theme === 'dark';
  const inputId = React.useId();
  const hasError = !!error && touched;

  return (
    <div>
      <label 
        htmlFor={inputId}
        className={cn('block text-sm font-medium mb-1 cursor-pointer', isDark ? 'text-gray-300' : 'text-gray-700')}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors cursor-text',
          isDark 
            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
          hasError && (isDark ? 'border-red-500' : 'border-red-300')
        )}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
      />
      {hasError && (
        <p 
          id={`${inputId}-error`}
          className={cn('text-xs mt-1 flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-600')}
          role="alert"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

// Phone input with country code selector component
interface PhoneInputProps {
  theme: Theme;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  touched?: boolean;
  required?: boolean;
}

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
    // Default to Uganda (+256) for East Africa
    const defaultCountry = countryCodes.find(country => country.code === 'UG') || countryCodes[0];
    return defaultCountry;
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      // Reorder: East African countries first, then others
      const eastAfricanCountries = ['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'ET', 'ER', 'DJ', 'SO'];
      const eastAfrica = countryCodes.filter(country => eastAfricanCountries.includes(country.code));
      const otherCountries = countryCodes.filter(country => !eastAfricanCountries.includes(country.code));
      return [...eastAfrica, ...otherCountries];
    }
    
    const query = searchQuery.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(query) || 
      country.dial_code.includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Parse phone number with country code
  const parsePhoneNumber = useCallback((phoneValue: string): { countryCode: string; number: string } => {
    if (!phoneValue) return { countryCode: '', number: '' };
    
    // Check if phone already starts with a country code
    for (const country of countryCodes) {
      if (phoneValue.startsWith(country.dial_code)) {
        return {
          countryCode: country.dial_code,
          number: phoneValue.slice(country.dial_code.length)
        };
      }
    }
    
    // Default to selected country
    return {
      countryCode: selectedCountry.dial_code,
      number: phoneValue
    };
  }, [selectedCountry]);

  // Format display value
  const displayValue = useMemo(() => {
    const parsed = parsePhoneNumber(value);
    if (!parsed.number) return '';
    
    // Show formatted number if it already has a country code
    if (value.startsWith(parsed.countryCode)) {
      return parsed.number;
    }
    
    return value;
  }, [value, parsePhoneNumber]);

  const handlePhoneChange = useCallback((phoneNumber: string) => {
    // Remove any non-digit characters except leading +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it starts with a known country code, use that
    for (const country of countryCodes) {
      if (cleaned.startsWith(country.dial_code)) {
        setSelectedCountry(country);
        onChange(cleaned);
        return;
      }
    }
    
    // Otherwise, prepend selected country code
    const fullNumber = selectedCountry.dial_code + cleaned;
    onChange(fullNumber);
  }, [onChange, selectedCountry]);

  const handleCountrySelect = useCallback((country: CountryCode) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setSearchQuery('');
    
    // Update phone number with new country code
    const parsed = parsePhoneNumber(value);
    const newNumber = country.dial_code + parsed.number;
    onChange(newNumber);
  }, [value, onChange, parsePhoneNumber]);

  // Close dropdown on outside click
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
    <div>
      <label 
        htmlFor={inputId}
        className={cn('block text-sm font-medium mb-1 cursor-pointer', isDark ? 'text-gray-300' : 'text-gray-700')}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors min-w-[120px] cursor-pointer',
              isDark 
                ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' 
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
              hasError && (isDark ? 'border-red-500' : 'border-red-300')
            )}
            aria-label="Select country code"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dial_code}</span>
            <ChevronDown className={cn('w-4 h-4 ml-auto', showCountryDropdown ? 'rotate-180' : '')} />
          </button>
          
          {showCountryDropdown && (
            <div className={cn(
              'absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto rounded-lg border shadow-lg z-50',
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            )}>
              {/* Search input */}
              <div className="p-3 border-b border-gray-700 dark:border-gray-600">
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search country..."
                    className={cn(
                      'w-full pl-9 pr-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-text',
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                    )}
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Country list */}
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors cursor-pointer',
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-700',
                      selectedCountry.code === country.code && (isDark ? 'bg-gray-700' : 'bg-gray-100')
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    <span className={cn('font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {country.dial_code}
                    </span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className={cn('px-3 py-4 text-center text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Phone number input */}
        <div className="flex-1">
          <input
            id={inputId}
            type="tel"
            value={displayValue}
            onChange={(e) => handlePhoneChange(e.target.value)}
            disabled={disabled}
            placeholder="eg.78887..."
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors cursor-text',
              isDark 
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
              hasError && (isDark ? 'border-red-500' : 'border-red-300')
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
          />
        </div>
      </div>
      
      {/* Preview of full number */}
      {value && (
        <div className={cn('text-xs mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Full number: <span className="font-mono">{value}</span>
        </div>
      )}
      
      {hasError && (
        <p 
          id={`${inputId}-error`}
          className={cn('text-xs mt-1 flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-600')}
          role="alert"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

PhoneInputWithCountryCode.displayName = 'PhoneInputWithCountryCode';

const PatientCreate: React.FC<PatientCreateProps> = ({ 
  theme, 
  title = 'Create New Patient', 
  subtitle = 'Enter patient details to create a new record', 
  initialValues, 
  onSuccess, 
  onProceed,
  onCancel, 
  className 
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  
  const [form, setForm] = useState<Partial<CreatePatientRequest>>({
    first_name: initialValues?.first_name ?? '',
    last_name: initialValues?.last_name ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    date_of_birth: initialValues?.date_of_birth ?? '',
    biological_sex: initialValues?.biological_sex ?? BiologicalSex.UNKNOWN,
  });

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<PatientSearchResult | null>(null);
  const [isNewPatient, setIsNewPatient] = useState<boolean>(true);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  
  const lastSubmittedDataRef = useRef<CreatePatientRequest | null>(null);

  const validation = useMemo(() => validatePatientFormData(form), [form]);

  const mutateRef = useRef<((data: CreatePatientRequest) => void) | null>(null);

  const createMutation = useCreatePatientByStaff({
    onSuccess: async (response, variables) => {
      if (isPatientCreateSuccessResponse(response)) {
        // Handle both new patient creation and existing patient cases
        const isNew = isNewPatientCreatedResponse(response);
        const patient = response.data;
        
        setCreatedPatient(patient);
        setIsNewPatient(isNew);
        setShowSuccessModal(true);
        lastSubmittedDataRef.current = null;
        
        // Show appropriate toast based on whether it's new or existing
        if (isNew) {
          showToast('success', 'Patient created successfully', 3000);
        } else {
          showToast('info', 'Existing patient record found and linked', 3000);
        }
        
        // Call onSuccess callback when patient is created/found
        if (onSuccess) {
          onSuccess(patient);
        }
        
      } else if (isPatientCreateConflictResponse(response)) {
        // Handle conflict cases (duplicates or existing user)
        setConflict({
          type: isPossibleDuplicateResponse(response) ? 'duplicate' : 'existing_user',
          data: {
            duplicatePatient: response.meta.possible_duplicate ?? undefined,
            existingUserGlobalId: response.meta.existing_user_global_user_uuid,
          },
          originalData: variables,
        });
        
        // Attempt automatic resolution for conflicts
        const resolved = await handleConflictResolution(response, variables);
        if (!resolved) {
          setFormError(
            isPossibleDuplicateResponse(response) 
              ? 'Patient creation cancelled due to duplicate detection.' 
              : 'Patient creation cancelled due to existing user conflict.'
          );
        }
      }
    },
    onError: (error) => {
      const errorMessage = errorToMessage(error);
      setFormError(errorMessage);
      setConflict(null);
    },
  });

  useEffect(() => {
    mutateRef.current = createMutation.mutate;
  }, [createMutation.mutate]);

  const isSubmitting = createMutation.isPending;

  const handleConflictResolution = useCallback(async (
    response: PatientCreateResponse, 
    originalData: CreatePatientRequest
  ): Promise<boolean> => {
    if (!isPatientCreateConflictResponse(response)) return false;

    const { meta } = response;

    if (isPossibleDuplicateResponse(response) && meta.possible_duplicate) {
      const duplicate = meta.possible_duplicate;
      const ok = await confirm({
        title: 'Possible Duplicate Patient',
        message: `A similar patient already exists:\n\nName: ${duplicate.name}\nDOB: ${duplicate.date_of_birth}\nPatient Number: ${duplicate.patient_number}\n\nDo you want to create this patient anyway?`,
        confirmText: 'Yes, Create New Patient',
        cancelText: 'Cancel',
        variant: 'warning',
        theme,
      });

      if (ok && mutateRef.current) {
        const forceData: CreatePatientRequest = {
          ...originalData,
          action_on_possible_duplicate: DuplicateAction.ALLOW,
        };
        mutateRef.current(forceData);
        return true;
      }
    } else if (isExistingUserResponse(response)) {
      const ok = await confirm({
        title: 'User Already Exists',
        message: 'A user with this email/phone already exists in the system. Would you like to link this patient record to the existing user?',
        confirmText: 'Yes, Link to Existing User',
        cancelText: 'Cancel',
        variant: 'info',
        theme,
      });

      if (ok && mutateRef.current) {
        const forceData: CreatePatientRequest = {
          ...originalData,
          existing_user_action: ExistingUserAction.USE_EXISTING,
        };
        mutateRef.current(forceData);
        return true;
      }
    }

    return false;
  }, [confirm, theme]);

  const colors = useMemo(
    () => ({
      textPrimary: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      bg: isDark ? 'bg-gray-800' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-900' : 'bg-white',
      inputBorder: isDark ? 'border-gray-700' : 'border-gray-300',
      inputText: isDark ? 'text-white' : 'text-gray-900',
    }),
    [isDark]
  );

  const handleFieldChange = useCallback(<K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setTouchedFields(prev => new Set(prev).add(key));
    setFormError(null);
  }, []);

  const markAllFieldsTouched = useCallback(() => {
    setTouchedFields(new Set(['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'biological_sex']));
  }, []);

  const submit = useCallback(async () => {
    markAllFieldsTouched();
    
    const v = validatePatientFormData(form);
    if (!v.isValid) {
      const firstKey = Object.keys(v.errors)[0] as keyof typeof v.errors | undefined;
      const firstMsg = firstKey ? v.errors[firstKey]?.[0] : 'Please correct the form errors.';
      setFormError(firstMsg ?? 'Please correct the form errors.');
      
      setTimeout(() => {
        const firstErrorElement = document.querySelector('[aria-invalid="true"]');
        firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      return;
    }

    const ok = await confirm({
      title: 'Create Patient Record',
      message: 'Are you sure you want to create this patient record?',
      confirmText: 'Yes, Create',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!ok) return;

    setFormError(null);
    setConflict(null);

    const payload: CreatePatientRequest = {
      first_name: String(form.first_name ?? '').trim(),
      last_name: String(form.last_name ?? '').trim(),
      email: form.email?.trim() ? String(form.email).trim() : undefined,
      phone: form.phone?.trim() ? String(form.phone).trim() : undefined,
      date_of_birth: String(form.date_of_birth ?? '').trim(),
      biological_sex: form.biological_sex ?? BiologicalSex.UNKNOWN,
    };

    lastSubmittedDataRef.current = payload;
    createMutation.mutate(payload);
  }, [confirm, createMutation, form, markAllFieldsTouched, theme]);

  const handleSuccessModalProceed = useCallback(() => {
    if (createdPatient && onProceed) {
      onProceed(createdPatient);
    }
    setShowSuccessModal(false);
  }, [createdPatient, onProceed]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleRetryWithAction = useCallback((action: DuplicateAction | ExistingUserAction) => {
    if (!lastSubmittedDataRef.current) return;

    const retryData: CreatePatientRequest = {
      ...lastSubmittedDataRef.current,
      ...(action === DuplicateAction.ALLOW && { action_on_possible_duplicate: DuplicateAction.ALLOW }),
      ...(action === ExistingUserAction.USE_EXISTING && { existing_user_action: ExistingUserAction.USE_EXISTING }),
    };

    createMutation.mutate(retryData);
    setConflict(null);
  }, [createMutation]);

  const renderConflictUI = useMemo(() => {
    if (!conflict) return null;

    if (conflict.type === 'duplicate' && conflict.data.duplicatePatient) {
      const duplicate = conflict.data.duplicatePatient;
      return (
        <div className={cn('rounded-lg border p-4 mb-6', isDark ? 'bg-yellow-900/10 border-yellow-800' : 'bg-yellow-50 border-yellow-200')}>
          <div className="flex gap-3 items-start">
            <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0 cursor-default', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
            <div className="flex-1">
              <h4 className={cn('font-semibold mb-2', isDark ? 'text-yellow-300' : 'text-yellow-800')}>
                Possible Duplicate Found
              </h4>
              <p className={cn('text-sm mb-3', isDark ? 'text-yellow-400' : 'text-yellow-700')}>
                A similar patient already exists in the system:
              </p>
              <div className={cn('text-sm p-3 rounded-lg mb-3 cursor-default', isDark ? 'bg-gray-800/50' : 'bg-gray-100')}>
                <div><span className="font-medium">Name:</span> {duplicate.name}</div>
                <div><span className="font-medium">DOB:</span> {duplicate.date_of_birth}</div>
                <div><span className="font-medium">Patient Number:</span> {duplicate.patient_number}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRetryWithAction(DuplicateAction.ALLOW)}
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    isDark 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  )}
                >
                  Create Anyway
                </button>
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (conflict.type === 'existing_user') {
      return (
        <div className={cn('rounded-lg border p-4 mb-6', isDark ? 'bg-blue-900/10 border-blue-800' : 'bg-blue-50 border-blue-200')}>
          <div className="flex gap-3 items-start">
            <Info className={cn('w-5 h-5 mt-0.5 flex-shrink-0 cursor-default', isDark ? 'text-blue-400' : 'text-blue-600')} />
            <div className="flex-1">
              <h4 className={cn('font-semibold mb-2', isDark ? 'text-blue-300' : 'text-blue-800')}>
                Existing User Found
              </h4>
              <p className={cn('text-sm mb-3', isDark ? 'text-blue-400' : 'text-blue-700')}>
                A user with this email/phone already exists. Would you like to link this patient record to the existing user?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRetryWithAction(ExistingUserAction.USE_EXISTING)}
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  Link to Existing User
                </button>
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [conflict, isDark, isSubmitting, handleRetryWithAction]);

  const isFormValid = validation.isValid;

  return (
    <>
      <div className={cn('p-6', className)}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>{title}</h2>
            <p className={colors.textSecondary}>{subtitle}</p>
          </div>

          <div className={cn('rounded-xl border p-6', colors.bg, colors.border)}>
            {isSubmitting && (
              <div className="mb-6">
                <LoadingSkeleton variant="form" theme={theme} message="Creating patient..." />
              </div>
            )}

            {formError && (
              <div className={cn(
                'rounded-lg border p-4 mb-6 flex gap-3 items-start',
                isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'
              )}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0 cursor-default', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>
                  {formError}
                </div>
              </div>
            )}

            {createMutation.isError && !formError && (
              <div className={cn(
                'rounded-lg border p-4 mb-6 flex gap-3 items-start',
                isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'
              )}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0 cursor-default', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>
                  {errorToMessage(createMutation.error)}
                </div>
              </div>
            )}

            {renderConflictUI}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormInput
                theme={theme}
                label="First Name"
                value={form.first_name ?? ''}
                onChange={(value) => handleFieldChange('first_name', value)}
                error={validation.errors.first_name?.[0]}
                disabled={isSubmitting}
                required
                placeholder="Enter first name"
                touched={touchedFields.has('first_name')}
              />

              <FormInput
                theme={theme}
                label="Last Name"
                value={form.last_name ?? ''}
                onChange={(value) => handleFieldChange('last_name', value)}
                error={validation.errors.last_name?.[0]}
                disabled={isSubmitting}
                required
                placeholder="Enter last name"
                touched={touchedFields.has('last_name')}
              />

              <FormInput
                theme={theme}
                label="Email (Optional if phone provided)"
                value={form.email ?? ''}
                onChange={(value) => handleFieldChange('email', value)}
                error={validation.errors.email?.[0]}
                disabled={isSubmitting}
                type="email"
                placeholder="patient@example.com"
                touched={touchedFields.has('email')}
              />

              <PhoneInputWithCountryCode
                theme={theme}
                label="Phone (Optional if email provided)"
                value={form.phone ?? ''}
                onChange={(value) => handleFieldChange('phone', value)}
                disabled={isSubmitting}
                touched={touchedFields.has('phone')}
              />

              <FormInput
                theme={theme}
                label="Date of Birth"
                value={form.date_of_birth ?? ''}
                onChange={(value) => handleFieldChange('date_of_birth', value)}
                error={validation.errors.date_of_birth?.[0]}
                disabled={isSubmitting}
                type="date"
                required
                touched={touchedFields.has('date_of_birth')}
              />

              <div>
                <label className={cn('block text-sm font-medium mb-1 cursor-pointer', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Biological Sex *
                </label>
                <select
                  value={form.biological_sex ?? BiologicalSex.UNKNOWN}
                  onChange={(e) => handleFieldChange('biological_sex', e.target.value as BiologicalSex)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors cursor-pointer',
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900',
                    validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex') && (isDark ? 'border-red-500' : 'border-red-300')
                  )}
                  aria-invalid={!!validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex')}
                >
                  <option value={BiologicalSex.UNKNOWN}>Select biological sex</option>
                  <option value={BiologicalSex.MALE}>Male</option>
                  <option value={BiologicalSex.FEMALE}>Female</option>
                  <option value={BiologicalSex.INTERSEX}>Intersex</option>
                </select>
                {validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex') && (
                  <p className={cn('text-xs mt-1 flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-600')}>
                    <AlertCircle className="w-3 h-3" />
                    {validation.errors.biological_sex[0]}
                  </p>
                )}
              </div>
            </div>

            {validation.errors.contact?.[0] && touchedFields.has('email') && touchedFields.has('phone') && (
              <div className={cn('text-sm mb-4 flex items-center gap-1', isDark ? 'text-red-300' : 'text-red-600')}>
                <AlertCircle className="w-3 h-3 cursor-default" />
                {validation.errors.contact[0]}
              </div>
            )}

            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300'
                  )}
                  aria-label="Cancel patient creation"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={!isFormValid || isSubmitting || !!conflict}
                className={cn(
                  'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
                  'bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                )}
                aria-label={isSubmitting ? 'Creating patient...' : 'Create new patient'}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && createdPatient && (
        <PatientSuccessModal
          theme={theme}
          patientNumber={createdPatient.patient_number}
          patientName={formatPatientName(createdPatient)}
          onProceed={onProceed ? handleSuccessModalProceed : undefined}
          onClose={handleSuccessModalClose}
          isNewPatient={isNewPatient}
        />
      )}
    </>
  );
};

PatientCreate.displayName = 'PatientCreate';

export default PatientCreate;