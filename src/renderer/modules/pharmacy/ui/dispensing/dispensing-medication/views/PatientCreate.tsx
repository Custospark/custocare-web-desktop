import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Fingerprint,
  Globe,
  Info,
  Mail,
  Phone,
  Search,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  ContactMatchField,
  CreatePatientRequest,
  PatientConflictCode,
  PatientSearchResult,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import {
  BiologicalSex,
  formatPatientName,
  isNewPatientCreatedResponse,
  isPatientCreateConflictResponse,
  isPatientCreateSuccessResponse,
  isPossibleDuplicateResponse,
  validatePatientFormData,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { useCreatePatientByAdmin } from '../../../../api/dispensing/patient-search/usePatientQueries';

import {
  type CountryCode,
  countryCodes,
} from '../../../../../administration/onboarding/ui/auth/countryCodes';

// TODO: update this import path to your real route file
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

type Theme = 'light' | 'dark';
type ConflictType = 'duplicate' | 'existing_user' | null;

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

interface ConflictState {
  type: ConflictType;
  originalData: CreatePatientRequest;
  data: {
    duplicatePatient?: PatientSearchResult;
    existingPatient?: PatientSearchResult;
    existingUserGlobalId?: string;
    matchedContactFields?: ContactMatchField[];
    matchedFields?: string[];
    demographicMatch?: boolean;
    conflictCode?: PatientConflictCode | null;
  };
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
  icon?: React.ReactNode;
}

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

interface PatientSuccessModalProps {
  theme: Theme;
  patientNumber: string;
  patientName: string;
  onProceed?: () => void;
  onClose?: () => void;
  isNewPatient?: boolean;
}

const INITIAL_FORM_STATE: Partial<CreatePatientRequest> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  biological_sex: undefined,
};

function getSafeTrimmedValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function formatDisplayValue(value?: string | null): string {
  return value && value.trim().length > 0 ? value : 'Not provided';
}

function buildSuggestedSearchText(form: Partial<CreatePatientRequest>): string {
  return [
    getSafeTrimmedValue(form.first_name),
    getSafeTrimmedValue(form.last_name),
    getSafeTrimmedValue(form.phone),
    getSafeTrimmedValue(form.email),
    getSafeTrimmedValue(form.date_of_birth),
  ]
    .filter(Boolean)
    .join(' ');
}

function errorToMessage(error: unknown): string {
  if (!error) return 'Something went wrong while saving this patient. Please try again.';

  if (typeof error === 'object' && error && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const apiMsg = axiosErr.response?.data?.message;

    if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) {
      return apiMsg;
    }

    const validationErrors = axiosErr.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstError = firstErrorKey
        ? validationErrors[firstErrorKey]?.[0]
        : undefined;

      if (typeof firstError === 'string' && firstError.trim().length > 0) {
        return firstError;
      }
    }

    if (axiosErr.response?.status === 409) {
      return 'We found another record that may already belong to this patient. Please review it before creating a new record.';
    }

    if (axiosErr.response?.status === 422) {
      return 'Please check the patient details and try again.';
    }

    if (axiosErr.response?.status === 500) {
      return 'We could not save this patient right now. Please try again in a moment.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'We could not save this patient right now. Please try again.';
}

function getConflictHeadline(type: ConflictType): string {
  if (type === 'duplicate') return 'We found a similar patient record';
  if (type === 'existing_user') return 'This phone number or email is already be in use';
  return 'Please review this information';
}

function getConflictDescription(conflict: ConflictState): string {
  if (conflict.type === 'duplicate') {
    return 'Before creating a new patient, please review the similar record below. This helps prevent duplicate patient records.';
  }

  if (conflict.type === 'existing_user') {
    if (conflict.data.conflictCode === 'IDENTITY_MISMATCH') {
      return 'The phone number or email entered is already linked to another person. Please review the record below before continuing.';
    }

    return 'The phone number or email entered matches an existing record. Please review it before creating a new patient.';
  }

  return 'Please review the information below before continuing.';
}

