import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { UserPlus, AlertCircle, CheckCircle, Copy, Download, X } from 'lucide-react';
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
  DuplicateAction,
  ExistingUserAction,
  formatPatientName,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { useCreatePatientByStaff } from '../../../../api/dispensing/patient-search/usePatientQueries';

type Theme = 'light' | 'dark';

export interface PatientCreateProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  initialValues?: Partial<CreatePatientRequest>;
  onCreated?: (patient: PatientSearchResult) => void;
  onCancel?: () => void;
  className?: string;
}

// Utility function to extract error messages with proper type safety
function errorToMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  
  // Handle AxiosError
  if (typeof error === 'object' && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const apiMsg = axiosErr.response?.data?.message;
    
    if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) {
      return apiMsg;
    }
    
    // Check for validation errors
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
    
    // Fallback to status-based messages
    if (axiosErr.response?.status === 409) {
      return 'A conflicting patient or user record already exists';
    }
    
    if (axiosErr.response?.status === 422) {
      return 'Please check your input and try again';
    }
    
    if (axiosErr.response?.status === 500) {
      return 'Server error occurred while creating patient';
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  
  return 'Failed to create patient. Please try again.';
}

interface PatientNumberModalProps {
  theme: Theme;
  patientNumber: string;
  patientName: string;
  onProceed: () => void;
  onClose?: () => void;
}

const PatientNumberModal: React.FC<PatientNumberModalProps> = ({ 
  theme, 
  patientNumber, 
  patientName, 
  onProceed,
  onClose 
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  // Cleanup timer on unmount
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
      
      // Clear previous timer
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      
      // Reset copied state after 3 seconds
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
    } catch (err) {
        console.log(err);
      // Fallback for older browsers
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
        console.log(fallbackErr);
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
        console.log(err);
      showToast('error', 'Failed to download patient details', 3000);
    }
  }, [patientName, patientNumber, showToast]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-success-modal-title"
    >
      <div className={cn('relative w-full max-w-md rounded-2xl shadow-2xl', isDark ? 'bg-gray-800' : 'bg-white')}>
        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'absolute top-4 right-4 p-2 rounded-full transition-colors',
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            )}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Success Icon */}
        <div className="flex flex-col items-center p-8">
          <div 
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4',
              isDark ? 'bg-green-900/30' : 'bg-green-100'
            )}
            role="img"
            aria-label="Success"
          >
            <CheckCircle className={cn('w-12 h-12', isDark ? 'text-green-400' : 'text-green-600')} />
          </div>

          <h2 
            id="patient-success-modal-title"
            className={cn('text-2xl font-bold mb-2 text-center', isDark ? 'text-white' : 'text-gray-900')}
          >
            Patient Created Successfully
          </h2>
          <p className={cn('text-center mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Please provide this patient number to the patient
          </p>

          {/* Patient Details */}
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
                  'font-mono text-sm p-4 rounded-lg break-all select-text',
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
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!patientNumber}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
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
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
                aria-label="Download patient details"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>

            <button
              type="button"
              onClick={onProceed}
              className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Proceed to next step"
            >
              Proceed
            </button>
          </div>

          <p className={cn('text-xs text-center mt-4', isDark ? 'text-gray-500' : 'text-gray-500')}>
            ⚠️ Important: Ensure patient receives this number for future visits
          </p>
        </div>
      </div>
    </div>
  );
};

PatientNumberModal.displayName = 'PatientNumberModal';

// Type for conflict resolution state
type ConflictType = 'duplicate' | 'existing_user' | null;

interface ConflictState {
  type: ConflictType;
  data: {
    duplicatePatient?: PatientSearchResult;
    existingUserGlobalId?: string;
  };
  originalData: CreatePatientRequest;
}