function getConflictGuidance(conflict: ConflictState): string[] {
  if (conflict.type === 'duplicate') {
    return [
      'Check whether the patient shown below is the same person.',
      'If it is the same person, open patient search and use the existing record.',
      'If it is not the same person, keep editing and correct the details before trying again.',
    ];
  }

  if (conflict.data.conflictCode === 'IDENTITY_MISMATCH') {
    return [
      'Check the phone number and email carefully.',
      'Open patient search to review the existing record.',
      'If needed, go back and correct the details before trying again.',
    ];
  }

  return [
    'Review the matching details below.',
    'Open patient search if you want to use an existing record.',
    'Or keep editing to update the information you entered.',
  ];
}

function formatMatchedContactFields(fields?: ContactMatchField[]): string {
  if (!fields || fields.length === 0) return 'Not specified';

  return fields
    .map((field) => (field === 'email' ? 'Email' : 'Phone'))
    .join(', ');
}

const PatientSuccessModal: React.FC<PatientSuccessModalProps> = ({
  theme,
  patientNumber,
  patientName,
  onProceed,
  onClose,
  isNewPatient = true,
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
      showToast('success', 'Patient number copied', 3000);

      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = patientNumber;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          setCopied(true);
          showToast('success', 'Patient number copied', 3000);

          if (copyTimerRef.current !== null) {
            window.clearTimeout(copyTimerRef.current);
          }

          copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
        } else {
          showToast('error', 'Could not copy patient number', 3000);
        }
      } catch {
        showToast('error', 'Could not copy patient number', 3000);
      }
    }
  }, [patientNumber, showToast]);

  const handleDownload = useCallback(() => {
    try {
      const content = [
        `Patient Name: ${patientName}`,
        `Patient Number: ${patientNumber}`,
        `Saved: ${new Date().toLocaleString()}`,
      ].join('\n');

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
    } catch {
      showToast('error', 'Could not download patient details', 3000);
    }
  }, [patientName, patientNumber, showToast]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-success-modal-title"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'relative w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 shadow-2xl sm:max-w-lg',
          isDark
            ? 'border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900'
            : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/50'
        )}
      >
        <div
          className={cn(
            'absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl opacity-30',
            isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
          )}
        />

        {onClose && (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onClose}
            className={cn(
              'absolute right-4 top-4 z-10 rounded-full p-2 transition-colors',
              isDark
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            )}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}

        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: 'spring' }}
              className={cn(
                'mb-4 flex h-18 w-18 items-center justify-center rounded-2xl border-2 sm:h-20 sm:w-20',
                isNewPatient
                  ? isDark
                    ? 'border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/20'
                    : 'border-green-300 bg-gradient-to-br from-green-100 to-green-200'
                  : isDark
                    ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                    : 'border-blue-300 bg-gradient-to-br from-blue-100 to-blue-200'
              )}
            >
              {isNewPatient ? (
                <CheckCircle className={cn('h-9 w-9 sm:h-10 sm:w-10', isDark ? 'text-green-400' : 'text-green-600')} />
              ) : (
                <UserCheck className={cn('h-9 w-9 sm:h-10 sm:w-10', isDark ? 'text-blue-400' : 'text-blue-600')} />
              )}
            </motion.div>

            <motion.h2
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.16 }}
              id="patient-success-modal-title"
              className={cn(
                'mb-2 text-center text-xl font-bold sm:text-2xl',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
              {isNewPatient ? 'Patient saved successfully' : 'Existing patient record found'}
            </motion.h2>

            <motion.p
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'mb-6 text-center text-sm sm:text-base',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {isNewPatient
                ? 'The patient record has been saved.'
                : 'A matching patient record was found and selected.'}
            </motion.p>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.24 }}
              className={cn(
                'relative mb-6 w-full overflow-hidden rounded-xl border-2 p-4 sm:p-6',
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800'
                  : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'
              )}
            >
              <div
                className={cn(
                  'absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20',
                  isDark ? 'bg-blue-500' : 'bg-blue-400'
                )}
              />

              <div className="relative">
                <div className="mb-4 text-center">
                  <div
                    className={cn(
                      'mb-1 flex items-center justify-center gap-1 text-sm font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    <User className="h-4 w-4" />
                    Patient Name
                  </div>
                  <div
                    className={cn(
                      'break-words text-base font-semibold sm:text-lg',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                    title={patientName}
                  >
                    {patientName}
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'mb-2 flex items-center justify-center gap-1 text-sm font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    <Fingerprint className="h-4 w-4" />
                    Patient Number
                  </div>

                  <div
                    className={cn(
                      'cursor-text select-text break-all rounded-lg border-2 p-4 font-mono text-xs transition-all sm:text-sm',
                      isDark
                        ? 'border-blue-500/30 bg-gray-800 text-blue-300 hover:border-blue-500/50'
                        : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300'
                    )}
                  >
                    {patientNumber}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="w-full space-y-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleCopy}
                  disabled={!patientNumber}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                    copied
                      ? isDark
                        ? 'border-green-500/30 bg-gradient-to-br from-green-600/20 to-green-700/20 text-green-300'
                        : 'border-green-300 bg-gradient-to-br from-green-50 to-green-100 text-green-700'
                      : isDark
                        ? 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200 hover:border-gray-500'
                        : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:border-gray-400'
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleDownload}
                  disabled={!patientNumber}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                    isDark
                      ? 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200 hover:border-gray-500'
                      : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:border-gray-400'
                  )}
                >
                  <Download className="h-5 w-5" />
                  Download
                </motion.button>
              </div>

              {onProceed && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={onProceed}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 font-medium transition-all',
                    isDark
                      ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                      : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                  )}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34 }}
              className={cn(
                'mt-4 flex items-center gap-1 text-center text-xs',
                isDark ? 'text-gray-500' : 'text-gray-500'
              )}
            >
              <Shield className="h-3 w-3" />
              Please share the patient number with the patient for future visits.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

PatientSuccessModal.displayName = 'PatientSuccessModal';

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

const PatientCreate: React.FC<PatientCreateProps> = ({
  theme,
  title = 'Create New Patient',
  subtitle = 'Enter patient details to create a new record',
  initialValues,
  onSuccess,
  onProceed,
  onCancel,
  className,
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [form, setForm] = useState<Partial<CreatePatientRequest>>({
    ...INITIAL_FORM_STATE,
    ...initialValues,
  });

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [createdPatient, setCreatedPatient] = useState<PatientSearchResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(true);

  const validation = useMemo(() => validatePatientFormData(form), [form]);

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      ...initialValues,
    });
    setTouchedFields(new Set());
    setFormError(null);
    setConflict(null);
  }, [initialValues]);

  const handleGoToPatientSearch = useCallback(() => {
    navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH, {
      state: {
        fromPatientCreate: true,
        suggestedSearch: buildSuggestedSearchText(form),
        draftPatient: {
          first_name: getSafeTrimmedValue(form.first_name),
          last_name: getSafeTrimmedValue(form.last_name),
          email: getSafeTrimmedValue(form.email),
          phone: getSafeTrimmedValue(form.phone),
          date_of_birth: getSafeTrimmedValue(form.date_of_birth),
          biological_sex: form.biological_sex,
        },
      },
    });
  }, [form, navigate]);

  const handleDismissConflict = useCallback(() => {
    setConflict(null);
    setFormError(null);
  }, []);

  const createMutation = useCreatePatientByAdmin({
    onSuccess: async (response, variables) => {
      setFormError(null);

      if (isPatientCreateConflictResponse(response)) {
        setCreatedPatient(null);
        setShowSuccessModal(false);
        setIsNewPatient(true);

        setConflict({
          type: isPossibleDuplicateResponse(response) ? 'duplicate' : 'existing_user',
          originalData: variables,
          data: {
            duplicatePatient: response.meta.possible_duplicate ?? undefined,
            existingPatient: response.meta.existing_patient ?? undefined,
            existingUserGlobalId: response.meta.existing_user_global_user_uuid ?? undefined,
            matchedContactFields: response.meta.matched_contact_fields,
            matchedFields: response.meta.matched_fields,
            demographicMatch: response.meta.demographic_match,
            conflictCode: response.meta.conflict_code ?? null,
          },
        });

        return;
      }

      if (!isPatientCreateSuccessResponse(response)) {
        setFormError('We received an unexpected response while creating this patient.');
        return;
      }

      const patient = response.data;
      const createdFresh = isNewPatientCreatedResponse(response);

      setConflict(null);
      setCreatedPatient(patient);
      setIsNewPatient(createdFresh);
      setShowSuccessModal(true);

      if (onSuccess) {
        await onSuccess(patient);
      }
    },
    onError: (error) => {
      setFormError(errorToMessage(error));
      setConflict(null);
    },
  });

  const isSubmitting = createMutation.isPending;

  const handleFieldChange = useCallback(
    <K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K] | undefined) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouchedFields((prev) => new Set(prev).add(String(key)));
      setFormError(null);
      setConflict(null);
    },
    []
  );

  const markAllFieldsTouched = useCallback(() => {
    setTouchedFields(
      new Set([
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'biological_sex',
      ])
    );
  }, []);

  const buildPayload = useCallback((): CreatePatientRequest => {
    return {
      first_name: getSafeTrimmedValue(form.first_name),
      last_name: getSafeTrimmedValue(form.last_name),
      email: getSafeTrimmedValue(form.email) || undefined,
      phone: getSafeTrimmedValue(form.phone) || undefined,
      date_of_birth: getSafeTrimmedValue(form.date_of_birth),
      biological_sex: form.biological_sex as BiologicalSex,
    };
  }, [form]);

  const submit = useCallback(async () => {
    markAllFieldsTouched();

    const currentValidation = validatePatientFormData(form);
    if (!currentValidation.isValid) {
      const firstKey = Object.keys(currentValidation.errors)[0] as keyof typeof currentValidation.errors | undefined;
      const firstMessage = firstKey ? currentValidation.errors[firstKey]?.[0] : undefined;

      setFormError(firstMessage ?? 'Please review the patient details and try again.');

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
    createMutation.mutate(buildPayload());
  }, [buildPayload, confirm, createMutation, form, markAllFieldsTouched, theme]);

  const handleSuccessModalProceed = useCallback(async () => {
    if (createdPatient && onProceed) {
      await onProceed(createdPatient);
    }
    setShowSuccessModal(false);
  }, [createdPatient, onProceed]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    resetForm();
  }, [resetForm]);

  const renderConflictCard = useMemo(() => {
    if (!conflict) return null;

    const reviewPatient = conflict.data.duplicatePatient ?? conflict.data.existingPatient;
    const matchedContacts = formatMatchedContactFields(conflict.data.matchedContactFields);
    const steps = getConflictGuidance(conflict);

    const cardClasses =
      conflict.type === 'duplicate'
        ? isDark
          ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10'
          : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'
        : isDark
          ? 'border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10'
          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50';

    const iconClasses =
      conflict.type === 'duplicate'
        ? isDark
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-yellow-100 text-yellow-700'
        : isDark
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-blue-100 text-blue-700';

    return (
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className={cn('relative mb-6 overflow-hidden rounded-2xl border-2 p-4 sm:p-5', cardClasses)}
      >
        <div
          className={cn(
            'absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl opacity-25',
            conflict.type === 'duplicate'
              ? isDark
                ? 'bg-yellow-500/20'
                : 'bg-yellow-400/20'
              : isDark
                ? 'bg-blue-500/20'
                : 'bg-blue-400/20'
          )}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className={cn('w-fit rounded-2xl p-3', iconClasses)}>
            {conflict.type === 'duplicate' ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <Shield className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className={cn('text-lg font-semibold sm:text-xl', isDark ? 'text-white' : 'text-gray-900')}>
              {getConflictHeadline(conflict.type)}
            </h4>

            <p className={cn('mt-2 text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
              {getConflictDescription(conflict)}
            </p>

            <div
              className={cn(
                'mt-4 rounded-xl border p-4',
                isDark ? 'border-gray-700 bg-gray-900/40' : 'border-white/70 bg-white/80'
              )}
            >
              <div className="flex items-start gap-2">
                <Info className={cn('mt-0.5 h-4 w-4 flex-shrink-0', isDark ? 'text-blue-300' : 'text-blue-600')} />
                <div className={cn('text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  <span className="font-semibold">What you can do now:</span>
                  <ul className="mt-2 space-y-1.5">
                    {steps.map((step) => (
                      <li key={step} className="flex gap-2">
                        <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div
                className={cn(
                  'rounded-xl border-2 p-4',
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
                )}
              >
                <div className={cn('mb-3 text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                  New Record
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Name</span>
                    <span className={cn('text-right font-medium break-words', isDark ? 'text-gray-100' : 'text-gray-900')}>
                      {formatDisplayValue(`${form.first_name ?? ''} ${form.last_name ?? ''}`.trim())}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Date of birth</span>
                    <span className={cn('text-right font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>
                      {formatDisplayValue(form.date_of_birth)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Biological sex</span>
                    <span className={cn('text-right font-medium capitalize', isDark ? 'text-gray-100' : 'text-gray-900')}>
                      {formatDisplayValue(form.biological_sex)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Email</span>
                    <span className={cn('text-right font-medium break-all', isDark ? 'text-gray-100' : 'text-gray-900')}>
                      {formatDisplayValue(form.email)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Phone</span>
                    <span className={cn('text-right font-medium break-all', isDark ? 'text-gray-100' : 'text-gray-900')}>
                      {formatDisplayValue(form.phone)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  'rounded-xl border-2 p-4',
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
                )}
              >
                <div className={cn('mb-3 text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                  Existing Record
                </div>

                {reviewPatient ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Name</span>
                      <span className={cn('text-right font-medium break-words', isDark ? 'text-gray-100' : 'text-gray-900')}>
                        {formatDisplayValue(reviewPatient.name)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Date of birth</span>
                      <span className={cn('text-right font-medium', isDark ? 'text-gray-100' : 'text-gray-900')}>
                        {formatDisplayValue(reviewPatient.date_of_birth)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Biological sex</span>
                      <span className={cn('text-right font-medium capitalize', isDark ? 'text-gray-100' : 'text-gray-900')}>
                        {formatDisplayValue(reviewPatient.biological_sex)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Patient number</span>
                      <span
                        className={cn(
                          'rounded-lg px-2 py-1 text-right font-mono text-xs sm:text-sm',
                          isDark ? 'bg-gray-700 text-blue-300' : 'bg-blue-50 text-blue-700'
                        )}
                      >
                        {reviewPatient.patient_number}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className={cn('shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>Status</span>
                      <span className={cn('text-right font-medium capitalize', isDark ? 'text-gray-100' : 'text-gray-900')}>
                        {formatDisplayValue(reviewPatient.status)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={cn('text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    We found matching contact information in another record.
                    {matchedContacts !== 'Not specified' && (
                      <div className="mt-2">
                        Matching details: <span className="font-medium">{matchedContacts}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {matchedContacts !== 'Not specified' && (
              <div
                className={cn(
                  'mt-4 rounded-xl px-4 py-3 text-sm',
                  isDark ? 'bg-blue-950/30 text-blue-200' : 'bg-blue-50 text-blue-700'
                )}
              >
                Matching details found: <span className="font-semibold">{matchedContacts}</span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleGoToPatientSearch}
                disabled={isSubmitting}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1',
                  isDark
                    ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                    : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                )}
              >
                <Search className="h-4 w-4" />
                Open patient search
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={handleDismissConflict}
                disabled={isSubmitting}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1',
                  isDark
                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600'
                    : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200'
                )}
              >
                Keep editing
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }, [conflict, form, handleDismissConflict, handleGoToPatientSearch, isDark, isSubmitting]);

  const isFormValid = validation.isValid;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('w-full', className)}>
        <div className="mx-auto w-full space-y-6 px-0 sm:px-2 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
              isDark
                ? 'border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-blue-500/50'
                : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/50 hover:border-blue-400'
            )}
          >
            <div
              className={cn(
                'absolute right-0 top-0 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-100',
                isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
              )}
            />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:items-center">
                <div
                  className={cn(
                    'rounded-2xl p-3 transition-all duration-300',
                    isDark
                      ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                      : 'bg-blue-100 group-hover:bg-blue-200'
                  )}
                >
                  <UserPlus className={cn('h-6 w-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>

                <div className="min-w-0">
                  <h1 className={cn('text-xl font-bold sm:text-2xl', isDark ? 'text-white' : 'text-gray-900')}>
                    {title}
                  </h1>
                  <p className={cn('mt-1 text-sm sm:text-base', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    {subtitle}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
              isDark
                ? 'border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-gray-600'
                : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-gray-300'
            )}
          >
            <div className="p-4 sm:p-6">
              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div
                      className={cn(
                        'rounded-xl border-2 px-4 py-3',
                        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                      )}
                    >
                      <LoadingSkeleton variant="default" theme={theme} message="Creating patient record..." />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className={cn(
                      'relative mb-6 overflow-hidden rounded-xl border-2 p-4',
                      isDark
                        ? 'border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10'
                        : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-30',
                        isDark ? 'bg-red-500/20' : 'bg-red-500/10'
                      )}
                    />

                    <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-lg p-2', isDark ? 'bg-red-500/20' : 'bg-red-100')}>
                          <AlertCircle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
                        </div>

                        <div className="flex-1">
                          <div className={cn('text-sm font-medium', isDark ? 'text-red-200' : 'text-red-800')}>
                            We could not complete this action
                          </div>
                          <div className={cn('mt-1 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                            {formError}
                          </div>
                          <div className={cn('mt-2 text-xs', isDark ? 'text-red-200/80' : 'text-red-700/80')}>
                            You can review existing patients first, then return here if needed.
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={handleGoToPatientSearch}
                        className={cn(
                          'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all sm:ml-4',
                          isDark
                            ? 'border-red-300/20 bg-red-950/30 text-red-100 hover:bg-red-950/50'
                            : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                        )}
                      >
                        <Search className="h-4 w-4" />
                        Search patients
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>{renderConflictCard}</AnimatePresence>

              <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
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
                  icon={<User className="h-4 w-4" />}
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
                  icon={<User className="h-4 w-4" />}
                />

                <FormInput
                  theme={theme}
                  label="Email (optional if phone is provided)"
                  value={form.email ?? ''}
                  onChange={(value) => handleFieldChange('email', value)}
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
                  onChange={(value) => handleFieldChange('phone', value)}
                  error={validation.errors.phone?.[0]}
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
                        validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex')
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
                        handleFieldChange(
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
                        validation.errors.biological_sex?.[0] &&
                          touchedFields.has('biological_sex') &&
                          (isDark
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-red-300 focus:border-red-500 focus:ring-red-500/10'),
                        isSubmitting && 'cursor-not-allowed opacity-50'
                      )}
                      aria-invalid={!!validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex')}
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
                    {validation.errors.biological_sex?.[0] && touchedFields.has('biological_sex') && (
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
                        {validation.errors.biological_sex[0]}
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

              <div className="flex flex-col gap-3 sm:flex-row">
                {onCancel && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1',
                      isDark
                        ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600'
                        : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200'
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => void submit()}
                  disabled={!isFormValid || isSubmitting || !!conflict}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',  onCancel ? 'sm:flex-1' : '',
                    isDark
                      ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                      : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Create Patient
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
};

PatientCreate.displayName = 'PatientCreate';

export default PatientCreate;