// Memoized form input component to prevent unnecessary re-renders
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
}) => {
  const isDark = theme === 'dark';
  const inputId = React.useId();

  return (
    <div>
      <label 
        htmlFor={inputId}
        className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}
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
          'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors',
          isDark 
            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
          error && (isDark ? 'border-red-500' : 'border-red-300')
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

const PatientCreate: React.FC<PatientCreateProps> = ({ 
  theme, 
  title = 'Create New Patient', 
  subtitle = 'Enter patient details to create a new record', 
  initialValues, 
  onCreated, 
  onCancel, 
  className 
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  
  const [form, setForm] = useState<Partial<CreatePatientRequest>>({
    first_name: initialValues?.first_name ?? '',
    last_name: initialValues?.last_name ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    date_of_birth: initialValues?.date_of_birth ?? '',
    biological_sex: initialValues?.biological_sex ?? BiologicalSex.UNKNOWN,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<PatientSearchResult | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  
  // Store the last submitted data for conflict resolution
  const lastSubmittedDataRef = useRef<CreatePatientRequest | null>(null);

  const validation = useMemo(() => validatePatientFormData(form), [form]);

  // Reset conflict state when form changes
//   useEffect(() => {
//     if (conflict) {
//       setConflict(null);
//     }
//   }, [form]);

  // Create a ref for the mutate function to avoid circular dependency
  const mutateRef = useRef<((data: CreatePatientRequest) => void) | null>(null);

  // Define the mutation first with a ref to handle conflict resolution
  const createMutation = useCreatePatientByStaff({
    onSuccess: async (response, variables) => {
      if (response.success && response.data) {
        // Successful creation
        setCreatedPatient(response.data);
        setShowSuccessModal(true);
        lastSubmittedDataRef.current = null;
      } else if (isPatientCreateConflictResponse(response)) {
        // Store conflict and attempt resolution
        setConflict({
          type: isPossibleDuplicateResponse(response) ? 'duplicate' : 'existing_user',
          data: {
            duplicatePatient: response.meta.possible_duplicate ?? undefined,
            existingUserGlobalId: response.meta.existing_user_global_user_uuid,
          },
          originalData: variables,
        });
        
        // Attempt automatic resolution
        const resolved = await handleConflictResolution(response, variables);
        if (!resolved) {
          // User cancelled conflict resolution
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
      
      // Clear any existing conflict
      setConflict(null);
    },
  });

  // Update the ref when mutation changes
  useEffect(() => {
    mutateRef.current = createMutation.mutate;
  }, [createMutation.mutate]);

  const isSubmitting = createMutation.isPending;

  // Define handleConflictResolution AFTER createMutation is declared
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

  const setField = useCallback(<K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K]) => {
    setForm(prev => {
      const newForm = { ...prev, [key]: value };
      return newForm;
    });
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    // Validate form
    const v = validatePatientFormData(form);
    if (!v.isValid) {
      const firstKey = Object.keys(v.errors)[0] as keyof typeof v.errors | undefined;
      const firstMsg = firstKey ? v.errors[firstKey]?.[0] : 'Please correct the form errors.';
      setFormError(firstMsg ?? 'Please correct the form errors.');
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('[aria-invalid="true"]');
        firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      return;
    }

    // Confirm before submission
    const ok = await confirm({
      title: 'Confirm Patient Creation',
      message: 'You are about to create a new patient record. Continue?',
      confirmText: 'Create Patient',
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

    // Store for potential conflict resolution
    lastSubmittedDataRef.current = payload;
    
    createMutation.mutate(payload);
  }, [confirm, createMutation, form, theme]);

  const handleProceed = useCallback(() => {
    if (createdPatient) {
      setShowSuccessModal(false);
      onCreated?.(createdPatient);
    }
  }, [createdPatient, onCreated]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle conflict resolution retry
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

  // Render conflict UI if needed
  const renderConflictUI = useMemo(() => {
    if (!conflict) return null;

    if (conflict.type === 'duplicate' && conflict.data.duplicatePatient) {
      const duplicate = conflict.data.duplicatePatient;
      return (
        <div className={cn('rounded-lg border p-4 mb-6', isDark ? 'bg-yellow-900/10 border-yellow-800' : 'bg-yellow-50 border-yellow-200')}>
          <div className="flex gap-3 items-start">
            <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
            <div className="flex-1">
              <h4 className={cn('font-semibold mb-2', isDark ? 'text-yellow-300' : 'text-yellow-800')}>
                Possible Duplicate Found
              </h4>
              <p className={cn('text-sm mb-3', isDark ? 'text-yellow-400' : 'text-yellow-700')}>
                A similar patient already exists in the system:
              </p>
              <div className={cn('text-sm p-3 rounded-lg mb-3', isDark ? 'bg-gray-800/50' : 'bg-gray-100')}>
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
            <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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

            {/* Form Error */}
            {formError && (
              <div className={cn(
                'rounded-lg border p-4 mb-6 flex gap-3 items-start',
                isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'
              )}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>
                  {formError}
                </div>
              </div>
            )}

            {/* Mutation Error */}
            {createMutation.isError && !formError && (
              <div className={cn(
                'rounded-lg border p-4 mb-6 flex gap-3 items-start',
                isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'
              )}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-600')}>
                  {errorToMessage(createMutation.error)}
                </div>
              </div>
            )}

            {/* Conflict UI */}
            {renderConflictUI}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <FormInput
                theme={theme}
                label="First Name *"
                value={form.first_name ?? ''}
                onChange={(value) => setField('first_name', value)}
                error={validation.errors.first_name?.[0]}
                disabled={isSubmitting}
                required
                placeholder="Enter first name"
              />

              <FormInput
                theme={theme}
                label="Last Name *"
                value={form.last_name ?? ''}
                onChange={(value) => setField('last_name', value)}
                error={validation.errors.last_name?.[0]}
                disabled={isSubmitting}
                required
                placeholder="Enter last name"
              />

              <FormInput
                theme={theme}
                label="Email (optional if phone provided)"
                value={form.email ?? ''}
                onChange={(value) => setField('email', value)}
                error={validation.errors.email?.[0]}
                disabled={isSubmitting}
                type="email"
                placeholder="patient@example.com"
              />

              <FormInput
                theme={theme}
                label="Phone (optional if email provided)"
                value={form.phone ?? ''}
                onChange={(value) => setField('phone', value)}
                disabled={isSubmitting}
                type="tel"
                placeholder="+1 (555) 123-4567"
              />

              <FormInput
                theme={theme}
                label="Date of Birth *"
                value={form.date_of_birth ?? ''}
                onChange={(value) => setField('date_of_birth', value)}
                error={validation.errors.date_of_birth?.[0]}
                disabled={isSubmitting}
                type="date"
                required
              />

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Biological Sex *
                </label>
                <select
                  value={form.biological_sex ?? BiologicalSex.UNKNOWN}
                  onChange={(e) => setField('biological_sex', e.target.value as BiologicalSex)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors',
                    isDark 
                      ? 'bg-gray-900 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900',
                    validation.errors.biological_sex?.[0] && (isDark ? 'border-red-500' : 'border-red-300')
                  )}
                  aria-invalid={!!validation.errors.biological_sex?.[0]}
                >
                  <option value={BiologicalSex.UNKNOWN}>Unknown</option>
                  <option value={BiologicalSex.MALE}>Male</option>
                  <option value={BiologicalSex.FEMALE}>Female</option>
                  <option value={BiologicalSex.INTERSEX}>Intersex</option>
                </select>
                {validation.errors.biological_sex?.[0] && (
                  <p className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>
                    {validation.errors.biological_sex[0]}
                  </p>
                )}
              </div>
            </div>

            {/* Contact validation error */}
            {validation.errors.contact?.[0] && (
              <div className={cn('text-sm mb-4', isDark ? 'text-red-300' : 'text-red-600')}>
                {validation.errors.contact[0]}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
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
                disabled={!validation.isValid || isSubmitting || !!conflict}
                className={cn(
                  'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
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
        <PatientNumberModal
          theme={theme}
          patientNumber={createdPatient.patient_number}
          patientName={formatPatientName(createdPatient)}
          onProceed={handleProceed}
          onClose={handleSuccessModalClose}
        />
      )}
    </>
  );
};

PatientCreate.displayName = 'PatientCreate';

export default PatientCreate;